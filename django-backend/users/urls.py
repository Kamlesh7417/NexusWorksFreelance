from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profile', views.UserViewSet, basename='user')
router.register(r'skills', views.SkillViewSet, basename='skill')
router.register(r'user-skills', views.UserSkillViewSet, basename='user-skill')
router.register(r'portfolio', views.PortfolioViewSet, basename='portfolio')

urlpatterns = [
    path('', include(router.urls)),
]