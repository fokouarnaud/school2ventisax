"""Pages d'erreur à la charte : en production (DEBUG=False), jamais la page brute de Django."""
import uuid

import pytest
from django.test import Client
from django.urls import path

from assessments.models import Assessment
from config import urls as project_urls


@pytest.mark.django_db
def test_unknown_module_shows_the_charted_404_in_french(client, enrolled):
    client.force_login(enrolled)
    response = client.get(f"/fr/modules/{uuid.uuid4()}/")
    html = response.content.decode()
    assert response.status_code == 404
    assert '<html lang="fr">' in html
    assert "acad/css/app.css" in html
    assert "Page introuvable" in html
    assert 'href="/fr/"' in html


@pytest.mark.django_db
def test_unknown_page_shows_the_charted_404_in_english(client, enrolled):
    client.force_login(enrolled)
    html = client.get(f"/en/modules/{uuid.uuid4()}/").content.decode()
    assert '<html lang="en">' in html
    assert "Page not found" in html


@pytest.mark.django_db
def test_learner_on_the_trainer_table_gets_the_charted_403(client, enrolled):
    client.force_login(enrolled)
    response = client.get("/fr/formateur/")
    assert response.status_code == 403
    assert "Accès refusé" in response.content.decode()


@pytest.mark.django_db
def test_starting_a_locked_exam_explains_the_refusal(client, enrolled, partie, module):
    Assessment.exam_for(partie)
    module.sections.create(title_fr="Cours", order=1)  # jamais vue : examen verrouillé
    client.force_login(enrolled)
    response = client.post(f"/fr/examen/{partie.public_id}/")
    assert response.status_code == 403
    assert "Accès refusé" in response.content.decode()


@pytest.mark.django_db
def test_csrf_failure_shows_the_charted_page(enrolled):
    csrf_client = Client(enforce_csrf_checks=True)
    csrf_client.force_login(enrolled)
    response = csrf_client.post("/fr/deconnexion/")
    html = response.content.decode()
    assert response.status_code == 403
    assert "acad/css/app.css" in html
    assert "Session expirée" in html


def _boom(request):
    raise RuntimeError("panne")


urlpatterns = [path("boom/", _boom), *project_urls.urlpatterns]


@pytest.mark.django_db
def test_server_error_shows_the_charted_500(settings):
    settings.ROOT_URLCONF = __name__
    response = Client(raise_request_exception=False).get("/boom/")
    html = response.content.decode()
    assert response.status_code == 500
    assert "acad/css/app.css" in html
    assert "Erreur du serveur" in html

