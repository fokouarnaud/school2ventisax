from django.urls import path

from . import views

urlpatterns = [
    path("", views.trainer_table, name="trainer_table"),
    path("export.csv", views.export_csv, name="trainer_export"),
]
