import pytest

from courses.models import Section
from progress.services import mark_section_viewed


@pytest.mark.django_db
def test_anonymous_visitor_is_sent_to_login(client):
    response = client.get("/fr/")
    assert response.status_code == 302
    assert response.url.startswith("/fr/connexion/")


@pytest.mark.django_db
def test_learner_logs_in_with_credentials_given_by_admin(client, learner):
    response = client.post("/fr/connexion/", {"username": "awa", "password": "x-Secret-123"})
    assert response.status_code == 302
    assert response.url == "/fr/"


@pytest.mark.django_db
def test_wrong_password_is_rejected(client, learner):
    response = client.post("/fr/connexion/", {"username": "awa", "password": "nope"})
    assert response.status_code == 200
    assert not response.wsgi_request.user.is_authenticated


@pytest.mark.django_db
def test_dashboard_lists_the_parts_of_the_promotion_formation_with_progress(client, enrolled, partie, module):
    first = Section.objects.create(module=module, title_fr="Cours", order=1)
    Section.objects.create(module=module, title_fr="TAF", order=2)
    mark_section_viewed(enrolled, first)
    client.force_login(enrolled)
    response = client.get("/fr/")
    assert response.status_code == 200
    [row] = response.context["parts"]
    assert row["partie"] == partie
    assert row["progress"] == 50
    assert "Habilitation et sécurité" in response.content.decode()


@pytest.mark.django_db
def test_learner_without_promotion_gets_an_empty_dashboard(client, learner, partie):
    client.force_login(learner)
    response = client.get("/fr/")
    assert response.status_code == 200
    assert response.context["parts"] == []


@pytest.mark.django_db
def test_english_prefix_serves_the_dashboard_in_english(client, enrolled, partie):
    partie.title_en = "Safety qualification"
    partie.save()
    client.force_login(enrolled)
    response = client.get("/en/")
    assert "Safety qualification" in response.content.decode()


@pytest.mark.django_db
def test_part_two_has_its_own_progress_and_exam_unlocking(client, enrolled, partie, module):
    from courses.models import Module, Partie, Section
    from progress.services import mark_section_viewed

    part_two = Partie.objects.create(formation=partie.formation, title_fr="Bases de l'électricité domestique", order=2, slug="p2")
    wiring = Module.objects.create(partie=part_two, title_fr="Montage simple allumage", order=3)
    mark_section_viewed(enrolled, Section.objects.create(module=wiring, title_fr="Cours", order=1))
    Section.objects.create(module=module, title_fr="Cours P1", order=1)
    client.force_login(enrolled)
    parts = client.get("/fr/").context["parts"]
    assert [p["partie"].slug for p in parts] == ["p1", "p2"]
    assert parts[0]["exam_unlocked"] is False  # la Partie 1 n'est pas terminée
    assert (parts[1]["progress"], parts[1]["exam_unlocked"]) == (100, True)  # indépendante de la Partie 1
