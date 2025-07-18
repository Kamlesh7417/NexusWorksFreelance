from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Skill, UserSkill, Portfolio

User = get_user_model()


class SkillSerializer(serializers.ModelSerializer):
    """Serializer for the Skill model"""
    
    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'description', 'is_active']


class UserSkillSerializer(serializers.ModelSerializer):
    """Serializer for the UserSkill model with nested Skill details"""
    
    skill_details = SkillSerializer(source='skill', read_only=True)
    
    class Meta:
        model = UserSkill
        fields = [
            'id', 'skill', 'skill_details', 'proficiency_level', 
            'years_of_experience', 'is_primary', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class PortfolioSerializer(serializers.ModelSerializer):
    """Serializer for the Portfolio model"""
    
    class Meta:
        model = Portfolio
        fields = [
            'id', 'title', 'description', 'project_url', 
            'image_url', 'technologies_used', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model"""
    
    skills = UserSkillSerializer(source='user_skills', many=True, read_only=True)
    portfolio = PortfolioSerializer(source='portfolio_items', many=True, read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'user_type', 'bio', 'location', 'timezone', 'hourly_rate',
            'availability_hours_per_week', 'profile_completed', 'email_verified',
            'phone_verified', 'overall_rating', 'total_reviews', 
            'projects_completed', 'total_earnings', 'created_at', 
            'updated_at', 'last_active', 'skills', 'portfolio'
        ]
        read_only_fields = [
            'id', 'email_verified', 'phone_verified', 'overall_rating', 
            'total_reviews', 'projects_completed', 'total_earnings', 
            'created_at', 'updated_at', 'last_active'
        ]


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile information"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'user_type', 'bio', 
            'location', 'timezone', 'hourly_rate', 'availability_hours_per_week'
        ]
        
    def update(self, instance, validated_data):
        """Update and return user instance"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Check if profile is now complete
        required_fields = ['first_name', 'last_name', 'user_type', 'bio', 'location']
        profile_complete = all(getattr(instance, field) for field in required_fields)
        
        if profile_complete and not instance.profile_completed:
            instance.profile_completed = True
            
        instance.save()
        return instance