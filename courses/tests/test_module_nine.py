"""Partie 2, module 9 : interrupteur crépusculaire et capteur de mouvement (Q31 à Q40, US-30 à US-36)."""
import pytest
from django.conf import settings
from django.core.management import call_command

from courses.models import Module, Section

CONTENT = settings.BASE_DIR / "content" / "froid"
TITLE_FR = "Câblage et réglage de l'interrupteur crépusculaire et du capteur de mouvement"


@pytest.fixture
def imported(db):
    call_command("import_content", str(CONTENT / "formation.json"), publish=True, verbosity=0)


@pytest.mark.django_db
def test_module_nine_is_imported_with_three_lessons_and_one_practical_activity(imported):
    """US-30 (modèle de données) : 1 module de 8 h, 3 sections de cours et 1 TAF, aucun complément."""
    module = Module.objects.get(partie__slug="p2", order=9)
    assert module.title_fr == TITLE_FR
    assert module.title_en == "Wiring and setting the twilight switch and the motion detector"
    assert module.duration_hours == 8
    sections = list(module.sections.order_by("order"))
    assert [s.kind for s in sections] == [Section.Kind.CONTENT] * 3 + [Section.Kind.PRACTICAL]
    assert not any(s.is_supplement for s in sections)
    assert all(s.body_md_fr.strip() and s.body_md_en.strip() for s in sections)


@pytest.mark.django_db
def test_import_with_publish_puts_the_sixteen_module_nine_questions_online(imported):
    """US-36, Q35 : 8 questions de quiz et 8 d'examen, toutes publiées par `import_content --publish`."""
    from assessments.models import Question

    questions = Question.objects.filter(module__partie__slug="p2", module__order=9)
    assert questions.filter(usage=Question.Usage.QUIZ).count() == 8
    assert questions.filter(usage=Question.Usage.EXAM).count() == 8
    assert not questions.exclude(status=Question.Status.PUBLISHED).exists()


DIAGRAMS = {
    "01-crepusculaire": {"crepusculaire-direct.svg", "crepusculaire-contacteur.svg"},
    "02-detecteur": {"detecteur-direct.svg", "detecteur-forcage.svg"},
}


def test_module_nine_shows_four_neutral_diagrams_in_both_languages():
    """US-31, Q33 : 4 schémas de principe, sans variante .fr/.en, cités avec un texte alternatif en fr et en en."""
    import re

    link = re.compile(r"!\[([^\]]+)\]\(img/([^)\s]+)\)")
    folder = CONTENT / "p2" / "m9"
    for section, names in DIAGRAMS.items():
        for lang in ("fr", "en"):
            cited = {name for _, name in link.findall((folder / f"{section}.{lang}.md").read_text(encoding="utf-8"))}
            assert cited == names, (section, lang)
    on_disk = {p.name for p in (folder / "img").glob("*.svg")}
    assert on_disk == set().union(*DIAGRAMS.values())


def test_module_nine_wiring_always_starts_by_switching_off_and_checking_the_circuit_is_dead():
    """US-32, Q34 : coupure et vérification d'absence de tension au raccordement des deux appareils."""
    folder = CONTENT / "p2" / "m9"
    for section in ("01-crepusculaire", "02-detecteur"):
        assert "vérifier l'absence de tension" in (folder / f"{section}.fr.md").read_text(encoding="utf-8").lower(), section
        assert "check that the circuit is dead" in (folder / f"{section}.en.md").read_text(encoding="utf-8").lower(), section
    settings_text = (folder / "02-detecteur.fr.md").read_text(encoding="utf-8")
    for setting in ("TIME", "LUX", "SENS"):
        assert f"| {setting} |" in settings_text, setting


def test_part_two_glossary_lists_the_module_nine_terms():
    """US-34, Q36 : termes du module 9 au glossaire, en anglais et en français."""
    glossary_en = (CONTENT / "p2" / "m1" / "01-glossaire.en.md").read_text(encoding="utf-8").lower()
    glossary_fr = (CONTENT / "p2" / "m1" / "01-glossaire.fr.md").read_text(encoding="utf-8").lower()
    for en, fr in (("twilight switch", "interrupteur crépusculaire"), ("motion detector (pir)", "capteur de mouvement"),
                   ("photocell", "cellule photoélectrique"), ("time delay", "temporisation"),
                   ("light threshold (lux)", "seuil de luminosité")):
        assert en in glossary_en and fr in glossary_en, en
        assert en in glossary_fr and fr in glossary_fr, fr


def test_corrections_log_records_the_protective_conductor_of_module_nine():
    """Q34 : la borne PE « si nécessaire » du support est corrigée et journalisée (page 39)."""
    log = (CONTENT / "p2" / "CORRECTIONS.md").read_text(encoding="utf-8")
    entry = next(e for e in log.split("\n## ")[1:] if "(module 9)" in e.splitlines()[0] and "PE" in e.splitlines()[0])
    assert "**Page** : 39" in entry
    assert "si nécessaire" in entry and "NF C 15-100" in entry


@pytest.mark.django_db
def test_learner_who_finished_the_eight_first_modules_is_sent_to_module_nine(imported, learner):
    """US-33, Q39 : la partie redevient incomplète, « Continuer » mène au module 9, l'examen attend."""
    from assessments.models import Assessment
    from assessments.services import start_attempt, submit_attempt
    from progress.services import exam_unlocked, following_step, mark_section_viewed, module_completed

    modules = list(Module.objects.filter(partie__slug="p2").order_by("order"))
    for module in modules[:8]:
        for section in module.sections.all():
            mark_section_viewed(learner, section)
        submit_attempt(start_attempt(learner, Assessment.quiz_for(module)))
    assert all(module_completed(learner, m) for m in modules[:8])
    step = following_step(learner, modules[7])
    assert step["kind"] == "module" and step["module"].order == 9
    assert not exam_unlocked(learner, modules[7].partie)


@pytest.mark.django_db
def test_trainer_table_labels_module_nine_column_two_point_nine(imported, client, learner):
    """US-35 : colonne « 2.9 » dans le tableau formateur."""
    from accounts.models import Promotion, User
    from courses.models import Formation

    promotion = Promotion.objects.create(name="Oct 2026", formation=Formation.objects.get(slug="froid"))
    learner.promotion = promotion
    learner.save()
    trainer = User.objects.create_user(username="macaire", password="x-Secret-123", role=User.Role.TRAINER)
    promotion.trainers.add(trainer)
    client.force_login(trainer)
    response = client.get("/fr/formateur/")
    labels = [c["label"] for t in response.context["tables"] for c in t["columns"]]
    assert labels[-1] == "2.9" and "1.6" in labels
