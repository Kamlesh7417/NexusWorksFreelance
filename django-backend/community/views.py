from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum
from django.utils import timezone

from .models import (
    Event, EventRegistration, Hackathon, HackathonTeam, Meetup,
    Prize, Winner, CommunityPost, VirtualMeetingSession, SessionParticipant,
    MeetingRecording, CalendarIntegration
)
from .serializers import (
    EventSerializer, EventDetailSerializer, EventRegistrationSerializer,
    EventRegistrationCreateSerializer, HackathonSerializer, HackathonDetailSerializer,
    HackathonTeamSerializer, HackathonTeamCreateSerializer, MeetupSerializer,
    PrizeSerializer, WinnerSerializer, CommunityPostSerializer,
    CommunityPostCreateSerializer, CommunityStatsSerializer,
    VirtualMeetingSessionSerializer, MeetingRecordingSerializer,
    CalendarIntegrationSerializer
)
from .video_conferencing_service import video_conferencing_service
from .calendar_service import calendar_service


class EventViewSet(viewsets.ModelViewSet):
    """ViewSet for managing community events"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'description', 'topics', 'organizer__username']
    ordering_fields = ['start_datetime', 'created_at', 'registration_count']
    ordering = ['start_datetime']
    filterset_fields = ['event_type', 'status', 'visibility', 'is_virtual', 'is_free']
    
    def get_queryset(self):
        """Return events based on visibility and user permissions"""
        queryset = Event.objects.select_related('organizer').prefetch_related('co_organizers')
        
        # Filter by visibility
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(visibility='public') |
                Q(visibility='members_only') |
                Q(organizer=self.request.user) |
                Q(co_organizers=self.request.user)
            )
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'retrieve':
            return EventDetailSerializer
        return EventSerializer
    
    def perform_create(self, serializer):
        """Set organizer from request user"""
        serializer.save(organizer=self.request.user)
    
    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        """Register user for event"""
        event = self.get_object()
        
        # Check if registration is open
        if event.status != 'registration_open':
            return Response(
                {'error': 'Registration is not open'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if event is full
        if event.max_participants and event.registration_count >= event.max_participants:
            return Response(
                {'error': 'Event is full'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check registration deadline
        if event.registration_deadline and event.registration_deadline < timezone.now():
            return Response(
                {'error': 'Registration deadline has passed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create registration
        registration, created = EventRegistration.objects.get_or_create(
            event=event,
            user=request.user,
            defaults={
                'status': 'approved' if not event.requires_approval else 'pending',
                'registration_notes': request.data.get('notes', ''),
                'payment_required': not event.is_free
            }
        )
        
        if created:
            # Update event registration count
            event.registration_count += 1
            event.save()
            
            serializer = EventRegistrationSerializer(registration)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {'error': 'Already registered for this event'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def unregister(self, request, pk=None):
        """Unregister user from event"""
        event = self.get_object()
        
        try:
            registration = EventRegistration.objects.get(
                event=event,
                user=request.user
            )
            registration.status = 'cancelled'
            registration.save()
            
            # Update event registration count
            event.registration_count = max(0, event.registration_count - 1)
            event.save()
            
            return Response({'status': 'unregistered'})
        except EventRegistration.DoesNotExist:
            return Response(
                {'error': 'Not registered for this event'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        """Check in user for event (organizers only)"""
        event = self.get_object()
        
        # Only organizers can check in users
        if event.organizer != request.user and not event.co_organizers.filter(id=request.user.id).exists():
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            registration = EventRegistration.objects.get(
                event=event,
                user_id=user_id
            )
            registration.checked_in = True
            registration.check_in_time = timezone.now()
            registration.save()
            
            return Response({'status': 'checked in'})
        except EventRegistration.DoesNotExist:
            return Response(
                {'error': 'Registration not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming events"""
        upcoming_events = self.get_queryset().filter(
            start_datetime__gte=timezone.now(),
            status__in=['published', 'registration_open']
        ).order_by('start_datetime')[:10]
        
        serializer = self.get_serializer(upcoming_events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_events(self, request):
        """Get user's registered events"""
        registrations = EventRegistration.objects.filter(
            user=request.user
        ).select_related('event')
        
        events = [reg.event for reg in registrations]
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def setup_virtual_meeting(self, request, pk=None):
        """Set up virtual meeting for event"""
        event = self.get_object()
        
        # Only organizers can set up virtual meetings
        if event.organizer != request.user and not event.co_organizers.filter(id=request.user.id).exists():
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        provider = request.data.get('provider', 'zoom')
        meeting_data = {
            'title': event.title,
            'description': event.description,
            'start_time': event.start_datetime.isoformat(),
            'end_time': event.end_datetime.isoformat(),
            'timezone': event.timezone,
            'duration': int((event.end_datetime - event.start_datetime).total_seconds() / 60),
            'auto_record': event.enable_recording,
            'waiting_room': event.waiting_room_enabled
        }
        
        try:
            # Create meeting with video conferencing service
            meeting_result = video_conferencing_service.create_meeting(provider, meeting_data)
            
            # Update event with meeting details
            event.video_provider = provider
            event.virtual_meeting_url = meeting_result.get('join_url')
            event.virtual_meeting_id = meeting_result.get('id')
            event.virtual_meeting_password = meeting_result.get('password')
            event.video_meeting_data = meeting_result
            event.save()
            
            return Response({
                'status': 'meeting_created',
                'meeting_url': meeting_result.get('join_url'),
                'meeting_id': meeting_result.get('id'),
                'provider': provider
            })
        except Exception as e:
            return Response(
                {'error': f'Failed to create meeting: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def sync_to_calendar(self, request, pk=None):
        """Sync event to user's calendar"""
        event = self.get_object()
        
        # Check if user is registered for the event or is organizer
        is_registered = EventRegistration.objects.filter(
            event=event, 
            user=request.user, 
            status='approved'
        ).exists()
        is_organizer = (event.organizer == request.user or 
                       event.co_organizers.filter(id=request.user.id).exists())
        
        if not (is_registered or is_organizer):
            return Response(
                {'error': 'Must be registered for event or be organizer'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        provider = request.data.get('provider', 'google')
        calendar_data = {
            'title': event.title,
            'description': event.description,
            'start_time': event.start_datetime.isoformat(),
            'end_time': event.end_datetime.isoformat(),
            'timezone': event.timezone,
            'location': event.virtual_meeting_url or event.location_name,
            'meeting_url': event.virtual_meeting_url,
            'attendee_emails': request.data.get('attendee_emails', [])
        }
        
        try:
            # Create calendar event
            calendar_result = calendar_service.create_event(provider, calendar_data)
            
            # Create calendar integration record
            CalendarIntegration.objects.update_or_create(
                event=event,
                user=request.user,
                provider=provider,
                defaults={
                    'calendar_id': calendar_result.get('calendar_id', 'primary'),
                    'provider_event_id': calendar_result.get('id'),
                    'status': 'synced',
                    'last_sync': timezone.now(),
                    'provider_data': calendar_result
                }
            )
            
            return Response({
                'status': 'synced_to_calendar',
                'provider': provider,
                'calendar_event_id': calendar_result.get('id')
            })
        except Exception as e:
            return Response(
                {'error': f'Failed to sync to calendar: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def generate_ical(self, request, pk=None):
        """Generate iCal file for event"""
        event = self.get_object()
        
        # Check if user has access to event
        is_registered = EventRegistration.objects.filter(
            event=event, 
            user=request.user, 
            status='approved'
        ).exists()
        is_organizer = (event.organizer == request.user or 
                       event.co_organizers.filter(id=request.user.id).exists())
        is_public = event.visibility == 'public'
        
        if not (is_registered or is_organizer or is_public):
            return Response(
                {'error': 'Access denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        event_data = {
            'title': event.title,
            'description': event.description,
            'start_time': event.start_datetime.isoformat(),
            'end_time': event.end_datetime.isoformat(),
            'location': event.virtual_meeting_url or event.location_name or '',
            'meeting_url': event.virtual_meeting_url
        }
        
        ical_content = calendar_service.generate_ical_event(event_data)
        
        from django.http import HttpResponse
        response = HttpResponse(ical_content, content_type='text/calendar')
        response['Content-Disposition'] = f'attachment; filename="{event.title}.ics"'
        return response


class EventRegistrationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing event registrations"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['event__title', 'user__username']
    ordering_fields = ['created_at', 'check_in_time']
    ordering = ['-created_at']
    filterset_fields = ['status', 'checked_in', 'payment_completed']
    
    def get_queryset(self):
        """Return registrations for current user or events they organize"""
        return EventRegistration.objects.filter(
            Q(user=self.request.user) |
            Q(event__organizer=self.request.user) |
            Q(event__co_organizers=self.request.user)
        ).select_related('event', 'user')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return EventRegistrationCreateSerializer
        return EventRegistrationSerializer
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve registration (organizers only)"""
        registration = self.get_object()
        
        # Only event organizers can approve
        if (registration.event.organizer != request.user and 
            not registration.event.co_organizers.filter(id=request.user.id).exists()):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        registration.status = 'approved'
        registration.save()
        
        return Response({'status': 'approved'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject registration (organizers only)"""
        registration = self.get_object()
        
        # Only event organizers can reject
        if (registration.event.organizer != request.user and 
            not registration.event.co_organizers.filter(id=request.user.id).exists()):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        registration.status = 'rejected'
        registration.save()
        
        return Response({'status': 'rejected'})


class HackathonViewSet(viewsets.ModelViewSet):
    """ViewSet for managing hackathon events"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['event__title', 'theme', 'judging_criteria']
    ordering_fields = ['event__start_datetime', 'submission_deadline', 'total_prize_pool']
    ordering = ['event__start_datetime']
    filterset_fields = ['status', 'allow_solo_participation']
    
    def get_queryset(self):
        """Return hackathons based on event visibility"""
        return Hackathon.objects.select_related('event').filter(
            Q(event__visibility='public') |
            Q(event__visibility='members_only') |
            Q(event__organizer=self.request.user) |
            Q(event__co_organizers=self.request.user)
        )
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'retrieve':
            return HackathonDetailSerializer
        return HackathonSerializer
    
    @action(detail=True, methods=['post'])
    def create_team(self, request, pk=None):
        """Create a team for hackathon"""
        hackathon = self.get_object()
        
        # Check if user is already in a team
        existing_team = HackathonTeam.objects.filter(
            hackathon=hackathon,
            members=request.user
        ).first()
        
        if existing_team:
            return Response(
                {'error': 'Already in a team for this hackathon'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create team
        team_data = {
            'hackathon': hackathon.id,
            'name': request.data.get('name'),
            'description': request.data.get('description', ''),
            'required_skills': request.data.get('required_skills', [])
        }
        
        serializer = HackathonTeamCreateSerializer(
            data=team_data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            team = serializer.save()
            
            # Update hackathon team count
            hackathon.team_count += 1
            hackathon.save()
            
            return Response(
                HackathonTeamSerializer(team, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def leaderboard(self, request, pk=None):
        """Get hackathon leaderboard"""
        hackathon = self.get_object()
        
        teams = hackathon.teams.filter(
            status='submitted'
        ).order_by('-final_score', 'submitted_at')
        
        serializer = HackathonTeamSerializer(teams, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active hackathons"""
        active_hackathons = self.get_queryset().filter(
            status__in=['registration_open', 'team_formation', 'in_progress']
        )
        
        serializer = self.get_serializer(active_hackathons, many=True)
        return Response(serializer.data)


class HackathonTeamViewSet(viewsets.ModelViewSet):
    """ViewSet for managing hackathon teams"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description', 'project_name']
    ordering_fields = ['created_at', 'final_score', 'ranking']
    ordering = ['-created_at']
    filterset_fields = ['status', 'looking_for_members', 'hackathon']
    
    def get_queryset(self):
        """Return teams user can view"""
        return HackathonTeam.objects.filter(
            Q(members=self.request.user) |
            Q(hackathon__event__visibility='public') |
            Q(hackathon__event__organizer=self.request.user)
        ).select_related('hackathon', 'team_leader').prefetch_related('members')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return HackathonTeamCreateSerializer
        return HackathonTeamSerializer
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Join a hackathon team"""
        team = self.get_object()
        
        # Check if team is looking for members
        if not team.looking_for_members:
            return Response(
                {'error': 'Team is not looking for members'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check team size limit
        if team.members.count() >= team.hackathon.max_team_size:
            return Response(
                {'error': 'Team is full'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is already in another team for this hackathon
        existing_team = HackathonTeam.objects.filter(
            hackathon=team.hackathon,
            members=request.user
        ).exclude(id=team.id).first()
        
        if existing_team:
            return Response(
                {'error': 'Already in another team for this hackathon'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add user to team
        team.members.add(request.user)
        
        # Update team status if full
        if team.members.count() >= team.hackathon.max_team_size:
            team.looking_for_members = False
            team.status = 'complete'
            team.save()
        
        return Response({'status': 'joined team'})
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave a hackathon team"""
        team = self.get_object()
        
        # Check if user is in team
        if not team.members.filter(id=request.user.id).exists():
            return Response(
                {'error': 'Not a member of this team'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Team leader cannot leave (must transfer leadership first)
        if team.team_leader == request.user:
            return Response(
                {'error': 'Team leader cannot leave. Transfer leadership first.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove user from team
        team.members.remove(request.user)
        
        # Update team status
        if team.members.count() < team.hackathon.max_team_size:
            team.looking_for_members = True
            team.status = 'forming'
            team.save()
        
        return Response({'status': 'left team'})
    
    @action(detail=True, methods=['post'])
    def submit_project(self, request, pk=None):
        """Submit team project"""
        team = self.get_object()
        
        # Only team leader can submit
        if team.team_leader != request.user:
            return Response(
                {'error': 'Only team leader can submit project'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check submission deadline
        if team.hackathon.submission_deadline < timezone.now():
            return Response(
                {'error': 'Submission deadline has passed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update project details
        team.project_name = request.data.get('project_name')
        team.project_description = request.data.get('project_description')
        team.project_url = request.data.get('project_url')
        team.github_repo = request.data.get('github_repo')
        team.demo_url = request.data.get('demo_url')
        team.presentation_url = request.data.get('presentation_url')
        team.submission_notes = request.data.get('submission_notes', '')
        team.submitted_at = timezone.now()
        team.status = 'submitted'
        team.save()
        
        # Update hackathon submission count
        team.hackathon.submission_count += 1
        team.hackathon.save()
        
        return Response({'status': 'project submitted'})
    
    @action(detail=False, methods=['get'])
    def my_teams(self, request):
        """Get user's hackathon teams"""
        teams = self.get_queryset().filter(members=request.user)
        serializer = self.get_serializer(teams, many=True)
        return Response(serializer.data)


class MeetupViewSet(viewsets.ModelViewSet):
    """ViewSet for managing regular meetup events"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['series_name', 'event__title', 'community_tags']
    ordering_fields = ['event__start_datetime', 'created_at']
    ordering = ['event__start_datetime']
    filterset_fields = ['frequency', 'has_presentations', 'has_networking', 'has_workshops']
    
    def get_queryset(self):
        """Return meetups based on event visibility"""
        return Meetup.objects.select_related('event').filter(
            Q(event__visibility='public') |
            Q(event__visibility='members_only') |
            Q(event__organizer=self.request.user)
        )
    
    @action(detail=True, methods=['post'])
    def join_regular_attendees(self, request, pk=None):
        """Join as regular attendee"""
        meetup = self.get_object()
        meetup.regular_attendees.add(request.user)
        return Response({'status': 'joined as regular attendee'})
    
    @action(detail=True, methods=['post'])
    def leave_regular_attendees(self, request, pk=None):
        """Leave regular attendees"""
        meetup = self.get_object()
        meetup.regular_attendees.remove(request.user)
        return Response({'status': 'left regular attendees'})


class PrizeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing competition prizes"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description', 'sponsor__username']
    ordering_fields = ['position', 'value', 'created_at']
    ordering = ['event', 'position']
    filterset_fields = ['prize_type', 'event', 'hackathon', 'position']
    
    def get_queryset(self):
        """Return prizes for public events or events user organizes"""
        return Prize.objects.filter(
            Q(event__visibility='public') |
            Q(event__organizer=self.request.user) |
            Q(sponsor=self.request.user)
        ).select_related('sponsor', 'event', 'hackathon')
    
    def perform_create(self, serializer):
        """Set sponsor from request user"""
        serializer.save(sponsor=self.request.user)


class WinnerViewSet(viewsets.ModelViewSet):
    """ViewSet for managing competition winners"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['prize__name', 'user__username', 'team__name']
    ordering_fields = ['announcement_date', 'prize__position']
    ordering = ['-announcement_date']
    filterset_fields = ['status', 'prize__event', 'prize__hackathon']
    
    def get_queryset(self):
        """Return winners for public events or where user is involved"""
        return Winner.objects.filter(
            Q(prize__event__visibility='public') |
            Q(prize__event__organizer=self.request.user) |
            Q(user=self.request.user) |
            Q(team__members=self.request.user)
        ).select_related('prize', 'user', 'team')
    
    @action(detail=True, methods=['post'])
    def accept_prize(self, request, pk=None):
        """Accept prize (winners only)"""
        winner = self.get_object()
        
        # Only winner can accept
        if winner.user != request.user and not winner.team.members.filter(id=request.user.id).exists():
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        winner.status = 'accepted'
        winner.save()
        
        return Response({'status': 'prize accepted'})


class CommunityPostViewSet(viewsets.ModelViewSet):
    """ViewSet for managing community posts"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'content', 'tags', 'author__username']
    ordering_fields = ['created_at', 'upvotes', 'view_count', 'comment_count']
    ordering = ['-is_pinned', '-created_at']
    filterset_fields = ['post_type', 'is_pinned', 'is_featured', 'is_approved']
    
    def get_queryset(self):
        """Return approved community posts"""
        return CommunityPost.objects.filter(
            is_approved=True
        ).select_related('author')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return CommunityPostCreateSerializer
        return CommunityPostSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """Increment view count when post is viewed"""
        instance = self.get_object()
        instance.view_count += 1
        instance.save()
        return super().retrieve(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def upvote(self, request, pk=None):
        """Upvote a post"""
        post = self.get_object()
        # In a real implementation, you'd track user votes to prevent duplicate voting
        post.upvotes += 1
        post.save()
        return Response({'status': 'upvoted', 'upvotes': post.upvotes})
    
    @action(detail=True, methods=['post'])
    def downvote(self, request, pk=None):
        """Downvote a post"""
        post = self.get_object()
        # In a real implementation, you'd track user votes to prevent duplicate voting
        post.downvotes += 1
        post.save()
        return Response({'status': 'downvoted', 'downvotes': post.downvotes})
    
    @action(detail=False, methods=['get'])
    def trending(self, request):
        """Get trending posts"""
        trending_posts = self.get_queryset().order_by(
            '-upvotes', '-comment_count', '-view_count'
        )[:10]
        
        serializer = self.get_serializer(trending_posts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_posts(self, request):
        """Get user's posts"""
        user_posts = self.get_queryset().filter(author=request.user)
        serializer = self.get_serializer(user_posts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get community statistics"""
        total_events = Event.objects.filter(visibility='public').count()
        upcoming_events = Event.objects.filter(
            start_datetime__gte=timezone.now(),
            visibility='public'
        ).count()
        active_hackathons = Hackathon.objects.filter(
            status__in=['registration_open', 'team_formation', 'in_progress']
        ).count()
        total_participants = EventRegistration.objects.filter(
            status='approved'
        ).count()
        total_prizes_awarded = Prize.objects.aggregate(
            total=Sum('value')
        )['total'] or 0
        
        stats = {
            'total_events': total_events,
            'upcoming_events': upcoming_events,
            'active_hackathons': active_hackathons,
            'total_participants': total_participants,
            'total_prizes_awarded': total_prizes_awarded,
            'popular_topics': ['AI/ML', 'Web Development', 'Mobile Apps'],
            'recent_winners': [],
            'trending_posts': []
        }
        
        serializer = CommunityStatsSerializer(stats)
        return Response(serializer.data)

class VirtualMeetingSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing virtual meeting sessions"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['session_name', 'event__title', 'host__username']
    ordering_fields = ['scheduled_start', 'actual_start', 'created_at']
    ordering = ['-scheduled_start']
    filterset_fields = ['status', 'recording_enabled', 'event']
    
    def get_queryset(self):
        """Return sessions user can access"""
        return VirtualMeetingSession.objects.filter(
            Q(host=self.request.user) |
            Q(co_hosts=self.request.user) |
            Q(participants=self.request.user) |
            Q(event__organizer=self.request.user) |
            Q(event__co_organizers=self.request.user) |
            Q(event__visibility='public')
        ).select_related('event', 'host').prefetch_related('co_hosts', 'participants').distinct()
    
    def perform_create(self, serializer):
        """Set host from request user"""
        serializer.save(host=self.request.user)
    
    @action(detail=True, methods=['post'])
    def start_session(self, request, pk=None):
        """Start a virtual meeting session"""
        session = self.get_object()
        
        # Only host or co-hosts can start session
        if (session.host != request.user and 
            not session.co_hosts.filter(id=request.user.id).exists()):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if session.status != 'scheduled':
            return Response(
                {'error': 'Session cannot be started'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update session status
        session.status = 'in_progress'
        session.actual_start = timezone.now()
        session.save()
        
        # Start recording if enabled
        if session.recording_enabled and session.event.video_provider:
            try:
                video_conferencing_service.start_recording(
                    session.event.video_provider,
                    session.provider_meeting_id
                )
                session.event.recording_status = 'recording'
                session.event.save()
            except Exception as e:
                logger.error(f"Failed to start recording: {e}")
        
        return Response({
            'status': 'session_started',
            'actual_start': session.actual_start,
            'meeting_url': session.event.virtual_meeting_url
        })
    
    @action(detail=True, methods=['post'])
    def end_session(self, request, pk=None):
        """End a virtual meeting session"""
        session = self.get_object()
        
        # Only host or co-hosts can end session
        if (session.host != request.user and 
            not session.co_hosts.filter(id=request.user.id).exists()):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if session.status != 'in_progress':
            return Response(
                {'error': 'Session is not in progress'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update session status
        session.status = 'ended'
        session.actual_end = timezone.now()
        if session.actual_start:
            session.total_duration_minutes = int(
                (session.actual_end - session.actual_start).total_seconds() / 60
            )
        session.save()
        
        # Stop recording if enabled
        if session.recording_enabled and session.event.video_provider:
            try:
                video_conferencing_service.stop_recording(
                    session.event.video_provider,
                    session.provider_meeting_id
                )
                session.event.recording_status = 'processing'
                session.event.save()
            except Exception as e:
                logger.error(f"Failed to stop recording: {e}")
        
        return Response({
            'status': 'session_ended',
            'actual_end': session.actual_end,
            'duration_minutes': session.total_duration_minutes
        })
    
    @action(detail=True, methods=['post'])
    def join_session(self, request, pk=None):
        """Join a virtual meeting session as participant"""
        session = self.get_object()
        
        # Check if user is registered for the event
        is_registered = EventRegistration.objects.filter(
            event=session.event,
            user=request.user,
            status='approved'
        ).exists()
        
        is_organizer = (session.event.organizer == request.user or 
                       session.event.co_organizers.filter(id=request.user.id).exists())
        
        if not (is_registered or is_organizer):
            return Response(
                {'error': 'Must be registered for event'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create or update participant record
        participant, created = SessionParticipant.objects.get_or_create(
            session=session,
            user=request.user,
            defaults={
                'status': 'joined',
                'join_time': timezone.now()
            }
        )
        
        if not created and participant.status != 'joined':
            participant.status = 'joined'
            participant.join_time = timezone.now()
            participant.save()
        
        # Update session max participants if needed
        current_participants = session.participants.count()
        if current_participants > session.max_participants:
            session.max_participants = current_participants
            session.save()
        
        return Response({
            'status': 'joined_session',
            'meeting_url': session.event.virtual_meeting_url,
            'join_time': participant.join_time
        })
    
    @action(detail=True, methods=['post'])
    def leave_session(self, request, pk=None):
        """Leave a virtual meeting session"""
        session = self.get_object()
        
        try:
            participant = SessionParticipant.objects.get(
                session=session,
                user=request.user
            )
            
            participant.status = 'left'
            participant.leave_time = timezone.now()
            if participant.join_time:
                participant.duration_minutes = int(
                    (participant.leave_time - participant.join_time).total_seconds() / 60
                )
            participant.save()
            
            return Response({
                'status': 'left_session',
                'leave_time': participant.leave_time,
                'duration_minutes': participant.duration_minutes
            })
        except SessionParticipant.DoesNotExist:
            return Response(
                {'error': 'Not a participant in this session'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """Get session participants"""
        session = self.get_object()
        
        # Only host, co-hosts, or event organizers can view participants
        if (session.host != request.user and 
            not session.co_hosts.filter(id=request.user.id).exists() and
            session.event.organizer != request.user and
            not session.event.co_organizers.filter(id=request.user.id).exists()):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        participants = session.participant_details.select_related('user').all()
        
        participant_data = []
        for participant in participants:
            participant_data.append({
                'user_id': participant.user.id,
                'username': participant.user.username,
                'status': participant.status,
                'join_time': participant.join_time,
                'leave_time': participant.leave_time,
                'duration_minutes': participant.duration_minutes,
                'chat_messages_sent': participant.chat_messages_sent,
                'screen_share_duration': participant.screen_share_duration
            })
        
        return Response(participant_data)
    
    @action(detail=False, methods=['get'])
    def my_sessions(self, request):
        """Get user's virtual meeting sessions"""
        sessions = self.get_queryset().filter(
            Q(host=request.user) |
            Q(co_hosts=request.user) |
            Q(participants=request.user)
        ).distinct()
        
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)


class MeetingRecordingViewSet(viewsets.ModelViewSet):
    """ViewSet for managing meeting recordings"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['session__session_name', 'file_name', 'recording_type']
    ordering_fields = ['created_at', 'duration_minutes', 'file_size_mb']
    ordering = ['-created_at']
    filterset_fields = ['recording_type', 'status', 'is_public']
    
    def get_queryset(self):
        """Return recordings user can access"""
        return MeetingRecording.objects.filter(
            Q(session__host=self.request.user) |
            Q(session__co_hosts=self.request.user) |
            Q(session__participants=self.request.user) |
            Q(session__event__organizer=self.request.user) |
            Q(session__event__co_organizers=self.request.user) |
            Q(is_public=True)
        ).select_related('session', 'session__event').distinct()
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Get download URL for recording"""
        recording = self.get_object()
        
        # Check access permissions
        if not recording.is_public:
            has_access = (
                recording.session.host == request.user or
                recording.session.co_hosts.filter(id=request.user.id).exists() or
                recording.session.participants.filter(id=request.user.id).exists() or
                recording.session.event.organizer == request.user or
                recording.session.event.co_organizers.filter(id=request.user.id).exists()
            )
            
            if not has_access:
                return Response(
                    {'error': 'Access denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Check if recording is available
        if recording.status != 'available':
            return Response(
                {'error': 'Recording not available'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check password protection
        if recording.password_protected:
            provided_password = request.query_params.get('password')
            if provided_password != recording.access_password:
                return Response(
                    {'error': 'Invalid password'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        return Response({
            'download_url': recording.download_url,
            'streaming_url': recording.streaming_url,
            'file_name': recording.file_name,
            'file_size_mb': recording.file_size_mb,
            'duration_minutes': recording.duration_minutes
        })
    
    @action(detail=True, methods=['get'])
    def transcript(self, request, pk=None):
        """Get recording transcript"""
        recording = self.get_object()
        
        # Check access permissions (same as download)
        if not recording.is_public:
            has_access = (
                recording.session.host == request.user or
                recording.session.co_hosts.filter(id=request.user.id).exists() or
                recording.session.participants.filter(id=request.user.id).exists() or
                recording.session.event.organizer == request.user or
                recording.session.event.co_organizers.filter(id=request.user.id).exists()
            )
            
            if not has_access:
                return Response(
                    {'error': 'Access denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        return Response({
            'transcript': recording.transcript,
            'summary': recording.summary,
            'key_moments': recording.key_moments
        })
    
    @action(detail=False, methods=['get'])
    def my_recordings(self, request):
        """Get user's accessible recordings"""
        recordings = self.get_queryset().filter(
            Q(session__host=request.user) |
            Q(session__co_hosts=request.user) |
            Q(session__participants=request.user)
        ).distinct()
        
        serializer = self.get_serializer(recordings, many=True)
        return Response(serializer.data)


class CalendarIntegrationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing calendar integrations"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['event__title', 'provider']
    ordering_fields = ['created_at', 'last_sync']
    ordering = ['-created_at']
    filterset_fields = ['provider', 'status', 'auto_sync']
    
    def get_queryset(self):
        """Return user's calendar integrations"""
        return CalendarIntegration.objects.filter(
            user=self.request.user
        ).select_related('event')
    
    def perform_create(self, serializer):
        """Set user from request user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def sync_now(self, request, pk=None):
        """Manually sync calendar integration"""
        integration = self.get_object()
        
        try:
            # Get updated event data
            event_data = {
                'title': integration.event.title,
                'description': integration.event.description,
                'start_time': integration.event.start_datetime.isoformat(),
                'end_time': integration.event.end_datetime.isoformat(),
                'timezone': integration.event.timezone,
                'location': integration.event.virtual_meeting_url or integration.event.location_name,
                'meeting_url': integration.event.virtual_meeting_url
            }
            
            # Update calendar event
            calendar_service.update_event(
                integration.provider,
                integration.provider_event_id,
                event_data
            )
            
            # Update integration status
            integration.status = 'synced'
            integration.last_sync = timezone.now()
            integration.sync_error = None
            integration.save()
            
            return Response({
                'status': 'synced',
                'last_sync': integration.last_sync
            })
        except Exception as e:
            integration.status = 'failed'
            integration.sync_error = str(e)
            integration.save()
            
            return Response(
                {'error': f'Sync failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['delete'])
    def remove_from_calendar(self, request, pk=None):
        """Remove event from calendar and delete integration"""
        integration = self.get_object()
        
        try:
            # Delete from calendar provider
            calendar_service.delete_event(
                integration.provider,
                integration.provider_event_id
            )
            
            # Delete integration record
            integration.delete()
            
            return Response({'status': 'removed_from_calendar'})
        except Exception as e:
            return Response(
                {'error': f'Failed to remove from calendar: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def sync_status(self, request):
        """Get sync status for all integrations"""
        integrations = self.get_queryset()
        
        status_data = []
        for integration in integrations:
            status_data.append({
                'event_title': integration.event.title,
                'provider': integration.provider,
                'status': integration.status,
                'last_sync': integration.last_sync,
                'sync_error': integration.sync_error,
                'auto_sync': integration.auto_sync
            })
        
        return Response(status_data)