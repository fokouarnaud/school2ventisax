"""Import idempotent du contenu versionné (manifeste JSON + fichiers Markdown fr/en + questions JSON)."""
import json
from pathlib import Path

from django.db import transaction

from assessments.models import Question

from .models import Formation, Module, Partie, Section

LANGS = ("fr", "en")


def _translated(data, field):
    values = data.get(field) or {}
    return {f"{field}_{lang}": values.get(lang, "") for lang in LANGS}


def _read(path):
    return path.read_text(encoding="utf-8") if path.exists() else ""


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


@transaction.atomic
def import_formation(manifest_path):
    manifest_path = Path(manifest_path)
    root = manifest_path.parent
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    stats = {"sections": 0, "questions": 0}
    formation, _ = Formation.objects.update_or_create(
        slug=data["slug"], defaults={**_translated(data, "title"), **_translated(data, "description")}
    )
    for partie_data in data.get("parties", []):
        partie, _ = Partie.objects.update_or_create(
            formation=formation, slug=partie_data["slug"],
            defaults={"order": partie_data.get("order", 0), **_translated(partie_data, "title")},
        )
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
                bodies = {f"body_md_{lang}": _read(module_dir / f"{section_data['file']}.{lang}.md") for lang in LANGS}
                Section.objects.update_or_create(
                    module=module, order=section_data["order"],
                    defaults={"kind": section_data.get("kind", Section.Kind.CONTENT), **_translated(section_data, "title"), **bodies},
                )
                stats["sections"] += 1
            _import_questions(module, module_dir / "questions.json", stats)
    return stats
