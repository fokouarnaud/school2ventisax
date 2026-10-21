from courses.rendering import render_markdown


def test_markdown_emphasis_becomes_html():
    assert render_markdown("**EPI**") == "<p><strong>EPI</strong></p>"


def test_script_tags_are_neutralised():
    html = render_markdown("<script>alert(1)</script>")
    assert "<script>" not in html


def test_javascript_links_are_dropped():
    assert "javascript:" not in render_markdown("[x](javascript:alert(1))")


def test_tables_and_images_are_kept():
    html = render_markdown("| a |\n|---|\n| 1 |\n\n![EPI](/media/epi.webp)")
    assert "<table>" in html
    assert '<img alt="EPI" src="/media/epi.webp">' in html


def test_course_images_are_served_through_the_static_files():
    from django.templatetags.static import static

    html = render_markdown("![Schéma](cours/froid/p2/m3/img/simple-allumage.svg)")
    assert f'src="{static("cours/froid/p2/m3/img/simple-allumage.svg")}"' in html
    assert 'src="cours/' not in html


def test_a_french_term_inside_english_text_keeps_its_language():
    html = render_markdown('An *impulse relay* (<span lang="fr">télérupteur</span>).')
    assert '<span lang="fr">télérupteur</span>' in html


def test_span_attributes_other_than_lang_are_dropped():
    html = render_markdown('<span lang="fr" onclick="x()" style="color:red">mot</span>')
    assert html == '<p><span lang="fr">mot</span></p>'


def test_course_diagrams_stay_readable_on_phones_and_in_dark_mode():
    """Q20 : schéma sur fond clair fixe (traits noirs lisibles en sombre), jamais déformé ni plus large que l'écran."""
    import re

    from django.conf import settings

    css = (settings.BASE_DIR / "static" / "acad" / "css" / "app.css").read_text(encoding="utf-8")
    rule = re.search(r"\.prose img \{([^}]*)\}", css).group(1)
    assert "max-width: 100%" in css and "height: auto" in rule
    assert "background: #fff" in rule  # couleur fixe, pas un jeton redéfini en mode sombre
