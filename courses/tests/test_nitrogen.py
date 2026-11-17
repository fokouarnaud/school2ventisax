"""Brasage sous azote (Partie 4, module 7) : décisions Q99 et Q100.

Le catalogue `figures/_data/azote.mjs` reprend le mode opératoire et les notions des deux sections du module ;
ce test le compare au texte : mêmes étapes, mêmes plages, et chaque bonne réponse appuyée sur une phrase de la section.
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
MODULE = ROOT / "content" / "froid" / "p4" / "m7"
STATIC = ROOT / "static" / "acad" / "figures"


@lru_cache(maxsize=1)
def catalogue():
    node = shutil.which("node")
    if node is None:
        pytest.skip("node absent : il produit les figures et l'export du catalogue")
    out = subprocess.run([node, str(DATA / "export.mjs"), "azote"], capture_output=True, check=True, encoding="utf-8", cwd=ROOT).stdout
    return json.loads(out)


def section_text(lang):
    return "\n".join((MODULE / f"{name}.{lang}.md").read_text(encoding="utf-8") for name in ("01-rappels", "02-mise-en-oeuvre"))


def test_steps_are_the_ten_steps_of_the_section():
    """Q99 : mêmes étapes, même ordre, mêmes mots que le mode opératoire, en fr et en en."""
    for lang in ("fr", "en"):
        text = (MODULE / f"02-mise-en-oeuvre.{lang}.md").read_text(encoding="utf-8")
        steps = re.findall(r"^\d+\. (.+)$", text, re.M)
        assert [s["label"][lang] for s in catalogue()["steps"]] == steps, lang


def test_ranges_flow_and_pressure_are_those_of_the_section():
    text = section_text("fr")
    assert catalogue()["ranges"] == {"azote": [0.2, 0.5], "acetylene": [0.2, 0.5], "oxygene": [0.5, 1.5]}
    assert "entre 0,2 et 0,5 bar" in text and "entre 0,5 et 1,5 bar" in text
    assert "6 l/min" in text and "230 bar" in text


def test_every_right_answer_rests_on_a_sentence_of_the_section():
    """Chaque notion porte la phrase de la section qui justifie sa bonne réponse (`source`), en fr et en en."""
    for key, notion in catalogue()["notions"].items():
        for lang in ("fr", "en"):
            assert notion["source"][lang] in section_text(lang), (key, lang)
            labels = [o[lang] for o in notion["options"]]
            assert len(set(labels)) == len(labels) == 4, (key, lang)


def test_every_situation_has_one_answer_among_three_or_four_options():
    kinds = Counter()
    for s in catalogue()["situations"]:
        kinds[s["kind"]] += 1
        keys = [json.dumps(o, sort_keys=True) for o in s["options"]]
        assert 3 <= len(keys) <= 4 and len(set(keys)) == len(keys), s["key"]
        assert keys.count(json.dumps(s["answer"], sort_keys=True)) == 1, s["key"]
    assert {"suivante", "precedente", "reglage", "notion"} <= set(kinds)
    assert set(Counter(s["level"] for s in catalogue()["situations"])) == {1, 2, 3}


def test_nitrogen_figure_offers_a_practice_mode():
    for lang in ("fr", "en"):
        fragment = (STATIC / f"brasage-azote.{lang}.html").read_text(encoding="utf-8")
        script = (STATIC / f"brasage-azote.{lang}.js").read_text(encoding="utf-8")
        assert len(fragment.encode()) + len(script.encode()) <= 160_000
        assert 'data-act="braze"' in fragment and 'data-act="practice"' in fragment
        assert 'querySelector(".bz-quiz .rc-options")' in script
        assert not [w for w in ("fetch(", "XMLHttpRequest", "localStorage") if w in script]


def test_module_seven_gets_four_quiz_and_four_exam_questions():
    bank = json.loads((MODULE / "questions.json").read_text(encoding="utf-8"))
    new = [q for q in bank if 17 <= int(q["id"].rsplit("q", 1)[1]) <= 24]
    assert [q["id"] for q in new] == [f"p4-m7-q{n}" for n in range(17, 25)]
    assert [q["usage"] for q in new] == ["quiz"] * 4 + ["exam"] * 4
    for q in new:
        assert q["reviewed"] == {"fr": True, "en": True}
        right = sum(c["correct"] for c in q["choices"])
        assert {"single": right == 1, "multiple": right >= 2, "truefalse": right == 1 and len(q["choices"]) == 2}[q["type"]], q["id"]
