"""Hygiène des gabarits."""
import re
from pathlib import Path


def test_templates_lay_out_with_css_classes_not_inline_styles():
    """Seule la largeur d'une barre de progression, calculée, reste en ligne."""
    offenders = []
    for tpl in Path(__file__).resolve().parents[2].joinpath("templates").rglob("*.html"):
        for style in re.findall(r'style="([^"]*)"', tpl.read_text(encoding="utf-8")):
            if not re.fullmatch(r"width: \{\{ [\w.]+ \}\}%", style):
                offenders.append(f"{tpl.name}: {style}")
    assert offenders == []
