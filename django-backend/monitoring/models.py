"""
Models for system monitoring and performance metrics.
"""

from django.db import models
from django.utils import timezone
import uuid


class ServiceHealthMetric(models.Model):
    """Track health metrics for different services."""
    
    SERVICE_CHOICES = [
        ('ai_services', 'AI Services'),
        ('matching', 'Matching Service'),
        ('payments', 'Payment Service'),
        ('github_integration', 'GitHub Integration'),
        ('database', 'Database'),
        ('cache', 'Cache Service'),
        ('celery', 'Task Queue'),
    ]
    
    STATUS_CHOICES = [
        ('healthy', 'Healthy'),
        ('degraded', 'Degraded'),
        ('unhealthy', 'Unhealthy'),
        ('unknown', 'Unknown'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service_name = models.CharField(max_length=50, choices=SERVICE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unknown')
    response_time_ms = models.IntegerField(null=True, blank=True)
    error_rate = models.FloatField(default=0.0)  # Percentage
    throughput = models.IntegerField(default=0)  # Requests per minute
    cpu_usage = models.FloatField(null=True, blank=True)  # Percentage
    memory_usage = models.FloatField(null=True, blank=True)  # Percentage
    custom_metrics = models.JSONField(default=dict)
    alerts = models.JSONField(default=list)
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['service_name', '-timestamp']),
            models.Index(fields=['status', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.service_name} - {self.status} at {self.timestamp}"


class TaskQueueMetric(models.Model):
    """Track Celery task queue performance metrics."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    queue_name = models.CharField(max_length=100)
    pending_tasks = models.IntegerField(default=0)
    active_tasks = models.IntegerField(default=0)
    completed_tasks_last_hour = models.IntegerField(default=0)
    failed_tasks_last_hour = models.IntegerField(default=0)
    average_task_duration = models.FloatField(default=0.0)  # Seconds
    worker_count = models.IntegerField(default=0)
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['queue_name', '-timestamp']),
        ]
    
    def __str__(self):
        return f"Queue {self.queue_name} at {self.timestamp}"


class AIServiceMetric(models.Model):
    """Track AI service performance and accuracy metrics."""
    
    SERVICE_CHOICES = [
        ('gemini_api', 'Gemini API'),
        ('embedding_service', 'Embedding Service'),
        ('github_analyzer', 'GitHub Analyzer'),
        ('skill_validator', 'Skill Validator'),
        ('project_analyzer', 'Project Analyzer'),
        ('matching_engine', 'Matching Engine'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service_type = models.CharField(max_length=50, choices=SERVICE_CHOICES)
    requests_count = models.IntegerField(default=0)
    successful_requests = models.IntegerField(default=0)
    failed_requests = models.IntegerField(default=0)
    average_response_time = models.FloatField(default=0.0)  # Seconds
    accuracy_score = models.FloatField(null=True, blank=True)  # 0.0 to 1.0
    confidence_score = models.FloatField(null=True, blank=True)  # 0.0 to 1.0
    api_quota_used = models.IntegerField(default=0)
    api_quota_limit = models.IntegerField(null=True, blank=True)
    error_details = models.JSONField(default=dict)
    performance_metrics = models.JSONField(default=dict)
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['service_type', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.service_type} metrics at {self.timestamp}"
    
    @property
    def success_rate(self):
        """Calculate success rate percentage."""
        if self.requests_count == 0:
            return 0.0
        return (self.successful_requests / self.requests_count) * 100


class SystemAlert(models.Model):
    """System alerts and notifications."""
    
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service_name = models.CharField(max_length=100)
    alert_type = models.CharField(max_length=100)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    title = models.CharField(max_length=200)
    description = models.TextField()
    metric_data = models.JSONField(default=dict)
    threshold_value = models.FloatField(null=True, blank=True)
    actual_value = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['service_name', 'status', '-created_at']),
            models.Index(fields=['severity', 'status', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.severity.upper()}: {self.title}"


class PerformanceBenchmark(models.Model):
    """Store performance benchmarks and SLA targets."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service_name = models.CharField(max_length=100)
    metric_name = models.CharField(max_length=100)
    target_value = models.FloatField()
    warning_threshold = models.FloatField()
    critical_threshold = models.FloatField()
    unit = models.CharField(max_length=50)  # ms, %, count, etc.
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['service_name', 'metric_name']
        indexes = [
            models.Index(fields=['service_name', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.service_name} - {self.metric_name}: {self.target_value} {self.unit}"