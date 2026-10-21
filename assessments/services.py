"""Cycle de vie des tentatives : démarrage, reprise, sauvegarde des réponses, envoi (AGENTS.md, Q8/Q8b)."""
import random
from datetime import timedelta
from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.utils import timezone

from .models import Attempt, AttemptQuestion


class ExamLocked(Exception):
    """L'examen de partie n'est pas encore débloqué pour cet apprenant."""


class AttemptLimitReached(Exception):
    """Toutes les tentatives autorisées ont été utilisées."""


class AttemptClosed(Exception):
    """La tentative est envoyée ou son temps est écoulé."""


def percentage(scores):
    if not scores:
        return Decimal("0.00")
    total = sum(scores) / len(scores) * 100
    return (Decimal(total.numerator) / Decimal(total.denominator)).quantize(Decimal("0.01"), ROUND_HALF_UP)


@transaction.atomic
def start_attempt(user, assessment, now=None, rng=random):
    """Reprend la tentative ouverte s'il y en a une, sinon en démarre une nouvelle."""
    from progress.services import exam_unlocked

    now = now or timezone.now()
    if assessment.is_exam and not exam_unlocked(user, assessment.partie):
        raise ExamLocked
    open_attempt = assessment.attempts.filter(user=user, submitted_at__isnull=True).last()
    if open_attempt:
        close_if_expired(open_attempt, now)
        if open_attempt.submitted_at is None:
            return open_attempt
    used = assessment.attempts.filter(user=user).count()
    if assessment.max_attempts is not None and used >= assessment.max_attempts:
        raise AttemptLimitReached
    deadline = now + timedelta(minutes=assessment.duration_minutes) if assessment.duration_minutes else None
    attempt = Attempt.objects.create(
        user=user, assessment=assessment, number=used + 1, started_at=now, deadline=deadline
    )
    last = assessment.attempts.filter(user=user, submitted_at__isnull=False).order_by("-number").first()
    previous = set(last.attempt_questions.values_list("question_id", flat=True)) if last else set()
    rows = []
    for i, question in enumerate(assessment.question_pool(rng, previous=previous)):
        order = list(question.choices.values_list("pk", flat=True))
        if assessment.shuffle:
            rng.shuffle(order)
        rows.append(AttemptQuestion(attempt=attempt, question=question, order=i, choice_order=order))
    AttemptQuestion.objects.bulk_create(rows)
    return attempt


def save_answer(attempt, question_id, choice_ids, now=None):
    """Enregistre la réponse ; question et choix sont désignés par leur identifiant public (UUID)."""
    now = now or timezone.now()
    if attempt.submitted_at is not None or (attempt.deadline and now >= attempt.deadline):
        raise AttemptClosed
    aq = attempt.attempt_questions.select_related("question").get(question__public_id=question_id)
    aq.selected_choices.set(aq.question.choices.filter(public_id__in=choice_ids))
    aq.answered_at = now
    aq.save(update_fields=["answered_at"])


@transaction.atomic
def submit_attempt(attempt, now=None, auto=False):
    now = now or timezone.now()
    attempt.score_pct = percentage([item["score"] for item in attempt.feedback()])
    attempt.submitted_at = now
    attempt.auto_submitted = auto
    attempt.save(update_fields=["score_pct", "submitted_at", "auto_submitted"])
    return attempt


def close_if_expired(attempt, now=None):
    """Envoie automatiquement, à l'heure limite, une tentative dont le temps est écoulé."""
    now = now or timezone.now()
    if attempt.submitted_at is None and attempt.deadline and now >= attempt.deadline:
        submit_attempt(attempt, now=attempt.deadline, auto=True)
    return attempt
