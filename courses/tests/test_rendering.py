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
