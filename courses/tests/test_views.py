import pytest
from django.core.files.base import ContentFile

from courses.models import Annexe, Formation, Module, Partie, Section
from progress.models import SectionView


@pytest.fixture
def sections(module):
    return [
        Section.objects.create(module=module, title_fr="Introduction", order=1, body_md_fr="Le **courant** tue."),
        Section.objects.create(module=module, title_fr="TAF", order=2, kind=Section.Kind.PRACTICAL, body_md_fr="Simulez."),
    ]


@pytest.fixture
def foreign_section(db):
    other = Formation.objects.create(title_fr="Électronique", slug="elec")
    partie = Partie.objects.create(formation=other, title_fr="P", order=1, slug="p")
    module = Module.objects.create(partie=partie, title_fr="M", order=1)
    return Section.objects.create(module=module, title_fr="Secret", order=1)


@pytest.mark.django_db
def test_module_page_lists_sections_with_viewed_state(client, enrolled, module, sections):
    SectionView.objects.create(user=enrolled, section=sections[0])
    client.force_login(enrolled)
    response = client.get(f"/fr/modules/{module.pk}/")
    assert response.status_code == 200
    assert [(row["section"], row["viewed"]) for row in response.context["sections"]] == [
        (sections[0], True),
        (sections[1], False),
    ]


@pytest.mark.django_db
def test_opening_a_section_marks_it_viewed(client, enrolled, sections):
    client.force_login(enrolled)
    response = client.get(f"/fr/sections/{sections[0].pk}/")
    assert response.status_code == 200
    assert SectionView.objects.filter(user=enrolled, section=sections[0]).exists()


@pytest.mark.django_db
def test_section_markdown_is_rendered_as_html(client, enrolled, sections):
    client.force_login(enrolled)
    response = client.get(f"/fr/sections/{sections[0].pk}/")
    assert "Le <strong>courant</strong> tue." in response.content.decode()


@pytest.mark.django_db
def test_section_links_to_previous_and_next_sections(client, enrolled, sections):
    client.force_login(enrolled)
    response = client.get(f"/fr/sections/{sections[0].pk}/")
    assert response.context["previous"] is None
    assert response.context["next"] == sections[1]


@pytest.mark.django_db
def test_section_from_another_formation_is_not_found(client, enrolled, foreign_section):
    client.force_login(enrolled)
    assert client.get(f"/fr/sections/{foreign_section.pk}/").status_code == 404
    assert not SectionView.objects.filter(user=enrolled).exists()


@pytest.mark.django_db
def test_module_from_another_formation_is_not_found(client, enrolled, foreign_section):
    client.force_login(enrolled)
    assert client.get(f"/fr/modules/{foreign_section.module.pk}/").status_code == 404


@pytest.mark.django_db
def test_anonymous_visitor_cannot_read_a_section(client, sections):
    response = client.get(f"/fr/sections/{sections[0].pk}/")
    assert response.status_code == 302


@pytest.mark.django_db
def test_practical_section_offers_its_annexes_for_download(client, enrolled, sections, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    annexe = Annexe(section=sections[1], title_fr="Fiche d'intervention")
    annexe.file.save("fiche.xlsx", ContentFile(b"data"))
    client.force_login(enrolled)
    response = client.get(f"/fr/sections/{sections[1].pk}/")
    assert annexe.file.url in response.content.decode()


@pytest.mark.django_db
def test_untranslated_section_is_flagged_as_french_fallback_in_english(client, enrolled, sections):
    client.force_login(enrolled)
    response = client.get(f"/en/sections/{sections[0].pk}/")
    assert response.context["fallback_fr"] is True
    assert "Le <strong>courant</strong> tue." in response.content.decode()


@pytest.mark.django_db
def test_translated_section_is_not_flagged_in_english(client, enrolled, sections):
    sections[0].body_md_en = "Current **kills**."
    sections[0].save()
    client.force_login(enrolled)
    response = client.get(f"/en/sections/{sections[0].pk}/")
    assert response.context["fallback_fr"] is False
