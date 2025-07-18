from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Register ViewSets
router.register(r'events', views.EventViewSet, basename='event')
router.register(r'registrations', views.EventRegistrationViewSet, basename='eventregistration')
router.register(r'hackathons', views.HackathonViewSet, basename='hackathon')
router.register(r'teams', views.HackathonTeamViewSet, basename='hackathonteam')
router.register(r'meetups', views.MeetupViewSet, basename='meetup')
router.register(r'prizes', views.PrizeViewSet, basename='prize')
router.register(r'winners', views.WinnerViewSet, basename='winner')
router.register(r'posts', views.CommunityPostViewSet, basename='communitypost')
router.register(r'virtual-sessions', views.VirtualMeetingSessionViewSet, basename='virtualmeetingsession')
router.register(r'recordings', views.MeetingRecordingViewSet, basename='meetingrecording')
router.register(r'calendar-integrations', views.CalendarIntegrationViewSet, basename='calendarintegration')

urlpatterns = [
    path('', include(router.urls)),
]