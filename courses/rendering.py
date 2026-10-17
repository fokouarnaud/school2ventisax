"""Markdown → HTML nettoyé (bleach) pour le contenu des sections."""
import bleach
import markdown

ALLOWED_TAGS = {
    "p", "br", "strong", "em", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "code", "pre",
    "table", "thead", "tbody", "tr", "th", "td", "a", "img", "hr",
}
ALLOWED_ATTRIBUTES = {"a": ["href", "title"], "img": ["src", "alt", "title"]}


def render_markdown(text):
    html = markdown.markdown(text or "", extensions=["tables"])
    return bleach.clean(html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, protocols={"http", "https"}, strip=True)
