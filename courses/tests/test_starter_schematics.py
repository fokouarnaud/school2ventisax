"""Démarreurs animés de la Partie 3 : étoile-triangle (p3/m5/03) et fractionné (p3/m6/02), décisions Q107 à Q110.

`figures/_data/demarreurs.mjs` décrit les schémas de commande et de puissance des deux figures et les fait fonctionner
dans le temps ; ce test vérifie, sans le navigateur, que les schémas sont ceux du cours (repères, branchements) et que
la séquence jouée est celle de la section : impulsion, auto-maintien, temporisation, verrouillages, arrêts.
"""

import json
import re
import shutil
import subprocess
from functools import lru_cache
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "figures" / "_data"
CONTENT = ROOT / "content" / "froid" / "p3"
STATIC = ROOT / "static" / "acad" / "figures"
SECTIONS = {"etoile-triangle": CONTENT / "m5" / "03-schemas", "fractionne-schemas": CONTENT / "m6" / "02-reperage"}


@lru_cache(maxsize=1)
def export():
    node = shutil.which("node")
    if node is None:
        pytest.skip("node absent : il produit les figures et l'export des démarreurs")
    out = subprocess.run([node, str(DATA / "export.mjs"), "demarreurs"], capture_output=True, check=True, encoding="utf-8", cwd=ROOT).stdout
    return json.loads(out)


def scenario(name, sid):
    return next(s for s in export()["situations"][name] if s["id"] == sid)


def connected(edges, closed):
    """Composantes reliées par les fils, éléments thermiques et contacts fermés (union-find sur les nœuds)."""
    parent = {}

    def find(n):
        parent.setdefault(n, n)
        while parent[n] != n:
            parent[n] = parent[parent[n]]
            n = parent[n]
        return n

    for e in edges:
        if e["kind"] in ("wire", "heater", "fuse") or (e["kind"] == "no" and e.get("by") in closed):
            parent[find(e["a"])] = find(e["b"])
    return find


def contacts(name, by):
    return [(e["kind"], tuple(e.get("nums") or ())) for e in export()["starters"][name]["control"] if e.get("by") == by]


# ---------------------------------------------------------------- schémas conformes au cours
def test_star_delta_control_circuit_is_the_one_of_the_course():
    """Q107 : F 95-96, S0, S1 // KM1 13-14 ; 55-56 temporisé à ouverture + KM3 21-22 → KM2 ; 67-68 à fermeture + KM2 21-22 → KM3."""
    assert contacts("etoile-triangle", "F") == [("nc", ("95", "96"))]
    assert contacts("etoile-triangle", "S0") == [("nc", ())]
    assert contacts("etoile-triangle", "S1") == [("no", ())]
    assert contacts("etoile-triangle", "KM1") == [("no", ("13", "14"))]
    assert contacts("etoile-triangle", "KM1T") == [("nc", ("55", "56")), ("no", ("67", "68"))]
    assert contacts("etoile-triangle", "KM3") == [("nc", ("21", "22"))]
    assert contacts("etoile-triangle", "KM2") == [("nc", ("21", "22"))]
    text = (SECTIONS["etoile-triangle"].with_suffix(".fr.md")).read_text(encoding="utf-8")
    for mark in ("95-96", "13-14", "55-56", "67-68", "KM2 (21-22), KM3 (21-22)"):
        assert mark in text, mark
    # chaque bobine est en série avec les contacts que donne la section (l'ordre du circuit, de L1 vers N)
    ctrl = export()["starters"]["etoile-triangle"]["control"]
    coil_of = {e["coil"]: e for e in ctrl if e["kind"] == "coil"}
    assert set(coil_of) == {"KM1", "KM2", "KM3"}


def test_star_delta_power_circuit_joins_the_terminals_like_the_course():
    """KM2 réunit U2, V2, W2 ; KM3 relie U2 à V1, V2 à W1, W2 à U1 ; F est dans la boucle des enroulements."""
    power = export()["starters"]["etoile-triangle"]["power"]
    star = connected(power, {"KM2"})
    assert star("U2") == star("V2") == star("W2")
    assert star("U2") != star("U1")
    delta = connected(power, {"KM3"})
    assert delta("U2") == delta("V1") and delta("V2") == delta("W1") and delta("W2") == delta("U1")
    assert delta("U1") != delta("V1")
    line = connected(power, {"Q", "KM1"})
    assert line("L1") == line("U1") and line("L2") == line("V1") and line("L3") == line("W1")
    heaters = [e for e in power if e["kind"] == "heater"]
    assert len(heaters) == 3
    assert all(e["a"].startswith("f") for e in heaters)  # après U2, V2, W2 : courant d'enroulement, réglage In / √3


def test_part_winding_circuits_are_those_of_the_course():
    """B1, F1 et F2 95-96, S0 en tête ; K1 et K1T ensemble ; contact de K1T à fermeture → K2 ; même ordre des phases."""
    assert contacts("fractionne", "B1") == [("no", ())]
    assert contacts("fractionne", "F1") == [("nc", ("95", "96"))]
    assert contacts("fractionne", "F2") == [("nc", ())]
    assert contacts("fractionne", "K1") == [("no", ("13", "14"))]
    assert contacts("fractionne", "K1T") == [("no", ())]
    power = export()["starters"]["fractionne"]["power"]
    windings = {w: [e for e in power if e["kind"] == "winding" and e["winding"] == w] for w in ("1", "2")}
    assert all(len(v) == 3 for v in windings.values())
    assert {e["b"] for e in windings["1"]} == {"star1"} and {e["b"] for e in windings["2"]} == {"star2"}  # deux étoiles indépendantes
    find = connected(power, {"K1", "K2"})
    first = {find(e["a"]) for e in windings["1"]}
    for phase in ("L1", "L2", "L3"):
        assert find(phase) in first
    # même ordre des phases : chaque phase atteint la même borne des deux bobinages (1U et 2U, 1V et 2V, 1W et 2W)
    order1 = [next(i for i, e in enumerate(windings["1"]) if find(e["a"]) == find(p)) for p in ("L1", "L2", "L3")]
    order2 = [next(i for i, e in enumerate(windings["2"]) if find(e["a"]) == find(p)) for p in ("L1", "L2", "L3")]
    assert order1 == order2 == [0, 1, 2]


# ---------------------------------------------------------------- séquences
def closes(events, who):
    return [e["t"] for e in events if e["who"] == who and e["closed"]]


def opens(events, who):
    return [e["t"] for e in events if e["who"] == who and not e["closed"]]


def test_star_delta_runs_star_then_delta_after_the_timer():
    """1er temps : KM1 et KM2 ; après la temporisation, 55-56 s'ouvre, KM2 retombe, puis KM3 colle."""
    s = scenario("etoile-triangle", "marche")
    ev = s["events"]
    delay = export()["starters"]["etoile-triangle"]["timer"]["delay"]
    km1, km2, km3 = closes(ev, "KM1")[0], closes(ev, "KM2")[0], closes(ev, "KM3")[0]
    assert km1 <= km2 < km1 + 0.5  # KM2 suit KM1 par 55-56, encore fermé
    released = opens(ev, "S1")[0]
    assert released < opens(ev, "KM2")[0] and closes(ev, "KM1") == [km1] and not opens(ev, "KM1")  # auto-maintien par 13-14
    assert opens(ev, "KM2")[0] == pytest.approx(km1 + delay, abs=0.1)
    assert opens(ev, "KM2")[0] < km3  # verrouillage électrique : KM3 attend que KM2 soit ouvert
    assert s["end"]["mode"] == "delta"


def test_star_delta_never_closes_km2_and_km3_together():
    for s in export()["situations"]["etoile-triangle"]:
        assert not any("KM2" in c and "KM3" in c for c in s["combos"]), s["id"]


def test_star_delta_stops_on_s0_or_on_the_thermal_relay():
    for sid in ("arret-en-triangle", "arret-en-etoile", "surcharge"):
        assert scenario("etoile-triangle", sid)["end"]["mode"] == "off", sid
    blocked = scenario("etoile-triangle", "marche-impossible-f-declenche")
    assert not closes(blocked["events"], "KM1")


def test_part_winding_feeds_the_second_winding_one_second_at_most_after_the_first():
    s = scenario("fractionne", "marche")
    ev = s["events"]
    k1, k2 = closes(ev, "K1")[0], closes(ev, "K2")[0]
    assert export()["starters"]["fractionne"]["timer"]["delay"] <= 1
    assert 0 < k2 - k1 <= 1.0 + 0.1  # 1 s au maximum, plus la course du contacteur
    assert s["end"]["mode"] == "full"
    for sc in export()["situations"]["fractionne"]:
        assert "K2" not in sc["combos"], sc["id"]  # jamais le second bobinage seul


def test_part_winding_stops_on_s0_f2_or_b1():
    for sid in ("arret", "surcharge-f2", "surchauffe-b1"):
        s = scenario("fractionne", sid)
        assert s["end"]["mode"] == "off" and not any(s["end"]["coils"].values()), sid


# ---------------------------------------------------------------- publication
@pytest.mark.parametrize("name", ["etoile-triangle", "fractionne-schemas"])
def test_starter_figure_is_published_in_its_section(name):
    from courses.figures import FIGURES

    assert name in FIGURES
    for lang in ("fr", "en"):
        text = SECTIONS[name].with_suffix(f".{lang}.md").read_text(encoding="utf-8")
        assert re.search(rf"^\[\[figure:{name}\]\]$", text, re.M), lang
        fragment = (STATIC / f"{name}.{lang}.html").read_text(encoding="utf-8")
        script = (STATIC / f"{name}.{lang}.js").read_text(encoding="utf-8")
        assert "<script" not in fragment
        assert 'data-schema="control"' in fragment and 'data-schema="power"' in fragment
        assert 'data-act="start"' in fragment and 'data-act="stop"' in fragment
        assert len(fragment.encode()) + len(script.encode()) <= 260_000
        assert not [w for w in ("fetch(", "XMLHttpRequest", "localStorage") if w in script]
