from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


class User(AbstractUser):
    """Extended user model for the AI-powered freelancing platform"""
    
    # Use BigAutoField to match existing database schema
    id = models.BigAutoField(primary_key=True)
    
    USER_TYPE_CHOICES = [
        ('freelancer', 'Freelancer'),
        ('client', 'Client'),
        ('both', 'Both'),
    ]
    
    ROLE_CHOICES = [
        ('client', 'Client'),
        ('developer', 'Developer'),
        ('admin', 'Admin'),
    ]
    
    # Existing fields from migration
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='freelancer')
    bio = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    timezone = models.CharField(max_length=50, blank=True, null=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    availability_hours_per_week = models.IntegerField(
        blank=True, null=True,
        validators=[MinValueValidator(1), MaxValueValidator(168)]
    )
    profile_completed = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    overall_rating = models.DecimalField(
        max_digits=3, decimal_places=2, default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    total_reviews = models.IntegerField(default=0)
    projects_completed = models.IntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_active = models.DateTimeField(auto_now=True)
    
    # Additional fields for team hiring functionality
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='developer')
    github_username = models.CharField(max_length=100, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'users'
        
    def __str__(self):
        return f"{self.username} ({self.get_role_display() if hasattr(self, 'role') else self.user_type})"
    
    @property
    def developer_profile(self):
        """Get or create developer profile"""
        if self.role == 'developer' or self.user_type == 'freelancer':
            profile, created = DeveloperProfile.objects.get_or_create(
                user=self,
                defaults={
                    'skills': [],
                    'experience_level': 'mid',
                    'hourly_rate': self.hourly_rate or 50.00,
                    'availability_status': 'available',
                    'reputation_score': float(self.overall_rating) if self.overall_rating else 0.0,
                    'projects_completed': self.projects_completed,
                    'bio': self.bio or '',
                    'location': self.location or '',
                    'timezone': self.timezone or '',
                    'total_earnings': self.total_earnings
                }
            )
            return profile
        return None


class DeveloperProfile(models.Model):
    """Developer profile with AI-powered features"""
    
    EXPERIENCE_LEVELS = [
        ('junior', 'Junior'),
        ('mid', 'Mid-level'),
        ('senior', 'Senior'),
        ('lead', 'Lead'),
    ]
    
    AVAILABILITY_STATUS = [
        ('available', 'Available'),
        ('busy', 'Busy'),
        ('unavailable', 'Unavailable'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='developer_profile')
    skills = models.JSONField(default=list)  # List of skill names
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVELS)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    availability_status = models.CharField(max_length=20, choices=AVAILABILITY_STATUS, default='available')
    
    # AI-powered features from design
    github_analysis = models.JSONField(default=dict)  # GitHub repository analysis results
    skill_embeddings = models.JSONField(default=list)  # Vector embeddings for skills
    reputation_score = models.FloatField(default=0.0)  # AI-calculated reputation
    
    # Additional profile information
    bio = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    timezone = models.CharField(max_length=50, blank=True, null=True)
    
    # Platform statistics
    projects_completed = models.IntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'developer_profiles'
        
    def __str__(self):
        return f"{self.user.username} - {self.experience_level} Developer"


class Skill(models.Model):
    """Skills that users can have"""
    
    CATEGORIES = [
        ('programming', 'Programming'),
        ('design', 'Design'),
        ('writing', 'Writing'),
        ('marketing', 'Marketing'),
        ('business', 'Business'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORIES)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'skills'
        ordering = ['category', 'name']
        
    def __str__(self):
        return self.name


class UserSkill(models.Model):
    """Junction table for user skills with proficiency levels"""
    
    SKILL_LEVELS = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name='user_skills')
    proficiency_level = models.CharField(max_length=20, choices=SKILL_LEVELS)
    years_of_experience = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(50)]
    )
    is_primary = models.BooleanField(default=False)  # Mark as primary skill
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_skills'
        unique_together = ['user', 'skill']
        
    def __str__(self):
        return f"{self.user.username} - {self.skill.name} ({self.proficiency_level})"


class Portfolio(models.Model):
    """User portfolio items"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolio_items')
    title = models.CharField(max_length=200)
    description = models.TextField()
    project_url = models.URLField(blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    technologies_used = models.JSONField(default=list)  # List of technology names
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'portfolio'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.username} - {self.title}"
