from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render

from courses.models import Partie
from progress.services import exam_unlocked, module_completed, progress_pct


@login_required
def dashboard(request):
    if request.user.is_trainer or (request.user.is_platform_admin and not request.user.promotion_id):
        return redirect("trainer_table")
    parts = []
    promotion = request.user.promotion
    if promotion:
        for partie in Partie.objects.filter(formation=promotion.formation):
            modules = [{"module": m, "done": module_completed(request.user, m)} for m in partie.modules.all()]
            parts.append({
                "partie": partie,
                "progress": progress_pct(request.user, partie),
                "modules": modules,
                "hours": sum(item["module"].duration_hours for item in modules),
                # Où reprendre : le premier module non terminé de la partie.
                "next_module": next((item["module"] for item in modules if not item["done"]), None),
                "exam_unlocked": exam_unlocked(request.user, partie),
            })
    return render(request, "accounts/dashboard.html", {"promotion": promotion, "parts": parts})
