from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render
from django.utils.translation import get_language

from progress.models import SectionView
from progress.services import following_step, mark_section_viewed, module_completed, module_has_quiz, outline

from .access import accessible_formations
from .models import Module, Section
from .rendering import render_markdown


def _exam_open(rows):
    """L'examen s'ouvre quand tous les modules du sommaire sont terminés (même règle que exam_unlocked)."""
    return all(row["done"] for row in rows)


@login_required
def module_detail(request, public_id):
    module = get_object_or_404(Module, public_id=public_id, partie__formation__in=accessible_formations(request.user))
    viewed = set(SectionView.objects.filter(user=request.user, section__module=module).values_list("section_id", flat=True))
    sections = [{"section": s, "viewed": s.pk in viewed} for s in module.sections.all()]
    completed = module_completed(request.user, module)
    rows = outline(request.user, module.partie, current_module=module)
    return render(request, "courses/module_detail.html", {
        "module": module,
        "sections": sections,
        "outline": rows,
        "exam_open": _exam_open(rows),
        "has_quiz": module_has_quiz(module),
        # Actions du bas de page : reprendre la lecture, puis le quiz, puis l'étape suivante.
        "resume_section": next((row["section"] for row in sections if not row["viewed"]), None),
        "completed": completed,
        "following": following_step(request.user, module) if completed else None,
    })


@login_required
def section_detail(request, public_id):
    section = get_object_or_404(
        Section.objects.select_related("module__partie"),
        public_id=public_id,
        module__partie__formation__in=accessible_formations(request.user),
    )
    mark_section_viewed(request.user, section)
    siblings = list(section.module.sections.all())
    index = siblings.index(section)
    lang = get_language()
    rows = outline(request.user, section.module.partie, current_section=section)
    return render(request, "courses/section_detail.html", {
        "section": section,
        "body_html": render_markdown(section.body_md),
        "previous": siblings[index - 1] if index > 0 else None,
        "next": siblings[index + 1] if index + 1 < len(siblings) else None,
        "fallback_fr": lang != "fr" and not getattr(section, f"body_md_{lang}", ""),
        "outline": rows,
        "exam_open": _exam_open(rows),
    })
