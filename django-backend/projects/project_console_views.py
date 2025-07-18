"""
Project Management Console Views
Comprehensive dashboard for role-based project management with real-time updates
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.db.models import Q, Count, Sum, Avg, F
from datetime import datetime, timedelta
import json

from .models import (
    Project, Task, TaskAssignment, ResourceAllocation,
    TeamInvitation, ProjectProposal, DynamicPricing
)
from payments.models import Milestone, Payment
from .serializers import (
    ProjectSerializer, TaskSerializer, TaskAssignmentSerializer,
    ResourceAllocationSerializer, TeamInvitationSerializer
)
from ai_services.github_client import GitHubClient

User = get_user_model()


class ProjectConsoleViewSet(viewsets.ViewSet):
    """
    Comprehensive project management console with role-based access
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_project_access(self, project, user):
        """Check if user has access to project and return role"""
        if user.is_staff:
            return 'admin'
        elif project.client == user:
            return 'client'
        elif project.senior_developer == user:
            return 'senior_developer'
        elif project.tasks.filter(assigned_developer=user).exists():
            return 'developer'
        else:
            return None
    
    @action(detail=False, methods=['get'], url_path='dashboard')
    def get_dashboard(self, request):
        """
        Get role-based project dashboard with real-time updates
        Requirements: 6.1 - Role-appropriate project information
        """
        user = request.user
        
        # Get projects user has access to
        user_projects = Project.objects.filter(
            Q(client=user) | 
            Q(senior_developer=user) | 
            Q(tasks__assigned_developer=user)
        ).distinct()
        
        dashboard_data = {
            'user_role': user.role,
            'projects': [],
            'summary': {
                'total_projects': user_projects.count(),
                'active_projects': user_projects.filter(status='in_progress').count(),
                'completed_projects': user_projects.filter(status='completed').count(),
                'total_tasks': 0,
                'completed_tasks': 0,
                'pending_invitations': 0,
                'active_assignments': 0
            }
        }
        
        for project in user_projects:
            user_role = self.get_project_access(project, user)
            
            # Get project statistics
            total_tasks = project.tasks.count()
            completed_tasks = project.tasks.filter(status='completed').count()
            in_progress_tasks = project.tasks.filter(status='in_progress').count()
            
            # Get team information
            team_members = User.objects.filter(
                Q(assigned_tasks__project=project) |
                Q(id=project.senior_developer_id) if project.senior_developer else Q()
            ).distinct()
            
            # Get budget information
            resource_allocation = getattr(project, 'resource_allocation', None)
            
            project_data = {
                'id': str(project.id),
                'title': project.title,
                'status': project.status,
                'user_role': user_role,
                'progress': {
                    'total_tasks': total_tasks,
                    'completed_tasks': completed_tasks,
                    'in_progress_tasks': in_progress_tasks,
                    'completion_percentage': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
                },
                'team': {
                    'total_members': team_members.count(),
                    'senior_developer': {
                        'id': project.senior_developer.id,
                        'username': project.senior_developer.username,
                        'name': f"{project.senior_developer.first_name} {project.senior_developer.last_name}".strip()
                    } if project.senior_developer else None
                },
                'budget': {
                    'total_budget': float(resource_allocation.total_budget) if resource_allocation else 0,
                    'allocated_budget': float(resource_allocation.allocated_budget) if resource_allocation else 0,
                    'remaining_budget': float(resource_allocation.remaining_budget) if resource_allocation else 0,
                    'budget_risk_level': resource_allocation.budget_risk_level if resource_allocation else 'low'
                },
                'timeline': {
                    'planned_start_date': resource_allocation.planned_start_date if resource_allocation else None,
                    'planned_end_date': resource_allocation.planned_end_date if resource_allocation else None,
                    'current_projected_end_date': resource_allocation.current_projected_end_date if resource_allocation else None,
                    'timeline_risk_level': resource_allocation.timeline_risk_level if resource_allocation else 'low'
                },
                'created_at': project.created_at,
                'updated_at': project.updated_at
            }
            
            dashboard_data['projects'].append(project_data)
            
            # Update summary
            dashboard_data['summary']['total_tasks'] += total_tasks
            dashboard_data['summary']['completed_tasks'] += completed_tasks
        
        # Get user-specific statistics
        if user.role == 'developer':
            dashboard_data['summary']['pending_invitations'] = TeamInvitation.objects.filter(
                developer=user, status='pending'
            ).count()
            dashboard_data['summary']['active_assignments'] = TaskAssignment.objects.filter(
                developer=user, status='active'
            ).count()
        
        return Response(dashboard_data)
    
    @action(detail=True, methods=['get'], url_path='details')
    def get_project_details(self, request, pk=None):
        """
        Get comprehensive project details with role-based information
        Requirements: 6.2 - Task progress, team members, timeline, budget status
        """
        try:
            project = Project.objects.get(id=pk)
            user_role = self.get_project_access(project, request.user)
            
            if not user_role:
                return Response(
                    {'error': 'Access denied to this project'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get tasks with assignments
            tasks = project.tasks.select_related('assigned_developer').prefetch_related('dependencies')
            task_data = []
            
            for task in tasks:
                assignment = getattr(task, 'assignment', None)
                task_info = {
                    'id': str(task.id),
                    'title': task.title,
                    'description': task.description,
                    'status': task.status,
                    'priority': task.priority,
                    'estimated_hours': task.estimated_hours,
                    'completion_percentage': task.completion_percentage,
                    'required_skills': task.required_skills,
                    'dependencies': [str(dep.id) for dep in task.dependencies.all()],
                    'assigned_developer': {
                        'id': task.assigned_developer.id,
                        'username': task.assigned_developer.username,
                        'name': f"{task.assigned_developer.first_name} {task.assigned_developer.last_name}".strip()
                    } if task.assigned_developer else None,
                    'assignment': {
                        'id': str(assignment.id),
                        'agreed_rate': float(assignment.agreed_rate),
                        'hours_logged': float(assignment.hours_logged),
                        'progress_percentage': assignment.progress_percentage,
                        'start_date': assignment.start_date,
                        'expected_completion_date': assignment.expected_completion_date,
                        'last_activity_date': assignment.last_activity_date,
                        'spent_budget': float(assignment.spent_budget)
                    } if assignment else None,
                    'created_at': task.created_at,
                    'updated_at': task.updated_at
                }
                task_data.append(task_info)
            
            # Get team members with their roles and assignments
            team_members = []
            
            # Add senior developer
            if project.senior_developer:
                team_members.append({
                    'id': project.senior_developer.id,
                    'username': project.senior_developer.username,
                    'name': f"{project.senior_developer.first_name} {project.senior_developer.last_name}".strip(),
                    'role': 'senior_developer',
                    'tasks_assigned': project.tasks.filter(assigned_developer=project.senior_developer).count(),
                    'profile': {
                        'experience_level': getattr(project.senior_developer.developer_profile, 'experience_level', None),
                        'skills': getattr(project.senior_developer.developer_profile, 'skills', []),
                        'hourly_rate': float(getattr(project.senior_developer.developer_profile, 'hourly_rate', 0))
                    } if hasattr(project.senior_developer, 'developer_profile') else None
                })
            
            # Add assigned developers
            assigned_developers = User.objects.filter(assigned_tasks__project=project).distinct()
            for developer in assigned_developers:
                if developer != project.senior_developer:  # Avoid duplicates
                    team_members.append({
                        'id': developer.id,
                        'username': developer.username,
                        'name': f"{developer.first_name} {developer.last_name}".strip(),
                        'role': 'developer',
                        'tasks_assigned': project.tasks.filter(assigned_developer=developer).count(),
                        'profile': {
                            'experience_level': getattr(developer.developer_profile, 'experience_level', None),
                            'skills': getattr(developer.developer_profile, 'skills', []),
                            'hourly_rate': float(getattr(developer.developer_profile, 'hourly_rate', 0))
                        } if hasattr(developer, 'developer_profile') else None
                    })
            
            # Get resource allocation
            resource_allocation = getattr(project, 'resource_allocation', None)
            
            # Get milestones and payments
            milestones = Milestone.objects.filter(project=project).order_by('percentage')
            milestone_data = []
            for milestone in milestones:
                payments = Payment.objects.filter(milestone=milestone)
                milestone_data.append({
                    'id': str(milestone.id),
                    'percentage': milestone.percentage,
                    'amount': float(milestone.amount),
                    'status': milestone.status,
                    'due_date': milestone.due_date,
                    'paid_date': milestone.paid_date,
                    'payments': [{
                        'id': str(payment.id),
                        'developer': payment.developer.username,
                        'amount': float(payment.amount),
                        'status': payment.status,
                        'processed_at': payment.processed_at
                    } for payment in payments]
                })
            
            # Get pending invitations
            pending_invitations = TeamInvitation.objects.filter(
                task__project=project, status='pending'
            ).select_related('developer', 'task')
            
            invitation_data = []
            for invitation in pending_invitations:
                invitation_data.append({
                    'id': str(invitation.id),
                    'task_title': invitation.task.title,
                    'developer': {
                        'id': invitation.developer.id,
                        'username': invitation.developer.username,
                        'name': f"{invitation.developer.first_name} {invitation.developer.last_name}".strip()
                    },
                    'match_score': invitation.match_score,
                    'offered_rate': float(invitation.offered_rate),
                    'invited_at': invitation.invited_at,
                    'expires_at': invitation.expires_at
                })
            
            project_details = {
                'id': str(project.id),
                'title': project.title,
                'description': project.description,
                'status': project.status,
                'user_role': user_role,
                'client': {
                    'id': project.client.id,
                    'username': project.client.username,
                    'name': f"{project.client.first_name} {project.client.last_name}".strip()
                },
                'senior_developer': {
                    'id': project.senior_developer.id,
                    'username': project.senior_developer.username,
                    'name': f"{project.senior_developer.first_name} {project.senior_developer.last_name}".strip()
                } if project.senior_developer else None,
                'tasks': task_data,
                'team_members': team_members,
                'resource_allocation': {
                    'total_budget': float(resource_allocation.total_budget) if resource_allocation else 0,
                    'allocated_budget': float(resource_allocation.allocated_budget) if resource_allocation else 0,
                    'remaining_budget': float(resource_allocation.remaining_budget) if resource_allocation else 0,
                    'overall_progress_percentage': resource_allocation.overall_progress_percentage if resource_allocation else 0,
                    'tasks_completed': resource_allocation.tasks_completed if resource_allocation else 0,
                    'tasks_in_progress': resource_allocation.tasks_in_progress if resource_allocation else 0,
                    'tasks_pending': resource_allocation.tasks_pending if resource_allocation else 0,
                    'planned_start_date': resource_allocation.planned_start_date if resource_allocation else None,
                    'planned_end_date': resource_allocation.planned_end_date if resource_allocation else None,
                    'current_projected_end_date': resource_allocation.current_projected_end_date if resource_allocation else None,
                    'budget_risk_level': resource_allocation.budget_risk_level if resource_allocation else 'low',
                    'timeline_risk_level': resource_allocation.timeline_risk_level if resource_allocation else 'low',
                    'resource_risk_level': resource_allocation.resource_risk_level if resource_allocation else 'low'
                } if resource_allocation else None,
                'milestones': milestone_data,
                'pending_invitations': invitation_data,
                'ai_analysis': project.ai_analysis,
                'required_skills': project.required_skills,
                'experience_level_required': project.experience_level_required,
                'created_at': project.created_at,
                'updated_at': project.updated_at
            }
            
            return Response(project_details)
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'], url_path='task-progress')
    def get_task_progress(self, request, pk=None):
        """
        Get detailed task progress tracking and visualization data
        Requirements: 6.2 - Task progress tracking and visualization
        """
        try:
            project = Project.objects.get(id=pk)
            user_role = self.get_project_access(project, request.user)
            
            if not user_role:
                return Response(
                    {'error': 'Access denied to this project'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get task progress statistics
            tasks = project.tasks.all()
            task_stats = {
                'total_tasks': tasks.count(),
                'pending_tasks': tasks.filter(status='pending').count(),
                'assigned_tasks': tasks.filter(status='assigned').count(),
                'in_progress_tasks': tasks.filter(status='in_progress').count(),
                'completed_tasks': tasks.filter(status='completed').count(),
                'approved_tasks': tasks.filter(status='approved').count(),
                'disputed_tasks': tasks.filter(status='disputed').count()
            }
            
            # Calculate overall progress
            total_estimated_hours = tasks.aggregate(Sum('estimated_hours'))['estimated_hours__sum'] or 0
            completed_hours = 0
            
            # Get detailed task progress
            task_progress = []
            for task in tasks.select_related('assigned_developer').prefetch_related('assignment'):
                assignment = getattr(task, 'assignment', None)
                
                # Calculate completed hours based on progress percentage
                task_completed_hours = (task.completion_percentage / 100) * task.estimated_hours
                completed_hours += task_completed_hours
                
                task_info = {
                    'id': str(task.id),
                    'title': task.title,
                    'status': task.status,
                    'priority': task.priority,
                    'estimated_hours': task.estimated_hours,
                    'completion_percentage': task.completion_percentage,
                    'completed_hours': task_completed_hours,
                    'assigned_developer': {
                        'id': task.assigned_developer.id,
                        'username': task.assigned_developer.username,
                        'name': f"{task.assigned_developer.first_name} {task.assigned_developer.last_name}".strip()
                    } if task.assigned_developer else None,
                    'assignment_details': {
                        'hours_logged': float(assignment.hours_logged) if assignment else 0,
                        'progress_percentage': assignment.progress_percentage if assignment else 0,
                        'last_activity_date': assignment.last_activity_date if assignment else None,
                        'expected_completion_date': assignment.expected_completion_date if assignment else None
                    } if assignment else None,
                    'dependencies': [str(dep.id) for dep in task.dependencies.all()],
                    'created_at': task.created_at,
                    'updated_at': task.updated_at
                }
                task_progress.append(task_info)
            
            # Calculate timeline progress
            overall_progress_percentage = (completed_hours / total_estimated_hours * 100) if total_estimated_hours > 0 else 0
            
            # Get critical path analysis
            critical_path_tasks = []
            resource_allocation = getattr(project, 'resource_allocation', None)
            if resource_allocation and resource_allocation.critical_path_tasks:
                critical_task_ids = resource_allocation.critical_path_tasks
                critical_tasks = tasks.filter(id__in=critical_task_ids)
                for task in critical_tasks:
                    critical_path_tasks.append({
                        'id': str(task.id),
                        'title': task.title,
                        'status': task.status,
                        'completion_percentage': task.completion_percentage,
                        'estimated_hours': task.estimated_hours
                    })
            
            progress_data = {
                'project_id': str(project.id),
                'project_title': project.title,
                'task_statistics': task_stats,
                'overall_progress': {
                    'completion_percentage': overall_progress_percentage,
                    'total_estimated_hours': total_estimated_hours,
                    'completed_hours': completed_hours,
                    'remaining_hours': total_estimated_hours - completed_hours
                },
                'task_progress': task_progress,
                'critical_path_tasks': critical_path_tasks,
                'timeline_analysis': {
                    'planned_start_date': resource_allocation.planned_start_date if resource_allocation else None,
                    'planned_end_date': resource_allocation.planned_end_date if resource_allocation else None,
                    'current_projected_end_date': resource_allocation.current_projected_end_date if resource_allocation else None,
                    'timeline_risk_level': resource_allocation.timeline_risk_level if resource_allocation else 'low'
                } if resource_allocation else None
            }
            
            return Response(progress_data)
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'], url_path='team-management')
    def get_team_management(self, request, pk=None):
        """
        Get team member management interface data
        Requirements: 6.2 - Team member management interface
        """
        try:
            project = Project.objects.get(id=pk)
            user_role = self.get_project_access(project, request.user)
            
            if not user_role:
                return Response(
                    {'error': 'Access denied to this project'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get current team members with detailed information
            team_members = []
            
            # Add client
            team_members.append({
                'id': project.client.id,
                'username': project.client.username,
                'name': f"{project.client.first_name} {project.client.last_name}".strip(),
                'email': project.client.email,
                'role': 'client',
                'tasks_assigned': 0,
                'tasks_completed': 0,
                'total_hours_logged': 0,
                'total_earnings': 0,
                'last_activity': project.client.last_active,
                'profile': None
            })
            
            # Add senior developer
            if project.senior_developer:
                senior_tasks = project.tasks.filter(assigned_developer=project.senior_developer)
                senior_assignments = TaskAssignment.objects.filter(
                    task__project=project, developer=project.senior_developer
                )
                
                team_members.append({
                    'id': project.senior_developer.id,
                    'username': project.senior_developer.username,
                    'name': f"{project.senior_developer.first_name} {project.senior_developer.last_name}".strip(),
                    'email': project.senior_developer.email,
                    'role': 'senior_developer',
                    'tasks_assigned': senior_tasks.count(),
                    'tasks_completed': senior_tasks.filter(status='completed').count(),
                    'total_hours_logged': senior_assignments.aggregate(Sum('hours_logged'))['hours_logged__sum'] or 0,
                    'total_earnings': senior_assignments.aggregate(Sum('spent_budget'))['spent_budget__sum'] or 0,
                    'last_activity': project.senior_developer.last_active,
                    'profile': {
                        'experience_level': getattr(project.senior_developer.developer_profile, 'experience_level', None),
                        'skills': getattr(project.senior_developer.developer_profile, 'skills', []),
                        'hourly_rate': float(getattr(project.senior_developer.developer_profile, 'hourly_rate', 0)),
                        'reputation_score': getattr(project.senior_developer.developer_profile, 'reputation_score', 0),
                        'projects_completed': getattr(project.senior_developer.developer_profile, 'projects_completed', 0)
                    } if hasattr(project.senior_developer, 'developer_profile') else None
                })
            
            # Add other developers
            assigned_developers = User.objects.filter(
                assigned_tasks__project=project
            ).exclude(
                id__in=[project.client.id] + ([project.senior_developer.id] if project.senior_developer else [])
            ).distinct()
            
            for developer in assigned_developers:
                dev_tasks = project.tasks.filter(assigned_developer=developer)
                dev_assignments = TaskAssignment.objects.filter(
                    task__project=project, developer=developer
                )
                
                team_members.append({
                    'id': developer.id,
                    'username': developer.username,
                    'name': f"{developer.first_name} {developer.last_name}".strip(),
                    'email': developer.email,
                    'role': 'developer',
                    'tasks_assigned': dev_tasks.count(),
                    'tasks_completed': dev_tasks.filter(status='completed').count(),
                    'total_hours_logged': dev_assignments.aggregate(Sum('hours_logged'))['hours_logged__sum'] or 0,
                    'total_earnings': dev_assignments.aggregate(Sum('spent_budget'))['spent_budget__sum'] or 0,
                    'last_activity': developer.last_active,
                    'profile': {
                        'experience_level': getattr(developer.developer_profile, 'experience_level', None),
                        'skills': getattr(developer.developer_profile, 'skills', []),
                        'hourly_rate': float(getattr(developer.developer_profile, 'hourly_rate', 0)),
                        'reputation_score': getattr(developer.developer_profile, 'reputation_score', 0),
                        'projects_completed': getattr(developer.developer_profile, 'projects_completed', 0)
                    } if hasattr(developer, 'developer_profile') else None
                })
            
            # Get pending invitations
            pending_invitations = TeamInvitation.objects.filter(
                task__project=project, status='pending'
            ).select_related('developer', 'task')
            
            invitation_data = []
            for invitation in pending_invitations:
                invitation_data.append({
                    'id': str(invitation.id),
                    'task': {
                        'id': str(invitation.task.id),
                        'title': invitation.task.title,
                        'required_skills': invitation.task.required_skills
                    },
                    'developer': {
                        'id': invitation.developer.id,
                        'username': invitation.developer.username,
                        'name': f"{invitation.developer.first_name} {invitation.developer.last_name}".strip(),
                        'profile': {
                            'experience_level': getattr(invitation.developer.developer_profile, 'experience_level', None),
                            'skills': getattr(invitation.developer.developer_profile, 'skills', []),
                            'hourly_rate': float(getattr(invitation.developer.developer_profile, 'hourly_rate', 0))
                        } if hasattr(invitation.developer, 'developer_profile') else None
                    },
                    'match_score': invitation.match_score,
                    'offered_rate': float(invitation.offered_rate),
                    'estimated_hours': invitation.estimated_hours,
                    'invited_at': invitation.invited_at,
                    'expires_at': invitation.expires_at,
                    'invitation_rank': invitation.invitation_rank
                })
            
            # Get team performance metrics
            total_assignments = TaskAssignment.objects.filter(task__project=project)
            team_metrics = {
                'total_team_size': len(team_members),
                'active_developers': len([m for m in team_members if m['role'] in ['developer', 'senior_developer']]),
                'average_completion_rate': 0,
                'total_hours_logged': total_assignments.aggregate(Sum('hours_logged'))['hours_logged__sum'] or 0,
                'total_budget_spent': total_assignments.aggregate(Sum('spent_budget'))['spent_budget__sum'] or 0,
                'average_hourly_rate': total_assignments.aggregate(Avg('agreed_rate'))['agreed_rate__avg'] or 0
            }
            
            # Calculate average completion rate
            if team_metrics['active_developers'] > 0:
                completion_rates = []
                for member in team_members:
                    if member['role'] in ['developer', 'senior_developer'] and member['tasks_assigned'] > 0:
                        completion_rate = (member['tasks_completed'] / member['tasks_assigned']) * 100
                        completion_rates.append(completion_rate)
                
                if completion_rates:
                    team_metrics['average_completion_rate'] = sum(completion_rates) / len(completion_rates)
            
            team_management_data = {
                'project_id': str(project.id),
                'project_title': project.title,
                'user_role': user_role,
                'team_members': team_members,
                'pending_invitations': invitation_data,
                'team_metrics': team_metrics,
                'permissions': {
                    'can_invite_members': user_role in ['client', 'senior_developer', 'admin'],
                    'can_remove_members': user_role in ['client', 'admin'],
                    'can_view_earnings': user_role in ['client', 'senior_developer', 'admin'],
                    'can_manage_assignments': user_role in ['senior_developer', 'admin']
                }
            }
            
            return Response(team_management_data)
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'], url_path='budget-timeline')
    def get_budget_timeline_status(self, request, pk=None):
        """
        Get timeline and budget status monitoring data
        Requirements: 6.2 - Timeline and budget status monitoring
        """
        try:
            project = Project.objects.get(id=pk)
            user_role = self.get_project_access(project, request.user)
            
            if not user_role:
                return Response(
                    {'error': 'Access denied to this project'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get resource allocation
            resource_allocation = getattr(project, 'resource_allocation', None)
            
            # Get budget breakdown
            total_assignments = TaskAssignment.objects.filter(task__project=project)
            budget_data = {
                'total_budget': float(resource_allocation.total_budget) if resource_allocation else 0,
                'allocated_budget': float(resource_allocation.allocated_budget) if resource_allocation else 0,
                'spent_budget': float(total_assignments.aggregate(Sum('spent_budget'))['spent_budget__sum'] or 0),
                'remaining_budget': float(resource_allocation.remaining_budget) if resource_allocation else 0,
                'budget_risk_level': resource_allocation.budget_risk_level if resource_allocation else 'low',
                'budget_breakdown': []
            }
            
            # Get budget breakdown by task/developer
            for assignment in total_assignments:
                budget_data['budget_breakdown'].append({
                    'task_title': assignment.task.title,
                    'developer': assignment.developer.username,
                    'allocated_budget': float(assignment.allocated_budget),
                    'spent_budget': float(assignment.spent_budget),
                    'agreed_rate': float(assignment.agreed_rate),
                    'hours_logged': float(assignment.hours_logged),
                    'progress_percentage': assignment.progress_percentage
                })
            
            # Get milestone payment status
            milestones = Milestone.objects.filter(project=project).order_by('percentage')
            milestone_data = []
            total_milestone_amount = 0
            paid_milestone_amount = 0
            
            for milestone in milestones:
                total_milestone_amount += float(milestone.amount)
                if milestone.status == 'paid':
                    paid_milestone_amount += float(milestone.amount)
                
                milestone_data.append({
                    'id': str(milestone.id),
                    'percentage': milestone.percentage,
                    'amount': float(milestone.amount),
                    'status': milestone.status,
                    'due_date': milestone.due_date,
                    'paid_date': milestone.paid_date,
                    'is_overdue': milestone.due_date < timezone.now().date() if milestone.due_date and milestone.status != 'paid' else False
                })
            
            # Get timeline data
            timeline_data = {
                'planned_start_date': resource_allocation.planned_start_date if resource_allocation else None,
                'planned_end_date': resource_allocation.planned_end_date if resource_allocation else None,
                'current_projected_end_date': resource_allocation.current_projected_end_date if resource_allocation else None,
                'timeline_risk_level': resource_allocation.timeline_risk_level if resource_allocation else 'low',
                'overall_progress_percentage': resource_allocation.overall_progress_percentage if resource_allocation else 0,
                'days_elapsed': 0,
                'days_remaining': 0,
                'is_behind_schedule': False
            }
            
            # Calculate timeline metrics
            if resource_allocation and resource_allocation.planned_start_date and resource_allocation.planned_end_date:
                start_date = resource_allocation.planned_start_date
                end_date = resource_allocation.planned_end_date
                current_date = timezone.now().date()
                
                total_days = (end_date - start_date.date()).days if hasattr(start_date, 'date') else (end_date - start_date).days
                elapsed_days = (current_date - (start_date.date() if hasattr(start_date, 'date') else start_date)).days
                remaining_days = (end_date - current_date).days
                
                timeline_data.update({
                    'total_project_days': total_days,
                    'days_elapsed': max(0, elapsed_days),
                    'days_remaining': max(0, remaining_days),
                    'is_behind_schedule': (elapsed_days / total_days * 100) > timeline_data['overall_progress_percentage'] if total_days > 0 else False
                })
            
            # Get task timeline breakdown
            task_timeline = []
            tasks = project.tasks.select_related('assigned_developer').prefetch_related('assignment')
            
            for task in tasks:
                assignment = getattr(task, 'assignment', None)
                task_timeline.append({
                    'id': str(task.id),
                    'title': task.title,
                    'status': task.status,
                    'completion_percentage': task.completion_percentage,
                    'estimated_hours': task.estimated_hours,
                    'assigned_developer': task.assigned_developer.username if task.assigned_developer else None,
                    'start_date': assignment.start_date if assignment else None,
                    'expected_completion_date': assignment.expected_completion_date if assignment else None,
                    'actual_completion_date': assignment.actual_completion_date if assignment else None,
                    'is_overdue': (
                        assignment.expected_completion_date < timezone.now().date() 
                        if assignment and assignment.expected_completion_date and task.status != 'completed' 
                        else False
                    )
                })
            
            budget_timeline_data = {
                'project_id': str(project.id),
                'project_title': project.title,
                'user_role': user_role,
                'budget': budget_data,
                'milestones': {
                    'total_amount': total_milestone_amount,
                    'paid_amount': paid_milestone_amount,
                    'remaining_amount': total_milestone_amount - paid_milestone_amount,
                    'milestones': milestone_data
                },
                'timeline': timeline_data,
                'task_timeline': task_timeline,
                'risk_assessment': {
                    'budget_risk_level': resource_allocation.budget_risk_level if resource_allocation else 'low',
                    'timeline_risk_level': resource_allocation.timeline_risk_level if resource_allocation else 'low',
                    'resource_risk_level': resource_allocation.resource_risk_level if resource_allocation else 'low',
                    'overall_risk_level': 'high' if any([
                        resource_allocation.budget_risk_level == 'high' if resource_allocation else False,
                        resource_allocation.timeline_risk_level == 'high' if resource_allocation else False,
                        resource_allocation.resource_risk_level == 'high' if resource_allocation else False
                    ]) else 'medium' if any([
                        resource_allocation.budget_risk_level == 'medium' if resource_allocation else False,
                        resource_allocation.timeline_risk_level == 'medium' if resource_allocation else False,
                        resource_allocation.resource_risk_level == 'medium' if resource_allocation else False
                    ]) else 'low'
                }
            }
            
            return Response(budget_timeline_data)
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get', 'post'], url_path='documents')
    def manage_documents(self, request, pk=None):
        """
        Manage document sharing and project navigation capabilities
        Requirements: 6.3 - Document sharing and project navigation capabilities
        """
        try:
            project = Project.objects.get(id=pk)
            user_role = self.get_project_access(project, request.user)
            
            if not user_role:
                return Response(
                    {'error': 'Access denied to this project'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if request.method == 'GET':
                # Get project documents and attachments
                documents = {
                    'project_attachments': project.attachments or [],
                    'proposal_documents': [],
                    'task_documents': [],
                    'shared_documents': []
                }
                
                # Get proposal documents
                proposal = getattr(project, 'proposal', None)
                if proposal:
                    documents['proposal_documents'] = [
                        {
                            'type': 'proposal',
                            'title': 'Project Proposal',
                            'content': {
                                'current_budget': float(proposal.current_budget),
                                'current_timeline': str(proposal.current_timeline),
                                'current_task_breakdown': proposal.current_task_breakdown,
                                'current_sla_terms': proposal.current_sla_terms,
                                'status': proposal.status,
                                'is_locked': proposal.is_locked
                            },
                            'created_at': proposal.created_at,
                            'updated_at': proposal.updated_at
                        }
                    ]
                
                # Get task-related documents
                tasks = project.tasks.all()
                for task in tasks:
                    if hasattr(task, 'assignment') and task.assignment:
                        assignment = task.assignment
                        documents['task_documents'].append({
                            'type': 'task_assignment',
                            'title': f'Assignment: {task.title}',
                            'task_id': str(task.id),
                            'content': {
                                'agreed_rate': float(assignment.agreed_rate),
                                'agreed_hours': assignment.agreed_hours,
                                'progress_percentage': assignment.progress_percentage,
                                'hours_logged': float(assignment.hours_logged),
                                'status': assignment.status
                            },
                            'created_at': assignment.created_at,
                            'updated_at': assignment.updated_at
                        })
                
                # Get AI analysis documents
                if project.ai_analysis:
                    documents['shared_documents'].append({
                        'type': 'ai_analysis',
                        'title': 'AI Project Analysis',
                        'content': project.ai_analysis,
                        'created_at': project.created_at,
                        'updated_at': project.updated_at
                    })
                
                return Response({
                    'project_id': str(project.id),
                    'project_title': project.title,
                    'user_role': user_role,
                    'documents': documents,
                    'permissions': {
                        'can_upload_documents': user_role in ['client', 'senior_developer', 'admin'],
                        'can_view_all_documents': user_role in ['client', 'senior_developer', 'admin'],
                        'can_delete_documents': user_role in ['client', 'admin']
                    }
                })
            
            elif request.method == 'POST':
                # Add new document/attachment
                if user_role not in ['client', 'senior_developer', 'admin']:
                    return Response(
                        {'error': 'Insufficient permissions to upload documents'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                document_type = request.data.get('type', 'attachment')
                title = request.data.get('title', '')
                url = request.data.get('url', '')
                description = request.data.get('description', '')
                
                if not title or not url:
                    return Response(
                        {'error': 'Title and URL are required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Add to project attachments
                if not project.attachments:
                    project.attachments = []
                
                new_document = {
                    'id': str(uuid.uuid4()),
                    'type': document_type,
                    'title': title,
                    'url': url,
                    'description': description,
                    'uploaded_by': request.user.username,
                    'uploaded_at': timezone.now().isoformat()
                }
                
                project.attachments.append(new_document)
                project.save()
                
                return Response({
                    'message': 'Document uploaded successfully',
                    'document': new_document
                }, status=status.HTTP_201_CREATED)
                
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'], url_path='github-integration')
    def get_github_integration(self, request, pk=None):
        """
        Integrate GitHub repository access and code review functionality
        Requirements: 6.4 - GitHub repository access and code review functionality
        """
        try:
            project = Project.objects.get(id=pk)
            user_role = self.get_project_access(project, request.user)
            
            if not user_role:
                return Response(
                    {'error': 'Access denied to this project'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            github_data = {
                'project_id': str(project.id),
                'project_title': project.title,
                'user_role': user_role,
                'repositories': [],
                'team_github_profiles': [],
                'code_review_access': False,
                'permissions': {
                    'can_view_repositories': user_role in ['client', 'senior_developer', 'admin'],
                    'can_access_code_reviews': user_role in ['senior_developer', 'admin'],
                    'can_manage_repository_access': user_role in ['client', 'admin']
                }
            }
            
            # Get GitHub profiles of team members
            team_members = []
            if project.senior_developer and project.senior_developer.github_username:
                team_members.append(project.senior_developer)
            
            assigned_developers = User.objects.filter(
                assigned_tasks__project=project,
                github_username__isnull=False
            ).distinct()
            team_members.extend(assigned_developers)
            
            github_client = GitHubClient()
            
            for member in team_members:
                if member.github_username:
                    try:
                        # Get GitHub profile information
                        profile_info = {
                            'user_id': member.id,
                            'username': member.username,
                            'github_username': member.github_username,
                            'role': 'senior_developer' if member == project.senior_developer else 'developer',
                            'repositories': [],
                            'recent_activity': []
                        }
                        
                        # Get user's repositories (if accessible)
                        try:
                            repos = github_client.get_user_repositories(member.github_username)
                            for repo in repos[:5]:  # Limit to 5 most recent repos
                                profile_info['repositories'].append({
                                    'name': repo.get('name', ''),
                                    'full_name': repo.get('full_name', ''),
                                    'description': repo.get('description', ''),
                                    'language': repo.get('language', ''),
                                    'stars': repo.get('stargazers_count', 0),
                                    'forks': repo.get('forks_count', 0),
                                    'updated_at': repo.get('updated_at', ''),
                                    'html_url': repo.get('html_url', '')
                                })
                        except Exception as e:
                            profile_info['repositories_error'] = str(e)
                        
                        github_data['team_github_profiles'].append(profile_info)
                        
                    except Exception as e:
                        github_data['team_github_profiles'].append({
                            'user_id': member.id,
                            'username': member.username,
                            'github_username': member.github_username,
                            'error': f'Failed to fetch GitHub data: {str(e)}'
                        })
            
            # Check if project has associated repositories
            if project.ai_analysis and 'github_repositories' in project.ai_analysis:
                github_repos = project.ai_analysis['github_repositories']
                for repo_info in github_repos:
                    try:
                        repo_data = github_client.get_repository_info(repo_info.get('full_name', ''))
                        if repo_data:
                            github_data['repositories'].append({
                                'name': repo_data.get('name', ''),
                                'full_name': repo_data.get('full_name', ''),
                                'description': repo_data.get('description', ''),
                                'language': repo_data.get('language', ''),
                                'stars': repo_data.get('stargazers_count', 0),
                                'forks': repo_data.get('forks_count', 0),
                                'open_issues': repo_data.get('open_issues_count', 0),
                                'updated_at': repo_data.get('updated_at', ''),
                                'html_url': repo_data.get('html_url', ''),
                                'clone_url': repo_data.get('clone_url', ''),
                                'ssh_url': repo_data.get('ssh_url', ''),
                                'default_branch': repo_data.get('default_branch', 'main')
                            })
                    except Exception as e:
                        github_data['repositories'].append({
                            'full_name': repo_info.get('full_name', ''),
                            'error': f'Failed to fetch repository data: {str(e)}'
                        })
            
            # Enable code review access for senior developers
            if user_role in ['senior_developer', 'admin']:
                github_data['code_review_access'] = True
                
                # Get recent commits and pull requests for project repositories
                for repo in github_data['repositories']:
                    if 'error' not in repo:
                        try:
                            # Get recent commits
                            commits = github_client.get_repository_commits(repo['full_name'], limit=5)
                            repo['recent_commits'] = [{
                                'sha': commit.get('sha', '')[:8],
                                'message': commit.get('commit', {}).get('message', ''),
                                'author': commit.get('commit', {}).get('author', {}).get('name', ''),
                                'date': commit.get('commit', {}).get('author', {}).get('date', ''),
                                'html_url': commit.get('html_url', '')
                            } for commit in commits]
                            
                            # Get open pull requests
                            pull_requests = github_client.get_repository_pull_requests(repo['full_name'], state='open')
                            repo['open_pull_requests'] = [{
                                'number': pr.get('number', 0),
                                'title': pr.get('title', ''),
                                'author': pr.get('user', {}).get('login', ''),
                                'created_at': pr.get('created_at', ''),
                                'html_url': pr.get('html_url', '')
                            } for pr in pull_requests[:5]]
                            
                        except Exception as e:
                            repo['github_error'] = str(e)
            
            return Response(github_data)
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'GitHub integration error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='update-status')
    def update_project_status(self, request, pk=None):
        """
        Update project status with role-based permissions
        """
        try:
            project = Project.objects.get(id=pk)
            user_role = self.get_project_access(project, request.user)
            
            if not user_role:
                return Response(
                    {'error': 'Access denied to this project'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Only client and senior developer can update project status
            if user_role not in ['client', 'senior_developer', 'admin']:
                return Response(
                    {'error': 'Insufficient permissions to update project status'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            new_status = request.data.get('status')
            if not new_status:
                return Response(
                    {'error': 'Status is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            valid_statuses = [choice[0] for choice in Project.STATUS_CHOICES]
            if new_status not in valid_statuses:
                return Response(
                    {'error': f'Invalid status. Valid options: {valid_statuses}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            old_status = project.status
            project.status = new_status
            project.save()
            
            # Update resource allocation if exists
            resource_allocation = getattr(project, 'resource_allocation', None)
            if resource_allocation:
                resource_allocation.updated_at = timezone.now()
                resource_allocation.save()
            
            return Response({
                'message': f'Project status updated from {old_status} to {new_status}',
                'project': {
                    'id': str(project.id),
                    'title': project.title,
                    'status': project.status,
                    'updated_at': project.updated_at
                }
            })
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], url_path='navigation')
    def get_project_navigation(self, request):
        """
        Get project navigation data for multi-project dashboard
        Requirements: 6.3 - Project navigation capabilities
        """
        user = request.user
        
        # Get all projects user has access to
        user_projects = Project.objects.filter(
            Q(client=user) | 
            Q(senior_developer=user) | 
            Q(tasks__assigned_developer=user)
        ).distinct().order_by('-updated_at')
        
        navigation_data = {
            'user_id': user.id,
            'user_role': user.role,
            'projects': [],
            'quick_stats': {
                'total_projects': user_projects.count(),
                'active_projects': user_projects.filter(status='in_progress').count(),
                'pending_tasks': 0,
                'overdue_tasks': 0
            }
        }
        
        for project in user_projects:
            user_role = self.get_project_access(project, user)
            
            # Get project quick stats
            total_tasks = project.tasks.count()
            completed_tasks = project.tasks.filter(status='completed').count()
            pending_tasks = project.tasks.filter(status='pending').count()
            
            # Count overdue tasks
            overdue_tasks = 0
            for task in project.tasks.filter(status__in=['assigned', 'in_progress']):
                assignment = getattr(task, 'assignment', None)
                if assignment and assignment.expected_completion_date:
                    if assignment.expected_completion_date < timezone.now().date():
                        overdue_tasks += 1
            
            navigation_data['quick_stats']['pending_tasks'] += pending_tasks
            navigation_data['quick_stats']['overdue_tasks'] += overdue_tasks
            
            project_nav = {
                'id': str(project.id),
                'title': project.title,
                'status': project.status,
                'user_role': user_role,
                'progress_percentage': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'pending_tasks': pending_tasks,
                'overdue_tasks': overdue_tasks,
                'team_size': User.objects.filter(
                    Q(assigned_tasks__project=project) |
                    Q(id=project.senior_developer_id) if project.senior_developer else Q()
                ).distinct().count(),
                'last_activity': project.updated_at,
                'client': project.client.username,
                'senior_developer': project.senior_developer.username if project.senior_developer else None,
                'budget_info': {
                    'total_budget': float(getattr(project, 'resource_allocation', None).total_budget) if hasattr(project, 'resource_allocation') and project.resource_allocation else 0,
                    'budget_risk_level': getattr(project, 'resource_allocation', None).budget_risk_level if hasattr(project, 'resource_allocation') and project.resource_allocation else 'low'
                }
            }
            
            navigation_data['projects'].append(project_nav)
        
        return Response(navigation_data)


import uuid