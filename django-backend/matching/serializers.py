from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import DeveloperMatch, MatchingPreferences, MatchingAnalytics, MatchingCache

User = get_user_model()


class DeveloperMatchSerializer(serializers.ModelSerializer):
    """Serializer for the AI DeveloperMatch model"""
    
    task_details = serializers.SerializerMethodField()
    developer_details = serializers.SerializerMethodField()
    
    class Meta:
        model = DeveloperMatch
        fields = [
            'id', 'task', 'task_details', 'developer', 'developer_details',
            'match_score', 'vector_score', 'graph_score', 'availability_score',
            'created_at'
        ]
        read_only_fields = [
            'id', 'match_score', 'vector_score', 'graph_score', 
            'availability_score', 'created_at'
        ]
    
    def get_task_details(self, obj):
        """Get basic task information"""
        if obj.task:
            return {
                'id': obj.task.id,
                'title': obj.task.title,
                'project_title': obj.task.project.title,
                'required_skills': obj.task.required_skills,
                'estimated_hours': obj.task.estimated_hours,
            }
        return None
    
    def get_developer_details(self, obj):
        """Get basic developer information"""
        if obj.developer:
            developer_profile = getattr(obj.developer, 'developerprofile', None)
            return {
                'id': obj.developer.id,
                'username': obj.developer.username,
                'first_name': obj.developer.first_name,
                'last_name': obj.developer.last_name,
                'skills': developer_profile.skills if developer_profile else [],
                'experience_level': developer_profile.experience_level if developer_profile else None,
                'reputation_score': developer_profile.reputation_score if developer_profile else 0.0,
            }
        return None


class RealTimeMatchSerializer(serializers.ModelSerializer):
    """Serializer for real-time matching results with detailed analysis"""
    
    task_details = serializers.SerializerMethodField()
    developer_details = serializers.SerializerMethodField()
    confidence_level = serializers.SerializerMethodField()
    match_analysis = serializers.SerializerMethodField()
    
    class Meta:
        model = DeveloperMatch
        fields = [
            'id', 'task', 'task_details', 'developer', 'developer_details',
            'match_score', 'vector_score', 'graph_score', 'availability_score',
            'confidence_level', 'match_analysis', 'created_at'
        ]
        read_only_fields = '__all__'
    
    def get_task_details(self, obj):
        """Get detailed task information"""
        if obj.task:
            return {
                'id': obj.task.id,
                'title': obj.task.title,
                'description': obj.task.description,
                'project_id': obj.task.project.id,
                'project_title': obj.task.project.title,
                'required_skills': obj.task.required_skills,
                'estimated_hours': obj.task.estimated_hours,
                'priority': obj.task.priority,
                'status': obj.task.status
            }
        return None
    
    def get_developer_details(self, obj):
        """Get detailed developer information"""
        if obj.developer:
            developer_profile = getattr(obj.developer, 'developerprofile', None)
            return {
                'id': obj.developer.id,
                'username': obj.developer.username,
                'first_name': obj.developer.first_name,
                'last_name': obj.developer.last_name,
                'email': obj.developer.email,
                'skills': developer_profile.skills if developer_profile else [],
                'experience_level': developer_profile.experience_level if developer_profile else None,
                'hourly_rate': float(developer_profile.hourly_rate) if developer_profile and developer_profile.hourly_rate else None,
                'availability_status': developer_profile.availability_status if developer_profile else None,
                'reputation_score': developer_profile.reputation_score if developer_profile else 0.0,
                'github_username': obj.developer.github_username if hasattr(obj.developer, 'github_username') else None
            }
        return None
    
    def get_confidence_level(self, obj):
        """Calculate confidence level based on scores"""
        avg_score = (obj.vector_score + obj.graph_score + obj.availability_score) / 3
        
        if avg_score >= 0.8:
            return 'high'
        elif avg_score >= 0.6:
            return 'medium'
        else:
            return 'low'
    
    def get_match_analysis(self, obj):
        """Get detailed match analysis"""
        return {
            'overall_fit': 'excellent' if obj.match_score >= 0.8 else 'good' if obj.match_score >= 0.6 else 'fair',
            'skill_compatibility': obj.vector_score,
            'experience_match': obj.graph_score,
            'availability_factor': obj.availability_score,
            'recommendation': self._get_recommendation(obj)
        }
    
    def _get_recommendation(self, obj):
        """Generate recommendation based on scores"""
        if obj.match_score >= 0.8:
            return "Highly recommended - excellent match for this project"
        elif obj.match_score >= 0.6:
            return "Good match - consider for this project"
        else:
            return "Potential match - may need additional evaluation"


class MatchingPreferencesSerializer(serializers.ModelSerializer):
    """Serializer for user matching preferences"""
    
    class Meta:
        model = MatchingPreferences
        fields = [
            'id', 'min_budget', 'max_budget', 'min_hourly_rate', 'max_hourly_rate',
            'min_experience_level', 'max_experience_level', 'preferred_skills',
            'excluded_skills', 'preferred_timezones', 'remote_only',
            'preferred_project_types', 'excluded_project_types',
            'skill_weight', 'experience_weight', 'availability_weight', 'reputation_weight',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate preference constraints"""
        # Validate budget range
        if data.get('min_budget') and data.get('max_budget'):
            if data['min_budget'] > data['max_budget']:
                raise serializers.ValidationError("Minimum budget cannot be greater than maximum budget")
        
        # Validate rate range
        if data.get('min_hourly_rate') and data.get('max_hourly_rate'):
            if data['min_hourly_rate'] > data['max_hourly_rate']:
                raise serializers.ValidationError("Minimum hourly rate cannot be greater than maximum hourly rate")
        
        # Validate weights sum to 1.0
        weights = [
            data.get('skill_weight', 0.4),
            data.get('experience_weight', 0.3),
            data.get('availability_weight', 0.2),
            data.get('reputation_weight', 0.1)
        ]
        
        if abs(sum(weights) - 1.0) > 0.01:  # Allow small floating point differences
            raise serializers.ValidationError("Matching weights must sum to 1.0")
        
        return data


class MatchingAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for matching analytics"""
    
    user_details = serializers.SerializerMethodField()
    project_details = serializers.SerializerMethodField()
    
    class Meta:
        model = MatchingAnalytics
        fields = [
            'id', 'user', 'user_details', 'project', 'project_details',
            'search_type', 'match_count', 'response_time_ms', 'cache_hit',
            'search_parameters', 'feedback_data', 'timestamp'
        ]
        read_only_fields = '__all__'
    
    def get_user_details(self, obj):
        """Get basic user information"""
        if obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'first_name': obj.user.first_name,
                'last_name': obj.user.last_name
            }
        return None
    
    def get_project_details(self, obj):
        """Get basic project information"""
        if obj.project:
            return {
                'id': obj.project.id,
                'title': obj.project.title,
                'status': obj.project.status
            }
        return None


class MatchingCacheSerializer(serializers.ModelSerializer):
    """Serializer for matching cache entries"""
    
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = MatchingCache
        fields = [
            'id', 'cache_key', 'search_type', 'parameters_hash',
            'created_at', 'expires_at', 'hit_count', 'last_accessed', 'is_expired'
        ]
        read_only_fields = '__all__'
    
    def get_is_expired(self, obj):
        """Check if cache entry is expired"""
        return obj.is_expired()


class MatchingFeedbackSerializer(serializers.Serializer):
    """Serializer for matching feedback"""
    
    FEEDBACK_TYPES = [
        ('positive', 'Positive'),
        ('negative', 'Negative'),
        ('neutral', 'Neutral')
    ]
    
    match_id = serializers.UUIDField()
    feedback_type = serializers.ChoiceField(choices=FEEDBACK_TYPES)
    rating = serializers.IntegerField(min_value=1, max_value=5, required=False)
    comments = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    
    # Specific feedback categories
    skill_match_accuracy = serializers.IntegerField(min_value=1, max_value=5, required=False)
    experience_relevance = serializers.IntegerField(min_value=1, max_value=5, required=False)
    availability_accuracy = serializers.IntegerField(min_value=1, max_value=5, required=False)
    
    # Improvement suggestions
    suggested_skills = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True
    )
    
    def validate(self, data):
        """Validate feedback data"""
        if data['feedback_type'] in ['positive', 'negative'] and not data.get('rating'):
            raise serializers.ValidationError("Rating is required for positive/negative feedback")
        
        return data