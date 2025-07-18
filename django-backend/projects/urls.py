from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .project_console_views import ProjectConsoleViewSet

router = DefaultRouter()
router.register(r'', views.ProjectViewSet, basename='project')
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'milestones', views.MilestoneViewSet, basename='milestone')
router.register(r'payments', views.PaymentViewSet, basename='payment')
router.register(r'reviews', views.ProjectReviewViewSet, basename='project-review')
router.register(r'proposals', views.ProjectProposalViewSet, basename='project-proposal')
router.register(r'proposal-modifications', views.ProposalModificationViewSet, basename='proposal-modification')
router.register(r'senior-assignments', views.SeniorDeveloperAssignmentViewSet, basename='senior-assignment')
router.register(r'team-invitations', views.TeamInvitationViewSet, basename='team-invitation')
router.register(r'task-assignments', views.TaskAssignmentViewSet, basename='task-assignment')
router.register(r'team-hiring', views.TeamHiringViewSet, basename='team-hiring')
router.register(r'dynamic-pricing', views.DynamicPricingViewSet, basename='dynamic-pricing')
router.register(r'resource-allocation', views.ResourceAllocationViewSet, basename='resource-allocation')
router.register(r'console', ProjectConsoleViewSet, basename='project-console')

urlpatterns = [
    path('', include(router.urls)),
]