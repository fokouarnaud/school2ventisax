from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils.translation import ngettext
from modeltranslation.admin import TranslationAdmin, TranslationTabularInline

from .models import Assessment, Choice, Question


class ChoiceInline(TranslationTabularInline):
    model = Choice
    extra = 0


@admin.register(Question)
class QuestionAdmin(TranslationAdmin):
    list_display = ("__str__", "module", "qtype", "usage", "status", "reviewed_fr", "reviewed_en")
    list_filter = ("status", "usage", "qtype", "module__partie", "module")
    search_fields = ("prompt_fr", "prompt_en", "external_id")
    readonly_fields = ("status",)
    inlines = [ChoiceInline]
    actions = ["mark_reviewed", "publish_selected"]

    @admin.action(description=_("Marquer comme relues (FR et EN)"))
    def mark_reviewed(self, request, queryset):
        count = queryset.update(reviewed_fr=True, reviewed_en=True)
        self.message_user(
            request,
            ngettext("%(n)d question marquée relue.", "%(n)d questions marquées relues.", count) % {"n": count},
            messages.SUCCESS,
        )

    @admin.action(description=_("Publier les questions sélectionnées"))
    def publish_selected(self, request, queryset):
        published, refused = 0, []
        for question in queryset:
            try:
                question.publish()
                published += 1
            except ValidationError as exc:
                refused.append(f"#{question.pk} : {' '.join(exc.messages)}")
        if published:
            self.message_user(
                request,
                ngettext("%(n)d question publiée.", "%(n)d questions publiées.", published) % {"n": published},
                messages.SUCCESS,
            )
        for reason in refused:
            self.message_user(request, _("Refusée %(reason)s") % {"reason": reason}, messages.WARNING)


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("__str__", "pass_threshold", "max_attempts", "duration_minutes", "questions_per_module", "shuffle")
    list_filter = ("kind",)
