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
# Image de cours (chemin posé par l'import, servi par courses.finders) : seule une vraie balise <img> est réécrite.
COURSE_IMAGE = re.compile(r'<img ([^>]*?)src="(cours/[^"]+)"([^>]*)>')


def render_markdown(text):
    html = markdown.markdown(text or "", extensions=["tables"])
    html = bleach.clean(html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, protocols={"http", "https"}, strip=True)
    return COURSE_IMAGE.sub(_static_src, html)


def _static_src(match):
    before, path, after = match.groups()
    try:
        url = escape(static(path))
    except ValueError:  # absent du manifeste (production) : image sans source, texte alternatif seul, pas d'erreur 500
        return f"<img {before.rstrip()}{after}>"
    # Le schéma s'ouvre en grand d'un toucher, pour être zoomé sur un téléphone.
    return f'<a class="diagram" href="{url}"><img {before}src="{url}"{after}></a>'

