from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Conversation, Message, MessageThread, FileAttachment, 
    Notification, MessageReadStatus
)

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user information for nested serialization"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']


class FileAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for file attachments in messages"""
    
    uploaded_by_details = UserBasicSerializer(source='uploaded_by', read_only=True)
    
    class Meta:
        model = FileAttachment
        fields = [
            'id', 'original_filename', 'file_path', 'file_size', 'file_type',
            'mime_type', 'is_public', 'download_count', 'virus_scan_status',
            'uploaded_by', 'uploaded_by_details', 'created_at'
        ]
        read_only_fields = [
            'id', 'file_path', 'file_size', 'mime_type', 'download_count',
            'virus_scan_status', 'uploaded_by', 'created_at'
        ]


class MessageReadStatusSerializer(serializers.ModelSerializer):
    """Serializer for message read status tracking"""
    
    user_details = UserBasicSerializer(source='user', read_only=True)
    
    class Meta:
        model = MessageReadStatus
        fields = ['id', 'user', 'user_details', 'read_at']
        read_only_fields = ['id', 'user', 'read_at']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for individual messages"""
    
    sender_details = UserBasicSerializer(source='sender', read_only=True)
    reply_to_details = serializers.SerializerMethodField()
    attachments = FileAttachmentSerializer(many=True, read_only=True)
    read_statuses = MessageReadStatusSerializer(many=True, read_only=True)
    replies_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'sender_details', 'message_type',
            'content', 'is_edited', 'edited_at', 'is_deleted', 'deleted_at',
            'reply_to', 'reply_to_details', 'system_data', 'attachments',
            'read_statuses', 'replies_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'sender', 'is_edited', 'edited_at', 'is_deleted', 'deleted_at',
            'created_at', 'updated_at'
        ]
    
    def get_reply_to_details(self, obj):
        """Get basic information about the message being replied to"""
        if obj.reply_to:
            return {
                'id': obj.reply_to.id,
                'sender_username': obj.reply_to.sender.username,
                'content': obj.reply_to.content[:100] + '...' if len(obj.reply_to.content) > 100 else obj.reply_to.content,
                'created_at': obj.reply_to.created_at,
            }
        return None
    
    def get_replies_count(self, obj):
        """Get count of replies to this message"""
        return obj.replies.count()


class MessageThreadSerializer(serializers.ModelSerializer):
    """Serializer for organized message threads"""
    
    created_by_details = UserBasicSerializer(source='created_by', read_only=True)
    task_details = serializers.SerializerMethodField()
    milestone_details = serializers.SerializerMethodField()
    recent_messages = serializers.SerializerMethodField()
    
    class Meta:
        model = MessageThread
        fields = [
            'id', 'conversation', 'title', 'thread_type', 'created_by',
            'created_by_details', 'task', 'task_details', 'milestone',
            'milestone_details', 'is_pinned', 'is_locked', 'is_resolved',
            'message_count', 'last_message_at', 'recent_messages',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'message_count', 'last_message_at',
            'created_at', 'updated_at'
        ]
    
    def get_task_details(self, obj):
        """Get basic task information"""
        if obj.task:
            return {
                'id': obj.task.id,
                'title': obj.task.title,
                'status': obj.task.status,
            }
        return None
    
    def get_milestone_details(self, obj):
        """Get basic milestone information"""
        if obj.milestone:
            return {
                'id': obj.milestone.id,
                'percentage': obj.milestone.percentage,
                'status': obj.milestone.status,
            }
        return None
    
    def get_recent_messages(self, obj):
        """Get recent messages in this thread"""
        recent_messages = obj.conversation.messages.filter(
            # Filter messages related to this thread if needed
        ).order_by('-created_at')[:3]
        return MessageSerializer(recent_messages, many=True).data


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for conversation containers"""
    
    participants_details = UserBasicSerializer(source='participants', many=True, read_only=True)
    created_by_details = UserBasicSerializer(source='created_by', read_only=True)
    project_details = serializers.SerializerMethodField()
    recent_messages = serializers.SerializerMethodField()
    threads = MessageThreadSerializer(many=True, read_only=True)
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'title', 'conversation_type', 'participants', 'participants_details',
            'created_by', 'created_by_details', 'project', 'project_details',
            'is_active', 'is_archived', 'last_message_at', 'message_count',
            'recent_messages', 'threads', 'unread_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'last_message_at', 'message_count',
            'created_at', 'updated_at'
        ]
    
    def get_project_details(self, obj):
        """Get basic project information"""
        if obj.project:
            return {
                'id': obj.project.id,
                'title': obj.project.title,
                'status': obj.project.status,
            }
        return None
    
    def get_recent_messages(self, obj):
        """Get recent messages in this conversation"""
        recent_messages = obj.messages.order_by('-created_at')[:5]
        return MessageSerializer(recent_messages, many=True).data
    
    def get_unread_count(self, obj):
        """Get unread message count for current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Count messages not read by current user
            read_message_ids = MessageReadStatus.objects.filter(
                user=request.user,
                message__conversation=obj
            ).values_list('message_id', flat=True)
            
            return obj.messages.exclude(id__in=read_message_ids).count()
        return 0


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for user notifications"""
    
    recipient_details = UserBasicSerializer(source='recipient', read_only=True)
    related_message_details = serializers.SerializerMethodField()
    related_project_details = serializers.SerializerMethodField()
    related_task_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'recipient_details', 'notification_type', 'title',
            'message', 'priority', 'related_message', 'related_message_details',
            'related_project', 'related_project_details', 'related_task',
            'related_task_details', 'is_read', 'read_at', 'is_dismissed',
            'dismissed_at', 'email_sent', 'push_sent', 'metadata',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'recipient', 'email_sent', 'push_sent', 'created_at', 'updated_at'
        ]
    
    def get_related_message_details(self, obj):
        """Get basic related message information"""
        if obj.related_message:
            return {
                'id': obj.related_message.id,
                'sender_username': obj.related_message.sender.username,
                'content': obj.related_message.content[:100] + '...' if len(obj.related_message.content) > 100 else obj.related_message.content,
                'conversation_id': obj.related_message.conversation.id,
            }
        return None
    
    def get_related_project_details(self, obj):
        """Get basic related project information"""
        if obj.related_project:
            return {
                'id': obj.related_project.id,
                'title': obj.related_project.title,
                'status': obj.related_project.status,
            }
        return None
    
    def get_related_task_details(self, obj):
        """Get basic related task information"""
        if obj.related_task:
            return {
                'id': obj.related_task.id,
                'title': obj.related_task.title,
                'status': obj.related_task.status,
                'project_title': obj.related_task.project.title,
            }
        return None


# Nested serializers for complex relationships
class ConversationDetailSerializer(ConversationSerializer):
    """Detailed conversation serializer with all messages"""
    
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta(ConversationSerializer.Meta):
        fields = ConversationSerializer.Meta.fields + ['messages']


class MessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new messages"""
    
    class Meta:
        model = Message
        fields = ['conversation', 'message_type', 'content', 'reply_to', 'system_data']
    
    def create(self, validated_data):
        """Create message with sender from request user"""
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class ConversationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new conversations"""
    
    participant_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Conversation
        fields = [
            'title', 'conversation_type', 'project', 'participant_ids'
        ]
    
    def create(self, validated_data):
        """Create conversation with creator and participants"""
        participant_ids = validated_data.pop('participant_ids', [])
        validated_data['created_by'] = self.context['request'].user
        
        conversation = super().create(validated_data)
        
        # Add creator as participant
        conversation.participants.add(self.context['request'].user)
        
        # Add other participants
        if participant_ids:
            participants = User.objects.filter(id__in=participant_ids)
            conversation.participants.add(*participants)
        
        return conversation


class NotificationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating notification status"""
    
    class Meta:
        model = Notification
        fields = ['is_read', 'is_dismissed']