from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Register ViewSets
router.register(r'learning-paths', views.LearningPathViewSet, basename='learningpath')
router.register(r'courses', views.CourseViewSet, basename='course')
router.register(r'enrollments', views.CourseEnrollmentViewSet, basename='courseenrollment')
router.register(r'shadowing-sessions', views.ShadowingSessionViewSet, basename='shadowingsession')
router.register(r'credits', views.LearningCreditViewSet, basename='learningcredit')

urlpatterns = [
    path('', include(router.urls)),
]