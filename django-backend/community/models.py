from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()


class Event(models.Model):
    """Community events and activities"""
    
    EVENT_TYPES = [
        ('meetup', 'Meetup'),
        ('workshop', 'Workshop'),
        ('webinar', 'Webinar'),
        ('conference', 'Conference'),
        ('networking', 'Networking Event'),
        ('hackathon', 'Hackathon'),
        ('competition', 'Competition'),
        ('social', 'Social Event'),
    ]
    
    EVENT_STATUS = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('registration_open', 'Registration Open'),
        ('registration_closed', 'Registration Closed'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
        ('members_only', 'Members Only'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    
    # Event organizer
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organized_events')
    co_organizers = models.ManyToManyField(User, blank=True, related_name='co_organized_events')
    
    # Event details
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Location (can be virtual or physical)
    is_virtual = models.BooleanField(default=True)
    location_name = models.CharField(max_length=200, blank=True, null=True)
    location_address = models.TextField(blank=True, null=True)
    virtual_meeting_url = models.URLField(blank=True, null=True)
    virtual_meeting_id = models.CharField(max_length=100, blank=True, null=True)
    virtual_meeting_password = models.CharField(max_length=100, blank=True, null=True)
    
    # Video conferencing integration
    video_provider = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        choices=[
            ('zoom', 'Zoom'),
            ('google_meet', 'Google Meet'),
            ('microsoft_teams', 'Microsoft Teams'),
            ('webex', 'WebEx'),
            ('custom', 'Custom')
        ]
    )
    video_meeting_data = models.JSONField(default=dict)  # Store provider-specific meeting data
    
    # Meeting features
    enable_recording = models.BooleanField(default=False)
    enable_screen_sharing = models.BooleanField(default=True)
    enable_chat = models.BooleanField(default=True)
    enable_breakout_rooms = models.BooleanField(default=False)
    waiting_room_enabled = models.BooleanField(default=True)
    
    # Recording and playback
    recording_status = models.CharField(
        max_length=20,
        choices=[
            ('none', 'No Recording'),
            ('scheduled', 'Recording Scheduled'),
            ('recording', 'Currently Recording'),
            ('completed', 'Recording Completed'),
            ('processing', 'Processing Recording'),
            ('available', 'Recording Available'),
            ('failed', 'Recording Failed')
        ],
        default='none'
    )
    recording_urls = models.JSONField(default=list)  # List of recording URLs
    
    # Calendar integration
    calendar_event_id = models.CharField(max_length=200, blank=True, null=True)
    calendar_provider = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        choices=[
            ('google', 'Google Calendar'),
            ('outlook', 'Outlook Calendar'),
            ('apple', 'Apple Calendar'),
            ('ical', 'iCal')
        ]
    )
    
    # Registration settings
    max_participants = models.IntegerField(null=True, blank=True)
    registration_deadline = models.DateTimeField(null=True, blank=True)
    requires_approval = models.BooleanField(default=False)
    is_free = models.BooleanField(default=True)
    ticket_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Event settings
    status = models.CharField(max_length=20, choices=EVENT_STATUS, default='draft')
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='public')
    
    # Skills and topics
    topics = models.JSONField(default=list)  # List of topic tags
    required_skills = models.JSONField(default=list)  # Skills participants should have
    skills_to_learn = models.JSONField(default=list)  # Skills participants will learn
    
    # Event materials
    agenda = models.TextField(blank=True, null=True)
    materials_url = models.URLField(blank=True, null=True)
    recording_url = models.URLField(blank=True, null=True)
    
    # Statistics
    registration_count = models.IntegerField(default=0)
    attendance_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'events'
        ordering = ['start_datetime']
        
    def __str__(self):
        return f"{self.title} - {self.start_datetime.strftime('%Y-%m-%d')}"


class EventRegistration(models.Model):
    """Track user registration for events"""
    
    REGISTRATION_STATUS = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
        ('attended', 'Attended'),
        ('no_show', 'No Show'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_registrations')
    
    # Registration details
    status = models.CharField(max_length=20, choices=REGISTRATION_STATUS, default='approved')
    registration_notes = models.TextField(blank=True, null=True)
    
    # Attendance tracking
    checked_in = models.BooleanField(default=False)
    check_in_time = models.DateTimeField(null=True, blank=True)
    
    # Payment (if applicable)
    payment_required = models.BooleanField(default=False)
    payment_completed = models.BooleanField(default=False)
    payment_date = models.DateTimeField(null=True, blank=True)
    
    # Feedback
    rating = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    feedback = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'event_registrations'
        unique_together = ['event', 'user']
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.username} - {self.event.title}"


class Hackathon(models.Model):
    """Hackathon-specific events with team formation and project submission"""
    
    HACKATHON_STATUS = [
        ('upcoming', 'Upcoming'),
        ('registration_open', 'Registration Open'),
        ('team_formation', 'Team Formation'),
        ('in_progress', 'In Progress'),
        ('judging', 'Judging'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.OneToOneField(Event, on_delete=models.CASCADE, related_name='hackathon_details')
    
    # Hackathon-specific settings
    theme = models.CharField(max_length=200)
    rules = models.TextField()
    judging_criteria = models.JSONField(default=list)  # List of criteria with weights
    
    # Team settings
    min_team_size = models.IntegerField(default=1)
    max_team_size = models.IntegerField(default=5)
    allow_solo_participation = models.BooleanField(default=True)
    
    # Timeline
    team_formation_deadline = models.DateTimeField()
    submission_deadline = models.DateTimeField()
    judging_start = models.DateTimeField()
    results_announcement = models.DateTimeField()
    
    # Prizes and rewards
    total_prize_pool = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Hackathon status
    status = models.CharField(max_length=20, choices=HACKATHON_STATUS, default='upcoming')
    
    # Statistics
    team_count = models.IntegerField(default=0)
    submission_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'hackathons'
        
    def __str__(self):
        return f"Hackathon: {self.event.title}"


class HackathonTeam(models.Model):
    """Teams formed for hackathon participation"""
    
    TEAM_STATUS = [
        ('forming', 'Forming'),
        ('complete', 'Complete'),
        ('participating', 'Participating'),
        ('submitted', 'Submitted'),
        ('disqualified', 'Disqualified'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='teams')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    # Team leadership
    team_leader = models.ForeignKey(User, on_delete=models.CASCADE, related_name='led_hackathon_teams')
    members = models.ManyToManyField(User, related_name='hackathon_teams')
    
    # Team details
    status = models.CharField(max_length=20, choices=TEAM_STATUS, default='forming')
    looking_for_members = models.BooleanField(default=True)
    required_skills = models.JSONField(default=list)
    
    # Project submission
    project_name = models.CharField(max_length=200, blank=True, null=True)
    project_description = models.TextField(blank=True, null=True)
    project_url = models.URLField(blank=True, null=True)
    github_repo = models.URLField(blank=True, null=True)
    demo_url = models.URLField(blank=True, null=True)
    presentation_url = models.URLField(blank=True, null=True)
    
    # Submission details
    submitted_at = models.DateTimeField(null=True, blank=True)
    submission_notes = models.TextField(blank=True, null=True)
    
    # Judging results
    final_score = models.FloatField(null=True, blank=True)
    ranking = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'hackathon_teams'
        ordering = ['hackathon', 'name']
        
    def __str__(self):
        return f"{self.hackathon.event.title} - {self.name}"


class Meetup(models.Model):
    """Regular meetup events with recurring schedules"""
    
    MEETUP_FREQUENCY = [
        ('weekly', 'Weekly'),
        ('biweekly', 'Bi-weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('irregular', 'Irregular'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.OneToOneField(Event, on_delete=models.CASCADE, related_name='meetup_details')
    
    # Meetup series information
    series_name = models.CharField(max_length=200)
    frequency = models.CharField(max_length=20, choices=MEETUP_FREQUENCY)
    
    # Regular attendees and community
    regular_attendees = models.ManyToManyField(User, blank=True, related_name='regular_meetups')
    community_tags = models.JSONField(default=list)  # Tags for community categorization
    
    # Meetup format
    has_presentations = models.BooleanField(default=True)
    has_networking = models.BooleanField(default=True)
    has_workshops = models.BooleanField(default=False)
    
    # Next meetup planning
    next_meetup_date = models.DateTimeField(null=True, blank=True)
    next_meetup_topic = models.CharField(max_length=200, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'meetups'
        
    def __str__(self):
        return f"Meetup: {self.series_name}"


class Prize(models.Model):
    """Prizes for competitions and hackathons"""
    
    PRIZE_TYPES = [
        ('cash', 'Cash Prize'),
        ('product', 'Product/Service'),
        ('certificate', 'Certificate'),
        ('mentorship', 'Mentorship Opportunity'),
        ('internship', 'Internship Offer'),
        ('job_offer', 'Job Offer'),
        ('credits', 'Platform Credits'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Prize details
    name = models.CharField(max_length=200)
    description = models.TextField()
    prize_type = models.CharField(max_length=20, choices=PRIZE_TYPES)
    value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Prize provider
    sponsor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sponsored_prizes')
    sponsor_company = models.CharField(max_length=200, blank=True, null=True)
    
    # Associated events
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='prizes')
    hackathon = models.ForeignKey(
        Hackathon, 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE, 
        related_name='prizes'
    )
    
    # Prize ranking
    position = models.IntegerField()  # 1st, 2nd, 3rd place, etc.
    category = models.CharField(max_length=100, blank=True, null=True)  # Best Design, Most Innovative, etc.
    
    # Prize conditions
    eligibility_criteria = models.TextField(blank=True, null=True)
    terms_and_conditions = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'prizes'
        ordering = ['event', 'position']
        
    def __str__(self):
        return f"{self.event.title} - {self.name} (Position {self.position})"


class Winner(models.Model):
    """Winners of competitions and prizes"""
    
    WINNER_STATUS = [
        ('announced', 'Announced'),
        ('contacted', 'Contacted'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('awarded', 'Prize Awarded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prize = models.ForeignKey(Prize, on_delete=models.CASCADE, related_name='winners')
    
    # Winner details (can be individual or team)
    user = models.ForeignKey(
        User, 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE, 
        related_name='won_prizes'
    )
    team = models.ForeignKey(
        HackathonTeam, 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE, 
        related_name='won_prizes'
    )
    
    # Winner status and details
    status = models.CharField(max_length=20, choices=WINNER_STATUS, default='announced')
    announcement_date = models.DateTimeField(auto_now_add=True)
    contact_date = models.DateTimeField(null=True, blank=True)
    award_date = models.DateTimeField(null=True, blank=True)
    
    # Additional details
    winning_submission = models.TextField(blank=True, null=True)
    judge_comments = models.TextField(blank=True, null=True)
    
    # Prize delivery
    delivery_method = models.CharField(max_length=100, blank=True, null=True)
    delivery_status = models.CharField(max_length=100, blank=True, null=True)
    delivery_tracking = models.CharField(max_length=200, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'winners'
        ordering = ['-announcement_date']
        
    def __str__(self):
        winner_name = self.user.username if self.user else self.team.name
        return f"{self.prize.name} - {winner_name}"


class VirtualMeetingSession(models.Model):
    """Track virtual meeting sessions and their recordings"""
    
    SESSION_STATUS = [
        ('scheduled', 'Scheduled'),
        ('starting', 'Starting'),
        ('in_progress', 'In Progress'),
        ('ended', 'Ended'),
        ('cancelled', 'Cancelled'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='meeting_sessions')
    
    # Session details
    session_name = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=SESSION_STATUS, default='scheduled')
    
    # Timing
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField()
    actual_start = models.DateTimeField(null=True, blank=True)
    actual_end = models.DateTimeField(null=True, blank=True)
    
    # Host and participants
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hosted_sessions')
    co_hosts = models.ManyToManyField(User, blank=True, related_name='co_hosted_sessions')
    participants = models.ManyToManyField(User, through='SessionParticipant', related_name='attended_sessions')
    
    # Meeting provider data
    provider_meeting_id = models.CharField(max_length=200, blank=True, null=True)
    provider_data = models.JSONField(default=dict)
    
    # Session features used
    recording_enabled = models.BooleanField(default=False)
    screen_sharing_used = models.BooleanField(default=False)
    chat_enabled = models.BooleanField(default=True)
    breakout_rooms_used = models.BooleanField(default=False)
    
    # Session statistics
    max_participants = models.IntegerField(default=0)
    total_duration_minutes = models.IntegerField(default=0)
    
    # Recording information
    recordings = models.JSONField(default=list)  # List of recording metadata
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'virtual_meeting_sessions'
        ordering = ['-scheduled_start']
        
    def __str__(self):
        return f"{self.session_name} - {self.scheduled_start.strftime('%Y-%m-%d %H:%M')}"


class SessionParticipant(models.Model):
    """Track individual participant details in virtual meeting sessions"""
    
    PARTICIPATION_STATUS = [
        ('invited', 'Invited'),
        ('joined', 'Joined'),
        ('left', 'Left'),
        ('removed', 'Removed'),
        ('no_show', 'No Show'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(VirtualMeetingSession, on_delete=models.CASCADE, related_name='participant_details')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='session_participations')
    
    # Participation tracking
    status = models.CharField(max_length=20, choices=PARTICIPATION_STATUS, default='invited')
    join_time = models.DateTimeField(null=True, blank=True)
    leave_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(default=0)
    
    # Participant permissions
    can_share_screen = models.BooleanField(default=True)
    can_use_chat = models.BooleanField(default=True)
    is_muted = models.BooleanField(default=False)
    camera_enabled = models.BooleanField(default=True)
    
    # Engagement metrics
    chat_messages_sent = models.IntegerField(default=0)
    screen_share_duration = models.IntegerField(default=0)  # in minutes
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'session_participants'
        unique_together = ['session', 'user']
        ordering = ['-join_time']
        
    def __str__(self):
        return f"{self.user.username} - {self.session.session_name}"


class MeetingRecording(models.Model):
    """Store meeting recording metadata and access information"""
    
    RECORDING_STATUS = [
        ('processing', 'Processing'),
        ('available', 'Available'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
        ('deleted', 'Deleted'),
    ]
    
    RECORDING_TYPE = [
        ('full_session', 'Full Session'),
        ('audio_only', 'Audio Only'),
        ('screen_share', 'Screen Share Only'),
        ('chat_transcript', 'Chat Transcript'),
        ('highlights', 'Highlights'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(VirtualMeetingSession, on_delete=models.CASCADE, related_name='recording_files')
    
    # Recording details
    recording_type = models.CharField(max_length=20, choices=RECORDING_TYPE, default='full_session')
    status = models.CharField(max_length=20, choices=RECORDING_STATUS, default='processing')
    
    # File information
    file_name = models.CharField(max_length=200)
    file_size_mb = models.FloatField(default=0.0)
    duration_minutes = models.IntegerField(default=0)
    
    # Access URLs
    download_url = models.URLField(blank=True, null=True)
    streaming_url = models.URLField(blank=True, null=True)
    thumbnail_url = models.URLField(blank=True, null=True)
    
    # Provider-specific data
    provider_recording_id = models.CharField(max_length=200, blank=True, null=True)
    provider_data = models.JSONField(default=dict)
    
    # Access control
    is_public = models.BooleanField(default=False)
    password_protected = models.BooleanField(default=False)
    access_password = models.CharField(max_length=100, blank=True, null=True)
    
    # Expiration
    expires_at = models.DateTimeField(null=True, blank=True)
    auto_delete_after_days = models.IntegerField(default=90)
    
    # Metadata
    transcript = models.TextField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    key_moments = models.JSONField(default=list)  # Timestamps of important moments
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'meeting_recordings'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.session.session_name} - {self.recording_type} ({self.status})"


class CalendarIntegration(models.Model):
    """Manage calendar integrations for events"""
    
    CALENDAR_PROVIDERS = [
        ('google', 'Google Calendar'),
        ('outlook', 'Outlook Calendar'),
        ('apple', 'Apple Calendar'),
        ('ical', 'iCal'),
    ]
    
    SYNC_STATUS = [
        ('pending', 'Pending'),
        ('synced', 'Synced'),
        ('failed', 'Failed'),
        ('outdated', 'Outdated'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='calendar_integrations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calendar_integrations')
    
    # Calendar provider details
    provider = models.CharField(max_length=20, choices=CALENDAR_PROVIDERS)
    calendar_id = models.CharField(max_length=200)  # Calendar ID in the provider
    provider_event_id = models.CharField(max_length=200)  # Event ID in the provider
    
    # Sync status
    status = models.CharField(max_length=20, choices=SYNC_STATUS, default='pending')
    last_sync = models.DateTimeField(null=True, blank=True)
    sync_error = models.TextField(blank=True, null=True)
    
    # Provider-specific data
    provider_data = models.JSONField(default=dict)
    
    # Sync settings
    auto_sync = models.BooleanField(default=True)
    sync_reminders = models.BooleanField(default=True)
    sync_attendees = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'calendar_integrations'
        unique_together = ['event', 'user', 'provider']
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.event.title} - {self.provider} ({self.user.username})"


class CommunityPost(models.Model):
    """Community posts and discussions"""
    
    POST_TYPES = [
        ('discussion', 'Discussion'),
        ('question', 'Question'),
        ('announcement', 'Announcement'),
        ('job_posting', 'Job Posting'),
        ('project_showcase', 'Project Showcase'),
        ('resource_sharing', 'Resource Sharing'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='community_posts')
    
    # Post content
    title = models.CharField(max_length=200)
    content = models.TextField()
    post_type = models.CharField(max_length=20, choices=POST_TYPES, default='discussion')
    
    # Post categorization
    tags = models.JSONField(default=list)  # List of tags
    skills_related = models.JSONField(default=list)  # Related skills
    
    # Post engagement
    upvotes = models.IntegerField(default=0)
    downvotes = models.IntegerField(default=0)
    view_count = models.IntegerField(default=0)
    comment_count = models.IntegerField(default=0)
    
    # Post status
    is_pinned = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    
    # Moderation
    is_approved = models.BooleanField(default=True)
    is_flagged = models.BooleanField(default=False)
    moderation_notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'community_posts'
        ordering = ['-is_pinned', '-created_at']
        
    def __str__(self):
        return f"{self.title} - {self.author.username}"
