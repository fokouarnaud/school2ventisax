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
    response = client.get(f"/fr/modules/{module.public_id}/")
    assert response.status_code == 200
    assert [(row["section"], row["viewed"]) for row in response.context["sections"]] == [
        (sections[0], True),
        (sections[1], False),
    ]


@pytest.mark.django_db
def test_opening_a_section_marks_it_viewed(client, enrolled, sections):
    client.force_login(enrolled)
    response = client.get(f"/fr/sections/{sections[0].public_id}/")
    assert response.status_code == 200
    assert SectionView.objects.filter(user=enrolled, section=sections[0]).exists()


@pytest.mark.django_db
def test_section_markdown_is_rendered_as_html(client, enrolled, sections):
    client.force_login(enrolled)
    response = client.get(f"/fr/sections/{sections[0].public_id}/")
    assert "Le <strong>courant</strong> tue." in response.content.decode()


@pytest.mark.django_db
def test_section_links_to_previous_and_next_sections(client, enrolled, sections):
    client.force_login(enrolled)
    response = client.get(f"/fr/sections/{sections[0].public_id}/")
    assert response.context["previous"] is None
    assert response.context["next"] == sections[1]


@pytest.mark.django_db
def test_section_from_another_formation_is_not_found(client, enrolled, foreign_section):
    client.force_login(enrolled)
    assert client.get(f"/fr/sections/{foreign_section.public_id}/").status_code == 404
    assert not SectionView.objects.filter(user=enrolled).exists()


@pytest.mark.django_db
def test_module_from_another_formation_is_not_found(client, enrolled, foreign_section):
    client.force_login(enrolled)
    assert client.get(f"/fr/modules/{foreign_section.module.public_id}/").status_code == 404


@pytest.mark.django_db
def test_anonymous_visitor_cannot_read_a_section(client, sections):
    response = client.get(f"/fr/sections/{sections[0].public_id}/")
    assert response.status_code == 302


@pytest.mark.django_db
def test_practical_section_offers_its_annexes_for_download(client, enrolled, sections, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    annexe = Annexe(section=sections[1], title_fr="Fiche d'intervention")
    annexe.file.save("fiche.xlsx", ContentFile(b"data"))
    client.force_login(enrolled)
    response = client.get(f"/fr/sections/{sections[1].public_id}/")
    assert annexe.file.url in response.content.decode()


@pytest.mark.django_db
def test_untranslated_section_is_flagged_as_french_fallback_in_english(client, enrolled, sections):
    client.force_login(enrolled)
    response = client.get(f"/en/sections/{sections[0].public_id}/")
    assert response.context["fallback_fr"] is True
    assert "Le <strong>courant</strong> tue." in response.content.decode()


@pytest.mark.django_db
def test_translated_section_is_not_flagged_in_english(client, enrolled, sections):
    sections[0].body_md_en = "Current **kills**."
    sections[0].save()
    client.force_login(enrolled)
    response = client.get(f"/en/sections/{sections[0].public_id}/")
    assert response.context["fallback_fr"] is False


@pytest.fixture
def supplement(module):
    return Section.objects.create(
        module=module, title_fr="Bilan de puissance", order=3, body_md_fr="Rédigé.", is_supplement=True
    )


@pytest.mark.django_db
@pytest.mark.parametrize("lang, label", [("fr", "Complément"), ("en", "Supplement")])
def test_a_supplement_section_carries_its_badge(client, enrolled, supplement, lang, label):
    client.force_login(enrolled)
    page = client.get(f"/{lang}/sections/{supplement.public_id}/").content.decode()
    assert f'<span class="badge badge-supplement"' in page
    assert f">{label}</span>" in page


@pytest.mark.django_db
def test_the_module_page_flags_supplement_sections(client, enrolled, module, sections, supplement):
    client.force_login(enrolled)
    page = client.get(f"/fr/modules/{module.public_id}/").content.decode()
    assert page.count(">Complément</span>") == 1


@pytest.mark.django_db
def test_a_transcribed_section_has_no_supplement_badge(client, enrolled, sections):
    client.force_login(enrolled)
    page = client.get(f"/fr/sections/{sections[0].public_id}/").content.decode()
    assert "badge-supplement" not in page


TAF = """**TAF** : réaliser le câblage sécurisé d'un simple allumage sur planche.

### Matériel
- Disjoncteur 10 A

### Séquence de réalisation
1. Fixer les appareillages
2. Câbler

**Temps de réalisation estimé** : 2 heures.

### Éléments d'évaluation
- Solidité des fixations
"""


@pytest.mark.django_db
def test_a_practical_activity_shows_its_instructions_sequence_and_criteria(client, enrolled, module):
    taf = Section.objects.create(module=module, title_fr="Activité pratique", order=9, kind=Section.Kind.PRACTICAL, body_md_fr=TAF)
    client.force_login(enrolled)
    page = client.get(f"/fr/sections/{taf.public_id}/").content.decode()
    assert '<span class="badge badge-warn">Activité pratique</span>' in page
    assert "<h3>Séquence de réalisation</h3>" in page
    assert "<ol>\n<li>Fixer les appareillages</li>" in page
    assert "<h3>Éléments d'évaluation</h3>" in page


@pytest.mark.django_db
def test_the_outline_marks_the_practical_activity_of_the_module(client, enrolled, sections):
    client.force_login(enrolled)
    page = client.get(f"/fr/sections/{sections[0].public_id}/").content.decode()
    outline = page.split('id="sommaire"')[1].split("</details>")[0]
    assert outline.count('class="badge badge-warn"') == 1
    assert ">Pratique</span>" in outline
