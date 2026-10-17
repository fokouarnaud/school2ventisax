import pytest

from accounts.importing import import_learners
from accounts.models import User
from assessments.models import Question


def make(username, role):
    return User.objects.create_user(username=username, password="x-Secret-123", role=role)


@pytest.mark.django_db
def test_trainer_gets_back_office_access_to_questions_only(client):
    trainer = make("macaire", User.Role.TRAINER)
    client.force_login(trainer)
    assert client.get("/fr/admin/assessments/question/").status_code == 200
    assert client.get("/fr/admin/accounts/user/").status_code == 403


@pytest.mark.django_db
def test_learner_has_no_back_office_access(client):
    client.force_login(make("awa", User.Role.LEARNER))
    response = client.get("/fr/admin/assessments/question/")
    assert response.status_code == 302  # renvoyé vers la connexion de l'admin


@pytest.mark.django_db
def test_platform_admin_manages_promotions_and_users(client):
    client.force_login(make("chef", User.Role.ADMIN))
    assert client.get("/fr/admin/accounts/promotion/add/").status_code == 200
    assert client.get("/fr/admin/accounts/user/").status_code == 200


@pytest.mark.django_db
def test_demoting_a_trainer_removes_back_office_access(client):
    trainer = make("macaire", User.Role.TRAINER)
    trainer.role = User.Role.LEARNER
    trainer.save()
    trainer.refresh_from_db()
    assert not trainer.is_staff
    assert not trainer.groups.exists()


@pytest.mark.django_db
def test_publish_action_publishes_valid_questions_and_keeps_invalid_ones_as_drafts(client, module, question_factory):
    valid = question_factory(module, publish=False)
    invalid = question_factory(module, publish=False)
    invalid.reviewed_en = False
    invalid.save()
    client.force_login(make("macaire", User.Role.TRAINER))
    response = client.post(
        "/fr/admin/assessments/question/",
        {"action": "publish_selected", "_selected_action": [valid.pk, invalid.pk]},
        follow=True,
    )
    valid.refresh_from_db()
    invalid.refresh_from_db()
    assert valid.status == Question.Status.PUBLISHED
    assert invalid.status == Question.Status.DRAFT
    messages = [str(m) for m in response.context["messages"]]
    assert any("1" in m for m in messages)


CSV_TEXT = "username;first_name;last_name;email\nawa;Awa;Nkoulou;awa@example.cm\nali;Ali;Mbarga;\n"


@pytest.mark.django_db
def test_csv_import_creates_learners_in_the_promotion(promotion):
    report = import_learners(CSV_TEXT, promotion)
    awa = User.objects.get(username="awa")
    assert awa.promotion == promotion
    assert awa.is_learner
    assert awa.get_full_name() == "Awa Nkoulou"
    assert [row["username"] for row in report.created] == ["awa", "ali"]


@pytest.mark.django_db
def test_csv_import_gives_each_learner_a_working_initial_password(promotion):
    report = import_learners(CSV_TEXT, promotion)
    row = report.created[0]
    assert len(row["password"]) >= 10
    assert User.objects.get(username=row["username"]).check_password(row["password"])
    assert report.created[0]["password"] != report.created[1]["password"]


@pytest.mark.django_db
def test_csv_import_skips_existing_usernames(promotion):
    User.objects.create_user(username="awa", password="x-Secret-123")
    report = import_learners(CSV_TEXT, promotion)
    assert report.skipped == ["awa"]
    assert [row["username"] for row in report.created] == ["ali"]


@pytest.mark.django_db
def test_csv_import_rejects_a_file_without_username_column(promotion):
    with pytest.raises(ValueError):
        import_learners("nom;prenom\nNkoulou;Awa\n", promotion)


@pytest.mark.django_db
def test_admin_can_upload_learner_csv_for_a_promotion(client, promotion):
    from django.core.files.uploadedfile import SimpleUploadedFile

    client.force_login(make("chef", User.Role.ADMIN))
    response = client.post(
        f"/fr/admin/accounts/promotion/{promotion.pk}/import/",
        {"file": SimpleUploadedFile("liste.csv", CSV_TEXT.encode("utf-8"))},
    )
    assert response.status_code == 200
    assert User.objects.filter(promotion=promotion).count() == 2
    assert [row["username"] for row in response.context["report"].created] == ["awa", "ali"]


@pytest.mark.django_db
def test_trainer_cannot_import_learners(client, promotion):
    client.force_login(make("macaire", User.Role.TRAINER))
    assert client.get(f"/fr/admin/accounts/promotion/{promotion.pk}/import/").status_code == 403
