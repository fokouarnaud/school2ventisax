import pytest
from django.utils import translation

from courses.models import Formation, Module, Partie, Section


@pytest.fixture
def module():
    formation = Formation.objects.create(title_fr="Froid et climatisation", slug="froid")
    partie = Partie.objects.create(formation=formation, title_fr="Habilitation et sécurité", order=1, slug="p1")
    return Module.objects.create(partie=partie, title_fr="Sécurité dans les travaux", order=1, duration_hours=8)


@pytest.mark.django_db
def test_sections_are_listed_in_their_teaching_order(module):
    Section.objects.create(module=module, title_fr="Études de cas", order=2, body_md_fr="...")
    Section.objects.create(module=module, title_fr="Introduction", order=1, body_md_fr="...")
    assert [s.title_fr for s in module.sections.all()] == ["Introduction", "Études de cas"]


@pytest.mark.django_db
def test_untranslated_title_falls_back_to_french_in_english(module):
    with translation.override("en"):
        assert Module.objects.get(pk=module.pk).title == "Sécurité dans les travaux"


@pytest.mark.django_db
def test_translated_title_is_used_in_english(module):
    module.title_en = "Safety at work"
    module.save()
    with translation.override("en"):
        assert Module.objects.get(pk=module.pk).title == "Safety at work"


@pytest.mark.django_db
def test_practical_sections_are_separated_from_content_sections(module):
    Section.objects.create(module=module, title_fr="Cours", order=1, body_md_fr="...")
    Section.objects.create(module=module, title_fr="TAF", order=2, body_md_fr="...", kind=Section.Kind.PRACTICAL)
    assert [s.title_fr for s in module.sections.practical()] == ["TAF"]
