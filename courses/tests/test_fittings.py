"""Raccords et tailles de tubes (Partie 4, modules 2 à 4) : US-73 à US-86, décisions Q73 à Q88.

Le catalogue `figures/_data/raccords.mjs` est la seule source des situations d'entraînement des trois figures
(`raccords`, `choix-raccord`, `tailles-tuyaux`). Son export JSON (`node figures/_data/export.mjs --stdout`) est vérifié
ici par des règles d'atelier écrites indépendamment du générateur : aucune situation tirée ne doit être irréalisable.
"""

import json
import math
import re
import shutil
import subprocess
from fractions import Fraction
from functools import lru_cache
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "figures" / "_data"
EXERCISES = ("raccords", "choix-raccord", "tailles-tuyaux")
BRANDS = re.compile(r"geberit|lokring|nicoll|testo\b|klixon|fr[ée]on|abcclim|legrand|schneider", re.IGNORECASE)


@lru_cache(maxsize=1)
def exported():
    node = shutil.which("node")
    if node is None:
        pytest.skip("node absent : il produit les figures et l'export du catalogue")
    return subprocess.run(
        [node, str(DATA / "export.mjs")], capture_output=True, check=True, encoding="utf-8", cwd=ROOT
    ).stdout


@lru_cache(maxsize=1)
def catalogue():
    return json.loads(exported())


@lru_cache(maxsize=None)
def series(material):
    return tuple(s["id"] for s in catalogue()["materials"][material]["sizes"])


@lru_cache(maxsize=None)
def _sizes(material):
    return {s["id"]: s for s in catalogue()["materials"][material]["sizes"]}


def size(material, size_id):
    return _sizes(material)[size_id]


def step(material, a, b):
    ids = series(material)
    return ids.index(a) - ids.index(b)


# ------------------------------------------------------------------ règles d'atelier, écrites sans le générateur
MODES = {
    "cuivre-pouce": {"braser", "sertir", "dudgeon"},
    "cuivre-metrique": {"braser", "sertir"},
    "acier": {"filete"},
    "pvc": {"coller"},
    "gaine": {"emboiter"},
}
ANGLES = {"braser": {45, 90, 180}, "sertir": {45, 90, 180}, "coller": {45, 90}, "filete": {45, 90}, "dudgeon": {90, 135}}
THREADED = {"dudgeon", "filete"}
CONSTRAINT_MODE = {
    "permanent": "braser", "sans-flamme": "sertir", "demontable": "dudgeon",
    "colle": "coller", "emboite": "emboiter", "filete": "filete",
}
PRESENT_NEEDS = {"tube": "F", "tube-evase": "M", "port-male": "F", "port-femelle": "M", "tube-filete": "F"}
FUNCTIONS = {"manchon": "prolonger", "reduction": "changer-diametre", "coude": "changer-direction", "te": "deriver"}


def mode_range_ok(material, mode, size_id):
    if material == "cuivre-pouce":
        n = size(material, size_id)["sixteenths"]
        return {"dudgeon": 4 <= n <= 12, "sertir": 4 <= n <= 18}.get(mode, True)
    if material == "cuivre-metrique" and mode == "sertir":
        return 6 <= size(material, size_id)["od"] <= 28
    return True


def fitting_problems(f):
    """Liste les raisons pour lesquelles ce raccord n'existe pas en atelier (vide s'il existe)."""
    material, mode, kind, sizes, ends, angle = f["material"], f["mode"], f["type"], f["sizes"], f["ends"], f.get("angle")
    problems = []
    if mode not in MODES.get(material, ()):
        return [f"{mode} sur {material}"]
    if any(s not in series(material) for s in sizes):
        return [f"taille hors série {sizes}"]
    if not all(mode_range_ok(material, mode, s) for s in sizes):
        problems.append(f"{mode} hors plage {sizes}")
    if material == "gaine" and kind != "manchon":
        problems.append("gaine : manchon seulement")
    if kind in ("manchon", "coude"):
        problems += [] if len(sizes) == 2 and sizes[0] == sizes[1] else ["tailles inégales"]
    elif kind == "reduction":
        problems += [] if len(sizes) == 2 and 1 <= abs(step(material, *sizes)) <= 3 else ["réduction de plus de trois tailles"]
    elif kind == "te":
        ok = len(sizes) == 3 and sizes[0] == sizes[1] and 0 <= step(material, sizes[2], sizes[0]) * -1 <= 2
        problems += [] if ok else ["té : dérivation plus grosse ou trop petite"]
    else:
        problems.append(f"type inconnu {kind}")
    if kind == "coude":
        if angle not in ANGLES[mode]:
            problems.append(f"coude {angle}° en {mode}")
        if angle == 135 and (sizes[0] != "1/4" or ends != ["M", "M"]):
            problems.append("coude 135° : laiton 1/4 mâle/mâle seulement")
    elif angle is not None:
        problems.append("angle sur un raccord droit")
    if len(ends) != len(sizes) or any(e not in ("M", "F") for e in ends):
        problems.append("extrémités")
    elif mode not in THREADED:
        problems += [] if set(ends) == {"F"} else ["genre sur un raccord à emboîtement"]
    elif mode == "dudgeon":
        if kind == "coude" and ends == ["F", "F"]:
            problems.append("coude dudgeon femelle/femelle")
        if kind == "te" and ends not in (["M", "M", "M"], ["M", "M", "F"]):
            problems.append("té dudgeon")
    elif mode == "filete":
        if kind == "coude" and ends == ["M", "M"]:
            problems.append("coude acier mâle/mâle")
        if kind == "te" and ends != ["F", "F", "F"]:
            problems.append("té acier")
    return problems


def situations(figure):
    return catalogue()["situations"][figure]


def all_fittings():
    for s in situations("choix-raccord"):
        yield from [s["answer"], *s["options"]]
    for s in situations("raccords"):
        yield s["fitting"]


# ------------------------------------------------------------------ US-77, US-78, Q80 : le modèle de données

def test_inch_series_counts_in_sixteenths_of_an_inch():
    """US-78, Q77 : 3/16 à 1 1/8, chaque taille = n seizièmes, diamètre = n × 25,4 / 16 à 0,01 mm."""
    sizes = catalogue()["materials"]["cuivre-pouce"]["sizes"]
    assert [s["sixteenths"] for s in sizes] == [3, 4, 5, 6, 8, 10, 12, 14, 18]
    for s in sizes:
        assert abs(s["od"] - s["sixteenths"] * 25.4 / 16) <= 0.005 + 1e-9, s["id"]
        whole, _, frac = s["id"].rpartition(" ")
        assert int(whole or 0) + Fraction(frac) == Fraction(s["sixteenths"], 16), s["id"]
        assert abs(s["sixteenths"] * 1.6 - s["od"]) <= 0.3, f"{s['id']} : la règle n × 1,6 mm doit rester juste"


def test_catalogue_holds_the_real_tubes_of_the_fitter():
    """US-79, Q74 : cuivre métrique, PVC des condensats et de l'évacuation, gaines ICTA, multicouche réservé à l'eau."""
    materials = catalogue()["materials"]
    assert [s["od"] for s in materials["pvc"]["sizes"]] == [16, 20, 32, 40, 50, 63, 100]
    assert [s["od"] for s in materials["gaine"]["sizes"]] == [16, 20, 25]
    assert [s["od"] for s in materials["cuivre-metrique"]["sizes"]] == [6, 8, 10, 12, 14, 16, 20, 22, 28, 36]
    assert materials["multicouche"]["fluid"] == "eau"
    assert all(m["label"]["fr"] and m["label"]["en"] for m in materials.values())
    for material in ("cuivre-pouce", "pvc", "gaine", "multicouche"):
        assert all(s.get("usage") for s in materials[material]["sizes"]), material


def test_every_fitting_drawn_exists_in_the_workshop():
    """US-77, Q75, Q80 : aucun PVC en pouces, aucun dudgeon sur PVC, aucun coude à 20°, aucune réduction 1/4 → 1 1/8."""
    bad = {}
    for f in all_fittings():
        problems = fitting_problems(f)
        if problems:
            bad[json.dumps(f, sort_keys=True)] = problems
    assert not bad, list(bad.items())[:5]
    angles = {f.get("angle") for f in all_fittings()} - {None}
    assert angles == {45, 90, 135, 180}


def test_multilayer_never_carries_refrigerant():
    """Q63, Q74 : le multicouche n'apparaît jamais comme raccord ni comme tube d'une situation de raccordement."""
    assert all(f["material"] != "multicouche" for f in all_fittings())
    assert all(e["material"] != "multicouche" for s in situations("choix-raccord") for e in s["ends"])


def test_chosen_fitting_fits_both_tube_ends():
    """US-76, Q76 : tailles, genres, géométrie et mode d'assemblage du raccord attendu découlent des tubes donnés."""
    for s in situations("choix-raccord"):
        answer, ends = s["answer"], s["ends"]
        assert {e["material"] for e in ends} == {answer["material"]}, s["key"]
        assert answer["sizes"] == [e["size"] for e in ends], s["key"]
        assert answer["ends"] == [PRESENT_NEEDS[e["present"]] for e in ends], s["key"]
        assert answer["mode"] == CONSTRAINT_MODE[s["constraint"]], s["key"]
        expected_type = {"derivation": "te"}.get(s["geometry"])
        if s["geometry"] == "droit":
            expected_type = "manchon" if ends[0]["size"] == ends[1]["size"] else "reduction"
        elif expected_type is None:
            expected_type = "coude"
            assert answer["angle"] == int(s["geometry"]), s["key"]
        assert answer["type"] == expected_type, s["key"]


@pytest.mark.parametrize("figure", EXERCISES)
def test_each_situation_offers_three_or_four_distinct_options_with_one_answer(figure):
    """US-74, US-76, US-80, Q79 : réponse au toucher parmi 3 ou 4 propositions, une seule bonne."""
    for s in situations(figure):
        keys = [json.dumps(o, sort_keys=True) for o in s["options"]]
        assert 3 <= len(keys) <= 4 and len(set(keys)) == len(keys), s["key"]
        assert keys.count(json.dumps(s["answer"], sort_keys=True)) == 1, s["key"]


@pytest.mark.parametrize("figure", EXERCISES)
def test_each_exercise_figure_offers_a_thousand_distinct_situations(figure):
    """US-77, Q88 : au moins 1 000 situations distinctes par figure, pour ne pas apprendre les réponses par cœur."""
    keys = [s["key"] for s in situations(figure)]
    assert len(set(keys)) == len(keys)
    assert len(keys) >= 1000, len(keys)


@pytest.mark.parametrize("figure", EXERCISES)
def test_series_can_climb_four_levels_of_difficulty(figure):
    """US-76, Q79 : séries de 10 à difficulté croissante, chaque niveau 1 à 4 assez fourni pour une série."""
    levels = [s["level"] for s in situations(figure)]
    assert set(levels) == {1, 2, 3, 4}
    assert min(levels.count(n) for n in (1, 2, 3, 4)) >= 10


def test_recognition_answers_follow_the_drawn_fitting():
    """US-74 : nom, fonction, mode d'assemblage ou matériau du raccord dessiné."""
    kinds = set()
    for s in situations("raccords"):
        f, kind = s["fitting"], s["kind"]
        kinds.add(kind)
        expected = {
            "nom": {"type": f["type"], "angle": f.get("angle"), "ends": f["ends"]},
            "fonction": FUNCTIONS[f["type"]],
            "assemblage": f["mode"],
            "materiau": f["material"],
        }[kind]
        assert s["answer"] == expected, s["key"]
    assert kinds == {"nom", "fonction", "assemblage", "materiau"}


def test_size_answers_follow_the_catalogue():
    """US-78 à US-81 : conversions, seizièmes, comparaison, règle, usage et outil justes."""
    kinds = set()
    for s in situations("tailles-tuyaux"):
        kind = s["kind"]
        kinds.add(kind)
        if kind in ("pouce-mm", "mm-pouce", "seiziemes"):
            ref = size("cuivre-pouce", s["size"])
            expected = {"pouce-mm": ref["od"], "mm-pouce": ref["id"], "seiziemes": f"{ref['sixteenths']}/16"}[kind]
        elif kind in ("plus-gros", "plus-petit"):
            ods = [size(t["material"], t["size"])["od"] for t in s["tubes"]]
            assert len(ods) == 3 and len(set(ods)) == 3 and max(ods) / min(ods) <= 2, s["key"]
            assert s["options"] == s["tubes"], s["key"]
            pick = max if kind == "plus-gros" else min
            expected = pick(s["tubes"], key=lambda t: size(t["material"], t["size"])["od"])
        elif kind == "regle":
            expected = {"material": s["tube"]["material"], "size": s["tube"]["size"]}
        elif kind == "usage":
            expected = size(s["tube"]["material"], s["tube"]["size"])["usage"]
        elif kind == "tube-pour-usage":
            assert size(s["answer"]["material"], s["answer"]["size"])["usage"] == s["usage"], s["key"]
            others = [o for o in s["options"] if o != s["answer"]]
            assert all(size(o["material"], o["size"])["usage"] != s["usage"] for o in others), s["key"]
            expected = s["answer"]
        elif kind.startswith("outil-"):
            tool = catalogue()["tools"][kind.removeprefix("outil-")]
            assert s["tube"]["size"] in tool["sizes"][s["tube"]["material"]], s["key"]
            expected = s["tube"]["size"]
        else:
            pytest.fail(f"type de situation inconnu : {kind}")
        assert s["answer"] == expected, s["key"]
    assert {"pouce-mm", "mm-pouce", "seiziemes", "plus-gros", "plus-petit", "regle", "usage", "tube-pour-usage"} <= kinds
    assert {"outil-dudgeonniere", "outil-cintreuse", "outil-elargisseur", "outil-ecrou"} <= kinds


def test_usages_of_each_inch_size_are_distinct_and_bilingual():
    """US-79 : un usage réel par taille de la série pouce, en fr et en en."""
    usages = catalogue()["usages"]
    inch = [s["usage"] for s in catalogue()["materials"]["cuivre-pouce"]["sizes"]]
    assert all(usages[u]["fr"] and usages[u]["en"] for u in usages)
    assert set(inch) <= set(usages)


def test_catalogue_names_no_manufacturer():
    """Q62 : aucune marque dans le catalogue ni dans les situations."""
    assert not BRANDS.search(exported() + (DATA / "raccords.mjs").read_text(encoding="utf-8"))


def test_tool_sizes_belong_to_the_tube_series():
    """US-81, Q84 : dudgeonnière, cintreuse, élargisseur et écrou portent des tailles de tube du catalogue."""
    tools = catalogue()["tools"]
    assert set(tools) == {"dudgeonniere", "cintreuse", "elargisseur", "ecrou"}
    for name, tool in tools.items():
        assert tool["label"]["fr"] and tool["label"]["en"], name
        for material, ids in tool["sizes"].items():
            assert ids and set(ids) <= set(series(material)), (name, material)
    assert math.isclose(size("cuivre-pouce", "3/8")["od"], 9.52, abs_tol=0.01)


# ------------------------------------------------------------------ US-82, US-84, Q82, Q83 : sections et progression
CONTENT = ROOT / "content" / "froid"
SUPPLEMENTS = {2: "04-choisir-raccord", 3: "04-retenir-tailles"}


def real_module(number):
    manifest = json.loads((CONTENT / "formation.json").read_text(encoding="utf-8"))
    part = next(p for p in manifest["parties"] if p["slug"] == "p4")
    return next(m for m in part["modules"] if m["order"] == number)


@pytest.mark.parametrize("number", sorted(SUPPLEMENTS))
def test_written_supplement_comes_just_before_the_practical_activity(number):
    """US-82, Q82 : Complément à l'ordre 4, TAF à l'ordre 5, texte fr et en."""
    sections = {s["order"]: s for s in real_module(number)["sections"]}
    supplement, taf = sections[4], sections[5]
    assert (supplement["file"], supplement["kind"], supplement.get("supplement")) == (SUPPLEMENTS[number], "content", True)
    assert (taf["file"], taf["kind"], bool(taf.get("supplement"))) == ("05-taf", "practical", False)
    assert all(supplement["title"][lang] for lang in ("fr", "en"))
    for lang in ("fr", "en"):
        assert (CONTENT / "p4" / f"m{number}" / f"{SUPPLEMENTS[number]}.{lang}.md").read_text(encoding="utf-8").strip()


@pytest.mark.django_db
def test_reimport_moves_a_seen_practical_activity_to_the_supplement_and_keeps_attempts(tmp_path, learner):
    """US-84, Q83 : la ligne d'ordre 4 devient le Complément (« vu » conservé), la TAF est à revoir, le quiz reste acquis."""
    from django.core.management import call_command

    from assessments.models import Assessment, Attempt
    from assessments.services import start_attempt, submit_attempt
    from courses.models import Module
    from progress.models import SectionView
    from progress.services import mark_section_viewed, module_completed

    folder = tmp_path / "p4" / "m2"
    folder.mkdir(parents=True)
    for name in ("01-cours", "04-taf", "04-choisir-raccord", "05-taf"):
        for lang in ("fr", "en"):
            (folder / f"{name}.{lang}.md").write_text(f"{name} {lang}", encoding="utf-8")
    question = {
        "id": "p4-m2-q01", "type": "truefalse", "usage": "quiz", "reviewed": {"fr": True, "en": True},
        "prompt": {"fr": "Vrai ?", "en": "True?"}, "explanation": {"fr": "Oui.", "en": "Yes."},
        "choices": [{"text": {"fr": "Vrai", "en": "True"}, "correct": True}, {"text": {"fr": "Faux", "en": "False"}, "correct": False}],
    }
    (folder / "questions.json").write_text(json.dumps([question]), encoding="utf-8")
    title = {"fr": "Titre", "en": "Title"}

    def import_with(sections):
        module = {"order": 2, "dir": "p4/m2", "title": title, "duration_hours": 8, "sections": sections}
        manifest = {"slug": "froid", "title": title, "parties": [{"slug": "p4", "order": 4, "title": title, "modules": [module]}]}
        path = tmp_path / "formation.json"
        path.write_text(json.dumps(manifest), encoding="utf-8")
        call_command("import_content", str(path), publish=True, verbosity=0)
        return Module.objects.get(partie__slug="p4", order=2)

    course = {"order": 1, "file": "01-cours", "kind": "content", "title": title}
    module = import_with([course, {"order": 4, "file": "04-taf", "kind": "practical", "title": title}])
    for section in module.sections.all():
        mark_section_viewed(learner, section)
    submit_attempt(start_attempt(learner, Assessment.quiz_for(module)))
    assert module_completed(learner, module)

    module = import_with([
        course,
        {"order": 4, "file": "04-choisir-raccord", "kind": "content", "supplement": True, "title": title},
        {"order": 5, "file": "05-taf", "kind": "practical", "title": title},
    ])
    seen = set(SectionView.objects.filter(user=learner).values_list("section__order", flat=True))
    assert seen == {1, 4}
    assert module.sections.get(order=4).is_supplement
    assert not module_completed(learner, module)
    assert Attempt.objects.filter(user=learner, submitted_at__isnull=False).count() == 1


# ------------------------------------------------------------------ US-82, US-86, Q76, Q81 : banque de questions
def bank(number):
    return json.loads((CONTENT / "p4" / f"m{number}" / "questions.json").read_text(encoding="utf-8"))


def test_choice_of_fitting_question_expects_the_five_criteria():
    """US-82, Q76 : « De quoi dépend le choix d'un type de raccord ? » devient un QCM à plusieurs réponses."""
    question = next(q for q in bank(2) if q["id"] == "p4-m2-q08")
    assert question["type"] == "multiple"
    right = " ".join(c["text"]["fr"].lower() for c in question["choices"] if c["correct"])
    wrong = [c for c in question["choices"] if not c["correct"]]
    assert sum(c["correct"] for c in question["choices"]) == 5 and len(wrong) >= 2
    for criterion in ("matériau", "diamètre", "fonction", "assemblage", "fluide"):
        assert criterion in right, criterion


@pytest.mark.parametrize("number", (2, 3, 4))
def test_four_new_quiz_and_four_new_exam_questions_per_module(number):
    """US-82, Q81 : q17 à q24, 4 de quiz puis 4 d'examen, relues fr et en, publiables."""
    new = [q for q in bank(number) if int(q["id"].rsplit("q", 1)[1]) >= 17]
    assert [q["id"] for q in new] == [f"p4-m{number}-q{n}" for n in range(17, 25)]
    assert [q["usage"] for q in new] == ["quiz"] * 4 + ["exam"] * 4
    for q in new:
        assert q["reviewed"] == {"fr": True, "en": True}, q["id"]
        right = sum(c["correct"] for c in q["choices"])
        assert {"single": right == 1, "multiple": right >= 2, "truefalse": right == 1 and len(q["choices"]) == 2}[q["type"]], q["id"]
        assert all(c["text"]["fr"] and c["text"]["en"] for c in q["choices"]), q["id"]


def test_new_questions_cover_criteria_sixteenths_uses_and_tools():
    """US-78, US-79, US-81, Q81 : seizièmes, usages réels, confusions de diamètres et outils au diamètre du tube."""
    def text(number, section):
        return " ".join(json.dumps(q, ensure_ascii=False) for q in bank(number) if q["section"] == section).lower()

    assert "critère" in text(2, "04-choisir-raccord") or "mâle" in text(2, "04-choisir-raccord")
    sizes = text(3, "04-retenir-tailles")
    assert all(word in sizes for word in ("seizième", "1,6", "condensats", "gaine"))
    assert "dudgeonnière" in text(4, "03-evasements")


# ------------------------------------------------------------------ US-83, Q86 : anglais et glossaire
GLOSSARY = [
    ("manchon", "coupling"), ("té", "tee"), ("coude", "elbow"), ("réduction", "reducer"), ("mâle", "male"),
    ("femelle", "female"), ("raccord union", "union"), ("écrou dudgeon", "flare nut"),
    ("diamètre extérieur", "outside diameter (od)"), ("gaine icta", "flexible conduit"),
]


def test_glossary_gives_the_fitting_terms_in_both_languages():
    """US-83, Q86 : une ligne par terme du tableau fr | en, dans les deux fichiers du glossaire de p4/m1."""
    for lang in ("fr", "en"):
        rows = {
            tuple(cell.strip().lower() for cell in line.strip("| \n").split("|"))
            for line in (CONTENT / "p4" / "m1" / f"01-glossaire.{lang}.md").read_text(encoding="utf-8").splitlines()
            if line.startswith("|")
        }
        missing = [pair for pair in GLOSSARY if pair not in rows]
        assert not missing, (lang, missing)


@pytest.mark.parametrize("number", sorted(SUPPLEMENTS))
def test_english_supplement_quotes_the_french_term_at_first_use(number):
    """US-83, Q68 : terme français entre parenthèses, marqué `lang="fr"`, dans chaque Complément anglais."""
    text = (CONTENT / "p4" / f"m{number}" / f"{SUPPLEMENTS[number]}.en.md").read_text(encoding="utf-8")
    assert '(<span lang="fr">' in text


# ------------------------------------------------------------------ US-85, Q80, Q82, Q83 : journal du formateur
FIELDS = ("**Page**", "**Texte d'origine**", "**Correction**", "**Justification**")


def log_entries():
    log = (CONTENT / "p4" / "CORRECTIONS.md").read_text(encoding="utf-8")
    return {title: body for title, body in re.findall(r"^## \d+\. (.+?)\n(.*?)(?=^## |\Z)", log, flags=re.M | re.S)}


@pytest.mark.parametrize("topic", [
    "Choisir un raccord (module 2", "Retenir les tailles de tubes (module 3",
    "Question sur le choix d'un raccord (module 2", "Sections vues des modules 2 et 3",
])
def test_corrections_log_records_each_written_addition_with_its_four_fields(topic):
    """US-85 : Compléments rédigés, question reformulée et effet sur les « vu », chacun avec ses quatre champs."""
    entry = next((body for title, body in log_entries().items() if title.startswith(topic)), None)
    assert entry is not None, topic
    assert all(field in entry for field in FIELDS), topic


def test_corrections_log_lists_the_catalogue_values_to_confirm():
    """US-85, Q80 : usages par taille, diamètres de PVC et de gaine à confirmer par un formateur."""
    to_confirm = (CONTENT / "p4" / "CORRECTIONS.md").read_text(encoding="utf-8").split("## Valeurs à confirmer", 1)[1]
    for words in ("usages par taille", "PVC", "gaine", "figures/_data/raccords.mjs"):
        assert words in to_confirm, words


def test_handout_sentence_on_the_choice_of_fitting_stays_transcribed():
    """Q76 : la phrase du support reste dans la section transcrite, les critères sont dans le Complément."""
    text = (CONTENT / "p4" / "m2" / "03-sans-flamme.fr.md").read_text(encoding="utf-8")
    assert "dépend du circuit sur lequel on travaille et des objectifs à atteindre" in text


# ------------------------------------------------------------------ US-73, US-76, US-80, US-81, Q78, Q84, Q85 : figures
TRAINING = ("raccords", "choix-raccord", "tailles-tuyaux")
STATIC = ROOT / "static" / "acad" / "figures"


@pytest.mark.parametrize("name", TRAINING)
def test_training_figure_is_registered_light_and_never_writes_to_the_server(name):
    """Q73, Q85 : figure enregistrée, ≤ 160 Ko bruts par langue (fragment + script), aucun envoi ni stockage."""
    from courses.figures import FIGURES

    assert name in FIGURES
    for lang in ("fr", "en"):
        fragment = (STATIC / f"{name}.{lang}.html").read_bytes()
        script = (STATIC / f"{name}.{lang}.js").read_text(encoding="utf-8")
        assert len(fragment) + len(script.encode("utf-8")) <= 160_000, lang
        for forbidden in ("fetch(", "XMLHttpRequest", "sendBeacon", "localStorage", "WebSocket"):
            assert forbidden not in script, (lang, forbidden)


def test_flaring_section_opens_the_size_figure_in_tool_mode():
    """US-81, Q84 : `[[figure:tailles-tuyaux#outils]]` dans « Évasements », placeholder marqué data-mode."""
    from django.utils import translation

    from courses.rendering import render_markdown

    for lang in ("fr", "en"):
        text = (CONTENT / "p4" / "m4" / f"03-evasements.{lang}.md").read_text(encoding="utf-8")
        assert re.search(r"^\[\[figure:tailles-tuyaux#outils\]\]$", text, re.M), lang
    with translation.override("fr"):
        html = render_markdown("[[figure:tailles-tuyaux#outils]]")
    assert 'data-figure="tailles-tuyaux"' in html and 'data-mode="outils"' in html


def test_figure_mode_suffix_cannot_inject_anything():
    """Q85, sécurité : le mode est limité à [a-z] ; sinon le marqueur disparaît."""
    from courses.rendering import render_markdown

    for text in ('[[figure:tailles-tuyaux#x" onclick="y]]', "[[figure:tailles-tuyaux#OUTILS]]", "[[figure:tailles-tuyaux#../x]]"):
        html = render_markdown(text)
        assert "live-figure" not in html, text
        assert not re.search(r"\son[a-z]+=", html)
    assert "data-mode" not in render_markdown("[[figure:raccords]]")


def test_bending_section_sends_the_learner_to_the_tool_figure():
    """US-81, Q84 : « Cintrage » renvoie à la figure de la section « Évasements »."""
    for lang, words in (("fr", "Évasements"), ("en", "Flaring")):
        text = (CONTENT / "p4" / "m4" / f"04-cintrage.{lang}.md").read_text(encoding="utf-8")
        assert words in text and ("figure" in text.lower()), lang


def test_part_four_now_calls_eleven_figures():
    """Q78, Q89 : 7 figures de Q69 + 3 figures d'entraînement aux raccords et aux tailles + la longueur développée."""
    names = {m.split("#")[0] for md in (CONTENT / "p4").rglob("*.fr.md") for m in re.findall(r"\[\[figure:([^\]]*)\]\]", md.read_text(encoding="utf-8"))}
    assert len(names) == 11 and set(TRAINING) | {"longueur-developpee"} <= names


@pytest.mark.parametrize("name", TRAINING)
def test_figure_buttons_wait_for_their_script(name):
    """Q79 : un toucher avant la fin du chargement ne se perd pas ; les boutons du fragment partent désactivés,
    le script les active quand la figure est prête."""
    for lang in ("fr", "en"):
        fragment = (STATIC / f"{name}.{lang}.html").read_text(encoding="utf-8")
        buttons = re.findall(r"<button\b[^>]*>", fragment)
        assert buttons and all(" disabled" in b for b in buttons), lang
        assert "ready()" in (STATIC / f"{name}.{lang}.js").read_text(encoding="utf-8"), lang
