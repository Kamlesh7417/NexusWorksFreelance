"""
Performance monitoring and alerting system
"""
import time
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from functools import wraps

from django.core.cache import cache
from django.conf import settings
from django.db import connection
from django.utils import timezone

logger = logging.getLogger('performance')

class PerformanceMonitor:
    """Performance monitoring service"""
    
    CACHE_PREFIX = 'perf_monitor'
    ALERT_THRESHOLD_RESPONSE_TIME = 5.0  # seconds
    ALERT_THRESHOLD_ERROR_RATE = 0.05  # 5%
    ALERT_THRESHOLD_DB_CONNECTIONS = 80  # 80% of max connections
    
    @classmethod
    def record_request_metrics(cls, view_name: str, method: str, response_time: float, status_code: int):
        """Record request performance metrics"""
        try:
            timestamp = timezone.now()
            cache_key = f"{cls.CACHE_PREFIX}:requests:{view_name}:{timestamp.strftime('%Y%m%d%H%M')}"
            
            # Get existing metrics or initialize
            metrics = cache.get(cache_key, {
                'count': 0,
                'total_time': 0.0,
                'error_count': 0,
                'max_time': 0.0,
                'min_time': float('inf'),
                'status_codes': {}
            })
            
            # Update metrics
            metrics['count'] += 1
            metrics['total_time'] += response_time
            metrics['max_time'] = max(metrics['max_time'], response_time)
            metrics['min_time'] = min(metrics['min_time'], response_time)
            
            if status_code >= 400:
                metrics['error_count'] += 1
            
            status_key = str(status_code)
            metrics['status_codes'][status_key] = metrics['status_codes'].get(status_key, 0) + 1
            
            # Cache for 1 hour
            cache.set(cache_key, metrics, 3600)
            
            # Log performance data
            logger.info(json.dumps({
                'event': 'request_performance',
                'view': view_name,
                'method': method,
                'response_time': response_time,
                'status_code': status_code,
                'timestamp': timestamp.isoformat()
            }))
            
            # Check for alerts
            cls._check_performance_alerts(view_name, metrics, response_time)
            
        except Exception as e:
            logger.error(f"Failed to record request metrics: {str(e)}")
    
    @classmethod
    def record_database_metrics(cls):
        """Record database performance metrics"""
        try:
            # Get database connection info
            db_queries = len(connection.queries)
            
            # Get connection pool info (if available)
            db_connections = getattr(connection, 'queries_logged', 0)
            
            timestamp = timezone.now()
            cache_key = f"{cls.CACHE_PREFIX}:database:{timestamp.strftime('%Y%m%d%H%M')}"
            
            metrics = {
                'queries_count': db_queries,
                'connections_used': db_connections,
                'timestamp': timestamp.isoformat()
            }
            
            cache.set(cache_key, metrics, 3600)
            
            logger.info(json.dumps({
                'event': 'database_performance',
                **metrics
            }))
            
        except Exception as e:
            logger.error(f"Failed to record database metrics: {str(e)}")
    
    @classmethod
    def record_ai_service_metrics(cls, service_name: str, operation: str, response_time: float, success: bool):
        """Record AI service performance metrics"""
        try:
            timestamp = timezone.now()
            cache_key = f"{cls.CACHE_PREFIX}:ai_services:{service_name}:{timestamp.strftime('%Y%m%d%H%M')}"
            
            metrics = cache.get(cache_key, {
                'count': 0,
                'total_time': 0.0,
                'success_count': 0,
                'error_count': 0,
                'operations': {}
            })
            
            metrics['count'] += 1
            metrics['total_time'] += response_time
            
            if success:
                metrics['success_count'] += 1
            else:
                metrics['error_count'] += 1
            
            if operation not in metrics['operations']:
                metrics['operations'][operation] = {'count': 0, 'total_time': 0.0}
            
            metrics['operations'][operation]['count'] += 1
            metrics['operations'][operation]['total_time'] += response_time
            
            cache.set(cache_key, metrics, 3600)
            
            logger.info(json.dumps({
                'event': 'ai_service_performance',
                'service': service_name,
                'operation': operation,
                'response_time': response_time,
                'success': success,
                'timestamp': timestamp.isoformat()
            }))
            
        except Exception as e:
            logger.error(f"Failed to record AI service metrics: {str(e)}")
    
    @classmethod
    def _check_performance_alerts(cls, view_name: str, metrics: Dict[str, Any], current_response_time: float):
        """Check if performance alerts should be triggered"""
        try:
            # Check response time alert
            if current_response_time > cls.ALERT_THRESHOLD_RESPONSE_TIME:
                cls._send_alert('high_response_time', {
                    'view': view_name,
                    'response_time': current_response_time,
                    'threshold': cls.ALERT_THRESHOLD_RESPONSE_TIME
                })
            
            # Check error rate alert
            if metrics['count'] > 10:  # Only check if we have enough samples
                error_rate = metrics['error_count'] / metrics['count']
                if error_rate > cls.ALERT_THRESHOLD_ERROR_RATE:
                    cls._send_alert('high_error_rate', {
                        'view': view_name,
                        'error_rate': error_rate,
                        'threshold': cls.ALERT_THRESHOLD_ERROR_RATE,
                        'total_requests': metrics['count'],
                        'error_count': metrics['error_count']
                    })
            
        except Exception as e:
            logger.error(f"Failed to check performance alerts: {str(e)}")
    
    @classmethod
    def _send_alert(cls, alert_type: str, data: Dict[str, Any]):
        """Send performance alert"""
        try:
            # Check if we've already sent this alert recently (rate limiting)
            alert_key = f"{cls.CACHE_PREFIX}:alert:{alert_type}:{data.get('view', 'unknown')}"
            if cache.get(alert_key):
                return  # Alert already sent recently
            
            # Set alert cooldown (5 minutes)
            cache.set(alert_key, True, 300)
            
            # Log alert
            logger.warning(json.dumps({
                'event': 'performance_alert',
                'alert_type': alert_type,
                'data': data,
                'timestamp': timezone.now().isoformat()
            }))
            
            # Here you would integrate with your alerting system
            # (Slack, PagerDuty, email, etc.)
            
        except Exception as e:
            logger.error(f"Failed to send alert: {str(e)}")
    
    @classmethod
    def get_performance_summary(cls, hours: int = 1) -> Dict[str, Any]:
        """Get performance summary for the last N hours"""
        try:
            end_time = timezone.now()
            start_time = end_time - timedelta(hours=hours)
            
            summary = {
                'period': {
                    'start': start_time.isoformat(),
                    'end': end_time.isoformat(),
                    'hours': hours
                },
                'requests': {},
                'database': {},
                'ai_services': {}
            }
            
            # Collect request metrics
            current_time = start_time
            while current_time <= end_time:
                time_key = current_time.strftime('%Y%m%d%H%M')
                
                # Get all request metrics for this time period
                pattern = f"{cls.CACHE_PREFIX}:requests:*:{time_key}"
                # Note: This is a simplified version. In production, you'd use Redis SCAN
                
                current_time += timedelta(minutes=1)
            
            return summary
            
        except Exception as e:
            logger.error(f"Failed to get performance summary: {str(e)}")
            return {}

def monitor_performance(view_name: Optional[str] = None):
    """Decorator to monitor view performance"""
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            start_time = time.time()
            view = view_name or f"{func.__module__}.{func.__name__}"
            
            try:
                response = func(request, *args, **kwargs)
                response_time = time.time() - start_time
                status_code = getattr(response, 'status_code', 200)
                
                # Record metrics
                PerformanceMonitor.record_request_metrics(
                    view, request.method, response_time, status_code
                )
                
                return response
                
            except Exception as e:
                response_time = time.time() - start_time
                
                # Record error metrics
                PerformanceMonitor.record_request_metrics(
                    view, request.method, response_time, 500
                )
                
                raise e
        
        return wrapper
    return decorator

def monitor_ai_service(service_name: str, operation: str):
    """Decorator to monitor AI service performance"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            success = True
            
            try:
                result = func(*args, **kwargs)
                return result
                
            except Exception as e:
                success = False
                raise e
                
            finally:
                response_time = time.time() - start_time
                PerformanceMonitor.record_ai_service_metrics(
                    service_name, operation, response_time, success
                )
        
        return wrapper
    return decorator