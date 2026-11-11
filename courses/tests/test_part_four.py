"""Partie 4 (US-50 à US-72). Stories backend sur un manifeste de test ; le contenu réel arrive avec les jalons J1 à J3."""
import csv
import io
import json
import re
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from django.core.management import call_command

from assessments.models import Assessment, Question
from assessments.services import ExamLocked, start_attempt, submit_attempt
from courses.models import Formation, Partie
from progress.services import exam_unlocked, mark_section_viewed

T0 = datetime(2026, 11, 11, 8, 0, tzinfo=timezone.utc)
TITLE = {"fr": "Titre", "en": "Title"}


def bank_question(module, number):
    return {
        "id": f"p4-m{module}-q{number:02d}",
        "type": "single",
        "usage": "quiz" if number <= 8 else "exam",
        "prompt": {"fr": f"Question {number}", "en": f"Question {number}"},
        "explanation": {"fr": "Parce que.", "en": "Because."},
        "reviewed": {"fr": True, "en": True},
        "choices": [
            {"text": {"fr": "Oui", "en": "Yes"}, "correct": True},
            {"text": {"fr": "Non", "en": "No"}, "correct": False},
        ],
    }


SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>'
BODIES = {
    "fr": "![Vannes 1 à 4 du manifold](img/vannes.svg)\n\n[[figure:couplage]]\n",
    "en": "![Manifold valves 1 to 4](img/vannes.svg)\n\n[[figure:couplage]]\n",
}


def part_four_module(root, number):
    module_dir = root / "p4" / f"m{number}"
    module_dir.mkdir(parents=True)
    if number == 15:  # le module d'essai porte un schéma et une figure
        (module_dir / "img").mkdir()
        (module_dir / "img" / "vannes.svg").write_text(SVG, encoding="utf-8")
    for lang in ("fr", "en"):
        (module_dir / f"01-cours.{lang}.md").write_text(BODIES[lang] if number == 15 else "Texte.", encoding="utf-8")
        (module_dir / f"02-taf.{lang}.md").write_text("Consignes.", encoding="utf-8")
        (module_dir / f"03-complement.{lang}.md").write_text("Rédigé.", encoding="utf-8")
    (module_dir / "questions.json").write_text(
        json.dumps([bank_question(number, q) for q in range(1, 17)]), encoding="utf-8"
    )
    sections = [
        {"order": 1, "file": "01-cours", "kind": "content", "title": TITLE},
        {"order": 2, "file": "02-taf", "kind": "practical", "title": {"fr": "Activités", "en": "Activities"}},
    ]
    if number == 1:
        sections.append(
            {"order": 3, "file": "03-complement", "kind": "content", "supplement": True, "title": {"fr": "Glossaire", "en": "Glossary"}}
        )
    return {
        "order": number,
        "dir": f"p4/m{number}",
        "title": {"fr": f"Module {number}", "en": f"Module {number}"},
        "duration_hours": 16 if number in (4, 6) else 8,
        "sections": sections,
    }


@pytest.fixture
def manifest_path(tmp_path):
    """Formation à 4 parties, dont une Partie 4 à 18 modules de 8 + 8 questions relues, comme le PRD."""
    earlier = [
        {"slug": f"p{n}", "order": n, "title": TITLE, "modules": [{"order": 1, "title": TITLE, "dir": f"p{n}/m1"}]}
        for n in (1, 2, 3)
    ]
    part_four = {
        "slug": "p4",
        "order": 4,
        "title": {"fr": "Partie 4", "en": "Part 4"},
        "exam": {"questions_per_module": 3, "duration_minutes": 90},
        "modules": [part_four_module(tmp_path, n) for n in range(1, 19)],
    }
    path = tmp_path / "formation.json"
    path.write_text(json.dumps({"slug": "froid", "title": TITLE, "parties": [*earlier, part_four]}), encoding="utf-8")
    return path


@pytest.fixture
def partie(db, manifest_path):
    call_command("import_content", str(manifest_path), publish=True, verbosity=0)
    return Partie.objects.get(slug="p4")


def finish_modules(learner, modules):
    for module in modules:
        for section in module.sections.all():
            mark_section_viewed(learner, section)
        submit_attempt(start_attempt(learner, Assessment.quiz_for(module)))


@pytest.fixture
def exam_ready(partie, learner):
    finish_modules(learner, partie.modules.order_by("order"))
    return Assessment.exam_for(partie)


@pytest.mark.django_db
def test_import_with_publish_creates_the_part_four_exam_and_puts_its_288_questions_online(partie):
    """US-71, Q58, Q60 : un seul import --publish suffit, sans réglage à la main."""
    exam = Assessment.exam_for(partie)
    assert (exam.questions_per_module, exam.duration_minutes, exam.pass_threshold, exam.max_attempts, exam.shuffle) == (
        3, 90, 70, 3, True,
    )
    questions = Question.objects.filter(module__partie=partie)
    assert questions.filter(status=Question.Status.PUBLISHED).count() == 288
    assert not questions.exclude(status=Question.Status.PUBLISHED).exists()


@pytest.mark.django_db
def test_part_four_attempt_draws_fifty_four_questions_three_per_module_for_ninety_minutes(exam_ready, learner):
    """US-67, Q58 : 18 modules × 3 = 54 questions ; le chrono serveur vaut 90 min."""
    attempt = start_attempt(learner, exam_ready, now=T0)
    drawn = list(attempt.attempt_questions.select_related("question"))
    assert len(drawn) == 54
    assert set(Counter(aq.question.module_id for aq in drawn).values()) == {3}
    assert attempt.deadline == T0 + timedelta(minutes=90)


@pytest.mark.django_db
def test_second_part_four_attempt_draws_entirely_new_questions(exam_ready, learner):
    """US-67, Q59 : avec 8 questions d'examen par module, la tentative suivante écarte les 3 déjà vues."""
    first = start_attempt(learner, exam_ready, now=T0)
    seen = set(first.attempt_questions.values_list("question_id", flat=True))
    submit_attempt(first, now=T0 + timedelta(minutes=5))
    second = start_attempt(learner, exam_ready, now=T0 + timedelta(hours=1))
    assert seen.isdisjoint(second.attempt_questions.values_list("question_id", flat=True))


@pytest.mark.django_db
def test_part_four_exam_stays_locked_until_the_eighteenth_module_is_finished(partie, learner):
    """US-67, Q9 : 17 modules terminés ne suffisent pas."""
    modules = list(partie.modules.order_by("order"))
    finish_modules(learner, modules[:17])
    with pytest.raises(ExamLocked):
        start_attempt(learner, Assessment.exam_for(partie), now=T0)
    finish_modules(learner, modules[17:])
    assert exam_unlocked(learner, partie)


@pytest.mark.django_db
def test_changing_the_exam_duration_spares_an_attempt_already_open(exam_ready, learner, manifest_path):
    """PRD, Assessment p4 : un import qui change la durée ne touche pas le chrono d'une tentative en cours."""
    attempt = start_attempt(learner, exam_ready, now=T0)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["parties"][-1]["exam"]["duration_minutes"] = 120
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    call_command("import_content", str(manifest_path), publish=True, verbosity=0)
    exam_ready.refresh_from_db()
    assert exam_ready.duration_minutes == 120
    resumed = start_attempt(learner, exam_ready, now=T0 + timedelta(minutes=10))
    assert (resumed.pk, resumed.deadline) == (attempt.pk, T0 + timedelta(minutes=90))


@pytest.fixture
def trainer_client(partie, client, learner):
    from accounts.models import Promotion, User

    promotion = Promotion.objects.create(name="Nov 2026", formation=Formation.objects.get(slug="froid"))
    learner.promotion = promotion
    learner.save()
    trainer = User.objects.create_user(username="formateur4", password="x-Secret-123", role=User.Role.TRAINER)
    promotion.trainers.add(trainer)
    client.force_login(trainer)
    return client


PART_FOUR_LABELS = [
    "4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9",
    "4.10", "4.11", "4.12", "4.13", "4.14", "4.15", "4.16", "4.17", "4.18",
]


@pytest.mark.django_db
def test_trainer_table_numbers_the_part_four_columns_from_4_1_to_4_18(trainer_client):
    """US-69 : 4.10 vient après 4.9, et l'examen de la Partie 4 a sa colonne."""
    response = trainer_client.get("/fr/formateur/")
    labels = [c["label"] for t in response.context["tables"] for c in t["columns"]]
    assert labels[-18:] == PART_FOUR_LABELS
    assert [p.slug for t in response.context["tables"] for p in t["parties"]][-1] == "p4"


@pytest.mark.django_db
def test_trainer_csv_export_has_one_column_per_part_four_module(trainer_client):
    """US-69 : mêmes repères que le tableau, examen compris, et chaque ligne a autant de cellules que l'en-tête."""
    content = trainer_client.get("/fr/formateur/export.csv").content.decode("utf-8-sig")
    header, row = list(csv.reader(io.StringIO(content), delimiter=";"))[:2]
    positions = [header.index(f"{label} Module {label.split('.')[1]}") for label in PART_FOUR_LABELS]
    assert positions == sorted(positions)
    assert "Examen Partie 4 (%)" in header
    assert len(row) == len(header)


@pytest.fixture
def learner_client(partie, client, learner):
    from accounts.models import Promotion

    learner.promotion = Promotion.objects.create(name="Nov 2026", formation=Formation.objects.get(slug="froid"))
    learner.save()
    client.force_login(learner)
    return client


def section_of(partie, module, order):
    return partie.modules.get(order=module).sections.get(order=order)


def part_four_block(page):
    return page[page.index("Partie 4"):]


@pytest.mark.django_db
def test_my_courses_shows_part_four_with_its_modules_hours_and_next_module(learner_client, learner, partie):
    """US-50, Q55 : 18 modules, 160 h (deux modules de 16 h), et « Continuer » suit la progression."""
    modules = list(partie.modules.order_by("order"))
    block = part_four_block(learner_client.get("/fr/").content.decode())
    assert "18 modules" in block and "160 h" in block
    assert f'href="/fr/modules/{modules[0].public_id}/"' in block
    finish_modules(learner, modules[:1])
    block = part_four_block(learner_client.get("/fr/").content.decode())
    assert f'class="btn" href="/fr/modules/{modules[1].public_id}/"' in block


@pytest.mark.django_db
@pytest.mark.parametrize("lang, alt", [("fr", "Vannes 1 à 4 du manifold"), ("en", "Manifold valves 1 to 4")])
def test_part_four_diagram_is_served_from_its_module_with_a_translated_alt(learner_client, partie, lang, alt):
    """US-63, Q62 : le schéma s'ouvre en grand, avec un texte alternatif dans la langue de l'apprenant."""
    section = section_of(partie, 15, 1)
    page = learner_client.get(f"/{lang}/sections/{section.public_id}/").content.decode()
    assert 'class="diagram"' in page
    assert "cours/froid/p4/m15/img/vannes.svg" in page
    assert f'alt="{alt}"' in page


@pytest.mark.django_db
def test_figure_of_a_part_four_section_is_only_a_button_until_it_is_requested(learner_client, partie):
    """US-64, Q69 : poids annoncé, aucun dessin dans la page ; le chargeur reste absent des sections sans figure."""
    with_figure = learner_client.get(f"/fr/sections/{section_of(partie, 15, 1).public_id}/").content.decode()
    figure = with_figure[with_figure.index('<figure class="live-figure"'):with_figure.index("</figure>", with_figure.index("live-figure"))]
    assert "à télécharger" in figure and "<svg" not in figure
    assert "acad/js/figures" in with_figure
    without = learner_client.get(f"/fr/sections/{section_of(partie, 14, 1).public_id}/").content.decode()
    assert "acad/js/figures" not in without


@pytest.mark.django_db
def test_module_page_flags_the_practical_activity(learner_client, partie):
    """US-65 : la seule TAF du module est repérée par le badge « Pratique », dans le sommaire et dans la liste."""
    page = learner_client.get(f"/fr/modules/{partie.modules.get(order=2).public_id}/").content.decode()
    assert page.count(">Pratique</span>") == 2


@pytest.mark.django_db
def test_an_unread_practical_activity_keeps_the_part_four_exam_locked(partie, learner):
    """US-65, PRD : la TAF compte dans la fin du module, donc dans l'ouverture de l'examen."""
    modules = list(partie.modules.order_by("order"))
    finish_modules(learner, modules)
    from progress.models import SectionView

    SectionView.objects.filter(user=learner, section=section_of(partie, 18, 2)).delete()
    assert not exam_unlocked(learner, partie)


@pytest.mark.django_db
@pytest.mark.parametrize("lang, label", [("fr", "Complément"), ("en", "Supplement")])
def test_only_written_sections_carry_the_supplement_badge(learner_client, partie, lang, label):
    """US-66, Q22 : le badge apparaît sur le complément, dans les deux langues, et jamais sur une section transcrite."""
    badge = f">{label}</span>"
    written = learner_client.get(f"/{lang}/sections/{section_of(partie, 1, 3).public_id}/").content.decode()
    transcribed = learner_client.get(f"/{lang}/sections/{section_of(partie, 2, 1).public_id}/").content.decode()
    assert badge in written
    assert badge not in transcribed


@pytest.mark.django_db
def test_trainer_filters_the_supplements_of_part_four_in_the_admin(trainer_client, partie):
    """US-70 : le formateur dispose du filtre « complément » en lecture et n'obtient que ces sections."""
    from django.urls import reverse

    response = trainer_client.get(reverse("admin:courses_section_changelist"), {"is_supplement__exact": 1})
    assert response.status_code == 200
    changelist = response.context["cl"]
    assert "is_supplement" in [spec.field_path for spec in changelist.filter_specs if hasattr(spec, "field_path")]
    assert list(changelist.queryset) == [section_of(partie, 1, 3)]


# ---------------------------------------------------------------- contenu réel, jalon J1 : p4/m15 (module 34 du support)
CONTENT = Path(__file__).resolve().parents[2] / "content" / "froid"
M15 = CONTENT / "p4" / "m15"
M15_SECTIONS = [
    ("01-role", "content"), ("02-mode-operatoire", "content"), ("03-casse-azote", "content"), ("04-taf", "practical"),
]
BRANDS = re.compile(
    r"geberit|lokring|nicoll|maxipro|testo\b|prestobul|climalife|mingori|primagaz|dehon|\belf\b|is[ée]on|poulenc|klixon|gazotest|abcclim|fr[ée]on",
    re.IGNORECASE,
)


# Découpage du PRD (Q55, Q56) : (titre fr, heures, sections) ; T = TAF, C = complément, sinon section de cours transcrite.
MODULES = {
    1: ("Outillage et appareils de mesure du monteur frigoriste", 8, "01-glossaire:C 02-manifold-vide 03-poste-tube 04-recuperation-charge 05-appareils-electriques 06-taf:T"),
    2: ("Différents raccords utilisés en froid", 8, "01-cuivre-laiton 02-acier-pvc-mixtes 03-sans-flamme 04-taf:T"),
    3: ("Différentes tuyauteries utilisées en froid", 8, "01-role-cuivre 02-acier 03-pvc-multicouche-alu 04-taf:T"),
    4: ("Travail sur les tuyauteries", 16, "01-calcul 02-coupe 03-evasements 04-cintrage:C 05-acier 06-taf:T"),
    5: ("Manodétendeur, chalumeau, réglage de la flamme", 8, "01-manodetendeurs 02-chalumeau-flamme 03-mise-en-service 04-taf:T"),
    6: ("Soudo-brasage et brasage", 16, "01-soudo-brasage 02-brasage 03-taf:T"),
    7: ("Brasage sous azote", 8, "01-rappels 02-mise-en-oeuvre 03-taf:T"),
    8: ("Le circuit frigorifique de base", 8, "01-elements 02-roles 03-etats 04-taf:T"),
    9: ("Identification des enroulements des moteurs électriques, monophasés et triphasés", 8, "01-monophases 02-triphases 03-tests 04-taf:T"),
    10: ("Démarrage des moto-compresseurs, relevé des paramètres de fonctionnement et analyse", 8, "01-relais 02-ctp-condensateurs 03-triphases:C 04-parametres 05-taf:T"),
    11: ("Les manifolds", 8, "01-description 02-operations 03-technologies 04-taf:T"),
    12: ("Démontage, montage d'un compresseur", 8, "01-avec-vannes 02-sans-vannes 03-refrigerateur 04-taf:T"),
    13: ("Vidange et remplissage d'huile dans les compresseurs frigorifiques", 8, "01-qualites-choix 02-vidange 03-remplissage 04-taf:T"),
    14: ("Test d'acidité et d'humidité des installations frigorifiques", 8, "01-rappel-huile 02-acidite 03-humidite-laboratoire:C 04-taf:T"),
    15: ("Mise sous vide d'une installation frigorifique", 8, "01-role 02-mode-operatoire 03-casse-azote 04-taf:T"),
    16: ("Test de pression et d'étanchéité d'une installation frigorifique, détecteurs de fuite", 8, "01-origines 02-tests-calculs 03-detection 04-test-pression:C 05-taf:T"),
    17: ("Remplissage d'une installation frigorifique par la masse et par la surchauffe", 8, "01-fluides 02-masse-surchauffe 03-liquide-vapeur 04-melanges:C 05-taf:T"),
    18: ("Soudure à l'arc électrique", 8, "01-principe 02-preparation 03-controle-securite 04-taf:T"),
}
FIGURES_OF = {5: "flamme", 7: "brasage-azote", 8: "circuit-frigo", 9: "enroulements", 10: "demarrage-compresseur", 15: "manifold-vide", 17: "manifold-charge"}
DELIVERED = list(range(1, 19))  # s'allonge à chaque lot, jusqu'aux 18 modules


def module_files(number):
    return [s.split(":") + [""] for s in MODULES[number][2].split()]


def delivered(number):
    return next(m for m in real_part_four()["modules"] if m["order"] == number)


@pytest.mark.parametrize("number", DELIVERED)
def test_module_matches_the_prd_structure_in_both_languages(number):
    """US-50, Q55, Q56 : titre, durée, ordre, nature de chaque section, texte fr et en."""
    entry = delivered(number)
    title, hours, _ = MODULES[number]
    assert (entry["title"]["fr"], entry["duration_hours"], entry["dir"]) == (title, hours, f"p4/m{number}")
    expected = [(name, {"T": "practical"}.get(flag, "content"), flag == "C") for name, flag, *_ in module_files(number)]
    assert [(s["file"], s["kind"], bool(s.get("supplement"))) for s in entry["sections"]] == expected
    for name, *_ in module_files(number):
        for lang in ("fr", "en"):
            assert (CONTENT / "p4" / f"m{number}" / f"{name}.{lang}.md").read_text(encoding="utf-8").strip()


@pytest.mark.parametrize("number", DELIVERED)
def test_module_bank_has_eight_quiz_and_eight_exam_questions_covering_each_section(number):
    """US-67, Q59, Q60 : 8 + 8 questions relues, au moins une par section `content`."""
    questions = json.loads((CONTENT / "p4" / f"m{number}" / "questions.json").read_text(encoding="utf-8"))
    assert Counter(q["usage"] for q in questions) == {"quiz": 8, "exam": 8}
    assert all(q["reviewed"] == {"fr": True, "en": True} for q in questions)
    content = {name for name, flag, *_ in module_files(number) if flag != "T"}
    assert {q["section"] for q in questions} == content


@pytest.mark.parametrize("number", DELIVERED)
def test_module_practical_activity_gives_equipment_sequence_and_scale(number):
    """US-65, Q64 : matériel par poste, séquence, barème 15/60/10/15."""
    taf = next(name for name, flag, *_ in module_files(number) if flag == "T")
    for lang, headings in (("fr", ("Matériel", "Séquence", "Évaluation")), ("en", ("Equipment", "Sequence", "Assessment"))):
        text = (CONTENT / "p4" / f"m{number}" / f"{taf}.{lang}.md").read_text(encoding="utf-8")
        assert all(f"## {h}" in text for h in headings), lang
        assert re.findall(r"(\d+) ?%", text) == ["15", "60", "10", "15"], lang


@pytest.mark.parametrize("number", DELIVERED)
def test_module_english_gives_french_terms_and_every_image_has_a_text_alternative(number):
    """US-63, US-68 : terme français cité en anglais ; images citées existantes, texte alternatif dans les deux langues."""
    folder = CONTENT / "p4" / f"m{number}"
    english = "".join(p.read_text(encoding="utf-8") for p in folder.glob("*.en.md"))
    assert '<span lang="fr">' in english
    for lang in ("fr", "en"):
        for path in folder.glob(f"*.{lang}.md"):
            for alt, name in re.findall(r"!\[([^\]]*)\]\(img/([^)]+)\)", path.read_text(encoding="utf-8")):
                assert alt.strip() and (folder / "img" / name).exists(), f"{path.name} : {name}"


@pytest.mark.parametrize("number", sorted(set(DELIVERED) & set(FIGURES_OF)))
def test_module_section_publishes_its_figure_in_both_languages(number):
    """US-64, Q69 : la figure est enregistrée et appelée une fois dans chaque langue."""
    from courses.figures import FIGURES

    name = FIGURES_OF[number]
    assert name in FIGURES
    for lang in ("fr", "en"):
        text = "".join(p.read_text(encoding="utf-8") for p in (CONTENT / "p4" / f"m{number}").glob(f"*.{lang}.md"))
        assert text.count(f"[[figure:{name}]]") == 1, lang


def test_glossary_lists_the_trade_terms_in_both_languages():
    """US-68, Q68 : termes britanniques du métier en tête du module 1."""
    terms = ("manifold gauge set", "flaring", "swaging", "brazing", "oxygen-free nitrogen", "vacuum gauge", "refrigerant recovery", "pressure test", "superheat", "subcooling")
    for lang in ("fr", "en"):
        text = (CONTENT / "p4" / "m1" / f"01-glossaire.{lang}.md").read_text(encoding="utf-8").lower()
        assert all(term in text for term in terms), lang


def test_corrections_log_records_a_written_practical_activity_for_each_module():
    """US-70, Q64 : une entrée par TAF rédigée, chaque module livré y figure."""
    log = (CONTENT / "p4" / "CORRECTIONS.md").read_text(encoding="utf-8")
    written = re.findall(r"^## \d+\. Activités pratiques rédigées \(module (\d+)", log, flags=re.M)
    assert {int(n) for n in written} >= set(DELIVERED)


def real_manifest():
    return json.loads((CONTENT / "formation.json").read_text(encoding="utf-8"))


def real_part_four():
    return next(p for p in real_manifest()["parties"] if p["slug"] == "p4")


def real_module_15():
    return next(m for m in real_part_four()["modules"] if m["dir"] == "p4/m15")


def m15_text(lang):
    return "\n".join((M15 / f"{name}.{lang}.md").read_text(encoding="utf-8") for name, _ in M15_SECTIONS)


def m15_questions():
    return json.loads((M15 / "questions.json").read_text(encoding="utf-8"))


def test_manifest_declares_part_four_and_its_exam_settings():
    """US-71, Q55, Q58 : titre bilingue, 3 questions par module, 90 min."""
    part = real_part_four()
    assert part["order"] == 4
    assert part["title"] == {"fr": "Assemblage et montage frigorifiques", "en": "Refrigeration assembly and installation"}
    assert part["exam"] == {"questions_per_module": 3, "duration_minutes": 90}


def test_evacuation_module_has_its_four_sections_in_both_languages():
    """US-58, Q56 : rôle, mode opératoire, casse à l'azote et TAF, sans complément."""
    module = real_module_15()
    assert (module["order"], module["duration_hours"]) == (15, 8)
    assert module["title"]["fr"] == "Mise sous vide d'une installation frigorifique"
    assert [(s["file"], s["kind"]) for s in module["sections"]] == M15_SECTIONS
    assert not any(s.get("supplement") for s in module["sections"])
    for name, _ in M15_SECTIONS:
        for lang in ("fr", "en"):
            assert (M15 / f"{name}.{lang}.md").read_text(encoding="utf-8").strip(), f"{name}.{lang}"


def test_evacuation_is_finished_on_a_vacuum_gauge_reading_never_on_the_manifold_needles():
    """US-58, Q61 : le critère de fin se lit au vacuomètre, en pression absolue."""
    fr, en = m15_text("fr"), m15_text("en")
    assert "indiqueront -1 bar" not in fr
    assert "vacuomètre" in fr and "mbar" in fr
    assert "vacuum gauge" in en and "mbar" in en
    assert "tenue du vide" in fr and "vacuum hold" in en.lower()


def test_breaking_the_vacuum_uses_a_regulated_low_nitrogen_pressure():
    """US-58, Q61 : manodétendeur, jamais 10 bar, pompe isolée, jamais raccordée à un circuit sous pression."""
    fr = (M15 / "03-casse-azote.fr.md").read_text(encoding="utf-8")
    en = (M15 / "03-casse-azote.en.md").read_text(encoding="utf-8")
    assert "manodétendeur" in fr and "regulator" in en
    assert "10 bar" not in fr and "10 bar" not in en
    assert "pression atmosphérique" in fr and "atmospheric pressure" in en
    assert "isoler la pompe" in fr.lower() and "isolate the pump" in en.lower()


def test_english_gives_the_french_term_at_its_first_occurrence():
    """US-68, Q68 : terme français entre parenthèses à la 1re occurrence."""
    en = m15_text("en")
    assert re.search(r"vacuum gauge[^.]{0,20}\(<span lang=\"fr\">vacuomètre</span>\)", en)
    assert re.search(r"manifold gauge set[^.]{0,20}\(<span lang=\"fr\">jeu de manifolds</span>\)", en)


def test_evacuation_practical_activity_gives_equipment_sequence_and_scale():
    """US-65, Q64 : matériel par poste, séquence, barème 15/60/10/15."""
    for lang, headings in (("fr", ("Matériel", "Séquence", "Évaluation")), ("en", ("Equipment", "Sequence", "Assessment"))):
        text = (M15 / f"04-taf.{lang}.md").read_text(encoding="utf-8")
        assert all(f"## {h}" in text for h in headings), lang
        assert re.findall(r"(\d+) ?%", text) == ["15", "60", "10", "15"], lang


def test_evacuation_bank_has_eight_reviewed_quiz_and_exam_questions_covering_each_section():
    """US-67, Q59, Q60 : 8 + 8 questions relues, au moins une par section de cours."""
    questions = m15_questions()
    assert Counter(q["usage"] for q in questions) == {"quiz": 8, "exam": 8}
    assert [q["id"] for q in questions] == [f"p4-m15-q{n:02d}" for n in range(1, 17)]
    assert all(q["reviewed"] == {"fr": True, "en": True} for q in questions)
    assert {q["section"] for q in questions} >= {name for name, kind in M15_SECTIONS if kind == "content"}


@pytest.mark.django_db
def test_import_with_publish_puts_the_evacuation_questions_online():
    """US-71 : le contenu réel s'importe, ses 16 questions sont publiées et l'examen dure 90 min."""
    stats_out = io.StringIO()
    call_command("import_content", str(CONTENT / "formation.json"), publish=True, stdout=stats_out)
    assert "Refusée" not in stats_out.getvalue()
    partie = Partie.objects.get(slug="p4")
    assert Question.objects.filter(module__partie=partie, status=Question.Status.PUBLISHED).count() == 16 * len(DELIVERED)
    assert Assessment.exam_for(partie).duration_minutes == 90


def test_corrections_log_records_each_evacuation_correction_with_its_four_fields():
    """US-70, Q61, Q64 : page, texte d'origine, correction, justification ; valeurs à confirmer listées."""
    log = (CONTENT / "p4" / "CORRECTIONS.md").read_text(encoding="utf-8")
    entries = re.split(r"^## ", log, flags=re.M)[1:]
    assert len(entries) >= 5
    for entry in entries:
        if entry.startswith("Valeurs à confirmer"):
            continue
        for field in ("**Page**", "**Texte d'origine**", "**Correction**", "**Justification**"):
            assert field in entry, entry[:40]
    for expected in ("-1 bar", "10 bar", "0,5 bar", "TAF", "Valeurs à confirmer"):
        assert expected in log, expected


def test_learner_text_never_mentions_the_handout_or_its_corrections():
    """Q29, Q61 : aucune note de correction dans le texte servi."""
    for md in (CONTENT / "p4").rglob("*.??.md"):
        text = md.read_text(encoding="utf-8").lower()
        for word in ("le support", "corrig", "erreur du", "the handout", "corrected"):
            assert word not in text, f"{md.name} : {word}"


def p4_svgs():
    return sorted((CONTENT / "p4").rglob("*.svg"))


def test_part_four_diagrams_are_light_inert_and_readable_on_a_360px_phone():
    """US-63, Q62 : inertes, ≤ 6 Ko, 420 de large au plus."""
    from django.core.files import File

    from config.uploads import validate_inert_svg

    assert len(p4_svgs()) >= 4
    for svg in p4_svgs():
        with svg.open("rb") as handle:
            validate_inert_svg(File(handle, name=svg.name))
        assert svg.stat().st_size <= 6000, svg.name
        width = float(re.search(r'viewBox="[\d.]+ [\d.]+ ([\d.]+) ', svg.read_text(encoding="utf-8")).group(1))
        assert width <= 420, svg.name


def test_water_curve_is_translated_and_every_diagram_is_cited_with_a_text_alternative():
    """US-63, Q28 : courbe en .fr/.en, et chaque image a un texte alternatif dans les deux langues."""
    assert (M15 / "img" / "courbe-eau.fr.svg").exists() and (M15 / "img" / "courbe-eau.en.svg").exists()
    cited = set()
    for lang in ("fr", "en"):
        images = re.findall(r"!\[([^\]]*)\]\(img/([^)]+)\)", m15_text(lang))
        assert images, lang
        assert all(alt.strip() for alt, _ in images), lang
        cited |= {name for _, name in images}
    assert {p.name for p in (M15 / "img").glob("*.svg")} == cited


def test_part_four_has_no_photo_and_no_manufacturer_name():
    """US-51, Q62 : aucun fichier matriciel ; aucune marque dans le texte, les questions ni les SVG."""
    root = CONTENT / "p4"
    assert not [p for p in root.rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".pdf"}]
    served = [*root.rglob("*.??.md"), *root.rglob("*.svg"), *root.rglob("questions.json")]
    for path in served:
        assert not BRANDS.search(path.read_text(encoding="utf-8")), path.name


def test_evacuation_section_publishes_the_manifold_figure_in_both_languages():
    """US-64, Q69 : la figure manifold-vide est enregistrée et appelée dans le mode opératoire."""
    from courses.figures import FIGURES

    assert "manifold-vide" in FIGURES
    for lang in ("fr", "en"):
        assert "[[figure:manifold-vide]]" in (M15 / f"02-mode-operatoire.{lang}.md").read_text(encoding="utf-8")
