"""Markdown → HTML nettoyé (bleach) pour le contenu des sections."""
import re

import bleach
import markdown
from django.templatetags.static import static
from django.utils.html import escape

ALLOWED_TAGS = {
    "p", "br", "strong", "em", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "code", "pre",
    "table", "thead", "tbody", "tr", "th", "td", "a", "img", "hr",
    "span",  # seulement pour lang : terme français cité dans un texte anglais (lecteurs d'écran)
}
ALLOWED_ATTRIBUTES = {"a": ["href", "title"], "img": ["src", "alt", "title"], "span": ["lang"]}
COURSE_IMAGE = re.compile(r'src="(cours/[^"]+)"')  # chemin posé par l'import, servi par courses.finders


def render_markdown(text):
    html = markdown.markdown(text or "", extensions=["tables"])
    html = bleach.clean(html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, protocols={"http", "https"}, strip=True)
    return COURSE_IMAGE.sub(_static_src, html)


def _static_src(match):
    try:
        return f'src="{escape(static(match.group(1)))}"'
    except ValueError:  # absent du manifeste (production) : image sans source, texte alternatif seul, pas d'erreur 500
        return ""
