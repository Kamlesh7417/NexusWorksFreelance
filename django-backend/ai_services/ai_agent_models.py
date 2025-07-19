from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.postgres.fields import ArrayField
import uuid

User = get_user_model()


class AIAgent(models.Model):
    """AI Agent profile extending the existing user model"""
    
    AGENT_TYPES = [
        ('code_generator', 'Code Generator'),
        ('code_reviewer', 'Code Reviewer'),
        ('documentation', 'Documentation Specialist'),
        ('testing', 'Testing Specialist'),
        ('full_stack', 'Full Stack Developer'),
        ('data_analyst', 'Data Analyst'),
        ('devops', 'DevOps Specialist'),
        ('ui_ux', 'UI/UX Designer'),
    ]
    
    AUTHENTICATION_METHODS = [
        ('api_key', 'API Key'),
        ('oauth', 'OAuth 2.0'),
        ('jwt', 'JWT Token'),
        ('webhook', 'Webhook'),
    ]
    
    AVAILABILITY_STATUS = [
        ('available', 'Available'),
        ('busy', 'Busy'),
        ('maintenance', 'Under Maintenance'),
        ('offline', 'Offline'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='ai_agent_profile'
    )
    
    # Basic agent information
    agent_type = models.CharField(max_length=50, choices=AGENT_TYPES)
    agent_name = models.CharField(max_length=200, help_text="Display name for the AI agent")
    agent_description = models.TextField(help_text="Description of agent capabilities")
    
    # API and integration details
    api_endpoint = models.URLField(
        max_length=500, 
        null=True, 
        blank=True,
        help_text="Primary API endpoint for agent communication"
    )
    authentication_method = models.CharField(
        max_length=20, 
        choices=AUTHENTICATION_METHODS,
        default='api_key'
    )
    api_key_hash = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        help_text="Hashed API key for secure storage"
    )
    webhook_url = models.URLField(
        max_length=500, 
        null=True, 
        blank=True,
        help_text="Webhook URL for receiving notifications"
    )
    
    # Availability and SLA
    always_available = models.BooleanField(
        default=True,
        help_text="Whether agent is available 24/7"
    )
    response_time_sla = models.IntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(1440)],
        help_text="Response time SLA in minutes"
    )
    max_concurrent_projects = models.IntegerField(
        default=10,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="Maximum number of concurrent projects"
    )
    current_availability_status = models.CharField(
        max_length=20,
        choices=AVAILABILITY_STATUS,
        default='available'
    )
    
    # Automation and capability settings
    automation_level = models.IntegerField(
        default=80,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Automation level percentage (0-100)"
    )
    requires_human_oversight = models.BooleanField(
        default=False,
        help_text="Whether agent requires human oversight for all tasks"
    )
    
    # Quality and performance metrics
    success_rate = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="Success rate percentage"
    )
    average_quality_score = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
        help_text="Average quality score (0-5)"
    )
    client_satisfaction_rate = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="Client satisfaction rate percentage"
    )
    completion_time_accuracy = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="Completion time accuracy percentage"
    )
    
    # Verification and certification
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether agent has been verified by platform"
    )
    is_certified = models.BooleanField(
        default=False,
        help_text="Whether agent has platform certification"
    )
    verification_date = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Date when agent was verified"
    )
    certification_level = models.CharField(
        max_length=20,
        choices=[
            ('basic', 'Basic'),
            ('intermediate', 'Intermediate'),
            ('advanced', 'Advanced'),
            ('expert', 'Expert'),
        ],
        null=True,
        blank=True
    )
    
    # Status and lifecycle
    is_active = models.BooleanField(
        default=True,
        help_text="Whether agent is active on the platform"
    )
    is_suspended = models.BooleanField(
        default=False,
        help_text="Whether agent is temporarily suspended"
    )
    suspension_reason = models.TextField(
        null=True, 
        blank=True,
        help_text="Reason for suspension if applicable"
    )
    last_health_check = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Last successful health check"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_activity = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Last activity timestamp"
    )
    
    class Meta:
        db_table = 'ai_agents'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['agent_type']),
            models.Index(fields=['is_active', 'is_suspended']),
            models.Index(fields=['current_availability_status']),
            models.Index(fields=['is_verified', 'is_certified']),
            models.Index(fields=['success_rate']),
            models.Index(fields=['last_activity']),
        ]
        
    def __str__(self):
        return f"{self.agent_name} ({self.get_agent_type_display()})"
    
    @property
    def is_available_for_work(self):
        """Check if agent is available for new work"""
        return (
            self.is_active and 
            not self.is_suspended and 
            self.current_availability_status == 'available'
        )
    
    def clean(self):
        """Validate AI agent data"""
        from django.core.exceptions import ValidationError
        
        # Validate response time SLA
        if self.response_time_sla <= 0:
            raise ValidationError({'response_time_sla': 'Response time SLA must be positive'})
        
        # Validate automation level
        if not (0 <= self.automation_level <= 100):
            raise ValidationError({'automation_level': 'Automation level must be between 0 and 100'})
        
        # Validate quality metrics
        if not (0 <= self.success_rate <= 100):
            raise ValidationError({'success_rate': 'Success rate must be between 0 and 100'})
        
        if not (0 <= self.average_quality_score <= 5):
            raise ValidationError({'average_quality_score': 'Quality score must be between 0 and 5'})
        
        # Validate API endpoint if provided
        if self.api_endpoint and not self.api_endpoint.startswith(('http://', 'https://')):
            raise ValidationError({'api_endpoint': 'API endpoint must be a valid URL'})
        
        # Validate authentication method requirements
        if self.authentication_method == 'api_key' and not self.api_key_hash:
            raise ValidationError({'api_key_hash': 'API key hash is required for API key authentication'})
        
        if self.authentication_method == 'webhook' and not self.webhook_url:
            raise ValidationError({'webhook_url': 'Webhook URL is required for webhook authentication'})
    
    def save(self, *args, **kwargs):
        """Override save to run validation"""
        self.full_clean()
        super().save(*args, **kwargs)


class AgentCapability(models.Model):
    """Specific capabilities and skills of AI agents"""
    
    CAPABILITY_CATEGORIES = [
        ('programming_language', 'Programming Language'),
        ('framework', 'Framework'),
        ('database', 'Database'),
        ('cloud_platform', 'Cloud Platform'),
        ('tool', 'Development Tool'),
        ('methodology', 'Development Methodology'),
        ('domain_knowledge', 'Domain Knowledge'),
        ('soft_skill', 'Soft Skill'),
    ]
    
    PROFICIENCY_LEVELS = [
        ('basic', 'Basic'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(
        AIAgent, 
        on_delete=models.CASCADE, 
        related_name='capabilities'
    )
    
    # Capability details
    category = models.CharField(max_length=50, choices=CAPABILITY_CATEGORIES)
    skill_name = models.CharField(max_length=100)
    proficiency_level = models.CharField(max_length=20, choices=PROFICIENCY_LEVELS)
    
    # Verification and confidence
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether capability has been verified through testing"
    )
    confidence_score = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="AI confidence in this capability (0.0 to 1.0)"
    )
    verification_date = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Date when capability was verified"
    )
    
    # Performance metrics for this capability
    success_rate = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="Success rate for tasks using this capability"
    )
    average_completion_time = models.DurationField(
        null=True, 
        blank=True,
        help_text="Average time to complete tasks with this capability"
    )
    
    # Evidence and documentation
    evidence_data = models.JSONField(
        default=dict,
        help_text="Evidence supporting this capability (test results, examples, etc.)"
    )
    documentation_url = models.URLField(
        max_length=500, 
        null=True, 
        blank=True,
        help_text="URL to capability documentation or examples"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Last time this capability was used in a project"
    )
    
    class Meta:
        db_table = 'agent_capabilities'
        unique_together = ['agent', 'category', 'skill_name']
        indexes = [
            models.Index(fields=['agent', 'category']),
            models.Index(fields=['skill_name', 'proficiency_level']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['confidence_score']),
            models.Index(fields=['success_rate']),
        ]
        
    def __str__(self):
        return f"{self.agent.agent_name} - {self.skill_name} ({self.proficiency_level})"
    
    def clean(self):
        """Validate agent capability data"""
        from django.core.exceptions import ValidationError
        
        # Validate confidence score
        if not (0.0 <= self.confidence_score <= 1.0):
            raise ValidationError({'confidence_score': 'Confidence score must be between 0.0 and 1.0'})
        
        # Validate success rate
        if not (0.0 <= self.success_rate <= 100.0):
            raise ValidationError({'success_rate': 'Success rate must be between 0.0 and 100.0'})
        
        # Validate skill name is not empty
        if not self.skill_name.strip():
            raise ValidationError({'skill_name': 'Skill name cannot be empty'})
        
        # Validate documentation URL if provided
        if self.documentation_url and not self.documentation_url.startswith(('http://', 'https://')):
            raise ValidationError({'documentation_url': 'Documentation URL must be a valid URL'})
    
    def save(self, *args, **kwargs):
        """Override save to run validation"""
        self.full_clean()
        super().save(*args, **kwargs)


class AgentWorkPreference(models.Model):
    """Work preferences and constraints for AI agents"""
    
    PROJECT_TYPES = [
        ('web_development', 'Web Development'),
        ('mobile_development', 'Mobile Development'),
        ('data_analysis', 'Data Analysis'),
        ('machine_learning', 'Machine Learning'),
        ('devops', 'DevOps'),
        ('testing', 'Testing'),
        ('documentation', 'Documentation'),
        ('code_review', 'Code Review'),
        ('api_development', 'API Development'),
        ('database_design', 'Database Design'),
    ]
    
    COMPLEXITY_LEVELS = [
        ('simple', 'Simple'),
        ('moderate', 'Moderate'),
        ('complex', 'Complex'),
        ('expert', 'Expert Level'),
    ]
    
    COLLABORATION_MODES = [
        ('fully_autonomous', 'Fully Autonomous'),
        ('human_supervised', 'Human Supervised'),
        ('collaborative', 'Collaborative'),
        ('human_assisted', 'Human Assisted'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.OneToOneField(
        AIAgent, 
        on_delete=models.CASCADE, 
        related_name='work_preferences'
    )
    
    # Project type preferences
    preferred_project_types = ArrayField(
        models.CharField(max_length=50, choices=PROJECT_TYPES),
        default=list,
        help_text="Types of projects the agent prefers"
    )
    excluded_project_types = ArrayField(
        models.CharField(max_length=50, choices=PROJECT_TYPES),
        default=list,
        help_text="Types of projects the agent cannot or will not handle"
    )
    
    # Complexity preferences
    min_complexity_level = models.CharField(
        max_length=20, 
        choices=COMPLEXITY_LEVELS,
        default='simple'
    )
    max_complexity_level = models.CharField(
        max_length=20, 
        choices=COMPLEXITY_LEVELS,
        default='complex'
    )
    
    # Collaboration preferences
    preferred_collaboration_mode = models.CharField(
        max_length=30,
        choices=COLLABORATION_MODES,
        default='fully_autonomous'
    )
    requires_human_review = models.BooleanField(
        default=False,
        help_text="Whether agent requires human review for all deliverables"
    )
    
    # Timeline preferences
    min_project_duration = models.DurationField(
        null=True, 
        blank=True,
        help_text="Minimum project duration agent will accept"
    )
    max_project_duration = models.DurationField(
        null=True, 
        blank=True,
        help_text="Maximum project duration agent can handle"
    )
    
    # Budget preferences
    min_hourly_rate = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True, 
        blank=True,
        help_text="Minimum acceptable hourly rate"
    )
    max_hourly_rate = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True, 
        blank=True,
        help_text="Maximum hourly rate agent charges"
    )
    
    # Working conditions
    requires_api_access = models.BooleanField(
        default=True,
        help_text="Whether agent requires API access to external services"
    )
    requires_sandbox_environment = models.BooleanField(
        default=True,
        help_text="Whether agent requires sandboxed execution environment"
    )
    allowed_external_apis = ArrayField(
        models.CharField(max_length=200),
        default=list,
        help_text="List of external APIs agent is allowed to use"
    )
    
    # Communication preferences
    preferred_communication_format = models.CharField(
        max_length=20,
        choices=[
            ('json', 'JSON'),
            ('xml', 'XML'),
            ('yaml', 'YAML'),
            ('plain_text', 'Plain Text'),
        ],
        default='json'
    )
    supports_real_time_communication = models.BooleanField(
        default=True,
        help_text="Whether agent supports real-time communication"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'agent_work_preferences'
        indexes = [
            models.Index(fields=['agent']),
            models.Index(fields=['preferred_collaboration_mode']),
            models.Index(fields=['min_complexity_level', 'max_complexity_level']),
        ]
        
    def __str__(self):
        return f"Work Preferences for {self.agent.agent_name}"
    
    def clean(self):
        """Validate agent work preference data"""
        from django.core.exceptions import ValidationError
        
        # Validate complexity level consistency
        complexity_order = ['simple', 'moderate', 'complex', 'expert']
        min_index = complexity_order.index(self.min_complexity_level)
        max_index = complexity_order.index(self.max_complexity_level)
        
        if min_index > max_index:
            raise ValidationError({
                'max_complexity_level': 'Maximum complexity level must be greater than or equal to minimum'
            })
        
        # Validate hourly rate consistency
        if self.min_hourly_rate and self.max_hourly_rate:
            if self.min_hourly_rate > self.max_hourly_rate:
                raise ValidationError({
                    'max_hourly_rate': 'Maximum hourly rate must be greater than or equal to minimum'
                })
        
        # Validate project duration consistency
        if self.min_project_duration and self.max_project_duration:
            if self.min_project_duration > self.max_project_duration:
                raise ValidationError({
                    'max_project_duration': 'Maximum project duration must be greater than or equal to minimum'
                })
        
        # Validate that preferred and excluded project types don't overlap
        preferred_set = set(self.preferred_project_types)
        excluded_set = set(self.excluded_project_types)
        overlap = preferred_set.intersection(excluded_set)
        
        if overlap:
            raise ValidationError({
                'excluded_project_types': f'Project types cannot be both preferred and excluded: {", ".join(overlap)}'
            })
    
    def save(self, *args, **kwargs):
        """Override save to run validation"""
        self.full_clean()
        super().save(*args, **kwargs)


class AgentPerformanceMetric(models.Model):
    """Track detailed performance metrics for AI agents"""
    
    METRIC_TYPES = [
        ('project_completion', 'Project Completion'),
        ('quality_score', 'Quality Score'),
        ('response_time', 'Response Time'),
        ('client_satisfaction', 'Client Satisfaction'),
        ('error_rate', 'Error Rate'),
        ('uptime', 'Uptime'),
        ('throughput', 'Throughput'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(
        AIAgent, 
        on_delete=models.CASCADE, 
        related_name='performance_metrics'
    )
    
    # Metric details
    metric_type = models.CharField(max_length=30, choices=METRIC_TYPES)
    metric_value = models.FloatField()
    metric_unit = models.CharField(
        max_length=20,
        choices=[
            ('percentage', 'Percentage'),
            ('seconds', 'Seconds'),
            ('minutes', 'Minutes'),
            ('hours', 'Hours'),
            ('count', 'Count'),
            ('score', 'Score'),
        ]
    )
    
    # Context and period
    measurement_period_start = models.DateTimeField()
    measurement_period_end = models.DateTimeField()
    project_context = models.ForeignKey(
        'projects.Project',
        null=True, 
        blank=True,
        on_delete=models.CASCADE,
        help_text="Specific project this metric relates to"
    )
    
    # Additional data
    metadata = models.JSONField(
        default=dict,
        help_text="Additional metric data and context"
    )
    
    # Timestamps
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'agent_performance_metrics'
        indexes = [
            models.Index(fields=['agent', 'metric_type']),
            models.Index(fields=['measurement_period_start', 'measurement_period_end']),
            models.Index(fields=['project_context']),
            models.Index(fields=['recorded_at']),
        ]
        
    def __str__(self):
        return f"{self.agent.agent_name} - {self.metric_type}: {self.metric_value} {self.metric_unit}"


class AgentAuditLog(models.Model):
    """Audit log for all AI agent actions and decisions"""
    
    ACTION_TYPES = [
        ('project_assigned', 'Project Assigned'),
        ('proposal_submitted', 'Proposal Submitted'),
        ('work_started', 'Work Started'),
        ('deliverable_submitted', 'Deliverable Submitted'),
        ('communication_sent', 'Communication Sent'),
        ('status_updated', 'Status Updated'),
        ('error_occurred', 'Error Occurred'),
        ('escalation_triggered', 'Escalation Triggered'),
        ('configuration_changed', 'Configuration Changed'),
        ('capability_updated', 'Capability Updated'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(
        AIAgent, 
        on_delete=models.CASCADE, 
        related_name='audit_logs'
    )
    
    # Action details
    action_type = models.CharField(max_length=30, choices=ACTION_TYPES)
    action_description = models.TextField()
    
    # Context
    project_context = models.ForeignKey(
        'projects.Project',
        null=True, 
        blank=True,
        on_delete=models.CASCADE,
        help_text="Project context for this action"
    )
    user_context = models.ForeignKey(
        User,
        null=True, 
        blank=True,
        on_delete=models.CASCADE,
        help_text="User involved in this action"
    )
    
    # Action data
    action_data = models.JSONField(
        default=dict,
        help_text="Detailed data about the action"
    )
    request_data = models.JSONField(
        default=dict,
        help_text="Request data that triggered this action"
    )
    response_data = models.JSONField(
        default=dict,
        help_text="Response data from this action"
    )
    
    # Status and outcome
    was_successful = models.BooleanField(default=True)
    error_message = models.TextField(null=True, blank=True)
    execution_time_ms = models.IntegerField(
        null=True, 
        blank=True,
        help_text="Execution time in milliseconds"
    )
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'agent_audit_logs'
        indexes = [
            models.Index(fields=['agent', 'timestamp']),
            models.Index(fields=['action_type', 'timestamp']),
            models.Index(fields=['project_context', 'timestamp']),
            models.Index(fields=['was_successful']),
            models.Index(fields=['timestamp']),
        ]
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"{self.agent.agent_name} - {self.action_type} at {self.timestamp}"