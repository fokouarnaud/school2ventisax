from django.urls import path

from . import views

urlpatterns = [
    path("quiz/<int:module_pk>/", views.start_quiz, name="start_quiz"),
    path("examen/<int:partie_pk>/", views.exam, name="exam"),
    path("tentatives/<int:pk>/", views.attempt_detail, name="attempt_detail"),
    path("tentatives/<int:pk>/reponse/", views.save_answer_view, name="save_answer"),
    path("tentatives/<int:pk>/envoyer/", views.submit_view, name="submit_attempt"),
    path("tentatives/<int:pk>/resultat/", views.result, name="attempt_result"),
]
