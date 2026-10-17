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
