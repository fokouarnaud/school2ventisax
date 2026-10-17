from django.urls import path

from . import views

urlpatterns = [
    path("modules/<int:pk>/", views.module_detail, name="module_detail"),
    path("sections/<int:pk>/", views.section_detail, name="section_detail"),
]
