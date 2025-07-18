from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()


class FeaturedProject(models.Model):
    """Featured projects in the marketplace for premium visibility"""
    
    FEATURE_TYPES = [
        ('standard', 'Standard Featured'),
        ('premium', 'Premium Featured'),
        ('spotlight', 'Spotlight'),
        ('trending', 'Trending'),
    ]
    
    FEATURE_STATUS = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('paused', 'Paused'),
        ('pending_payment', 'Pending Payment'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        'projects.Project', 
        on_delete=models.CASCADE, 
        related_name='featured_listings'
    )
    
    # Feature details
    feature_type = models.CharField(max_length=20, choices=FEATURE_TYPES, default='standard')
    status = models.CharField(max_length=20, choices=FEATURE_STATUS, default='active')
    
    # Pricing and duration
    price_paid = models.DecimalField(max_digits=10, decimal_places=2)
    feature_start_date = models.DateTimeField()
    feature_end_date = models.DateTimeField()
    
    # Marketplace positioning
    priority_score = models.IntegerField(default=1)  # Higher score = higher visibility
    category_tags = models.JSONField(default=list)  # Categories for filtering
    
    # Performance metrics
    view_count = models.IntegerField(default=0)
    click_count = models.IntegerField(default=0)
    inquiry_count = models.IntegerField(default=0)
    conversion_count = models.IntegerField(default=0)  # Successful hires
    
    # Custom marketing content
    custom_title = models.CharField(max_length=200, blank=True, null=True)
    custom_description = models.TextField(blank=True, null=True)
    marketing_image_url = models.URLField(blank=True, null=True)
    promotional_video_url = models.URLField(blank=True, null=True)
    
    # Targeting settings
    target_developer_skills = models.JSONField(default=list)
    target_experience_levels = models.JSONField(default=list)
    target_locations = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'featured_projects'
        ordering = ['-priority_score', '-feature_start_date']
        
    def __str__(self):
        return f"Featured: {self.project.title} ({self.feature_type})"


class FeaturedDeveloper(models.Model):
    """Featured developers in the marketplace for premium visibility"""
    
    FEATURE_TYPES = [
        ('standard', 'Standard Featured'),
        ('premium', 'Premium Featured'),
        ('expert_spotlight', 'Expert Spotlight'),
        ('rising_talent', 'Rising Talent'),
    ]
    
    FEATURE_STATUS = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('paused', 'Paused'),
        ('pending_payment', 'Pending Payment'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    developer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='featured_listings')
    
    # Feature details
    feature_type = models.CharField(max_length=20, choices=FEATURE_TYPES, default='standard')
    status = models.CharField(max_length=20, choices=FEATURE_STATUS, default='active')
    
    # Pricing and duration
    price_paid = models.DecimalField(max_digits=10, decimal_places=2)
    feature_start_date = models.DateTimeField()
    feature_end_date = models.DateTimeField()
    
    # Marketplace positioning
    priority_score = models.IntegerField(default=1)  # Higher score = higher visibility
    specialization_tags = models.JSONField(default=list)  # Specializations for filtering
    
    # Performance metrics
    profile_views = models.IntegerField(default=0)
    contact_requests = models.IntegerField(default=0)
    project_invitations = models.IntegerField(default=0)
    successful_hires = models.IntegerField(default=0)
    
    # Custom marketing content
    custom_headline = models.CharField(max_length=200, blank=True, null=True)
    custom_bio = models.TextField(blank=True, null=True)
    portfolio_highlight = models.JSONField(default=list)  # Featured portfolio items
    testimonials = models.JSONField(default=list)  # Client testimonials
    
    # Availability and preferences
    available_for_hire = models.BooleanField(default=True)
    preferred_project_types = models.JSONField(default=list)
    minimum_project_budget = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'featured_developers'
        ordering = ['-priority_score', '-feature_start_date']
        
    def __str__(self):
        return f"Featured: {self.developer.username} ({self.feature_type})"


class MarketplaceFilter(models.Model):
    """Saved filters for enhanced marketplace browsing"""
    
    FILTER_TYPES = [
        ('project', 'Project Filter'),
        ('developer', 'Developer Filter'),
        ('mixed', 'Mixed Filter'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_filters')
    
    # Filter details
    name = models.CharField(max_length=100)
    filter_type = models.CharField(max_length=20, choices=FILTER_TYPES)
    description = models.TextField(blank=True, null=True)
    
    # Filter criteria
    skills_filter = models.JSONField(default=list)
    experience_level_filter = models.JSONField(default=list)
    budget_range_min = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    budget_range_max = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    location_filter = models.JSONField(default=list)
    availability_filter = models.JSONField(default=list)
    project_type_filter = models.JSONField(default=list)
    
    # Advanced filters
    rating_minimum = models.FloatField(null=True, blank=True)
    completion_rate_minimum = models.FloatField(null=True, blank=True)
    response_time_maximum = models.IntegerField(null=True, blank=True)  # Hours
    
    # Filter usage
    is_default = models.BooleanField(default=False)
    usage_count = models.IntegerField(default=0)
    last_used = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'marketplace_filters'
        ordering = ['-last_used', '-created_at']
        
    def __str__(self):
        return f"{self.user.username} - {self.name}"


class SearchHistory(models.Model):
    """Track user search history for personalization and analytics"""
    
    SEARCH_TYPES = [
        ('project', 'Project Search'),
        ('developer', 'Developer Search'),
        ('skill', 'Skill Search'),
        ('general', 'General Search'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='search_history')
    
    # Search details
    search_query = models.CharField(max_length=500)
    search_type = models.CharField(max_length=20, choices=SEARCH_TYPES)
    filters_applied = models.JSONField(default=dict)  # Applied filters
    
    # Search results
    results_count = models.IntegerField(default=0)
    clicked_results = models.JSONField(default=list)  # IDs of clicked results
    
    # Search context
    page_source = models.CharField(max_length=100, blank=True, null=True)  # Where search originated
    session_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Analytics data
    search_duration = models.IntegerField(null=True, blank=True)  # Time spent on search (seconds)
    result_interaction = models.BooleanField(default=False)  # Did user interact with results
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'search_history'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'search_type']),
            models.Index(fields=['search_query']),
        ]
        
    def __str__(self):
        return f"{self.user.username} - {self.search_query[:50]}"


class PremiumAccess(models.Model):
    """Premium access subscriptions for enhanced marketplace features"""
    
    SUBSCRIPTION_TYPES = [
        ('basic', 'Basic Premium'),
        ('professional', 'Professional'),
        ('enterprise', 'Enterprise'),
        ('featured_developer', 'Featured Developer'),
        ('featured_client', 'Featured Client'),
    ]
    
    SUBSCRIPTION_STATUS = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
        ('suspended', 'Suspended'),
        ('pending_payment', 'Pending Payment'),
    ]
    
    BILLING_CYCLES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
        ('one_time', 'One Time'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='premium_subscriptions')
    
    # Subscription details
    subscription_type = models.CharField(max_length=30, choices=SUBSCRIPTION_TYPES)
    status = models.CharField(max_length=20, choices=SUBSCRIPTION_STATUS, default='active')
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CYCLES, default='monthly')
    
    # Pricing and billing
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2)
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    next_billing_date = models.DateTimeField(null=True, blank=True)
    
    # Features and limits
    features_included = models.JSONField(default=list)  # List of included features
    usage_limits = models.JSONField(default=dict)  # Usage limits and quotas
    current_usage = models.JSONField(default=dict)  # Current usage tracking
    
    # Payment information
    payment_method_id = models.CharField(max_length=100, blank=True, null=True)
    last_payment_date = models.DateTimeField(null=True, blank=True)
    last_payment_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    
    # Subscription management
    auto_renew = models.BooleanField(default=True)
    cancellation_date = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True, null=True)
    
    # Trial information
    is_trial = models.BooleanField(default=False)
    trial_end_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'premium_access'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.username} - {self.subscription_type} ({self.status})"


class MarketplaceAnalytics(models.Model):
    """Analytics data for marketplace performance tracking"""
    
    METRIC_TYPES = [
        ('project_view', 'Project View'),
        ('developer_view', 'Developer Profile View'),
        ('search_performed', 'Search Performed'),
        ('filter_applied', 'Filter Applied'),
        ('contact_initiated', 'Contact Initiated'),
        ('hire_completed', 'Hire Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Metric details
    metric_type = models.CharField(max_length=30, choices=METRIC_TYPES)
    metric_value = models.FloatField(default=1.0)
    
    # Related objects
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    project = models.ForeignKey(
        'projects.Project', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL
    )
    featured_project = models.ForeignKey(
        FeaturedProject, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL
    )
    featured_developer = models.ForeignKey(
        FeaturedDeveloper, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL
    )
    
    # Context data
    session_id = models.CharField(max_length=100, blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    referrer_url = models.URLField(blank=True, null=True)
    
    # Additional metadata
    metadata = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'marketplace_analytics'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['metric_type', 'created_at']),
            models.Index(fields=['user', 'metric_type']),
        ]
        
    def __str__(self):
        return f"{self.metric_type} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
