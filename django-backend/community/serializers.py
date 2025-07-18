from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Event, EventRegistration, Hackathon, HackathonTeam, Meetup,
    Prize, Winner, CommunityPost, VirtualMeetingSession, SessionParticipant,
    MeetingRecording, CalendarIntegration
)

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user information for nested serialization"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']


class EventSerializer(serializers.ModelSerializer):
    """Serializer for community events"""
    
    organizer_details = UserBasicSerializer(source='organizer', read_only=True)
    co_organizers_details = UserBasicSerializer(source='co_organizers', many=True, read_only=True)
    registration_status = serializers.SerializerMethodField()
    user_registration = serializers.SerializerMethodField()
    spots_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'event_type', 'organizer', 'organizer_details',
            'co_organizers', 'co_organizers_details', 'start_datetime', 'end_datetime',
            'timezone', 'is_virtual', 'location_name', 'location_address',
            'virtual_meeting_url', 'virtual_meeting_id', 'virtual_meeting_password',
            'max_participants', 'registration_deadline', 'requires_approval',
            'is_free', 'ticket_price', 'status', 'visibility', 'topics',
            'required_skills', 'skills_to_learn', 'agenda', 'materials_url',
            'recording_url', 'registration_count', 'attendance_count',
            'registration_status', 'user_registration', 'spots_remaining',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'organizer', 'registration_count', 'attendance_count',
            'created_at', 'updated_at'
        ]
    
    def get_registration_status(self, obj):
        """Get registration status for this event"""
        from django.utils import timezone
        
        if obj.max_participants and obj.registration_count >= obj.max_participants:
            return 'full'
        elif obj.registration_deadline and obj.registration_deadline < timezone.now():
            return 'closed'
        elif obj.status == 'registration_open':
            return 'open'
        else:
            return 'closed'
    
    def get_user_registration(self, obj):
        """Get current user's registration for this event"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                registration = EventRegistration.objects.get(user=request.user, event=obj)
                return {
                    'id': registration.id,
                    'status': registration.status,
                    'checked_in': registration.checked_in,
                    'payment_completed': registration.payment_completed,
                }
            except EventRegistration.DoesNotExist:
                return None
        return None
    
    def get_spots_remaining(self, obj):
        """Get remaining spots for this event"""
        if obj.max_participants:
            return max(0, obj.max_participants - obj.registration_count)
        return None


class EventRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for event registrations"""
    
    user_details = UserBasicSerializer(source='user', read_only=True)
    event_details = serializers.SerializerMethodField()
    
    class Meta:
        model = EventRegistration
        fields = [
            'id', 'event', 'event_details', 'user', 'user_details', 'status',
            'registration_notes', 'checked_in', 'check_in_time', 'payment_required',
            'payment_completed', 'payment_date', 'rating', 'feedback',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'check_in_time', 'payment_date', 'created_at', 'updated_at'
        ]
    
    def get_event_details(self, obj):
        """Get basic event information"""
        if obj.event:
            return {
                'id': obj.event.id,
                'title': obj.event.title,
                'event_type': obj.event.event_type,
                'start_datetime': obj.event.start_datetime,
                'is_virtual': obj.event.is_virtual,
            }
        return None


class PrizeSerializer(serializers.ModelSerializer):
    """Serializer for competition prizes"""
    
    sponsor_details = UserBasicSerializer(source='sponsor', read_only=True)
    event_details = serializers.SerializerMethodField()
    hackathon_details = serializers.SerializerMethodField()
    winners_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Prize
        fields = [
            'id', 'name', 'description', 'prize_type', 'value', 'sponsor',
            'sponsor_details', 'sponsor_company', 'event', 'event_details',
            'hackathon', 'hackathon_details', 'position', 'category',
            'eligibility_criteria', 'terms_and_conditions', 'winners_count',
            'created_at'
        ]
        read_only_fields = ['id', 'sponsor', 'created_at']
    
    def get_event_details(self, obj):
        """Get basic event information"""
        if obj.event:
            return {
                'id': obj.event.id,
                'title': obj.event.title,
                'event_type': obj.event.event_type,
            }
        return None
    
    def get_hackathon_details(self, obj):
        """Get basic hackathon information"""
        if obj.hackathon:
            return {
                'id': obj.hackathon.id,
                'theme': obj.hackathon.theme,
                'status': obj.hackathon.status,
            }
        return None
    
    def get_winners_count(self, obj):
        """Get count of winners for this prize"""
        return obj.winners.count()


class HackathonTeamSerializer(serializers.ModelSerializer):
    """Serializer for hackathon teams"""
    
    team_leader_details = UserBasicSerializer(source='team_leader', read_only=True)
    members_details = UserBasicSerializer(source='members', many=True, read_only=True)
    hackathon_details = serializers.SerializerMethodField()
    team_size = serializers.SerializerMethodField()
    can_join = serializers.SerializerMethodField()
    
    class Meta:
        model = HackathonTeam
        fields = [
            'id', 'hackathon', 'hackathon_details', 'name', 'description',
            'team_leader', 'team_leader_details', 'members', 'members_details',
            'status', 'looking_for_members', 'required_skills', 'project_name',
            'project_description', 'project_url', 'github_repo', 'demo_url',
            'presentation_url', 'submitted_at', 'submission_notes', 'final_score',
            'ranking', 'team_size', 'can_join', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'team_leader', 'submitted_at', 'final_score', 'ranking',
            'created_at', 'updated_at'
        ]
    
    def get_hackathon_details(self, obj):
        """Get basic hackathon information"""
        if obj.hackathon:
            return {
                'id': obj.hackathon.id,
                'theme': obj.hackathon.theme,
                'status': obj.hackathon.status,
                'max_team_size': obj.hackathon.max_team_size,
                'submission_deadline': obj.hackathon.submission_deadline,
            }
        return None
    
    def get_team_size(self, obj):
        """Get current team size"""
        return obj.members.count()
    
    def get_can_join(self, obj):
        """Check if current user can join this team"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Check if team is looking for members and not full
            if obj.looking_for_members and obj.hackathon:
                current_size = obj.members.count()
                if current_size < obj.hackathon.max_team_size:
                    # Check if user is not already in another team for this hackathon
                    user_teams = HackathonTeam.objects.filter(
                        hackathon=obj.hackathon,
                        members=request.user
                    )
                    return not user_teams.exists()
        return False


class HackathonSerializer(serializers.ModelSerializer):
    """Serializer for hackathon events"""
    
    event_details = serializers.SerializerMethodField()
    prizes_summary = serializers.SerializerMethodField()
    user_team = serializers.SerializerMethodField()
    registration_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Hackathon
        fields = [
            'id', 'event', 'event_details', 'theme', 'rules', 'judging_criteria',
            'min_team_size', 'max_team_size', 'allow_solo_participation',
            'team_formation_deadline', 'submission_deadline', 'judging_start',
            'results_announcement', 'total_prize_pool', 'status', 'team_count',
            'submission_count', 'prizes_summary', 'user_team', 'registration_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'team_count', 'submission_count', 'created_at', 'updated_at'
        ]
    
    def get_event_details(self, obj):
        """Get basic event information"""
        if obj.event:
            return {
                'id': obj.event.id,
                'title': obj.event.title,
                'start_datetime': obj.event.start_datetime,
                'end_datetime': obj.event.end_datetime,
                'registration_count': obj.event.registration_count,
            }
        return None
    
    def get_prizes_summary(self, obj):
        """Get summary of prizes for this hackathon"""
        prizes = obj.prizes.all()
        return {
            'total_prizes': prizes.count(),
            'total_value': sum(prize.value or 0 for prize in prizes),
            'categories': list(set(prize.category for prize in prizes if prize.category)),
        }
    
    def get_user_team(self, obj):
        """Get current user's team for this hackathon"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                team = HackathonTeam.objects.get(hackathon=obj, members=request.user)
                return {
                    'id': team.id,
                    'name': team.name,
                    'status': team.status,
                    'is_leader': team.team_leader == request.user,
                }
            except HackathonTeam.DoesNotExist:
                return None
        return None
    
    def get_registration_status(self, obj):
        """Get registration status for this hackathon"""
        if obj.status == 'team_formation':
            return 'team_formation_open'
        elif obj.status == 'registration_open':
            return 'registration_open'
        else:
            return 'closed'


class MeetupSerializer(serializers.ModelSerializer):
    """Serializer for regular meetup events"""
    
    event_details = serializers.SerializerMethodField()
    regular_attendees_details = UserBasicSerializer(source='regular_attendees', many=True, read_only=True)
    is_regular_attendee = serializers.SerializerMethodField()
    
    class Meta:
        model = Meetup
        fields = [
            'id', 'event', 'event_details', 'series_name', 'frequency',
            'regular_attendees', 'regular_attendees_details', 'community_tags',
            'has_presentations', 'has_networking', 'has_workshops',
            'next_meetup_date', 'next_meetup_topic', 'is_regular_attendee',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_event_details(self, obj):
        """Get basic event information"""
        if obj.event:
            return {
                'id': obj.event.id,
                'title': obj.event.title,
                'start_datetime': obj.event.start_datetime,
                'registration_count': obj.event.registration_count,
            }
        return None
    
    def get_is_regular_attendee(self, obj):
        """Check if current user is a regular attendee"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.regular_attendees.filter(id=request.user.id).exists()
        return False


class WinnerSerializer(serializers.ModelSerializer):
    """Serializer for competition winners"""
    
    prize_details = serializers.SerializerMethodField()
    user_details = UserBasicSerializer(source='user', read_only=True)
    team_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Winner
        fields = [
            'id', 'prize', 'prize_details', 'user', 'user_details', 'team',
            'team_details', 'status', 'announcement_date', 'contact_date',
            'award_date', 'winning_submission', 'judge_comments',
            'delivery_method', 'delivery_status', 'delivery_tracking',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'announcement_date', 'contact_date', 'award_date',
            'created_at', 'updated_at'
        ]
    
    def get_prize_details(self, obj):
        """Get basic prize information"""
        if obj.prize:
            return {
                'id': obj.prize.id,
                'name': obj.prize.name,
                'prize_type': obj.prize.prize_type,
                'value': obj.prize.value,
                'position': obj.prize.position,
                'category': obj.prize.category,
            }
        return None
    
    def get_team_details(self, obj):
        """Get basic team information"""
        if obj.team:
            return {
                'id': obj.team.id,
                'name': obj.team.name,
                'hackathon_theme': obj.team.hackathon.theme,
                'project_name': obj.team.project_name,
            }
        return None


class CommunityPostSerializer(serializers.ModelSerializer):
    """Serializer for community posts and discussions"""
    
    author_details = UserBasicSerializer(source='author', read_only=True)
    engagement_stats = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    
    class Meta:
        model = CommunityPost
        fields = [
            'id', 'author', 'author_details', 'title', 'content', 'post_type',
            'tags', 'skills_related', 'upvotes', 'downvotes', 'view_count',
            'comment_count', 'is_pinned', 'is_locked', 'is_featured',
            'is_approved', 'is_flagged', 'engagement_stats', 'user_vote',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'author', 'upvotes', 'downvotes', 'view_count', 'comment_count',
            'is_approved', 'is_flagged', 'created_at', 'updated_at'
        ]
    
    def get_engagement_stats(self, obj):
        """Get engagement statistics for this post"""
        total_votes = obj.upvotes + obj.downvotes
        return {
            'total_votes': total_votes,
            'vote_ratio': obj.upvotes / total_votes if total_votes > 0 else 0,
            'engagement_score': obj.upvotes + obj.comment_count + obj.view_count,
        }
    
    def get_user_vote(self, obj):
        """Get current user's vote on this post"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # This would require a PostVote model to track user votes
            # For now, return None
            return None
        return None


# Nested serializers for complex relationships
class EventDetailSerializer(EventSerializer):
    """Detailed event serializer with registrations and prizes"""
    
    registrations = EventRegistrationSerializer(many=True, read_only=True)
    prizes = PrizeSerializer(many=True, read_only=True)
    
    class Meta(EventSerializer.Meta):
        fields = EventSerializer.Meta.fields + ['registrations', 'prizes']


class HackathonDetailSerializer(HackathonSerializer):
    """Detailed hackathon serializer with teams and prizes"""
    
    teams = HackathonTeamSerializer(many=True, read_only=True)
    prizes = PrizeSerializer(many=True, read_only=True)
    
    class Meta(HackathonSerializer.Meta):
        fields = HackathonSerializer.Meta.fields + ['teams', 'prizes']


class EventRegistrationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating event registrations"""
    
    class Meta:
        model = EventRegistration
        fields = ['event', 'registration_notes']
    
    def create(self, validated_data):
        """Create registration with user from request"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class HackathonTeamCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating hackathon teams"""
    
    class Meta:
        model = HackathonTeam
        fields = ['hackathon', 'name', 'description', 'required_skills']
    
    def create(self, validated_data):
        """Create team with leader from request user"""
        validated_data['team_leader'] = self.context['request'].user
        team = super().create(validated_data)
        # Add leader as member
        team.members.add(self.context['request'].user)
        return team


class CommunityPostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating community posts"""
    
    class Meta:
        model = CommunityPost
        fields = ['title', 'content', 'post_type', 'tags', 'skills_related']
    
    def create(self, validated_data):
        """Create post with author from request user"""
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class CommunityStatsSerializer(serializers.Serializer):
    """Serializer for community statistics"""
    
    total_events = serializers.IntegerField()
    upcoming_events = serializers.IntegerField()
    active_hackathons = serializers.IntegerField()
    total_participants = serializers.IntegerField()
    total_prizes_awarded = serializers.DecimalField(max_digits=12, decimal_places=2)
    popular_topics = serializers.ListField(child=serializers.CharField())
    recent_winners = WinnerSerializer(many=True)
    trending_posts = CommunityPostSerializer(many=True)


class SessionParticipantSerializer(serializers.ModelSerializer):
    """Serializer for session participants"""
    
    user_details = UserBasicSerializer(source='user', read_only=True)
    
    class Meta:
        model = SessionParticipant
        fields = [
            'id', 'user', 'user_details', 'status', 'join_time', 'leave_time',
            'duration_minutes', 'can_share_screen', 'can_use_chat', 'is_muted',
            'camera_enabled', 'chat_messages_sent', 'screen_share_duration',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'join_time', 'leave_time', 'duration_minutes',
            'chat_messages_sent', 'screen_share_duration', 'created_at', 'updated_at'
        ]


class VirtualMeetingSessionSerializer(serializers.ModelSerializer):
    """Serializer for virtual meeting sessions"""
    
    event_details = serializers.SerializerMethodField()
    host_details = UserBasicSerializer(source='host', read_only=True)
    co_hosts_details = UserBasicSerializer(source='co_hosts', many=True, read_only=True)
    participant_count = serializers.SerializerMethodField()
    user_participation = serializers.SerializerMethodField()
    session_stats = serializers.SerializerMethodField()
    
    class Meta:
        model = VirtualMeetingSession
        fields = [
            'id', 'event', 'event_details', 'session_name', 'status',
            'scheduled_start', 'scheduled_end', 'actual_start', 'actual_end',
            'host', 'host_details', 'co_hosts', 'co_hosts_details',
            'provider_meeting_id', 'provider_data', 'recording_enabled',
            'screen_sharing_used', 'chat_enabled', 'breakout_rooms_used',
            'max_participants', 'total_duration_minutes', 'recordings',
            'participant_count', 'user_participation', 'session_stats',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'host', 'actual_start', 'actual_end', 'max_participants',
            'total_duration_minutes', 'recordings', 'created_at', 'updated_at'
        ]
    
    def get_event_details(self, obj):
        """Get basic event information"""
        if obj.event:
            return {
                'id': obj.event.id,
                'title': obj.event.title,
                'event_type': obj.event.event_type,
                'virtual_meeting_url': obj.event.virtual_meeting_url,
                'video_provider': obj.event.video_provider,
            }
        return None
    
    def get_participant_count(self, obj):
        """Get current participant count"""
        return obj.participants.count()
    
    def get_user_participation(self, obj):
        """Get current user's participation in this session"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                participant = SessionParticipant.objects.get(
                    session=obj,
                    user=request.user
                )
                return {
                    'status': participant.status,
                    'join_time': participant.join_time,
                    'leave_time': participant.leave_time,
                    'duration_minutes': participant.duration_minutes,
                    'is_host': obj.host == request.user,
                    'is_co_host': obj.co_hosts.filter(id=request.user.id).exists(),
                }
            except SessionParticipant.DoesNotExist:
                return None
        return None
    
    def get_session_stats(self, obj):
        """Get session statistics"""
        return {
            'total_participants': obj.max_participants,
            'duration_minutes': obj.total_duration_minutes,
            'recording_count': len(obj.recordings),
            'features_used': {
                'recording': obj.recording_enabled,
                'screen_sharing': obj.screen_sharing_used,
                'chat': obj.chat_enabled,
                'breakout_rooms': obj.breakout_rooms_used,
            }
        }


class MeetingRecordingSerializer(serializers.ModelSerializer):
    """Serializer for meeting recordings"""
    
    session_details = serializers.SerializerMethodField()
    access_info = serializers.SerializerMethodField()
    
    class Meta:
        model = MeetingRecording
        fields = [
            'id', 'session', 'session_details', 'recording_type', 'status',
            'file_name', 'file_size_mb', 'duration_minutes', 'download_url',
            'streaming_url', 'thumbnail_url', 'provider_recording_id',
            'is_public', 'password_protected', 'expires_at', 'auto_delete_after_days',
            'transcript', 'summary', 'key_moments', 'access_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'provider_recording_id', 'created_at', 'updated_at'
        ]
    
    def get_session_details(self, obj):
        """Get basic session information"""
        if obj.session:
            return {
                'id': obj.session.id,
                'session_name': obj.session.session_name,
                'event_title': obj.session.event.title,
                'scheduled_start': obj.session.scheduled_start,
                'host_username': obj.session.host.username,
            }
        return None
    
    def get_access_info(self, obj):
        """Get access information for current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Check if user has access to this recording
            has_access = (
                obj.is_public or
                obj.session.host == request.user or
                obj.session.co_hosts.filter(id=request.user.id).exists() or
                obj.session.participants.filter(id=request.user.id).exists() or
                obj.session.event.organizer == request.user or
                obj.session.event.co_organizers.filter(id=request.user.id).exists()
            )
            
            return {
                'has_access': has_access,
                'requires_password': obj.password_protected,
                'is_expired': obj.expires_at and obj.expires_at < timezone.now() if hasattr(obj, 'expires_at') and obj.expires_at else False,
                'can_download': has_access and obj.status == 'available',
            }
        return {'has_access': obj.is_public}


class CalendarIntegrationSerializer(serializers.ModelSerializer):
    """Serializer for calendar integrations"""
    
    event_details = serializers.SerializerMethodField()
    user_details = UserBasicSerializer(source='user', read_only=True)
    sync_info = serializers.SerializerMethodField()
    
    class Meta:
        model = CalendarIntegration
        fields = [
            'id', 'event', 'event_details', 'user', 'user_details', 'provider',
            'calendar_id', 'provider_event_id', 'status', 'last_sync', 'sync_error',
            'auto_sync', 'sync_reminders', 'sync_attendees', 'sync_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'provider_event_id', 'last_sync', 'sync_error',
            'created_at', 'updated_at'
        ]
    
    def get_event_details(self, obj):
        """Get basic event information"""
        if obj.event:
            return {
                'id': obj.event.id,
                'title': obj.event.title,
                'start_datetime': obj.event.start_datetime,
                'end_datetime': obj.event.end_datetime,
                'is_virtual': obj.event.is_virtual,
                'virtual_meeting_url': obj.event.virtual_meeting_url,
            }
        return None
    
    def get_sync_info(self, obj):
        """Get synchronization information"""
        from django.utils import timezone
        
        needs_sync = False
        if obj.auto_sync and obj.last_sync:
            # Check if event was updated after last sync
            needs_sync = obj.event.updated_at > obj.last_sync
        
        return {
            'needs_sync': needs_sync,
            'sync_age_hours': (
                (timezone.now() - obj.last_sync).total_seconds() / 3600
                if obj.last_sync else None
            ),
            'has_errors': bool(obj.sync_error),
            'provider_name': obj.get_provider_display(),
        }


# Enhanced Event serializer with virtual meeting fields
class EventVirtualMeetingSerializer(EventSerializer):
    """Event serializer with virtual meeting integration fields"""
    
    virtual_meeting_info = serializers.SerializerMethodField()
    calendar_integrations = CalendarIntegrationSerializer(many=True, read_only=True)
    meeting_sessions = VirtualMeetingSessionSerializer(many=True, read_only=True)
    
    class Meta(EventSerializer.Meta):
        fields = EventSerializer.Meta.fields + [
            'video_provider', 'video_meeting_data', 'enable_recording',
            'enable_screen_sharing', 'enable_chat', 'enable_breakout_rooms',
            'waiting_room_enabled', 'recording_status', 'recording_urls',
            'calendar_event_id', 'calendar_provider', 'virtual_meeting_info',
            'calendar_integrations', 'meeting_sessions'
        ]
    
    def get_virtual_meeting_info(self, obj):
        """Get virtual meeting information"""
        if obj.is_virtual and obj.video_provider:
            return {
                'provider': obj.video_provider,
                'meeting_url': obj.virtual_meeting_url,
                'meeting_id': obj.virtual_meeting_id,
                'has_password': bool(obj.virtual_meeting_password),
                'features': {
                    'recording': obj.enable_recording,
                    'screen_sharing': obj.enable_screen_sharing,
                    'chat': obj.enable_chat,
                    'breakout_rooms': obj.enable_breakout_rooms,
                    'waiting_room': obj.waiting_room_enabled,
                },
                'recording_status': obj.recording_status,
                'recording_count': len(obj.recording_urls),
            }
        return None


# Create serializers for virtual meeting session creation
class VirtualMeetingSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating virtual meeting sessions"""
    
    class Meta:
        model = VirtualMeetingSession
        fields = [
            'event', 'session_name', 'scheduled_start', 'scheduled_end',
            'co_hosts', 'recording_enabled', 'chat_enabled'
        ]
    
    def create(self, validated_data):
        """Create session with host from request user"""
        co_hosts = validated_data.pop('co_hosts', [])
        validated_data['host'] = self.context['request'].user
        session = super().create(validated_data)
        if co_hosts:
            session.co_hosts.set(co_hosts)
        return session


class CalendarIntegrationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating calendar integrations"""
    
    class Meta:
        model = CalendarIntegration
        fields = [
            'event', 'provider', 'calendar_id', 'auto_sync',
            'sync_reminders', 'sync_attendees'
        ]
    
    def create(self, validated_data):
        """Create integration with user from request"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)