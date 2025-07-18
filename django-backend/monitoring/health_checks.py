"""
Health check endpoints and monitoring utilities
"""
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, Any

from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from ai_services.models import SkillEmbedding
from projects.models import Project
from users.models import User
from payments.models import Payment

logger = logging.getLogger(__name__)

class HealthCheckService:
    """Service for performing various health checks"""
    
    @staticmethod
    def check_database() -> Dict[str, Any]:
        """Check database connectivity and basic operations"""
        try:
            start_time = time.time()
            
            # Test basic query
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            
            # Test model access
            user_count = User.objects.count()
            project_count = Project.objects.count()
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status': 'healthy',
                'response_time_ms': round(response_time, 2),
                'user_count': user_count,
                'project_count': project_count,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    @staticmethod
    def check_cache() -> Dict[str, Any]:
        """Check cache connectivity and operations"""
        try:
            start_time = time.time()
            
            # Test cache write/read
            test_key = 'health_check_test'
            test_value = f'test_{int(time.time())}'
            
            cache.set(test_key, test_value, 60)
            retrieved_value = cache.get(test_key)
            
            if retrieved_value != test_value:
                raise Exception("Cache read/write test failed")
            
            cache.delete(test_key)
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status': 'healthy',
                'response_time_ms': round(response_time, 2),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Cache health check failed: {str(e)}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    @staticmethod
    def check_ai_services() -> Dict[str, Any]:
        """Check AI services availability"""
        try:
            start_time = time.time()
            
            # Check if we have embeddings data
            embedding_count = SkillEmbedding.objects.count()
            
            # Test basic AI service functionality
            from ai_services.embedding_service import EmbeddingService
            embedding_service = EmbeddingService()
            
            # Simple test embedding
            test_embedding = embedding_service.get_text_embedding("test skill")
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status': 'healthy',
                'response_time_ms': round(response_time, 2),
                'embedding_count': embedding_count,
                'embedding_dimension': len(test_embedding) if test_embedding else 0,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"AI services health check failed: {str(e)}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    @staticmethod
    def check_external_services() -> Dict[str, Any]:
        """Check external service connectivity"""
        try:
            start_time = time.time()
            
            # Check GitHub API (basic connectivity)
            from ai_services.github_client import GitHubClient
            github_client = GitHubClient()
            
            # Test rate limit check (doesn't count against rate limit)
            rate_limit_info = github_client.get_rate_limit()
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status': 'healthy',
                'response_time_ms': round(response_time, 2),
                'github_rate_limit': rate_limit_info,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"External services health check failed: {str(e)}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    @staticmethod
    def check_celery() -> Dict[str, Any]:
        """Check Celery task queue health"""
        try:
            from celery import current_app
            
            # Get active tasks
            inspect = current_app.control.inspect()
            active_tasks = inspect.active()
            scheduled_tasks = inspect.scheduled()
            
            # Count total active and scheduled tasks
            total_active = sum(len(tasks) for tasks in (active_tasks or {}).values())
            total_scheduled = sum(len(tasks) for tasks in (scheduled_tasks or {}).values())
            
            return {
                'status': 'healthy',
                'active_tasks': total_active,
                'scheduled_tasks': total_scheduled,
                'workers': list((active_tasks or {}).keys()),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Celery health check failed: {str(e)}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """Basic health check endpoint"""
    try:
        health_service = HealthCheckService()
        
        # Perform basic checks
        db_health = health_service.check_database()
        cache_health = health_service.check_cache()
        
        overall_status = 'healthy'
        if db_health['status'] != 'healthy' or cache_health['status'] != 'healthy':
            overall_status = 'unhealthy'
        
        response_data = {
            'status': overall_status,
            'timestamp': datetime.now().isoformat(),
            'version': getattr(settings, 'VERSION', '1.0.0'),
            'checks': {
                'database': db_health,
                'cache': cache_health
            }
        }
        
        status_code = 200 if overall_status == 'healthy' else 503
        return JsonResponse(response_data, status=status_code)
        
    except Exception as e:
        logger.error(f"Health check endpoint failed: {str(e)}")
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status=503)

@csrf_exempt
@require_http_methods(["GET"])
def detailed_health_check(request):
    """Detailed health check with all services"""
    try:
        health_service = HealthCheckService()
        
        # Perform all checks
        checks = {
            'database': health_service.check_database(),
            'cache': health_service.check_cache(),
            'ai_services': health_service.check_ai_services(),
            'external_services': health_service.check_external_services(),
            'celery': health_service.check_celery()
        }
        
        # Determine overall status
        overall_status = 'healthy'
        for check_name, check_result in checks.items():
            if check_result['status'] != 'healthy':
                overall_status = 'degraded' if overall_status == 'healthy' else 'unhealthy'
        
        response_data = {
            'status': overall_status,
            'timestamp': datetime.now().isoformat(),
            'version': getattr(settings, 'VERSION', '1.0.0'),
            'checks': checks
        }
        
        status_code = 200 if overall_status == 'healthy' else 503
        return JsonResponse(response_data, status=status_code)
        
    except Exception as e:
        logger.error(f"Detailed health check endpoint failed: {str(e)}")
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status=503)

@csrf_exempt
@require_http_methods(["GET"])
def readiness_check(request):
    """Readiness check for Kubernetes/container orchestration"""
    try:
        health_service = HealthCheckService()
        
        # Check critical services for readiness
        db_health = health_service.check_database()
        cache_health = health_service.check_cache()
        
        if db_health['status'] == 'healthy' and cache_health['status'] == 'healthy':
            return JsonResponse({
                'status': 'ready',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return JsonResponse({
                'status': 'not_ready',
                'timestamp': datetime.now().isoformat(),
                'issues': {
                    'database': db_health['status'],
                    'cache': cache_health['status']
                }
            }, status=503)
            
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return JsonResponse({
            'status': 'not_ready',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status=503)

@csrf_exempt
@require_http_methods(["GET"])
def liveness_check(request):
    """Liveness check for Kubernetes/container orchestration"""
    return JsonResponse({
        'status': 'alive',
        'timestamp': datetime.now().isoformat()
    })