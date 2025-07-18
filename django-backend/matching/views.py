from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db import models
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import logging
import json

from .models import DeveloperMatch, MatchingPreferences, MatchingAnalytics, MatchingCache
from .serializers import (
    DeveloperMatchSerializer, MatchingPreferencesSerializer, 
    MatchingAnalyticsSerializer, RealTimeMatchSerializer, MatchingFeedbackSerializer
)
from .cache_service import matching_cache_service
from ai_services.hybrid_rag_service import hybrid_rag_service
from projects.models import Project, Task
from users.models import DeveloperProfile

User = get_user_model()
logger = logging.getLogger(__name__)


class DeveloperMatchViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing AI-generated developer matches"""
    
    queryset = DeveloperMatch.objects.all()
    serializer_class = DeveloperMatchSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter matches based on user role"""
        user = self.request.user
        
        if user.is_staff:
            return self.queryset
        
        # Return matches where user is the matched developer, project client, or senior developer
        return self.queryset.filter(
            models.Q(developer=user) | 
            models.Q(task__project__client=user) | 
            models.Q(task__project__senior_developer=user)
        )


class RealTimeMatchingViewSet(viewsets.ViewSet):
    """ViewSet for real-time intelligent matching with confidence scoring"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def find_developers(self, request):
        """Find matching developers for a project with real-time analysis and advanced caching"""
        start_time = timezone.now()
        
        try:
            project_id = request.data.get('project_id')
            task_id = request.data.get('task_id')
            limit = int(request.data.get('limit', 20))
            include_analysis = request.data.get('include_analysis', True)
            force_refresh = request.data.get('force_refresh', False)
            
            if not project_id and not task_id:
                return Response(
                    {'error': 'Either project_id or task_id is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get project data
            if task_id:
                try:
                    task = Task.objects.get(id=task_id)
                    project = task.project
                    project_data = self._prepare_task_data(task)
                except Task.DoesNotExist:
                    return Response(
                        {'error': 'Task not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                try:
                    project = Project.objects.get(id=project_id)
                    project_data = self._prepare_project_data(project)
                except Project.DoesNotExist:
                    return Response(
                        {'error': 'Project not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Check permissions
            if not self._has_matching_permission(request.user, project):
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Apply user preferences
            preferences = self._get_user_preferences(request.user)
            if preferences:
                project_data = self._apply_preferences(project_data, preferences)
            
            # Prepare search parameters for caching
            search_params = {
                'project_data': project_data,
                'limit': limit,
                'include_analysis': include_analysis,
                'user_id': str(request.user.id),
                'preferences': self._serialize_preferences(preferences) if preferences else None
            }
            
            # Check cache first (unless force refresh)
            cached_result = None
            cache_hit = False
            if not force_refresh:
                cached_result = matching_cache_service.get_cached_result(
                    'developer_match', search_params
                )
                if cached_result:
                    cache_hit = True
                    logger.info(f"Cache hit for developer matching: {project_id or task_id}")
            
            if cached_result:
                # Return cached result with updated timestamp
                response_data = cached_result.copy()
                response_data.update({
                    'search_timestamp': timezone.now(),
                    'cache_hit': True,
                    'response_time_ms': int((timezone.now() - start_time).total_seconds() * 1000)
                })
                
                # Record analytics for cache hit
                self._record_matching_analytics(
                    request.user, project, len(response_data.get('matches', [])),
                    cache_hit=True, response_time_ms=response_data['response_time_ms']
                )
                
                return Response(response_data)
            
            # Find matching developers using hybrid RAG
            matches = hybrid_rag_service.find_matching_developers(
                project_data, limit, include_analysis
            )
            
            # Store matches in database for persistence
            stored_matches = self._store_matches(matches, project, task_id)
            
            # Serialize response
            serializer = RealTimeMatchSerializer(stored_matches, many=True)
            
            # Calculate response time
            response_time_ms = int((timezone.now() - start_time).total_seconds() * 1000)
            
            # Prepare response data
            response_data = {
                'matches': serializer.data,
                'total_found': len(matches),
                'search_timestamp': timezone.now(),
                'cache_duration': 3600,  # 1 hour
                'confidence_threshold': 0.7,
                'cache_hit': False,
                'response_time_ms': response_time_ms,
                'search_metadata': {
                    'algorithm_version': '2.0',
                    'vector_weight': 0.4,
                    'graph_weight': 0.3,
                    'availability_weight': 0.2,
                    'reputation_weight': 0.1
                }
            }
            
            # Cache the result for future requests
            matching_cache_service.store_result(
                'developer_match', search_params, response_data
            )
            
            # Record analytics
            self._record_matching_analytics(
                request.user, project, len(matches),
                cache_hit=False, response_time_ms=response_time_ms
            )
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error in find_developers: {e}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def find_projects(self, request):
        """Find matching projects for a developer with real-time analysis"""
        try:
            developer_id = request.data.get('developer_id', request.user.id)
            limit = int(request.data.get('limit', 20))
            include_analysis = request.data.get('include_analysis', True)
            
            # Get developer data
            try:
                developer = User.objects.get(id=developer_id)
                developer_profile = getattr(developer, 'developerprofile', None)
                
                if not developer_profile:
                    return Response(
                        {'error': 'Developer profile not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                developer_data = self._prepare_developer_data(developer, developer_profile)
                
            except User.DoesNotExist:
                return Response(
                    {'error': 'Developer not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check permissions
            if developer_id != request.user.id and not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Apply user preferences
            preferences = self._get_user_preferences(request.user)
            if preferences:
                developer_data = self._apply_developer_preferences(developer_data, preferences)
            
            # Find matching projects using hybrid RAG
            matches = hybrid_rag_service.find_matching_projects(
                developer_data, limit, include_analysis
            )
            
            # Record analytics
            self._record_matching_analytics(request.user, None, len(matches), 'project_search')
            
            return Response({
                'matches': matches,
                'total_found': len(matches),
                'search_timestamp': timezone.now(),
                'cache_duration': 3600,  # 1 hour
                'confidence_threshold': 0.7
            })
            
        except Exception as e:
            logger.error(f"Error in find_projects: {e}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def batch_match(self, request):
        """Batch matching for multiple projects or developers"""
        try:
            batch_type = request.data.get('type')  # 'projects' or 'developers'
            items = request.data.get('items', [])
            limit_per_item = int(request.data.get('limit_per_item', 10))
            
            if not batch_type or not items:
                return Response(
                    {'error': 'Type and items are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            results = []
            
            if batch_type == 'projects':
                for project_id in items:
                    try:
                        project = Project.objects.get(id=project_id)
                        if self._has_matching_permission(request.user, project):
                            project_data = self._prepare_project_data(project)
                            matches = hybrid_rag_service.find_matching_developers(
                                project_data, limit_per_item, False
                            )
                            results.append({
                                'project_id': project_id,
                                'matches': matches[:limit_per_item],
                                'total_found': len(matches)
                            })
                    except Project.DoesNotExist:
                        results.append({
                            'project_id': project_id,
                            'error': 'Project not found'
                        })
            
            elif batch_type == 'developers':
                for developer_id in items:
                    try:
                        developer = User.objects.get(id=developer_id)
                        developer_profile = getattr(developer, 'developerprofile', None)
                        
                        if developer_profile:
                            developer_data = self._prepare_developer_data(developer, developer_profile)
                            matches = hybrid_rag_service.find_matching_projects(
                                developer_data, limit_per_item, False
                            )
                            results.append({
                                'developer_id': developer_id,
                                'matches': matches[:limit_per_item],
                                'total_found': len(matches)
                            })
                    except User.DoesNotExist:
                        results.append({
                            'developer_id': developer_id,
                            'error': 'Developer not found'
                        })
            
            return Response({
                'batch_results': results,
                'processed_count': len(results),
                'timestamp': timezone.now()
            })
            
        except Exception as e:
            logger.error(f"Error in batch_match: {e}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def provide_feedback(self, request):
        """Provide feedback on matching results for improvement with structured validation"""
        try:
            # Use the feedback serializer for validation
            serializer = MatchingFeedbackSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'error': 'Invalid feedback data', 'details': serializer.errors}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            validated_data = serializer.validated_data
            match_id = validated_data['match_id']
            
            try:
                match = DeveloperMatch.objects.get(id=match_id)
                
                # Check permissions
                if not self._has_feedback_permission(request.user, match):
                    return Response(
                        {'error': 'Permission denied'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Store comprehensive feedback in analytics
                self._record_comprehensive_feedback(request.user, match, validated_data)
                
                # Invalidate related cache entries to ensure fresh results
                matching_cache_service.invalidate_cache(
                    user_id=str(request.user.id),
                    project_id=str(match.task.project.id)
                )
                
                return Response({
                    'message': 'Feedback recorded successfully',
                    'match_id': str(match_id),
                    'feedback_type': validated_data['feedback_type'],
                    'cache_invalidated': True
                })
                
            except DeveloperMatch.DoesNotExist:
                return Response(
                    {'error': 'Match not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
        except Exception as e:
            logger.error(f"Error in provide_feedback: {e}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def advanced_search(self, request):
        """Advanced search with custom filters and scoring weights"""
        try:
            search_type = request.data.get('search_type', 'developers')  # 'developers' or 'projects'
            filters = request.data.get('filters', {})
            custom_weights = request.data.get('custom_weights', {})
            limit = int(request.data.get('limit', 20))
            
            # Validate search type
            if search_type not in ['developers', 'projects']:
                return Response(
                    {'error': 'Invalid search type. Must be "developers" or "projects"'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if search_type == 'developers':
                project_id = filters.get('project_id')
                if not project_id:
                    return Response(
                        {'error': 'project_id is required for developer search'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                try:
                    project = Project.objects.get(id=project_id)
                    if not self._has_matching_permission(request.user, project):
                        return Response(
                            {'error': 'Permission denied'}, 
                            status=status.HTTP_403_FORBIDDEN
                        )
                    
                    # Prepare advanced search parameters
                    search_params = self._prepare_advanced_search_params(
                        project, filters, custom_weights
                    )
                    
                    # Perform advanced matching
                    matches = self._perform_advanced_developer_search(search_params, limit)
                    
                    return Response({
                        'matches': matches,
                        'total_found': len(matches),
                        'search_type': search_type,
                        'filters_applied': filters,
                        'custom_weights': custom_weights,
                        'timestamp': timezone.now()
                    })
                    
                except Project.DoesNotExist:
                    return Response(
                        {'error': 'Project not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            else:  # projects search
                developer_id = filters.get('developer_id', request.user.id)
                
                try:
                    developer = User.objects.get(id=developer_id)
                    developer_profile = getattr(developer, 'developerprofile', None)
                    
                    if not developer_profile:
                        return Response(
                            {'error': 'Developer profile not found'}, 
                            status=status.HTTP_404_NOT_FOUND
                        )
                    
                    # Check permissions
                    if developer_id != request.user.id and not request.user.is_staff:
                        return Response(
                            {'error': 'Permission denied'}, 
                            status=status.HTTP_403_FORBIDDEN
                        )
                    
                    # Prepare advanced search parameters
                    search_params = self._prepare_advanced_project_search_params(
                        developer, developer_profile, filters, custom_weights
                    )
                    
                    # Perform advanced matching
                    matches = self._perform_advanced_project_search(search_params, limit)
                    
                    return Response({
                        'matches': matches,
                        'total_found': len(matches),
                        'search_type': search_type,
                        'filters_applied': filters,
                        'custom_weights': custom_weights,
                        'timestamp': timezone.now()
                    })
                    
                except User.DoesNotExist:
                    return Response(
                        {'error': 'Developer not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            
        except Exception as e:
            logger.error(f"Error in advanced_search: {e}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def cache_statistics(self, request):
        """Get cache performance statistics"""
        try:
            if not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            stats = matching_cache_service.get_cache_statistics()
            return Response(stats)
            
        except Exception as e:
            logger.error(f"Error getting cache statistics: {e}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def invalidate_cache(self, request):
        """Invalidate cache entries based on criteria"""
        try:
            search_type = request.data.get('search_type')
            user_id = request.data.get('user_id')
            project_id = request.data.get('project_id')
            
            # Only allow users to invalidate their own cache or staff to invalidate any
            if user_id and user_id != str(request.user.id) and not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            invalidated_count = matching_cache_service.invalidate_cache(
                search_type=search_type,
                user_id=user_id,
                project_id=project_id
            )
            
            return Response({
                'message': 'Cache invalidated successfully',
                'invalidated_entries': invalidated_count
            })
            
        except Exception as e:
            logger.error(f"Error invalidating cache: {e}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def optimize_cache(self, request):
        """Optimize cache performance"""
        try:
            if not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            optimization_results = matching_cache_service.optimize_cache_performance()
            return Response({
                'message': 'Cache optimization completed',
                'results': optimization_results
            })
            
        except Exception as e:
            logger.error(f"Error optimizing cache: {e}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Helper methods
    
    def _prepare_project_data(self, project):
        """Prepare project data for matching"""
        return {
            'id': str(project.id),
            'title': project.title,
            'description': project.description,
            'required_skills': project.ai_analysis.get('required_skills', []) if project.ai_analysis else [],
            'complexity': project.ai_analysis.get('complexity', 'medium') if project.ai_analysis else 'medium',
            'budget_estimate': float(project.budget_estimate) if project.budget_estimate else 0.0,
            'timeline_estimate': project.timeline_estimate.total_seconds() if project.timeline_estimate else 0,
            'client_id': str(project.client.id),
            'senior_developer_required': project.ai_analysis.get('senior_developer_required', False) if project.ai_analysis else False
        }
    
    def _prepare_task_data(self, task):
        """Prepare task data for matching"""
        project_data = self._prepare_project_data(task.project)
        project_data.update({
            'task_id': str(task.id),
            'task_title': task.title,
            'task_description': task.description,
            'required_skills': task.required_skills,
            'estimated_hours': task.estimated_hours,
            'priority': task.priority
        })
        return project_data
    
    def _prepare_developer_data(self, developer, developer_profile):
        """Prepare developer data for matching"""
        return {
            'id': str(developer.id),
            'username': developer.username,
            'skills': developer_profile.skills,
            'experience_level': developer_profile.experience_level,
            'hourly_rate': float(developer_profile.hourly_rate) if developer_profile.hourly_rate else 0.0,
            'availability_status': developer_profile.availability_status,
            'github_analysis': developer_profile.github_analysis,
            'reputation_score': developer_profile.reputation_score,
            'skill_embeddings': developer_profile.skill_embeddings
        }
    
    def _has_matching_permission(self, user, project):
        """Check if user has permission to access matching for project"""
        return (
            user.is_staff or 
            user == project.client or 
            user == project.senior_developer
        )
    
    def _has_feedback_permission(self, user, match):
        """Check if user has permission to provide feedback on match"""
        return (
            user.is_staff or
            user == match.developer or
            user == match.task.project.client or
            user == match.task.project.senior_developer
        )
    
    def _get_user_preferences(self, user):
        """Get user's matching preferences"""
        try:
            return MatchingPreferences.objects.get(user=user)
        except MatchingPreferences.DoesNotExist:
            return None
    
    def _apply_preferences(self, project_data, preferences):
        """Apply user preferences to project data"""
        # Apply budget filters
        if preferences.min_budget and project_data.get('budget_estimate', 0) < preferences.min_budget:
            project_data['budget_boost'] = 0.8  # Reduce matching score
        
        if preferences.max_budget and project_data.get('budget_estimate', 0) > preferences.max_budget:
            project_data['budget_boost'] = 0.8
        
        # Apply skill preferences
        if preferences.preferred_skills:
            project_data['preferred_skills'] = preferences.preferred_skills
        
        if preferences.excluded_skills:
            project_data['excluded_skills'] = preferences.excluded_skills
        
        return project_data
    
    def _apply_developer_preferences(self, developer_data, preferences):
        """Apply user preferences to developer search"""
        # Apply experience level preferences
        if preferences.min_experience_level:
            developer_data['min_experience_filter'] = preferences.min_experience_level
        
        # Apply rate preferences
        if preferences.max_hourly_rate:
            developer_data['max_rate_filter'] = preferences.max_hourly_rate
        
        return developer_data
    
    def _store_matches(self, matches, project, task_id=None):
        """Store matches in database for caching"""
        stored_matches = []
        
        for match_data in matches:
            try:
                developer = User.objects.get(id=match_data['developer_id'])
                
                # Get or create task
                if task_id:
                    task = Task.objects.get(id=task_id)
                else:
                    # Create a temporary task for project-level matching
                    task, created = Task.objects.get_or_create(
                        project=project,
                        title=f"Project Match - {project.title}",
                        defaults={
                            'description': 'Temporary task for project-level matching',
                            'required_skills': match_data.get('required_skills', []),
                            'estimated_hours': 40,
                            'priority': 1
                        }
                    )
                
                # Create or update match
                match, created = DeveloperMatch.objects.update_or_create(
                    task=task,
                    developer=developer,
                    defaults={
                        'match_score': match_data.get('final_score', 0.0),
                        'vector_score': match_data.get('vector_score', 0.0),
                        'graph_score': match_data.get('graph_score', 0.0),
                        'availability_score': match_data.get('availability_score', 0.0)
                    }
                )
                
                stored_matches.append(match)
                
            except (User.DoesNotExist, Task.DoesNotExist) as e:
                logger.warning(f"Error storing match: {e}")
                continue
        
        return stored_matches
    
    def _serialize_preferences(self, preferences):
        """Serialize preferences for caching"""
        if not preferences:
            return None
        
        return {
            'min_budget': float(preferences.min_budget) if preferences.min_budget else None,
            'max_budget': float(preferences.max_budget) if preferences.max_budget else None,
            'min_hourly_rate': float(preferences.min_hourly_rate) if preferences.min_hourly_rate else None,
            'max_hourly_rate': float(preferences.max_hourly_rate) if preferences.max_hourly_rate else None,
            'min_experience_level': preferences.min_experience_level,
            'max_experience_level': preferences.max_experience_level,
            'preferred_skills': preferences.preferred_skills,
            'excluded_skills': preferences.excluded_skills,
            'preferred_timezones': preferences.preferred_timezones,
            'remote_only': preferences.remote_only,
            'preferred_project_types': preferences.preferred_project_types,
            'excluded_project_types': preferences.excluded_project_types,
            'skill_weight': preferences.skill_weight,
            'experience_weight': preferences.experience_weight,
            'availability_weight': preferences.availability_weight,
            'reputation_weight': preferences.reputation_weight
        }

class MatchingPreferencesViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user matching preferences"""
    
    serializer_class = MatchingPreferencesSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return preferences for current user"""
        return MatchingPreferences.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Set user when creating preferences"""
        serializer.save(user=self.request.user)


class MatchingAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing matching analytics"""
    
    serializer_class = MatchingAnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return analytics based on user role"""
        user = self.request.user
        
        if user.is_staff:
            return MatchingAnalytics.objects.all()
        
        # Return analytics for user's projects and searches
        return MatchingAnalytics.objects.filter(
            models.Q(user=user) |
            models.Q(project__client=user) |
            models.Q(project__senior_developer=user)
        )
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get matching analytics summary"""
        try:
            queryset = self.get_queryset()
            
            # Calculate summary statistics
            total_searches = queryset.count()
            avg_matches = queryset.aggregate(
                avg_matches=models.Avg('match_count')
            )['avg_matches'] or 0
            
            # Get search type breakdown
            search_types = queryset.values('search_type').annotate(
                count=models.Count('id')
            ).order_by('-count')
            
            # Get recent activity
            recent_activity = queryset.order_by('-timestamp')[:10]
            recent_serializer = self.get_serializer(recent_activity, many=True)
            
            return Response({
                'total_searches': total_searches,
                'average_matches_per_search': round(avg_matches, 2),
                'search_type_breakdown': list(search_types),
                'recent_activity': recent_serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error generating analytics summary: {e}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    def _record_matching_analytics(self, user, project, match_count, search_type='developer_search', 
                                 cache_hit=False, response_time_ms=None):
        """Record matching analytics with enhanced metrics"""
        try:
            MatchingAnalytics.objects.create(
                user=user,
                project=project,
                search_type=search_type,
                match_count=match_count,
                response_time_ms=response_time_ms,
                cache_hit=cache_hit,
                timestamp=timezone.now()
            )
        except Exception as e:
            logger.error(f"Error recording analytics: {e}")
    
    def _record_comprehensive_feedback(self, user, match, validated_data):
        """Record comprehensive feedback for match improvement"""
        try:
            feedback_details = {
                'feedback_type': validated_data['feedback_type'],
                'rating': validated_data.get('rating'),
                'comments': validated_data.get('comments', ''),
                'skill_match_accuracy': validated_data.get('skill_match_accuracy'),
                'experience_relevance': validated_data.get('experience_relevance'),
                'availability_accuracy': validated_data.get('availability_accuracy'),
                'suggested_skills': validated_data.get('suggested_skills', []),
                'match_scores': {
                    'vector_score': match.vector_score,
                    'graph_score': match.graph_score,
                    'availability_score': match.availability_score,
                    'final_score': match.match_score
                }
            }
            
            # Create or update analytics entry for feedback
            analytics, created = MatchingAnalytics.objects.get_or_create(
                user=user,
                project=match.task.project,
                search_type='feedback',
                defaults={
                    'match_count': 1,
                    'timestamp': timezone.now(),
                    'feedback_data': feedback_details
                }
            )
            
            if not created:
                # Update existing feedback
                if not analytics.feedback_data:
                    analytics.feedback_data = {}
                
                analytics.feedback_data.update(feedback_details)
                analytics.feedback_data['updated_at'] = timezone.now().isoformat()
                analytics.save()
                
        except Exception as e:
            logger.error(f"Error recording comprehensive feedback: {e}")
    
    def _prepare_advanced_search_params(self, project, filters, custom_weights):
        """Prepare parameters for advanced developer search"""
        project_data = self._prepare_project_data(project)
        
        # Apply advanced filters
        if filters.get('min_experience_years'):
            project_data['min_experience_years'] = filters['min_experience_years']
        
        if filters.get('max_hourly_rate'):
            project_data['max_hourly_rate'] = filters['max_hourly_rate']
        
        if filters.get('required_skills'):
            project_data['required_skills'].extend(filters['required_skills'])
        
        if filters.get('excluded_skills'):
            project_data['excluded_skills'] = filters['excluded_skills']
        
        if filters.get('availability_status'):
            project_data['required_availability'] = filters['availability_status']
        
        if filters.get('min_reputation_score'):
            project_data['min_reputation_score'] = filters['min_reputation_score']
        
        # Apply custom weights
        if custom_weights:
            project_data['custom_weights'] = custom_weights
        
        return project_data
    
    def _prepare_advanced_project_search_params(self, developer, developer_profile, filters, custom_weights):
        """Prepare parameters for advanced project search"""
        developer_data = self._prepare_developer_data(developer, developer_profile)
        
        # Apply advanced filters
        if filters.get('min_budget'):
            developer_data['min_budget'] = filters['min_budget']
        
        if filters.get('max_budget'):
            developer_data['max_budget'] = filters['max_budget']
        
        if filters.get('project_types'):
            developer_data['preferred_project_types'] = filters['project_types']
        
        if filters.get('complexity_levels'):
            developer_data['preferred_complexity'] = filters['complexity_levels']
        
        if filters.get('remote_only'):
            developer_data['remote_only'] = filters['remote_only']
        
        # Apply custom weights
        if custom_weights:
            developer_data['custom_weights'] = custom_weights
        
        return developer_data
    
    def _perform_advanced_developer_search(self, search_params, limit):
        """Perform advanced developer search with custom parameters"""
        try:
            # Use hybrid RAG service with custom parameters
            matches = hybrid_rag_service.find_matching_developers(
                search_params, limit, include_analysis=True
            )
            
            # Apply additional filtering based on advanced parameters
            filtered_matches = []
            for match in matches:
                if self._passes_advanced_filters(match, search_params):
                    # Recalculate scores if custom weights provided
                    if search_params.get('custom_weights'):
                        match = self._recalculate_scores_with_custom_weights(
                            match, search_params['custom_weights']
                        )
                    filtered_matches.append(match)
            
            # Sort by final score
            filtered_matches.sort(key=lambda x: x.get('final_score', 0), reverse=True)
            return filtered_matches[:limit]
            
        except Exception as e:
            logger.error(f"Error in advanced developer search: {e}")
            return []
    
    def _perform_advanced_project_search(self, search_params, limit):
        """Perform advanced project search with custom parameters"""
        try:
            # Use hybrid RAG service with custom parameters
            matches = hybrid_rag_service.find_matching_projects(
                search_params, limit, include_analysis=True
            )
            
            # Apply additional filtering based on advanced parameters
            filtered_matches = []
            for match in matches:
                if self._passes_advanced_project_filters(match, search_params):
                    # Recalculate scores if custom weights provided
                    if search_params.get('custom_weights'):
                        match = self._recalculate_project_scores_with_custom_weights(
                            match, search_params['custom_weights']
                        )
                    filtered_matches.append(match)
            
            # Sort by final score
            filtered_matches.sort(key=lambda x: x.get('final_score', 0), reverse=True)
            return filtered_matches[:limit]
            
        except Exception as e:
            logger.error(f"Error in advanced project search: {e}")
            return []
    
    def _passes_advanced_filters(self, match, search_params):
        """Check if match passes advanced filtering criteria"""
        try:
            developer_info = match.get('developer_info', {})
            
            # Experience filter
            if search_params.get('min_experience_years'):
                # This would need to be calculated from developer profile
                # For now, use experience level as proxy
                experience_levels = {'junior': 1, 'mid': 3, 'senior': 5, 'lead': 8, 'principal': 10}
                dev_experience = experience_levels.get(developer_info.get('experience_level', 'junior'), 1)
                if dev_experience < search_params['min_experience_years']:
                    return False
            
            # Rate filter
            if search_params.get('max_hourly_rate'):
                dev_rate = developer_info.get('hourly_rate', 0)
                if dev_rate > search_params['max_hourly_rate']:
                    return False
            
            # Availability filter
            if search_params.get('required_availability'):
                dev_availability = developer_info.get('availability_status', 'unavailable')
                if dev_availability != search_params['required_availability']:
                    return False
            
            # Reputation filter
            if search_params.get('min_reputation_score'):
                reputation = match.get('reputation_score', 0)
                if reputation < search_params['min_reputation_score']:
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking advanced filters: {e}")
            return True
    
    def _passes_advanced_project_filters(self, match, search_params):
        """Check if project match passes advanced filtering criteria"""
        try:
            # Budget filters
            if search_params.get('min_budget'):
                project_budget = match.get('budget_estimate', 0)
                if project_budget < search_params['min_budget']:
                    return False
            
            if search_params.get('max_budget'):
                project_budget = match.get('budget_estimate', 0)
                if project_budget > search_params['max_budget']:
                    return False
            
            # Project type filter
            if search_params.get('preferred_project_types'):
                # This would need project categorization
                # For now, assume all projects pass
                pass
            
            # Complexity filter
            if search_params.get('preferred_complexity'):
                project_complexity = match.get('complexity', 'medium')
                if project_complexity not in search_params['preferred_complexity']:
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking advanced project filters: {e}")
            return True
    
    def _recalculate_scores_with_custom_weights(self, match, custom_weights):
        """Recalculate match scores with custom weights"""
        try:
            vector_score = match.get('vector_score', 0.0)
            graph_score = match.get('graph_score', 0.0)
            availability_score = match.get('availability_score', 0.0)
            reputation_score = match.get('reputation_score', 0.0)
            
            # Apply custom weights
            final_score = (
                vector_score * custom_weights.get('vector_weight', 0.4) +
                graph_score * custom_weights.get('graph_weight', 0.3) +
                availability_score * custom_weights.get('availability_weight', 0.2) +
                reputation_score * custom_weights.get('reputation_weight', 0.1)
            )
            
            match['final_score'] = final_score
            match['custom_weights_applied'] = custom_weights
            
            return match
            
        except Exception as e:
            logger.error(f"Error recalculating scores: {e}")
            return match
    
    def _recalculate_project_scores_with_custom_weights(self, match, custom_weights):
        """Recalculate project match scores with custom weights"""
        try:
            vector_score = match.get('vector_score', 0.0)
            graph_score = match.get('graph_score', 0.0)
            
            # For project matching, we might have different score components
            final_score = (
                vector_score * custom_weights.get('vector_weight', 0.6) +
                graph_score * custom_weights.get('graph_weight', 0.4)
            )
            
            match['final_score'] = final_score
            match['custom_weights_applied'] = custom_weights
            
            return match
            
        except Exception as e:
            logger.error(f"Error recalculating project scores: {e}")
            return match


class MatchingPreferencesViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user matching preferences"""
    
    serializer_class = MatchingPreferencesSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return preferences for current user"""
        return MatchingPreferences.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Set user when creating preferences"""
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        """Invalidate cache when preferences are updated"""
        instance = serializer.save()
        
        # Invalidate user's cache entries when preferences change
        matching_cache_service.invalidate_cache(user_id=str(self.request.user.id))
        
        logger.info(f"Invalidated cache for user {self.request.user.id} after preference update")


class MatchingAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing matching analytics with enhanced reporting"""
    
    serializer_class = MatchingAnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return analytics based on user role"""
        user = self.request.user
        
        if user.is_staff:
            return MatchingAnalytics.objects.all()
        
        # Return analytics for user's projects and searches
        return MatchingAnalytics.objects.filter(
            models.Q(user=user) |
            models.Q(project__client=user) |
            models.Q(project__senior_developer=user)
        )
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get comprehensive matching analytics summary"""
        try:
            queryset = self.get_queryset()
            
            # Calculate summary statistics
            total_searches = queryset.count()
            avg_matches = queryset.aggregate(
                avg_matches=models.Avg('match_count')
            )['avg_matches'] or 0
            
            # Performance metrics
            performance_stats = queryset.filter(
                response_time_ms__isnull=False
            ).aggregate(
                avg_response_time=models.Avg('response_time_ms'),
                max_response_time=models.Max('response_time_ms'),
                min_response_time=models.Min('response_time_ms')
            )
            
            # Cache efficiency
            cache_stats = queryset.aggregate(
                total_cache_hits=models.Count('id', filter=models.Q(cache_hit=True)),
                total_cache_misses=models.Count('id', filter=models.Q(cache_hit=False))
            )
            
            cache_hit_rate = 0
            if total_searches > 0:
                cache_hit_rate = (cache_stats['total_cache_hits'] / total_searches) * 100
            
            # Get search type breakdown
            search_types = queryset.values('search_type').annotate(
                count=models.Count('id'),
                avg_matches=models.Avg('match_count'),
                avg_response_time=models.Avg('response_time_ms')
            ).order_by('-count')
            
            # Get recent activity
            recent_activity = queryset.order_by('-timestamp')[:10]
            recent_serializer = self.get_serializer(recent_activity, many=True)
            
            # Feedback analysis
            feedback_entries = queryset.filter(search_type='feedback')
            feedback_summary = self._analyze_feedback_data(feedback_entries)
            
            return Response({
                'total_searches': total_searches,
                'average_matches_per_search': round(avg_matches, 2),
                'performance_metrics': {
                    'avg_response_time_ms': round(performance_stats['avg_response_time'] or 0, 2),
                    'max_response_time_ms': performance_stats['max_response_time'] or 0,
                    'min_response_time_ms': performance_stats['min_response_time'] or 0
                },
                'cache_efficiency': {
                    'hit_rate_percentage': round(cache_hit_rate, 2),
                    'total_hits': cache_stats['total_cache_hits'],
                    'total_misses': cache_stats['total_cache_misses']
                },
                'search_type_breakdown': list(search_types),
                'feedback_summary': feedback_summary,
                'recent_activity': recent_serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error generating analytics summary: {e}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def performance_report(self, request):
        """Get detailed performance report"""
        try:
            if not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Time-based performance analysis
            from django.db.models import Count, Avg
            from django.db.models.functions import TruncDate, TruncHour
            
            # Daily performance trends
            daily_stats = MatchingAnalytics.objects.annotate(
                date=TruncDate('timestamp')
            ).values('date').annotate(
                search_count=Count('id'),
                avg_matches=Avg('match_count'),
                avg_response_time=Avg('response_time_ms'),
                cache_hit_rate=models.Avg(
                    models.Case(
                        models.When(cache_hit=True, then=1),
                        default=0,
                        output_field=models.FloatField()
                    )
                ) * 100
            ).order_by('-date')[:30]  # Last 30 days
            
            # Hourly performance patterns
            hourly_stats = MatchingAnalytics.objects.annotate(
                hour=TruncHour('timestamp')
            ).values('hour').annotate(
                search_count=Count('id'),
                avg_response_time=Avg('response_time_ms')
            ).order_by('-hour')[:24]  # Last 24 hours
            
            return Response({
                'daily_performance': list(daily_stats),
                'hourly_patterns': list(hourly_stats),
                'generated_at': timezone.now()
            })
            
        except Exception as e:
            logger.error(f"Error generating performance report: {e}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _analyze_feedback_data(self, feedback_entries):
        """Analyze feedback data for insights"""
        try:
            if not feedback_entries.exists():
                return {'total_feedback': 0}
            
            feedback_analysis = {
                'total_feedback': feedback_entries.count(),
                'feedback_types': {},
                'average_ratings': {},
                'common_issues': []
            }
            
            # Analyze feedback data
            for entry in feedback_entries:
                feedback_data = entry.feedback_data or {}
                
                # Count feedback types
                feedback_type = feedback_data.get('feedback_type', 'unknown')
                feedback_analysis['feedback_types'][feedback_type] = (
                    feedback_analysis['feedback_types'].get(feedback_type, 0) + 1
                )
                
                # Collect ratings
                rating = feedback_data.get('rating')
                if rating:
                    if feedback_type not in feedback_analysis['average_ratings']:
                        feedback_analysis['average_ratings'][feedback_type] = []
                    feedback_analysis['average_ratings'][feedback_type].append(rating)
            
            # Calculate average ratings
            for feedback_type, ratings in feedback_analysis['average_ratings'].items():
                feedback_analysis['average_ratings'][feedback_type] = sum(ratings) / len(ratings)
            
            return feedback_analysis
            
        except Exception as e:
            logger.error(f"Error analyzing feedback data: {e}")
            return {'total_feedback': 0, 'error': 'Analysis failed'}