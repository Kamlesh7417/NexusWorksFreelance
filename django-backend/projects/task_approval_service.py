"""
Task completion and approval workflow service

This service handles the complete workflow for task completion and approval:
1. Developer completes task -> QA review notification
2. QA approves task -> Client notification  
3. Client approves task -> Task marked complete, project progress updated
4. Automated milestone progress calculation and payment triggers
"""

from django.db import transaction, models
from django.utils import timezone
from django.contrib.auth import get_user_model
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
import logging

from .models import Task, Project, TaskAssignment
from communications.models import Notification
from payments.models import Milestone

User = get_user_model()
logger = logging.getLogger(__name__)


class TaskApprovalService:
    """Service for managing task completion and approval workflow"""
    
    @staticmethod
    def submit_task_for_qa(task: Task, developer: User, completion_notes: str = "") -> Dict:
        """
        Submit a completed task for QA review
        
        Requirements: 7.1 - When a developer completes a task THEN the system SHALL notify QA for review
        """
        try:
            with transaction.atomic():
                # Validate that developer can submit this task
                if task.assigned_developer != developer:
                    raise ValueError("Only assigned developer can submit task for QA")
                
                if task.status not in ['in_progress', 'assigned']:
                    raise ValueError(f"Task must be in progress to submit for QA, current status: {task.status}")
                
                # Update task status
                task.status = 'qa_review'
                task.completion_percentage = 100
                task.updated_at = timezone.now()
                task.save()
                
                # Update task assignment if exists
                assignment = getattr(task, 'assignment', None)
                if assignment:
                    assignment.status = 'qa_review'
                    assignment.progress_percentage = 100
                    assignment.last_activity_date = timezone.now()
                    assignment.save()
                
                # Find QA reviewers (senior developers or project senior developer)
                qa_reviewers = TaskApprovalService._get_qa_reviewers(task)
                
                # Create notifications for QA reviewers
                notifications_created = []
                for reviewer in qa_reviewers:
                    notification = Notification.objects.create(
                        recipient=reviewer,
                        notification_type='task_qa_review',
                        title=f'Task Ready for QA Review: {task.title}',
                        message=f'Developer {developer.get_full_name() or developer.username} has completed task "{task.title}" in project "{task.project.title}" and submitted it for QA review.\n\nCompletion Notes: {completion_notes}',
                        priority='normal',
                        related_task=task,
                        related_project=task.project,
                        metadata={
                            'developer_id': str(developer.id),
                            'completion_notes': completion_notes,
                            'submitted_at': timezone.now().isoformat()
                        }
                    )
                    notifications_created.append(notification)
                
                logger.info(f"Task {task.id} submitted for QA review by {developer.username}")
                
                return {
                    'success': True,
                    'message': 'Task submitted for QA review successfully',
                    'task_status': task.status,
                    'qa_reviewers_notified': len(notifications_created),
                    'notifications': [str(n.id) for n in notifications_created]
                }
                
        except Exception as e:
            logger.error(f"Error submitting task {task.id} for QA: {str(e)}")
            raise
    
    @staticmethod
    def qa_approve_task(task: Task, qa_reviewer: User, approval_notes: str = "") -> Dict:
        """
        QA approves a completed task and notifies client
        
        Requirements: 7.2 - When QA approves a task THEN the system SHALL notify the client for final approval
        """
        try:
            with transaction.atomic():
                # Validate QA reviewer permissions
                if not TaskApprovalService._can_qa_review(task, qa_reviewer):
                    raise ValueError("User does not have QA review permissions for this task")
                
                if task.status != 'qa_review':
                    raise ValueError(f"Task must be in QA review to approve, current status: {task.status}")
                
                # Update task status
                task.status = 'client_review'
                task.updated_at = timezone.now()
                task.save()
                
                # Update task assignment if exists
                assignment = getattr(task, 'assignment', None)
                if assignment:
                    assignment.status = 'client_review'
                    assignment.last_activity_date = timezone.now()
                    assignment.save()
                
                # Create notification for client
                client_notification = Notification.objects.create(
                    recipient=task.project.client,
                    notification_type='task_client_approval',
                    title=f'Task Ready for Your Approval: {task.title}',
                    message=f'Task "{task.title}" in project "{task.project.title}" has been completed by {task.assigned_developer.get_full_name() or task.assigned_developer.username} and approved by QA reviewer {qa_reviewer.get_full_name() or qa_reviewer.username}. Please review and approve.\n\nQA Notes: {approval_notes}',
                    priority='high',
                    related_task=task,
                    related_project=task.project,
                    metadata={
                        'qa_reviewer_id': str(qa_reviewer.id),
                        'developer_id': str(task.assigned_developer.id),
                        'qa_approval_notes': approval_notes,
                        'qa_approved_at': timezone.now().isoformat()
                    }
                )
                
                logger.info(f"Task {task.id} approved by QA reviewer {qa_reviewer.username}")
                
                return {
                    'success': True,
                    'message': 'Task approved by QA and client notified',
                    'task_status': task.status,
                    'client_notification_id': str(client_notification.id)
                }
                
        except Exception as e:
            logger.error(f"Error in QA approval for task {task.id}: {str(e)}")
            raise
    
    @staticmethod
    def qa_reject_task(task: Task, qa_reviewer: User, rejection_notes: str) -> Dict:
        """
        QA rejects a completed task and sends back to developer
        """
        try:
            with transaction.atomic():
                # Validate QA reviewer permissions
                if not TaskApprovalService._can_qa_review(task, qa_reviewer):
                    raise ValueError("User does not have QA review permissions for this task")
                
                if task.status != 'qa_review':
                    raise ValueError(f"Task must be in QA review to reject, current status: {task.status}")
                
                # Update task status back to in progress
                task.status = 'in_progress'
                task.completion_percentage = 75  # Reduce completion percentage
                task.updated_at = timezone.now()
                task.save()
                
                # Update task assignment if exists
                assignment = getattr(task, 'assignment', None)
                if assignment:
                    assignment.status = 'active'
                    assignment.progress_percentage = 75
                    assignment.last_activity_date = timezone.now()
                    assignment.save()
                
                # Notify developer of rejection
                developer_notification = Notification.objects.create(
                    recipient=task.assigned_developer,
                    notification_type='task_qa_rejected',
                    title=f'Task Needs Revision: {task.title}',
                    message=f'Your completed task "{task.title}" in project "{task.project.title}" requires revisions based on QA review by {qa_reviewer.get_full_name() or qa_reviewer.username}.\n\nRevision Notes: {rejection_notes}',
                    priority='high',
                    related_task=task,
                    related_project=task.project,
                    metadata={
                        'qa_reviewer_id': str(qa_reviewer.id),
                        'rejection_notes': rejection_notes,
                        'rejected_at': timezone.now().isoformat()
                    }
                )
                
                logger.info(f"Task {task.id} rejected by QA reviewer {qa_reviewer.username}")
                
                return {
                    'success': True,
                    'message': 'Task rejected by QA and developer notified',
                    'task_status': task.status,
                    'developer_notification_id': str(developer_notification.id)
                }
                
        except Exception as e:
            logger.error(f"Error in QA rejection for task {task.id}: {str(e)}")
            raise
    
    @staticmethod
    def client_approve_task(task: Task, client: User, approval_notes: str = "") -> Dict:
        """
        Client gives final approval to a task
        
        Requirements: 7.3 - When the client approves a task THEN the system SHALL mark it as complete and update project progress
        """
        try:
            with transaction.atomic():
                # Validate client permissions
                if task.project.client != client:
                    raise ValueError("Only project client can give final approval")
                
                if task.status != 'client_review':
                    raise ValueError(f"Task must be in client review to approve, current status: {task.status}")
                
                # Update task status to approved/completed
                task.status = 'approved'
                task.completion_percentage = 100
                task.updated_at = timezone.now()
                task.save()
                
                # Update task assignment if exists
                assignment = getattr(task, 'assignment', None)
                if assignment:
                    assignment.status = 'completed'
                    assignment.actual_completion_date = timezone.now()
                    assignment.progress_percentage = 100
                    assignment.last_activity_date = timezone.now()
                    assignment.save()
                
                # Notify developer of approval
                developer_notification = Notification.objects.create(
                    recipient=task.assigned_developer,
                    notification_type='task_approved',
                    title=f'Task Approved: {task.title}',
                    message=f'Congratulations! Your task "{task.title}" in project "{task.project.title}" has been approved by the client.\n\nClient Notes: {approval_notes}',
                    priority='normal',
                    related_task=task,
                    related_project=task.project,
                    metadata={
                        'client_id': str(client.id),
                        'approval_notes': approval_notes,
                        'approved_at': timezone.now().isoformat()
                    }
                )
                
                # Update project progress and check for milestone completion
                progress_result = TaskApprovalService._update_project_progress(task.project)
                
                logger.info(f"Task {task.id} approved by client {client.username}")
                
                return {
                    'success': True,
                    'message': 'Task approved by client successfully',
                    'task_status': task.status,
                    'developer_notification_id': str(developer_notification.id),
                    'project_progress': progress_result
                }
                
        except Exception as e:
            logger.error(f"Error in client approval for task {task.id}: {str(e)}")
            raise
    
    @staticmethod
    def client_reject_task(task: Task, client: User, rejection_notes: str) -> Dict:
        """
        Client rejects a task and sends back for revision
        """
        try:
            with transaction.atomic():
                # Validate client permissions
                if task.project.client != client:
                    raise ValueError("Only project client can reject task")
                
                if task.status != 'client_review':
                    raise ValueError(f"Task must be in client review to reject, current status: {task.status}")
                
                # Update task status back to in progress
                task.status = 'in_progress'
                task.completion_percentage = 50  # Reduce completion percentage more significantly
                task.updated_at = timezone.now()
                task.save()
                
                # Update task assignment if exists
                assignment = getattr(task, 'assignment', None)
                if assignment:
                    assignment.status = 'active'
                    assignment.progress_percentage = 50
                    assignment.last_activity_date = timezone.now()
                    assignment.save()
                
                # Notify developer of client rejection
                developer_notification = Notification.objects.create(
                    recipient=task.assigned_developer,
                    notification_type='task_client_rejected',
                    title=f'Client Requests Revisions: {task.title}',
                    message=f'The client has requested revisions for your task "{task.title}" in project "{task.project.title}".\n\nClient Feedback: {rejection_notes}',
                    priority='high',
                    related_task=task,
                    related_project=task.project,
                    metadata={
                        'client_id': str(client.id),
                        'rejection_notes': rejection_notes,
                        'rejected_at': timezone.now().isoformat()
                    }
                )
                
                logger.info(f"Task {task.id} rejected by client {client.username}")
                
                return {
                    'success': True,
                    'message': 'Task rejected by client and developer notified',
                    'task_status': task.status,
                    'developer_notification_id': str(developer_notification.id)
                }
                
        except Exception as e:
            logger.error(f"Error in client rejection for task {task.id}: {str(e)}")
            raise
    
    @staticmethod
    def _get_qa_reviewers(task: Task) -> List[User]:
        """Get list of users who can perform QA review for a task"""
        qa_reviewers = []
        
        # Project senior developer can always do QA
        if task.project.senior_developer:
            qa_reviewers.append(task.project.senior_developer)
        
        # Other senior developers with relevant skills can also do QA
        # (This could be expanded based on business rules)
        
        return qa_reviewers
    
    @staticmethod
    def _can_qa_review(task: Task, user: User) -> bool:
        """Check if user can perform QA review for a task"""
        # Project senior developer can always review
        if task.project.senior_developer == user:
            return True
        
        # Admin users can review
        if user.is_staff:
            return True
        
        # Could add more business logic here for other QA reviewers
        
        return False
    
    @staticmethod
    def _update_project_progress(project: Project) -> Dict:
        """
        Update project progress and check for milestone completion
        
        Requirements: 7.4 - If 25% of project milestones are completed THEN the system SHALL trigger payment processing
        """
        try:
            # Calculate project completion statistics
            total_tasks = project.tasks.count()
            if total_tasks == 0:
                return {'progress_percentage': 0, 'milestone_triggered': False}
            
            approved_tasks = project.tasks.filter(status='approved').count()
            progress_percentage = int((approved_tasks / total_tasks) * 100)
            
            # Update project status based on progress
            if progress_percentage == 100:
                project.status = 'completed'
            elif progress_percentage > 0:
                project.status = 'in_progress'
            
            project.save()
            
            # Check for milestone completion and trigger payments
            milestone_results = TaskApprovalService._check_milestone_completion(project, progress_percentage)
            
            return {
                'progress_percentage': progress_percentage,
                'total_tasks': total_tasks,
                'approved_tasks': approved_tasks,
                'project_status': project.status,
                'milestone_triggered': milestone_results['milestone_triggered'],
                'milestones_completed': milestone_results.get('milestones_completed', [])
            }
            
        except Exception as e:
            logger.error(f"Error updating project progress for {project.id}: {str(e)}")
            raise
    
    @staticmethod
    def _check_milestone_completion(project: Project, progress_percentage: int) -> Dict:
        """
        Check if any milestones should be marked as completed based on project progress
        
        Requirements: 7.4 - Automated milestone progress calculation
        """
        try:
            milestones_completed = []
            milestone_triggered = False
            
            # Get all project milestones
            milestones = project.milestones.filter(status='pending').order_by('percentage')
            
            for milestone in milestones:
                # Check if this milestone should be completed
                if progress_percentage >= milestone.percentage:
                    milestone.status = 'completed'
                    milestone.save()
                    milestones_completed.append({
                        'id': str(milestone.id),
                        'percentage': milestone.percentage,
                        'amount': float(milestone.amount)
                    })
                    milestone_triggered = True
                    
                    # Create notification for client about milestone completion
                    Notification.objects.create(
                        recipient=project.client,
                        notification_type='milestone_completed',
                        title=f'Milestone Completed: {milestone.percentage}%',
                        message=f'Milestone {milestone.percentage}% has been completed for project "{project.title}". Payment of ${milestone.amount} is now due.',
                        priority='high',
                        related_project=project,
                        metadata={
                            'milestone_id': str(milestone.id),
                            'milestone_percentage': milestone.percentage,
                            'milestone_amount': float(milestone.amount),
                            'completed_at': timezone.now().isoformat()
                        }
                    )
                    
                    logger.info(f"Milestone {milestone.percentage}% completed for project {project.id}")
            
            return {
                'milestone_triggered': milestone_triggered,
                'milestones_completed': milestones_completed
            }
            
        except Exception as e:
            logger.error(f"Error checking milestone completion for project {project.id}: {str(e)}")
            raise
    
    @staticmethod
    def get_task_approval_status(task: Task) -> Dict:
        """Get comprehensive approval status for a task"""
        try:
            assignment = getattr(task, 'assignment', None)
            
            # Determine current workflow stage
            workflow_stage = 'not_started'
            if task.status == 'in_progress':
                workflow_stage = 'development'
            elif task.status == 'qa_review':
                workflow_stage = 'qa_review'
            elif task.status == 'client_review':
                workflow_stage = 'client_review'
            elif task.status == 'approved':
                workflow_stage = 'completed'
            
            # Get related notifications
            notifications = task.notifications.filter(
                notification_type__in=[
                    'task_qa_review', 'task_client_approval', 'task_approved',
                    'task_qa_rejected', 'task_client_rejected'
                ]
            ).order_by('-created_at')[:5]
            
            return {
                'task_id': str(task.id),
                'task_title': task.title,
                'current_status': task.status,
                'workflow_stage': workflow_stage,
                'completion_percentage': task.completion_percentage,
                'assigned_developer': {
                    'id': task.assigned_developer.id,
                    'username': task.assigned_developer.username,
                    'name': task.assigned_developer.get_full_name()
                } if task.assigned_developer else None,
                'assignment_details': {
                    'status': assignment.status,
                    'progress_percentage': assignment.progress_percentage,
                    'last_activity': assignment.last_activity_date.isoformat() if assignment.last_activity_date else None
                } if assignment else None,
                'recent_notifications': [{
                    'id': str(n.id),
                    'type': n.notification_type,
                    'title': n.title,
                    'created_at': n.created_at.isoformat()
                } for n in notifications],
                'qa_reviewers': [
                    {
                        'id': reviewer.id,
                        'username': reviewer.username,
                        'name': reviewer.get_full_name()
                    } for reviewer in TaskApprovalService._get_qa_reviewers(task)
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting approval status for task {task.id}: {str(e)}")
            raise