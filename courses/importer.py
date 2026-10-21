"""Import idempotent du contenu versionné (manifeste JSON + fichiers Markdown fr/en + questions JSON)."""
import json
import re
from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.files import File
from django.db import transaction

from assessments.models import Assessment, Question
from config.uploads import validate_inert_svg

from .models import Formation, Module, Partie, Section

LANGS = ("fr", "en")
RELATIVE_IMAGE = re.compile(r"\]\(img/([^)\s]+)\)")
# Un nom de fichier seul, rangé dans img/ : ni sous-dossier ni « .. », seulement les formats de cours.
IMAGE_NAME = re.compile(r"[\w-]+(?:\.[\w-]+)*\.(?:svg|webp)", re.IGNORECASE)


class ContentError(ValueError):
    """Manifeste ou fichier de contenu incohérent : l'import est annulé."""


def _translated(data, field):
    values = data.get(field) or {}
    return {f"{field}_{lang}": values.get(lang, "") for lang in LANGS}


def _read(path):
    return path.read_text(encoding="utf-8") if path.exists() else ""


def _link_images(text, module_dir, static_dir):
    """img/x.svg (relatif au module) devient cours/<formation>/<module>/img/x.svg, servi en statique."""
    def link(match):
        if not IMAGE_NAME.fullmatch(match.group(1)):
            raise ContentError(f"Image refusée (un fichier .svg ou .webp directement dans img/) : {match.group(1)}")
        image = module_dir / "img" / match.group(1)
        if not image.is_file():
            raise ContentError(f"Image introuvable : {image}")
        with image.open("rb") as handle:
            try:
                validate_inert_svg(File(handle, name=image.name))
            except ValidationError as error:
                raise ContentError(f"{image.name} : {' '.join(error.messages)}") from error
        return f"](cours/{static_dir}/img/{match.group(1)})"

    return RELATIVE_IMAGE.sub(link, text)


def _question_signature(question):
    return (
        question.qtype, question.usage,
        question.prompt_fr, question.prompt_en, question.explanation_fr, question.explanation_en,
        tuple((c.text_fr, c.text_en, c.is_correct) for c in question.choices.all()),
    )


def _import_questions(module, path, stats):
    if not path.exists():
        return
    for data in json.loads(path.read_text(encoding="utf-8")):
        question = Question.objects.filter(external_id=data["id"]).first()
        before = _question_signature(question) if question else None
        question = question or Question(external_id=data["id"])
        question.module = module
        question.qtype = data.get("type", Question.Type.SINGLE)
        question.usage = data.get("usage", Question.Usage.QUIZ)
        for field, value in {**_translated(data, "prompt"), **_translated(data, "explanation")}.items():
            setattr(question, field, value)
        reviewed = data.get("reviewed") or {}
        question.reviewed_fr = bool(reviewed.get("fr"))
        question.reviewed_en = bool(reviewed.get("en"))
        question.save()
        existing = list(question.choices.all())
        for i, choice_data in enumerate(data.get("choices", [])):
            choice = existing[i] if i < len(existing) else question.choices.model(question=question)
            for field, value in _translated(choice_data, "text").items():
                setattr(choice, field, value)
            choice.is_correct = bool(choice_data.get("correct"))
            choice.order = i
            choice.save()
        for extra in existing[len(data.get("choices", [])):]:
            extra.delete()
        if before is not None and before != _question_signature(question):
            # Un texte modifié doit être relu à nouveau avant d'être servi.
            question.status = Question.Status.DRAFT
            question.save(update_fields=["status"])
        stats["questions"] += 1
        stats["imported"].append(question)


def _publish_reviewed(questions, stats):
    """Publie les questions relues fr et en ; les refus (choix incohérents) restent en brouillon."""
    for question in questions:
        if not (question.reviewed_fr and question.reviewed_en) or question.status == Question.Status.PUBLISHED:
            continue
        try:
            question.publish()
            stats["published"] += 1
        except ValidationError as error:
            stats["refused"].append(f"{question.external_id} : {' '.join(error.messages)}")


def _apply_exam_settings(partie, settings):
    if settings is None:
        return  # pas de clé « exam » : le réglage fait dans l'admin est gardé
    per_module = settings.get("questions_per_module")
    if not isinstance(per_module, int) or per_module < 1:
        raise ContentError(f"{partie.slug} : exam.questions_per_module doit être un entier ≥ 1.")
    exam = Assessment.exam_for(partie)
    exam.questions_per_module = per_module
    exam.save(update_fields=["questions_per_module"])


@transaction.atomic
def import_formation(manifest_path, publish=False):
    manifest_path = Path(manifest_path)
    root = manifest_path.parent
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    stats = {"sections": 0, "questions": 0, "imported": [], "published": 0, "refused": []}
    formation, _ = Formation.objects.update_or_create(
        slug=data["slug"], defaults={**_translated(data, "title"), **_translated(data, "description")}
    )
    for partie_data in data.get("parties", []):
        partie, _ = Partie.objects.update_or_create(
            formation=formation, slug=partie_data["slug"],
            defaults={"order": partie_data.get("order", 0), **_translated(partie_data, "title")},
        )
        _apply_exam_settings(partie, partie_data.get("exam"))
        for module_data in partie_data.get("modules", []):
            module, _ = Module.objects.update_or_create(
                partie=partie, order=module_data["order"],
                defaults={
                    "duration_hours": module_data.get("duration_hours", 0),
                    **_translated(module_data, "title"),
                    **_translated(module_data, "competence"),
                    **_translated(module_data, "evaluation_note"),
                },
            )
            module_dir = root / module_data.get("dir", "")
            for section_data in module_data.get("sections", []):
                static_dir = f"{formation.slug}/{module_data.get('dir', '')}"
                bodies = {
                    f"body_md_{lang}": _link_images(_read(module_dir / f"{section_data['file']}.{lang}.md"), module_dir, static_dir)
                    for lang in LANGS
                }
                kind = section_data.get("kind", Section.Kind.CONTENT)
                is_supplement = bool(section_data.get("supplement"))
                if is_supplement and kind == Section.Kind.PRACTICAL:
                    raise ContentError(f"{section_data['file']} : une activité pratique ne peut pas être un complément.")
                Section.objects.update_or_create(
                    module=module, order=section_data["order"],
                    defaults={"kind": kind, "is_supplement": is_supplement, **_translated(section_data, "title"), **bodies},
                )
                stats["sections"] += 1
            # Une section retirée du manifeste disparaît : jamais vue, elle bloquerait la fin du module.
            orders = [section_data["order"] for section_data in module_data.get("sections", [])]
            module.sections.exclude(order__in=orders).delete()
            _import_questions(module, module_dir / "questions.json", stats)
    if publish:
        _publish_reviewed(stats["imported"], stats)
    return stats
