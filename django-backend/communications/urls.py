from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Register ViewSets
router.register(r'conversations', views.ConversationViewSet, basename='conversation')
router.register(r'messages', views.MessageViewSet, basename='message')
router.register(r'threads', views.MessageThreadViewSet, basename='messagethread')
router.register(r'attachments', views.FileAttachmentViewSet, basename='fileattachment')
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'read-status', views.MessageReadStatusViewSet, basename='messagereadstatus')

urlpatterns = [
    path('', include(router.urls)),
]