"""Partie 3 « Les bases de l'électricité industrielle » (Q41 à Q54, US-37 à US-49, Definition of Done 17)."""
import pytest
from django.conf import settings
from django.core.management import call_command

from courses.models import Module, Partie, Section

CONTENT = settings.BASE_DIR / "content" / "froid"

MODULES = [  # Q41 : titres et durées, dans l'ordre
    ("Les moteurs électriques", "Electric motors", 8),
    ("Appareillages électriques industriels", "Industrial electrical equipment", 4),
    ("Démarrage direct des moteurs asynchrones triphasés, un sens de marche",
     "Direct-on-line starting of three-phase induction motors, one direction of rotation", 12),
    ("Démarrage semi-automatique des moteurs, deux sens de rotation",
     "Semi-automatic starting of motors, two directions of rotation", 16),
    ("Démarrage étoile-triangle", "Star-delta starting", 16),
    ("Démarrage fractionné (part winding)", "Part-winding starting", 8),
]

SECTIONS = {  # Q51 : fichiers et types de sections, « supplement » pour le seul glossaire
    1: [("01-glossaire", "content", True), ("02-constitution", "content", False), ("03-couplage", "content", False),
        ("04-plaque", "content", False), ("05-taf", "practical", False)],
    2: [("01-isolement", "content", False), ("02-protection", "content", False), ("03-commande", "content", False),
        ("04-tableau", "content", False), ("05-taf", "practical", False)],
    3: [("01-prerequis", "content", False), ("02-demarrage-direct", "content", False), ("03-taf", "practical", False)],
    4: [("01-schemas", "content", False), ("02-fins-de-course", "content", False), ("03-taf", "practical", False)],
    5: [("01-prerequis", "content", False), ("02-principe", "content", False), ("03-schemas", "content", False),
        ("04-plaques", "content", False), ("05-taf", "practical", False)],
    6: [("01-principe", "content", False), ("02-reperage", "content", False), ("03-taf", "practical", False)],
}


@pytest.fixture
def imported(db):
    call_command("import_content", str(CONTENT / "formation.json"), publish=True, verbosity=0)


@pytest.mark.django_db
def test_part_three_is_imported_with_six_modules_and_twenty_four_sections(imported):
    """US-37 (modèle de données) : Partie p3, 6 modules titrés et minutés, 24 sections bilingues, 1 complément."""
    partie = Partie.objects.get(slug="p3")
    assert partie.order == 3
    assert partie.title_fr == "Les bases de l'électricité industrielle"
    assert partie.title_en == "Fundamentals of industrial electricity"
    modules = list(partie.modules.order_by("order"))
    assert [(m.title_fr, m.title_en, m.duration_hours) for m in modules] == MODULES
    assert sum(m.duration_hours for m in modules) == 64
    for module in modules:
        sections = list(module.sections.order_by("order"))
        expected = SECTIONS[module.order]
        assert [(s.kind, s.is_supplement) for s in sections] == [(k, sup) for _, k, sup in expected], module.order
        assert all(s.body_md_fr.strip() and s.body_md_en.strip() for s in sections), module.order
        assert all(m.competence_fr.strip() and m.competence_en.strip() for m in modules)
    assert Section.objects.filter(module__partie=partie).count() == 24


def part_three_questions(order):
    import json

    return json.loads((CONTENT / "p3" / f"m{order}" / "questions.json").read_text(encoding="utf-8"))


@pytest.mark.django_db
def test_import_with_publish_puts_the_ninety_six_part_three_questions_online(imported):
    """US-49, Q43, Q44 : 8 questions de quiz et 8 d'examen par module, toutes publiées par `--publish`."""
    from assessments.models import Question

    for order in range(1, 7):
        questions = Question.objects.filter(module__partie__slug="p3", module__order=order)
        assert questions.filter(usage=Question.Usage.QUIZ).count() == 8, order
        assert questions.filter(usage=Question.Usage.EXAM).count() == 8, order
    assert not Question.objects.filter(module__partie__slug="p3").exclude(status=Question.Status.PUBLISHED).exists()
    assert all(q["reviewed"] == {"fr": True, "en": True} for o in range(1, 7) for q in part_three_questions(o))


def test_every_part_three_content_section_has_a_question():
    """Q44 : au moins une question par section `content` (glossaire compris)."""
    for order, sections in SECTIONS.items():
        cited = {q["section"] for q in part_three_questions(order)}
        assert {f for f, kind, _ in sections if kind == "content"} <= cited, order


def test_rating_plates_exercise_feeds_the_quiz_and_the_exam():
    """US-42 : l'exercice des plaques A et B alimente quiz et examen du module 5."""
    plates = [q for q in part_three_questions(5) if q["section"] == "04-plaques"]
    assert {q["usage"] for q in plates} == {"quiz", "exam"}
    assert any("plaque B" in q["prompt"]["fr"] for q in plates)
    assert any("plaque A" in q["prompt"]["fr"] for q in plates)


@pytest.mark.django_db
def test_part_three_exam_draws_thirty_questions_five_per_module(imported):
    """US-44, Q44 : 6 modules × 5 = 30 questions en 60 min, 70 %, 3 tentatives ; deux tirages diffèrent."""
    import random
    from collections import Counter

    from assessments.models import Assessment

    exam = Assessment.exam_for(Partie.objects.get(slug="p3"))
    assert (exam.pass_threshold, exam.max_attempts, exam.duration_minutes, exam.shuffle) == (70, 3, 60, True)
    first = exam.question_pool(random.Random(1))
    assert len(first) == 30
    assert set(Counter(q.module.order for q in first).values()) == {5}
    assert {q.pk for q in first} != {q.pk for q in exam.question_pool(random.Random(2))}


@pytest.fixture
def trainer_client(imported, client, learner):
    from accounts.models import Promotion, User
    from courses.models import Formation

    promotion = Promotion.objects.create(name="Nov 2026", formation=Formation.objects.get(slug="froid"))
    learner.promotion = promotion
    learner.save()
    trainer = User.objects.create_user(username="formateur3", password="x-Secret-123", role=User.Role.TRAINER)
    promotion.trainers.add(trainer)
    client.force_login(trainer)
    return client


@pytest.mark.django_db
def test_trainer_table_shows_part_three_columns_and_exam(trainer_client):
    """US-47 : colonnes « 3.1 » à « 3.6 » après « 2.9 », et l'examen de la Partie 3, dans le tableau formateur."""
    response = trainer_client.get("/fr/formateur/")
    labels = [c["label"] for t in response.context["tables"] for c in t["columns"]]
    start = labels.index("2.9")  # d'autres parties peuvent suivre
    assert labels[start:start + 7] == ["2.9", "3.1", "3.2", "3.3", "3.4", "3.5", "3.6"]
    assert "p3" in [p.slug for t in response.context["tables"] for p in t["parties"]]


@pytest.mark.django_db
def test_trainer_csv_export_labels_part_three_modules_like_the_table(trainer_client):
    """US-47 : l'export CSV reprend les repères « partie.module » (3.1 à 3.6) et l'examen de la Partie 3."""
    import csv
    import io

    content = trainer_client.get("/fr/formateur/export.csv").content.decode("utf-8-sig")
    header, row = list(csv.reader(io.StringIO(content), delimiter=";"))[:2]
    for label, (title, _, _) in zip(["3.1", "3.2", "3.3", "3.4", "3.5", "3.6"], MODULES):
        assert f"{label} {title}" in header, label
    assert "Examen Les bases de l'électricité industrielle (%)" in header
    assert len(row) == len(header)


CORRECTION_FIELDS = ("**Page**", "**Texte d'origine**", "**Correction**", "**Justification**")


def corrections():
    log = (CONTENT / "p3" / "CORRECTIONS.md").read_text(encoding="utf-8")
    return log.split("\n## ")[1:]


def test_part_three_corrections_log_gives_page_original_text_correction_and_reason():
    """US-48, Q45 : chaque entrée donne la page, le texte d'origine, la correction et la justification."""
    entries = corrections()
    assert len(entries) >= 10
    for entry in entries:
        for field in CORRECTION_FIELDS:
            assert field in entry, f"{entry.splitlines()[0]} : {field} manquant"


def test_part_three_corrections_log_records_every_decided_correction():
    """US-48, Q45, Q46, Q48 : erreurs relevées au grill, contacteurs de l'étoile-triangle, TAF rédigées."""
    text = "\n".join(corrections())
    for expected in ("au niveau du stator", "400V/790V", "W1-W3", "octo-coupleur", "électronique",
                     "bilame par potentiel", "F7, F8", "KM1 = Couplage étoile"):
        assert expected in text, expected
    titles = [e.splitlines()[0] for e in corrections()]
    for module in ("module 2", "module 4", "module 6"):
        assert any(f"Activité pratique du {module} (ajout)" in t for t in titles), module


def test_learner_text_of_part_three_never_mentions_the_corrections_or_the_old_errors():
    """Q29, DoD 17 : la correction est intégrée sans être signalée ; les erreurs du support ne sont plus servies."""
    for md in (CONTENT / "p3").rglob("*.md"):
        if md.name == "CORRECTIONS.md":
            continue
        text = md.read_text(encoding="utf-8")
        lowered = text.lower()
        assert "corrections.md" not in lowered and "erratum" not in lowered and "texte d'origine" not in lowered, md
        for wrong in ("790 V", "790V", "W1-W3", "octo-coupleur", "au niveau du stator"):
            assert wrong not in text, (md, wrong)


GLOSSARY = [  # Q49 : terme anglais IEC, terme français
    ("direct-on-line (dol) starting", "démarrage direct"), ("star-delta", "étoile-triangle"),
    ("reversing starter", "inverseur de sens de marche"), ("part-winding starting", "démarrage fractionné"),
    ("contactor", "contacteur"), ("thermal overload relay", "relais thermique"),
    ("fuse switch-disconnector", "sectionneur porte-fusibles"), ("on-delay", "temporisé travail"),
    ("off-delay", "temporisé repos"), ("limit switch", "butée de fin de course"), ("hold-in", "auto-maintien"),
    ("electrical interlock", "verrouillage électrique"), ("mechanical interlock", "verrouillage mécanique"),
    ("squirrel cage", "cage d'écureuil"), ("rating plate", "plaque signalétique"), ("terminal board", "plaque à bornes"),
    ("phase voltage", "tension simple"), ("line voltage", "tension composée"),
]


def test_part_three_glossary_lists_the_iec_terms_in_both_languages():
    """US-45, Q49 : glossaire fr ↔ en en tête du module 1 de la Partie 3."""
    for lang in ("fr", "en"):
        glossary = (CONTENT / "p3" / "m1" / f"01-glossaire.{lang}.md").read_text(encoding="utf-8").lower()
        for en, fr in GLOSSARY:
            assert en in glossary and fr in glossary, (lang, en, fr)


def test_old_network_voltages_come_with_their_iec_60038_equivalent_at_first_mention():
    """US-46, Q47 : 220/380 V et 380/660 V rapprochés de 230/400 V et 400/690 V (IEC 60038) à la 1re mention."""
    for lang in ("fr", "en"):
        text = (CONTENT / "p3" / "m5" / f"01-prerequis.{lang}.md").read_text(encoding="utf-8")
        first = text.index("220/380 V")
        note = text.index("IEC 60038")
        assert note < text.index("220/380 V", first + 1), lang
        for voltage in ("230/400 V", "400/690 V"):
            assert voltage in text[first:note + 200], (lang, voltage)


def test_star_delta_contactors_are_named_the_same_in_the_diagrams_and_the_text():
    """US-41, Q46 : KM1 ligne, KM2 étoile, KM3 triangle, partout dans le module 5."""
    folder = CONTENT / "p3" / "m5"
    fr = (folder / "03-schemas.fr.md").read_text(encoding="utf-8")
    en = (folder / "03-schemas.en.md").read_text(encoding="utf-8")
    for line in ("| KM1 | Contacteur de ligne |", "| KM2 | Contacteur étoile |", "| KM3 | Contacteur triangle |"):
        assert fr.count(line) == 2, line  # tableau du circuit de puissance et tableau du circuit de commande
    for line in ("| KM1 | Line contactor |", "| KM2 | Star contactor |", "| KM3 | Delta contactor |"):
        assert en.count(line) == 2, line
    for md in folder.glob("*.md"):
        text = md.read_text(encoding="utf-8")
        for wrong in ("KM1 = Couplage étoile", "KM1 : contacteur étoile", "KM2 : contacteur de ligne", "KM3 = Couplage étoile"):
            assert wrong not in text, (md.name, wrong)


DIAGRAMS = {  # Q52 : schémas cités par section ; « {lang} » pour la seule variante bilingue (courbe Id/In)
    "m1/02-constitution": {"moteur-coupe.svg"},
    "m1/03-couplage": {"barrettes-etoile-triangle.svg"},
    "m2/02-protection": {"differentiel.svg"},
    "m2/04-tableau": {"symboles-protection.svg", "symboles-commande.svg"},
    "m3/01-prerequis": {"couplages.svg"},
    "m3/02-demarrage-direct": {"direct-puissance.svg", "direct-commande.svg"},
    "m4/01-schemas": {"inverseur-puissance.svg", "inverseur-commande.svg"},
    "m4/02-fins-de-course": {"inverseur-fins-de-course.svg"},
    "m5/01-prerequis": {"bloc-temporise.svg"},
    "m5/02-principe": {"courbe-demarrage.{lang}.svg"},
    "m5/03-schemas": {"etoile-triangle-puissance.svg", "etoile-triangle-commande.svg"},
    "m6/02-reperage": {"plaques-fractionne.svg", "fractionne-puissance.svg", "fractionne-commande.svg"},
}


def test_part_three_sections_cite_their_redrawn_diagrams_in_both_languages():
    """US-39, US-40, Q42, Q52 : schémas SVG cités avec un texte alternatif, en fr et en en ; aucun fichier en trop."""
    import re

    link = re.compile(r"!\[([^\]]+)\]\(img/([^)\s]+)\)")
    expected_files = set()
    for where, names in DIAGRAMS.items():
        module, section = where.split("/")
        for lang in ("fr", "en"):
            wanted = {n.format(lang=lang) for n in names}
            text = (CONTENT / "p3" / module / f"{section}.{lang}.md").read_text(encoding="utf-8")
            assert {name for _, name in link.findall(text)} == wanted, (where, lang)
            expected_files |= {f"{module}/{n}" for n in wanted}
    on_disk = {f"{p.parent.parent.name}/{p.name}" for p in (CONTENT / "p3").rglob("img/*")}
    assert on_disk == expected_files


def test_part_three_diagrams_are_light_inert_and_readable_on_a_360px_phone():
    """DoD 17 : SVG inertes, ≤ 6 Ko, 420 de large au plus (repères lisibles à 360 px), fond blanc."""
    import re

    from config.uploads import validate_inert_svg

    images = sorted((CONTENT / "p3").rglob("img/*.svg"))
    assert len(images) == 19
    for image in images:
        data = image.read_bytes()
        assert len(data) <= 6 * 1024, f"{image.name} : {len(data)} octets"
        from django.core.files.base import ContentFile

        validate_inert_svg(ContentFile(data, name=image.name))
        width = float(re.search(rb'viewBox="0 0 ([\d.]+) ', data).group(1))
        assert width <= 420, f"{image.name} : {width} de large"
        assert b'fill="#fff"' in data, f"{image.name} : fond blanc manquant"


def test_part_three_has_no_photo_and_no_manufacturer_name():
    """Q42, DoD 17 : aucune photo ni marque (plaques et appareils présentés de façon générique)."""
    files = [p for p in (CONTENT / "p3").rglob("*") if p.is_file() and p.name != "CORRECTIONS.md"]
    assert not [p for p in files if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"}]
    for path in files:
        text = path.read_text(encoding="utf-8").lower()
        for brand in ("leroy", "somer", "kriwan", "schneider", "legrand", "la2 dt2", "telemecanique"):
            assert brand not in text, (path.name, brand)


@pytest.mark.django_db
def test_part_three_exam_opens_only_once_its_six_modules_are_done(imported, learner):
    """US-37, US-44 : navigation libre ; l'examen s'ouvre quand les 6 modules (TAF et glossaire compris) sont terminés."""
    from assessments.models import Assessment
    from assessments.services import start_attempt, submit_attempt
    from progress.services import exam_unlocked, following_step, mark_section_viewed

    partie = Partie.objects.get(slug="p3")
    modules = list(partie.modules.order_by("order"))
    for module in modules[:5]:
        for section in module.sections.all():
            mark_section_viewed(learner, section)
        submit_attempt(start_attempt(learner, Assessment.quiz_for(module)))
    assert not exam_unlocked(learner, partie)
    step = following_step(learner, modules[4])
    assert step["kind"] == "module" and step["module"].order == 6
    for section in modules[5].sections.all():
        mark_section_viewed(learner, section)
    submit_attempt(start_attempt(learner, Assessment.quiz_for(modules[5])))
    assert exam_unlocked(learner, partie)


@pytest.mark.django_db
def test_importing_part_three_twice_creates_no_duplicate(imported):
    """US-49, DoD 6 : import idempotent (aucun doublon de module, de section ni de question)."""
    from assessments.models import Question

    counts = (Module.objects.count(), Section.objects.count(), Question.objects.count())
    call_command("import_content", str(CONTENT / "formation.json"), publish=True, verbosity=0)
    assert (Module.objects.count(), Section.objects.count(), Question.objects.count()) == counts
    assert Question.objects.filter(module__partie__slug="p3").count() == 96
