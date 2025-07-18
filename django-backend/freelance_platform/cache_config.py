"""
Caching configuration and utilities
"""
import os
from django.core.cache import cache
from django.core.cache.utils import make_template_fragment_key
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from functools import wraps
import hashlib
import json

# Cache timeouts (in seconds)
CACHE_TIMEOUTS = {
    'short': 300,      # 5 minutes
    'medium': 1800,    # 30 minutes
    'long': 3600,      # 1 hour
    'very_long': 86400, # 24 hours
}

class CacheService:
    """Service for managing application caching"""
    
    @staticmethod
    def get_cache_key(prefix: str, *args, **kwargs) -> str:
        """Generate a consistent cache key"""
        key_parts = [prefix]
        
        # Add positional arguments
        for arg in args:
            if isinstance(arg, (dict, list)):
                key_parts.append(hashlib.md5(json.dumps(arg, sort_keys=True).encode()).hexdigest())
            else:
                key_parts.append(str(arg))
        
        # Add keyword arguments
        for key, value in sorted(kwargs.items()):
            if isinstance(value, (dict, list)):
                key_parts.append(f"{key}:{hashlib.md5(json.dumps(value, sort_keys=True).encode()).hexdigest()}")
            else:
                key_parts.append(f"{key}:{value}")
        
        return ":".join(key_parts)
    
    @staticmethod
    def cache_developer_profile(user_id: int, timeout: int = CACHE_TIMEOUTS['medium']):
        """Cache decorator for developer profile data"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                cache_key = CacheService.get_cache_key('developer_profile', user_id)
                result = cache.get(cache_key)
                
                if result is None:
                    result = func(*args, **kwargs)
                    cache.set(cache_key, result, timeout)
                
                return result
            return wrapper
        return decorator
    
    @staticmethod
    def cache_project_analysis(project_id: int, timeout: int = CACHE_TIMEOUTS['long']):
        """Cache decorator for project analysis results"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                cache_key = CacheService.get_cache_key('project_analysis', project_id)
                result = cache.get(cache_key)
                
                if result is None:
                    result = func(*args, **kwargs)
                    cache.set(cache_key, result, timeout)
                
                return result
            return wrapper
        return decorator
    
    @staticmethod
    def cache_matching_results(project_id: int, filters: dict = None, timeout: int = CACHE_TIMEOUTS['short']):
        """Cache decorator for matching results"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                cache_key = CacheService.get_cache_key('matching_results', project_id, filters or {})
                result = cache.get(cache_key)
                
                if result is None:
                    result = func(*args, **kwargs)
                    cache.set(cache_key, result, timeout)
                
                return result
            return wrapper
        return decorator
    
    @staticmethod
    def invalidate_user_cache(user_id: int):
        """Invalidate all cache entries for a user"""
        patterns = [
            f'developer_profile:{user_id}',
            f'user_projects:{user_id}',
            f'user_skills:{user_id}',
        ]
        
        for pattern in patterns:
            cache.delete(pattern)
    
    @staticmethod
    def invalidate_project_cache(project_id: int):
        """Invalidate all cache entries for a project"""
        patterns = [
            f'project_analysis:{project_id}',
            f'matching_results:{project_id}*',
            f'project_details:{project_id}',
        ]
        
        for pattern in patterns:
            if '*' in pattern:
                # For patterns with wildcards, you'd need to implement
                # cache key scanning (Redis SCAN command)
                pass
            else:
                cache.delete(pattern)

# Rate limiting configuration
RATE_LIMITS = {
    'api_general': '100/hour',
    'api_auth': '20/hour',
    'ai_analysis': '10/hour',
    'matching_requests': '50/hour',
    'file_uploads': '20/hour',
}

class RateLimitService:
    """Service for managing rate limiting"""
    
    @staticmethod
    def get_rate_limit_key(identifier: str, action: str) -> str:
        """Generate rate limit key"""
        return f"rate_limit:{action}:{identifier}"
    
    @staticmethod
    def is_rate_limited(identifier: str, action: str, limit: int, window: int) -> bool:
        """Check if request is rate limited"""
        key = RateLimitService.get_rate_limit_key(identifier, action)
        current = cache.get(key, 0)
        
        if current >= limit:
            return True
        
        # Increment counter
        try:
            cache.set(key, current + 1, window)
        except:
            # If cache fails, allow the request
            pass
        
        return False
    
    @staticmethod
    def get_rate_limit_status(identifier: str, action: str, limit: int) -> dict:
        """Get current rate limit status"""
        key = RateLimitService.get_rate_limit_key(identifier, action)
        current = cache.get(key, 0)
        
        return {
            'limit': limit,
            'remaining': max(0, limit - current),
            'used': current,
            'reset_time': cache.ttl(key) if hasattr(cache, 'ttl') else None
        }

def rate_limit(action: str, limit: int, window: int = 3600):
    """Rate limiting decorator"""
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # Use IP address as identifier (you might want to use user ID for authenticated requests)
            identifier = request.META.get('REMOTE_ADDR', 'unknown')
            
            if hasattr(request, 'user') and request.user.is_authenticated:
                identifier = f"user:{request.user.id}"
            
            if RateLimitService.is_rate_limited(identifier, action, limit, window):
                from django.http import JsonResponse
                return JsonResponse({
                    'error': 'Rate limit exceeded',
                    'detail': f'Maximum {limit} requests per {window} seconds'
                }, status=429)
            
            return func(request, *args, **kwargs)
        return wrapper
    return decorator

# Cache warming utilities
class CacheWarmer:
    """Utilities for warming up cache"""
    
    @staticmethod
    def warm_developer_profiles():
        """Warm up cache for active developer profiles"""
        from users.models import User
        from django.utils import timezone
        from datetime import timedelta
        
        # Get active developers (logged in within last 7 days)
        cutoff_date = timezone.now() - timedelta(days=7)
        active_developers = User.objects.filter(
            role='developer',
            last_login__gte=cutoff_date
        ).values_list('id', flat=True)
        
        for user_id in active_developers:
            try:
                # This would trigger cache population
                # You'd call your actual profile loading function here
                pass
            except Exception as e:
                print(f"Failed to warm cache for user {user_id}: {e}")
    
    @staticmethod
    def warm_popular_projects():
        """Warm up cache for popular projects"""
        from projects.models import Project
        
        # Get projects with recent activity
        popular_projects = Project.objects.filter(
            status__in=['active', 'in_progress']
        ).order_by('-created_at')[:50]
        
        for project in popular_projects:
            try:
                # This would trigger cache population for project analysis
                pass
            except Exception as e:
                print(f"Failed to warm cache for project {project.id}: {e}")

# Template fragment caching utilities
def cache_template_fragment(fragment_name: str, timeout: int = CACHE_TIMEOUTS['medium']):
    """Utility for caching template fragments"""
    def get_cache_key(*args):
        return make_template_fragment_key(fragment_name, args)
    
    return get_cache_key

# View caching decorators
def cache_api_response(timeout: int = CACHE_TIMEOUTS['short']):
    """Cache API response with proper headers"""
    def decorator(func):
        @cache_page(timeout)
        @vary_on_headers('Authorization', 'Accept-Language')
        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Advanced rate limiting with Redis
class AdvancedRateLimiter:
    """Advanced rate limiting with sliding window and burst protection"""
    
    def __init__(self, redis_client=None):
        self.redis = redis_client or cache
    
    def is_allowed(self, key: str, limit: int, window: int, burst_limit: int = None) -> tuple[bool, dict]:
        """
        Check if request is allowed using sliding window algorithm
        
        Args:
            key: Unique identifier for the rate limit
            limit: Number of requests allowed in the window
            window: Time window in seconds
            burst_limit: Maximum burst requests allowed
        
        Returns:
            (is_allowed, rate_limit_info)
        """
        now = time.time()
        pipeline = self.redis.pipeline()
        
        # Sliding window key
        window_key = f"rate_limit:sliding:{key}"
        
        # Remove expired entries
        pipeline.zremrangebyscore(window_key, 0, now - window)
        
        # Count current requests
        pipeline.zcard(window_key)
        
        # Add current request
        pipeline.zadd(window_key, {str(now): now})
        
        # Set expiration
        pipeline.expire(window_key, window + 1)
        
        results = pipeline.execute()
        current_count = results[1]
        
        # Check burst limit
        if burst_limit:
            burst_key = f"rate_limit:burst:{key}"
            burst_count = self.redis.get(burst_key) or 0
            
            if int(burst_count) >= burst_limit:
                return False, {
                    'allowed': False,
                    'limit': limit,
                    'remaining': 0,
                    'reset_time': int(now + window),
                    'burst_limit_exceeded': True
                }
        
        is_allowed = current_count <= limit
        
        if not is_allowed:
            # Remove the request we just added since it's not allowed
            self.redis.zrem(window_key, str(now))
        
        return is_allowed, {
            'allowed': is_allowed,
            'limit': limit,
            'remaining': max(0, limit - current_count),
            'reset_time': int(now + window),
            'current_count': current_count
        }
    
    def increment_burst_counter(self, key: str, window: int = 60):
        """Increment burst counter"""
        burst_key = f"rate_limit:burst:{key}"
        pipeline = self.redis.pipeline()
        pipeline.incr(burst_key)
        pipeline.expire(burst_key, window)
        pipeline.execute()

# Distributed rate limiting middleware
class DistributedRateLimitMiddleware:
    """Distributed rate limiting middleware using Redis"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.rate_limiter = AdvancedRateLimiter()
        self.enabled = os.environ.get('RATE_LIMIT_ENABLE', 'True').lower() == 'true'
    
    def __call__(self, request):
        if not self.enabled:
            return self.get_response(request)
        
        # Get rate limit configuration for the endpoint
        rate_limit_config = self._get_rate_limit_config(request)
        
        if rate_limit_config:
            identifier = self._get_identifier(request)
            
            is_allowed, rate_info = self.rate_limiter.is_allowed(
                key=f"{rate_limit_config['action']}:{identifier}",
                limit=rate_limit_config['limit'],
                window=rate_limit_config['window'],
                burst_limit=rate_limit_config.get('burst_limit')
            )
            
            if not is_allowed:
                from django.http import JsonResponse
                
                response = JsonResponse({
                    'error': 'Rate limit exceeded',
                    'detail': f"Maximum {rate_limit_config['limit']} requests per {rate_limit_config['window']} seconds",
                    'rate_limit': rate_info
                }, status=429)
                
                # Add rate limit headers
                response['X-RateLimit-Limit'] = str(rate_info['limit'])
                response['X-RateLimit-Remaining'] = str(rate_info['remaining'])
                response['X-RateLimit-Reset'] = str(rate_info['reset_time'])
                response['Retry-After'] = str(rate_limit_config['window'])
                
                return response
        
        response = self.get_response(request)
        
        # Add rate limit headers to successful responses
        if rate_limit_config and hasattr(response, 'status_code') and response.status_code < 400:
            identifier = self._get_identifier(request)
            _, rate_info = self.rate_limiter.is_allowed(
                key=f"{rate_limit_config['action']}:{identifier}",
                limit=rate_limit_config['limit'],
                window=rate_limit_config['window'],
                burst_limit=rate_limit_config.get('burst_limit')
            )
            
            response['X-RateLimit-Limit'] = str(rate_info['limit'])
            response['X-RateLimit-Remaining'] = str(rate_info['remaining'])
            response['X-RateLimit-Reset'] = str(rate_info['reset_time'])
        
        return response
    
    def _get_rate_limit_config(self, request) -> dict:
        """Get rate limit configuration for the request"""
        path = request.path
        method = request.method
        
        # API endpoints
        if path.startswith('/api/'):
            if '/auth/' in path:
                return {
                    'action': 'api_auth',
                    'limit': int(os.environ.get('RATE_LIMIT_AUTH', '20')),
                    'window': 3600,  # 1 hour
                    'burst_limit': 5
                }
            elif '/ai-services/' in path:
                return {
                    'action': 'ai_analysis',
                    'limit': int(os.environ.get('RATE_LIMIT_AI', '10')),
                    'window': 3600,  # 1 hour
                    'burst_limit': 3
                }
            elif '/matching/' in path:
                return {
                    'action': 'matching_requests',
                    'limit': int(os.environ.get('RATE_LIMIT_MATCHING', '50')),
                    'window': 3600,  # 1 hour
                    'burst_limit': 10
                }
            elif method == 'POST' and '/upload' in path:
                return {
                    'action': 'file_uploads',
                    'limit': int(os.environ.get('RATE_LIMIT_UPLOADS', '20')),
                    'window': 3600,  # 1 hour
                    'burst_limit': 5
                }
            else:
                return {
                    'action': 'api_general',
                    'limit': int(os.environ.get('RATE_LIMIT_GENERAL', '100')),
                    'window': 3600,  # 1 hour
                    'burst_limit': 20
                }
        
        return None
    
    def _get_identifier(self, request) -> str:
        """Get unique identifier for rate limiting"""
        # Use user ID for authenticated requests
        if hasattr(request, 'user') and request.user.is_authenticated:
            return f"user:{request.user.id}"
        
        # Use IP address for anonymous requests
        ip_address = self._get_client_ip(request)
        return f"ip:{ip_address}"
    
    def _get_client_ip(self, request) -> str:
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        return ip

# Cache warming and preloading
class CachePreloader:
    """Preload frequently accessed data into cache"""
    
    @staticmethod
    def preload_popular_data():
        """Preload popular data into cache"""
        try:
            # Preload popular projects
            from projects.models import Project
            popular_projects = Project.objects.filter(
                status__in=['active', 'in_progress']
            ).order_by('-created_at')[:20]
            
            for project in popular_projects:
                cache_key = f"project_details:{project.id}"
                if not cache.get(cache_key):
                    # This would trigger your project serialization
                    project_data = {
                        'id': str(project.id),
                        'title': project.title,
                        'status': project.status,
                        # Add other frequently accessed fields
                    }
                    cache.set(cache_key, project_data, CACHE_TIMEOUTS['medium'])
            
            # Preload active developer profiles
            from users.models import User
            active_developers = User.objects.filter(
                role='developer',
                is_active=True
            ).order_by('-last_login')[:50]
            
            for developer in active_developers:
                cache_key = f"developer_profile:{developer.id}"
                if not cache.get(cache_key):
                    # This would trigger your profile serialization
                    profile_data = {
                        'id': str(developer.id),
                        'username': developer.username,
                        'is_active': developer.is_active,
                        # Add other frequently accessed fields
                    }
                    cache.set(cache_key, profile_data, CACHE_TIMEOUTS['medium'])
            
            logger.info("Cache preloading completed successfully")
            
        except Exception as e:
            logger.error(f"Cache preloading failed: {e}")

# Cache health monitoring
def monitor_cache_health():
    """Monitor cache health and performance"""
    try:
        import time
        
        # Test cache write/read performance
        start_time = time.time()
        test_key = f"health_test_{int(start_time)}"
        test_value = {"timestamp": start_time, "test": True}
        
        # Write test
        cache.set(test_key, test_value, 60)
        write_time = time.time() - start_time
        
        # Read test
        start_time = time.time()
        retrieved_value = cache.get(test_key)
        read_time = time.time() - start_time
        
        # Cleanup
        cache.delete(test_key)
        
        # Check if values match
        if retrieved_value != test_value:
            raise Exception("Cache read/write test failed - values don't match")
        
        # Log performance metrics
        logger.info(f"Cache performance - Write: {write_time:.3f}s, Read: {read_time:.3f}s")
        
        # Alert if performance is poor
        if write_time > 0.1 or read_time > 0.1:
            logger.warning(f"Cache performance degraded - Write: {write_time:.3f}s, Read: {read_time:.3f}s")
        
        return {
            'status': 'healthy',
            'write_time': write_time,
            'read_time': read_time,
            'total_time': write_time + read_time
        }
        
    except Exception as e:
        logger.error(f"Cache health check failed: {e}")
        return {
            'status': 'unhealthy',
            'error': str(e)
        }