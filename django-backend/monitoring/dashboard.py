"""
Monitoring dashboard and metrics collection
"""
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict

from django.core.cache import cache
from django.db import connection
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from .performance_monitor import PerformanceMonitor
from .health_checks import HealthCheckService

class MonitoringDashboard:
    """Central monitoring dashboard service"""
    
    CACHE_PREFIX = 'monitoring_dashboard'
    
    @classmethod
    def get_system_overview(cls) -> Dict[str, Any]:
        """Get system overview metrics"""
        try:
            # Get health status
            health_service = HealthCheckService()
            health_checks = {
                'database': health_service.check_database(),
                'cache': health_service.check_cache(),
                'ai_services': health_service.check_ai_services(),
                'external_services': health_service.check_external_services(),
                'celery': health_service.check_celery(),
            }
            
            # Calculate overall health
            healthy_services = sum(1 for check in health_checks.values() if check['status'] == 'healthy')
            total_services = len(health_checks)
            health_percentage = (healthy_services / total_services) * 100
            
            # Get performance metrics
            perf_summary = PerformanceMonitor.get_performance_summary(hours=1)
            
            # Get system metrics
            system_metrics = cls._get_system_metrics()
            
            return {
                'timestamp': timezone.now().isoformat(),
                'health': {
                    'overall_status': 'healthy' if health_percentage == 100 else 'degraded' if health_percentage >= 50 else 'unhealthy',
                    'health_percentage': health_percentage,
                    'services': health_checks,
                },
                'performance': perf_summary,
                'system': system_metrics,
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': timezone.now().isoformat(),
            }
    
    @classmethod
    def get_application_metrics(cls, hours: int = 24) -> Dict[str, Any]:
        """Get application-specific metrics"""
        try:
            from users.models import User
            from projects.models import Project
            from payments.models import Payment
            from matching.models import DeveloperMatch
            
            end_time = timezone.now()
            start_time = end_time - timedelta(hours=hours)
            
            # User metrics
            total_users = User.objects.count()
            new_users = User.objects.filter(created_at__gte=start_time).count()
            active_users = User.objects.filter(last_login__gte=start_time).count()
            
            # Project metrics
            total_projects = Project.objects.count()
            new_projects = Project.objects.filter(created_at__gte=start_time).count()
            active_projects = Project.objects.filter(
                status__in=['active', 'in_progress'],
                updated_at__gte=start_time
            ).count()
            
            # Payment metrics
            total_payments = Payment.objects.count()
            recent_payments = Payment.objects.filter(processed_at__gte=start_time).count()
            payment_volume = Payment.objects.filter(
                processed_at__gte=start_time,
                status='completed'
            ).aggregate(total=models.Sum('amount'))['total'] or 0
            
            # Matching metrics
            total_matches = DeveloperMatch.objects.count()
            recent_matches = DeveloperMatch.objects.filter(created_at__gte=start_time).count()
            avg_match_score = DeveloperMatch.objects.filter(
                created_at__gte=start_time
            ).aggregate(avg_score=models.Avg('match_score'))['avg_score'] or 0
            
            return {
                'timestamp': timezone.now().isoformat(),
                'period': {
                    'start': start_time.isoformat(),
                    'end': end_time.isoformat(),
                    'hours': hours,
                },
                'users': {
                    'total': total_users,
                    'new': new_users,
                    'active': active_users,
                    'growth_rate': (new_users / max(total_users - new_users, 1)) * 100,
                },
                'projects': {
                    'total': total_projects,
                    'new': new_projects,
                    'active': active_projects,
                    'completion_rate': cls._calculate_project_completion_rate(start_time, end_time),
                },
                'payments': {
                    'total_count': total_payments,
                    'recent_count': recent_payments,
                    'volume': float(payment_volume),
                    'average_amount': float(payment_volume / max(recent_payments, 1)),
                },
                'matching': {
                    'total_matches': total_matches,
                    'recent_matches': recent_matches,
                    'average_score': float(avg_match_score),
                    'success_rate': cls._calculate_matching_success_rate(start_time, end_time),
                },
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': timezone.now().isoformat(),
            }
    
    @classmethod
    def get_performance_trends(cls, hours: int = 24) -> Dict[str, Any]:
        """Get performance trends over time"""
        try:
            end_time = timezone.now()
            start_time = end_time - timedelta(hours=hours)
            
            # Collect hourly performance data
            trends = {
                'response_times': [],
                'error_rates': [],
                'throughput': [],
                'database_performance': [],
                'ai_service_performance': [],
            }
            
            current_time = start_time
            while current_time <= end_time:
                hour_key = current_time.strftime('%Y%m%d%H')
                
                # Get cached metrics for this hour
                response_time_data = cls._get_hourly_response_times(hour_key)
                error_rate_data = cls._get_hourly_error_rates(hour_key)
                throughput_data = cls._get_hourly_throughput(hour_key)
                db_performance_data = cls._get_hourly_db_performance(hour_key)
                ai_performance_data = cls._get_hourly_ai_performance(hour_key)
                
                trends['response_times'].append({
                    'timestamp': current_time.isoformat(),
                    'value': response_time_data,
                })
                trends['error_rates'].append({
                    'timestamp': current_time.isoformat(),
                    'value': error_rate_data,
                })
                trends['throughput'].append({
                    'timestamp': current_time.isoformat(),
                    'value': throughput_data,
                })
                trends['database_performance'].append({
                    'timestamp': current_time.isoformat(),
                    'value': db_performance_data,
                })
                trends['ai_service_performance'].append({
                    'timestamp': current_time.isoformat(),
                    'value': ai_performance_data,
                })
                
                current_time += timedelta(hours=1)
            
            return {
                'timestamp': timezone.now().isoformat(),
                'period': {
                    'start': start_time.isoformat(),
                    'end': end_time.isoformat(),
                    'hours': hours,
                },
                'trends': trends,
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': timezone.now().isoformat(),
            }
    
    @classmethod
    def get_alerts_summary(cls) -> Dict[str, Any]:
        """Get current alerts and their status"""
        try:
            # Get active alerts from cache
            alert_keys = cache.keys(f"{PerformanceMonitor.CACHE_PREFIX}:alert:*")
            active_alerts = []
            
            for key in alert_keys:
                if cache.get(key):  # Alert is still active
                    alert_type = key.split(':')[2]
                    view_name = key.split(':')[3] if len(key.split(':')) > 3 else 'unknown'
                    active_alerts.append({
                        'type': alert_type,
                        'view': view_name,
                        'timestamp': timezone.now().isoformat(),
                    })
            
            # Get alert history from logs (simplified)
            alert_history = cls._get_alert_history()
            
            return {
                'timestamp': timezone.now().isoformat(),
                'active_alerts': active_alerts,
                'alert_count': len(active_alerts),
                'alert_history': alert_history,
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': timezone.now().isoformat(),
            }
    
    @classmethod
    def _get_system_metrics(cls) -> Dict[str, Any]:
        """Get system-level metrics"""
        import psutil
        import os
        
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memory metrics
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_available = memory.available
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            disk_free = disk.free
            
            # Network metrics (if available)
            try:
                network = psutil.net_io_counters()
                network_sent = network.bytes_sent
                network_recv = network.bytes_recv
            except:
                network_sent = network_recv = 0
            
            # Process metrics
            process_count = len(psutil.pids())
            
            return {
                'cpu': {
                    'percent': cpu_percent,
                    'count': cpu_count,
                },
                'memory': {
                    'percent': memory_percent,
                    'available_bytes': memory_available,
                    'total_bytes': memory.total,
                },
                'disk': {
                    'percent': disk_percent,
                    'free_bytes': disk_free,
                    'total_bytes': disk.total,
                },
                'network': {
                    'bytes_sent': network_sent,
                    'bytes_received': network_recv,
                },
                'processes': {
                    'count': process_count,
                },
                'load_average': os.getloadavg() if hasattr(os, 'getloadavg') else [0, 0, 0],
            }
            
        except Exception as e:
            return {
                'error': str(e),
            }
    
    @classmethod
    def _calculate_project_completion_rate(cls, start_time, end_time) -> float:
        """Calculate project completion rate"""
        try:
            from projects.models import Project
            
            completed_projects = Project.objects.filter(
                status='completed',
                updated_at__range=[start_time, end_time]
            ).count()
            
            total_projects = Project.objects.filter(
                created_at__lt=end_time
            ).count()
            
            return (completed_projects / max(total_projects, 1)) * 100
            
        except Exception:
            return 0.0
    
    @classmethod
    def _calculate_matching_success_rate(cls, start_time, end_time) -> float:
        """Calculate matching success rate"""
        try:
            from matching.models import DeveloperMatch
            from projects.models import Task
            
            # Get matches that led to task assignments
            successful_matches = DeveloperMatch.objects.filter(
                created_at__range=[start_time, end_time],
                task__assigned_developer__isnull=False
            ).count()
            
            total_matches = DeveloperMatch.objects.filter(
                created_at__range=[start_time, end_time]
            ).count()
            
            return (successful_matches / max(total_matches, 1)) * 100
            
        except Exception:
            return 0.0
    
    @classmethod
    def _get_hourly_response_times(cls, hour_key: str) -> float:
        """Get average response time for an hour"""
        cache_key = f"{PerformanceMonitor.CACHE_PREFIX}:requests:*:{hour_key}"
        # This is simplified - in production you'd aggregate all matching keys
        return 0.5  # Placeholder
    
    @classmethod
    def _get_hourly_error_rates(cls, hour_key: str) -> float:
        """Get error rate for an hour"""
        # Simplified implementation
        return 0.02  # Placeholder
    
    @classmethod
    def _get_hourly_throughput(cls, hour_key: str) -> int:
        """Get request throughput for an hour"""
        # Simplified implementation
        return 1000  # Placeholder
    
    @classmethod
    def _get_hourly_db_performance(cls, hour_key: str) -> Dict[str, float]:
        """Get database performance metrics for an hour"""
        return {
            'query_time': 0.1,
            'connection_count': 10,
        }
    
    @classmethod
    def _get_hourly_ai_performance(cls, hour_key: str) -> Dict[str, float]:
        """Get AI service performance metrics for an hour"""
        return {
            'response_time': 2.5,
            'success_rate': 0.98,
        }
    
    @classmethod
    def _get_alert_history(cls) -> List[Dict[str, Any]]:
        """Get recent alert history"""
        # This would typically read from log files or a database
        # Simplified implementation
        return [
            {
                'type': 'high_response_time',
                'timestamp': (timezone.now() - timedelta(hours=2)).isoformat(),
                'resolved': True,
            }
        ]

# API endpoints for monitoring dashboard
@csrf_exempt
@require_http_methods(["GET"])
def system_overview(request):
    """API endpoint for system overview"""
    try:
        data = MonitoringDashboard.get_system_overview()
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'timestamp': timezone.now().isoformat(),
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def application_metrics(request):
    """API endpoint for application metrics"""
    try:
        hours = int(request.GET.get('hours', 24))
        data = MonitoringDashboard.get_application_metrics(hours)
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'timestamp': timezone.now().isoformat(),
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def performance_trends(request):
    """API endpoint for performance trends"""
    try:
        hours = int(request.GET.get('hours', 24))
        data = MonitoringDashboard.get_performance_trends(hours)
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'timestamp': timezone.now().isoformat(),
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def alerts_summary(request):
    """API endpoint for alerts summary"""
    try:
        data = MonitoringDashboard.get_alerts_summary()
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'timestamp': timezone.now().isoformat(),
        }, status=500)