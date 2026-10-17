"""Garde-fou du contenu versionné : tout texte destiné aux apprenants existe en français ET en anglais."""
import json

import pytest
from django.conf import settings
from django.core.management import call_command

from assessments.models import Question
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
    on_disk = {p.resolve() for p in CONTENT.rglob("*.md")}
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
