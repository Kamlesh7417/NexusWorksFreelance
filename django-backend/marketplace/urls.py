from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Register ViewSets
router.register(r'featured-projects', views.FeaturedProjectViewSet, basename='featuredproject')
router.register(r'featured-developers', views.FeaturedDeveloperViewSet, basename='featureddeveloper')
router.register(r'filters', views.MarketplaceFilterViewSet, basename='marketplacefilter')
router.register(r'search-history', views.SearchHistoryViewSet, basename='searchhistory')
router.register(r'premium-access', views.PremiumAccessViewSet, basename='premiumaccess')
router.register(r'analytics', views.MarketplaceAnalyticsViewSet, basename='marketplaceanalytics')

urlpatterns = [
    path('', include(router.urls)),
]