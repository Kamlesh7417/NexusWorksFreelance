from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone

from .models import (
    Conversation, Message, MessageThread, FileAttachment, 
    Notification, MessageReadStatus
)
from .serializers import (
    ConversationSerializer, ConversationDetailSerializer, ConversationCreateSerializer,
    MessageSerializer, MessageCreateSerializer, MessageThreadSerializer,
    FileAttachmentSerializer, NotificationSerializer, NotificationUpdateSerializer,
    MessageReadStatusSerializer
)


class ConversationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing conversations"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'participants__username']
    ordering_fields = ['last_message_at', 'created_at', 'message_count']
    ordering = ['-last_message_at']
    filterset_fields = ['conversation_type', 'is_active', 'is_archived']
    
    def get_queryset(self):
        """Return conversations where user is a participant"""
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants', 'messages', 'threads')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return ConversationCreateSerializer
        elif self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationSerializer
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a conversation"""
        conversation = self.get_object()
        conversation.is_archived = True
        conversation.save()
        return Response({'status': 'archived'})
    
    @action(detail=True, methods=['post'])
    def unarchive(self, request, pk=None):
        """Unarchive a conversation"""
        conversation = self.get_object()
        conversation.is_archived = False
        conversation.save()
        return Response({'status': 'unarchived'})
    
    @action(detail=True, methods=['post'])
    def add_participant(self, request, pk=None):
        """Add a participant to the conversation"""
        conversation = self.get_object()
        user_id = request.data.get('user_id')
        
        if user_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.get(id=user_id)
                conversation.participants.add(user)
                return Response({'status': 'participant added'})
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(
            {'error': 'user_id required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def remove_participant(self, request, pk=None):
        """Remove a participant from the conversation"""
        conversation = self.get_object()
        user_id = request.data.get('user_id')
        
        if user_id:
            conversation.participants.remove(user_id)
            return Response({'status': 'participant removed'})
        
        return Response(
            {'error': 'user_id required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get total unread conversations count"""
        unread_count = self.get_queryset().filter(
            messages__read_statuses__isnull=True,
            messages__sender__ne=request.user
        ).distinct().count()
        
        return Response({'unread_count': unread_count})


class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing messages"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['content', 'sender__username']
    ordering_fields = ['created_at']
    ordering = ['created_at']
    filterset_fields = ['message_type', 'conversation', 'sender']
    
    def get_queryset(self):
        """Return messages from conversations where user is a participant"""
        return Message.objects.filter(
            conversation__participants=self.request.user
        ).select_related('sender', 'conversation', 'reply_to')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return MessageCreateSerializer
        return MessageSerializer
    
    def perform_create(self, serializer):
        """Set sender and update conversation metadata"""
        message = serializer.save(sender=self.request.user)
        
        # Update conversation metadata
        conversation = message.conversation
        conversation.last_message_at = timezone.now()
        conversation.message_count = conversation.messages.count()
        conversation.save()
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark message as read by current user"""
        message = self.get_object()
        MessageReadStatus.objects.get_or_create(
            message=message,
            user=request.user
        )
        return Response({'status': 'marked as read'})
    
    @action(detail=True, methods=['post'])
    def edit(self, request, pk=None):
        """Edit message content"""
        message = self.get_object()
        
        # Only sender can edit their own messages
        if message.sender != request.user:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_content = request.data.get('content')
        if new_content:
            message.content = new_content
            message.is_edited = True
            message.edited_at = timezone.now()
            message.save()
            
            serializer = self.get_serializer(message)
            return Response(serializer.data)
        
        return Response(
            {'error': 'content required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def delete_message(self, request, pk=None):
        """Soft delete message"""
        message = self.get_object()
        
        # Only sender can delete their own messages
        if message.sender != request.user:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        message.is_deleted = True
        message.deleted_at = timezone.now()
        message.content = "[Message deleted]"
        message.save()
        
        return Response({'status': 'message deleted'})
    
    @action(detail=False, methods=['post'])
    def mark_conversation_read(self, request):
        """Mark all messages in a conversation as read"""
        conversation_id = request.data.get('conversation_id')
        
        if conversation_id:
            messages = self.get_queryset().filter(
                conversation_id=conversation_id
            ).exclude(sender=request.user)
            
            for message in messages:
                MessageReadStatus.objects.get_or_create(
                    message=message,
                    user=request.user
                )
            
            return Response({'status': 'conversation marked as read'})
        
        return Response(
            {'error': 'conversation_id required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


class MessageThreadViewSet(viewsets.ModelViewSet):
    """ViewSet for managing message threads"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'created_by__username']
    ordering_fields = ['last_message_at', 'created_at', 'message_count']
    ordering = ['-is_pinned', '-last_message_at']
    filterset_fields = ['thread_type', 'is_pinned', 'is_locked', 'is_resolved']
    
    def get_queryset(self):
        """Return threads from conversations where user is a participant"""
        return MessageThread.objects.filter(
            conversation__participants=self.request.user
        ).select_related('created_by', 'conversation', 'task', 'milestone')
    
    def perform_create(self, serializer):
        """Set creator from request user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        """Pin a thread"""
        thread = self.get_object()
        thread.is_pinned = True
        thread.save()
        return Response({'status': 'pinned'})
    
    @action(detail=True, methods=['post'])
    def unpin(self, request, pk=None):
        """Unpin a thread"""
        thread = self.get_object()
        thread.is_pinned = False
        thread.save()
        return Response({'status': 'unpinned'})
    
    @action(detail=True, methods=['post'])
    def lock(self, request, pk=None):
        """Lock a thread"""
        thread = self.get_object()
        thread.is_locked = True
        thread.save()
        return Response({'status': 'locked'})
    
    @action(detail=True, methods=['post'])
    def unlock(self, request, pk=None):
        """Unlock a thread"""
        thread = self.get_object()
        thread.is_locked = False
        thread.save()
        return Response({'status': 'unlocked'})
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark thread as resolved"""
        thread = self.get_object()
        thread.is_resolved = True
        thread.save()
        return Response({'status': 'resolved'})


class FileAttachmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing file attachments"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['original_filename', 'uploaded_by__username']
    ordering_fields = ['created_at', 'file_size', 'download_count']
    ordering = ['-created_at']
    filterset_fields = ['file_type', 'virus_scan_status', 'is_public']
    
    def get_queryset(self):
        """Return attachments from messages in conversations where user is a participant"""
        return FileAttachment.objects.filter(
            message__conversation__participants=self.request.user
        ).select_related('uploaded_by', 'message')
    
    def perform_create(self, serializer):
        """Set uploader from request user"""
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def download(self, request, pk=None):
        """Track file download"""
        attachment = self.get_object()
        attachment.download_count += 1
        attachment.save()
        
        # Return file download URL or serve file
        return Response({
            'download_url': attachment.file_path,
            'filename': attachment.original_filename
        })


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user notifications"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'priority']
    ordering = ['-created_at']
    filterset_fields = ['notification_type', 'priority', 'is_read', 'is_dismissed']
    
    def get_queryset(self):
        """Return notifications for current user"""
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('related_message', 'related_project', 'related_task')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ['update', 'partial_update']:
            return NotificationUpdateSerializer
        return NotificationSerializer
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return Response({'status': 'marked as read'})
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss notification"""
        notification = self.get_object()
        notification.is_dismissed = True
        notification.dismissed_at = timezone.now()
        notification.save()
        return Response({'status': 'dismissed'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'status': 'all notifications marked as read'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get unread notifications count"""
        unread_count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': unread_count})
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get notifications summary by type"""
        summary = self.get_queryset().values('notification_type').annotate(
            count=Count('id'),
            unread_count=Count('id', filter=Q(is_read=False))
        )
        return Response({'summary': list(summary)})


class MessageReadStatusViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing message read statuses"""
    
    serializer_class = MessageReadStatusSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['read_at']
    ordering = ['-read_at']
    filterset_fields = ['message', 'user']
    
    def get_queryset(self):
        """Return read statuses for messages in conversations where user is a participant"""
        return MessageReadStatus.objects.filter(
            message__conversation__participants=self.request.user
        ).select_related('user', 'message')
