"""Mise en service et hors service du poste oxyacétylénique (Partie 4, module 5) : décisions Q94 et Q95.

Le catalogue `figures/_data/mise-en-service.mjs` reprend les procédures de la section « Mise en service » ; ce test les
compare au texte de la section, recopié ici, et vérifie chaque situation d'entraînement.
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
SECTION = CONTENT / "p4" / "m5" / "03-mise-en-service.fr.md"


@lru_cache(maxsize=1)
def catalogue():
    node = shutil.which("node")
    if node is None:
        pytest.skip("node absent : il produit les figures et l'export du catalogue")
    out = subprocess.run([node, str(DATA / "export.mjs"), "mise-en-service"], capture_output=True, check=True, encoding="utf-8", cwd=ROOT).stdout
    return json.loads(out)


def numbered(title):
    """Étapes numérotées sous un titre de la section, telles qu'écrites dans le cours."""
    text = SECTION.read_text(encoding="utf-8").split(f"## {title}\n", 1)[1].split("\n## ", 1)[0]
    return re.findall(r"^\d+\. (.+)$", text, re.M)


def test_procedures_are_those_of_the_section_in_order():
    """Q94 : mêmes étapes, même ordre, mêmes mots que la section (mise en service, puis hors service)."""
    for key, title in (("start", "Mise en service"), ("stop", "Mise hors service")):
        steps = catalogue()["procedures"][key]
        assert [s["label"]["fr"] for s in steps] == numbered(title), key
        assert all(s["label"]["en"] for s in steps)


def test_each_wrong_action_explains_a_danger_named_in_the_section():
    """Q94 : chaque action refusée dit pourquoi, en fr et en en, et vise une étape de la procédure."""
    ids = {s["id"] for p in catalogue()["procedures"].values() for s in p}
    for e in catalogue()["errors"]:
        assert e["step"] in ids, e["id"]
        assert e["action"]["fr"] and e["action"]["en"] and e["why"]["fr"] and e["why"]["en"], e["id"]


def test_every_situation_has_one_right_answer_true_to_the_section():
    kinds = Counter()
    procedures = catalogue()["procedures"]
    for s in catalogue()["situations"]:
        kinds[s["kind"]] += 1
        keys = [json.dumps(o, sort_keys=True) for o in s["options"]]
        assert 3 <= len(keys) <= 4 and len(set(keys)) == len(keys), s["key"]
        assert keys.count(json.dumps(s["answer"], sort_keys=True)) == 1, s["key"]
        if s["kind"] in ("suivante", "precedente"):
            steps = [x["id"] for x in procedures[s["procedure"]]]
            shift = 1 if s["kind"] == "suivante" else -1
            assert s["answer"] == steps[steps.index(s["from"]) + shift], s["key"]
        elif s["kind"] == "erreur":
            error = next(e for e in catalogue()["errors"] if e["id"] == s["error"])
            assert s["answer"] == error["id"], s["key"]
    assert {"suivante", "precedente", "erreur", "tuyau", "tenue"} <= set(kinds)


def test_hoses_and_torch_angles_follow_the_section():
    """Tuyau bleu pour l'oxygène, rouge pour l'acétylène ; chalumeau à 50-70°, 45° en position inverse."""
    text = SECTION.read_text(encoding="utf-8")
    facts = catalogue()["facts"]
    assert facts["hoses"] == {"oxygene": "bleu", "acetylene": "rouge"}
    assert "bleu (oxygène)" in text and "rouge (acétylène)" in text
    assert facts["angles"] == {"soudage": "50-70", "inverse": "45", "apport": "45"}
    assert "50° à 70°" in text and "45°" in text


def test_series_can_climb_three_levels():
    levels = Counter(s["level"] for s in catalogue()["situations"])
    assert set(levels) == {1, 2, 3} and min(levels.values()) >= 4


def test_startup_figure_is_published_in_its_section():
    """Q94 : figure enregistrée, appelée dans la section, ≤ 160 Ko par langue, boutons en attente du script, rien envoyé."""
    from courses.figures import FIGURES

    assert "mise-en-service" in FIGURES
    for lang in ("fr", "en"):
        text = (CONTENT / "p4" / "m5" / f"03-mise-en-service.{lang}.md").read_text(encoding="utf-8")
        assert re.search(r"^\[\[figure:mise-en-service\]\]$", text, re.M), lang
        fragment = (STATIC / f"mise-en-service.{lang}.html").read_text(encoding="utf-8")
        script = (STATIC / f"mise-en-service.{lang}.js").read_text(encoding="utf-8")
        assert len(fragment.encode()) + len(script.encode()) <= 160_000
        assert not [w for w in ("fetch(", "XMLHttpRequest", "localStorage") if w in script]
        assert all(" disabled" in b for b in re.findall(r"<button\b[^>]*>", fragment))
        assert 'data-act="do"' in fragment and 'data-act="quiz"' in fragment
        # Deux listes de boutons (actions, réponses) : le script doit viser celle du mode « S'entraîner ».
        assert 'querySelector(".rc-quiz .rc-options")' in script


def test_section_gets_four_quiz_and_four_exam_questions():
    """Q95 : q25 à q32 sur la mise en service, 4 de quiz puis 4 d'examen, relues fr et en, publiables."""
    bank = json.loads((CONTENT / "p4" / "m5" / "questions.json").read_text(encoding="utf-8"))
    new = [q for q in bank if int(q["id"].rsplit("q", 1)[1]) >= 25]
    assert [q["id"] for q in new] == [f"p4-m5-q{n}" for n in range(25, 33)]
    assert [q["usage"] for q in new] == ["quiz"] * 4 + ["exam"] * 4
    assert {q["section"] for q in new} == {"03-mise-en-service"}
    for q in new:
        assert q["reviewed"] == {"fr": True, "en": True}
        right = sum(c["correct"] for c in q["choices"])
        assert {"single": right == 1, "multiple": right >= 2, "truefalse": right == 1 and len(q["choices"]) == 2}[q["type"]], q["id"]
