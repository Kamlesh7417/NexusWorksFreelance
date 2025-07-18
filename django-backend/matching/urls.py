from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'matches', views.DeveloperMatchViewSet, basename='developermatch')
router.register(r'real-time', views.RealTimeMatchingViewSet, basename='realtimematching')
router.register(r'preferences', views.MatchingPreferencesViewSet, basename='matchingpreferences')
router.register(r'analytics', views.MatchingAnalyticsViewSet, basename='matchinganalytics')

urlpatterns = [
    path('', include(router.urls)),
]