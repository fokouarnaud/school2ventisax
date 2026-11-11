"""Figures interactives publiées dans les sections de cours.

Une section les appelle par un paragraphe seul `[[figure:nom]]`. Le nom doit figurer dans FIGURES : le rendu remplace
le marqueur par un emplacement léger (un bouton), et `static/acad/js/figures.js` ne télécharge le dessin et son script
qu'à la demande de l'apprenant (données mobiles limitées, budget de 200 Ko par page).
Les fichiers de `static/acad/figures/` sont produits par `node figures/<nom>/build.mjs` (skill anatomy) : un fragment
HTML sans script par langue, un script par langue, une feuille de style, plus le kit et sa feuille communs.
"""
import gzip
import re
from functools import lru_cache
from pathlib import Path

from django.contrib.staticfiles import finders
from django.templatetags.static import static
from django.utils.html import escape
from django.utils.translation import get_language
from django.utils.translation import gettext as _
from django.utils.translation import gettext_lazy

FIGURES = {
    "relais": gettext_lazy("Relais à bobine et contacts : SPST, SPDT, DPST, DPDT"),
    "relais-statique": gettext_lazy("Relais statique : optocoupleur et triac"),
    "couplage": gettext_lazy("Exercice : choisir le couplage étoile ou triangle"),
    "fractionne": gettext_lazy("Démarrage fractionné : 1er temps, 2e temps"),
    "reperage-fractionne": gettext_lazy("Exercice : repérer les bobinages à l'ohmmètre et choisir la plaque à bornes"),
    "manifold-vide": gettext_lazy("Exercice : tirer au vide et diagnostiquer la tenue du vide"),
    "flamme": gettext_lazy("Exercice : régler la flamme oxyacétylénique"),
    "brasage-azote": gettext_lazy("Exercice : balayage d'azote pendant le brasage"),
    "circuit-frigo": gettext_lazy("Exercice : état du fluide en chaque point du circuit"),
    "enroulements": gettext_lazy("Exercice : identifier les enroulements d'un compresseur à l'ohmmètre"),
    "demarrage-compresseur": gettext_lazy("Exercice : diagnostiquer le démarrage par relais d'un moto-compresseur"),
    "manifold-charge": gettext_lazy("Exercice : charger une installation à la balance"),
}
SHARED = ("acad/figures/kit.js", "acad/figures/iso.css")
# Un marqueur n'est reconnu que seul dans son paragraphe ; le nom est limité à [a-z0-9-] (aucun chemin, aucun attribut).
MARKER = re.compile(r"<p>\[\[figure:([^\]<>]*)\]\]</p>")


def figure_files(name, lang):
    base = f"acad/figures/{name}"
    return (f"{base}.{lang}.html", f"{base}.{lang}.js", f"{base}.css", *SHARED)


@lru_cache(maxsize=32)
def _download_kb(name, lang):
    """Poids transféré (gzip) au premier chargement de la figure, kit et styles compris."""
    total = 0
    for path in figure_files(name, lang):
        found = finders.find(path)
        if found:
            total += len(gzip.compress(Path(found).read_bytes()))
    return max(1, round(total / 1000))


def _lang():
    lang = (get_language() or "fr")[:2]
    return lang if lang in ("fr", "en") else "fr"


def _placeholder(match):
    name = match.group(1)
    if not re.fullmatch(r"[a-z0-9-]+", name) or name not in FIGURES:
        return ""
    lang = _lang()
    html, js, css, kit, iso_css = figure_files(name, lang)
    attrs = {
        "data-figure": name,
        "data-html": static(html),
        "data-js": static(js),
        "data-css": static(css),
        "data-kit": static(kit),
        "data-kit-css": static(iso_css),
        "data-loading": _("Chargement de la figure…"),
        "data-error": _("La figure n'a pas pu être chargée. Vérifiez la connexion, puis réessayez."),
    }
    attr_html = "".join(f' {key}="{escape(value)}"' for key, value in attrs.items())
    size = _("%(size)s Ko à télécharger") % {"size": _download_kb(name, lang)}
    return (
        f'<figure class="live-figure"{attr_html}>'
        f'<figcaption class="live-figure-title">{escape(FIGURES[name])}</figcaption>'
        f'<button type="button" class="btn live-figure-load">{escape(_("Afficher la figure interactive"))}'
        f' <span class="live-figure-size">({escape(size)})</span></button>'
        f'<p class="live-figure-status" aria-live="polite"></p>'
        "</figure>"
    )


def render_figures(html):
    return MARKER.sub(_placeholder, html)


def has_figures(html):
    return 'class="live-figure"' in html
