from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from courses.models import Partie
from progress.services import progress_pct


@login_required
def dashboard(request):
    parts = []
    promotion = request.user.promotion
    if promotion:
        for partie in Partie.objects.filter(formation=promotion.formation):
            parts.append({"partie": partie, "progress": progress_pct(request.user, partie)})
    return render(request, "accounts/dashboard.html", {"promotion": promotion, "parts": parts})
