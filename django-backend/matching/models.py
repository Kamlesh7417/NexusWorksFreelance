from django.db import models
from django.contrib.auth import get_user_model
from projects.models import Task, Project

User = get_user_model()


class DeveloperMatch(models.Model):
    """AI matching results for developers and tasks"""
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='developer_matches')
    developer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_matches')
    match_score = models.FloatField()  # Overall match score
    vector_score = models.FloatField()  # Vector similarity score from RAG pipeline
    graph_score = models.FloatField()  # Graph relationship score from RAG pipeline
    availability_score = models.FloatField()  # Developer availability score
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'developer_matches'
        unique_together = ['task', 'developer']
        ordering = ['-match_score']
        
    def __str__(self):
        return f"{self.developer.username} - {self.task.title} (Score: {self.match_score})"


class MatchingPreferences(models.Model):
    """User preferences for matching algorithm"""
    
    EXPERIENCE_LEVELS = [
        ('junior', 'Junior'),
        ('mid', 'Mid-level'),
        ('senior', 'Senior'),
        ('lead', 'Lead'),
        ('principal', 'Principal'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='matching_preferences')
    
    # Budget preferences
    min_budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    max_budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Rate preferences
    min_hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Experience preferences
    min_experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVELS, null=True, blank=True)
    max_experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVELS, null=True, blank=True)
    
    # Skill preferences
    preferred_skills = models.JSONField(default=list, blank=True)
    excluded_skills = models.JSONField(default=list, blank=True)
    
    # Location preferences
    preferred_timezones = models.JSONField(default=list, blank=True)
    remote_only = models.BooleanField(default=False)
    
    # Project type preferences
    preferred_project_types = models.JSONField(default=list, blank=True)
    excluded_project_types = models.JSONField(default=list, blank=True)
    
    # Matching algorithm weights (0.0 to 1.0)
    skill_weight = models.FloatField(default=0.4)
    experience_weight = models.FloatField(default=0.3)
    availability_weight = models.FloatField(default=0.2)
    reputation_weight = models.FloatField(default=0.1)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'matching_preferences'
        
    def __str__(self):
        return f"Matching preferences for {self.user.username}"


class MatchingAnalytics(models.Model):
    """Analytics for matching system performance and usage"""
    
    SEARCH_TYPES = [
        ('developer_search', 'Developer Search'),
        ('project_search', 'Project Search'),
        ('batch_match', 'Batch Match'),
        ('feedback', 'Feedback'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matching_analytics')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, related_name='matching_analytics')
    
    search_type = models.CharField(max_length=20, choices=SEARCH_TYPES)
    match_count = models.IntegerField()
    
    # Performance metrics
    response_time_ms = models.IntegerField(null=True, blank=True)
    cache_hit = models.BooleanField(default=False)
    
    # Search parameters
    search_parameters = models.JSONField(default=dict, blank=True)
    
    # Feedback data
    feedback_data = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    timestamp = models.DateTimeField()
    
    class Meta:
        db_table = 'matching_analytics'
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"{self.search_type} by {self.user.username} at {self.timestamp}"


class MatchingCache(models.Model):
    """Cache for matching results to improve performance"""
    
    cache_key = models.CharField(max_length=255, unique=True)
    cache_data = models.JSONField()
    
    # Cache metadata
    search_type = models.CharField(max_length=20)
    parameters_hash = models.CharField(max_length=64)
    
    # Expiration
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    # Performance tracking
    hit_count = models.IntegerField(default=0)
    last_accessed = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'matching_cache'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Cache: {self.cache_key} (hits: {self.hit_count})"
    
    def is_expired(self):
        """Check if cache entry is expired"""
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    def increment_hit_count(self):
        """Increment hit count and update last accessed"""
        self.hit_count += 1
        self.save(update_fields=['hit_count', 'last_accessed'])
