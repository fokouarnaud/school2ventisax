"""Calcul de la longueur développée (Partie 4, module 4, « Calcul des longueurs ») : décisions Q89 et Q90.

Le catalogue `figures/_data/longueurs.mjs` énumère les situations de la figure `longueur-developpee` ; ce test les
recalcule avec une géométrie écrite indépendamment : retrait R × tan(α/2) sur chaque cote, arc 2 × π × R × α / 360.
"""

import json
import math
import re
import shutil
import subprocess
from functools import lru_cache
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "figures" / "_data"
CONTENT = ROOT / "content" / "froid"
STATIC = ROOT / "static" / "acad" / "figures"
SUPPORT_STEEL = {'3/8"': 46.5, '1/2"': 55.5, '3/4"': 71, '1"': 94, '1 1/4"': 150, '1 1/2"': 163, '2"': 220}


@lru_cache(maxsize=1)
def catalogue():
    node = shutil.which("node")
    if node is None:
        pytest.skip("node absent : il produit les figures et l'export du catalogue")
    out = subprocess.run([node, str(DATA / "export.mjs"), "longueurs"], capture_output=True, check=True, encoding="utf-8", cwd=ROOT).stdout
    return json.loads(out)


def situations():
    return catalogue()["situations"]


def expected_steps(s):
    """Longueurs droites, arcs et LD recalculés, au dixième de mm."""
    R, angles, cotes = s["radius"], s["angles"], s["cotes"]
    back = [R * math.tan(math.radians(a) / 2) for a in angles]
    straights = [cotes[0] - back[0]]
    straights += [cotes[i] - back[i - 1] - back[i] for i in range(1, len(angles))]
    straights.append(cotes[-1] - back[-1])
    arcs = [2 * math.pi * R * a / 360 for a in angles]
    return straights, arcs, sum(straights) + sum(arcs)


def test_steel_radii_are_those_of_the_handout():
    """Q90 : abaque acier du support, 3/8" à 2"."""
    assert catalogue()["radii"]["acier"] == SUPPORT_STEEL


def test_copper_radii_cover_the_refrigeration_series():
    """Q90 : cuivre 1/4 à 7/8, rayon de cintreuse de 2 à 4,5 fois le diamètre (9/16" pour un tube 1/4)."""
    copper = catalogue()["radii"]["cuivre"]
    assert list(copper) == ["1/4", "5/16", "3/8", "1/2", "5/8", "3/4", "7/8"]
    for size, radius in copper.items():
        whole, _, frac = size.rpartition(" ")
        od = (int(whole or 0) + eval(frac)) * 25.4  # noqa: S307 : fraction écrite dans le test
        assert 2 <= radius / od <= 4.5, size


def test_every_step_answer_matches_the_geometry():
    """Q89 : chaque droite, chaque arc et LD, recalculés, au dixième de mm ; aucune droite de moins de 20 mm."""
    for s in situations():
        straights, arcs, ld = expected_steps(s)
        assert min(straights) >= 20, s["key"]
        want = [("droite", round(v, 1)) for v in straights] + [("arc", round(v, 1)) for v in arcs] + [("ld", round(ld, 1))]
        got = [(step["kind"], step["answer"]) for step in s["steps"]]
        assert [k for k, _ in got] == [k for k, _ in want], s["key"]
        for (kind, g), (_, w) in zip(got, want):
            assert abs(g - w) <= 0.11, (s["key"], kind, g, w)


def test_each_step_offers_three_or_four_options_spaced_from_the_answer():
    """Q79, Q89 : une seule bonne réponse, leurres distincts et à 0,5 mm au moins de la réponse."""
    for s in situations():
        for step in s["steps"]:
            options = step["options"]
            assert 3 <= len(options) <= 4 and len(set(options)) == len(options), s["key"]
            assert options.count(step["answer"]) == 1, s["key"]
            assert all(abs(o - step["answer"]) >= 0.5 for o in options if o != step["answer"]), s["key"]
            assert all(o > 0 for o in options), s["key"]


def test_a_thousand_situations_in_four_levels():
    """Q89 : plus de 1 000 situations distinctes ; niveau 1 acier à 90°, niveau 4 deux coudes."""
    keys = [s["key"] for s in situations()]
    assert len(keys) == len(set(keys)) and len(keys) >= 1000
    levels = {n: [s for s in situations() if s["level"] == n] for n in (1, 2, 3, 4)}
    assert all(len(v) >= 10 for v in levels.values())
    assert all(s["tube"]["material"] == "acier" and s["angles"] == [90] for s in levels[1])
    assert all(len(s["angles"]) == 2 for s in levels[4])
    assert {a for s in levels[3] for a in s["angles"]} - {90}


def test_handout_example_is_one_of_the_situations():
    """Le cas du support : acier 3/4", R = 71, cotes 270 et 180, 90° : 199 + 109 + 111,5 = 419,5 mm."""
    s = next(s for s in situations() if s["tube"] == {"material": "acier", "size": '3/4"'} and s["cotes"] == [270, 180] and s["angles"] == [90])
    assert [step["answer"] for step in s["steps"]] == [199, 109, 111.5, 419.5]


def test_length_figure_is_published_in_the_calculation_section():
    """Q89 : figure enregistrée, appelée dans « Calcul des longueurs », ≤ 160 Ko par langue, sans envoi au serveur."""
    from courses.figures import FIGURES

    assert "longueur-developpee" in FIGURES
    for lang in ("fr", "en"):
        text = (CONTENT / "p4" / "m4" / f"01-calcul.{lang}.md").read_text(encoding="utf-8")
        assert re.search(r"^\[\[figure:longueur-developpee\]\]$", text, re.M), lang
        fragment = (STATIC / f"longueur-developpee.{lang}.html").read_bytes()
        script = (STATIC / f"longueur-developpee.{lang}.js").read_text(encoding="utf-8")
        assert len(fragment) + len(script.encode("utf-8")) <= 160_000
        assert not [w for w in ("fetch(", "XMLHttpRequest", "localStorage") if w in script]
        assert all(" disabled" in b for b in re.findall(r"<button\b[^>]*>", fragment.decode("utf-8")))


def test_copper_bending_radii_are_listed_to_confirm():
    """Q90 : les rayons du cuivre viennent de la pratique courante, signalés au formateur."""
    to_confirm = (CONTENT / "p4" / "CORRECTIONS.md").read_text(encoding="utf-8").split("## Valeurs à confirmer", 1)[1]
    assert "rayons de cintreuse du cuivre" in to_confirm and "figures/_data/longueurs.mjs" in to_confirm
