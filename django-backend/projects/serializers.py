from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Project, Task, ProjectReview, ProjectProposal, 
    ProposalModification, SeniorDeveloperAssignment,
    TeamInvitation, TaskAssignment, DynamicPricing, ResourceAllocation
)
from payments.serializers import MilestoneSerializer, PaymentSerializer

User = get_user_model()


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for the AI-powered Project model"""
    
    client_details = serializers.SerializerMethodField()
    senior_developer_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'client', 'client_details', 'title', 'description',
            'ai_analysis', 'status', 'budget_estimate', 'timeline_estimate',
            'senior_developer', 'senior_developer_details',
            'required_skills', 'experience_level_required', 'attachments',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'client', 'ai_analysis', 'budget_estimate', 'timeline_estimate',
            'senior_developer', 'created_at', 'updated_at'
        ]
    
    def get_client_details(self, obj):
        """Get basic client information"""
        if obj.client:
            return {
                'id': obj.client.id,
                'username': obj.client.username,
                'first_name': obj.client.first_name,
                'last_name': obj.client.last_name,
            }
        return None
    
    def get_senior_developer_details(self, obj):
        """Get basic senior developer information"""
        if obj.senior_developer:
            return {
                'id': obj.senior_developer.id,
                'username': obj.senior_developer.username,
                'first_name': obj.senior_developer.first_name,
                'last_name': obj.senior_developer.last_name,
            }
        return None


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for the AI-generated Task model"""
    
    assigned_developer_details = serializers.SerializerMethodField()
    project_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'project', 'project_details', 'title', 'description',
            'required_skills', 'estimated_hours', 'priority', 'dependencies',
            'assigned_developer', 'assigned_developer_details', 'status',
            'completion_percentage', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'assigned_developer', 'created_at', 'updated_at'
        ]
    
    def get_assigned_developer_details(self, obj):
        """Get basic assigned developer information"""
        if obj.assigned_developer:
            return {
                'id': obj.assigned_developer.id,
                'username': obj.assigned_developer.username,
                'first_name': obj.assigned_developer.first_name,
                'last_name': obj.assigned_developer.last_name,
            }
        return None
    
    def get_project_details(self, obj):
        """Get basic project information"""
        if obj.project:
            return {
                'id': obj.project.id,
                'title': obj.project.title,
                'status': obj.project.status,
            }
        return None


# MilestoneSerializer and PaymentSerializer are imported from payments.serializers


class ProjectReviewSerializer(serializers.ModelSerializer):
    """Serializer for the ProjectReview model"""
    
    reviewer_details = serializers.SerializerMethodField()
    reviewee_details = serializers.SerializerMethodField()
    project_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectReview
        fields = [
            'id', 'project', 'project_details', 'reviewer', 'reviewer_details',
            'reviewee', 'reviewee_details', 'overall_rating', 'communication_rating',
            'quality_rating', 'timeliness_rating', 'review_text',
            'is_public', 'is_featured', 'created_at'
        ]
        read_only_fields = [
            'id', 'reviewer', 'created_at'
        ]
    
    def get_reviewer_details(self, obj):
        """Get basic reviewer information"""
        if obj.reviewer:
            return {
                'id': obj.reviewer.id,
                'username': obj.reviewer.username,
                'first_name': obj.reviewer.first_name,
                'last_name': obj.reviewer.last_name,
            }
        return None
    
    def get_reviewee_details(self, obj):
        """Get basic reviewee information"""
        if obj.reviewee:
            return {
                'id': obj.reviewee.id,
                'username': obj.reviewee.username,
                'first_name': obj.reviewee.first_name,
                'last_name': obj.reviewee.last_name,
                'overall_rating': obj.reviewee.overall_rating,
            }
        return None
    
    def get_project_details(self, obj):
        """Get basic project information"""
        if obj.project:
            return {
                'id': obj.project.id,
                'title': obj.project.title,
                'status': obj.project.status,
            }
        return None


class ProjectProposalSerializer(serializers.ModelSerializer):
    """Serializer for the ProjectProposal model"""
    
    project_details = serializers.SerializerMethodField()
    modifications_count = serializers.SerializerMethodField()
    locked_by_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectProposal
        fields = [
            'id', 'project', 'project_details', 'original_budget', 'original_timeline',
            'original_task_breakdown', 'original_sla_terms', 'current_budget',
            'current_timeline', 'current_task_breakdown', 'current_sla_terms',
            'status', 'senior_developer_approved', 'senior_developer_approved_at',
            'client_approved', 'client_approved_at', 'is_locked', 'locked_at',
            'locked_by', 'locked_by_details', 'modifications_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'project', 'original_budget', 'original_timeline',
            'original_task_breakdown', 'original_sla_terms', 'status',
            'senior_developer_approved', 'senior_developer_approved_at',
            'client_approved', 'client_approved_at', 'is_locked', 'locked_at',
            'locked_by', 'created_at', 'updated_at'
        ]
    
    def get_project_details(self, obj):
        """Get basic project information"""
        if obj.project:
            return {
                'id': obj.project.id,
                'title': obj.project.title,
                'client': obj.project.client.username,
                'senior_developer': obj.project.senior_developer.username if obj.project.senior_developer else None
            }
        return None
    
    def get_modifications_count(self, obj):
        """Get count of modifications made to this proposal"""
        return obj.modifications.count()
    
    def get_locked_by_details(self, obj):
        """Get details of user who locked the proposal"""
        if obj.locked_by:
            return {
                'id': obj.locked_by.id,
                'username': obj.locked_by.username,
                'first_name': obj.locked_by.first_name,
                'last_name': obj.locked_by.last_name,
            }
        return None


class ProposalModificationSerializer(serializers.ModelSerializer):
    """Serializer for the ProposalModification model"""
    
    modified_by_details = serializers.SerializerMethodField()
    proposal_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ProposalModification
        fields = [
            'id', 'proposal', 'proposal_details', 'modified_by', 'modified_by_details',
            'modification_type', 'field_name', 'old_value', 'new_value',
            'justification', 'created_at'
        ]
        read_only_fields = [
            'id', 'proposal', 'modified_by', 'created_at'
        ]
    
    def get_modified_by_details(self, obj):
        """Get details of user who made the modification"""
        if obj.modified_by:
            return {
                'id': obj.modified_by.id,
                'username': obj.modified_by.username,
                'first_name': obj.modified_by.first_name,
                'last_name': obj.modified_by.last_name,
            }
        return None
    
    def get_proposal_details(self, obj):
        """Get basic proposal information"""
        if obj.proposal:
            return {
                'id': obj.proposal.id,
                'project_title': obj.proposal.project.title,
                'status': obj.proposal.status
            }
        return None


class SeniorDeveloperAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for the SeniorDeveloperAssignment model"""
    
    project_details = serializers.SerializerMethodField()
    senior_developer_details = serializers.SerializerMethodField()
    
    class Meta:
        model = SeniorDeveloperAssignment
        fields = [
            'id', 'project', 'project_details', 'senior_developer', 'senior_developer_details',
            'experience_score', 'reputation_score', 'skill_match_score', 'leadership_score',
            'total_score', 'status', 'assigned_at', 'accepted_at', 'declined_at',
            'decline_reason'
        ]
        read_only_fields = [
            'id', 'project', 'senior_developer', 'experience_score', 'reputation_score',
            'skill_match_score', 'leadership_score', 'total_score', 'assigned_at',
            'accepted_at', 'declined_at'
        ]
    
    def get_project_details(self, obj):
        """Get basic project information"""
        if obj.project:
            return {
                'id': obj.project.id,
                'title': obj.project.title,
                'client': obj.project.client.username,
                'status': obj.project.status,
                'required_skills': obj.project.required_skills,
                'experience_level_required': obj.project.experience_level_required
            }
        return None
    
    def get_senior_developer_details(self, obj):
        """Get detailed senior developer information"""
        if obj.senior_developer:
            profile = getattr(obj.senior_developer, 'developer_profile', None)
            return {
                'id': obj.senior_developer.id,
                'username': obj.senior_developer.username,
                'first_name': obj.senior_developer.first_name,
                'last_name': obj.senior_developer.last_name,
                'experience_level': profile.experience_level if profile else None,
                'skills': profile.skills if profile else [],
                'reputation_score': profile.reputation_score if profile else 0.0,
                'projects_completed': profile.projects_completed if profile else 0
            }
        return None


class ProposalModifyRequestSerializer(serializers.Serializer):
    """Serializer for proposal modification requests"""
    
    current_budget = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    current_timeline = serializers.DurationField(required=False)
    current_task_breakdown = serializers.JSONField(required=False)
    current_sla_terms = serializers.JSONField(required=False)
    justification = serializers.CharField(max_length=1000, required=True)
    
    def validate_justification(self, value):
        """Ensure justification is provided and meaningful"""
        if not value or len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Justification must be at least 10 characters long"
            )
        return value.strip()


class ProposalApprovalSerializer(serializers.Serializer):
    """Serializer for proposal approval requests"""
    
    approved = serializers.BooleanField(required=True)
    comments = serializers.CharField(max_length=500, required=False, allow_blank=True)


class TeamInvitationSerializer(serializers.ModelSerializer):
    """Serializer for team member invitations"""
    
    task_details = serializers.SerializerMethodField()
    developer_details = serializers.SerializerMethodField()
    
    class Meta:
        model = TeamInvitation
        fields = [
            'id', 'task', 'task_details', 'developer', 'developer_details',
            'match_score', 'offered_rate', 'estimated_hours', 'estimated_completion_date',
            'status', 'invited_at', 'responded_at', 'expires_at',
            'decline_reason', 'counter_offer_rate', 'invitation_rank', 'is_fallback'
        ]
        read_only_fields = [
            'id', 'task', 'developer', 'match_score', 'offered_rate',
            'estimated_hours', 'estimated_completion_date', 'invited_at',
            'responded_at', 'expires_at', 'invitation_rank', 'is_fallback'
        ]
    
    def get_task_details(self, obj):
        """Get basic task information"""
        if obj.task:
            return {
                'id': obj.task.id,
                'title': obj.task.title,
                'project_title': obj.task.project.title,
                'required_skills': obj.task.required_skills,
                'priority': obj.task.priority
            }
        return None
    
    def get_developer_details(self, obj):
        """Get basic developer information"""
        if obj.developer:
            profile = getattr(obj.developer, 'developer_profile', None)
            return {
                'id': obj.developer.id,
                'username': obj.developer.username,
                'first_name': obj.developer.first_name,
                'last_name': obj.developer.last_name,
                'experience_level': profile.experience_level if profile else None,
                'skills': profile.skills if profile else [],
                'hourly_rate': float(profile.hourly_rate) if profile and profile.hourly_rate else 0.0
            }
        return None


class TaskAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for active task assignments"""
    
    task_details = serializers.SerializerMethodField()
    developer_details = serializers.SerializerMethodField()
    invitation_details = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskAssignment
        fields = [
            'id', 'task', 'task_details', 'developer', 'developer_details',
            'invitation', 'invitation_details', 'agreed_rate', 'agreed_hours',
            'start_date', 'expected_completion_date', 'status', 'hours_logged',
            'progress_percentage', 'actual_start_date', 'actual_completion_date',
            'last_activity_date', 'allocated_budget', 'spent_budget',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'task', 'developer', 'invitation', 'created_at', 'updated_at'
        ]
    
    def get_task_details(self, obj):
        """Get basic task information"""
        if obj.task:
            return {
                'id': obj.task.id,
                'title': obj.task.title,
                'description': obj.task.description,
                'project_title': obj.task.project.title,
                'required_skills': obj.task.required_skills,
                'estimated_hours': obj.task.estimated_hours,
                'priority': obj.task.priority
            }
        return None
    
    def get_developer_details(self, obj):
        """Get basic developer information"""
        if obj.developer:
            return {
                'id': obj.developer.id,
                'username': obj.developer.username,
                'first_name': obj.developer.first_name,
                'last_name': obj.developer.last_name,
            }
        return None
    
    def get_invitation_details(self, obj):
        """Get basic invitation information"""
        if obj.invitation:
            return {
                'id': obj.invitation.id,
                'match_score': obj.invitation.match_score,
                'invitation_rank': obj.invitation.invitation_rank,
                'is_fallback': obj.invitation.is_fallback
            }
        return None


class DynamicPricingSerializer(serializers.ModelSerializer):
    """Serializer for dynamic pricing calculations"""
    
    task_details = serializers.SerializerMethodField()
    
    class Meta:
        model = DynamicPricing
        fields = [
            'id', 'task', 'task_details', 'base_rate', 'complexity_level',
            'complexity_multiplier', 'skill_premium', 'rare_skills_bonus',
            'demand_multiplier', 'urgency_multiplier', 'calculated_rate',
            'min_rate', 'max_rate', 'calculation_factors', 'calculated_at'
        ]
        read_only_fields = [
            'id', 'task', 'calculated_rate', 'min_rate', 'max_rate',
            'calculation_factors', 'calculated_at'
        ]
    
    def get_task_details(self, obj):
        """Get basic task information"""
        if obj.task:
            return {
                'id': obj.task.id,
                'title': obj.task.title,
                'required_skills': obj.task.required_skills,
                'estimated_hours': obj.task.estimated_hours
            }
        return None


class ResourceAllocationSerializer(serializers.ModelSerializer):
    """Serializer for resource allocation and timeline management"""
    
    project_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ResourceAllocation
        fields = [
            'id', 'project', 'project_details', 'total_team_members',
            'active_assignments', 'pending_invitations', 'total_budget',
            'allocated_budget', 'remaining_budget', 'planned_start_date',
            'planned_end_date', 'current_projected_end_date', 'overall_progress_percentage',
            'tasks_completed', 'tasks_in_progress', 'tasks_pending',
            'average_team_utilization', 'critical_path_tasks', 'budget_risk_level',
            'timeline_risk_level', 'resource_risk_level', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'project', 'created_at', 'updated_at'
        ]
    
    def get_project_details(self, obj):
        """Get basic project information"""
        if obj.project:
            return {
                'id': obj.project.id,
                'title': obj.project.title,
                'status': obj.project.status,
                'client': obj.project.client.username
            }
        return None


class InvitationResponseSerializer(serializers.Serializer):
    """Serializer for invitation response requests"""
    
    action = serializers.ChoiceField(choices=['accept', 'decline', 'counter_offer'])
    counter_offer_rate = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )
    decline_reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate(self, data):
        """Validate invitation response data"""
        action = data.get('action')
        
        if action == 'counter_offer' and not data.get('counter_offer_rate'):
            raise serializers.ValidationError(
                "Counter offer rate is required when making a counter offer"
            )
        
        if action == 'decline' and not data.get('decline_reason'):
            raise serializers.ValidationError(
                "Decline reason is required when declining an invitation"
            )
        
        return data


class TeamHiringRequestSerializer(serializers.Serializer):
    """Serializer for team hiring requests"""
    
    project_id = serializers.UUIDField(required=True)
    task_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True
    )
    max_invitations_per_task = serializers.IntegerField(default=3, min_value=1, max_value=10)
    invitation_expiry_hours = serializers.IntegerField(default=72, min_value=24, max_value=168)
    
    def validate_project_id(self, value):
        """Validate that project exists"""
        try:
            Project.objects.get(id=value)
        except Project.DoesNotExist:
            raise serializers.ValidationError("Project not found")
        return value


class TaskApprovalRequestSerializer(serializers.Serializer):
    """Serializer for task approval workflow requests"""
    
    action = serializers.ChoiceField(choices=['submit_qa', 'qa_approve', 'qa_reject', 'client_approve', 'client_reject'])
    notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    
    def validate_notes(self, value):
        """Validate notes based on action"""
        action = self.initial_data.get('action')
        if action in ['qa_reject', 'client_reject'] and not value:
            raise serializers.ValidationError(f"Notes are required for {action} action")
        return value


class TaskApprovalStatusSerializer(serializers.Serializer):
    """Serializer for task approval status response"""
    
    task_id = serializers.UUIDField()
    task_title = serializers.CharField()
    current_status = serializers.CharField()
    workflow_stage = serializers.CharField()
    completion_percentage = serializers.IntegerField()
    assigned_developer = serializers.DictField(required=False, allow_null=True)
    assignment_details = serializers.DictField(required=False, allow_null=True)
    recent_notifications = serializers.ListField(child=serializers.DictField())
    qa_reviewers = serializers.ListField(child=serializers.DictField())