"""Changement de langue de l'interface."""
import re
from urllib.parse import urlsplit, urlunsplit

from django.conf import settings
from django.http import HttpResponseRedirect
from django.utils.http import url_has_allowed_host_and_scheme
from django.utils.translation import check_for_language
from django.views.decorators.http import require_POST

_PREFIX = re.compile(r"^/(%s)(?=/|$)" % "|".join(re.escape(code) for code, _ in settings.LANGUAGES))


@require_POST
def set_language(request):
    """Remplace le préfixe de langue de `next` par la langue choisie.

    La vue de Django traduit `next` en le résolvant dans la langue active, tirée
    du cookie ou du navigateur : sur une page /en/ avec un cookie « fr », la
    résolution échoue et l'apprenant reste en anglais. Ici, seul le préfixe compte.
    """
    language = request.POST.get("language", "")
    target = request.POST.get("next") or request.headers.get("referer") or "/"
    if not url_has_allowed_host_and_scheme(target, {request.get_host()}, request.is_secure()):
        target = "/"
    if not check_for_language(language):
        return HttpResponseRedirect(target)
    parts = urlsplit(target)
    path = parts.path or "/"
    path = _PREFIX.sub(f"/{language}", path, count=1) if _PREFIX.match(path) else f"/{language}{path}"
    response = HttpResponseRedirect(urlunsplit(("", "", path, parts.query, parts.fragment)))
    response.set_cookie(
        settings.LANGUAGE_COOKIE_NAME,
        language,
        max_age=settings.LANGUAGE_COOKIE_AGE,
        path=settings.LANGUAGE_COOKIE_PATH,
        domain=settings.LANGUAGE_COOKIE_DOMAIN,
        secure=settings.LANGUAGE_COOKIE_SECURE,
        httponly=settings.LANGUAGE_COOKIE_HTTPONLY,
        samesite=settings.LANGUAGE_COOKIE_SAMESITE,
    )
    return response
