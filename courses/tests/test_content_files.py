"""Garde-fou du contenu versionné : tout texte destiné aux apprenants existe en français ET en anglais."""
import json
import re

import pytest
from django.conf import settings
from django.core.management import call_command

from assessments.models import Question
from config.uploads import ACTIVE_SVG
from courses.models import Module, Section

CONTENT = settings.BASE_DIR / "content" / "froid"
LANGS = ("fr", "en")


def manifest():
    return json.loads((CONTENT / "formation.json").read_text(encoding="utf-8"))


def assert_bilingual(data, field, where):
    values = data.get(field) or {}
    for lang in LANGS:
        assert (values.get(lang) or "").strip(), f"{where} : {field}.{lang} manquant"


def iter_modules():
    for partie in manifest()["parties"]:
        for module in partie["modules"]:
            yield partie, module


def test_formation_parts_and_modules_are_bilingual():
    data = manifest()
    assert_bilingual(data, "title", "formation")
    for partie, module in iter_modules():
        assert_bilingual(partie, "title", partie["slug"])
        assert_bilingual(module, "title", module["dir"])


def test_every_section_has_a_french_and_an_english_text_file():
    for _, module in iter_modules():
        for section in module["sections"]:
            assert_bilingual(section, "title", f"{module['dir']}/{section['file']}")
            for lang in LANGS:
                path = CONTENT / module["dir"] / f"{section['file']}.{lang}.md"
                assert path.exists() and path.read_text(encoding="utf-8").strip(), f"{path} manquant ou vide"


def test_every_question_choice_and_explanation_is_bilingual():
    ids = set()
    for _, module in iter_modules():
        path = CONTENT / module["dir"] / "questions.json"
        if not path.exists():
            continue
        for q in json.loads(path.read_text(encoding="utf-8")):
            assert q["id"] not in ids, f"identifiant en double : {q['id']}"
            ids.add(q["id"])
            assert_bilingual(q, "prompt", q["id"])
            assert_bilingual(q, "explanation", q["id"])
            for i, choice in enumerate(q["choices"]):
                assert_bilingual(choice, "text", f"{q['id']} choix {i}")
    assert ids, "aucune question"


@pytest.mark.django_db
def test_versioned_content_imports_with_english_everywhere():
    call_command("import_content", str(CONTENT / "formation.json"), verbosity=0)
    assert Module.objects.exists()
    assert not Module.objects.filter(title_en="").exists()
    assert not Section.objects.filter(body_md_en="").exists()
    assert not Question.objects.filter(prompt_en="").exists()
    assert not Question.objects.filter(explanation_en="").exists()


def test_every_markdown_file_is_referenced_by_the_manifest():
    referenced = set()
    for _, module in iter_modules():
        for section in module["sections"]:
            for lang in LANGS:
                referenced.add((CONTENT / module["dir"] / f"{section['file']}.{lang}.md").resolve())
    # CORRECTIONS.md : journal des corrections pour le formateur, jamais servi à l'apprenant (Q29).
    on_disk = {p.resolve() for p in CONTENT.rglob("*.md") if p.name != "CORRECTIONS.md"}
    assert sorted(str(p) for p in on_disk - referenced) == []


def questions_by_module():
    for _, module in iter_modules():
        path = CONTENT / module["dir"] / "questions.json"
        yield module, (json.loads(path.read_text(encoding="utf-8")) if path.exists() else [])


def test_every_question_cites_an_existing_section_of_its_module():
    for module, questions in questions_by_module():
        files = {s["file"] for s in module["sections"]}
        for q in questions:
            assert q.get("section") in files, f"{q['id']} : section {q.get('section')!r} inconnue dans {module['dir']}"


def test_every_content_section_is_covered_by_at_least_one_question():
    for module, questions in questions_by_module():
        cited = {q.get("section") for q in questions}
        missing = [s["file"] for s in module["sections"] if s["kind"] == "content" and s["file"] not in cited]
        assert missing == [], f"{module['dir']} : sections sans question {missing}"


def test_every_module_has_enough_quiz_and_exam_questions():
    for module, questions in questions_by_module():
        quiz = sum(q["usage"] == "quiz" for q in questions)
        exam = sum(q["usage"] == "exam" for q in questions)
        assert quiz >= 4 and exam >= 4, f"{module['dir']} : {quiz} quiz, {exam} examen"


def test_review_flags_are_explicit_for_both_languages():
    """Relecture approuvée par le formateur le 2026-10-17 ; toute nouvelle question entre avec false/false."""
    for _, questions in questions_by_module():
        for q in questions:
            assert set(q["reviewed"]) == {"fr", "en"}, q["id"]
            assert all(isinstance(v, bool) for v in q["reviewed"].values()), q["id"]


@pytest.mark.django_db
def test_imported_reviewed_questions_need_only_the_trainer_publish_step():
    call_command("import_content", str(CONTENT / "formation.json"), verbosity=0)
    assert not Question.objects.published().exists()  # l'import ne publie jamais tout seul
    for question in Question.objects.filter(reviewed_fr=True, reviewed_en=True):
        question.publish()
    assert Question.objects.published().count() == Question.objects.count()


@pytest.mark.django_db
def test_every_question_is_publishable_once_reviewed():
    call_command("import_content", str(CONTENT / "formation.json"), verbosity=0)
    refused = []
    for question in Question.objects.all():
        question.reviewed_fr = question.reviewed_en = True  # simulate the trainer's review
        try:
            question.validate_for_publication()
        except Exception as exc:  # noqa: BLE001
            refused.append(f"{question.external_id}: {exc}")
    assert refused == []
    assert Question.objects.count() == sum(len(qs) for _, qs in questions_by_module())


# Schémas de cours (Q19 à Q28) : SVG inertes et légers, aucune photo en Partie 2, légendes bilingues.
IMAGE_LINK = re.compile(r"!\[([^\]]*)\]\(img/([^)\s]+)\)")
SVG_MAX_BYTES = 6 * 1024


def course_images():
    return sorted(p for p in CONTENT.rglob("img/*") if p.is_file())


def test_course_images_are_light_inert_svgs():
    for image in course_images():
        assert image.suffix == ".svg", f"{image} : seuls les SVG sont admis comme schémas"
        assert image.stat().st_size <= SVG_MAX_BYTES, f"{image} : {image.stat().st_size} octets (> 6 Ko)"
        assert not ACTIVE_SVG.search(image.read_bytes()), f"{image} : SVG actif"


def test_part_two_has_no_photo():
    photos = [p for p in (CONTENT / "p2").rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".pdf"}]
    assert photos == []


def test_every_diagram_stays_readable_on_a_360px_phone():
    """Guide de style (2026-10-29) : 420 de large au plus, sinon les repères tombent sous 8 px à 360 px."""
    for image in course_images():
        width = float(re.search(r'viewBox="0 0 ([\d.]+) ', image.read_text(encoding="utf-8")).group(1))
        assert width <= 420, f"{image.relative_to(CONTENT)} : {width} de large"


def test_every_french_only_diagram_has_its_english_twin():
    for image in course_images():
        if image.name.endswith(".fr.svg"):
            assert image.with_name(image.name.replace(".fr.svg", ".en.svg")).is_file(), image


def test_every_diagram_link_has_alt_text_and_an_existing_file():
    for md in CONTENT.rglob("*.md"):
        for alt, name in IMAGE_LINK.findall(md.read_text(encoding="utf-8")):
            assert alt.strip(), f"{md.name} : texte alternatif vide pour {name}"
            assert (md.parent / "img" / name).is_file(), f"{md.name} : {name} introuvable"


# Partie 2 « Les bases de l'électricité domestique » (Q17 à Q30, Definition of Done 11 à 14).
PART_TWO_MODULES = [
    "Notions de base en électricité, appareillages et outils de l'électricien",
    "Projet de création d'une installation électrique d'une nouvelle résidence",
    "Montage simple allumage",
    "Montage double allumage",
    "Montage va-et-vient",
    "Montage télérupteur",
    "Montage d'une minuterie",
    "Montage et réglage d'une horloge",
    "Câblage et réglage de l'interrupteur crépusculaire et du capteur de mouvement",  # Q31
]


def part_two():
    return next(p for p in manifest()["parties"] if p["slug"] == "p2")


def test_part_two_has_the_nine_modules_and_its_exam_setting():
    partie = part_two()
    assert [m["title"]["fr"] for m in partie["modules"]] == PART_TWO_MODULES
    assert partie["exam"] == {"questions_per_module": 5}


def test_every_part_two_module_has_one_practical_activity():
    for module in part_two()["modules"]:
        practical = [s for s in module["sections"] if s["kind"] == "practical"]
        assert len(practical) == 1, module["dir"]
        assert not practical[0].get("supplement"), module["dir"]


def test_part_two_bank_has_eight_reviewed_quiz_and_exam_questions_per_module():
    for module in part_two()["modules"]:
        questions = json.loads((CONTENT / module["dir"] / "questions.json").read_text(encoding="utf-8"))
        assert sum(q["usage"] == "quiz" for q in questions) >= 8, module["dir"]
        assert sum(q["usage"] == "exam" for q in questions) >= 8, module["dir"]
        assert all(q["reviewed"] == {"fr": True, "en": True} for q in questions), module["dir"]  # Q23


@pytest.mark.django_db
def test_part_two_exam_draws_forty_five_questions_five_per_module():
    import random
    from collections import Counter

    from assessments.models import Assessment
    from courses.models import Partie

    call_command("import_content", str(CONTENT / "formation.json"), publish=True, verbosity=0)
    exam = Assessment.exam_for(Partie.objects.get(slug="p2"))
    first = exam.question_pool(random.Random(1))
    assert len(first) == 45  # 9 modules × 5 (Q38)
    assert set(Counter(q.module_id for q in first).values()) == {5}
    assert {q.pk for q in first} != {q.pk for q in exam.question_pool(random.Random(2))}


CORRECTION_FIELDS = ("**Page**", "**Texte d'origine**", "**Correction**", "**Justification**")


def test_corrections_log_gives_page_original_text_correction_and_reason():
    log = (CONTENT / "p2" / "CORRECTIONS.md").read_text(encoding="utf-8")
    entries = log.split("\n## ")[1:]
    assert len(entries) >= 5
    for entry in entries:
        for field in CORRECTION_FIELDS:
            assert field in entry, f"{entry.splitlines()[0]} : {field} manquant"


def test_learner_text_never_mentions_the_corrections():
    for md in (CONTENT / "p2").rglob("*.md"):
        if md.name != "CORRECTIONS.md":
            text = md.read_text(encoding="utf-8").lower()
            assert "corrections.md" not in text and "erratum" not in text and "texte d'origine" not in text, md


def test_part_two_glossary_uses_iec_terms():
    glossary = (CONTENT / "p2" / "m1" / "01-glossaire.en.md").read_text(encoding="utf-8").lower()
    for term in ("one-way switching", "two-way switching", "impulse relay", "staircase timer", "time switch", "rcd", "mcb"):
        assert term in glossary, term
