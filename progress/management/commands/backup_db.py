"""Sauvegarde à chaud de la base SQLite (API backup), en gardant les 7 copies les plus récentes (US-20)."""
import sqlite3
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone

KEEP = 7


class Command(BaseCommand):
    help = "Copie la base SQLite dans le dossier donné et ne garde que les 7 dernières copies."

    def add_arguments(self, parser):
        parser.add_argument("directory")

    def handle(self, *args, directory, **options):
        target_dir = Path(directory)
        target_dir.mkdir(parents=True, exist_ok=True)
        target = target_dir / f"db-{timezone.now():%Y%m%d-%H%M%S}.sqlite3"
        connection.ensure_connection()
        with sqlite3.connect(target) as dest:
            connection.connection.backup(dest)
        dest.close()
        backups = sorted(target_dir.glob("db-*.sqlite3"))
        for old in backups[:-KEEP]:
            old.unlink()
        self.stdout.write(self.style.SUCCESS(f"Sauvegarde : {target}"))
