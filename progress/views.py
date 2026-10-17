import csv

from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse
from django.shortcuts import render
from django.utils.translation import gettext as _

from accounts.models import Promotion, User
from assessments.models import Assessment
from courses.models import Module, Partie

from .services import module_completed


def _require_staff_role(user):
    if not (user.is_trainer or user.is_platform_admin):
        raise PermissionDenied


def _tables(user):
    """Une table par formation : colonnes = modules et examens de parties, lignes = apprenants visibles."""
    promotions = Promotion.objects.visible_to(user).select_related("formation")
    tables = []
    for formation in {p.formation for p in promotions}:
        modules = list(Module.objects.filter(partie__formation=formation).order_by("partie__order", "order"))
        parties = list(Partie.objects.filter(formation=formation))
        exams = [Assessment.exam_for(p) for p in parties]
        learners = User.objects.filter(
            role=User.Role.LEARNER, promotion__in=[p for p in promotions if p.formation_id == formation.pk]
        ).select_related("promotion").order_by("promotion__name", "username")
        rows = []
        for learner in learners:
            exam_results = []
            for partie, exam in zip(parties, exams):
                best = exam.best_attempt(learner)
                exam_results.append({
                    "partie": partie,
                    "best": best.score_pct if best else None,
                    "attempts": exam.attempts.filter(user=learner).count(),
                })
            rows.append({
                "learner": learner,
                "modules": [module_completed(learner, m) for m in modules],
                "exams": exam_results,
            })
        tables.append({"formation": formation, "modules": modules, "parties": parties, "rows": rows})
    return sorted(tables, key=lambda t: t["formation"].order)


@login_required
def trainer_table(request):
    _require_staff_role(request.user)
    tables = _tables(request.user)
    rows = [row for table in tables for row in table["rows"]]
    return render(request, "progress/trainer_table.html", {"tables": tables, "rows": rows})


@login_required
def export_csv(request):
    _require_staff_role(request.user)
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = 'attachment; filename="progression.csv"'
    response.write("﻿")  # BOM : Excel ouvre l'UTF-8 correctement
    writer = csv.writer(response, delimiter=";")
    for table in _tables(request.user):
        header = [_("Promotion"), _("Identifiant"), _("Nom")] + [m.title for m in table["modules"]]
        for partie in table["parties"]:
            header += [_("Examen %(partie)s (%%)") % {"partie": partie.title}, _("Tentatives %(partie)s") % {"partie": partie.title}]
        writer.writerow(header)
        for row in table["rows"]:
            learner = row["learner"]
            line = [learner.promotion.name, learner.username, learner.get_full_name()]
            line += [_("oui") if done else _("non") for done in row["modules"]]
            for result in row["exams"]:
                line += ["" if result["best"] is None else result["best"], result["attempts"]]
            writer.writerow(line)
    return response
