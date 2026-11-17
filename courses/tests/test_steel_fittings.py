"""Raccords acier à visser (Partie 4, module 2, section « Acier, PVC, mixtes ») : décisions Q101 à Q103.

Le catalogue `figures/_data/raccords-acier.mjs` décrit les 7 raccords que cite la section ; ce test le compare à un
tableau d'atelier écrit ici, sans le générateur : filetages, fonction, nombre de voies.
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

# Raccord : (filetages admis, fonction, nombre de voies)
WORKSHOP = {
    "manchon": ({"F/F"}, "prolonger", 2),
    "mamelon": ({"M/M"}, "relier-femelles", 2),
    "reduction": ({"M/F", "F/F"}, "changer-diametre", 2),
    "coude": ({"M/M", "M/F", "F/F"}, "changer-direction", 2),
    "union": ({"3 pièces"}, "demonter", 2),
    "te": ({"F/F/F", "M/M/M"}, "deriver", 3),
    "bouchon": ({"M", "F"}, "fermer", 1),
}


@lru_cache(maxsize=1)
def catalogue():
    node = shutil.which("node")
    if node is None:
        pytest.skip("node absent : il produit les figures et l'export du catalogue")
    out = subprocess.run([node, str(DATA / "export.mjs"), "raccords-acier"], capture_output=True, check=True, encoding="utf-8", cwd=ROOT).stdout
    return json.loads(out)


def test_the_seven_fittings_named_by_the_section():
    """Q101 : les 7 raccords à visser cités par le tableau de la section, ni plus ni moins."""
    text = (MODULE / "02-acier-pvc-mixtes.fr.md").read_text(encoding="utf-8").lower()
    assert "manchon, réduction, mamelon, coude, union, té, bouchon" in text
    assert set(catalogue()["fittings"]) == set(WORKSHOP)


def test_threads_function_and_ways_match_the_workshop_table():
    for key, (threads, function, ways) in WORKSHOP.items():
        f = catalogue()["fittings"][key]
        assert set(f["threads"]) == threads, key
        assert f["function"] == function, key
        assert f["ways"] == ways, key
        for field in ("name", "threadsLabel", "functionLabel", "feature", "detail"):
            assert f[field]["fr"] and f[field]["en"], (key, field)


def test_the_three_piece_union_is_not_confused_with_the_flare_union():
    union = catalogue()["fittings"]["union"]
    assert "dudgeon" in union["detail"]["fr"] and "flare" in union["detail"]["en"]


def test_every_situation_has_one_answer_among_three_or_four_options():
    kinds = Counter()
    for s in catalogue()["situations"]:
        kinds[s["kind"]] += 1
        keys = [json.dumps(o, sort_keys=True) for o in s["options"]]
        assert 3 <= len(keys) <= 4 and len(set(keys)) == len(keys), s["key"]
        assert keys.count(json.dumps(s["answer"], sort_keys=True)) == 1, s["key"]
    assert {"nom", "fonction", "filetage", "particularite", "situation"} <= set(kinds)
    assert set(Counter(s["level"] for s in catalogue()["situations"])) == {1, 2, 3}
    # une question de filetage n'a jamais de leurre qui partage un filetage avec la bonne réponse
    for s in catalogue()["situations"]:
        if s["kind"] == "filetage":
            right = set(WORKSHOP[s["answer"]][0])
            assert all(not (set(WORKSHOP[o][0]) & right) for o in s["options"] if o != s["answer"]), s["key"]
    # chaque situation d'atelier mène à un raccord dont la fonction est la bonne
    for s in catalogue()["situations"]:
        if s["kind"] == "situation":
            assert catalogue()["fittings"][s["answer"]]["function"] == s["function"], s["key"]


def test_steel_fittings_figure_is_published_in_its_section():
    from courses.figures import FIGURES

    assert "raccords-acier" in FIGURES
    for lang in ("fr", "en"):
        text = (MODULE / f"02-acier-pvc-mixtes.{lang}.md").read_text(encoding="utf-8")
        assert re.search(r"^\[\[figure:raccords-acier\]\]$", text, re.M), lang
        fragment = (STATIC / f"raccords-acier.{lang}.html").read_text(encoding="utf-8")
        script = (STATIC / f"raccords-acier.{lang}.js").read_text(encoding="utf-8")
        assert "<script" not in fragment
        assert len(fragment.encode()) + len(script.encode()) <= 160_000
        for act in ("explore", "compare", "quiz", "mounted"):
            assert f'data-act="{act}"' in fragment, act
        assert 'querySelector(".rc-quiz .rc-options")' in script
        assert not [w for w in ("fetch(", "XMLHttpRequest", "localStorage") if w in script]


def test_module_two_gets_four_quiz_and_four_exam_questions_on_steel_fittings():
    bank = json.loads((MODULE / "questions.json").read_text(encoding="utf-8"))
    new = [q for q in bank if 25 <= int(q["id"].rsplit("q", 1)[1]) <= 32]  # q33 et suivantes : raccords dudgeon (Q105)
    assert [q["id"] for q in new] == [f"p4-m2-q{n}" for n in range(25, 33)]
    assert [q["usage"] for q in new] == ["quiz"] * 4 + ["exam"] * 4
    for q in new:
        assert q["section"] == "02-acier-pvc-mixtes"
        assert q["reviewed"] == {"fr": True, "en": True}
        right = sum(c["correct"] for c in q["choices"])
        assert {"single": right == 1, "multiple": right >= 2, "truefalse": right == 1 and len(q["choices"]) == 2}[q["type"]], q["id"]
