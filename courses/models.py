from django.db import models
from django.utils.translation import gettext_lazy as _


class Formation(models.Model):
    title = models.CharField(_("titre"), max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(_("description"), blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "pk"]

    def __str__(self):
        return self.title


class Partie(models.Model):
    formation = models.ForeignKey(Formation, on_delete=models.CASCADE, related_name="parties")
    title = models.CharField(_("titre"), max_length=200)
    slug = models.SlugField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "pk"]
        constraints = [models.UniqueConstraint(fields=["formation", "slug"], name="unique_partie_slug")]

    def __str__(self):
        return self.title


class Module(models.Model):
    partie = models.ForeignKey(Partie, on_delete=models.CASCADE, related_name="modules")
    title = models.CharField(_("titre"), max_length=200)
    order = models.PositiveIntegerField(default=0)
    duration_hours = models.PositiveIntegerField(_("durée (heures)"), default=0)
    competence = models.TextField(_("compétence visée"), blank=True)
    evaluation_note = models.TextField(_("modalités d'évaluation"), blank=True)

    class Meta:
        ordering = ["order", "pk"]

    def __str__(self):
        return self.title


class SectionQuerySet(models.QuerySet):
    def content(self):
        return self.filter(kind=Section.Kind.CONTENT)

    def practical(self):
        return self.filter(kind=Section.Kind.PRACTICAL)


class Section(models.Model):
    class Kind(models.TextChoices):
        CONTENT = "content", _("Contenu")
        PRACTICAL = "practical", _("Activités pratiques")

    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="sections")
    title = models.CharField(_("titre"), max_length=200)
    order = models.PositiveIntegerField(default=0)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.CONTENT)
    body_md = models.TextField(_("contenu (Markdown)"), blank=True)

    objects = SectionQuerySet.as_manager()

    class Meta:
        ordering = ["order", "pk"]

    def __str__(self):
        return self.title


class Annexe(models.Model):
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="annexes")
    title = models.CharField(_("titre"), max_length=200)
    file = models.FileField(upload_to="annexes/")

    def __str__(self):
        return self.title
