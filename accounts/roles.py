"""Droits d'accès à l'admin Django dérivés du rôle (formateurs : questions et lecture des sections ; admins : tout le contenu)."""
from django.contrib.auth.models import Group, Permission
from django.db.models import Q

TRAINERS_GROUP = "Formateurs"
ADMINS_GROUP = "Administrateurs"

TRAINER_MODELS = {"assessments": ["question", "choice"]}
ADMIN_APPS = ["accounts", "courses", "assessments", "progress"]


def _group(name):
    group, _ = Group.objects.get_or_create(name=name)
    if name == TRAINERS_GROUP:
        perms = Permission.objects.filter(
            Q(content_type__app_label="assessments", content_type__model__in=TRAINER_MODELS["assessments"])
            | Q(content_type__app_label="courses", codename="view_section")  # relecture des compléments (US-27)
        )
    else:
        perms = Permission.objects.filter(content_type__app_label__in=ADMIN_APPS)
    # Ajout seulement : un groupe existant reçoit les droits apparus depuis sa création.
    group.permissions.add(*perms)
    return group


def sync_role_groups(user):
    wanted = []
    if user.role == user.Role.TRAINER:
        wanted = [_group(TRAINERS_GROUP)]
    elif user.role == user.Role.ADMIN:
        wanted = [_group(ADMINS_GROUP)]
    managed = Group.objects.filter(name__in=[TRAINERS_GROUP, ADMINS_GROUP])
    user.groups.remove(*managed.exclude(pk__in=[g.pk for g in wanted]))
    user.groups.add(*wanted)
