from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404, render
from django.urls import path, reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from .importing import import_learners
from .models import Promotion, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "first_name", "last_name", "role", "promotion", "is_active")
    list_filter = ("role", "promotion", "is_active")
    fieldsets = BaseUserAdmin.fieldsets + ((_("Acad Ventisax"), {"fields": ("role", "promotion")}),)
    add_fieldsets = BaseUserAdmin.add_fieldsets + ((_("Acad Ventisax"), {"fields": ("role", "promotion")}),)


class LearnerImportForm(forms.Form):
    file = forms.FileField(label=_("Fichier CSV (username;first_name;last_name;email)"))


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ("name", "formation", "start_date", "import_link")
    filter_horizontal = ("trainers",)

    def get_urls(self):
        return [
            path("<int:pk>/import/", self.admin_site.admin_view(self.import_view), name="accounts_promotion_import"),
        ] + super().get_urls()

    @admin.display(description=_("Apprenants"))
    def import_link(self, obj):
        return format_html('<a href="{}">{}</a>', reverse("admin:accounts_promotion_import", args=[obj.pk]), _("Importer un CSV"))

    def import_view(self, request, pk):
        promotion = get_object_or_404(Promotion, pk=pk)
        if not self.has_change_permission(request, promotion):
            raise PermissionDenied
        report, error = None, None
        form = LearnerImportForm(request.POST or None, request.FILES or None)
        if request.method == "POST" and form.is_valid():
            try:
                report = import_learners(form.cleaned_data["file"].read().decode("utf-8-sig"), promotion)
            except (ValueError, UnicodeDecodeError) as exc:
                error = str(exc)
        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "promotion": promotion,
            "form": form,
            "report": report,
            "error": error,
            "title": _("Importer des apprenants"),
        }
        return render(request, "admin/accounts/promotion/import.html", context)
