"""
Advanced caching service for intelligent matching system with performance optimization.
"""

import json
import hashlib
import logging
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction
from django.conf import settings

from .models import MatchingCache

logger = logging.getLogger(__name__)


class MatchingCacheService:
    """
    Advanced caching service for matching results with intelligent cache management,
    performance optimization, and analytics tracking.
    """
    
    def __init__(self):
        self.default_cache_duration = getattr(settings, 'MATCHING_CACHE_DURATION', 3600)  # 1 hour
        self.max_cache_entries = getattr(settings, 'MAX_MATCHING_CACHE_ENTRIES', 10000)
        self.cache_prefix = 'matching_cache'
        
    def get_cached_result(self, search_type: str, parameters: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached matching result if available and not expired.
        
        Args:
            search_type: Type of search (developer_match, project_match, batch_match)
            parameters: Search parameters used to generate cache key
            
        Returns:
            Cached result if available, None otherwise
        """
        try:
            cache_key = self._generate_cache_key(search_type, parameters)
            
            # Try memory cache first (fastest)
            memory_result = cache.get(cache_key)
            if memory_result:
                logger.debug(f"Cache hit (memory): {cache_key}")
                return memory_result
            
            # Try database cache
            try:
                cache_entry = MatchingCache.objects.get(cache_key=cache_key)
                
                if cache_entry.is_expired():
                    # Clean up expired entry
                    cache_entry.delete()
                    logger.debug(f"Cache expired and cleaned: {cache_key}")
                    return None
                
                # Update hit count and last accessed
                cache_entry.increment_hit_count()
                
                # Store in memory cache for faster future access
                cache.set(cache_key, cache_entry.cache_data, self.default_cache_duration)
                
                logger.debug(f"Cache hit (database): {cache_key}")
                return cache_entry.cache_data
                
            except MatchingCache.DoesNotExist:
                logger.debug(f"Cache miss: {cache_key}")
                return None
                
        except Exception as e:
            logger.error(f"Error retrieving cached result: {e}")
            return None
    
    def store_result(self, search_type: str, parameters: Dict[str, Any], 
                    result: Dict[str, Any], cache_duration: Optional[int] = None) -> bool:
        """
        Store matching result in cache with intelligent expiration and cleanup.
        
        Args:
            search_type: Type of search
            parameters: Search parameters
            result: Result to cache
            cache_duration: Custom cache duration in seconds
            
        Returns:
            True if successfully cached, False otherwise
        """
        try:
            cache_key = self._generate_cache_key(search_type, parameters)
            parameters_hash = self._generate_parameters_hash(parameters)
            duration = cache_duration or self.default_cache_duration
            expires_at = timezone.now() + timedelta(seconds=duration)
            
            # Store in memory cache
            cache.set(cache_key, result, duration)
            
            # Store in database cache with metadata
            with transaction.atomic():
                cache_entry, created = MatchingCache.objects.update_or_create(
                    cache_key=cache_key,
                    defaults={
                        'cache_data': result,
                        'search_type': search_type,
                        'parameters_hash': parameters_hash,
                        'expires_at': expires_at,
                        'hit_count': 0 if created else 1
                    }
                )
                
                if not created:
                    cache_entry.increment_hit_count()
            
            # Perform cache cleanup if needed
            self._cleanup_cache_if_needed()
            
            logger.debug(f"Result cached: {cache_key}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing result in cache: {e}")
            return False
    
    def invalidate_cache(self, search_type: Optional[str] = None, 
                        user_id: Optional[str] = None,
                        project_id: Optional[str] = None) -> int:
        """
        Invalidate cache entries based on criteria.
        
        Args:
            search_type: Specific search type to invalidate
            user_id: Invalidate caches related to specific user
            project_id: Invalidate caches related to specific project
            
        Returns:
            Number of cache entries invalidated
        """
        try:
            invalidated_count = 0
            
            # Build filter criteria
            filters = {}
            if search_type:
                filters['search_type'] = search_type
            
            # Get cache entries to invalidate
            cache_entries = MatchingCache.objects.filter(**filters)
            
            # Additional filtering based on user_id or project_id
            if user_id or project_id:
                entries_to_invalidate = []
                for entry in cache_entries:
                    should_invalidate = False
                    
                    # Check if cache data contains the user_id or project_id
                    cache_data = entry.cache_data
                    if isinstance(cache_data, dict):
                        if user_id and self._contains_user_id(cache_data, user_id):
                            should_invalidate = True
                        if project_id and self._contains_project_id(cache_data, project_id):
                            should_invalidate = True
                    
                    if should_invalidate:
                        entries_to_invalidate.append(entry.cache_key)
                
                # Delete from memory cache
                for cache_key in entries_to_invalidate:
                    cache.delete(cache_key)
                
                # Delete from database
                invalidated_count = MatchingCache.objects.filter(
                    cache_key__in=entries_to_invalidate
                ).delete()[0]
            else:
                # Delete all matching entries
                cache_keys = list(cache_entries.values_list('cache_key', flat=True))
                
                # Delete from memory cache
                for cache_key in cache_keys:
                    cache.delete(cache_key)
                
                # Delete from database
                invalidated_count = cache_entries.delete()[0]
            
            logger.info(f"Invalidated {invalidated_count} cache entries")
            return invalidated_count
            
        except Exception as e:
            logger.error(f"Error invalidating cache: {e}")
            return 0
    
    def get_cache_statistics(self) -> Dict[str, Any]:
        """
        Get comprehensive cache performance statistics.
        
        Returns:
            Dictionary containing cache statistics
        """
        try:
            from django.db.models import Count, Avg, Sum, Max, Min
            
            # Basic statistics
            total_entries = MatchingCache.objects.count()
            expired_entries = MatchingCache.objects.filter(
                expires_at__lt=timezone.now()
            ).count()
            
            # Hit statistics
            hit_stats = MatchingCache.objects.aggregate(
                total_hits=Sum('hit_count'),
                avg_hits=Avg('hit_count'),
                max_hits=Max('hit_count'),
                min_hits=Min('hit_count')
            )
            
            # Search type breakdown
            search_type_stats = list(
                MatchingCache.objects.values('search_type')
                .annotate(count=Count('id'), total_hits=Sum('hit_count'))
                .order_by('-count')
            )
            
            # Recent activity
            recent_entries = MatchingCache.objects.order_by('-last_accessed')[:10]
            recent_activity = [
                {
                    'cache_key': entry.cache_key,
                    'search_type': entry.search_type,
                    'hit_count': entry.hit_count,
                    'last_accessed': entry.last_accessed,
                    'is_expired': entry.is_expired()
                }
                for entry in recent_entries
            ]
            
            return {
                'total_entries': total_entries,
                'expired_entries': expired_entries,
                'active_entries': total_entries - expired_entries,
                'hit_statistics': hit_stats,
                'search_type_breakdown': search_type_stats,
                'recent_activity': recent_activity,
                'cache_efficiency': self._calculate_cache_efficiency(hit_stats, total_entries)
            }
            
        except Exception as e:
            logger.error(f"Error getting cache statistics: {e}")
            return {}
    
    def cleanup_expired_cache(self) -> int:
        """
        Clean up expired cache entries.
        
        Returns:
            Number of entries cleaned up
        """
        try:
            expired_entries = MatchingCache.objects.filter(
                expires_at__lt=timezone.now()
            )
            
            # Get cache keys to delete from memory cache
            cache_keys = list(expired_entries.values_list('cache_key', flat=True))
            
            # Delete from memory cache
            for cache_key in cache_keys:
                cache.delete(cache_key)
            
            # Delete from database
            deleted_count = expired_entries.delete()[0]
            
            logger.info(f"Cleaned up {deleted_count} expired cache entries")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up expired cache: {e}")
            return 0
    
    def optimize_cache_performance(self) -> Dict[str, Any]:
        """
        Optimize cache performance by analyzing usage patterns and cleaning up.
        
        Returns:
            Optimization results
        """
        try:
            results = {
                'expired_cleaned': 0,
                'low_hit_cleaned': 0,
                'total_before': 0,
                'total_after': 0
            }
            
            results['total_before'] = MatchingCache.objects.count()
            
            # Clean up expired entries
            results['expired_cleaned'] = self.cleanup_expired_cache()
            
            # Clean up entries with very low hit counts that are old
            old_threshold = timezone.now() - timedelta(days=7)
            low_hit_entries = MatchingCache.objects.filter(
                created_at__lt=old_threshold,
                hit_count__lte=1
            )
            
            # Delete low-hit entries from memory cache
            low_hit_keys = list(low_hit_entries.values_list('cache_key', flat=True))
            for cache_key in low_hit_keys:
                cache.delete(cache_key)
            
            results['low_hit_cleaned'] = low_hit_entries.delete()[0]
            results['total_after'] = MatchingCache.objects.count()
            
            logger.info(f"Cache optimization completed: {results}")
            return results
            
        except Exception as e:
            logger.error(f"Error optimizing cache performance: {e}")
            return {}
    
    # Private helper methods
    
    def _generate_cache_key(self, search_type: str, parameters: Dict[str, Any]) -> str:
        """Generate unique cache key from search parameters."""
        # Sort parameters for consistent key generation
        sorted_params = json.dumps(parameters, sort_keys=True)
        params_hash = hashlib.md5(sorted_params.encode()).hexdigest()
        return f"{self.cache_prefix}:{search_type}:{params_hash}"
    
    def _generate_parameters_hash(self, parameters: Dict[str, Any]) -> str:
        """Generate hash of parameters for duplicate detection."""
        sorted_params = json.dumps(parameters, sort_keys=True)
        return hashlib.sha256(sorted_params.encode()).hexdigest()
    
    def _cleanup_cache_if_needed(self):
        """Clean up cache if it exceeds maximum entries."""
        try:
            current_count = MatchingCache.objects.count()
            if current_count > self.max_cache_entries:
                # Delete oldest entries with lowest hit counts
                entries_to_delete = MatchingCache.objects.order_by(
                    'hit_count', 'created_at'
                )[:current_count - self.max_cache_entries]
                
                cache_keys = list(entries_to_delete.values_list('cache_key', flat=True))
                
                # Delete from memory cache
                for cache_key in cache_keys:
                    cache.delete(cache_key)
                
                # Delete from database
                deleted_count = entries_to_delete.delete()[0]
                logger.info(f"Cleaned up {deleted_count} old cache entries")
                
        except Exception as e:
            logger.error(f"Error in cache cleanup: {e}")
    
    def _contains_user_id(self, cache_data: Dict[str, Any], user_id: str) -> bool:
        """Check if cache data contains references to specific user ID."""
        if isinstance(cache_data, dict):
            # Check in matches array
            matches = cache_data.get('matches', [])
            if isinstance(matches, list):
                for match in matches:
                    if isinstance(match, dict):
                        if match.get('developer_id') == user_id:
                            return True
                        if match.get('client_id') == user_id:
                            return True
        return False
    
    def _contains_project_id(self, cache_data: Dict[str, Any], project_id: str) -> bool:
        """Check if cache data contains references to specific project ID."""
        if isinstance(cache_data, dict):
            # Check in matches array
            matches = cache_data.get('matches', [])
            if isinstance(matches, list):
                for match in matches:
                    if isinstance(match, dict):
                        if match.get('project_id') == project_id:
                            return True
        return False
    
    def _calculate_cache_efficiency(self, hit_stats: Dict[str, Any], total_entries: int) -> float:
        """Calculate cache efficiency based on hit statistics."""
        if not total_entries or not hit_stats.get('total_hits'):
            return 0.0
        
        avg_hits = hit_stats.get('avg_hits', 0)
        if avg_hits > 1:
            return min(avg_hits / 10, 1.0)  # Normalize to 0-1 scale
        return avg_hits


# Singleton instance
matching_cache_service = MatchingCacheService()