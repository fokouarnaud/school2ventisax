"""Soudo-brasage et brasage (Partie 4, module 6) : décisions Q97 et Q98.

Le catalogue `figures/_data/brasage.mjs` reprend les 8 conditions de la section « Brasage » et les définitions du module ;
ce test le compare au texte, recopié ici, et reclasse chaque procédé avec les seuils de la section.
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
CONTENT = ROOT / "content" / "froid"
STATIC = ROOT / "static" / "acad" / "figures"
SECTION = CONTENT / "p4" / "m6" / "02-brasage.fr.md"


@lru_cache(maxsize=1)
def catalogue():
    node = shutil.which("node")
    if node is None:
        pytest.skip("node absent : il produit les figures et l'export du catalogue")
    out = subprocess.run([node, str(DATA / "export.mjs"), "brasage"], capture_output=True, check=True, encoding="utf-8", cwd=ROOT).stdout
    return json.loads(out)


def test_steps_are_the_eight_conditions_of_the_section():
    """Q97 : mêmes étapes, même ordre, mêmes mots que la section, en fr et en en."""
    for lang in ("fr", "en"):
        text = (CONTENT / "p4" / "m6" / f"02-brasage.{lang}.md").read_text(encoding="utf-8")
        steps = re.findall(r"^\d+\. (.+)$", text, re.M)
        assert [s["label"][lang] for s in catalogue()["steps"]] == steps, lang


def test_thresholds_are_those_of_the_module():
    text = SECTION.read_text(encoding="utf-8") + (CONTENT / "p4" / "m6" / "01-soudo-brasage.fr.md").read_text(encoding="utf-8")
    assert catalogue()["thresholds"] == {"tendre": 450, "cuivre": 1085}
    assert "450 °C" in text and "1085 °C" in text


def expected_process(s):
    """Classement d'après la section : fusion des pièces = soudage ; sinon apport sous 450 °C = brasage tendre ;
    au-dessus, capillarité = brasage fort, bords préparés et remplissage de proche en proche = soudo-brasage."""
    if s["parts_melt"]:
        return "soudage"
    if s["filler"] < 450:
        return "tendre"
    return "fort" if s["capillary"] else "soudo"


def test_every_process_is_classified_like_the_section():
    procs = [s for s in catalogue()["situations"] if s["kind"] == "procede"]
    assert len(procs) >= 100
    for s in procs:
        assert s["answer"] == expected_process(s), s["key"]
        assert s["filler"] != 450, s["key"]  # jamais sur le seuil
        assert s["parts_melt"] or s["filler"] < 1085, s["key"]  # un apport qui fond au-dessus du cuivre n'existe pas sans fusion
        if s["answer"] == "soudo":
            assert s["edges"] and not s["capillary"], s["key"]


def test_every_danger_quotes_the_section():
    ids = {s["id"] for s in catalogue()["steps"]}
    text = SECTION.read_text(encoding="utf-8").lower()
    for e in catalogue()["errors"]:
        assert e["step"] in ids, e["id"]
        assert e["action"]["fr"] and e["action"]["en"] and e["why"]["fr"] and e["why"]["en"], e["id"]
    assert "risque d'explosion" in text


def test_every_situation_has_one_answer_among_three_or_four_options():
    kinds = Counter()
    for s in catalogue()["situations"]:
        kinds[s["kind"]] += 1
        keys = [json.dumps(o, sort_keys=True) for o in s["options"]]
        assert 3 <= len(keys) <= 4 and len(set(keys)) == len(keys), s["key"]
        assert keys.count(json.dumps(s["answer"], sort_keys=True)) == 1, s["key"]
    assert {"procede", "suivante", "precedente", "erreur"} <= set(kinds)
    assert set(Counter(s["level"] for s in catalogue()["situations"])) == {1, 2, 3}


def test_brazing_figure_is_published_in_its_section():
    from courses.figures import FIGURES

    assert "brasage" in FIGURES
    for lang in ("fr", "en"):
        text = (CONTENT / "p4" / "m6" / f"02-brasage.{lang}.md").read_text(encoding="utf-8")
        assert re.search(r"^\[\[figure:brasage\]\]$", text, re.M), lang
        fragment = (STATIC / f"brasage.{lang}.html").read_text(encoding="utf-8")
        script = (STATIC / f"brasage.{lang}.js").read_text(encoding="utf-8")
        assert len(fragment.encode()) + len(script.encode()) <= 160_000
        assert 'data-act="do"' in fragment and 'data-act="quiz"' in fragment
        assert 'querySelector(".rc-quiz .rc-options")' in script
        assert not [w for w in ("fetch(", "XMLHttpRequest", "localStorage") if w in script]


def test_module_six_gets_four_quiz_and_four_exam_questions():
    bank = json.loads((CONTENT / "p4" / "m6" / "questions.json").read_text(encoding="utf-8"))
    new = [q for q in bank if 17 <= int(q["id"].rsplit("q", 1)[1]) <= 24]
    assert [q["id"] for q in new] == [f"p4-m6-q{n}" for n in range(17, 25)]
    assert [q["usage"] for q in new] == ["quiz"] * 4 + ["exam"] * 4
    for q in new:
        assert q["reviewed"] == {"fr": True, "en": True}
        right = sum(c["correct"] for c in q["choices"])
        assert {"single": right == 1, "multiple": right >= 2, "truefalse": right == 1 and len(q["choices"]) == 2}[q["type"]], q["id"]
