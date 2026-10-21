"""Deux sauvegardes simultanées (clics rapides en examen) ne doivent jamais faire perdre une réponse.

En mode DEFERRED, deux transactions qui lisent puis écrivent s'interbloquent : SQLite rejette la
seconde tout de suite (« database is locked »), sans attendre. En mode IMMEDIATE, elle attend son tour.
"""
import threading

import pytest

from django.conf import settings
from django.db.backends.sqlite3.base import DatabaseWrapper


def _connect(path):
    wrapper = DatabaseWrapper({**settings.DATABASES["default"], "NAME": str(path)}, alias="concurrency")
    wrapper.connect()
    return wrapper


def _begin(wrapper):
    # Même chemin que transaction.atomic() pour SQLite.
    wrapper.set_autocommit(False, force_begin_transaction_with_broken_autocommit=True)


@pytest.fixture(autouse=True)
def _own_database_files(django_db_blocker):
    with django_db_blocker.unblock():  # fichiers SQLite propres au test, pas la base de test
        yield


def test_two_concurrent_read_then_write_transactions_both_succeed(tmp_path):
    path = tmp_path / "db.sqlite3"
    setup = _connect(path)
    with setup.cursor() as cursor:
        cursor.execute("CREATE TABLE answer (id INTEGER PRIMARY KEY, choice TEXT)")
        cursor.execute("INSERT INTO answer (id, choice) VALUES (1, ''), (2, '')")
    setup.close()

    first_has_written = threading.Event()
    errors = []

    def first_click():
        conn = _connect(path)
        try:
            _begin(conn)
            with conn.cursor() as cursor:
                cursor.execute("SELECT choice FROM answer WHERE id = 1")
                cursor.execute("UPDATE answer SET choice = 'a' WHERE id = 1")
            first_has_written.set()
            threading.Event().wait(0.3)  # la requête suivante arrive pendant ce temps
            conn.commit()
        except Exception as exc:  # noqa: BLE001
            errors.append(exc)
            first_has_written.set()
        finally:
            conn.close()

    thread = threading.Thread(target=first_click)
    thread.start()
    first_has_written.wait(5)
    second = _connect(path)
    try:
        _begin(second)
        with second.cursor() as cursor:
            cursor.execute("SELECT choice FROM answer WHERE id = 2")
            cursor.execute("UPDATE answer SET choice = 'b' WHERE id = 2")
        second.commit()
    finally:
        second.close()
        thread.join()

    assert errors == []
    check = _connect(path)
    with check.cursor() as cursor:
        cursor.execute("SELECT choice FROM answer ORDER BY id")
        assert [row[0] for row in cursor.fetchall()] == ["a", "b"]
    check.close()
