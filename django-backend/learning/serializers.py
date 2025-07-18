from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    LearningPath, Course, LearningCredit, ShadowingSession, CourseEnrollment
)

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user information for nested serialization"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for learning courses"""
    
    instructor_details = UserBasicSerializer(source='instructor', read_only=True)
    enrollment_status = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'instructor', 'instructor_details',
            'difficulty_level', 'course_type', 'skills_taught', 'prerequisites',
            'duration_hours', 'content_url', 'materials', 'is_free', 'price',
            'is_active', 'enrollment_count', 'completion_rate', 'average_rating',
            'enrollment_status', 'user_rating', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'instructor', 'enrollment_count', 'completion_rate',
            'average_rating', 'created_at', 'updated_at'
        ]
    
    def get_enrollment_status(self, obj):
        """Get current user's enrollment status for this course"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                enrollment = CourseEnrollment.objects.get(user=request.user, course=obj)
                return {
                    'status': enrollment.status,
                    'progress_percentage': enrollment.progress_percentage,
                    'started_at': enrollment.started_at,
                    'completed_at': enrollment.completed_at,
                }
            except CourseEnrollment.DoesNotExist:
                return None
        return None
    
    def get_user_rating(self, obj):
        """Get current user's rating for this course"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                enrollment = CourseEnrollment.objects.get(user=request.user, course=obj)
                return enrollment.rating
            except CourseEnrollment.DoesNotExist:
                return None
        return None


class CourseEnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for course enrollment tracking"""
    
    user_details = UserBasicSerializer(source='user', read_only=True)
    course_details = serializers.SerializerMethodField()
    
    class Meta:
        model = CourseEnrollment
        fields = [
            'id', 'user', 'user_details', 'course', 'course_details', 'status',
            'progress_percentage', 'started_at', 'completed_at', 'certificate_issued',
            'final_score', 'assessment_results', 'rating', 'review'
        ]
        read_only_fields = [
            'id', 'user', 'started_at', 'completed_at', 'certificate_issued'
        ]
    
    def get_course_details(self, obj):
        """Get basic course information"""
        if obj.course:
            return {
                'id': obj.course.id,
                'title': obj.course.title,
                'difficulty_level': obj.course.difficulty_level,
                'duration_hours': obj.course.duration_hours,
                'instructor_name': obj.course.instructor.username,
            }
        return None


class LearningCreditSerializer(serializers.ModelSerializer):
    """Serializer for learning credits and achievements"""
    
    user_details = UserBasicSerializer(source='user', read_only=True)
    course_details = serializers.SerializerMethodField()
    learning_path_details = serializers.SerializerMethodField()
    
    class Meta:
        model = LearningCredit
        fields = [
            'id', 'user', 'user_details', 'credit_type', 'amount', 'description',
            'course', 'course_details', 'learning_path', 'learning_path_details',
            'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']
    
    def get_course_details(self, obj):
        """Get basic course information"""
        if obj.course:
            return {
                'id': obj.course.id,
                'title': obj.course.title,
                'difficulty_level': obj.course.difficulty_level,
            }
        return None
    
    def get_learning_path_details(self, obj):
        """Get basic learning path information"""
        if obj.learning_path:
            return {
                'id': obj.learning_path.id,
                'title': obj.learning_path.title,
                'status': obj.learning_path.status,
            }
        return None


class LearningPathSerializer(serializers.ModelSerializer):
    """Serializer for personalized learning paths"""
    
    developer_details = UserBasicSerializer(source='developer', read_only=True)
    recommended_courses_details = serializers.SerializerMethodField()
    skill_gap_summary = serializers.SerializerMethodField()
    next_milestone = serializers.SerializerMethodField()
    
    class Meta:
        model = LearningPath
        fields = [
            'id', 'developer', 'developer_details', 'title', 'description',
            'current_skills', 'target_skills', 'recommended_courses',
            'recommended_courses_details', 'progress_percentage', 'status',
            'market_trends_analysis', 'skill_gap_analysis', 'skill_gap_summary',
            'estimated_completion_time', 'next_milestone', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'developer', 'market_trends_analysis', 'skill_gap_analysis',
            'created_at', 'updated_at'
        ]
    
    def get_recommended_courses_details(self, obj):
        """Get details of recommended courses"""
        if obj.recommended_courses:
            courses = Course.objects.filter(id__in=obj.recommended_courses)
            return CourseSerializer(courses, many=True, context=self.context).data
        return []
    
    def get_skill_gap_summary(self, obj):
        """Get a summary of skill gaps"""
        current_skills = set(obj.current_skills)
        target_skills = set(obj.target_skills)
        missing_skills = target_skills - current_skills
        
        return {
            'total_target_skills': len(target_skills),
            'current_skills_count': len(current_skills),
            'missing_skills_count': len(missing_skills),
            'missing_skills': list(missing_skills),
            'completion_percentage': obj.progress_percentage,
        }
    
    def get_next_milestone(self, obj):
        """Get next learning milestone"""
        if obj.recommended_courses:
            # Find next uncompleted course
            enrollments = CourseEnrollment.objects.filter(
                user=obj.developer,
                course_id__in=obj.recommended_courses
            ).exclude(status='completed')
            
            if enrollments.exists():
                next_enrollment = enrollments.first()
                return {
                    'course_id': next_enrollment.course.id,
                    'course_title': next_enrollment.course.title,
                    'progress': next_enrollment.progress_percentage,
                    'estimated_hours_remaining': max(0, next_enrollment.course.duration_hours - (next_enrollment.course.duration_hours * next_enrollment.progress_percentage / 100)),
                }
        return None


class ShadowingSessionSerializer(serializers.ModelSerializer):
    """Serializer for student shadowing sessions"""
    
    student_details = UserBasicSerializer(source='student', read_only=True)
    mentor_details = UserBasicSerializer(source='mentor', read_only=True)
    project_details = serializers.SerializerMethodField()
    session_duration = serializers.SerializerMethodField()
    can_approve = serializers.SerializerMethodField()
    
    class Meta:
        model = ShadowingSession
        fields = [
            'id', 'student', 'student_details', 'project', 'project_details',
            'mentor', 'mentor_details', 'start_date', 'end_date', 'status',
            'learning_goals', 'skills_to_observe', 'nda_signed', 'nda_signed_date',
            'client_approved', 'client_approval_date', 'learning_credits_awarded',
            'mentoring_credits_awarded', 'student_feedback', 'mentor_feedback',
            'student_rating', 'mentor_rating', 'session_notes', 'attendance_log',
            'session_duration', 'can_approve', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'nda_signed_date', 'client_approval_date', 'learning_credits_awarded',
            'mentoring_credits_awarded', 'created_at', 'updated_at'
        ]
    
    def get_project_details(self, obj):
        """Get basic project information"""
        if obj.project:
            return {
                'id': obj.project.id,
                'title': obj.project.title,
                'status': obj.project.status,
                'client_name': obj.project.client.username,
            }
        return None
    
    def get_session_duration(self, obj):
        """Calculate session duration in days"""
        if obj.start_date and obj.end_date:
            return (obj.end_date - obj.start_date).days
        return None
    
    def get_can_approve(self, obj):
        """Check if current user can approve this session"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Client can approve if they own the project
            if obj.project and obj.project.client == request.user:
                return True
            # Mentor can provide feedback
            if obj.mentor == request.user:
                return True
        return False


class ShadowingSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating shadowing session requests"""
    
    class Meta:
        model = ShadowingSession
        fields = [
            'project', 'mentor', 'start_date', 'end_date',
            'learning_goals', 'skills_to_observe'
        ]
    
    def create(self, validated_data):
        """Create shadowing session with student from request user"""
        validated_data['student'] = self.context['request'].user
        validated_data['status'] = 'requested'
        return super().create(validated_data)


class ShadowingSessionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating shadowing session status and feedback"""
    
    class Meta:
        model = ShadowingSession
        fields = [
            'status', 'client_approved', 'nda_signed', 'student_feedback',
            'mentor_feedback', 'student_rating', 'mentor_rating', 'session_notes'
        ]


# Nested serializers for complex relationships
class LearningPathDetailSerializer(LearningPathSerializer):
    """Detailed learning path serializer with enrolled courses"""
    
    enrolled_courses = serializers.SerializerMethodField()
    learning_credits = serializers.SerializerMethodField()
    
    class Meta(LearningPathSerializer.Meta):
        fields = LearningPathSerializer.Meta.fields + ['enrolled_courses', 'learning_credits']
    
    def get_enrolled_courses(self, obj):
        """Get user's enrolled courses related to this learning path"""
        if obj.recommended_courses:
            enrollments = CourseEnrollment.objects.filter(
                user=obj.developer,
                course_id__in=obj.recommended_courses
            )
            return CourseEnrollmentSerializer(enrollments, many=True).data
        return []
    
    def get_learning_credits(self, obj):
        """Get learning credits earned for this path"""
        credits = LearningCredit.objects.filter(
            user=obj.developer,
            learning_path=obj
        )
        return LearningCreditSerializer(credits, many=True).data


class CourseDetailSerializer(CourseSerializer):
    """Detailed course serializer with enrollment information"""
    
    recent_enrollments = serializers.SerializerMethodField()
    
    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ['recent_enrollments']
    
    def get_recent_enrollments(self, obj):
        """Get recent enrollments for this course"""
        recent_enrollments = obj.enrollments.order_by('-started_at')[:5]
        return CourseEnrollmentSerializer(recent_enrollments, many=True).data


class DeveloperLearningStatsSerializer(serializers.Serializer):
    """Serializer for developer learning statistics"""
    
    total_courses_completed = serializers.IntegerField()
    total_learning_credits = serializers.IntegerField()
    active_learning_paths = serializers.IntegerField()
    shadowing_sessions_completed = serializers.IntegerField()
    mentoring_sessions_provided = serializers.IntegerField()
    skill_improvements = serializers.ListField(child=serializers.CharField())
    recent_achievements = serializers.ListField(child=serializers.DictField())
    learning_streak_days = serializers.IntegerField()
    next_recommended_course = serializers.DictField(required=False)


class LearningRecommendationSerializer(serializers.Serializer):
    """Serializer for AI-generated learning recommendations"""
    
    recommended_courses = CourseSerializer(many=True)
    skill_gaps = serializers.ListField(child=serializers.CharField())
    market_demand_skills = serializers.ListField(child=serializers.CharField())
    estimated_learning_time = serializers.IntegerField()  # in hours
    priority_score = serializers.FloatField()
    reasoning = serializers.CharField()