from django.contrib.auth import views as auth_views
from django.urls import path

from . import views
from .throttling import ThrottledAuthenticationForm

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("connexion/", auth_views.LoginView.as_view(
        template_name="accounts/login.html", authentication_form=ThrottledAuthenticationForm,
    ), name="login"),
    path("deconnexion/", auth_views.LogoutView.as_view(), name="logout"),
]
