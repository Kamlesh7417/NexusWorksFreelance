"""
Team Hiring Service

This service handles dynamic team hiring and task assignment including:
- Automatic team member invitation system using AI matching
- Dynamic pricing calculation based on task complexity and skills
- Task assignment workflow with acceptance/decline handling
- Automatic fallback to next best match for declined invitations
- Timeline and resource allocation management
"""

from django.contrib.auth import get_user_model
from django.db import transaction, models
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from typing import List, Dict, Optional, Tuple
import logging

from .models import (
    Project, Task, TeamInvitation, TaskAssignment, 
    DynamicPricing, ResourceAllocation
)
from matching.models import DeveloperMatch
from users.models import DeveloperProfile
from ai_services.hybrid_rag_service import hybrid_rag_service

User = get_user_model()
logger = logging.getLogger(__name__)


class TeamHiringService:
    """Service for managing dynamic team hiring and task assignment"""
    
    # Pricing calculation constants
    BASE_RATE_MULTIPLIERS = {
        'simple': 1.0,
        'moderate': 1.2,
        'complex': 1.5,
        'expert': 2.0
    }
    
    SKILL_RARITY_BONUS = {
        'common': 0.0,
        'uncommon': 0.1,
        'rare': 0.25,
        'expert': 0.4
    }
    
    URGENCY_MULTIPLIERS = {
        'low': 1.0,
        'medium': 1.1,
        'high': 1.25,
        'critical': 1.5
    }
    
    @classmethod
    def initiate_team_hiring(cls, project: Project, task_ids: List[str] = None, 
                           max_invitations_per_task: int = 3,
                           invitation_expiry_hours: int = 72) -> Dict:
        """
        Initiate automatic team hiring for a project
        
        Args:
            project: The project to hire team members for
            task_ids: Optional list of specific task IDs to hire for
            max_invitations_per_task: Maximum invitations to send per task
            invitation_expiry_hours: Hours until invitations expire
            
        Returns:
            Dictionary with hiring results
        """
        logger.info(f"Initiating team hiring for project: {project.title}")
        
        # Validate project status
        if project.status != 'team_assembly':
            raise ValueError(f"Project must be in 'team_assembly' status, current: {project.status}")
        
        # Get tasks to hire for
        if task_ids:
            tasks = Task.objects.filter(id__in=task_ids, project=project)
        else:
            tasks = project.tasks.filter(status='pending')
        
        if not tasks.exists():
            raise ValueError("No eligible tasks found for hiring")
        
        # Initialize or update resource allocation
        resource_allocation = cls._initialize_resource_allocation(project)
        
        hiring_results = {
            'project_id': str(project.id),
            'tasks_processed': 0,
            'invitations_sent': 0,
            'pricing_calculated': 0,
            'errors': []
        }
        
        with transaction.atomic():
            for task in tasks:
                try:
                    task_result = cls._process_task_hiring(
                        task, max_invitations_per_task, invitation_expiry_hours
                    )
                    
                    hiring_results['tasks_processed'] += 1
                    hiring_results['invitations_sent'] += task_result['invitations_sent']
                    hiring_results['pricing_calculated'] += 1
                    
                except Exception as e:
                    logger.error(f"Error processing task {task.id}: {str(e)}")
                    hiring_results['errors'].append({
                        'task_id': str(task.id),
                        'error': str(e)
                    })
            
            # Update resource allocation
            cls._update_resource_allocation(resource_allocation)
            
            # Update project status if all tasks processed successfully
            if hiring_results['tasks_processed'] > 0 and not hiring_results['errors']:
                project.status = 'in_progress'
                project.save()
        
        logger.info(f"Team hiring completed: {hiring_results}")
        return hiring_results
    
    @classmethod
    def _process_task_hiring(cls, task: Task, max_invitations: int, 
                           expiry_hours: int) -> Dict:
        """Process hiring for a single task"""
        
        # Calculate dynamic pricing
        pricing = cls._calculate_dynamic_pricing(task)
        
        # Find matching developers
        matches = cls._find_task_matches(task, max_invitations * 2)  # Get extra for fallbacks
        
        if not matches:
            raise ValueError(f"No suitable developers found for task: {task.title}")
        
        # Send invitations
        invitations = cls._send_task_invitations(
            task, matches[:max_invitations], pricing, expiry_hours
        )
        
        # Update task status
        task.status = 'assigned'
        task.save()
        
        return {
            'task_id': str(task.id),
            'invitations_sent': len(invitations),
            'pricing': pricing,
            'matches_found': len(matches)
        }
    
    @classmethod
    def _calculate_dynamic_pricing(cls, task: Task) -> DynamicPricing:
        """Calculate dynamic pricing for a task"""
        
        # Determine complexity level
        complexity_level = cls._assess_task_complexity(task)
        
        # Get base rate from market data or default
        base_rate = cls._get_market_base_rate(task.required_skills)
        
        # Calculate multipliers
        complexity_multiplier = cls.BASE_RATE_MULTIPLIERS[complexity_level]
        skill_premium = cls._calculate_skill_premium(task.required_skills)
        rare_skills_bonus = cls._calculate_rare_skills_bonus(task.required_skills)
        demand_multiplier = cls._calculate_demand_multiplier(task.required_skills)
        urgency_multiplier = cls._calculate_urgency_multiplier(task)
        
        # Calculate final rate
        calculated_rate = base_rate * complexity_multiplier * demand_multiplier * urgency_multiplier
        calculated_rate += skill_premium + rare_skills_bonus
        
        # Set min/max bounds
        min_rate = calculated_rate * Decimal('0.8')
        max_rate = calculated_rate * Decimal('1.3')
        
        # Store calculation factors
        calculation_factors = {
            'base_rate': float(base_rate),
            'complexity_level': complexity_level,
            'complexity_multiplier': complexity_multiplier,
            'skill_premium': float(skill_premium),
            'rare_skills_bonus': float(rare_skills_bonus),
            'demand_multiplier': demand_multiplier,
            'urgency_multiplier': urgency_multiplier,
            'market_conditions': cls._get_market_conditions()
        }
        
        # Create or update pricing record
        pricing, created = DynamicPricing.objects.update_or_create(
            task=task,
            defaults={
                'base_rate': base_rate,
                'complexity_level': complexity_level,
                'complexity_multiplier': complexity_multiplier,
                'skill_premium': skill_premium,
                'rare_skills_bonus': rare_skills_bonus,
                'demand_multiplier': demand_multiplier,
                'urgency_multiplier': urgency_multiplier,
                'calculated_rate': calculated_rate,
                'min_rate': min_rate,
                'max_rate': max_rate,
                'calculation_factors': calculation_factors
            }
        )
        
        logger.info(f"Dynamic pricing calculated for task {task.id}: ${calculated_rate}/hr")
        return pricing
    
    @classmethod
    def _find_task_matches(cls, task: Task, limit: int) -> List[Dict]:
        """Find matching developers for a task using AI matching"""
        
        # Prepare task data for matching
        task_data = {
            'id': str(task.id),
            'title': task.title,
            'description': task.description,
            'required_skills': task.required_skills,
            'estimated_hours': task.estimated_hours,
            'priority': task.priority,
            'project_id': str(task.project.id),
            'project_title': task.project.title,
            'complexity': task.project.ai_analysis.get('complexity', 'medium') if task.project.ai_analysis else 'medium'
        }
        
        # Use hybrid RAG service for intelligent matching
        matches = hybrid_rag_service.find_matching_developers(
            task_data, limit, include_analysis=True
        )
        
        # Filter out unavailable developers
        available_matches = []
        for match in matches:
            try:
                developer = User.objects.get(id=match['developer_id'])
                profile = getattr(developer, 'developer_profile', None)
                
                if profile and profile.availability_status == 'available':
                    match['developer'] = developer
                    match['profile'] = profile
                    available_matches.append(match)
                    
            except User.DoesNotExist:
                continue
        
        return available_matches
    
    @classmethod
    def _send_task_invitations(cls, task: Task, matches: List[Dict], 
                             pricing: DynamicPricing, expiry_hours: int) -> List[TeamInvitation]:
        """Send invitations to matched developers"""
        
        invitations = []
        expires_at = timezone.now() + timedelta(hours=expiry_hours)
        
        for rank, match in enumerate(matches, 1):
            developer = match['developer']
            
            # Calculate personalized offer rate based on developer's profile
            offered_rate = cls._calculate_personalized_rate(
                pricing, match['profile'], match.get('final_score', 0.8)
            )
            
            # Estimate completion date
            estimated_completion_date = cls._estimate_completion_date(
                task, match['profile']
            )
            
            invitation = TeamInvitation.objects.create(
                task=task,
                developer=developer,
                match_score=match.get('final_score', 0.8),
                offered_rate=offered_rate,
                estimated_hours=task.estimated_hours,
                estimated_completion_date=estimated_completion_date,
                expires_at=expires_at,
                invitation_rank=rank,
                is_fallback=rank > 1
            )
            
            invitations.append(invitation)
            logger.info(f"Invitation sent to {developer.username} for task {task.title}")
        
        return invitations
    
    @classmethod
    def respond_to_invitation(cls, invitation: TeamInvitation, action: str,
                            counter_offer_rate: Decimal = None,
                            decline_reason: str = None) -> Dict:
        """
        Handle developer response to team invitation
        
        Args:
            invitation: The invitation being responded to
            action: 'accept', 'decline', or 'counter_offer'
            counter_offer_rate: Rate for counter offer (if applicable)
            decline_reason: Reason for declining (if applicable)
            
        Returns:
            Dictionary with response results
        """
        logger.info(f"Processing invitation response: {action} from {invitation.developer.username}")
        
        if invitation.status != 'pending':
            raise ValueError(f"Invitation is not pending, current status: {invitation.status}")
        
        if timezone.now() > invitation.expires_at:
            invitation.status = 'expired'
            invitation.save()
            raise ValueError("Invitation has expired")
        
        with transaction.atomic():
            invitation.responded_at = timezone.now()
            
            if action == 'accept':
                return cls._handle_invitation_acceptance(invitation)
            
            elif action == 'decline':
                return cls._handle_invitation_decline(invitation, decline_reason)
            
            elif action == 'counter_offer':
                return cls._handle_counter_offer(invitation, counter_offer_rate)
            
            else:
                raise ValueError(f"Invalid action: {action}")
    
    @classmethod
    def _handle_invitation_acceptance(cls, invitation: TeamInvitation) -> Dict:
        """Handle invitation acceptance and create task assignment"""
        
        invitation.status = 'accepted'
        invitation.save()
        
        # Create task assignment
        assignment = TaskAssignment.objects.create(
            task=invitation.task,
            developer=invitation.developer,
            invitation=invitation,
            agreed_rate=invitation.offered_rate,
            agreed_hours=invitation.estimated_hours,
            start_date=timezone.now(),
            expected_completion_date=invitation.estimated_completion_date,
            allocated_budget=invitation.offered_rate * invitation.estimated_hours
        )
        
        # Update task status and assignment
        invitation.task.assigned_developer = invitation.developer
        invitation.task.status = 'in_progress'
        invitation.task.save()
        
        # Cancel other pending invitations for this task
        cls._cancel_other_invitations(invitation.task, invitation.id)
        
        # Update resource allocation
        cls._update_task_resource_allocation(invitation.task, assignment)
        
        logger.info(f"Task assignment created: {assignment.id}")
        
        return {
            'status': 'accepted',
            'assignment_id': str(assignment.id),
            'message': 'Invitation accepted and task assigned successfully'
        }
    
    @classmethod
    def _handle_invitation_decline(cls, invitation: TeamInvitation, reason: str) -> Dict:
        """Handle invitation decline and trigger fallback"""
        
        invitation.status = 'declined'
        invitation.decline_reason = reason
        invitation.save()
        
        # Trigger fallback hiring for this task
        fallback_result = cls._trigger_fallback_hiring(invitation.task)
        
        logger.info(f"Invitation declined, fallback triggered: {fallback_result}")
        
        return {
            'status': 'declined',
            'fallback_triggered': fallback_result['fallback_triggered'],
            'message': 'Invitation declined, searching for alternative developers'
        }
    
    @classmethod
    def _handle_counter_offer(cls, invitation: TeamInvitation, counter_rate: Decimal) -> Dict:
        """Handle counter offer from developer"""
        
        invitation.status = 'pending'  # Keep as pending for negotiation
        invitation.counter_offer_rate = counter_rate
        invitation.save()
        
        # Notify project stakeholders about counter offer
        # This would typically trigger a notification system
        
        logger.info(f"Counter offer received: ${counter_rate}/hr for task {invitation.task.title}")
        
        return {
            'status': 'counter_offer',
            'counter_rate': float(counter_rate),
            'message': 'Counter offer submitted, awaiting client response'
        }
    
    @classmethod
    def _trigger_fallback_hiring(cls, task: Task) -> Dict:
        """Trigger fallback hiring when invitations are declined"""
        
        # Check if there are any pending invitations
        pending_invitations = task.team_invitations.filter(status='pending').count()
        
        if pending_invitations > 0:
            return {'fallback_triggered': False, 'reason': 'Other invitations still pending'}
        
        # Find next best matches that haven't been invited
        existing_developer_ids = list(
            task.team_invitations.values_list('developer_id', flat=True)
        )
        
        # Get new matches excluding already invited developers
        all_matches = cls._find_task_matches(task, 10)
        new_matches = [
            match for match in all_matches 
            if match['developer'].id not in existing_developer_ids
        ]
        
        if not new_matches:
            return {'fallback_triggered': False, 'reason': 'No additional suitable developers found'}
        
        # Send invitation to next best match
        pricing = task.pricing
        next_match = new_matches[0]
        
        expires_at = timezone.now() + timedelta(hours=48)  # Shorter expiry for fallback
        
        invitation = TeamInvitation.objects.create(
            task=task,
            developer=next_match['developer'],
            match_score=next_match.get('final_score', 0.8),
            offered_rate=cls._calculate_personalized_rate(
                pricing, next_match['profile'], next_match.get('final_score', 0.8)
            ),
            estimated_hours=task.estimated_hours,
            estimated_completion_date=cls._estimate_completion_date(
                task, next_match['profile']
            ),
            expires_at=expires_at,
            invitation_rank=999,  # Mark as fallback
            is_fallback=True
        )
        
        logger.info(f"Fallback invitation sent to {next_match['developer'].username}")
        
        return {
            'fallback_triggered': True,
            'invitation_id': str(invitation.id),
            'developer': next_match['developer'].username
        }
    
    @classmethod
    def _cancel_other_invitations(cls, task: Task, accepted_invitation_id: str):
        """Cancel other pending invitations for a task"""
        
        other_invitations = task.team_invitations.filter(
            status='pending'
        ).exclude(id=accepted_invitation_id)
        
        other_invitations.update(
            status='cancelled',
            responded_at=timezone.now()
        )
        
        logger.info(f"Cancelled {other_invitations.count()} other invitations for task {task.id}")
    
    @classmethod
    def _initialize_resource_allocation(cls, project: Project) -> ResourceAllocation:
        """Initialize or get resource allocation for project"""
        
        resource_allocation, created = ResourceAllocation.objects.get_or_create(
            project=project,
            defaults={
                'total_budget': project.budget_estimate or Decimal('0'),
                'planned_start_date': timezone.now(),
                'planned_end_date': timezone.now() + (project.timeline_estimate or timedelta(days=30)),
                'current_projected_end_date': timezone.now() + (project.timeline_estimate or timedelta(days=30))
            }
        )
        
        return resource_allocation
    
    @classmethod
    def _update_resource_allocation(cls, resource_allocation: ResourceAllocation):
        """Update resource allocation with current project state"""
        
        project = resource_allocation.project
        
        # Count team members and assignments
        resource_allocation.total_team_members = project.tasks.filter(
            assigned_developer__isnull=False
        ).values('assigned_developer').distinct().count()
        
        resource_allocation.active_assignments = project.tasks.filter(
            status='in_progress'
        ).count()
        
        resource_allocation.pending_invitations = TeamInvitation.objects.filter(
            task__project=project,
            status='pending'
        ).count()
        
        # Calculate budget allocation
        allocated_budget = TaskAssignment.objects.filter(
            task__project=project
        ).aggregate(
            total=models.Sum('allocated_budget')
        )['total'] or Decimal('0')
        
        resource_allocation.allocated_budget = allocated_budget
        resource_allocation.remaining_budget = resource_allocation.total_budget - allocated_budget
        
        # Calculate progress
        total_tasks = project.tasks.count()
        completed_tasks = project.tasks.filter(status='completed').count()
        in_progress_tasks = project.tasks.filter(status='in_progress').count()
        pending_tasks = project.tasks.filter(status='pending').count()
        
        resource_allocation.tasks_completed = completed_tasks
        resource_allocation.tasks_in_progress = in_progress_tasks
        resource_allocation.tasks_pending = pending_tasks
        
        if total_tasks > 0:
            resource_allocation.overall_progress_percentage = int(
                (completed_tasks / total_tasks) * 100
            )
        
        # Calculate risk levels
        resource_allocation.budget_risk_level = cls._calculate_budget_risk(resource_allocation)
        resource_allocation.timeline_risk_level = cls._calculate_timeline_risk(resource_allocation)
        resource_allocation.resource_risk_level = cls._calculate_resource_risk(resource_allocation)
        
        resource_allocation.save()
        
        logger.info(f"Resource allocation updated for project {project.id}")
    
    # Helper methods for pricing calculations
    
    @classmethod
    def _assess_task_complexity(cls, task: Task) -> str:
        """Assess task complexity based on various factors"""
        
        complexity_score = 0
        
        # Factor in estimated hours (adjusted thresholds)
        if task.estimated_hours <= 8:
            complexity_score += 1
        elif task.estimated_hours <= 20:
            complexity_score += 2
        elif task.estimated_hours <= 50:
            complexity_score += 3
        else:
            complexity_score += 4
        
        # Factor in required skills count
        skill_count = len(task.required_skills)
        if skill_count <= 1:
            complexity_score += 1
        elif skill_count <= 3:
            complexity_score += 2
        elif skill_count <= 5:
            complexity_score += 3
        else:
            complexity_score += 4
        
        # Factor in dependencies
        dependency_count = task.dependencies.count()
        if dependency_count > 0:
            complexity_score += min(dependency_count, 2)
        
        # Factor in priority (higher priority = more complex)
        if task.priority >= 4:
            complexity_score += 2
        elif task.priority >= 3:
            complexity_score += 1
        
        # Map score to complexity level (adjusted thresholds)
        if complexity_score <= 3:
            return 'simple'
        elif complexity_score <= 5:
            return 'moderate'
        elif complexity_score <= 8:
            return 'complex'
        else:
            return 'expert'
    
    @classmethod
    def _get_market_base_rate(cls, required_skills: List[str]) -> Decimal:
        """Get market base rate for required skills"""
        
        # This would typically query market data
        # For now, use skill-based defaults
        skill_rates = {
            'python': 75,
            'django': 80,
            'react': 70,
            'javascript': 65,
            'typescript': 75,
            'node.js': 70,
            'aws': 85,
            'docker': 75,
            'kubernetes': 90,
            'machine learning': 95,
            'ai': 100,
            'blockchain': 110,
            'devops': 85
        }
        
        if not required_skills:
            return Decimal('65')  # Default rate
        
        # Calculate average rate for required skills
        total_rate = 0
        skill_count = 0
        
        for skill in required_skills:
            skill_lower = skill.lower()
            if skill_lower in skill_rates:
                total_rate += skill_rates[skill_lower]
                skill_count += 1
        
        if skill_count > 0:
            return Decimal(str(total_rate / skill_count))
        
        return Decimal('65')  # Default rate
    
    @classmethod
    def _calculate_skill_premium(cls, required_skills: List[str]) -> Decimal:
        """Calculate premium for specialized skills"""
        
        premium_skills = {
            'machine learning': 15,
            'ai': 20,
            'blockchain': 25,
            'kubernetes': 10,
            'aws': 10,
            'devops': 10
        }
        
        total_premium = 0
        for skill in required_skills:
            skill_lower = skill.lower()
            if skill_lower in premium_skills:
                total_premium += premium_skills[skill_lower]
        
        return Decimal(str(min(total_premium, 50)))  # Cap at $50/hr premium
    
    @classmethod
    def _calculate_rare_skills_bonus(cls, required_skills: List[str]) -> Decimal:
        """Calculate bonus for rare skill combinations"""
        
        # This would typically analyze skill rarity in the developer pool
        # For now, use simple heuristics
        if len(required_skills) > 5:
            return Decimal('20')  # Bonus for complex skill requirements
        elif len(required_skills) > 3:
            return Decimal('10')
        
        return Decimal('0')
    
    @classmethod
    def _calculate_demand_multiplier(cls, required_skills: List[str]) -> float:
        """Calculate demand multiplier based on skill availability"""
        
        # This would typically query current developer availability
        # For now, use skill-based estimates
        high_demand_skills = ['ai', 'machine learning', 'blockchain', 'kubernetes']
        
        high_demand_count = sum(
            1 for skill in required_skills 
            if skill.lower() in high_demand_skills
        )
        
        if high_demand_count >= 2:
            return 1.3
        elif high_demand_count == 1:
            return 1.15
        
        return 1.0
    
    @classmethod
    def _calculate_urgency_multiplier(cls, task: Task) -> float:
        """Calculate urgency multiplier based on task priority and timeline"""
        
        if task.priority >= 4:
            return cls.URGENCY_MULTIPLIERS['critical']
        elif task.priority == 3:
            return cls.URGENCY_MULTIPLIERS['high']
        elif task.priority == 2:
            return cls.URGENCY_MULTIPLIERS['medium']
        
        return cls.URGENCY_MULTIPLIERS['low']
    
    @classmethod
    def _get_market_conditions(cls) -> Dict:
        """Get current market conditions"""
        
        # This would typically query real market data
        return {
            'developer_availability': 'medium',
            'demand_level': 'high',
            'market_trend': 'increasing',
            'timestamp': timezone.now().isoformat()
        }
    
    @classmethod
    def _calculate_personalized_rate(cls, pricing: DynamicPricing, 
                                   profile: DeveloperProfile, match_score: float) -> Decimal:
        """Calculate personalized rate based on developer profile and match score"""
        
        base_rate = pricing.calculated_rate
        
        # Adjust based on developer's preferred rate
        if profile.hourly_rate:
            # Use weighted average of calculated rate and developer's rate
            weight = Decimal(str(min(match_score, 0.9)))  # Cap influence at 90%
            weight_complement = Decimal('1.0') - weight
            personalized_rate = (base_rate * weight_complement) + (profile.hourly_rate * weight)
        else:
            personalized_rate = base_rate
        
        # Ensure rate is within bounds
        personalized_rate = max(pricing.min_rate, min(personalized_rate, pricing.max_rate))
        
        return personalized_rate.quantize(Decimal('0.01'))
    
    @classmethod
    def _estimate_completion_date(cls, task: Task, profile: DeveloperProfile) -> timezone.datetime:
        """Estimate task completion date based on developer profile"""
        
        base_hours = task.estimated_hours
        
        # Adjust based on developer experience
        experience_multipliers = {
            'junior': 1.3,
            'mid': 1.0,
            'senior': 0.8,
            'lead': 0.7
        }
        
        multiplier = experience_multipliers.get(profile.experience_level, 1.0)
        adjusted_hours = base_hours * multiplier
        
        # Assume 6 productive hours per day
        days_needed = max(1, int(adjusted_hours / 6))
        
        return timezone.now() + timedelta(days=days_needed)
    
    @classmethod
    def _update_task_resource_allocation(cls, task: Task, assignment: TaskAssignment):
        """Update resource allocation when task is assigned"""
        
        try:
            resource_allocation = task.project.resource_allocation
            cls._update_resource_allocation(resource_allocation)
        except ResourceAllocation.DoesNotExist:
            # Create resource allocation if it doesn't exist
            cls._initialize_resource_allocation(task.project)
    
    @classmethod
    def _calculate_budget_risk(cls, resource_allocation: ResourceAllocation) -> str:
        """Calculate budget risk level"""
        
        if resource_allocation.total_budget == 0:
            return 'high'
        
        utilization = resource_allocation.allocated_budget / resource_allocation.total_budget
        
        if utilization > 0.9:
            return 'high'
        elif utilization > 0.75:
            return 'medium'
        
        return 'low'
    
    @classmethod
    def _calculate_timeline_risk(cls, resource_allocation: ResourceAllocation) -> str:
        """Calculate timeline risk level"""
        
        now = timezone.now()
        
        if now > resource_allocation.planned_end_date:
            return 'high'
        elif now > resource_allocation.planned_end_date - timedelta(days=7):
            return 'medium'
        
        return 'low'
    
    @classmethod
    def _calculate_resource_risk(cls, resource_allocation: ResourceAllocation) -> str:
        """Calculate resource risk level"""
        
        if resource_allocation.pending_invitations > resource_allocation.active_assignments:
            return 'high'
        elif resource_allocation.pending_invitations > 0:
            return 'medium'
        
        return 'low'