from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render
from django.utils.translation import get_language

from progress.models import SectionView
from progress.services import mark_section_viewed

from .access import accessible_formations
from .models import Module, Section
from .rendering import render_markdown


@login_required
def module_detail(request, pk):
    module = get_object_or_404(Module, pk=pk, partie__formation__in=accessible_formations(request.user))
    viewed = set(SectionView.objects.filter(user=request.user, section__module=module).values_list("section_id", flat=True))
    sections = [{"section": s, "viewed": s.pk in viewed} for s in module.sections.all()]
    return render(request, "courses/module_detail.html", {"module": module, "sections": sections})


@login_required
def section_detail(request, pk):
    section = get_object_or_404(
        Section.objects.select_related("module__partie"),
        pk=pk,
        module__partie__formation__in=accessible_formations(request.user),
    )
    mark_section_viewed(request.user, section)
    siblings = list(section.module.sections.all())
    index = siblings.index(section)
    lang = get_language()
    return render(request, "courses/section_detail.html", {
        "section": section,
        "body_html": render_markdown(section.body_md),
        "previous": siblings[index - 1] if index > 0 else None,
        "next": siblings[index + 1] if index + 1 < len(siblings) else None,
        "fallback_fr": lang != "fr" and not getattr(section, f"body_md_{lang}", ""),
    })
