"""
Senior Developer Assignment Service

This service handles the identification and assignment of senior developers
to projects based on experience, reputation, and skill matching.
"""

from django.contrib.auth import get_user_model
from django.db.models import Q, Avg, Count
from django.utils import timezone
from typing import List, Dict, Optional, Tuple
import logging

from .models import Project, SeniorDeveloperAssignment, ProjectProposal
from users.models import DeveloperProfile

User = get_user_model()
logger = logging.getLogger(__name__)


class SeniorDeveloperService:
    """Service for managing senior developer assignments"""
    
    # Scoring weights for different criteria
    EXPERIENCE_WEIGHT = 0.3
    REPUTATION_WEIGHT = 0.25
    SKILL_MATCH_WEIGHT = 0.25
    LEADERSHIP_WEIGHT = 0.2
    
    # Minimum scores for senior developer qualification
    MIN_EXPERIENCE_SCORE = 0.7
    MIN_REPUTATION_SCORE = 0.6
    MIN_TOTAL_SCORE = 0.65
    
    @classmethod
    def identify_senior_developers(cls, project: Project, limit: int = 5) -> List[Dict]:
        """
        Identify and rank potential senior developers for a project
        
        Args:
            project: The project requiring a senior developer
            limit: Maximum number of candidates to return
            
        Returns:
            List of dictionaries containing developer info and scores
        """
        logger.info(f"Identifying senior developers for project: {project.title}")
        
        # Get all developers with senior or lead experience levels
        senior_developers = User.objects.filter(
            role='developer',
            developer_profile__experience_level__in=['senior', 'lead'],
            developer_profile__availability_status='available'
        ).select_related('developer_profile')
        
        candidates = []
        
        for developer in senior_developers:
            try:
                scores = cls._calculate_developer_scores(developer, project)
                
                # Only consider developers who meet minimum criteria
                if (scores['total_score'] >= cls.MIN_TOTAL_SCORE and 
                    scores['experience_score'] >= cls.MIN_EXPERIENCE_SCORE and
                    scores['reputation_score'] >= cls.MIN_REPUTATION_SCORE):
                    
                    candidates.append({
                        'developer': developer,
                        'scores': scores,
                        'profile': developer.developer_profile
                    })
                    
            except Exception as e:
                logger.error(f"Error scoring developer {developer.username}: {str(e)}")
                continue
        
        # Sort by total score (descending)
        candidates.sort(key=lambda x: x['scores']['total_score'], reverse=True)
        
        logger.info(f"Found {len(candidates)} qualified senior developers")
        return candidates[:limit]
    
    @classmethod
    def _calculate_developer_scores(cls, developer: User, project: Project) -> Dict[str, float]:
        """Calculate scoring metrics for a developer against a project"""
        
        profile = developer.developer_profile
        
        # Experience Score (based on level and projects completed)
        experience_score = cls._calculate_experience_score(profile)
        
        # Reputation Score (based on reviews and platform metrics)
        reputation_score = cls._calculate_reputation_score(profile)
        
        # Skill Match Score (based on required skills alignment)
        skill_match_score = cls._calculate_skill_match_score(profile, project)
        
        # Leadership Score (based on past senior roles and team management)
        leadership_score = cls._calculate_leadership_score(profile)
        
        # Calculate weighted total score
        total_score = (
            experience_score * cls.EXPERIENCE_WEIGHT +
            reputation_score * cls.REPUTATION_WEIGHT +
            skill_match_score * cls.SKILL_MATCH_WEIGHT +
            leadership_score * cls.LEADERSHIP_WEIGHT
        )
        
        return {
            'experience_score': experience_score,
            'reputation_score': reputation_score,
            'skill_match_score': skill_match_score,
            'leadership_score': leadership_score,
            'total_score': total_score
        }
    
    @classmethod
    def _calculate_experience_score(cls, profile: DeveloperProfile) -> float:
        """Calculate experience score based on level and completed projects"""
        
        # Base score from experience level
        level_scores = {
            'junior': 0.2,
            'mid': 0.5,
            'senior': 0.8,
            'lead': 1.0
        }
        base_score = level_scores.get(profile.experience_level, 0.5)
        
        # Bonus from completed projects (up to 0.2 additional points)
        project_bonus = min(profile.projects_completed * 0.02, 0.2)
        
        return min(base_score + project_bonus, 1.0)
    
    @classmethod
    def _calculate_reputation_score(cls, profile: DeveloperProfile) -> float:
        """Calculate reputation score based on reviews and platform metrics"""
        
        # Use existing reputation score if available
        if profile.reputation_score > 0:
            return min(profile.reputation_score / 5.0, 1.0)  # Normalize to 0-1
        
        # Calculate from reviews if reputation score not set
        user_reviews = profile.user.received_reviews.all()
        if user_reviews.exists():
            avg_rating = user_reviews.aggregate(
                avg_overall=Avg('overall_rating'),
                avg_quality=Avg('quality_rating'),
                avg_communication=Avg('communication_rating')
            )
            
            # Weight overall rating more heavily
            weighted_avg = (
                avg_rating['avg_overall'] * 0.5 +
                avg_rating['avg_quality'] * 0.3 +
                avg_rating['avg_communication'] * 0.2
            )
            return min(weighted_avg / 5.0, 1.0)  # Normalize to 0-1
        
        # Default score for new developers
        return 0.5
    
    @classmethod
    def _calculate_skill_match_score(cls, profile: DeveloperProfile, project: Project) -> float:
        """Calculate how well developer skills match project requirements"""
        
        if not project.required_skills:
            return 0.8  # Default score if no specific skills required
        
        developer_skills = set(skill.lower() for skill in profile.skills)
        required_skills = set(skill.lower() for skill in project.required_skills)
        
        if not required_skills:
            return 0.8
        
        # Calculate intersection ratio
        matching_skills = developer_skills.intersection(required_skills)
        match_ratio = len(matching_skills) / len(required_skills)
        
        # Bonus for having additional relevant skills
        additional_skills_bonus = min(len(developer_skills) * 0.01, 0.2)
        
        return min(match_ratio + additional_skills_bonus, 1.0)
    
    @classmethod
    def _calculate_leadership_score(cls, profile: DeveloperProfile) -> float:
        """Calculate leadership score based on past senior assignments"""
        
        # Count successful senior assignments
        senior_assignments = profile.user.senior_assignments.filter(
            status__in=['completed', 'active']
        ).count()
        
        # Base score from experience level
        level_scores = {
            'junior': 0.1,
            'mid': 0.3,
            'senior': 0.7,
            'lead': 0.9
        }
        base_score = level_scores.get(profile.experience_level, 0.3)
        
        # Bonus from successful senior assignments
        assignment_bonus = min(senior_assignments * 0.1, 0.3)
        
        return min(base_score + assignment_bonus, 1.0)
    
    @classmethod
    def assign_senior_developer(cls, project: Project, developer: User) -> SeniorDeveloperAssignment:
        """
        Assign a senior developer to a project
        
        Args:
            project: The project to assign to
            developer: The senior developer to assign
            
        Returns:
            SeniorDeveloperAssignment instance
        """
        logger.info(f"Assigning senior developer {developer.username} to project {project.title}")
        
        # Calculate scores for this assignment
        scores = cls._calculate_developer_scores(developer, project)
        
        # Create the assignment
        assignment = SeniorDeveloperAssignment.objects.create(
            project=project,
            senior_developer=developer,
            experience_score=scores['experience_score'],
            reputation_score=scores['reputation_score'],
            skill_match_score=scores['skill_match_score'],
            leadership_score=scores['leadership_score'],
            total_score=scores['total_score'],
            status='pending'
        )
        
        # Update project status and senior developer reference
        project.senior_developer = developer
        project.status = 'proposal_review'
        project.save()
        
        logger.info(f"Senior developer assignment created with ID: {assignment.id}")
        return assignment
    
    @classmethod
    def auto_assign_best_senior_developer(cls, project: Project) -> Optional[SeniorDeveloperAssignment]:
        """
        Automatically assign the best available senior developer to a project
        
        Args:
            project: The project requiring a senior developer
            
        Returns:
            SeniorDeveloperAssignment instance or None if no suitable developer found
        """
        candidates = cls.identify_senior_developers(project, limit=1)
        
        if not candidates:
            logger.warning(f"No suitable senior developers found for project: {project.title}")
            return None
        
        best_candidate = candidates[0]
        return cls.assign_senior_developer(project, best_candidate['developer'])
    
    @classmethod
    def accept_senior_assignment(cls, assignment: SeniorDeveloperAssignment) -> bool:
        """
        Accept a senior developer assignment
        
        Args:
            assignment: The assignment to accept
            
        Returns:
            True if successful, False otherwise
        """
        try:
            assignment.status = 'accepted'
            assignment.accepted_at = timezone.now()
            assignment.save()
            
            # Update project status
            assignment.project.status = 'proposal_review'
            assignment.project.save()
            
            logger.info(f"Senior assignment {assignment.id} accepted")
            return True
            
        except Exception as e:
            logger.error(f"Error accepting senior assignment {assignment.id}: {str(e)}")
            return False
    
    @classmethod
    def decline_senior_assignment(cls, assignment: SeniorDeveloperAssignment, reason: str = "") -> bool:
        """
        Decline a senior developer assignment
        
        Args:
            assignment: The assignment to decline
            reason: Optional reason for declining
            
        Returns:
            True if successful, False otherwise
        """
        try:
            assignment.status = 'declined'
            assignment.declined_at = timezone.now()
            assignment.decline_reason = reason
            assignment.save()
            
            # Clear senior developer from project and find alternative
            project = assignment.project
            project.senior_developer = None
            project.save()
            
            # Try to auto-assign next best candidate
            cls.auto_assign_best_senior_developer(project)
            
            logger.info(f"Senior assignment {assignment.id} declined")
            return True
            
        except Exception as e:
            logger.error(f"Error declining senior assignment {assignment.id}: {str(e)}")
            return False