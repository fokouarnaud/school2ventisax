import sqlite3

import pytest
from django.core.management import call_command


@pytest.mark.django_db(transaction=True)
def test_backup_writes_a_readable_copy_of_the_database(tmp_path, django_user_model):
    django_user_model.objects.create_user(username="awa", password="x-Secret-123")
    call_command("backup_db", str(tmp_path), verbosity=0)
    [backup] = tmp_path.glob("db-*.sqlite3")
    with sqlite3.connect(backup) as conn:
        assert conn.execute("select username from accounts_user").fetchall() == [("awa",)]


@pytest.mark.django_db(transaction=True)
def test_backup_keeps_only_the_seven_most_recent_copies(tmp_path):
    for i in range(9):
        old = tmp_path / f"db-2026010{i}-000000.sqlite3"
        old.write_bytes(b"old")
    call_command("backup_db", str(tmp_path), verbosity=0)
    kept = sorted(p.name for p in tmp_path.glob("db-*.sqlite3"))
    assert len(kept) == 7
    assert "db-20260100-000000.sqlite3" not in kept  # la plus ancienne est supprimée
    assert "db-20260101-000000.sqlite3" not in kept
    assert "db-20260102-000000.sqlite3" not in kept
