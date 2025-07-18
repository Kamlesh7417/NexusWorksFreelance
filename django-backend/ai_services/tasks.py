"""
Background tasks for AI services including automatic skill profile updates,
GitHub analysis, and skill confidence scoring.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from celery import shared_task
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction, models
from django.conf import settings

from users.models import User, DeveloperProfile
from .models import DeveloperSkillProficiency, SkillNode, DeveloperEmbedding
from .github_client import GitHubClient, GitHubAnalyzer
from .repository_analyzer import RepositoryAnalyzer
from .embedding_service import EmbeddingService
from .skill_validator import SkillValidator
from .exceptions import GitHubAPIError, RepositoryAnalysisError

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def update_developer_profile(self, user_id: str, force_update: bool = False):
    """
    Update a single developer's profile with latest GitHub analysis.
    
    Args:
        user_id: UUID of the user to update
        force_update: Force update even if recently updated
        
    Returns:
        Dict with update results
    """
    try:
        logger.info(f"Starting profile update for user {user_id}")
        
        # Get user and developer profile
        try:
            user = User.objects.get(id=user_id, role='developer')
            profile = user.developer_profile
        except (User.DoesNotExist, DeveloperProfile.DoesNotExist):
            logger.error(f"Developer profile not found for user {user_id}")
            return {'success': False, 'error': 'Developer profile not found'}
        
        # Check if GitHub username is available
        if not user.github_username:
            logger.warning(f"No GitHub username for user {user_id}")
            return {'success': False, 'error': 'No GitHub username configured'}
        
        # Check if update is needed (skip if updated recently unless forced)
        if not force_update:
            last_update = profile.github_analysis.get('analyzed_at')
            if last_update:
                try:
                    last_update_dt = datetime.fromisoformat(last_update.replace('Z', '+00:00'))
                    if timezone.now() - last_update_dt < timedelta(hours=6):
                        logger.info(f"Profile for user {user_id} updated recently, skipping")
                        return {'success': True, 'skipped': True, 'reason': 'Recently updated'}
                except (ValueError, TypeError):
                    pass
        
        # Initialize GitHub analyzer
        github_analyzer = GitHubAnalyzer()
        
        # Analyze GitHub profile
        try:
            github_analysis = github_analyzer.analyze_developer_profile(user.github_username)
        except GitHubAPIError as e:
            logger.error(f"GitHub API error for user {user_id}: {str(e)}")
            # Retry with exponential backoff
            raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        
        # Extract skills and technologies
        skills_data = _extract_skills_from_analysis(github_analysis)
        
        # Generate skill embeddings
        embedding_service = EmbeddingService()
        skill_embeddings = []
        
        for skill_name in skills_data['skills']:
            try:
                embedding = embedding_service.generate_embedding(skill_name)
                skill_embeddings.append({
                    'skill': skill_name,
                    'embedding': embedding.tolist() if hasattr(embedding, 'tolist') else embedding
                })
            except Exception as e:
                logger.warning(f"Failed to generate embedding for skill {skill_name}: {str(e)}")
        
        # Calculate skill confidence scores
        confidence_scores = _calculate_skill_confidence_scores(
            github_analysis, skills_data, profile
        )
        
        # Update developer profile
        with transaction.atomic():
            # Update GitHub analysis
            profile.github_analysis = github_analysis
            
            # Update skills list
            profile.skills = skills_data['skills']
            
            # Update skill embeddings
            profile.skill_embeddings = skill_embeddings
            
            # Update reputation score based on GitHub activity
            new_reputation = _calculate_reputation_score(github_analysis, profile)
            profile.reputation_score = new_reputation
            
            # Save profile
            profile.save()
        
        logger.info(f"Successfully updated profile for user {user_id}")
        
        return {
            'success': True,
            'user_id': str(user_id),
            'skills_count': len(skills_data['skills']),
            'embeddings_count': len(skill_embeddings),
            'reputation_score': new_reputation,
            'confidence_scores': confidence_scores,
            'updated_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Unexpected error updating profile for user {user_id}: {str(e)}")
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        return {'success': False, 'error': str(e)}


@shared_task(bind=True)
def update_all_developer_profiles(self, batch_size: int = 10, force_update: bool = False):
    """
    Update all developer profiles in batches.
    
    Args:
        batch_size: Number of profiles to update in parallel
        force_update: Force update even if recently updated
        
    Returns:
        Dict with batch update results
    """
    try:
        logger.info("Starting batch update of all developer profiles")
        
        # Get all developers with GitHub usernames
        developers = User.objects.filter(
            role='developer',
            github_username__isnull=False,
            developer_profile__isnull=False
        ).values_list('id', flat=True)
        
        total_developers = len(developers)
        logger.info(f"Found {total_developers} developers to update")
        
        if total_developers == 0:
            return {'success': True, 'total': 0, 'processed': 0}
        
        # Process in batches
        results = []
        processed = 0
        
        for i in range(0, total_developers, batch_size):
            batch = developers[i:i + batch_size]
            batch_results = []
            
            # Create subtasks for each developer in the batch
            for user_id in batch:
                try:
                    result = update_developer_profile.delay(str(user_id), force_update)
                    batch_results.append({
                        'user_id': str(user_id),
                        'task_id': result.id
                    })
                    processed += 1
                except Exception as e:
                    logger.error(f"Failed to queue update for user {user_id}: {str(e)}")
                    batch_results.append({
                        'user_id': str(user_id),
                        'error': str(e)
                    })
            
            results.extend(batch_results)
            
            # Small delay between batches to avoid overwhelming the system
            if i + batch_size < total_developers:
                import time
                time.sleep(2)
        
        logger.info(f"Queued updates for {processed} developers")
        
        return {
            'success': True,
            'total': total_developers,
            'processed': processed,
            'batch_size': batch_size,
            'batches': len(results) // batch_size + (1 if len(results) % batch_size else 0),
            'started_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in batch profile update: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task(bind=True, max_retries=2)
def refresh_skill_embeddings(self, batch_size: int = 50):
    """
    Refresh skill embeddings for all developer profiles.
    This task regenerates embeddings to ensure consistency and incorporate
    any improvements in the embedding model.
    
    Args:
        batch_size: Number of profiles to process in each batch
        
    Returns:
        Dict with refresh results
    """
    try:
        logger.info("Starting skill embeddings refresh")
        
        # Get all developer profiles with skills
        profiles = DeveloperProfile.objects.filter(
            skills__isnull=False
        ).exclude(skills=[])
        
        total_profiles = profiles.count()
        logger.info(f"Found {total_profiles} profiles to refresh embeddings")
        
        if total_profiles == 0:
            return {'success': True, 'total': 0, 'processed': 0}
        
        embedding_service = EmbeddingService()
        processed = 0
        errors = 0
        
        # Process in batches
        for i in range(0, total_profiles, batch_size):
            batch_profiles = profiles[i:i + batch_size]
            
            for profile in batch_profiles:
                try:
                    # Generate new embeddings for all skills
                    new_embeddings = []
                    
                    for skill_name in profile.skills:
                        try:
                            embedding = embedding_service.generate_embedding(skill_name)
                            new_embeddings.append({
                                'skill': skill_name,
                                'embedding': embedding.tolist() if hasattr(embedding, 'tolist') else embedding
                            })
                        except Exception as e:
                            logger.warning(f"Failed to generate embedding for skill {skill_name}: {str(e)}")
                    
                    # Update profile with new embeddings
                    if new_embeddings:
                        profile.skill_embeddings = new_embeddings
                        profile.save(update_fields=['skill_embeddings'])
                        processed += 1
                    
                except Exception as e:
                    logger.error(f"Error refreshing embeddings for profile {profile.id}: {str(e)}")
                    errors += 1
        
        logger.info(f"Refreshed embeddings for {processed} profiles with {errors} errors")
        
        return {
            'success': True,
            'total': total_profiles,
            'processed': processed,
            'errors': errors,
            'batch_size': batch_size,
            'completed_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in skill embeddings refresh: {str(e)}")
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=300)
        return {'success': False, 'error': str(e)}


@shared_task
def cleanup_expired_cache():
    """
    Clean up expired cache entries and temporary data.
    
    Returns:
        Dict with cleanup results
    """
    try:
        logger.info("Starting cache cleanup")
        
        # Clean up GitHub API cache entries older than 24 hours
        cache_patterns = [
            'github_user_*',
            'github_repos_*',
            'github_repo_details_*',
            'repo_analysis_*'
        ]
        
        cleaned_keys = 0
        
        for pattern in cache_patterns:
            try:
                # This is a simplified cleanup - in production you might want
                # to use Redis SCAN command for better performance
                keys = cache.keys(pattern)
                if keys:
                    cache.delete_many(keys)
                    cleaned_keys += len(keys)
            except Exception as e:
                logger.warning(f"Error cleaning cache pattern {pattern}: {str(e)}")
        
        logger.info(f"Cleaned up {cleaned_keys} cache keys")
        
        return {
            'success': True,
            'cleaned_keys': cleaned_keys,
            'patterns_processed': len(cache_patterns),
            'completed_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in cache cleanup: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task(bind=True, max_retries=3, default_retry_delay=600)
def update_developer_skill_proficiency(self, user_id: str, force_update: bool = False):
    """
    Update detailed skill proficiency records for a developer based on GitHub analysis.
    This creates/updates DeveloperSkillProficiency records with confidence scores.
    
    Args:
        user_id: UUID of the user to update
        force_update: Force update even if recently updated
        
    Returns:
        Dict with update results
    """
    try:
        logger.info(f"Starting skill proficiency update for user {user_id}")
        
        # Get user and developer profile
        try:
            user = User.objects.get(id=user_id, role='developer')
            profile = user.developer_profile
        except (User.DoesNotExist, DeveloperProfile.DoesNotExist):
            logger.error(f"Developer profile not found for user {user_id}")
            return {'success': False, 'error': 'Developer profile not found'}
        
        # Check if GitHub username is available
        if not user.github_username:
            logger.warning(f"No GitHub username for user {user_id}")
            return {'success': False, 'error': 'No GitHub username configured'}
        
        # Check if update is needed (skip if updated recently unless forced)
        if not force_update:
            # Check last update from DeveloperEmbedding
            try:
                dev_embedding = DeveloperEmbedding.objects.get(developer=user)
                if dev_embedding.last_github_update:
                    time_since_update = timezone.now() - dev_embedding.last_github_update
                    if time_since_update < timedelta(hours=12):  # Update every 12 hours
                        logger.info(f"Skill proficiency for user {user_id} updated recently, skipping")
                        return {'success': True, 'skipped': True, 'reason': 'Recently updated'}
            except DeveloperEmbedding.DoesNotExist:
                pass  # First time update
        
        # Initialize services
        github_analyzer = GitHubAnalyzer()
        skill_validator = SkillValidator()
        embedding_service = EmbeddingService()
        
        # Analyze GitHub profile
        try:
            github_analysis = github_analyzer.analyze_developer_profile(user.github_username)
        except GitHubAPIError as e:
            logger.error(f"GitHub API error for user {user_id}: {str(e)}")
            raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        
        # Extract and validate skills
        skills_data = _extract_skills_from_analysis(github_analysis)
        validation_result = skill_validator.validate_skills(
            skills_data['skills'], github_analysis
        )
        
        validated_skills = validation_result['validated_skills']
        
        # Update skill proficiency records
        updated_skills = []
        created_skills = []
        
        with transaction.atomic():
            for skill_name, skill_data in validated_skills.items():
                # Get or create skill node
                skill_node, created = SkillNode.objects.get_or_create(
                    name=skill_data['normalized_name'],
                    defaults={
                        'category': _map_category_to_choice(skill_data['category']),
                        'description': f"Skill detected from GitHub analysis",
                        'popularity_score': skill_data.get('market_demand_score', 0.0)
                    }
                )
                
                # Calculate proficiency level and years of experience
                proficiency_info = _calculate_proficiency_details(
                    skill_data, github_analysis, profile
                )
                
                # Get or create skill proficiency record
                skill_proficiency, created = DeveloperSkillProficiency.objects.get_or_create(
                    developer=user,
                    skill=skill_node,
                    defaults={
                        'proficiency_level': proficiency_info['level'],
                        'years_experience': proficiency_info['years'],
                        'confidence_score': skill_data['confidence_score'] / 100.0,
                        'github_evidence': proficiency_info['github_evidence'],
                        'resume_evidence': {},
                        'project_evidence': {}
                    }
                )
                
                if not created:
                    # Update existing record
                    skill_proficiency.proficiency_level = proficiency_info['level']
                    skill_proficiency.years_experience = proficiency_info['years']
                    skill_proficiency.confidence_score = skill_data['confidence_score'] / 100.0
                    skill_proficiency.github_evidence = proficiency_info['github_evidence']
                    skill_proficiency.save()
                    updated_skills.append(skill_name)
                else:
                    created_skills.append(skill_name)
            
            # Update or create developer embedding record
            dev_embedding, created = DeveloperEmbedding.objects.get_or_create(
                developer=user,
                defaults={
                    'skills_text': ', '.join(validated_skills.keys()),
                    'github_summary': _create_github_summary(github_analysis),
                    'last_github_update': timezone.now(),
                    'embedding_version': 'v1.0'
                }
            )
            
            if not created:
                dev_embedding.skills_text = ', '.join(validated_skills.keys())
                dev_embedding.github_summary = _create_github_summary(github_analysis)
                dev_embedding.last_github_update = timezone.now()
                dev_embedding.save()
            
            # Generate and update embedding
            try:
                combined_text = f"{dev_embedding.skills_text} {dev_embedding.github_summary}"
                embedding = embedding_service.generate_embedding(combined_text)
                dev_embedding.embedding = embedding.tolist() if hasattr(embedding, 'tolist') else embedding
                dev_embedding.save()
            except Exception as e:
                logger.warning(f"Failed to generate embedding for user {user_id}: {str(e)}")
        
        logger.info(f"Successfully updated skill proficiency for user {user_id}")
        
        return {
            'success': True,
            'user_id': str(user_id),
            'validated_skills_count': len(validated_skills),
            'created_skills': created_skills,
            'updated_skills': updated_skills,
            'validation_rate': validation_result['validation_rate'],
            'confidence_scores': {k: v['confidence_score'] for k, v in validated_skills.items()},
            'updated_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Unexpected error updating skill proficiency for user {user_id}: {str(e)}")
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        return {'success': False, 'error': str(e)}


@shared_task(bind=True)
def periodic_skill_profile_updates(self, batch_size: int = 5, max_updates_per_run: int = 50):
    """
    Periodic task to update developer skill profiles automatically.
    This task runs regularly to keep skill profiles up-to-date.
    
    Args:
        batch_size: Number of profiles to update in parallel
        max_updates_per_run: Maximum number of profiles to update in one run
        
    Returns:
        Dict with update results
    """
    try:
        logger.info("Starting periodic skill profile updates")
        
        # Get developers that need updates (haven't been updated in last 24 hours)
        cutoff_time = timezone.now() - timedelta(hours=24)
        
        # Find developers with GitHub usernames that need updates
        developers_needing_update = User.objects.filter(
            role='developer',
            github_username__isnull=False,
            developer_profile__isnull=False
        ).exclude(
            embedding_profile__last_github_update__gt=cutoff_time
        )[:max_updates_per_run]
        
        total_developers = len(developers_needing_update)
        logger.info(f"Found {total_developers} developers needing skill profile updates")
        
        if total_developers == 0:
            return {'success': True, 'total': 0, 'processed': 0, 'message': 'No updates needed'}
        
        # Process in batches
        processed = 0
        queued_tasks = []
        
        for i in range(0, total_developers, batch_size):
            batch = developers_needing_update[i:i + batch_size]
            
            for user in batch:
                try:
                    # Queue skill proficiency update task
                    task = update_developer_skill_proficiency.delay(str(user.id), False)
                    queued_tasks.append({
                        'user_id': str(user.id),
                        'username': user.username,
                        'github_username': user.github_username,
                        'task_id': task.id
                    })
                    processed += 1
                except Exception as e:
                    logger.error(f"Failed to queue skill update for user {user.id}: {str(e)}")
            
            # Small delay between batches
            if i + batch_size < total_developers:
                import time
                time.sleep(1)
        
        logger.info(f"Queued skill profile updates for {processed} developers")
        
        return {
            'success': True,
            'total': total_developers,
            'processed': processed,
            'batch_size': batch_size,
            'queued_tasks': queued_tasks,
            'started_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in periodic skill profile updates: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task(bind=True, max_retries=2)
def validate_and_update_skill_confidence(self, batch_size: int = 20):
    """
    Validate existing skill records and update confidence scores.
    This task reviews existing skill proficiency records and updates confidence scores
    based on the latest validation algorithms.
    
    Args:
        batch_size: Number of skill records to process in each batch
        
    Returns:
        Dict with validation results
    """
    try:
        logger.info("Starting skill confidence validation and update")
        
        # Get skill proficiency records that need confidence score updates
        # Focus on records with low confidence or old records
        cutoff_time = timezone.now() - timedelta(days=7)
        
        skill_records = DeveloperSkillProficiency.objects.filter(
            models.Q(confidence_score__lt=0.7) |  # Low confidence records
            models.Q(last_updated__lt=cutoff_time)  # Old records
        )[:batch_size * 10]  # Limit total records
        
        total_records = len(skill_records)
        logger.info(f"Found {total_records} skill records to validate")
        
        if total_records == 0:
            return {'success': True, 'total': 0, 'processed': 0}
        
        skill_validator = SkillValidator()
        processed = 0
        updated = 0
        errors = 0
        
        # Process in batches
        for i in range(0, total_records, batch_size):
            batch_records = skill_records[i:i + batch_size]
            
            for skill_record in batch_records:
                try:
                    # Get GitHub analysis for the developer
                    github_analysis = skill_record.developer.developer_profile.github_analysis
                    
                    if not github_analysis:
                        processed += 1
                        continue
                    
                    # Validate the skill
                    validation_result = skill_validator.validate_skills(
                        [skill_record.skill.name], github_analysis
                    )
                    
                    validated_skills = validation_result.get('validated_skills', {})
                    skill_data = validated_skills.get(skill_record.skill.name)
                    
                    if skill_data:
                        # Update confidence score
                        old_confidence = skill_record.confidence_score
                        new_confidence = skill_data['confidence_score'] / 100.0
                        
                        if abs(old_confidence - new_confidence) > 0.05:  # Significant change
                            skill_record.confidence_score = new_confidence
                            
                            # Update evidence
                            skill_record.github_evidence.update({
                                'validation_factors': skill_data.get('validation_factors', []),
                                'market_demand': skill_data.get('market_demand', 'Unknown'),
                                'last_validation': timezone.now().isoformat()
                            })
                            
                            skill_record.save()
                            updated += 1
                            
                            logger.debug(f"Updated confidence for {skill_record.developer.username} - {skill_record.skill.name}: {old_confidence:.2f} -> {new_confidence:.2f}")
                    
                    processed += 1
                    
                except Exception as e:
                    logger.error(f"Error validating skill record {skill_record.id}: {str(e)}")
                    errors += 1
        
        logger.info(f"Validated {processed} skill records, updated {updated}, errors: {errors}")
        
        return {
            'success': True,
            'total': total_records,
            'processed': processed,
            'updated': updated,
            'errors': errors,
            'batch_size': batch_size,
            'completed_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in skill confidence validation: {str(e)}")
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=300)
        return {'success': False, 'error': str(e)}


@shared_task(bind=True, max_retries=3)
def analyze_repository_for_skills(self, owner: str, repo_name: str, user_id: str = None):
    """
    Analyze a specific repository for skill extraction.
    
    Args:
        owner: Repository owner
        repo_name: Repository name
        user_id: Optional user ID to associate the analysis with
        
    Returns:
        Dict with analysis results
    """
    try:
        logger.info(f"Analyzing repository {owner}/{repo_name}")
        
        # Initialize repository analyzer
        analyzer = RepositoryAnalyzer()
        
        # Perform analysis
        try:
            analysis = analyzer.analyze_repository(owner, repo_name)
        except (GitHubAPIError, RepositoryAnalysisError) as e:
            logger.error(f"Repository analysis failed for {owner}/{repo_name}: {str(e)}")
            raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        
        # Extract skills from analysis
        extracted_skills = []
        
        # Add programming languages
        for language in analysis.get('languages', {}):
            extracted_skills.append(language)
        
        # Add frameworks
        for framework in analysis.get('frameworks', []):
            extracted_skills.append(framework)
        
        # Add technologies
        for tech in analysis.get('technologies', []):
            extracted_skills.append(tech)
        
        # If user_id is provided, update their profile
        if user_id:
            try:
                user = User.objects.get(id=user_id, role='developer')
                profile = user.developer_profile
                
                # Merge with existing skills
                existing_skills = set(profile.skills or [])
                new_skills = existing_skills.union(set(extracted_skills))
                
                if new_skills != existing_skills:
                    profile.skills = list(new_skills)
                    profile.save(update_fields=['skills'])
                    logger.info(f"Updated skills for user {user_id} from repository analysis")
                
            except (User.DoesNotExist, DeveloperProfile.DoesNotExist):
                logger.warning(f"User {user_id} not found for skill update")
        
        return {
            'success': True,
            'repository': f"{owner}/{repo_name}",
            'extracted_skills': extracted_skills,
            'analysis_summary': {
                'languages': list(analysis.get('languages', {}).keys()),
                'frameworks': analysis.get('frameworks', []),
                'technologies': analysis.get('technologies', []),
                'complexity_score': analysis.get('complexity_metrics', {}).get('overall_complexity', 0)
            },
            'analyzed_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Unexpected error analyzing repository {owner}/{repo_name}: {str(e)}")
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        return {'success': False, 'error': str(e)}


def _extract_skills_from_analysis(github_analysis: Dict) -> Dict[str, Any]:
    """
    Extract skills and technologies from GitHub analysis.
    
    Args:
        github_analysis: GitHub analysis results
        
    Returns:
        Dict with extracted skills and metadata
    """
    skills = set()
    
    # Extract from languages
    languages = github_analysis.get('languages', {})
    for language in languages.keys():
        skills.add(language)
    
    # Extract from frameworks
    frameworks = github_analysis.get('frameworks', [])
    for framework in frameworks:
        skills.add(framework)
    
    # Extract from skill assessment
    skill_assessment = github_analysis.get('skill_assessment', {})
    for skill in skill_assessment.keys():
        skills.add(skill)
    
    # Extract from top repositories
    top_repos = github_analysis.get('top_repositories', [])
    for repo in top_repos:
        if repo.get('language'):
            skills.add(repo['language'])
    
    return {
        'skills': list(skills),
        'primary_languages': list(languages.keys())[:5],  # Top 5 languages
        'frameworks': frameworks,
        'skill_count': len(skills)
    }


def _calculate_skill_confidence_scores(github_analysis: Dict, skills_data: Dict, 
                                     profile: DeveloperProfile) -> Dict[str, float]:
    """
    Calculate confidence scores for each skill based on GitHub analysis.
    
    Args:
        github_analysis: GitHub analysis results
        skills_data: Extracted skills data
        profile: Developer profile
        
    Returns:
        Dict mapping skill names to confidence scores (0-100)
    """
    confidence_scores = {}
    
    # Get skill assessment from GitHub analysis
    skill_assessment = github_analysis.get('skill_assessment', {})
    
    # Base confidence from GitHub analysis
    for skill in skills_data['skills']:
        base_confidence = 50.0  # Default confidence
        
        # Adjust based on GitHub skill assessment
        if skill in skill_assessment:
            assessment = skill_assessment[skill]
            base_confidence = assessment.get('proficiency', 50.0)
        
        # Adjust based on language usage frequency
        languages = github_analysis.get('languages', {})
        if skill in languages:
            usage_count = languages[skill]
            total_repos = sum(languages.values())
            usage_ratio = usage_count / max(1, total_repos)
            base_confidence += usage_ratio * 20  # Up to 20 point bonus
        
        # Adjust based on activity and complexity scores
        activity_score = github_analysis.get('activity_score', 0)
        complexity_score = github_analysis.get('complexity_score', 0)
        
        activity_bonus = min(10, activity_score / 10)
        complexity_bonus = min(10, complexity_score / 10)
        
        final_confidence = min(100, base_confidence + activity_bonus + complexity_bonus)
        confidence_scores[skill] = round(final_confidence, 2)
    
    return confidence_scores


def _calculate_reputation_score(github_analysis: Dict, profile: DeveloperProfile) -> float:
    """
    Calculate reputation score based on GitHub analysis and profile data.
    
    Args:
        github_analysis: GitHub analysis results
        profile: Developer profile
        
    Returns:
        Reputation score (0-100)
    """
    base_score = profile.reputation_score or 0.0
    
    # GitHub contribution factors
    activity_score = github_analysis.get('activity_score', 0)
    complexity_score = github_analysis.get('complexity_score', 0)
    collaboration_score = github_analysis.get('collaboration_score', 0)
    
    # Repository quality factors
    top_repos = github_analysis.get('top_repositories', [])
    total_stars = sum(repo.get('stars', 0) for repo in top_repos)
    total_forks = sum(repo.get('forks', 0) for repo in top_repos)
    
    # Calculate new reputation components
    github_activity = min(25, activity_score / 4)  # Max 25 points
    code_quality = min(20, complexity_score / 5)   # Max 20 points
    collaboration = min(15, collaboration_score / 6.67)  # Max 15 points
    popularity = min(20, (total_stars + total_forks) / 50)  # Max 20 points
    
    # Platform-specific factors (existing projects, etc.)
    platform_bonus = min(20, profile.projects_completed * 2)  # Max 20 points
    
    new_score = github_activity + code_quality + collaboration + popularity + platform_bonus
    
    # Weighted average with existing score (70% new, 30% existing)
    final_score = (new_score * 0.7) + (base_score * 0.3)
    
    return round(min(100, max(0, final_score)), 2)


def _map_category_to_choice(category: str) -> str:
    """
    Map skill category to model choice field.
    
    Args:
        category: Category name from skill validator
        
    Returns:
        Model choice field value
    """
    category_mapping = {
        'Programming Languages': 'programming_language',
        'Web Frameworks': 'framework',
        'Frameworks': 'framework',
        'Databases': 'database',
        'DevOps & Cloud': 'tool',
        'Mobile Development': 'framework',
        'Data Science & ML': 'tool',
        'Tools': 'tool',
        'Other': 'tool'
    }
    return category_mapping.get(category, 'tool')


def _calculate_proficiency_details(skill_data: Dict, github_analysis: Dict, 
                                 profile: DeveloperProfile) -> Dict[str, Any]:
    """
    Calculate detailed proficiency information for a skill.
    
    Args:
        skill_data: Validated skill data
        github_analysis: GitHub analysis results
        profile: Developer profile
        
    Returns:
        Dict with proficiency level, years, and evidence
    """
    confidence_score = skill_data['confidence_score']
    
    # Determine proficiency level based on confidence score
    if confidence_score >= 80:
        level = 'expert'
        base_years = 5.0
    elif confidence_score >= 65:
        level = 'advanced'
        base_years = 3.0
    elif confidence_score >= 50:
        level = 'intermediate'
        base_years = 2.0
    else:
        level = 'beginner'
        base_years = 1.0
    
    # Adjust years based on GitHub activity
    activity_score = github_analysis.get('activity_score', 0)
    complexity_score = github_analysis.get('complexity_score', 0)
    
    # Calculate estimated years of experience
    activity_multiplier = 1 + (activity_score / 100)  # 1.0 to 2.0
    complexity_multiplier = 1 + (complexity_score / 100)  # 1.0 to 2.0
    
    estimated_years = base_years * activity_multiplier * complexity_multiplier
    estimated_years = min(10.0, max(0.5, estimated_years))  # Cap between 0.5 and 10 years
    
    # Create evidence record
    github_evidence = {
        'confidence_score': confidence_score,
        'validation_factors': skill_data.get('validation_factors', []),
        'market_demand': skill_data.get('market_demand', 'Unknown'),
        'github_activity_score': activity_score,
        'github_complexity_score': complexity_score,
        'skill_assessment': github_analysis.get('skill_assessment', {}).get(skill_data['original_name'], {}),
        'last_analysis': timezone.now().isoformat()
    }
    
    return {
        'level': level,
        'years': round(estimated_years, 1),
        'github_evidence': github_evidence
    }


def _create_github_summary(github_analysis: Dict) -> str:
    """
    Create a text summary of GitHub analysis for embedding generation.
    
    Args:
        github_analysis: GitHub analysis results
        
    Returns:
        Text summary
    """
    summary_parts = []
    
    # Add languages
    languages = github_analysis.get('languages', {})
    if languages:
        top_languages = list(languages.keys())[:5]
        summary_parts.append(f"Programming languages: {', '.join(top_languages)}")
    
    # Add frameworks
    frameworks = github_analysis.get('frameworks', [])
    if frameworks:
        summary_parts.append(f"Frameworks: {', '.join(frameworks[:5])}")
    
    # Add activity info
    activity_score = github_analysis.get('activity_score', 0)
    if activity_score > 50:
        summary_parts.append("High GitHub activity")
    elif activity_score > 25:
        summary_parts.append("Moderate GitHub activity")
    else:
        summary_parts.append("Low GitHub activity")
    
    # Add complexity info
    complexity_score = github_analysis.get('complexity_score', 0)
    if complexity_score > 50:
        summary_parts.append("Complex projects")
    elif complexity_score > 25:
        summary_parts.append("Moderate complexity projects")
    
    # Add collaboration info
    collaboration_score = github_analysis.get('collaboration_score', 0)
    if collaboration_score > 50:
        summary_parts.append("Collaborative developer")
    
    # Add top repositories info
    top_repos = github_analysis.get('top_repositories', [])
    if top_repos:
        repo_languages = [repo.get('language') for repo in top_repos[:3] if repo.get('language')]
        if repo_languages:
            summary_parts.append(f"Notable projects in: {', '.join(set(repo_languages))}")
    
    return '. '.join(summary_parts) + '.'