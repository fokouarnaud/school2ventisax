"""Cycle de vie des tentatives : démarrage, sauvegarde des réponses, envoi."""
from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.utils import timezone

from .models import Attempt, AttemptQuestion


@transaction.atomic
def start_attempt(user, assessment, now=None):
    now = now or timezone.now()
    number = assessment.attempts.filter(user=user).count() + 1
    attempt = Attempt.objects.create(user=user, assessment=assessment, number=number, started_at=now)
    AttemptQuestion.objects.bulk_create(
        AttemptQuestion(attempt=attempt, question=q, order=i)
        for i, q in enumerate(assessment.question_pool())
    )
    return attempt


def save_answer(attempt, question_id, choice_ids, now=None):
    now = now or timezone.now()
    aq = attempt.attempt_questions.get(question_id=question_id)
    aq.selected_choices.set(aq.question.choices.filter(pk__in=choice_ids))
    aq.answered_at = now
    aq.save(update_fields=["answered_at"])


def _percentage(scores):
    if not scores:
        return Decimal("0.00")
    total = sum(scores) / len(scores) * 100
    return (Decimal(total.numerator) / Decimal(total.denominator)).quantize(Decimal("0.01"), ROUND_HALF_UP)


@transaction.atomic
def submit_attempt(attempt, now=None):
    now = now or timezone.now()
    scores = [item["score"] for item in attempt.feedback()]
    attempt.score_pct = _percentage(scores)
    attempt.submitted_at = now
    attempt.save(update_fields=["score_pct", "submitted_at"])
    return attempt
