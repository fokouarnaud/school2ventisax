"""Progression (AGENTS.md, Q9) : sections vues + quiz envoyé ; examen ouvert quand tous les modules sont terminés."""
from assessments.models import Assessment, Attempt, Question
from courses.models import Section

from .models import SectionView


def mark_section_viewed(user, section):
    SectionView.objects.get_or_create(user=user, section=section)


def module_has_quiz(module):
    return Question.objects.published().filter(module=module, usage=Question.Usage.QUIZ).exists()


def _quiz_submitted(user, module):
    return Attempt.objects.filter(
        user=user,
        assessment__kind=Assessment.Kind.MODULE_QUIZ,
        assessment__module=module,
        submitted_at__isnull=False,
    ).exists()


def _module_steps(user, module):
    """Renvoie (étapes faites, étapes totales) pour un module."""
    section_ids = list(Section.objects.filter(module=module).values_list("pk", flat=True))
    done = SectionView.objects.filter(user=user, section_id__in=section_ids).count()
    total = len(section_ids)
    if module_has_quiz(module):
        total += 1
        done += _quiz_submitted(user, module)
    return done, total


def module_completed(user, module):
    done, total = _module_steps(user, module)
    return done == total


def exam_unlocked(user, partie):
    return all(module_completed(user, m) for m in partie.modules.all())


def following_step(user, module):
    """Après un module terminé : le prochain module non terminé (en partant de celui-ci), sinon l'examen de la partie."""
    modules = list(module.partie.modules.all())
    i = modules.index(module)
    for m in modules[i + 1:] + modules[:i]:
        if not module_completed(user, m):
            return {"kind": "module", "module": m}
    return {"kind": "exam", "partie": module.partie}


def progress_pct(user, partie):
    done = total = 0
    for module in partie.modules.all():
        d, t = _module_steps(user, module)
        done, total = done + d, total + t
    return done * 100 // total if total else 0


def outline(user, partie, current_section=None, current_module=None):
    """Sommaire latéral façon NetAcad : modules de la partie, leurs sections, états vu / terminé / courant."""
    if current_section is not None:
        current_module = current_section.module
    viewed = set(
        SectionView.objects.filter(user=user, section__module__partie=partie).values_list("section_id", flat=True)
    )
    rows = []
    for module in partie.modules.prefetch_related("sections"):
        rows.append({
            "module": module,
            "current": current_module is not None and module.pk == current_module.pk,
            "done": module_completed(user, module),
            "sections": [
                {
                    "section": s,
                    "viewed": s.pk in viewed,
                    "current": current_section is not None and s.pk == current_section.pk,
                }
                for s in module.sections.all()
            ],
        })
    return rows
