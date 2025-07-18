from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from decimal import Decimal

from .models import (
    FeaturedProject, FeaturedDeveloper, MarketplaceFilter, SearchHistory,
    PremiumAccess, MarketplaceAnalytics
)
from .serializers import (
    FeaturedProjectSerializer, FeaturedProjectDetailSerializer,
    FeaturedDeveloperSerializer, FeaturedDeveloperDetailSerializer,
    MarketplaceFilterSerializer, MarketplaceFilterCreateSerializer,
    SearchHistorySerializer, SearchHistoryCreateSerializer,
    PremiumAccessSerializer, MarketplaceAnalyticsSerializer,
    MarketplaceStatsSerializer, MarketplaceTrendsSerializer
)


class FeaturedProjectViewSet(viewsets.ModelViewSet):
    """ViewSet for managing featured projects in marketplace"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['project__title', 'project__description', 'category_tags']
    ordering_fields = ['priority_score', 'feature_start_date', 'view_count', 'conversion_count']
    ordering = ['-priority_score', '-feature_start_date']
    filterset_fields = ['feature_type', 'status', 'category_tags']
    
    def get_queryset(self):
        """Return featured projects based on user permissions"""
        queryset = FeaturedProject.objects.select_related('project')
        
        # Project owners can see their own featured listings
        # Others can only see active public listings
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(project__client=self.request.user) |
                Q(status='active', feature_start_date__lte=timezone.now(), 
                  feature_end_date__gte=timezone.now())
            )
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'retrieve':
            return FeaturedProjectDetailSerializer
        return FeaturedProjectSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """Track view when featured project is viewed"""
        instance = self.get_object()
        
        # Only track views for active listings
        if instance.status == 'active':
            instance.view_count += 1
            instance.save()
            
            # Create analytics record
            MarketplaceAnalytics.objects.create(
                metric_type='project_view',
                user=request.user,
                featured_project=instance,
                session_id=request.session.session_key,
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                ip_address=request.META.get('REMOTE_ADDR'),
                referrer_url=request.META.get('HTTP_REFERER')
            )
        
        return super().retrieve(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def track_click(self, request, pk=None):
        """Track click on featured project"""
        featured_project = self.get_object()
        
        if featured_project.status == 'active':
            featured_project.click_count += 1
            featured_project.save()
            
            # Create analytics record
            MarketplaceAnalytics.objects.create(
                metric_type='project_click',
                user=request.user,
                featured_project=featured_project,
                session_id=request.session.session_key
            )
        
        return Response({'status': 'click tracked'})
    
    @action(detail=True, methods=['post'])
    def track_inquiry(self, request, pk=None):
        """Track inquiry on featured project"""
        featured_project = self.get_object()
        
        if featured_project.status == 'active':
            featured_project.inquiry_count += 1
            featured_project.save()
            
            # Create analytics record
            MarketplaceAnalytics.objects.create(
                metric_type='inquiry_initiated',
                user=request.user,
                featured_project=featured_project,
                session_id=request.session.session_key
            )
        
        return Response({'status': 'inquiry tracked'})
    
    @action(detail=True, methods=['post'])
    def track_conversion(self, request, pk=None):
        """Track successful hire from featured project"""
        featured_project = self.get_object()
        
        # Only project client can track conversions
        if featured_project.project.client != request.user:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        featured_project.conversion_count += 1
        featured_project.save()
        
        # Create analytics record
        MarketplaceAnalytics.objects.create(
            metric_type='hire_completed',
            user=request.user,
            featured_project=featured_project,
            session_id=request.session.session_key
        )
        
        return Response({'status': 'conversion tracked'})
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause featured listing"""
        featured_project = self.get_object()
        
        # Only project owner can pause
        if featured_project.project.client != request.user:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        featured_project.status = 'paused'
        featured_project.save()
        
        return Response({'status': 'paused'})
    
    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume featured listing"""
        featured_project = self.get_object()
        
        # Only project owner can resume
        if featured_project.project.client != request.user:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if listing hasn't expired
        if featured_project.feature_end_date > timezone.now():
            featured_project.status = 'active'
            featured_project.save()
            return Response({'status': 'resumed'})
        else:
            return Response(
                {'error': 'Featured listing has expired'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def trending(self, request):
        """Get trending featured projects"""
        trending = self.get_queryset().filter(
            status='active'
        ).order_by('-view_count', '-click_count', '-inquiry_count')[:10]
        
        serializer = self.get_serializer(trending, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_featured(self, request):
        """Get user's featured projects"""
        my_featured = self.get_queryset().filter(
            project__client=request.user
        )
        
        serializer = self.get_serializer(my_featured, many=True)
        return Response(serializer.data)


class FeaturedDeveloperViewSet(viewsets.ModelViewSet):
    """ViewSet for managing featured developers in marketplace"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['developer__username', 'custom_headline', 'specialization_tags']
    ordering_fields = ['priority_score', 'feature_start_date', 'profile_views', 'successful_hires']
    ordering = ['-priority_score', '-feature_start_date']
    filterset_fields = ['feature_type', 'status', 'available_for_hire']
    
    def get_queryset(self):
        """Return featured developers based on user permissions"""
        queryset = FeaturedDeveloper.objects.select_related('developer')
        
        # Developers can see their own featured listings
        # Others can only see active public listings
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(developer=self.request.user) |
                Q(status='active', feature_start_date__lte=timezone.now(), 
                  feature_end_date__gte=timezone.now())
            )
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'retrieve':
            return FeaturedDeveloperDetailSerializer
        return FeaturedDeveloperSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """Track profile view when featured developer is viewed"""
        instance = self.get_object()
        
        # Only track views for active listings and different users
        if instance.status == 'active' and instance.developer != request.user:
            instance.profile_views += 1
            instance.save()
            
            # Create analytics record
            MarketplaceAnalytics.objects.create(
                metric_type='developer_view',
                user=request.user,
                featured_developer=instance,
                session_id=request.session.session_key,
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                ip_address=request.META.get('REMOTE_ADDR'),
                referrer_url=request.META.get('HTTP_REFERER')
            )
        
        return super().retrieve(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def track_contact(self, request, pk=None):
        """Track contact request to featured developer"""
        featured_developer = self.get_object()
        
        if featured_developer.status == 'active':
            featured_developer.contact_requests += 1
            featured_developer.save()
            
            # Create analytics record
            MarketplaceAnalytics.objects.create(
                metric_type='contact_initiated',
                user=request.user,
                featured_developer=featured_developer,
                session_id=request.session.session_key
            )
        
        return Response({'status': 'contact tracked'})
    
    @action(detail=True, methods=['post'])
    def track_invitation(self, request, pk=None):
        """Track project invitation to featured developer"""
        featured_developer = self.get_object()
        
        if featured_developer.status == 'active':
            featured_developer.project_invitations += 1
            featured_developer.save()
        
        return Response({'status': 'invitation tracked'})
    
    @action(detail=True, methods=['post'])
    def track_hire(self, request, pk=None):
        """Track successful hire of featured developer"""
        featured_developer = self.get_object()
        
        if featured_developer.status == 'active':
            featured_developer.successful_hires += 1
            featured_developer.save()
            
            # Create analytics record
            MarketplaceAnalytics.objects.create(
                metric_type='hire_completed',
                user=request.user,
                featured_developer=featured_developer,
                session_id=request.session.session_key
            )
        
        return Response({'status': 'hire tracked'})
    
    @action(detail=True, methods=['post'])
    def update_availability(self, request, pk=None):
        """Update developer availability"""
        featured_developer = self.get_object()
        
        # Only developer can update their availability
        if featured_developer.developer != request.user:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        available = request.data.get('available_for_hire')
        if available is not None:
            featured_developer.available_for_hire = available
            featured_developer.save()
            
            return Response({'status': 'availability updated'})
        
        return Response(
            {'error': 'available_for_hire field required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'])
    def top_rated(self, request):
        """Get top-rated featured developers"""
        top_rated = self.get_queryset().filter(
            status='active',
            available_for_hire=True
        ).order_by('-successful_hires', '-profile_views')[:10]
        
        serializer = self.get_serializer(top_rated, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_skills(self, request):
        """Get featured developers by skills"""
        skills = request.query_params.get('skills', '').split(',')
        
        if skills and skills[0]:
            featured_devs = self.get_queryset().filter(
                status='active',
                available_for_hire=True,
                specialization_tags__overlap=skills
            )
            
            serializer = self.get_serializer(featured_devs, many=True)
            return Response(serializer.data)
        
        return Response({'error': 'skills parameter required'}, 
                       status=status.HTTP_400_BAD_REQUEST)


class MarketplaceFilterViewSet(viewsets.ModelViewSet):
    """ViewSet for managing saved marketplace filters"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'last_used', 'usage_count']
    ordering = ['-last_used', '-created_at']
    filterset_fields = ['filter_type', 'is_default']
    
    def get_queryset(self):
        """Return filters for current user"""
        return MarketplaceFilter.objects.filter(
            user=self.request.user
        )
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return MarketplaceFilterCreateSerializer
        return MarketplaceFilterSerializer
    
    @action(detail=True, methods=['post'])
    def apply_filter(self, request, pk=None):
        """Apply saved filter and track usage"""
        filter_obj = self.get_object()
        
        # Update usage statistics
        filter_obj.usage_count += 1
        filter_obj.last_used = timezone.now()
        filter_obj.save()
        
        # Return filter criteria for application
        return Response({
            'filter_criteria': {
                'skills_filter': filter_obj.skills_filter,
                'experience_level_filter': filter_obj.experience_level_filter,
                'budget_range_min': filter_obj.budget_range_min,
                'budget_range_max': filter_obj.budget_range_max,
                'location_filter': filter_obj.location_filter,
                'availability_filter': filter_obj.availability_filter,
                'project_type_filter': filter_obj.project_type_filter,
                'rating_minimum': filter_obj.rating_minimum,
                'completion_rate_minimum': filter_obj.completion_rate_minimum,
                'response_time_maximum': filter_obj.response_time_maximum,
            }
        })
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set filter as default"""
        filter_obj = self.get_object()
        
        # Remove default from other filters
        self.get_queryset().update(is_default=False)
        
        # Set this filter as default
        filter_obj.is_default = True
        filter_obj.save()
        
        return Response({'status': 'set as default'})
    
    @action(detail=False, methods=['get'])
    def popular_filters(self, request):
        """Get most popular filter combinations"""
        # This would analyze common filter patterns across users
        # For now, return mock data
        popular = [
            {
                'name': 'Full-Stack Developers',
                'skills': ['JavaScript', 'Python', 'React', 'Django'],
                'usage_count': 150
            },
            {
                'name': 'Mobile App Developers',
                'skills': ['React Native', 'Flutter', 'iOS', 'Android'],
                'usage_count': 120
            }
        ]
        
        return Response({'popular_filters': popular})


class SearchHistoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user search history"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['search_query']
    ordering_fields = ['created_at', 'results_count']
    ordering = ['-created_at']
    filterset_fields = ['search_type', 'result_interaction']
    
    def get_queryset(self):
        """Return search history for current user"""
        return SearchHistory.objects.filter(
            user=self.request.user
        )
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return SearchHistoryCreateSerializer
        return SearchHistorySerializer
    
    @action(detail=False, methods=['get'])
    def popular_searches(self, request):
        """Get popular search terms"""
        popular = self.get_queryset().values('search_query').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        return Response({'popular_searches': list(popular)})
    
    @action(detail=False, methods=['get'])
    def recent_searches(self, request):
        """Get user's recent searches"""
        recent = self.get_queryset().order_by('-created_at')[:10]
        serializer = self.get_serializer(recent, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search_suggestions(self, request):
        """Get search suggestions based on history"""
        query = request.query_params.get('q', '')
        
        if query:
            suggestions = self.get_queryset().filter(
                search_query__icontains=query
            ).values_list('search_query', flat=True).distinct()[:5]
            
            return Response({'suggestions': list(suggestions)})
        
        return Response({'suggestions': []})


class PremiumAccessViewSet(viewsets.ModelViewSet):
    """ViewSet for managing premium access subscriptions"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['subscription_type']
    ordering_fields = ['created_at', 'current_period_end', 'monthly_price']
    ordering = ['-created_at']
    filterset_fields = ['subscription_type', 'status', 'billing_cycle', 'is_trial']
    
    def get_queryset(self):
        """Return premium subscriptions for current user"""
        return PremiumAccess.objects.filter(
            user=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def cancel_subscription(self, request, pk=None):
        """Cancel premium subscription"""
        subscription = self.get_object()
        
        subscription.status = 'cancelled'
        subscription.cancellation_date = timezone.now()
        subscription.cancellation_reason = request.data.get('reason', '')
        subscription.auto_renew = False
        subscription.save()
        
        return Response({'status': 'subscription cancelled'})
    
    @action(detail=True, methods=['post'])
    def reactivate_subscription(self, request, pk=None):
        """Reactivate cancelled subscription"""
        subscription = self.get_object()
        
        if subscription.status == 'cancelled' and subscription.current_period_end > timezone.now():
            subscription.status = 'active'
            subscription.cancellation_date = None
            subscription.cancellation_reason = ''
            subscription.auto_renew = True
            subscription.save()
            
            return Response({'status': 'subscription reactivated'})
        
        return Response(
            {'error': 'Cannot reactivate expired subscription'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def update_usage(self, request, pk=None):
        """Update subscription usage"""
        subscription = self.get_object()
        
        feature = request.data.get('feature')
        usage_increment = request.data.get('usage', 1)
        
        if feature and feature in subscription.usage_limits:
            current_usage = subscription.current_usage.get(feature, 0)
            subscription.current_usage[feature] = current_usage + usage_increment
            subscription.save()
            
            # Check if over limit
            limit = subscription.usage_limits[feature]
            if subscription.current_usage[feature] > limit:
                return Response({
                    'status': 'usage updated',
                    'warning': f'Usage limit exceeded for {feature}'
                })
            
            return Response({'status': 'usage updated'})
        
        return Response(
            {'error': 'Invalid feature or feature not in subscription'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'])
    def subscription_plans(self, request):
        """Get available subscription plans"""
        plans = [
            {
                'type': 'basic',
                'name': 'Basic Premium',
                'monthly_price': 29.99,
                'features': ['Featured project listings', 'Priority support'],
                'limits': {'featured_projects': 3, 'premium_searches': 100}
            },
            {
                'type': 'professional',
                'name': 'Professional',
                'monthly_price': 79.99,
                'features': ['Featured developer profile', 'Advanced analytics', 'Direct hiring'],
                'limits': {'featured_projects': 10, 'premium_searches': 500}
            },
            {
                'type': 'enterprise',
                'name': 'Enterprise',
                'monthly_price': 199.99,
                'features': ['Unlimited features', 'Custom branding', 'Dedicated support'],
                'limits': {'featured_projects': -1, 'premium_searches': -1}
            }
        ]
        
        return Response({'plans': plans})


class MarketplaceAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing marketplace analytics"""
    
    serializer_class = MarketplaceAnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['metric_type']
    ordering_fields = ['created_at', 'metric_value']
    ordering = ['-created_at']
    filterset_fields = ['metric_type', 'user', 'featured_project', 'featured_developer']
    
    def get_queryset(self):
        """Return analytics data user can access"""
        # Users can see analytics for their own featured listings
        return MarketplaceAnalytics.objects.filter(
            Q(user=self.request.user) |
            Q(featured_project__project__client=self.request.user) |
            Q(featured_developer__developer=self.request.user)
        )
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get marketplace dashboard statistics"""
        total_featured_projects = FeaturedProject.objects.filter(status='active').count()
        total_featured_developers = FeaturedDeveloper.objects.filter(status='active').count()
        active_premium_subscriptions = PremiumAccess.objects.filter(status='active').count()
        
        total_revenue = PremiumAccess.objects.filter(
            status='active'
        ).aggregate(
            total=Sum('monthly_price')
        )['total'] or Decimal('0.00')
        
        # Popular search terms from recent searches
        popular_searches = SearchHistory.objects.values('search_query').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        stats = {
            'total_featured_projects': total_featured_projects,
            'total_featured_developers': total_featured_developers,
            'active_premium_subscriptions': active_premium_subscriptions,
            'total_marketplace_revenue': total_revenue,
            'popular_search_terms': [item['search_query'] for item in popular_searches],
            'top_performing_features': [
                {'type': 'premium', 'conversion_rate': 15.2},
                {'type': 'spotlight', 'conversion_rate': 22.8}
            ],
            'conversion_rates': {
                'project_view_to_inquiry': 8.5,
                'developer_view_to_contact': 12.3,
                'inquiry_to_hire': 25.7
            },
            'user_engagement_metrics': {
                'avg_session_duration': 420,  # seconds
                'bounce_rate': 35.2,
                'pages_per_session': 4.8
            }
        }
        
        serializer = MarketplaceStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def trends(self, request):
        """Get marketplace trends and insights"""
        trends = {
            'trending_skills': ['Python', 'React', 'TypeScript', 'AWS', 'Docker'],
            'popular_project_types': ['Web Development', 'Mobile Apps', 'AI/ML', 'DevOps'],
            'average_project_budgets': {
                'web_development': 5000,
                'mobile_apps': 8000,
                'ai_ml': 12000,
                'devops': 6000
            },
            'developer_availability_trends': {
                'high_demand_skills': ['React', 'Python', 'AWS'],
                'emerging_skills': ['Rust', 'WebAssembly', 'Blockchain'],
                'availability_by_experience': {
                    'junior': 65,
                    'mid': 45,
                    'senior': 25
                }
            },
            'seasonal_patterns': {
                'q1': {'project_volume': 85, 'avg_budget': 6500},
                'q2': {'project_volume': 120, 'avg_budget': 7200},
                'q3': {'project_volume': 95, 'avg_budget': 6800},
                'q4': {'project_volume': 140, 'avg_budget': 8000}
            },
            'geographic_distribution': {
                'north_america': 45,
                'europe': 30,
                'asia': 20,
                'other': 5
            }
        }
        
        serializer = MarketplaceTrendsSerializer(trends)
        return Response(serializer.data)
