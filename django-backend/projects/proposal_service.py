"""
Project Proposal Service

This service handles the creation, modification, and approval workflow
for project proposals, including change tracking and locking mechanisms.
"""

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from typing import Dict, Any, Optional, List
import logging
import json

from .models import Project, ProjectProposal, ProposalModification

User = get_user_model()
logger = logging.getLogger(__name__)


class ProposalService:
    """Service for managing project proposals and modifications"""
    
    @classmethod
    def create_initial_proposal(cls, project: Project, ai_analysis: Dict[str, Any]) -> ProjectProposal:
        """
        Create initial proposal from AI analysis
        
        Args:
            project: The project to create proposal for
            ai_analysis: AI-generated analysis containing budget, timeline, tasks, etc.
            
        Returns:
            ProjectProposal instance
        """
        logger.info(f"Creating initial proposal for project: {project.title}")
        
        # Extract data from AI analysis
        budget = ai_analysis.get('budget_estimate', 0)
        timeline = ai_analysis.get('timeline_estimate')
        task_breakdown = ai_analysis.get('task_breakdown', {})
        sla_terms = ai_analysis.get('sla_terms', {})
        
        proposal = ProjectProposal.objects.create(
            project=project,
            original_budget=budget,
            original_timeline=timeline,
            original_task_breakdown=task_breakdown,
            original_sla_terms=sla_terms,
            current_budget=budget,
            current_timeline=timeline,
            current_task_breakdown=task_breakdown,
            current_sla_terms=sla_terms,
            status='draft'
        )
        
        logger.info(f"Initial proposal created with ID: {proposal.id}")
        return proposal
    
    @classmethod
    def modify_proposal(cls, proposal: ProjectProposal, modifications: Dict[str, Any], 
                       modified_by: User, justification: str) -> List[ProposalModification]:
        """
        Modify a project proposal with change tracking
        
        Args:
            proposal: The proposal to modify
            modifications: Dictionary of field changes
            modified_by: User making the modifications
            justification: Justification for the changes
            
        Returns:
            List of ProposalModification instances created
        """
        if proposal.is_locked:
            raise ValueError("Cannot modify locked proposal")
        
        if modified_by != proposal.project.senior_developer:
            raise ValueError("Only assigned senior developer can modify proposal")
        
        logger.info(f"Modifying proposal {proposal.id} by {modified_by.username}")
        
        modification_records = []
        
        with transaction.atomic():
            for field_name, new_value in modifications.items():
                if hasattr(proposal, field_name):
                    old_value = getattr(proposal, field_name)
                    
                    # Only create modification record if value actually changed
                    if old_value != new_value:
                        # Determine modification type
                        modification_type = cls._get_modification_type(field_name)
                        
                        # Create modification record
                        modification = ProposalModification.objects.create(
                            proposal=proposal,
                            modified_by=modified_by,
                            modification_type=modification_type,
                            field_name=field_name,
                            old_value=cls._serialize_value(old_value),
                            new_value=cls._serialize_value(new_value),
                            justification=justification
                        )
                        modification_records.append(modification)
                        
                        # Update the proposal field
                        setattr(proposal, field_name, new_value)
                        
                        logger.info(f"Modified {field_name} from {old_value} to {new_value}")
            
            # Update proposal status and timestamp
            proposal.status = 'senior_review'
            proposal.save()
        
        logger.info(f"Created {len(modification_records)} modification records")
        return modification_records
    
    @classmethod
    def _get_modification_type(cls, field_name: str) -> str:
        """Determine modification type based on field name"""
        field_type_mapping = {
            'current_budget': 'budget_change',
            'current_timeline': 'timeline_change',
            'current_task_breakdown': 'task_modification',
            'current_sla_terms': 'sla_change'
        }
        return field_type_mapping.get(field_name, 'scope_change')
    
    @classmethod
    def _serialize_value(cls, value: Any) -> Any:
        """Serialize value for JSON storage"""
        if hasattr(value, 'total_seconds'):  # Duration object
            return value.total_seconds()
        elif hasattr(value, '__dict__'):  # Complex object
            return str(value)
        return value
    
    @classmethod
    def senior_developer_approve(cls, proposal: ProjectProposal, senior_developer: User) -> bool:
        """
        Senior developer approves the proposal
        
        Args:
            proposal: The proposal to approve
            senior_developer: The senior developer approving
            
        Returns:
            True if successful, False otherwise
        """
        if senior_developer != proposal.project.senior_developer:
            raise ValueError("Only assigned senior developer can approve proposal")
        
        if proposal.is_locked:
            raise ValueError("Cannot approve locked proposal")
        
        logger.info(f"Senior developer {senior_developer.username} approving proposal {proposal.id}")
        
        try:
            proposal.senior_developer_approved = True
            proposal.senior_developer_approved_at = timezone.now()
            proposal.status = 'client_review'
            proposal.save()
            
            logger.info(f"Proposal {proposal.id} approved by senior developer")
            return True
            
        except Exception as e:
            logger.error(f"Error approving proposal {proposal.id}: {str(e)}")
            return False
    
    @classmethod
    def client_approve(cls, proposal: ProjectProposal, client: User) -> bool:
        """
        Client approves the proposal
        
        Args:
            proposal: The proposal to approve
            client: The client approving
            
        Returns:
            True if successful, False otherwise
        """
        if client != proposal.project.client:
            raise ValueError("Only project client can approve proposal")
        
        if not proposal.senior_developer_approved:
            raise ValueError("Senior developer must approve proposal first")
        
        if proposal.is_locked:
            raise ValueError("Cannot approve locked proposal")
        
        logger.info(f"Client {client.username} approving proposal {proposal.id}")
        
        try:
            with transaction.atomic():
                proposal.client_approved = True
                proposal.client_approved_at = timezone.now()
                proposal.status = 'approved'
                proposal.save()
                
                # Lock the proposal after dual approval
                cls.lock_proposal(proposal, client)
                
                # Update project status to proceed with team assembly
                proposal.project.status = 'team_assembly'
                proposal.project.save()
            
            logger.info(f"Proposal {proposal.id} approved by client and locked")
            return True
            
        except Exception as e:
            logger.error(f"Error approving proposal {proposal.id}: {str(e)}")
            return False
    
    @classmethod
    def lock_proposal(cls, proposal: ProjectProposal, locked_by: User) -> bool:
        """
        Lock a proposal to prevent further modifications
        
        Args:
            proposal: The proposal to lock
            locked_by: User locking the proposal
            
        Returns:
            True if successful, False otherwise
        """
        logger.info(f"Locking proposal {proposal.id} by {locked_by.username}")
        
        try:
            proposal.is_locked = True
            proposal.locked_at = timezone.now()
            proposal.locked_by = locked_by
            proposal.status = 'locked'
            proposal.save()
            
            logger.info(f"Proposal {proposal.id} locked successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error locking proposal {proposal.id}: {str(e)}")
            return False
    
    @classmethod
    def unlock_proposal(cls, proposal: ProjectProposal, unlocked_by: User, reason: str) -> bool:
        """
        Unlock a proposal (admin only)
        
        Args:
            proposal: The proposal to unlock
            unlocked_by: User unlocking the proposal (must be admin)
            reason: Reason for unlocking
            
        Returns:
            True if successful, False otherwise
        """
        if unlocked_by.role != 'admin':
            raise ValueError("Only admins can unlock proposals")
        
        logger.info(f"Unlocking proposal {proposal.id} by admin {unlocked_by.username}")
        
        try:
            proposal.is_locked = False
            proposal.locked_at = None
            proposal.locked_by = None
            proposal.status = 'senior_review'
            proposal.save()
            
            # Create modification record for unlocking
            ProposalModification.objects.create(
                proposal=proposal,
                modified_by=unlocked_by,
                modification_type='scope_change',
                field_name='is_locked',
                old_value=True,
                new_value=False,
                justification=f"Admin unlock: {reason}"
            )
            
            logger.info(f"Proposal {proposal.id} unlocked successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error unlocking proposal {proposal.id}: {str(e)}")
            return False
    
    @classmethod
    def get_proposal_history(cls, proposal: ProjectProposal) -> List[Dict[str, Any]]:
        """
        Get complete modification history for a proposal
        
        Args:
            proposal: The proposal to get history for
            
        Returns:
            List of modification records with details
        """
        modifications = proposal.modifications.all().order_by('-created_at')
        
        history = []
        for mod in modifications:
            history.append({
                'id': str(mod.id),
                'modification_type': mod.modification_type,
                'field_name': mod.field_name,
                'old_value': mod.old_value,
                'new_value': mod.new_value,
                'justification': mod.justification,
                'modified_by': mod.modified_by.username,
                'created_at': mod.created_at.isoformat()
            })
        
        return history
    
    @classmethod
    def reject_proposal(cls, proposal: ProjectProposal, rejected_by: User, reason: str) -> bool:
        """
        Reject a proposal (client or admin only)
        
        Args:
            proposal: The proposal to reject
            rejected_by: User rejecting the proposal
            reason: Reason for rejection
            
        Returns:
            True if successful, False otherwise
        """
        if (rejected_by != proposal.project.client and rejected_by.role != 'admin'):
            raise ValueError("Only client or admin can reject proposal")
        
        logger.info(f"Rejecting proposal {proposal.id} by {rejected_by.username}")
        
        try:
            proposal.status = 'rejected'
            proposal.save()
            
            # Create modification record for rejection
            ProposalModification.objects.create(
                proposal=proposal,
                modified_by=rejected_by,
                modification_type='scope_change',
                field_name='status',
                old_value=proposal.status,
                new_value='rejected',
                justification=f"Proposal rejected: {reason}"
            )
            
            # Update project status back to analyzing for revision
            proposal.project.status = 'analyzing'
            proposal.project.save()
            
            logger.info(f"Proposal {proposal.id} rejected successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error rejecting proposal {proposal.id}: {str(e)}")
            return False
    
    @classmethod
    def get_proposal_summary(cls, proposal: ProjectProposal) -> Dict[str, Any]:
        """
        Get a comprehensive summary of the proposal including changes
        
        Args:
            proposal: The proposal to summarize
            
        Returns:
            Dictionary containing proposal summary
        """
        modifications_count = proposal.modifications.count()
        
        return {
            'id': str(proposal.id),
            'project_title': proposal.project.title,
            'status': proposal.status,
            'is_locked': proposal.is_locked,
            'senior_developer_approved': proposal.senior_developer_approved,
            'client_approved': proposal.client_approved,
            'original_budget': float(proposal.original_budget),
            'current_budget': float(proposal.current_budget),
            'budget_changed': proposal.original_budget != proposal.current_budget,
            'original_timeline': proposal.original_timeline.total_seconds() if proposal.original_timeline else None,
            'current_timeline': proposal.current_timeline.total_seconds() if proposal.current_timeline else None,
            'timeline_changed': proposal.original_timeline != proposal.current_timeline,
            'modifications_count': modifications_count,
            'created_at': proposal.created_at.isoformat(),
            'updated_at': proposal.updated_at.isoformat(),
            'locked_at': proposal.locked_at.isoformat() if proposal.locked_at else None,
            'locked_by': proposal.locked_by.username if proposal.locked_by else None
        }