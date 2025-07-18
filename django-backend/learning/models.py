from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()


class LearningPath(models.Model):
    """Personalized learning paths for developers"""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    developer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_paths')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    
    # Skills tracking as specified in design
    current_skills = models.JSONField(default=list)  # List of current skill names
    target_skills = models.JSONField(default=list)   # List of target skill names
    recommended_courses = models.JSONField(default=list)  # List of course IDs
    
    # Progress tracking
    progress_percentage = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # AI-generated recommendations
    market_trends_analysis = models.JSONField(default=dict)
    skill_gap_analysis = models.JSONField(default=dict)
    estimated_completion_time = models.DurationField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'learning_paths'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.developer.username} - {self.title}"


class Course(models.Model):
    """Learning courses available on the platform"""
    
    DIFFICULTY_LEVELS = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]
    
    COURSE_TYPES = [
        ('video', 'Video Course'),
        ('interactive', 'Interactive Course'),
        ('project', 'Project-Based'),
        ('mentorship', 'Mentorship'),
        ('workshop', 'Workshop'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_courses')
    
    # Course details
    difficulty_level = models.CharField(max_length=20, choices=DIFFICULTY_LEVELS)
    course_type = models.CharField(max_length=20, choices=COURSE_TYPES)
    skills_taught = models.JSONField(default=list)  # List of skill names
    prerequisites = models.JSONField(default=list)  # List of required skills
    
    # Course content
    duration_hours = models.IntegerField()
    content_url = models.URLField(blank=True, null=True)
    materials = models.JSONField(default=list)  # List of material URLs/references
    
    # Pricing and access
    is_free = models.BooleanField(default=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    
    # Statistics
    enrollment_count = models.IntegerField(default=0)
    completion_rate = models.FloatField(default=0.0)
    average_rating = models.FloatField(default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'courses'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.title} - {self.instructor.username}"


class LearningCredit(models.Model):
    """Credits awarded for learning activities and achievements"""
    
    CREDIT_TYPES = [
        ('course_completion', 'Course Completion'),
        ('skill_assessment', 'Skill Assessment'),
        ('mentoring', 'Mentoring Others'),
        ('shadowing', 'Shadowing Participation'),
        ('project_contribution', 'Project Contribution'),
        ('community_participation', 'Community Participation'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_credits')
    credit_type = models.CharField(max_length=30, choices=CREDIT_TYPES)
    amount = models.IntegerField(validators=[MinValueValidator(1)])
    description = models.CharField(max_length=200)
    
    # Related objects
    course = models.ForeignKey('Course', null=True, blank=True, on_delete=models.SET_NULL)
    learning_path = models.ForeignKey('LearningPath', null=True, blank=True, on_delete=models.SET_NULL)
    
    # Metadata
    metadata = models.JSONField(default=dict)  # Additional context data
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'learning_credits'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.username} - {self.amount} credits for {self.get_credit_type_display()}"


class ShadowingSession(models.Model):
    """Student shadowing sessions for real project experience"""
    
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('approved', 'Approved'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Participants as specified in design
    student = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='shadowing_sessions'
    )
    project = models.ForeignKey(
        'projects.Project', 
        on_delete=models.CASCADE, 
        related_name='shadowing_sessions'
    )
    mentor = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='mentoring_sessions'
    )
    
    # Session details
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    
    # Learning objectives
    learning_goals = models.JSONField(default=list)  # List of learning objectives
    skills_to_observe = models.JSONField(default=list)  # Skills student wants to learn
    
    # NDA and legal as specified in design
    nda_signed = models.BooleanField(default=False)
    nda_signed_date = models.DateTimeField(null=True, blank=True)
    client_approved = models.BooleanField(default=False)
    client_approval_date = models.DateTimeField(null=True, blank=True)
    
    # Credits and rewards as specified in requirements
    learning_credits_awarded = models.IntegerField(default=0)
    mentoring_credits_awarded = models.IntegerField(default=0)
    
    # Session feedback
    student_feedback = models.TextField(blank=True, null=True)
    mentor_feedback = models.TextField(blank=True, null=True)
    student_rating = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    mentor_rating = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    
    # Session logs
    session_notes = models.TextField(blank=True, null=True)
    attendance_log = models.JSONField(default=list)  # Track session attendance
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'shadowing_sessions'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.student.username} shadowing {self.project.title} with {self.mentor.username}"


class CourseEnrollment(models.Model):
    """Track user enrollment and progress in courses"""
    
    STATUS_CHOICES = [
        ('enrolled', 'Enrolled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    
    # Progress tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='enrolled')
    progress_percentage = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Completion details
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    certificate_issued = models.BooleanField(default=False)
    
    # Assessment results
    final_score = models.FloatField(null=True, blank=True)
    assessment_results = models.JSONField(default=dict)
    
    # User feedback
    rating = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    review = models.TextField(blank=True, null=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'course_enrollments'
        unique_together = ['user', 'course']
        ordering = ['-started_at']
        
    def __str__(self):
        return f"{self.user.username} - {self.course.title} ({self.status})"
