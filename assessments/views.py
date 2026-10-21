from django.contrib.auth.decorators import login_required
import uuid

from django.core.exceptions import PermissionDenied
from django.http import Http404, HttpResponse, HttpResponseBadRequest
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_POST

from courses.access import accessible_formations
from courses.models import Module, Partie
from progress.services import following_step, module_completed

from .models import Assessment, Attempt, AttemptQuestion
from .services import (
    AttemptClosed,
    AttemptLimitReached,
    ExamLocked,
    close_if_expired,
    save_answer,
    start_attempt,
    submit_attempt,
)


def _own_attempt(request, public_id):
    return get_object_or_404(Attempt.objects.select_related("assessment"), public_id=public_id, user=request.user)


def _uuids(values):
    """UUID valides ou ValueError : aucune valeur brute du formulaire n'atteint la base."""
    return [uuid.UUID(str(value)) for value in values]


def _attempts_left(user, assessment):
    if assessment.max_attempts is None:
        return None
    return max(0, assessment.max_attempts - assessment.attempts.filter(user=user).count())


@login_required
@require_POST
def start_quiz(request, module_id):
    module = get_object_or_404(Module, public_id=module_id, partie__formation__in=accessible_formations(request.user))
    attempt = start_attempt(request.user, Assessment.quiz_for(module))
    return redirect("attempt_detail", public_id=attempt.public_id)


@login_required
def exam(request, partie_id):
    partie = get_object_or_404(Partie, public_id=partie_id, formation__in=accessible_formations(request.user))
    assessment = Assessment.exam_for(partie)
    if request.method == "POST":
        try:
            attempt = start_attempt(request.user, assessment)
        except (ExamLocked, AttemptLimitReached):
            raise PermissionDenied
        return redirect("attempt_detail", public_id=attempt.public_id)
    missing = [m for m in partie.modules.all() if not module_completed(request.user, m)]
    open_attempt = assessment.attempts.filter(user=request.user, submitted_at__isnull=True).last()
    if open_attempt and close_if_expired(open_attempt).submitted_at:
        open_attempt = None
    return render(request, "assessments/exam.html", {
        "partie": partie,
        "assessment": assessment,
        "unlocked": not missing,
        "missing_modules": missing,
        "attempts_left": _attempts_left(request.user, assessment),
        "best": assessment.best_attempt(request.user),
        "open_attempt": open_attempt,
    })


@login_required
def attempt_detail(request, public_id):
    attempt = close_if_expired(_own_attempt(request, public_id))
    if attempt.submitted_at:
        return redirect("attempt_result", public_id=attempt.public_id)
    rows = [
        {
            "question": aq.question,
            "choices": aq.ordered_choices(),
            "selected": set(aq.selected_choices.values_list("public_id", flat=True)),
        }
        for aq in attempt.attempt_questions.select_related("question")
    ]
    remaining = None
    if attempt.deadline:
        remaining = max(0, int((attempt.deadline - timezone.now()).total_seconds()))
    return render(request, "assessments/attempt.html", {"attempt": attempt, "rows": rows, "remaining_seconds": remaining})


@login_required
@require_POST
def save_answer_view(request, public_id):
    attempt = _own_attempt(request, public_id)
    try:
        question_id, = _uuids([request.POST.get("question")])
        choice_ids = _uuids(request.POST.getlist("choices"))
    except ValueError:
        return HttpResponseBadRequest()
    try:
        save_answer(attempt, question_id, choice_ids)
    except AttemptQuestion.DoesNotExist:
        raise Http404
    except AttemptClosed:
        return HttpResponse(status=409) if request.headers.get("HX-Request") else redirect("attempt_detail", public_id=attempt.public_id)
    if request.headers.get("HX-Request"):
        return HttpResponse(status=200)
    # Sans JavaScript : retour à la question enregistrée.
    return redirect(reverse("attempt_detail", args=[attempt.public_id]) + f"#q-{question_id}")


@login_required
@require_POST
def submit_view(request, public_id):
    attempt = close_if_expired(_own_attempt(request, public_id))
    if attempt.submitted_at is None:
        submit_attempt(attempt)
    return redirect("attempt_result", public_id=attempt.public_id)


@login_required
def result(request, public_id):
    attempt = close_if_expired(_own_attempt(request, public_id))
    if attempt.submitted_at is None:
        return redirect("attempt_detail", public_id=attempt.public_id)
    assessment = attempt.assessment
    is_exam = assessment.is_exam
    return render(request, "assessments/result.html", {
        "attempt": attempt,
        "show_correction": not is_exam,
        "feedback": [] if is_exam else attempt.feedback(),
        "module_scores": attempt.module_scores() if is_exam else {},
        "attempts_left": _attempts_left(request.user, assessment),
        **(_after_exam(request.user, assessment) if is_exam else _after_quiz(request.user, assessment.module)),
    })


def _after_quiz(user, module):
    """Correction du quiz : si le module est terminé, on propose l'étape suivante (module ou examen)."""
    if not module_completed(user, module):
        return {"following": None}
    return {"following": following_step(user, module)}


def _after_exam(user, assessment):
    """Résultat d'examen : une fois la partie réussie, on mène au premier module non terminé de la partie suivante."""
    best = assessment.best_attempt(user)
    partie = assessment.partie
    next_partie = Partie.objects.filter(formation=partie.formation, order__gt=partie.order).first()
    if not (best and best.passed and next_partie):
        return {"next_partie": None, "next_partie_module": None}
    modules = list(next_partie.modules.all())
    start = next((m for m in modules if not module_completed(user, m)), modules[0] if modules else None)
    return {"next_partie": next_partie if start else None, "next_partie_module": start}
