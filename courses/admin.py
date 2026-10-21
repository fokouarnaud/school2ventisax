from django.contrib import admin
from modeltranslation.admin import TranslationAdmin, TranslationStackedInline, TranslationTabularInline

from .models import Annexe, Formation, Module, Partie, Section


class PartieInline(TranslationTabularInline):
    model = Partie
    extra = 0
    prepopulated_fields = {"slug": ("title_fr",)}


@admin.register(Formation)
class FormationAdmin(TranslationAdmin):
    list_display = ("title", "order")
    prepopulated_fields = {"slug": ("title_fr",)}
    inlines = [PartieInline]


class ModuleInline(TranslationTabularInline):
    model = Module
    extra = 0
    fields = ("order", "title", "duration_hours")


@admin.register(Partie)
class PartieAdmin(TranslationAdmin):
    list_display = ("title", "formation", "order")
    inlines = [ModuleInline]


class SectionInline(TranslationStackedInline):
    model = Section
    extra = 0


@admin.register(Module)
class ModuleAdmin(TranslationAdmin):
    list_display = ("title", "partie", "order", "duration_hours")
    list_filter = ("partie",)
    inlines = [SectionInline]


class AnnexeInline(TranslationTabularInline):
    model = Annexe
    extra = 0


@admin.register(Section)
class SectionAdmin(TranslationAdmin):
    list_display = ("title", "module", "kind", "is_supplement", "order")
    list_filter = ("kind", "is_supplement", "module__partie", "module")
    inlines = [AnnexeInline]
