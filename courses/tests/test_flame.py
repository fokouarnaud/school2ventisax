"""Chalumeau et flamme (Partie 4, module 5, section « Chalumeau et flamme ») : décision Q96.

Le catalogue `figures/_data/chalumeau.mjs` alimente le mode « S'entraîner » de la figure `flamme` ; ce test compare ses
réponses au texte de la section et au modèle de la figure (bande du mélange neutre, seuil de décollement).
"""

import json
import re
import shutil
import subprocess
from collections import Counter
from functools import lru_cache
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "figures" / "_data"
SECTION = ROOT / "content" / "froid" / "p4" / "m5" / "02-chalumeau-flamme.fr.md"
STATIC = ROOT / "static" / "acad" / "figures"


@lru_cache(maxsize=1)
def catalogue():
    node = shutil.which("node")
    if node is None:
        pytest.skip("node absent : il produit les figures et l'export du catalogue")
    out = subprocess.run([node, str(DATA / "export.mjs"), "chalumeau"], capture_output=True, check=True, encoding="utf-8", cwd=ROOT).stdout
    return json.loads(out)


def section_table(first_header):
    text = SECTION.read_text(encoding="utf-8")
    block = text.split(f"| {first_header} |", 1)[1].split("\n\n", 1)[0]
    return [[c.strip() for c in line.strip("|").split("|")] for line in block.splitlines()[2:] if line.startswith("|")]


def test_marks_and_aspects_are_those_of_the_section():
    """Repères 1 à 9 du chalumeau et aspect des trois flammes, recopiés de la section."""
    marks = {row[0]: row[1] for row in section_table("Repère | Élément")}
    assert {str(k): v["fr"] for k, v in catalogue()["marks"].items()} == marks
    aspects = {row[0]: row[2] for row in section_table("Repère | Flamme")}
    assert [catalogue()["aspects"][k]["fr"] for k in ("neutral", "oxy", "carb")] == [aspects["1"], aspects["2"], aspects["3"]]


def test_ranges_and_temperature_follow_the_section():
    text = SECTION.read_text(encoding="utf-8")
    ranges = catalogue()["ranges"]
    assert ranges == {"oxygene": [0.5, 1.5], "acetylene": [0.2, 0.5]}
    assert "entre 0,5 et 1,5 bar" in text and "entre 0,2 et 0,5 bar" in text
    assert catalogue()["temperature"] == 3100 and "3100 °C" in text


def test_drawn_flames_follow_the_figure_model():
    """Chaque flamme à reconnaître est allumée, recollée (débit d'acétylène sous le seuil) et de la bonne famille."""
    build = (ROOT / "figures" / "flamme" / "build.mjs").read_text(encoding="utf-8")
    low, high = map(float, re.search(r"neutral: \[([\d.]+), ([\d.]+)\]", build).groups())
    lift = float(re.search(r"liftAbove: ([\d.]+)", build).group(1))
    flames = [s for s in catalogue()["situations"] if s["kind"] == "flamme"]
    assert len(flames) >= 30
    for s in flames:
        a, o = s["a"], s["o"]
        assert 0 < a <= lift, s["key"]
        ratio = o / a
        assert s["answer"] == ("carb" if ratio < low else "oxy" if ratio > high else "neutral"), s["key"]
        assert abs(ratio - low) > 0.04 and abs(ratio - high) > 0.04, s["key"]  # jamais au bord de la bande


def test_every_situation_has_one_answer_among_three_or_four_options():
    kinds = Counter()
    for s in catalogue()["situations"]:
        kinds[s["kind"]] += 1
        keys = [json.dumps(o, sort_keys=True) for o in s["options"]]
        assert 3 <= len(keys) <= 4 and len(set(keys)) == len(keys), s["key"]
        assert keys.count(json.dumps(s["answer"], sort_keys=True)) == 1, s["key"]
    assert {"flamme", "aspect", "plage", "repere", "injecteur", "decollement", "temperature"} <= set(kinds)
    assert set(Counter(s["level"] for s in catalogue()["situations"])) == {1, 2, 3}


def test_flame_figure_offers_a_practice_mode():
    for lang in ("fr", "en"):
        fragment = (STATIC / f"flamme.{lang}.html").read_text(encoding="utf-8")
        script = (STATIC / f"flamme.{lang}.js").read_text(encoding="utf-8")
        assert 'data-act="tune"' in fragment and 'data-act="practice"' in fragment
        assert 'querySelector(".fl-quiz .rc-options")' in script
        assert len(fragment.encode()) + len(script.encode()) <= 160_000
        assert not [w for w in ("fetch(", "XMLHttpRequest", "localStorage") if w in script]
