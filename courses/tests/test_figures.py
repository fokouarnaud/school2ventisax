"""Figures interactives (skill anatomy) publiées dans les sections : marqueur Markdown, fichiers statiques, chargement à la demande."""
import re
from pathlib import Path

import pytest
from django.contrib.staticfiles import finders
from django.templatetags.static import static
from django.utils import translation

from courses.figures import FIGURES, figure_files
from courses.models import Section
from courses.rendering import render_markdown

CONTENT = Path(__file__).resolve().parents[2] / "content" / "froid"
# Chaque figure est publiée dans la ou les sections qu'elle illustre.
PUBLISHED = [
    ("relais", "p3/m2/03-commande"),
    ("relais-statique", "p3/m2/03-commande"),
    ("couplage", "p3/m1/03-couplage"),
    ("couplage", "p3/m3/01-prerequis"),  # « Couplage des moteurs asynchrones triphasés », prérequis du démarrage direct
    ("fractionne", "p3/m6/01-principe"),  # « Fonctionnement » : 1er temps, 2e temps
    ("reperage-fractionne", "p3/m6/02-reperage"),  # 50/50, 66/33 et plaques à bornes
    ("manifold-vide", "p4/m15/02-mode-operatoire"),  # tenue du vide : sec, humidité ou fuite
    ("flamme", "p4/m5/02-chalumeau-flamme"),  # allumer, recoller, régler
    ("brasage-azote", "p4/m7/02-mise-en-oeuvre"),  # azote avant la chauffe, jusqu'au refroidissement
    ("circuit-frigo", "p4/m8/03-etats"),  # état du fluide aux points 1 à 9
    ("enroulements", "p4/m9/01-monophases"),  # C, A, P à l'ohmmètre
    ("demarrage-compresseur", "p4/m10/02-ctp-condensateurs"),  # relais d'intensité : normal, K ouvert, K collé
    ("manifold-charge", "p4/m17/03-liquide-vapeur"),  # tare, phase, masse de la plaque
]


def test_a_figure_marker_becomes_a_placeholder_loaded_on_demand():
    with translation.override("fr"):
        html = render_markdown("Texte.\n\n[[figure:relais]]\n\nSuite.")
    assert 'class="live-figure"' in html
    assert 'data-figure="relais"' in html
    assert f'data-html="{static("acad/figures/relais.fr.html")}"' in html
    assert f'data-js="{static("acad/figures/relais.fr.js")}"' in html
    assert "<button" in html and 'type="button"' in html
    # rien n'est téléchargé tant que l'apprenant ne le demande pas : ni dessin ni script dans la page
    assert "<svg" not in html and "<script" not in html
    assert "[[figure" not in html


def test_the_placeholder_follows_the_interface_language():
    with translation.override("en"):
        html = render_markdown("[[figure:couplage]]")
    assert f'data-html="{static("acad/figures/couplage.en.html")}"' in html
    assert "Show the interactive figure" in html


def test_the_placeholder_announces_the_download_size():
    with translation.override("fr"):
        html = render_markdown("[[figure:relais-statique]]")
    assert re.search(r"\d+ Ko", html)


def test_an_unknown_figure_marker_is_dropped():
    html = render_markdown("[[figure:inconnue]]")
    assert "live-figure" not in html and "[[figure" not in html


def test_a_marker_cannot_inject_attributes_or_paths():
    for text in ('[[figure:relais" onmouseover="x]]', "[[figure:../../settings]]", "[[figure:Relais]]"):
        html = render_markdown(text)
        assert "live-figure" not in html
        assert "onmouseover" not in html.replace("&quot;", '"').split("<p>")[0]
        assert not re.search(r"\son[a-z]+=", html)


def test_a_marker_inside_a_sentence_is_not_a_figure():
    assert "live-figure" not in render_markdown("Voir [[figure:relais]] plus haut.")


@pytest.mark.parametrize("name", sorted(FIGURES))
def test_every_registered_figure_has_its_files(name):
    for lang in ("fr", "en"):
        for path in figure_files(name, lang):
            assert finders.find(path), path


@pytest.mark.parametrize("name", sorted(FIGURES))
def test_figure_fragments_respect_the_content_security_policy(name):
    for lang in ("fr", "en"):
        html = Path(finders.find(f"acad/figures/{name}.{lang}.html")).read_text(encoding="utf-8")
        assert "<script" not in html.lower()
        assert not re.search(r"\son[a-z]+\s*=", html), "gestionnaire d'événement en ligne"
        assert "javascript:" not in html.lower()
        assert f'lang="{lang}"' in html


@pytest.mark.parametrize(("name", "section"), PUBLISHED)
def test_each_figure_is_published_in_its_section_in_both_languages(name, section):
    for lang in ("fr", "en"):
        text = (CONTENT / f"{section}.{lang}.md").read_text(encoding="utf-8")
        assert re.search(rf"^\[\[figure:{re.escape(name)}\]\]$", text, re.M), f"{section}.{lang}.md"


def test_every_figure_marker_in_the_content_is_registered():
    for path in CONTENT.rglob("*.md"):
        for name in re.findall(r"\[\[figure:([^\]]*)\]\]", path.read_text(encoding="utf-8")):
            assert name in FIGURES, f"{path.name} : {name}"


@pytest.mark.django_db
def test_a_section_with_a_figure_loads_the_figure_loader(client, enrolled, module):
    section = Section.objects.create(module=module, title_fr="Commande", order=1, body_md_fr="Relais.\n\n[[figure:relais]]")
    client.force_login(enrolled)
    html = client.get(f"/fr/sections/{section.public_id}/").content.decode()
    assert f'<script src="{static("acad/js/figures.js")}" defer></script>' in html
    assert 'data-figure="relais"' in html
    for tag in re.findall(r"<script\b[^>]*>", html):
        assert "src=" in tag


@pytest.mark.django_db
def test_a_section_without_figure_does_not_load_the_loader(client, enrolled, module):
    section = Section.objects.create(module=module, title_fr="Intro", order=1, body_md_fr="Texte.")
    client.force_login(enrolled)
    assert "figures.js" not in client.get(f"/fr/sections/{section.public_id}/").content.decode()
