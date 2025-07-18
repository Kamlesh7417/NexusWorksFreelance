from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Project(models.Model):
    """AI-powered project model"""
    
    STATUS_CHOICES = [
        ('analyzing', 'Analyzing'),
        ('proposal_review', 'Proposal Review'),
        ('team_assembly', 'Team Assembly'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('disputed', 'Disputed'),
    ]
    
    EXPERIENCE_LEVELS = [
        ('junior', 'Junior'),
        ('mid', 'Mid-level'),
        ('senior', 'Senior'),
        ('expert', 'Expert'),
    ]
    
    # Use UUID as primary key as specified in design
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic project information
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='client_projects')
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # AI analysis results as specified in design
    ai_analysis = models.JSONField(default=dict)  # Complete AI analysis results
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='analyzing')
    budget_estimate = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    timeline_estimate = models.DurationField(null=True, blank=True)
    
    # Senior developer assignment as specified in design
    senior_developer = models.ForeignKey(
        User, 
        null=True, 
        blank=True,
        on_delete=models.SET_NULL, 
        related_name='senior_projects'
    )
    
    # Requirements
    required_skills = models.JSONField(default=list)  # List of skill names
    experience_level_required = models.CharField(
        max_length=20, 
        choices=EXPERIENCE_LEVELS, 
        default='mid'
    )
    
    # Project files and attachments
    attachments = models.JSONField(default=list)  # List of file URLs
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.title} - {self.client.username}"


class Task(models.Model):
    """AI-generated tasks for projects"""
    
    TASK_STATUS = [
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('qa_review', 'QA Review'),
        ('client_review', 'Client Review'),
        ('approved', 'Approved'),
        ('completed', 'Completed'),
        ('disputed', 'Disputed'),
    ]
    
    # Use UUID as primary key as specified in design
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField()
    required_skills = models.JSONField(default=list)  # List of skill names
    estimated_hours = models.IntegerField()
    priority = models.IntegerField(default=1)
    dependencies = models.ManyToManyField('self', blank=True, symmetrical=False)
    assigned_developer = models.ForeignKey(
        User, 
        null=True, 
        blank=True,
        on_delete=models.SET_NULL, 
        related_name='assigned_tasks'
    )
    status = models.CharField(max_length=20, choices=TASK_STATUS, default='pending')
    completion_percentage = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tasks'
        ordering = ['project', 'priority']
        
    def __str__(self):
        return f"{self.project.title} - {self.title}"





class ProjectProposal(models.Model):
    """AI-generated project proposal that can be modified by senior developers"""
    
    PROPOSAL_STATUS = [
        ('draft', 'Draft'),
        ('senior_review', 'Senior Developer Review'),
        ('client_review', 'Client Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('locked', 'Locked'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='proposal')
    
    # Original AI-generated proposal
    original_budget = models.DecimalField(max_digits=12, decimal_places=2)
    original_timeline = models.DurationField()
    original_task_breakdown = models.JSONField(default=dict)
    original_sla_terms = models.JSONField(default=dict)
    
    # Current proposal (after senior developer modifications)
    current_budget = models.DecimalField(max_digits=12, decimal_places=2)
    current_timeline = models.DurationField()
    current_task_breakdown = models.JSONField(default=dict)
    current_sla_terms = models.JSONField(default=dict)
    
    # Approval tracking
    status = models.CharField(max_length=20, choices=PROPOSAL_STATUS, default='draft')
    senior_developer_approved = models.BooleanField(default=False)
    senior_developer_approved_at = models.DateTimeField(null=True, blank=True)
    client_approved = models.BooleanField(default=False)
    client_approved_at = models.DateTimeField(null=True, blank=True)
    
    # Locking mechanism
    is_locked = models.BooleanField(default=False)
    locked_at = models.DateTimeField(null=True, blank=True)
    locked_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='locked_proposals')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'project_proposals'
        
    def __str__(self):
        return f"Proposal for {self.project.title}"


class ProposalModification(models.Model):
    """Track all modifications made to project proposals"""
    
    MODIFICATION_TYPES = [
        ('budget_change', 'Budget Change'),
        ('timeline_change', 'Timeline Change'),
        ('task_modification', 'Task Modification'),
        ('sla_change', 'SLA Change'),
        ('scope_change', 'Scope Change'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposal = models.ForeignKey(ProjectProposal, on_delete=models.CASCADE, related_name='modifications')
    modified_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='proposal_modifications')
    
    modification_type = models.CharField(max_length=20, choices=MODIFICATION_TYPES)
    field_name = models.CharField(max_length=100)  # Field that was modified
    old_value = models.JSONField()  # Previous value
    new_value = models.JSONField()  # New value
    justification = models.TextField()  # Required justification for the change
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'proposal_modifications'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.modification_type} by {self.modified_by.username} on {self.proposal.project.title}"


class SeniorDeveloperAssignment(models.Model):
    """Track senior developer assignments and their qualifications"""
    
    ASSIGNMENT_STATUS = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='senior_assignment')
    senior_developer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='senior_assignments')
    
    # Assignment criteria and scoring
    experience_score = models.FloatField()  # Score based on experience level
    reputation_score = models.FloatField()  # Score based on reputation
    skill_match_score = models.FloatField()  # Score based on skill matching
    leadership_score = models.FloatField()  # Score based on leadership experience
    total_score = models.FloatField()  # Combined score
    
    # Assignment details
    status = models.CharField(max_length=20, choices=ASSIGNMENT_STATUS, default='pending')
    assigned_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    declined_at = models.DateTimeField(null=True, blank=True)
    decline_reason = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'senior_developer_assignments'
        
    def __str__(self):
        return f"Senior assignment: {self.senior_developer.username} -> {self.project.title}"


class ProjectReview(models.Model):
    """Reviews and ratings for completed projects"""
    
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='review')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_reviews')
    reviewee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reviews')
    
    # Rating (1-5 stars)
    overall_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    communication_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    quality_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    timeliness_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    
    # Written review
    review_text = models.TextField()
    
    # Flags
    is_public = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'project_reviews'
        
    def __str__(self):
        return f"Review for {self.project.title} by {self.reviewer.username}"


class TeamInvitation(models.Model):
    """Team member invitations for dynamic hiring"""
    
    INVITATION_STATUS = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='team_invitations')
    developer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='team_invitations')
    
    # Invitation details
    match_score = models.FloatField()  # AI matching score
    offered_rate = models.DecimalField(max_digits=10, decimal_places=2)  # Dynamic pricing
    estimated_hours = models.IntegerField()
    estimated_completion_date = models.DateTimeField()
    
    # Status and responses
    status = models.CharField(max_length=20, choices=INVITATION_STATUS, default='pending')
    invited_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    
    # Response details
    decline_reason = models.TextField(null=True, blank=True)
    counter_offer_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Invitation metadata
    invitation_rank = models.IntegerField()  # Rank in invitation order (1st choice, 2nd choice, etc.)
    is_fallback = models.BooleanField(default=False)  # True if this is a fallback invitation
    
    class Meta:
        db_table = 'team_invitations'
        unique_together = ['task', 'developer']
        ordering = ['task', 'invitation_rank']
        
    def __str__(self):
        return f"Invitation to {self.developer.username} for {self.task.title}"


class TaskAssignment(models.Model):
    """Active task assignments with timeline and resource tracking"""
    
    ASSIGNMENT_STATUS = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('qa_review', 'QA Review'),
        ('client_review', 'Client Review'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.OneToOneField(Task, on_delete=models.CASCADE, related_name='assignment')
    developer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_assignments')
    invitation = models.OneToOneField(TeamInvitation, on_delete=models.CASCADE, related_name='assignment')
    
    # Assignment terms
    agreed_rate = models.DecimalField(max_digits=10, decimal_places=2)
    agreed_hours = models.IntegerField()
    start_date = models.DateTimeField()
    expected_completion_date = models.DateTimeField()
    
    # Progress tracking
    status = models.CharField(max_length=20, choices=ASSIGNMENT_STATUS, default='active')
    hours_logged = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    progress_percentage = models.IntegerField(default=0)
    
    # Timeline management
    actual_start_date = models.DateTimeField(null=True, blank=True)
    actual_completion_date = models.DateTimeField(null=True, blank=True)
    last_activity_date = models.DateTimeField(auto_now=True)
    
    # Resource allocation
    allocated_budget = models.DecimalField(max_digits=12, decimal_places=2)
    spent_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'task_assignments'
        
    def __str__(self):
        return f"Assignment: {self.developer.username} -> {self.task.title}"


class DynamicPricing(models.Model):
    """Dynamic pricing calculations for tasks"""
    
    COMPLEXITY_LEVELS = [
        ('simple', 'Simple'),
        ('moderate', 'Moderate'),
        ('complex', 'Complex'),
        ('expert', 'Expert'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.OneToOneField(Task, on_delete=models.CASCADE, related_name='pricing')
    
    # Base pricing factors
    base_rate = models.DecimalField(max_digits=10, decimal_places=2)
    complexity_level = models.CharField(max_length=20, choices=COMPLEXITY_LEVELS)
    complexity_multiplier = models.FloatField(default=1.0)
    
    # Skill-based adjustments
    skill_premium = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rare_skills_bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Market adjustments
    demand_multiplier = models.FloatField(default=1.0)  # Based on developer availability
    urgency_multiplier = models.FloatField(default=1.0)  # Based on timeline requirements
    
    # Final pricing
    calculated_rate = models.DecimalField(max_digits=10, decimal_places=2)
    min_rate = models.DecimalField(max_digits=10, decimal_places=2)
    max_rate = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Calculation metadata
    calculation_factors = models.JSONField(default=dict)  # Store all factors used
    calculated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'dynamic_pricing'
        
    def __str__(self):
        return f"Pricing for {self.task.title}: ${self.calculated_rate}/hr"


class ResourceAllocation(models.Model):
    """Resource allocation and timeline management for projects"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='resource_allocation')
    
    # Team composition
    total_team_members = models.IntegerField(default=0)
    active_assignments = models.IntegerField(default=0)
    pending_invitations = models.IntegerField(default=0)
    
    # Budget allocation
    total_budget = models.DecimalField(max_digits=12, decimal_places=2)
    allocated_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Timeline management
    planned_start_date = models.DateTimeField()
    planned_end_date = models.DateTimeField()
    current_projected_end_date = models.DateTimeField()
    
    # Progress tracking
    overall_progress_percentage = models.IntegerField(default=0)
    tasks_completed = models.IntegerField(default=0)
    tasks_in_progress = models.IntegerField(default=0)
    tasks_pending = models.IntegerField(default=0)
    
    # Resource utilization
    average_team_utilization = models.FloatField(default=0.0)  # 0.0 to 1.0
    critical_path_tasks = models.JSONField(default=list)  # Task IDs on critical path
    
    # Risk factors
    budget_risk_level = models.CharField(max_length=20, default='low')  # low, medium, high
    timeline_risk_level = models.CharField(max_length=20, default='low')
    resource_risk_level = models.CharField(max_length=20, default='low')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'resource_allocations'
        
    def __str__(self):
        return f"Resource allocation for {self.project.title}"
