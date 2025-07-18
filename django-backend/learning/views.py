from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from django.utils import timezone

from .models import (
    LearningPath, Course, LearningCredit, ShadowingSession, CourseEnrollment
)
from .serializers import (
    LearningPathSerializer, LearningPathDetailSerializer,
    CourseSerializer, CourseDetailSerializer, CourseEnrollmentSerializer,
    LearningCreditSerializer, ShadowingSessionSerializer,
    ShadowingSessionCreateSerializer, ShadowingSessionUpdateSerializer,
    DeveloperLearningStatsSerializer, LearningRecommendationSerializer
)


class LearningPathViewSet(viewsets.ModelViewSet):
    """ViewSet for managing personalized learning paths"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'description', 'current_skills', 'target_skills']
    ordering_fields = ['created_at', 'updated_at', 'progress_percentage']
    ordering = ['-created_at']
    filterset_fields = ['status', 'progress_percentage']
    
    def get_queryset(self):
        """Return learning paths for current user"""
        return LearningPath.objects.filter(
            developer=self.request.user
        ).prefetch_related('developer')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'retrieve':
            return LearningPathDetailSerializer
        return LearningPathSerializer
    
    def perform_create(self, serializer):
        """Set developer from request user"""
        serializer.save(developer=self.request.user)
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update learning path progress"""
        learning_path = self.get_object()
        progress = request.data.get('progress_percentage')
        
        if progress is not None and 0 <= progress <= 100:
            learning_path.progress_percentage = progress
            learning_path.save()
            
            # Award credits for milestones
            if progress == 100 and learning_path.status != 'completed':
                learning_path.status = 'completed'
                learning_path.save()
                
                # Award completion credits
                LearningCredit.objects.create(
                    user=request.user,
                    credit_type='course_completion',
                    amount=50,
                    description=f'Completed learning path: {learning_path.title}',
                    learning_path=learning_path
                )
            
            serializer = self.get_serializer(learning_path)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Invalid progress percentage'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause learning path"""
        learning_path = self.get_object()
        learning_path.status = 'paused'
        learning_path.save()
        return Response({'status': 'paused'})
    
    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume learning path"""
        learning_path = self.get_object()
        learning_path.status = 'active'
        learning_path.save()
        return Response({'status': 'resumed'})
    
    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        """Get AI-generated learning path recommendations"""
        # This would integrate with AI service for personalized recommendations
        # For now, return mock data structure
        recommendations = {
            'recommended_courses': [],
            'skill_gaps': ['React', 'TypeScript', 'GraphQL'],
            'market_demand_skills': ['Python', 'Machine Learning', 'Cloud Computing'],
            'estimated_learning_time': 120,  # hours
            'priority_score': 0.85,
            'reasoning': 'Based on your current skills and market trends, focusing on full-stack development would enhance your profile.'
        }
        
        serializer = LearningRecommendationSerializer(recommendations)
        return Response(serializer.data)


class CourseViewSet(viewsets.ModelViewSet):
    """ViewSet for managing learning courses"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'description', 'skills_taught', 'instructor__username']
    ordering_fields = ['created_at', 'enrollment_count', 'average_rating', 'duration_hours']
    ordering = ['-created_at']
    filterset_fields = ['difficulty_level', 'course_type', 'is_free', 'is_active']
    
    def get_queryset(self):
        """Return active courses"""
        return Course.objects.filter(is_active=True).select_related('instructor')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer
    
    def perform_create(self, serializer):
        """Set instructor from request user"""
        serializer.save(instructor=self.request.user)
    
    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        """Enroll user in course"""
        course = self.get_object()
        
        # Check if already enrolled
        enrollment, created = CourseEnrollment.objects.get_or_create(
            user=request.user,
            course=course,
            defaults={'status': 'enrolled'}
        )
        
        if created:
            # Update course enrollment count
            course.enrollment_count += 1
            course.save()
            
            serializer = CourseEnrollmentSerializer(enrollment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {'error': 'Already enrolled in this course'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def unenroll(self, request, pk=None):
        """Unenroll user from course"""
        course = self.get_object()
        
        try:
            enrollment = CourseEnrollment.objects.get(
                user=request.user,
                course=course
            )
            enrollment.status = 'dropped'
            enrollment.save()
            
            return Response({'status': 'unenrolled'})
        except CourseEnrollment.DoesNotExist:
            return Response(
                {'error': 'Not enrolled in this course'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        """Rate a course"""
        course = self.get_object()
        rating = request.data.get('rating')
        review = request.data.get('review', '')
        
        if rating and 1 <= rating <= 5:
            try:
                enrollment = CourseEnrollment.objects.get(
                    user=request.user,
                    course=course
                )
                enrollment.rating = rating
                enrollment.review = review
                enrollment.save()
                
                # Update course average rating
                avg_rating = CourseEnrollment.objects.filter(
                    course=course,
                    rating__isnull=False
                ).aggregate(avg_rating=Avg('rating'))['avg_rating']
                
                course.average_rating = avg_rating or 0
                course.save()
                
                return Response({'status': 'rating submitted'})
            except CourseEnrollment.DoesNotExist:
                return Response(
                    {'error': 'Must be enrolled to rate course'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(
            {'error': 'Invalid rating (1-5)'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'])
    def my_courses(self, request):
        """Get user's enrolled courses"""
        enrollments = CourseEnrollment.objects.filter(
            user=request.user
        ).select_related('course')
        
        serializer = CourseEnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular courses"""
        popular_courses = self.get_queryset().order_by(
            '-enrollment_count', '-average_rating'
        )[:10]
        
        serializer = self.get_serializer(popular_courses, many=True)
        return Response(serializer.data)


class CourseEnrollmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing course enrollments"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['course__title', 'user__username']
    ordering_fields = ['started_at', 'progress_percentage', 'final_score']
    ordering = ['-started_at']
    filterset_fields = ['status', 'certificate_issued']
    
    def get_queryset(self):
        """Return enrollments for current user"""
        return CourseEnrollment.objects.filter(
            user=self.request.user
        ).select_related('course', 'user')
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update course progress"""
        enrollment = self.get_object()
        progress = request.data.get('progress_percentage')
        
        if progress is not None and 0 <= progress <= 100:
            enrollment.progress_percentage = progress
            
            # Mark as completed if 100%
            if progress == 100 and enrollment.status != 'completed':
                enrollment.status = 'completed'
                enrollment.completed_at = timezone.now()
                
                # Award completion credits
                LearningCredit.objects.create(
                    user=request.user,
                    credit_type='course_completion',
                    amount=25,
                    description=f'Completed course: {enrollment.course.title}',
                    course=enrollment.course
                )
                
                # Update course completion rate
                total_enrollments = CourseEnrollment.objects.filter(
                    course=enrollment.course
                ).count()
                completed_enrollments = CourseEnrollment.objects.filter(
                    course=enrollment.course,
                    status='completed'
                ).count()
                
                enrollment.course.completion_rate = (completed_enrollments / total_enrollments) * 100
                enrollment.course.save()
            
            enrollment.save()
            serializer = self.get_serializer(enrollment)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Invalid progress percentage'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def submit_assessment(self, request, pk=None):
        """Submit course assessment"""
        enrollment = self.get_object()
        score = request.data.get('score')
        assessment_data = request.data.get('assessment_results', {})
        
        if score is not None and 0 <= score <= 100:
            enrollment.final_score = score
            enrollment.assessment_results = assessment_data
            
            # Issue certificate if score is high enough
            if score >= 70:
                enrollment.certificate_issued = True
            
            enrollment.save()
            serializer = self.get_serializer(enrollment)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Invalid score'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


class ShadowingSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing shadowing sessions"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['project__title', 'student__username', 'mentor__username']
    ordering_fields = ['start_date', 'created_at', 'learning_credits_awarded']
    ordering = ['-created_at']
    filterset_fields = ['status', 'nda_signed', 'client_approved']
    
    def get_queryset(self):
        """Return shadowing sessions where user is involved"""
        return ShadowingSession.objects.filter(
            Q(student=self.request.user) | 
            Q(mentor=self.request.user) |
            Q(project__client=self.request.user)
        ).select_related('student', 'mentor', 'project')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return ShadowingSessionCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ShadowingSessionUpdateSerializer
        return ShadowingSessionSerializer
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve shadowing session (client only)"""
        session = self.get_object()
        
        # Only project client can approve
        if session.project.client != request.user:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        session.client_approved = True
        session.client_approval_date = timezone.now()
        session.status = 'approved'
        session.save()
        
        return Response({'status': 'approved'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject shadowing session (client only)"""
        session = self.get_object()
        
        # Only project client can reject
        if session.project.client != request.user:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        session.status = 'rejected'
        session.save()
        
        return Response({'status': 'rejected'})
    
    @action(detail=True, methods=['post'])
    def sign_nda(self, request, pk=None):
        """Sign NDA for shadowing session"""
        session = self.get_object()
        
        # Only student can sign NDA
        if session.student != request.user:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        session.nda_signed = True
        session.nda_signed_date = timezone.now()
        session.save()
        
        return Response({'status': 'NDA signed'})
    
    @action(detail=True, methods=['post'])
    def start_session(self, request, pk=None):
        """Start shadowing session"""
        session = self.get_object()
        
        if session.status == 'approved' and session.nda_signed:
            session.status = 'active'
            session.save()
            return Response({'status': 'session started'})
        
        return Response(
            {'error': 'Session must be approved and NDA signed'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def complete_session(self, request, pk=None):
        """Complete shadowing session and award credits"""
        session = self.get_object()
        
        if session.status == 'active':
            session.status = 'completed'
            
            # Award learning credits to student
            session.learning_credits_awarded = 30
            LearningCredit.objects.create(
                user=session.student,
                credit_type='shadowing',
                amount=30,
                description=f'Completed shadowing session for {session.project.title}'
            )
            
            # Award mentoring credits to mentor
            session.mentoring_credits_awarded = 20
            LearningCredit.objects.create(
                user=session.mentor,
                credit_type='mentoring',
                amount=20,
                description=f'Mentored student in {session.project.title}'
            )
            
            session.save()
            return Response({'status': 'session completed'})
        
        return Response(
            {'error': 'Session must be active to complete'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'])
    def my_sessions(self, request):
        """Get user's shadowing sessions"""
        role = request.query_params.get('role', 'all')
        
        if role == 'student':
            sessions = self.get_queryset().filter(student=request.user)
        elif role == 'mentor':
            sessions = self.get_queryset().filter(mentor=request.user)
        elif role == 'client':
            sessions = self.get_queryset().filter(project__client=request.user)
        else:
            sessions = self.get_queryset()
        
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)


class LearningCreditViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing learning credits"""
    
    serializer_class = LearningCreditSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['description', 'credit_type']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']
    filterset_fields = ['credit_type', 'course', 'learning_path']
    
    def get_queryset(self):
        """Return credits for current user"""
        return LearningCredit.objects.filter(
            user=self.request.user
        ).select_related('course', 'learning_path')
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get learning credits summary"""
        queryset = self.get_queryset()
        
        summary = queryset.values('credit_type').annotate(
            total_credits=Count('id'),
            total_amount=Count('amount')
        )
        
        total_credits = queryset.aggregate(
            total=Count('amount')
        )['total'] or 0
        
        return Response({
            'total_credits': total_credits,
            'by_type': list(summary),
            'recent_credits': LearningCreditSerializer(
                queryset[:5], many=True
            ).data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get comprehensive learning statistics"""
        user = request.user
        
        # Calculate various learning metrics
        total_courses_completed = CourseEnrollment.objects.filter(
            user=user, status='completed'
        ).count()
        
        total_learning_credits = LearningCredit.objects.filter(
            user=user
        ).aggregate(total=Count('amount'))['total'] or 0
        
        active_learning_paths = LearningPath.objects.filter(
            developer=user, status='active'
        ).count()
        
        shadowing_sessions_completed = ShadowingSession.objects.filter(
            student=user, status='completed'
        ).count()
        
        mentoring_sessions_provided = ShadowingSession.objects.filter(
            mentor=user, status='completed'
        ).count()
        
        stats = {
            'total_courses_completed': total_courses_completed,
            'total_learning_credits': total_learning_credits,
            'active_learning_paths': active_learning_paths,
            'shadowing_sessions_completed': shadowing_sessions_completed,
            'mentoring_sessions_provided': mentoring_sessions_provided,
            'skill_improvements': ['Python', 'Django', 'React'],  # Mock data
            'recent_achievements': [
                {'title': 'Course Completion', 'date': '2024-01-15'},
                {'title': 'Mentoring Badge', 'date': '2024-01-10'}
            ],
            'learning_streak_days': 15,
            'next_recommended_course': {
                'title': 'Advanced React Patterns',
                'duration': 40,
                'difficulty': 'advanced'
            }
        }
        
        serializer = DeveloperLearningStatsSerializer(stats)
        return Response(serializer.data)
