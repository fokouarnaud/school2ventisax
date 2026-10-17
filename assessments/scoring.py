"""Règles de notation (AGENTS.md, Q8). Scores exacts en Fraction, de 0 à 1."""
from fractions import Fraction


def score_answer(qtype, correct_ids, selected_ids):
    correct_ids, selected_ids = set(correct_ids), set(selected_ids)
    if qtype == "multiple":
        if not correct_ids:
            return Fraction(0)
        good = len(selected_ids & correct_ids)
        bad = len(selected_ids - correct_ids)
        return max(Fraction(0), Fraction(good - bad, len(correct_ids)))
    return Fraction(1) if selected_ids == correct_ids else Fraction(0)
