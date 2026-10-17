from django.core.management.base import BaseCommand

from courses.importer import import_formation


class Command(BaseCommand):
    help = "Importe (ou met à jour) une formation depuis son manifeste JSON. Idempotent."

    def add_arguments(self, parser):
        parser.add_argument("manifest", help="Chemin du formation.json")

    def handle(self, *args, manifest, **options):
        stats = import_formation(manifest)
        self.stdout.write(self.style.SUCCESS(f"{stats['sections']} sections, {stats['questions']} questions importées."))
