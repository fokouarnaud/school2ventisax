import json

import pytest
from django.core.management import call_command

from assessments.models import Question
from courses.models import Formation, Module, Section

QUESTION = {
    "id": "p1-m1-q01",
    "type": "single",
    "usage": "quiz",
    "prompt": {"fr": "Quel EPI protège les yeux ?", "en": "Which PPE protects the eyes?"},
    "explanation": {"fr": "Les lunettes.", "en": "Goggles."},
    "reviewed": {"fr": True, "en": True},
    "choices": [
        {"text": {"fr": "Lunettes", "en": "Goggles"}, "correct": True},
        {"text": {"fr": "Gants", "en": "Gloves"}, "correct": False},
    ],
}


@pytest.fixture
def content_dir(tmp_path):
    module_dir = tmp_path / "p1" / "m1"
    module_dir.mkdir(parents=True)
    (module_dir / "01-introduction.fr.md").write_text("Le **courant** tue.", encoding="utf-8")
    (module_dir / "01-introduction.en.md").write_text("Current **kills**.", encoding="utf-8")
    (module_dir / "questions.json").write_text(json.dumps([QUESTION]), encoding="utf-8")
    manifest = {
        "slug": "froid",
        "title": {"fr": "Froid et climatisation", "en": "Refrigeration and air conditioning"},
        "parties": [{
            "slug": "p1",
            "order": 1,
            "title": {"fr": "Habilitation et sécurité", "en": "Safety qualification"},
            "modules": [{
                "order": 1,
                "dir": "p1/m1",
                "title": {"fr": "Sécurité dans les travaux", "en": "Safety at work"},
                "duration_hours": 8,
                "competence": {"fr": "Identifier les risques.", "en": "Identify risks."},
                "sections": [
                    {"order": 1, "file": "01-introduction", "kind": "content",
                     "title": {"fr": "Introduction", "en": "Introduction"}},
                ],
            }],
        }],
    }
    (tmp_path / "formation.json").write_text(json.dumps(manifest), encoding="utf-8")
    return tmp_path


def run_import(content_dir):
    call_command("import_content", str(content_dir / "formation.json"), verbosity=0)


@pytest.mark.django_db
def test_import_builds_the_bilingual_course_tree(content_dir):
    run_import(content_dir)
    module = Module.objects.get(partie__formation__slug="froid", order=1)
    assert module.title_en == "Safety at work"
    assert module.duration_hours == 8
    section = module.sections.get()
    assert section.body_md_fr == "Le **courant** tue."
    assert section.body_md_en == "Current **kills**."


@pytest.mark.django_db
def test_import_creates_questions_as_drafts_with_their_choices(content_dir):
    run_import(content_dir)
    question = Question.objects.get(external_id="p1-m1-q01")
    assert question.status == Question.Status.DRAFT
    assert question.prompt_en == "Which PPE protects the eyes?"
    assert [(c.text_fr, c.is_correct) for c in question.choices.all()] == [("Lunettes", True), ("Gants", False)]


@pytest.mark.django_db
def test_running_the_import_twice_creates_no_duplicates(content_dir):
    run_import(content_dir)
    run_import(content_dir)
    assert Formation.objects.count() == 1
    assert Section.objects.count() == 1
    assert Question.objects.count() == 1
    assert Question.objects.get().choices.count() == 2


@pytest.mark.django_db
def test_reimport_updates_changed_text(content_dir):
    run_import(content_dir)
    (content_dir / "p1" / "m1" / "01-introduction.fr.md").write_text("Texte corrigé.", encoding="utf-8")
    run_import(content_dir)
    assert Section.objects.get().body_md_fr == "Texte corrigé."


@pytest.mark.django_db
def test_reimport_keeps_a_published_question_published_when_unchanged(content_dir):
    run_import(content_dir)
    Question.objects.get().publish()
    run_import(content_dir)
    assert Question.objects.get().status == Question.Status.PUBLISHED


@pytest.mark.django_db
def test_reimport_sends_a_changed_published_question_back_to_draft(content_dir):
    run_import(content_dir)
    Question.objects.get().publish()
    changed = {**QUESTION, "prompt": {"fr": "Quel EPI protège la tête ?", "en": "Which PPE protects the head?"}}
    (content_dir / "p1" / "m1" / "questions.json").write_text(json.dumps([changed]), encoding="utf-8")
    run_import(content_dir)
    question = Question.objects.get()
    assert question.status == Question.Status.DRAFT
    assert question.prompt_fr == "Quel EPI protège la tête ?"


@pytest.mark.django_db
def test_missing_english_file_leaves_english_body_empty(content_dir):
    (content_dir / "p1" / "m1" / "01-introduction.en.md").unlink()
    run_import(content_dir)
    assert Section.objects.get().body_md_en in ("", None)
