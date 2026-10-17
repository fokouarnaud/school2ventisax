"""En-tête Content-Security-Policy : seuls les scripts servis par le site s'exécutent.

Django 5.2 n'a pas de CSP intégrée. Les styles en ligne restent permis (barres de progression, HTMX),
mais aucun script en ligne ni gestionnaire `on…=` : une injection HTML ne peut donc rien exécuter.
"""
CONTENT_SECURITY_POLICY = "; ".join([
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
])


class ContentSecurityPolicyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response.setdefault("Content-Security-Policy", CONTENT_SECURITY_POLICY)
        return response
