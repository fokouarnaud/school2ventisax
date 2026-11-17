"""Raccords frigorifiques dudgeon (Partie 4, module 2, section « Cuivre et laiton ») : décisions Q104 à Q106.

Le catalogue `figures/_data/raccords-flare.mjs` décrit 5 raccords dudgeon ; ce test le compare à un tableau d'atelier
écrit ici, sans le générateur : filetages, fonction, nombre de voies.
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
MODULE = ROOT / "content" / "froid" / "p4" / "m2"
STATIC = ROOT / "static" / "acad" / "figures"

# Raccord : (filetages, fonction, nombre de voies)
WORKSHOP = {
    "ecrou": ({"F"}, "plaquer", 1),
    "union": ({"M/M"}, "relier-evases", 2),
    "reduction": ({"F/M"}, "changer-diametre", 2),
    "te": ({"M/M/M"}, "prise-pression", 3),
    "bouchon": ({"F-plein"}, "fermer", 1),
}


@lru_cache(maxsize=1)
def catalogue():
    node = shutil.which("node")
    if node is None:
        pytest.skip("node absent : il produit les figures et l'export du catalogue")
    out = subprocess.run([node, str(DATA / "export.mjs"), "raccords-flare"], capture_output=True, check=True, encoding="utf-8", cwd=ROOT).stdout
    return json.loads(out)


def test_the_five_flare_fittings():
    assert set(catalogue()["fittings"]) == set(WORKSHOP)
    for key, (threads, function, ways) in WORKSHOP.items():
        f = catalogue()["fittings"][key]
        assert set(f["threads"]) == threads, key
        assert f["function"] == function, key
        assert f["ways"] == ways, key
        for field in ("name", "threadsLabel", "functionLabel", "feature", "detail"):
            assert f[field]["fr"] and f[field]["en"], (key, field)


def test_the_seal_comes_from_the_cones_and_the_nut_goes_on_before_flaring():
    f = catalogue()["fittings"]
    assert "avant" in f["ecrou"]["detail"]["fr"] and "before" in f["ecrou"]["detail"]["en"]
    assert "ruban" in f["ecrou"]["detail"]["fr"] and "tape" in f["ecrou"]["detail"]["en"]
    assert "obus" in f["te"]["detail"]["fr"] and "valve core" in f["te"]["detail"]["en"]


def test_no_brand_name():
    text = json.dumps(catalogue(), ensure_ascii=False).lower()
    assert "schrader" not in text


def test_every_situation_has_one_answer_among_three_or_four_options():
    kinds = Counter()
    for s in catalogue()["situations"]:
        kinds[s["kind"]] += 1
        keys = [json.dumps(o, sort_keys=True) for o in s["options"]]
        assert 3 <= len(keys) <= 4 and len(set(keys)) == len(keys), s["key"]
        assert keys.count(json.dumps(s["answer"], sort_keys=True)) == 1, s["key"]
        if s["kind"] == "filetage":
            right = WORKSHOP[s["answer"]][0]
            assert all(not (WORKSHOP[o][0] & right) for o in s["options"] if o != s["answer"]), s["key"]
        if s["kind"] == "situation":
            assert catalogue()["fittings"][s["answer"]]["function"] == s["function"], s["key"]
    assert {"nom", "fonction", "filetage", "particularite", "situation"} <= set(kinds)
    assert set(Counter(s["level"] for s in catalogue()["situations"])) == {1, 2, 3}


def test_flare_fittings_figure_is_published_in_its_section():
    from courses.figures import FIGURES

    assert "raccords-flare" in FIGURES
    for lang in ("fr", "en"):
        text = (MODULE / f"01-cuivre-laiton.{lang}.md").read_text(encoding="utf-8")
        assert re.search(r"^\[\[figure:raccords-flare\]\]$", text, re.M), lang
        fragment = (STATIC / f"raccords-flare.{lang}.html").read_text(encoding="utf-8")
        script = (STATIC / f"raccords-flare.{lang}.js").read_text(encoding="utf-8")
        assert "<script" not in fragment and "schrader" not in (fragment + script).lower()
        assert len(fragment.encode()) + len(script.encode()) <= 160_000
        for act in ("explore", "compare", "quiz", "mounted"):
            assert f'data-act="{act}"' in fragment, act
        assert 'querySelector(".rc-quiz .rc-options")' in script


def test_module_two_gets_four_quiz_and_four_exam_questions_on_flare_fittings():
    bank = json.loads((MODULE / "questions.json").read_text(encoding="utf-8"))
    new = [q for q in bank if 33 <= int(q["id"].rsplit("q", 1)[1]) <= 40]
    assert [q["id"] for q in new] == [f"p4-m2-q{n}" for n in range(33, 41)]
    assert [q["usage"] for q in new] == ["quiz"] * 4 + ["exam"] * 4
    for q in new:
        assert q["section"] == "01-cuivre-laiton"
        assert q["reviewed"] == {"fr": True, "en": True}
        assert "schrader" not in json.dumps(q, ensure_ascii=False).lower()
        right = sum(c["correct"] for c in q["choices"])
        assert {"single": right == 1, "multiple": right >= 2, "truefalse": right == 1 and len(q["choices"]) == 2}[q["type"]], q["id"]
