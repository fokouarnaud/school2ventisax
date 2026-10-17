from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_POST

from courses.access import accessible_formations
from courses.models import Module, Partie
from progress.services import module_completed

from .models import Assessment, Attempt
from .services import (
    AttemptClosed,
    AttemptLimitReached,
    ExamLocked,
    close_if_expired,
    save_answer,
    start_attempt,
    submit_attempt,
)


def _own_attempt(request, pk):
    return get_object_or_404(Attempt.objects.select_related("assessment"), pk=pk, user=request.user)


def _attempts_left(user, assessment):
    if assessment.max_attempts is None:
        return None
    return max(0, assessment.max_attempts - assessment.attempts.filter(user=user).count())


@login_required
def start_quiz(request, module_pk):
    module = get_object_or_404(Module, pk=module_pk, partie__formation__in=accessible_formations(request.user))
    attempt = start_attempt(request.user, Assessment.quiz_for(module))
    return redirect("attempt_detail", pk=attempt.pk)


@login_required
def exam(request, partie_pk):
    partie = get_object_or_404(Partie, pk=partie_pk, formation__in=accessible_formations(request.user))
    assessment = Assessment.exam_for(partie)
    if request.method == "POST":
        try:
            attempt = start_attempt(request.user, assessment)
        except (ExamLocked, AttemptLimitReached):
            return HttpResponse(status=403)
        return redirect("attempt_detail", pk=attempt.pk)
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
def attempt_detail(request, pk):
    attempt = close_if_expired(_own_attempt(request, pk))
    if attempt.submitted_at:
        return redirect("attempt_result", pk=attempt.pk)
    rows = [
        {
            "question": aq.question,
            "choices": aq.ordered_choices(),
            "selected": set(aq.selected_choices.values_list("pk", flat=True)),
        }
        for aq in attempt.attempt_questions.select_related("question")
    ]
    remaining = None
    if attempt.deadline:
        remaining = max(0, int((attempt.deadline - timezone.now()).total_seconds()))
    return render(request, "assessments/attempt.html", {"attempt": attempt, "rows": rows, "remaining_seconds": remaining})


@login_required
@require_POST
def save_answer_view(request, pk):
    attempt = _own_attempt(request, pk)
    question_id = int(request.POST["question"])
    try:
        save_answer(attempt, question_id, request.POST.getlist("choices"))
    except AttemptClosed:
        return HttpResponse(status=409) if request.headers.get("HX-Request") else redirect("attempt_detail", pk=attempt.pk)
    if request.headers.get("HX-Request"):
        return HttpResponse(status=200)
    # Sans JavaScript : retour à la question enregistrée.
    return redirect(reverse("attempt_detail", args=[attempt.pk]) + f"#q-{question_id}")


@login_required
@require_POST
def submit_view(request, pk):
    attempt = close_if_expired(_own_attempt(request, pk))
    if attempt.submitted_at is None:
        submit_attempt(attempt)
    return redirect("attempt_result", pk=attempt.pk)


@login_required
def result(request, pk):
    attempt = close_if_expired(_own_attempt(request, pk))
    if attempt.submitted_at is None:
        return redirect("attempt_detail", pk=attempt.pk)
    is_exam = attempt.assessment.is_exam
    return render(request, "assessments/result.html", {
        "attempt": attempt,
        "show_correction": not is_exam,
        "feedback": [] if is_exam else attempt.feedback(),
        "module_scores": attempt.module_scores() if is_exam else {},
        "attempts_left": _attempts_left(request.user, attempt.assessment),
    })
