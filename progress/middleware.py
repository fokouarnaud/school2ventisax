import logging

from django.conf import settings

from . import backup

logger = logging.getLogger(__name__)


class DailyBackupMiddleware:
    """Lance la sauvegarde quotidienne après la réponse, si `BACKUP_DIR` est configuré."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if settings.BACKUP_DIR:
            try:
                backup.backup_if_due(settings.BACKUP_DIR)
            except Exception:  # une sauvegarde ratée ne doit jamais casser la page
                logger.exception("Sauvegarde quotidienne impossible")
        return response
