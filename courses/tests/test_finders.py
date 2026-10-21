"""Seules les images des dossiers img/ du contenu sortent en fichiers statiques."""
import pytest

from courses.finders import ContentImagesFinder


@pytest.fixture
def content_root(tmp_path, settings):
    module_dir = tmp_path / "froid" / "p2" / "m3"
    (module_dir / "img").mkdir(parents=True)
    (module_dir / "img" / "schema.svg").write_text("<svg/>", encoding="utf-8")
    (module_dir / "questions.json").write_text("[]", encoding="utf-8")
    (module_dir / "01-cours.fr.md").write_text("Cours", encoding="utf-8")
    settings.ACAD_CONTENT_ROOT = tmp_path
    return tmp_path


def test_finder_serves_course_images(content_root):
    found = ContentImagesFinder().find("cours/froid/p2/m3/img/schema.svg")
    assert found == str(content_root / "froid" / "p2" / "m3" / "img" / "schema.svg")


def test_finder_serves_course_images_to_runserver_on_windows(content_root):
    """runserver passe le chemin par url2pathname : barres obliques inverses sous Windows."""
    found = ContentImagesFinder().find("cours\\froid\\p2\\m3\\img\\schema.svg")
    assert found == str(content_root / "froid" / "p2" / "m3" / "img" / "schema.svg")


@pytest.mark.parametrize("path", [
    "cours/froid/p2/m3/questions.json",
    "cours/froid/p2/m3/01-cours.fr.md",
    "cours/froid/p2/m3/img/../questions.json",
    "cours/../config/settings.py",
    "cours\\froid\\p2\\m3\\img\\..\\questions.json",
    "acad/css/app.css",
])
def test_finder_never_serves_answers_texts_or_files_outside_img(content_root, path):
    assert not ContentImagesFinder().find(path)


def test_finder_lists_only_course_images_for_collectstatic(content_root):
    listed = [f"{storage.prefix}/{path}" for path, storage in ContentImagesFinder().list([])]
    assert listed == ["cours/froid/p2/m3/img/schema.svg"]
