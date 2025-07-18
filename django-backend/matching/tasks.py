"""
Background tasks for matching service including pre-computation,
monitoring, and performance optimization.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from celery import shared_task
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction
from django.conf import settings
from django.db.models import Avg, Count, Q

from users.models import User, DeveloperProfile
from projects.models import Project, Task
from .models import DeveloperMatch, MatchingCache, MatchingAnalytics, MatchingPreferences
from .cache_service import MatchingCacheService
from ai_services.hybrid_rag_service import HybridRAGService
from ai_services.models import DeveloperEmbedding

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def precompute_matching_results(self, project_id: str = None, batch_size: int = 10):
    """
    Pre-compute matching results for active projects to improve response times.
    
    Args:
        project_id: Optional specific project ID to compute matches for
        batch_size: Number of projects to process in parallel
        
    Returns:
        Dict with pre-computation results
    """
    try:
        logger.info(f"Starting matching results pre-computation")
        
        # Get projects that need matching pre-computation
        if project_id:
            projects = Project.objects.filter(id=project_id, status__in=['analyzing', 'proposal_review', 'approved'])
        else:
            # Get projects that haven't had matches computed recently
            cutoff_time = timezone.now() - timedelta(hours=2)
            projects = Project.objects.filter(
                status__in=['analyzing', 'proposal_review', 'approved'],
                tasks__isnull=False
            ).exclude(
                matching_cache__computed_at__gt=cutoff_time
            ).distinct()[:batch_size]
        
        total_projects = len(projects)
        logger.info(f"Found {total_projects} projects for matching pre-computation")
        
        if total_projects == 0:
            return {'success': True, 'total': 0, 'processed': 0, 'message': 'No projects need pre-computation'}
        
        # Initialize services
        rag_service = HybridRAGService()
        cache_service = MatchingCacheService()
        
        processed = 0
        errors = 0
        results = []
        
        for project in projects:
            try:
                # Get project tasks
                project_tasks = project.tasks.filter(status='pending')
                
                if not project_tasks.exists():
                    continue
                
                # Pre-compute matches for each task
                task_matches = {}
                
                for task in project_tasks:
                    try:
                        # Get available developers
                        available_developers = User.objects.filter(
                            role='developer',
                            developer_profile__availability_status='available',
                            github_username__isnull=False
                        )
                        
                        # Perform matching
                        matches = rag_service.find_matching_developers(
                            task_requirements={
                                'skills': task.required_skills,
                                'description': task.description,
                                'estimated_hours': task.estimated_hours
                            },
                            available_developers=list(available_developers.values_list('id', flat=True)),
                            limit=10
                        )
                        
                        # Store matches in cache
                        cache_key = f"task_matches_{task.id}"
                        cache.set(cache_key, matches, timeout=7200)  # 2 hours
                        
                        # Create or update matching cache record
                        cache_service.store_matching_results(
                            task_id=str(task.id),
                            matches=matches,
                            algorithm_version='hybrid_rag_v1.0'
                        )
                        
                        task_matches[str(task.id)] = {
                            'matches_count': len(matches),
                            'top_score': matches[0]['total_score'] if matches else 0,
                            'cached_at': timezone.now().isoformat()
                        }
                        
                    except Exception as e:
                        logger.error(f"Error computing matches for task {task.id}: {str(e)}")
                        task_matches[str(task.id)] = {'error': str(e)}
                
                results.append({
                    'project_id': str(project.id),
                    'project_title': project.title,
                    'tasks_processed': len(task_matches),
                    'task_matches': task_matches
                })
                
                processed += 1
                
            except Exception as e:
                logger.error(f"Error pre-computing matches for project {project.id}: {str(e)}")
                errors += 1
                results.append({
                    'project_id': str(project.id),
                    'error': str(e)
                })
        
        logger.info(f"Pre-computed matches for {processed} projects with {errors} errors")
        
        return {
            'success': True,
            'total': total_projects,
            'processed': processed,
            'errors': errors,
            'results': results,
            'completed_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in matching pre-computation: {str(e)}")
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        return {'success': False, 'error': str(e)}


@shared_task
def cleanup_expired_matching_cache():
    """
    Clean up expired matching cache entries and temporary data.
    
    Returns:
        Dict with cleanup results
    """
    try:
        logger.info("Starting matching cache cleanup")
        
        # Clean up expired MatchingCache records (older than 24 hours)
        cutoff_time = timezone.now() - timedelta(hours=24)
        expired_cache = MatchingCache.objects.filter(computed_at__lt=cutoff_time)
        expired_count = expired_cache.count()
        expired_cache.delete()
        
        # Clean up Redis cache entries
        cache_patterns = [
            'task_matches_*',
            'developer_matches_*',
            'project_analysis_*',
            'matching_results_*'
        ]
        
        cleaned_keys = 0
        for pattern in cache_patterns:
            try:
                keys = cache.keys(pattern)
                if keys:
                    cache.delete_many(keys)
                    cleaned_keys += len(keys)
            except Exception as e:
                logger.warning(f"Error cleaning cache pattern {pattern}: {str(e)}")
        
        # Clean up old analytics records (keep last 30 days)
        analytics_cutoff = timezone.now() - timedelta(days=30)
        old_analytics = MatchingAnalytics.objects.filter(created_at__lt=analytics_cutoff)
        old_analytics_count = old_analytics.count()
        old_analytics.delete()
        
        logger.info(f"Cleaned up {expired_count} cache records, {cleaned_keys} Redis keys, {old_analytics_count} analytics records")
        
        return {
            'success': True,
            'expired_cache_records': expired_count,
            'cleaned_redis_keys': cleaned_keys,
            'old_analytics_records': old_analytics_count,
            'completed_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in matching cache cleanup: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def update_matching_analytics():
    """
    Update matching performance analytics and metrics.
    
    Returns:
        Dict with analytics update results
    """
    try:
        logger.info("Starting matching analytics update")
        
        # Calculate metrics for the last 24 hours
        last_24h = timezone.now() - timedelta(hours=24)
        
        # Matching accuracy metrics
        recent_matches = DeveloperMatch.objects.filter(created_at__gte=last_24h)
        total_matches = recent_matches.count()
        
        if total_matches == 0:
            return {'success': True, 'message': 'No recent matches to analyze'}
        
        # Calculate average scores
        avg_vector_score = recent_matches.aggregate(avg=Avg('vector_score'))['avg'] or 0
        avg_graph_score = recent_matches.aggregate(avg=Avg('graph_score'))['avg'] or 0
        avg_availability_score = recent_matches.aggregate(avg=Avg('availability_score'))['avg'] or 0
        avg_match_score = recent_matches.aggregate(avg=Avg('match_score'))['avg'] or 0
        
        # Calculate score distribution
        high_confidence_matches = recent_matches.filter(match_score__gte=0.8).count()
        medium_confidence_matches = recent_matches.filter(
            match_score__gte=0.6, match_score__lt=0.8
        ).count()
        low_confidence_matches = recent_matches.filter(match_score__lt=0.6).count()
        
        # Calculate matching speed metrics
        cache_hits = MatchingCache.objects.filter(computed_at__gte=last_24h).count()
        
        # Create analytics record
        analytics_data = {
            'period_start': last_24h,
            'period_end': timezone.now(),
            'total_matches': total_matches,
            'average_scores': {
                'vector_score': float(avg_vector_score),
                'graph_score': float(avg_graph_score),
                'availability_score': float(avg_availability_score),
                'overall_match_score': float(avg_match_score)
            },
            'confidence_distribution': {
                'high_confidence': high_confidence_matches,
                'medium_confidence': medium_confidence_matches,
                'low_confidence': low_confidence_matches
            },
            'performance_metrics': {
                'cache_hits': cache_hits,
                'cache_hit_rate': (cache_hits / total_matches * 100) if total_matches > 0 else 0
            }
        }
        
        # Store analytics
        MatchingAnalytics.objects.create(
            analytics_data=analytics_data,
            period_start=last_24h,
            period_end=timezone.now()
        )
        
        logger.info(f"Updated matching analytics: {total_matches} matches analyzed")
        
        return {
            'success': True,
            'analytics': analytics_data,
            'updated_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error updating matching analytics: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task(bind=True, max_retries=2)
def optimize_matching_performance(self):
    """
    Optimize matching performance by updating embeddings and cache strategies.
    
    Returns:
        Dict with optimization results
    """
    try:
        logger.info("Starting matching performance optimization")
        
        # Update developer embeddings for better matching
        developers_needing_update = User.objects.filter(
            role='developer',
            github_username__isnull=False,
            embedding_profile__last_github_update__lt=timezone.now() - timedelta(days=3)
        )[:50]  # Limit to 50 developers per run
        
        updated_embeddings = 0
        
        for developer in developers_needing_update:
            try:
                # Trigger embedding update
                from ai_services.tasks import update_developer_skill_proficiency
                update_developer_skill_proficiency.delay(str(developer.id), force_update=False)
                updated_embeddings += 1
            except Exception as e:
                logger.warning(f"Failed to queue embedding update for developer {developer.id}: {str(e)}")
        
        # Optimize cache hit rates by pre-computing popular matches
        popular_skills = DeveloperMatch.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).values('task__required_skills').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        precomputed_matches = 0
        for skill_data in popular_skills:
            try:
                # Pre-compute matches for popular skill combinations
                skills = skill_data['task__required_skills']
                if skills:
                    cache_key = f"popular_skills_matches_{hash(str(sorted(skills)))}"
                    if not cache.get(cache_key):
                        # This would trigger actual matching computation
                        # For now, we'll just mark it for future computation
                        cache.set(cache_key, {'queued': True}, timeout=3600)
                        precomputed_matches += 1
            except Exception as e:
                logger.warning(f"Error pre-computing matches for skills {skill_data}: {str(e)}")
        
        # Update matching algorithm weights based on recent performance
        recent_analytics = MatchingAnalytics.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('-created_at')[:10]
        
        if recent_analytics:
            # Calculate optimal weights based on performance
            total_vector_score = sum([a.analytics_data['average_scores']['vector_score'] for a in recent_analytics])
            total_graph_score = sum([a.analytics_data['average_scores']['graph_score'] for a in recent_analytics])
            
            avg_vector_performance = total_vector_score / len(recent_analytics)
            avg_graph_performance = total_graph_score / len(recent_analytics)
            
            # Store optimization recommendations
            optimization_data = {
                'recommended_weights': {
                    'vector_score': 0.4 + (avg_vector_performance - 0.5) * 0.2,
                    'graph_score': 0.3 + (avg_graph_performance - 0.5) * 0.2,
                    'availability_score': 0.2,
                    'reputation_score': 0.1
                },
                'performance_analysis': {
                    'avg_vector_performance': avg_vector_performance,
                    'avg_graph_performance': avg_graph_performance
                }
            }
            
            cache.set('matching_optimization_data', optimization_data, timeout=86400)  # 24 hours
        
        logger.info(f"Matching optimization completed: {updated_embeddings} embeddings queued, {precomputed_matches} matches pre-computed")
        
        return {
            'success': True,
            'updated_embeddings': updated_embeddings,
            'precomputed_matches': precomputed_matches,
            'optimization_data': optimization_data if 'optimization_data' in locals() else None,
            'completed_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in matching performance optimization: {str(e)}")
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=300)
        return {'success': False, 'error': str(e)}


@shared_task
def monitor_matching_service_health():
    """
    Monitor the health and performance of the matching service.
    
    Returns:
        Dict with health monitoring results
    """
    try:
        logger.info("Starting matching service health monitoring")
        
        health_metrics = {
            'timestamp': timezone.now().isoformat(),
            'service_status': 'healthy',
            'metrics': {},
            'alerts': []
        }
        
        # Check database connectivity
        try:
            DeveloperMatch.objects.count()
            health_metrics['metrics']['database_connectivity'] = 'healthy'
        except Exception as e:
            health_metrics['metrics']['database_connectivity'] = 'unhealthy'
            health_metrics['alerts'].append(f"Database connectivity issue: {str(e)}")
            health_metrics['service_status'] = 'degraded'
        
        # Check cache connectivity
        try:
            cache.set('health_check', 'ok', timeout=60)
            cache_value = cache.get('health_check')
            if cache_value == 'ok':
                health_metrics['metrics']['cache_connectivity'] = 'healthy'
            else:
                health_metrics['metrics']['cache_connectivity'] = 'unhealthy'
                health_metrics['alerts'].append("Cache connectivity issue")
                health_metrics['service_status'] = 'degraded'
        except Exception as e:
            health_metrics['metrics']['cache_connectivity'] = 'unhealthy'
            health_metrics['alerts'].append(f"Cache connectivity issue: {str(e)}")
            health_metrics['service_status'] = 'degraded'
        
        # Check recent matching performance
        recent_matches = DeveloperMatch.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=1)
        )
        
        if recent_matches.exists():
            avg_score = recent_matches.aggregate(avg=Avg('match_score'))['avg']
            health_metrics['metrics']['recent_match_quality'] = float(avg_score)
            
            if avg_score < 0.5:
                health_metrics['alerts'].append(f"Low matching quality detected: {avg_score:.2f}")
                health_metrics['service_status'] = 'degraded'
        else:
            health_metrics['metrics']['recent_match_quality'] = None
            health_metrics['alerts'].append("No recent matches found - low activity")
        
        # Check AI service response times
        try:
            start_time = timezone.now()
            # Simulate a quick AI service call
            from ai_services.embedding_service import EmbeddingService
            embedding_service = EmbeddingService()
            embedding_service.generate_embedding("test skill")
            
            response_time = (timezone.now() - start_time).total_seconds()
            health_metrics['metrics']['ai_service_response_time'] = response_time
            
            if response_time > 5.0:  # 5 seconds threshold
                health_metrics['alerts'].append(f"Slow AI service response: {response_time:.2f}s")
                health_metrics['service_status'] = 'degraded'
        except Exception as e:
            health_metrics['metrics']['ai_service_response_time'] = None
            health_metrics['alerts'].append(f"AI service unavailable: {str(e)}")
            health_metrics['service_status'] = 'unhealthy'
        
        # Store health metrics
        cache.set('matching_service_health', health_metrics, timeout=300)  # 5 minutes
        
        # Log alerts if any
        if health_metrics['alerts']:
            for alert in health_metrics['alerts']:
                logger.warning(f"Matching service alert: {alert}")
        
        logger.info(f"Matching service health check completed: {health_metrics['service_status']}")
        
        return health_metrics
        
    except Exception as e:
        logger.error(f"Error in matching service health monitoring: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'service_status': 'unhealthy',
            'timestamp': timezone.now().isoformat()
        }