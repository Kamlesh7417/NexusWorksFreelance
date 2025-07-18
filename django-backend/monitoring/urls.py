"""
URLs for monitoring endpoints
"""
from django.urls import path
from . import health_checks, dashboard

urlpatterns = [
    # Health check endpoints
    path('health/', health_checks.health_check, name='health_check'),
    path('health/detailed/', health_checks.detailed_health_check, name='detailed_health_check'),
    path('readiness/', health_checks.readiness_check, name='readiness_check'),
    path('liveness/', health_checks.liveness_check, name='liveness_check'),
    
    # Monitoring dashboard endpoints
    path('dashboard/overview/', dashboard.system_overview, name='system_overview'),
    path('dashboard/metrics/', dashboard.application_metrics, name='application_metrics'),
    path('dashboard/trends/', dashboard.performance_trends, name='performance_trends'),
    path('dashboard/alerts/', dashboard.alerts_summary, name='alerts_summary'),
]