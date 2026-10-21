"""Parcours de l'apprenant : chaque fin d'étape propose la suivante (section, quiz, module, examen, partie)."""
import pytest

from assessments.models import Assessment
from assessments.services import save_answer, start_attempt, submit_attempt
from courses.models import Module, Partie, Section
from progress.services import following_step, mark_section_viewed


@pytest.fixture
def course(partie, module, question_factory):
    second = Module.objects.create(partie=partie, title_fr="Rapports", order=2, duration_hours=16)
    for m in (module, second):
        Section.objects.create(module=m, title_fr=f"{m.title} A", order=1)
        Section.objects.create(module=m, title_fr=f"{m.title} B", order=2)
        question_factory(m)
        question_factory(m, usage="exam")
    return module, second


def read_all(user, module):
    for s in module.sections.all():
        mark_section_viewed(user, s)


def finish(user, module):
    read_all(user, module)
    submit_attempt(start_attempt(user, Assessment.quiz_for(module)))


def pass_exam(user, partie):
    attempt = start_attempt(user, Assessment.exam_for(partie))
    for aq in attempt.attempt_questions.select_related("question"):
        good = aq.question.choices.filter(is_correct=True).values_list("public_id", flat=True)
        save_answer(attempt, aq.question.public_id, list(good))
    submit_attempt(attempt)
    return attempt


# Étape suivante d'un module terminé

@pytest.mark.django_db
def test_following_step_is_the_next_unfinished_module(enrolled, course):
    first, second = course
    finish(enrolled, first)
    assert following_step(enrolled, first) == {"kind": "module", "module": second}


@pytest.mark.django_db
def test_following_step_is_the_exam_once_every_module_is_done(enrolled, course, partie):
    first, second = course
    finish(enrolled, second)
    finish(enrolled, first)
    assert following_step(enrolled, first) == {"kind": "exam", "partie": partie}


# Page du module

@pytest.mark.django_db
def test_module_page_resumes_reading_at_the_first_unread_section(client, enrolled, course):
    first, _ = course
    mark_section_viewed(enrolled, first.sections.first())
    client.force_login(enrolled)
    response = client.get(f"/fr/modules/{first.public_id}/")
    assert response.context["resume_section"] == first.sections.all()[1]
    assert "Reprendre la lecture" in response.content.decode()


@pytest.mark.django_db
def test_module_page_puts_the_quiz_first_once_every_section_is_read(client, enrolled, course):
    first, _ = course
    read_all(enrolled, first)
    client.force_login(enrolled)
    html = client.get(f"/fr/modules/{first.public_id}/").content.decode()
    assert '<button class="btn" type="submit">Faire le quiz</button>' in html
    assert "Commencer la lecture" not in html


@pytest.mark.django_db
def test_completed_module_page_points_to_the_next_module(client, enrolled, course):
    first, second = course
    finish(enrolled, first)
    client.force_login(enrolled)
    html = client.get(f"/fr/modules/{first.public_id}/").content.decode()
    assert f'href="/fr/modules/{second.public_id}/"' in html
    assert "Module suivant" in html


@pytest.mark.django_db
def test_last_section_ends_on_the_module_actions(client, enrolled, course):
    first, _ = course
    client.force_login(enrolled)
    html = client.get(f"/fr/sections/{first.sections.last().public_id}/").content.decode()
    assert f'href="/fr/modules/{first.public_id}/#suite"' in html


@pytest.mark.django_db
def test_section_pager_links_back_to_the_outline(client, enrolled, course):
    first, _ = course
    client.force_login(enrolled)
    html = client.get(f"/fr/sections/{first.sections.first().public_id}/").content.decode()
    assert 'class="to-outline" href="#sommaire"' in html


# Sommaire : l'examen de la partie y figure

@pytest.mark.django_db
def test_outline_lists_the_part_exam_locked_then_open(client, enrolled, course, partie):
    first, second = course
    client.force_login(enrolled)
    url = f"/fr/modules/{first.public_id}/"
    exam_href = f'href="/fr/examen/{partie.public_id}/"'
    response = client.get(url)
    assert exam_href in response.content.decode()
    assert response.context["exam_open"] is False
    finish(enrolled, first)
    finish(enrolled, second)
    assert client.get(url).context["exam_open"] is True


# Correction du quiz

@pytest.mark.django_db
def test_quiz_result_announces_the_finished_module_and_offers_the_next_one(client, enrolled, course):
    first, second = course
    read_all(enrolled, first)
    attempt = start_attempt(enrolled, Assessment.quiz_for(first))
    submit_attempt(attempt)
    client.force_login(enrolled)
    html = client.get(f"/fr/tentatives/{attempt.public_id}/resultat/").content.decode()
    assert "Module terminé" in html
    assert html.count(f'href="/fr/modules/{second.public_id}/"') == 2  # en haut et sous la correction


@pytest.mark.django_db
def test_quiz_result_without_all_sections_read_does_not_claim_the_module_is_done(client, enrolled, course):
    first, _ = course
    attempt = start_attempt(enrolled, Assessment.quiz_for(first))
    submit_attempt(attempt)
    client.force_login(enrolled)
    html = client.get(f"/fr/tentatives/{attempt.public_id}/resultat/").content.decode()
    assert "Module terminé" not in html
    assert "Module suivant" not in html


@pytest.mark.django_db
def test_quiz_that_completes_the_part_opens_the_way_to_the_exam(client, enrolled, course, partie):
    first, second = course
    finish(enrolled, first)
    read_all(enrolled, second)
    attempt = start_attempt(enrolled, Assessment.quiz_for(second))
    submit_attempt(attempt)
    client.force_login(enrolled)
    html = client.get(f"/fr/tentatives/{attempt.public_id}/resultat/").content.decode()
    assert "examen de la partie est ouvert" in html
    assert f'href="/fr/examen/{partie.public_id}/"' in html


# Résultat de l'examen

@pytest.fixture
def next_partie(partie):
    p2 = Partie.objects.create(formation=partie.formation, title_fr="Électricité domestique", order=2, slug="p2")
    m = Module.objects.create(partie=p2, title_fr="Notions de base", order=1, duration_hours=8)
    return p2, m


@pytest.mark.django_db
def test_passed_exam_leads_to_the_next_part(client, enrolled, course, partie, next_partie):
    first, second = course
    finish(enrolled, first)
    finish(enrolled, second)
    attempt = pass_exam(enrolled, partie)
    client.force_login(enrolled)
    html = client.get(f"/fr/tentatives/{attempt.public_id}/resultat/").content.decode()
    assert "Commencer la partie suivante" in html
    assert f'href="/fr/modules/{next_partie[1].public_id}/"' in html


@pytest.mark.django_db
def test_failed_exam_links_each_module_score_to_its_module(client, enrolled, course, partie, next_partie):
    first, second = course
    finish(enrolled, first)
    finish(enrolled, second)
    attempt = start_attempt(enrolled, Assessment.exam_for(partie))
    submit_attempt(attempt)
    client.force_login(enrolled)
    html = client.get(f"/fr/tentatives/{attempt.public_id}/resultat/").content.decode()
    assert "Commencer la partie suivante" not in html
    assert f'href="/fr/modules/{first.public_id}/"' in html
    assert f'href="/fr/modules/{second.public_id}/"' in html


# Tableau de bord

@pytest.mark.django_db
def test_dashboard_offers_the_exam_in_the_part_panel_once_every_module_is_done(client, enrolled, course, partie):
    first, second = course
    finish(enrolled, first)
    finish(enrolled, second)
    client.force_login(enrolled)
    html = client.get("/fr/").content.decode()
    assert html.count(f'href="/fr/examen/{partie.public_id}/"') == 2  # panneau de la partie + carte d'examen


@pytest.mark.django_db
def test_dashboard_stops_offering_a_passed_exam_in_the_part_panel(client, enrolled, course, partie):
    first, second = course
    finish(enrolled, first)
    finish(enrolled, second)
    pass_exam(enrolled, partie)
    client.force_login(enrolled)
    html = client.get("/fr/").content.decode()
    assert html.count(f'href="/fr/examen/{partie.public_id}/"') == 1
