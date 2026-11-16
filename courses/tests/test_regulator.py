"""Manodétendeurs (Partie 4, module 5, « Les manodétendeurs ») : décisions Q92 et Q93.

Le catalogue `figures/_data/manodetendeurs.mjs` reprend le tableau du support et énumère les situations de la figure
`manodetendeur` ; ce test les vérifie avec les valeurs du support recopiées ici, indépendamment du générateur.
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
# Tableau « Manodétendeurs à un étage compact » du support : alimentation max, détente max, manomètres aval et amont.
SUPPORT = {
    "acetylene": (25, 1.5, 2.5, 40),
    "propane": (25, 4, 6, 40),
    "oxygene": (230, 10, 16, 315),
    "azote": (230, 10, 16, 315),
    "co2": (230, 10, 16, 315),
}
START = ["vis-desserrees", "ouvrir-bouteilles", "regler-oxygene", "regler-acetylene", "purger", "allumer"]
STOP = ["fermer-acetylene", "fermer-oxygene", "fermer-bouteilles", "purger-desserrer"]


@lru_cache(maxsize=1)
def catalogue():
    node = shutil.which("node")
    if node is None:
        pytest.skip("node absent : il produit les figures et l'export du catalogue")
    out = subprocess.run([node, str(DATA / "export.mjs"), "manodetendeurs"], capture_output=True, check=True, encoding="utf-8", cwd=ROOT).stdout
    return json.loads(out)


def situations():
    return catalogue()["situations"]


def test_regulators_follow_the_handout_table():
    """Q92 : alimentation, détente et cadrans du tableau du support, pour chaque gaz."""
    gases = catalogue()["gases"]
    assert set(gases) == set(SUPPORT)
    for gas, (feed, detent, low, high) in SUPPORT.items():
        g = gases[gas]
        assert (g["feed"], g["detent"], g["low"], g["high"]) == (feed, detent, low, high), gas
        assert g["label"]["fr"] and g["label"]["en"]


def test_procedures_follow_the_start_up_section():
    """Q92 : ordre de mise en service et hors service de la section « Mise en service »."""
    assert [s["id"] for s in catalogue()["start"]] == START
    assert [s["id"] for s in catalogue()["stop"]] == STOP
    assert all(s["label"]["fr"] and s["label"]["en"] for s in catalogue()["start"] + catalogue()["stop"])


def test_every_answer_is_true_to_the_table():
    """Lecture dans le cadran, détente admise, bon détendeur, bon manomètre, étape suivante."""
    gases = catalogue()["gases"]
    kinds = Counter()
    for s in situations():
        kinds[s["kind"]] += 1
        g = gases[s["gas"]] if "gas" in s else None
        if s["kind"] == "manometre":
            assert s["answer"] == {"bouteille": "amont", "service": "aval"}[s["reads"]], s["key"]
        elif s["kind"] == "lecture":
            span = g["high"] if s["gauge"] == "amont" else g["low"]
            assert 0 <= s["answer"] <= span and s["needle"] == s["answer"], s["key"]
        elif s["kind"] == "detente":
            assert s["answer"] == g["detent"], s["key"]
        elif s["kind"] == "detendeur":
            assert s["answer"] == {"feed": g["feed"], "low": g["low"], "high": g["high"]}, s["key"]
        elif s["kind"] == "reglage":
            v = s["value"]
            assert s["answer"] == ("admis" if v <= g["detent"] else "trop-haut" if v <= g["low"] else "hors-cadran"), s["key"]
        elif s["kind"] == "ordre":
            steps = [x["id"] for x in catalogue()[s["procedure"]]]
            assert s["answer"] == steps[s["after"] + 1], s["key"]
        else:
            pytest.fail(s["kind"])
    assert set(kinds) == {"manometre", "lecture", "detente", "detendeur", "reglage", "ordre"}


def test_acetylene_is_never_set_above_its_limit_in_a_right_answer():
    """Sécurité : aucune bonne réponse ne règle l'acétylène au-delà de 1,5 bar."""
    for s in situations():
        if s.get("gas") == "acetylene" and s["kind"] == "detente":
            assert s["answer"] <= 1.5


def test_each_situation_offers_three_or_four_options_with_one_answer():
    for s in situations():
        keys = [json.dumps(o, sort_keys=True) for o in s["options"]]
        assert 3 <= len(keys) <= 4 and len(set(keys)) == len(keys), s["key"]
        assert keys.count(json.dumps(s["answer"], sort_keys=True)) == 1, s["key"]


def test_a_thousand_situations_in_four_levels():
    keys = [s["key"] for s in situations()]
    assert len(keys) == len(set(keys)) and len(keys) >= 1000
    levels = Counter(s["level"] for s in situations())
    assert set(levels) == {1, 2, 3, 4} and min(levels.values()) >= 10


def test_regulator_figure_is_published_in_its_section():
    """Q92 : figure enregistrée, appelée dans « Les manodétendeurs », ≤ 160 Ko, boutons en attente du script, rien envoyé."""
    from courses.figures import FIGURES

    assert "manodetendeur" in FIGURES
    for lang in ("fr", "en"):
        text = (CONTENT / "p4" / "m5" / f"01-manodetendeurs.{lang}.md").read_text(encoding="utf-8")
        assert re.search(r"^\[\[figure:manodetendeur\]\]$", text, re.M), lang
        fragment = (STATIC / f"manodetendeur.{lang}.html").read_text(encoding="utf-8")
        script = (STATIC / f"manodetendeur.{lang}.js").read_text(encoding="utf-8")
        assert len(fragment.encode()) + len(script.encode()) <= 160_000
        assert not [w for w in ("fetch(", "XMLHttpRequest", "localStorage") if w in script]
        assert all(" disabled" in b for b in re.findall(r"<button\b[^>]*>", fragment))
        assert 'data-act="explore"' in fragment and 'data-act="quiz"' in fragment


def test_module_five_gets_four_quiz_and_four_exam_questions_on_the_regulator():
    """Q93 : q17 à q24 sur le détendeur, 4 de quiz puis 4 d'examen, relues fr et en, publiables."""
    bank = json.loads((CONTENT / "p4" / "m5" / "questions.json").read_text(encoding="utf-8"))
    new = [q for q in bank if int(q["id"].rsplit("q", 1)[1]) >= 17]
    assert [q["id"] for q in new] == [f"p4-m5-q{n}" for n in range(17, 25)]
    assert [q["usage"] for q in new] == ["quiz"] * 4 + ["exam"] * 4
    assert {q["section"] for q in new} == {"01-manodetendeurs"}
    for q in new:
        assert q["reviewed"] == {"fr": True, "en": True}
        right = sum(c["correct"] for c in q["choices"])
        assert {"single": right == 1, "multiple": right >= 2, "truefalse": right == 1 and len(q["choices"]) == 2}[q["type"]], q["id"]


def test_corrections_log_records_the_regulator_additions():
    log = (CONTENT / "p4" / "CORRECTIONS.md").read_text(encoding="utf-8")
    entry = re.search(r"^## \d+\. Manodétendeurs : figure et questions \(module 5.*?(?=^## )", log, re.M | re.S)
    assert entry and all(f in entry.group(0) for f in ("**Page**", "**Texte d'origine**", "**Correction**", "**Justification**"))
