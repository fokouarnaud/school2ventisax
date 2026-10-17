from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class QuestionQuerySet(models.QuerySet):
    def published(self):
        return self.filter(status=Question.Status.PUBLISHED)


class Question(models.Model):
    class Type(models.TextChoices):
        SINGLE = "single", _("QCM une réponse")
        MULTIPLE = "multiple", _("QCM plusieurs réponses")
        TRUE_FALSE = "truefalse", _("Vrai / Faux")

    class Usage(models.TextChoices):
        QUIZ = "quiz", _("Quiz de module")
        EXAM = "exam", _("Examen de partie")

    class Status(models.TextChoices):
        DRAFT = "draft", _("Brouillon")
        PUBLISHED = "published", _("Publiée")

    module = models.ForeignKey("courses.Module", on_delete=models.CASCADE, related_name="questions")
    qtype = models.CharField(_("type"), max_length=10, choices=Type.choices, default=Type.SINGLE)
    usage = models.CharField(_("usage"), max_length=5, choices=Usage.choices, default=Usage.QUIZ)
    status = models.CharField(_("statut"), max_length=10, choices=Status.choices, default=Status.DRAFT)
    prompt = models.TextField(_("énoncé"))
    explanation = models.TextField(_("explication"), blank=True)
    # FileField plutôt qu'ImageField : Pillow est exclu (budget disque, AGENTS.md).
    image = models.FileField(
        _("image"), upload_to="questions/", blank=True,
        validators=[FileExtensionValidator(["webp", "png", "jpg", "jpeg", "svg"])],
    )
    reviewed_fr = models.BooleanField(_("relue en français"), default=False)
    reviewed_en = models.BooleanField(_("relue en anglais"), default=False)
    external_id = models.CharField(max_length=50, unique=True, null=True, blank=True)

    objects = QuestionQuerySet.as_manager()

    class Meta:
        ordering = ["module", "pk"]

    def __str__(self):
        return self.prompt[:60]

    def validate_for_publication(self):
        errors = []
        if not (self.reviewed_fr and self.reviewed_en):
            errors.append(_("La question doit être relue en français et en anglais."))
        choices = list(self.choices.all())
        correct = sum(c.is_correct for c in choices)
        if self.qtype == self.Type.SINGLE and correct != 1:
            errors.append(_("Un QCM à une réponse doit avoir exactement une bonne réponse."))
        if self.qtype == self.Type.MULTIPLE and correct < 2:
            errors.append(_("Un QCM à plusieurs réponses doit avoir au moins deux bonnes réponses."))
        if self.qtype == self.Type.TRUE_FALSE and (len(choices) != 2 or correct != 1):
            errors.append(_("Une question Vrai/Faux doit avoir deux choix dont un seul correct."))
        if errors:
            raise ValidationError(errors)

    def publish(self):
        self.validate_for_publication()
        self.status = self.Status.PUBLISHED
        self.save(update_fields=["status"])


class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="choices")
    text = models.CharField(_("texte"), max_length=300)
    is_correct = models.BooleanField(_("bonne réponse"), default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "pk"]

    def __str__(self):
        return self.text
