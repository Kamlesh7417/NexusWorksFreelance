from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    FeaturedProject, FeaturedDeveloper, MarketplaceFilter, SearchHistory,
    PremiumAccess, MarketplaceAnalytics
)

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user information for nested serialization"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']


class FeaturedProjectSerializer(serializers.ModelSerializer):
    """Serializer for featured projects in marketplace"""
    
    project_details = serializers.SerializerMethodField()
    performance_metrics = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = FeaturedProject
        fields = [
            'id', 'project', 'project_details', 'feature_type', 'status',
            'price_paid', 'feature_start_date', 'feature_end_date',
            'priority_score', 'category_tags', 'view_count', 'click_count',
            'inquiry_count', 'conversion_count', 'custom_title',
            'custom_description', 'marketing_image_url', 'promotional_video_url',
            'target_developer_skills', 'target_experience_levels',
            'target_locations', 'performance_metrics', 'is_active',
            'days_remaining', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'view_count', 'click_count', 'inquiry_count', 'conversion_count',
            'created_at', 'updated_at'
        ]
    
    def get_project_details(self, obj):
        """Get basic project information"""
        if obj.project:
            return {
                'id': obj.project.id,
                'title': obj.project.title,
                'description': obj.project.description,
                'status': obj.project.status,
                'budget_estimate': obj.project.budget_estimate,
                'client_name': obj.project.client.username,
                'required_skills': obj.project.required_skills,
            }
        return None
    
    def get_performance_metrics(self, obj):
        """Get performance metrics summary"""
        total_interactions = obj.view_count + obj.click_count + obj.inquiry_count
        conversion_rate = (obj.conversion_count / obj.view_count * 100) if obj.view_count > 0 else 0
        
        return {
            'total_interactions': total_interactions,
            'conversion_rate': round(conversion_rate, 2),
            'click_through_rate': round((obj.click_count / obj.view_count * 100) if obj.view_count > 0 else 0, 2),
            'inquiry_rate': round((obj.inquiry_count / obj.view_count * 100) if obj.view_count > 0 else 0, 2),
        }
    
    def get_is_active(self, obj):
        """Check if featured listing is currently active"""
        from django.utils import timezone
        return (obj.status == 'active' and 
                obj.feature_start_date <= timezone.now() <= obj.feature_end_date)
    
    def get_days_remaining(self, obj):
        """Get days remaining for featured listing"""
        from django.utils import timezone
        if obj.feature_end_date > timezone.now():
            return (obj.feature_end_date - timezone.now()).days
        return 0


class FeaturedDeveloperSerializer(serializers.ModelSerializer):
    """Serializer for featured developers in marketplace"""
    
    developer_details = serializers.SerializerMethodField()
    performance_metrics = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = FeaturedDeveloper
        fields = [
            'id', 'developer', 'developer_details', 'feature_type', 'status',
            'price_paid', 'feature_start_date', 'feature_end_date',
            'priority_score', 'specialization_tags', 'profile_views',
            'contact_requests', 'project_invitations', 'successful_hires',
            'custom_headline', 'custom_bio', 'portfolio_highlight',
            'testimonials', 'available_for_hire', 'preferred_project_types',
            'minimum_project_budget', 'performance_metrics', 'is_active',
            'days_remaining', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'profile_views', 'contact_requests', 'project_invitations',
            'successful_hires', 'created_at', 'updated_at'
        ]
    
    def get_developer_details(self, obj):
        """Get basic developer information"""
        if obj.developer:
            developer_profile = getattr(obj.developer, 'developer_profile', None)
            return {
                'id': obj.developer.id,
                'username': obj.developer.username,
                'first_name': obj.developer.first_name,
                'last_name': obj.developer.last_name,
                'bio': obj.developer.bio,
                'location': obj.developer.location,
                'hourly_rate': obj.developer.hourly_rate,
                'overall_rating': obj.developer.overall_rating,
                'skills': developer_profile.skills if developer_profile else [],
                'experience_level': developer_profile.experience_level if developer_profile else None,
                'reputation_score': developer_profile.reputation_score if developer_profile else 0.0,
            }
        return None
    
    def get_performance_metrics(self, obj):
        """Get performance metrics summary"""
        total_interactions = obj.profile_views + obj.contact_requests + obj.project_invitations
        hire_rate = (obj.successful_hires / obj.project_invitations * 100) if obj.project_invitations > 0 else 0
        
        return {
            'total_interactions': total_interactions,
            'hire_rate': round(hire_rate, 2),
            'contact_rate': round((obj.contact_requests / obj.profile_views * 100) if obj.profile_views > 0 else 0, 2),
            'invitation_rate': round((obj.project_invitations / obj.profile_views * 100) if obj.profile_views > 0 else 0, 2),
        }
    
    def get_is_active(self, obj):
        """Check if featured listing is currently active"""
        from django.utils import timezone
        return (obj.status == 'active' and 
                obj.feature_start_date <= timezone.now() <= obj.feature_end_date)
    
    def get_days_remaining(self, obj):
        """Get days remaining for featured listing"""
        from django.utils import timezone
        if obj.feature_end_date > timezone.now():
            return (obj.feature_end_date - timezone.now()).days
        return 0


class MarketplaceFilterSerializer(serializers.ModelSerializer):
    """Serializer for saved marketplace filters"""
    
    user_details = UserBasicSerializer(source='user', read_only=True)
    filter_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = MarketplaceFilter
        fields = [
            'id', 'user', 'user_details', 'name', 'filter_type', 'description',
            'skills_filter', 'experience_level_filter', 'budget_range_min',
            'budget_range_max', 'location_filter', 'availability_filter',
            'project_type_filter', 'rating_minimum', 'completion_rate_minimum',
            'response_time_maximum', 'is_default', 'usage_count', 'last_used',
            'filter_summary', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'usage_count', 'last_used', 'created_at', 'updated_at'
        ]
    
    def get_filter_summary(self, obj):
        """Get a summary of active filters"""
        active_filters = []
        
        if obj.skills_filter:
            active_filters.append(f"{len(obj.skills_filter)} skills")
        if obj.experience_level_filter:
            active_filters.append(f"{len(obj.experience_level_filter)} experience levels")
        if obj.budget_range_min or obj.budget_range_max:
            active_filters.append("budget range")
        if obj.location_filter:
            active_filters.append(f"{len(obj.location_filter)} locations")
        if obj.rating_minimum:
            active_filters.append(f"min rating {obj.rating_minimum}")
        
        return {
            'active_filter_count': len(active_filters),
            'active_filters': active_filters,
            'complexity': 'simple' if len(active_filters) <= 2 else 'complex',
        }


class SearchHistorySerializer(serializers.ModelSerializer):
    """Serializer for user search history"""
    
    user_details = UserBasicSerializer(source='user', read_only=True)
    search_effectiveness = serializers.SerializerMethodField()
    
    class Meta:
        model = SearchHistory
        fields = [
            'id', 'user', 'user_details', 'search_query', 'search_type',
            'filters_applied', 'results_count', 'clicked_results',
            'page_source', 'session_id', 'search_duration',
            'result_interaction', 'search_effectiveness', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']
    
    def get_search_effectiveness(self, obj):
        """Calculate search effectiveness metrics"""
        click_rate = (len(obj.clicked_results) / obj.results_count * 100) if obj.results_count > 0 else 0
        
        return {
            'click_rate': round(click_rate, 2),
            'had_results': obj.results_count > 0,
            'user_engaged': obj.result_interaction,
            'search_quality': 'high' if click_rate > 10 and obj.result_interaction else 'low',
        }


class PremiumAccessSerializer(serializers.ModelSerializer):
    """Serializer for premium access subscriptions"""
    
    user_details = UserBasicSerializer(source='user', read_only=True)
    subscription_status = serializers.SerializerMethodField()
    usage_summary = serializers.SerializerMethodField()
    billing_info = serializers.SerializerMethodField()
    
    class Meta:
        model = PremiumAccess
        fields = [
            'id', 'user', 'user_details', 'subscription_type', 'status',
            'billing_cycle', 'monthly_price', 'current_period_start',
            'current_period_end', 'next_billing_date', 'features_included',
            'usage_limits', 'current_usage', 'auto_renew', 'is_trial',
            'trial_end_date', 'subscription_status', 'usage_summary',
            'billing_info', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'payment_method_id', 'last_payment_date',
            'last_payment_amount', 'cancellation_date', 'cancellation_reason',
            'created_at', 'updated_at'
        ]
    
    def get_subscription_status(self, obj):
        """Get detailed subscription status"""
        from django.utils import timezone
        
        is_active = obj.status == 'active' and obj.current_period_end > timezone.now()
        days_remaining = (obj.current_period_end - timezone.now()).days if obj.current_period_end > timezone.now() else 0
        
        return {
            'is_active': is_active,
            'days_remaining': days_remaining,
            'is_trial': obj.is_trial,
            'trial_expired': obj.is_trial and obj.trial_end_date and obj.trial_end_date < timezone.now(),
            'needs_payment': obj.status == 'pending_payment',
            'auto_renew_enabled': obj.auto_renew,
        }
    
    def get_usage_summary(self, obj):
        """Get usage summary against limits"""
        usage_percentage = {}
        
        for feature, limit in obj.usage_limits.items():
            current = obj.current_usage.get(feature, 0)
            if limit > 0:
                usage_percentage[feature] = round((current / limit * 100), 2)
            else:
                usage_percentage[feature] = 0
        
        return {
            'usage_percentages': usage_percentage,
            'near_limits': [k for k, v in usage_percentage.items() if v > 80],
            'over_limits': [k for k, v in usage_percentage.items() if v > 100],
        }
    
    def get_billing_info(self, obj):
        """Get billing information summary"""
        return {
            'next_billing_amount': obj.monthly_price,
            'next_billing_date': obj.next_billing_date,
            'last_payment_date': obj.last_payment_date,
            'last_payment_amount': obj.last_payment_amount,
            'billing_cycle': obj.billing_cycle,
        }


class MarketplaceAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for marketplace analytics data"""
    
    user_details = UserBasicSerializer(source='user', read_only=True)
    project_details = serializers.SerializerMethodField()
    featured_project_details = serializers.SerializerMethodField()
    featured_developer_details = serializers.SerializerMethodField()
    
    class Meta:
        model = MarketplaceAnalytics
        fields = [
            'id', 'metric_type', 'metric_value', 'user', 'user_details',
            'project', 'project_details', 'featured_project',
            'featured_project_details', 'featured_developer',
            'featured_developer_details', 'session_id', 'user_agent',
            'ip_address', 'referrer_url', 'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_project_details(self, obj):
        """Get basic project information"""
        if obj.project:
            return {
                'id': obj.project.id,
                'title': obj.project.title,
                'status': obj.project.status,
            }
        return None
    
    def get_featured_project_details(self, obj):
        """Get basic featured project information"""
        if obj.featured_project:
            return {
                'id': obj.featured_project.id,
                'feature_type': obj.featured_project.feature_type,
                'project_title': obj.featured_project.project.title,
            }
        return None
    
    def get_featured_developer_details(self, obj):
        """Get basic featured developer information"""
        if obj.featured_developer:
            return {
                'id': obj.featured_developer.id,
                'feature_type': obj.featured_developer.feature_type,
                'developer_username': obj.featured_developer.developer.username,
            }
        return None


# Nested serializers for complex relationships
class FeaturedProjectDetailSerializer(FeaturedProjectSerializer):
    """Detailed featured project serializer with analytics"""
    
    recent_analytics = serializers.SerializerMethodField()
    
    class Meta(FeaturedProjectSerializer.Meta):
        fields = FeaturedProjectSerializer.Meta.fields + ['recent_analytics']
    
    def get_recent_analytics(self, obj):
        """Get recent analytics for this featured project"""
        recent_analytics = MarketplaceAnalytics.objects.filter(
            featured_project=obj
        ).order_by('-created_at')[:10]
        return MarketplaceAnalyticsSerializer(recent_analytics, many=True).data


class FeaturedDeveloperDetailSerializer(FeaturedDeveloperSerializer):
    """Detailed featured developer serializer with analytics"""
    
    recent_analytics = serializers.SerializerMethodField()
    
    class Meta(FeaturedDeveloperSerializer.Meta):
        fields = FeaturedDeveloperSerializer.Meta.fields + ['recent_analytics']
    
    def get_recent_analytics(self, obj):
        """Get recent analytics for this featured developer"""
        recent_analytics = MarketplaceAnalytics.objects.filter(
            featured_developer=obj
        ).order_by('-created_at')[:10]
        return MarketplaceAnalyticsSerializer(recent_analytics, many=True).data


class MarketplaceFilterCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating marketplace filters"""
    
    class Meta:
        model = MarketplaceFilter
        fields = [
            'name', 'filter_type', 'description', 'skills_filter',
            'experience_level_filter', 'budget_range_min', 'budget_range_max',
            'location_filter', 'availability_filter', 'project_type_filter',
            'rating_minimum', 'completion_rate_minimum', 'response_time_maximum',
            'is_default'
        ]
    
    def create(self, validated_data):
        """Create filter with user from request"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class SearchHistoryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating search history entries"""
    
    class Meta:
        model = SearchHistory
        fields = [
            'search_query', 'search_type', 'filters_applied', 'results_count',
            'clicked_results', 'page_source', 'session_id', 'search_duration',
            'result_interaction'
        ]
    
    def create(self, validated_data):
        """Create search history with user from request"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class MarketplaceStatsSerializer(serializers.Serializer):
    """Serializer for marketplace statistics"""
    
    total_featured_projects = serializers.IntegerField()
    total_featured_developers = serializers.IntegerField()
    active_premium_subscriptions = serializers.IntegerField()
    total_marketplace_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    popular_search_terms = serializers.ListField(child=serializers.CharField())
    top_performing_features = serializers.ListField(child=serializers.DictField())
    conversion_rates = serializers.DictField()
    user_engagement_metrics = serializers.DictField()


class MarketplaceTrendsSerializer(serializers.Serializer):
    """Serializer for marketplace trends and insights"""
    
    trending_skills = serializers.ListField(child=serializers.CharField())
    popular_project_types = serializers.ListField(child=serializers.CharField())
    average_project_budgets = serializers.DictField()
    developer_availability_trends = serializers.DictField()
    seasonal_patterns = serializers.DictField()
    geographic_distribution = serializers.DictField()