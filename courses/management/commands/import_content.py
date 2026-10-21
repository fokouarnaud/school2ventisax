from django.core.management.base import BaseCommand, CommandError

from courses.importer import ContentError, import_formation


class Command(BaseCommand):
    help = "Importe (ou met à jour) une formation depuis son manifeste JSON. Idempotent."

    def add_arguments(self, parser):
        parser.add_argument("manifest", help="Chemin du formation.json")
        parser.add_argument(
            "--publish", action="store_true",
            help="Publie les questions relues en français et en anglais (questions approuvées d'avance).",
        )

    def handle(self, *args, manifest, publish, **options):
        try:
            stats = import_formation(manifest, publish=publish)
        except ContentError as error:
            raise CommandError(str(error)) from error
        self.stdout.write(self.style.SUCCESS(f"{stats['sections']} sections, {stats['questions']} questions importées."))
        if publish:
            self.stdout.write(self.style.SUCCESS(f"{stats['published']} questions publiées."))
            for reason in stats["refused"]:
                self.stdout.write(self.style.WARNING(f"Refusée {reason}"))
