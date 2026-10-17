from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    class Role(models.TextChoices):
        LEARNER = "learner", _("Apprenant")
        TRAINER = "trainer", _("Formateur")
        ADMIN = "admin", _("Administrateur")

    role = models.CharField(_("rôle"), max_length=10, choices=Role.choices, default=Role.LEARNER)
    promotion = models.ForeignKey(
        "accounts.Promotion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="learners",
        verbose_name=_("promotion"),
    )

    @property
    def is_learner(self):
        return self.role == self.Role.LEARNER

    @property
    def is_trainer(self):
        return self.role == self.Role.TRAINER

    @property
    def is_platform_admin(self):
        return self.is_superuser or self.role == self.Role.ADMIN


class PromotionQuerySet(models.QuerySet):
    def visible_to(self, user):
        if user.is_platform_admin:
            return self.all()
        if user.is_trainer:
            return self.filter(trainers=user)
        return self.filter(pk=user.promotion_id) if user.promotion_id else self.none()


class Promotion(models.Model):
    name = models.CharField(_("nom"), max_length=100, unique=True)
    formation = models.ForeignKey("courses.Formation", on_delete=models.PROTECT, related_name="promotions")
    start_date = models.DateField(_("date de début"), null=True, blank=True)
    trainers = models.ManyToManyField(
        User,
        blank=True,
        related_name="taught_promotions",
        limit_choices_to={"role": User.Role.TRAINER},
        verbose_name=_("formateurs"),
    )

    objects = PromotionQuerySet.as_manager()

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
