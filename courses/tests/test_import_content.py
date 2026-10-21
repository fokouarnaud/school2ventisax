import io
import json

import pytest
from django.core.management import CommandError, call_command

from assessments.models import Question
from assessments.models import Assessment
from courses.models import Formation, Module, Partie, Section

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


def edit_manifest(content_dir, change):
    path = content_dir / "formation.json"
    manifest = json.loads(path.read_text(encoding="utf-8"))
    change(manifest)
    path.write_text(json.dumps(manifest), encoding="utf-8")


def first_section(manifest):
    return manifest["parties"][0]["modules"][0]["sections"][0]


@pytest.mark.django_db
def test_import_marks_a_section_written_beyond_the_handout_as_a_supplement(content_dir):
    edit_manifest(content_dir, lambda m: first_section(m).update(supplement=True))
    run_import(content_dir)
    assert Section.objects.get().is_supplement is True


@pytest.mark.django_db
def test_import_clears_the_supplement_mark_when_it_is_removed(content_dir):
    edit_manifest(content_dir, lambda m: first_section(m).update(supplement=True))
    run_import(content_dir)
    edit_manifest(content_dir, lambda m: first_section(m).pop("supplement"))
    run_import(content_dir)
    assert Section.objects.get().is_supplement is False


@pytest.mark.django_db
def test_import_refuses_a_practical_section_marked_as_a_supplement(content_dir):
    edit_manifest(content_dir, lambda m: first_section(m).update(kind="practical", supplement=True))
    with pytest.raises(CommandError, match="01-introduction"):
        run_import(content_dir)
    assert not Section.objects.exists()


@pytest.mark.django_db
def test_import_applies_the_exam_questions_per_module_of_the_manifest(content_dir):
    edit_manifest(content_dir, lambda m: m["parties"][0].update(exam={"questions_per_module": 5}))
    run_import(content_dir)
    assert Assessment.exam_for(Partie.objects.get()).questions_per_module == 5


@pytest.mark.django_db
def test_import_keeps_the_exam_setting_when_the_manifest_has_none(content_dir):
    run_import(content_dir)
    exam = Assessment.exam_for(Partie.objects.get())
    exam.questions_per_module = 7
    exam.save()
    run_import(content_dir)
    exam.refresh_from_db()
    assert exam.questions_per_module == 7


@pytest.mark.django_db
def test_import_refuses_an_exam_without_any_question_per_module(content_dir):
    edit_manifest(content_dir, lambda m: m["parties"][0].update(exam={"questions_per_module": 0}))
    with pytest.raises(CommandError, match="questions_per_module"):
        run_import(content_dir)


def write_questions(content_dir, questions):
    (content_dir / "p1" / "m1" / "questions.json").write_text(json.dumps(questions), encoding="utf-8")


@pytest.mark.django_db
def test_import_with_publish_publishes_questions_reviewed_in_both_languages(content_dir):
    call_command("import_content", str(content_dir / "formation.json"), "--publish", verbosity=0)
    assert Question.objects.get().status == Question.Status.PUBLISHED


@pytest.mark.django_db
def test_import_with_publish_leaves_unreviewed_questions_as_drafts(content_dir):
    write_questions(content_dir, [{**QUESTION, "reviewed": {"fr": True, "en": False}}])
    call_command("import_content", str(content_dir / "formation.json"), "--publish", verbosity=0)
    assert Question.objects.get().status == Question.Status.DRAFT


@pytest.mark.django_db
def test_import_with_publish_lists_reviewed_questions_it_refuses(content_dir):
    two_right_answers = [{**c, "correct": True} for c in QUESTION["choices"]]
    write_questions(content_dir, [{**QUESTION, "choices": two_right_answers}])
    out = io.StringIO()
    call_command("import_content", str(content_dir / "formation.json"), "--publish", stdout=out)
    assert Question.objects.get().status == Question.Status.DRAFT
    assert "p1-m1-q01" in out.getvalue()


PLAIN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>'


def add_image(content_dir, name, content=PLAIN_SVG):
    img_dir = content_dir / "p1" / "m1" / "img"
    img_dir.mkdir(exist_ok=True)
    (img_dir / name).write_text(content, encoding="utf-8")


def write_body(content_dir, text):
    for lang in ("fr", "en"):
        (content_dir / "p1" / "m1" / f"01-introduction.{lang}.md").write_text(text, encoding="utf-8")


@pytest.mark.django_db
def test_import_points_relative_images_to_the_course_static_files(content_dir):
    add_image(content_dir, "simple-allumage.svg")
    write_body(content_dir, "![Schéma développé](img/simple-allumage.svg)")
    run_import(content_dir)
    assert Section.objects.get().body_md_fr == "![Schéma développé](cours/froid/p1/m1/img/simple-allumage.svg)"


@pytest.mark.django_db
def test_import_refuses_a_missing_image(content_dir):
    write_body(content_dir, "![Schéma](img/absent.svg)")
    with pytest.raises(CommandError, match="absent.svg"):
        run_import(content_dir)


@pytest.mark.django_db
def test_import_refuses_an_active_svg(content_dir):
    add_image(content_dir, "piege.svg", '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
    write_body(content_dir, "![Schéma](img/piege.svg)")
    with pytest.raises(CommandError, match="piege.svg"):
        run_import(content_dir)


@pytest.mark.django_db
def test_reimport_removes_sections_dropped_from_the_manifest(content_dir):
    """Sinon une section orpheline, jamais vue, empêche de terminer le module et de débloquer l'examen."""
    edit_manifest(content_dir, lambda m: m["parties"][0]["modules"][0]["sections"].append(
        {"order": 2, "file": "02-brouillon", "kind": "content", "title": {"fr": "Brouillon", "en": "Draft"}}
    ))
    run_import(content_dir)
    assert Section.objects.count() == 2
    edit_manifest(content_dir, lambda m: m["parties"][0]["modules"][0]["sections"].pop())
    run_import(content_dir)
    assert [s.title_fr for s in Section.objects.all()] == ["Introduction"]
