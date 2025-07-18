from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator
import uuid

User = get_user_model()


class Conversation(models.Model):
    """Conversation container for organizing messages"""
    
    CONVERSATION_TYPES = [
        ('direct', 'Direct Message'),
        ('project', 'Project Discussion'),
        ('group', 'Group Chat'),
        ('support', 'Support Ticket'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, blank=True, null=True)
    conversation_type = models.CharField(max_length=20, choices=CONVERSATION_TYPES, default='direct')
    
    # Participants
    participants = models.ManyToManyField(User, related_name='conversations')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_conversations')
    
    # Related objects
    project = models.ForeignKey(
        'projects.Project', 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    
    # Conversation settings
    is_active = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)
    
    # Metadata
    last_message_at = models.DateTimeField(null=True, blank=True)
    message_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'conversations'
        ordering = ['-last_message_at', '-created_at']
        
    def __str__(self):
        if self.title:
            return self.title
        elif self.conversation_type == 'project' and self.project:
            return f"Project: {self.project.title}"
        else:
            participant_names = [p.username for p in self.participants.all()[:3]]
            return f"Chat: {', '.join(participant_names)}"


class Message(models.Model):
    """Individual messages within conversations"""
    
    MESSAGE_TYPES = [
        ('text', 'Text Message'),
        ('file', 'File Attachment'),
        ('system', 'System Message'),
        ('notification', 'Notification'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    
    # Message content
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text')
    content = models.TextField()
    
    # Message metadata
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # Reply functionality
    reply_to = models.ForeignKey(
        'self', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        related_name='replies'
    )
    
    # System message data
    system_data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'messages'
        ordering = ['created_at']
        
    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}..."


class MessageThread(models.Model):
    """Organized message threads for project communications"""
    
    THREAD_TYPES = [
        ('general', 'General Discussion'),
        ('task', 'Task Discussion'),
        ('milestone', 'Milestone Discussion'),
        ('review', 'Code Review'),
        ('issue', 'Issue/Bug Report'),
        ('announcement', 'Announcement'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='threads')
    title = models.CharField(max_length=200)
    thread_type = models.CharField(max_length=20, choices=THREAD_TYPES, default='general')
    
    # Thread starter
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_threads')
    
    # Related objects
    task = models.ForeignKey(
        'projects.Task', 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE,
        related_name='discussion_threads'
    )
    milestone = models.ForeignKey(
        'payments.Milestone', 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE,
        related_name='discussion_threads'
    )
    
    # Thread settings
    is_pinned = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    is_resolved = models.BooleanField(default=False)
    
    # Thread statistics
    message_count = models.IntegerField(default=0)
    last_message_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'message_threads'
        ordering = ['-is_pinned', '-last_message_at', '-created_at']
        
    def __str__(self):
        return f"{self.conversation} - {self.title}"


class FileAttachment(models.Model):
    """File attachments for sharing within conversations"""
    
    FILE_TYPES = [
        ('document', 'Document'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('archive', 'Archive'),
        ('code', 'Code File'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_files')
    
    # File details
    original_filename = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)  # Path to stored file
    file_size = models.BigIntegerField()  # Size in bytes
    file_type = models.CharField(max_length=20, choices=FILE_TYPES)
    mime_type = models.CharField(max_length=100)
    
    # File metadata
    is_public = models.BooleanField(default=False)
    download_count = models.IntegerField(default=0)
    
    # Security
    virus_scan_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('clean', 'Clean'),
            ('infected', 'Infected'),
            ('error', 'Scan Error'),
        ],
        default='pending'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'file_attachments'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.original_filename} - {self.uploaded_by.username}"


class Notification(models.Model):
    """System notifications for users"""
    
    NOTIFICATION_TYPES = [
        ('message', 'New Message'),
        ('project_update', 'Project Update'),
        ('task_assigned', 'Task Assigned'),
        ('task_completed', 'Task Completed'),
        ('task_qa_review', 'Task QA Review'),
        ('task_client_approval', 'Task Client Approval'),
        ('task_approved', 'Task Approved'),
        ('task_qa_rejected', 'Task QA Rejected'),
        ('task_client_rejected', 'Task Client Rejected'),
        ('milestone_completed', 'Milestone Completed'),
        ('payment_received', 'Payment Received'),
        ('milestone_reached', 'Milestone Reached'),
        ('review_request', 'Review Request'),
        ('system_announcement', 'System Announcement'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    # Notification content
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='normal')
    
    # Related objects
    related_message = models.ForeignKey(
        Message, 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    related_project = models.ForeignKey(
        'projects.Project', 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    related_task = models.ForeignKey(
        'projects.Task', 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    
    # Notification status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    is_dismissed = models.BooleanField(default=False)
    dismissed_at = models.DateTimeField(null=True, blank=True)
    
    # Delivery settings
    email_sent = models.BooleanField(default=False)
    push_sent = models.BooleanField(default=False)
    
    # Additional data
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', 'notification_type']),
        ]
        
    def __str__(self):
        return f"{self.recipient.username} - {self.title}"


class MessageReadStatus(models.Model):
    """Track read status of messages by users"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='read_statuses')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_read_statuses')
    
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'message_read_statuses'
        unique_together = ['message', 'user']
        ordering = ['-read_at']
        
    def __str__(self):
        return f"{self.user.username} read message {self.message.id}"
