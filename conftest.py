import pytest

from accounts.models import User
from courses.models import Formation, Module, Partie


@pytest.fixture
def partie(db):
    formation = Formation.objects.create(title_fr="Froid et climatisation", slug="froid")
    return Partie.objects.create(formation=formation, title_fr="Habilitation et sécurité", order=1, slug="p1")


@pytest.fixture
def module(partie):
    return Module.objects.create(partie=partie, title_fr="Sécurité dans les travaux", order=1, duration_hours=8)


@pytest.fixture
def learner(db):
    return User.objects.create_user(username="awa", password="x-Secret-123")
