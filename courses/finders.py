"""Images de cours servies en fichiers statiques (cours/<formation>/<partie>/<module>/img/<fichier>).

Le dossier du contenu contient aussi les questions et leurs bonnes réponses : seuls les fichiers
image rangés dans un dossier img/ en sortent, jamais le reste.
"""
import os
from pathlib import Path

from django.conf import settings
from django.contrib.staticfiles.finders import BaseFinder
from django.core.exceptions import ValidationError
from django.core.files import File
from django.core.files.storage import FileSystemStorage

from config.uploads import validate_inert_svg

PREFIX = "cours"
EXTENSIONS = {".svg", ".webp"}


def _is_course_image(relative):
    return relative.suffix.lower() in EXTENSIONS and relative.parent.name == "img"


def _is_inert(file):
    """Les statiques sont servis sans l'en-tête CSP : un SVG actif n'en sort jamais."""
    with file.open("rb") as handle:
        try:
            validate_inert_svg(File(handle, name=file.name))
        except ValidationError:
            return False
    return True


class ContentImagesFinder(BaseFinder):
    def __init__(self, *args, **kwargs):
        self.root = Path(settings.ACAD_CONTENT_ROOT)

    def check(self, **kwargs):
        return []

    def _match(self, path):
        prefix, _, rest = path.replace("\\", "/").partition("/")  # runserver sous Windows passe des \
        if prefix != PREFIX or not rest:
            return None
        file = Path(os.path.normpath(self.root / rest))
        root = Path(os.path.normpath(self.root))
        if not file.is_relative_to(root) or not _is_course_image(file.relative_to(root)) or not file.is_file() or not _is_inert(file):
            return None
        return str(file)

    def find(self, path, find_all=False, **kwargs):
        match = self._match(path)
        if not match:
            return []  # comme les finders de Django : None ferait renvoyer [None] par finders.find()
        return [match] if find_all else match

    def list(self, ignore_patterns):
        storage = FileSystemStorage(location=self.root)
        storage.prefix = PREFIX
        for file in sorted(self.root.rglob("img/*")):
            relative = file.relative_to(self.root)
            if file.is_file() and _is_course_image(relative) and _is_inert(file):
                yield relative.as_posix(), storage
