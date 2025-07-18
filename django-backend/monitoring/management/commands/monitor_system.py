"""
Management command for system monitoring and alerting
"""
import time
import logging
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.cache import cache

from monitoring.performance_monitor import PerformanceMonitor
from monitoring.health_checks import HealthCheckService
from monitoring.alerting import alert_manager, create_performance_alert, create_error_rate_alert, create_availability_alert
from freelance_platform.database_config import DatabaseMonitor, monitor_connection_pool
from freelance_platform.cache_config import monitor_cache_health

logger = logging.getLogger('monitoring')

class Command(BaseCommand):
    help = 'Monitor system health and performance, send alerts when needed'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=int,
            default=60,
            help='Monitoring interval in seconds (default: 60)'
        )
        parser.add_argument(
            '--once',
            action='store_true',
            help='Run monitoring once and exit'
        )
        parser.add_argument(
            '--check-type',
            choices=['all', 'performance', 'health', 'database', 'cache', 'ai-services'],
            default='all',
            help='Type of checks to perform'
        )
        parser.add_argument(
            '--alert-threshold',
            type=float,
            default=2.0,
            help='Response time alert threshold in seconds'
        )
        parser.add_argument(
            '--error-threshold',
            type=float,
            default=0.05,
            help='Error rate alert threshold (0.05 = 5%)'
        )
    
    def handle(self, *args, **options):
        self.interval = options['interval']
        self.once = options['once']
        self.check_type = options['check_type']
        self.alert_threshold = options['alert_threshold']
        self.error_threshold = options['error_threshold']
        
        self.stdout.write(
            self.style.SUCCESS(f'Starting system monitoring (interval: {self.interval}s)')
        )
        
        if self.once:
            self.run_monitoring_cycle()
        else:
            self.run_continuous_monitoring()
    
    def run_continuous_monitoring(self):
        """Run continuous monitoring loop"""
        try:
            while True:
                start_time = time.time()
                
                self.run_monitoring_cycle()
                
                # Calculate sleep time to maintain consistent interval
                elapsed_time = time.time() - start_time
                sleep_time = max(0, self.interval - elapsed_time)
                
                if sleep_time > 0:
                    time.sleep(sleep_time)
                else:
                    logger.warning(f"Monitoring cycle took {elapsed_time:.2f}s, longer than interval {self.interval}s")
                    
        except KeyboardInterrupt:
            self.stdout.write(self.style.SUCCESS('Monitoring stopped by user'))
        except Exception as e:
            logger.error(f"Monitoring loop failed: {e}")
            self.stdout.write(self.style.ERROR(f'Monitoring failed: {e}'))
    
    def run_monitoring_cycle(self):
        """Run a single monitoring cycle"""
        try:
            if self.check_type in ['all', 'health']:
                self.check_system_health()
            
            if self.check_type in ['all', 'performance']:
                self.check_performance_metrics()
            
            if self.check_type in ['all', 'database']:
                self.check_database_health()
            
            if self.check_type in ['all', 'cache']:
                self.check_cache_health()
            
            if self.check_type in ['all', 'ai-services']:
                self.check_ai_services()
            
            # Update monitoring timestamp
            cache.set('monitoring:last_run', timezone.now().isoformat(), 300)
            
        except Exception as e:
            logger.error(f"Monitoring cycle failed: {e}")
            
            # Create alert for monitoring failure
            alert_manager.create_alert(
                title="Monitoring System Failure",
                description=f"System monitoring failed: {str(e)}",
                severity=alert_manager.AlertSeverity.HIGH,
                service="monitoring",
                metric="system_health",
                value=0,
                threshold=1
            )
    
    def check_system_health(self):
        """Check overall system health"""
        try:
            health_service = HealthCheckService()
            
            # Check database
            db_health = health_service.check_database()
            if db_health['status'] != 'healthy':
                create_availability_alert(
                    service="database",
                    availability=0.0,
                    threshold=0.99
                )
            
            # Check cache
            cache_health = health_service.check_cache()
            if cache_health['status'] != 'healthy':
                create_availability_alert(
                    service="cache",
                    availability=0.0,
                    threshold=0.99
                )
            
            # Check AI services
            ai_health = health_service.check_ai_services()
            if ai_health['status'] != 'healthy':
                create_availability_alert(
                    service="ai_services",
                    availability=0.0,
                    threshold=0.95
                )
            
            # Check external services
            external_health = health_service.check_external_services()
            if external_health['status'] != 'healthy':
                create_availability_alert(
                    service="external_services",
                    availability=0.0,
                    threshold=0.95
                )
            
            # Check Celery
            celery_health = health_service.check_celery()
            if celery_health['status'] != 'healthy':
                create_availability_alert(
                    service="celery",
                    availability=0.0,
                    threshold=0.99
                )
            
            logger.info("System health check completed")
            
        except Exception as e:
            logger.error(f"System health check failed: {e}")
    
    def check_performance_metrics(self):
        """Check performance metrics and create alerts if needed"""
        try:
            # Get recent performance data
            current_time = timezone.now()
            start_time = current_time - timedelta(minutes=5)
            
            # Check response times for critical endpoints
            critical_endpoints = [
                'api.projects.views.ProjectViewSet',
                'api.matching.views.DeveloperMatchViewSet',
                'api.ai_services.views.ProjectAnalysisView',
                'api.payments.views.PaymentViewSet',
            ]
            
            for endpoint in critical_endpoints:
                # Get cached performance data
                cache_key = f"perf_monitor:requests:{endpoint}:{current_time.strftime('%Y%m%d%H%M')}"
                metrics = cache.get(cache_key)
                
                if metrics and metrics['count'] > 0:
                    avg_response_time = metrics['total_time'] / metrics['count']
                    error_rate = metrics['error_count'] / metrics['count']
                    
                    # Check response time
                    if avg_response_time > self.alert_threshold:
                        create_performance_alert(
                            service=endpoint,
                            metric="response_time",
                            value=avg_response_time,
                            threshold=self.alert_threshold
                        )
                    
                    # Check error rate
                    if error_rate > self.error_threshold:
                        create_error_rate_alert(
                            service=endpoint,
                            error_rate=error_rate,
                            threshold=self.error_threshold
                        )
            
            logger.info("Performance metrics check completed")
            
        except Exception as e:
            logger.error(f"Performance metrics check failed: {e}")
    
    def check_database_health(self):
        """Check database health and performance"""
        try:
            # Monitor connection pool
            connection_stats = monitor_connection_pool()
            
            if connection_stats:
                # Check for high connection usage
                max_connections = 20  # From settings
                connection_usage = connection_stats['total_connections'] / max_connections
                
                if connection_usage > 0.8:
                    create_performance_alert(
                        service="database",
                        metric="connection_usage",
                        value=connection_usage,
                        threshold=0.8
                    )
                
                # Check for idle in transaction connections
                if connection_stats['idle_in_transaction'] > 5:
                    create_performance_alert(
                        service="database",
                        metric="idle_in_transaction",
                        value=connection_stats['idle_in_transaction'],
                        threshold=5
                    )
            
            # Check slow queries
            slow_queries = DatabaseMonitor.get_slow_queries(limit=5)
            for query in slow_queries:
                if query['mean_time'] > 5000:  # 5 seconds
                    logger.warning(f"Slow query detected: {query['mean_time']:.2f}ms")
            
            # Check cache hit ratio
            performance_stats = DatabaseMonitor.analyze_query_performance()
            if performance_stats['cache_hit_ratio'] < 90:
                create_performance_alert(
                    service="database",
                    metric="cache_hit_ratio",
                    value=performance_stats['cache_hit_ratio'],
                    threshold=90
                )
            
            logger.info("Database health check completed")
            
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
    
    def check_cache_health(self):
        """Check cache health and performance"""
        try:
            cache_health = monitor_cache_health()
            
            if cache_health['status'] == 'unhealthy':
                create_availability_alert(
                    service="cache",
                    availability=0.0,
                    threshold=0.99
                )
            elif cache_health.get('total_time', 0) > 0.5:
                create_performance_alert(
                    service="cache",
                    metric="response_time",
                    value=cache_health['total_time'],
                    threshold=0.5
                )
            
            logger.info("Cache health check completed")
            
        except Exception as e:
            logger.error(f"Cache health check failed: {e}")
    
    def check_ai_services(self):
        """Check AI services health and performance"""
        try:
            # Check AI service response times from cached metrics
            current_time = timezone.now()
            ai_services = ['gemini_api', 'github_client', 'embedding_service']
            
            for service in ai_services:
                cache_key = f"perf_monitor:ai_services:{service}:{current_time.strftime('%Y%m%d%H%M')}"
                metrics = cache.get(cache_key)
                
                if metrics and metrics['count'] > 0:
                    avg_response_time = metrics['total_time'] / metrics['count']
                    success_rate = metrics['success_count'] / metrics['count']
                    
                    # Check response time (AI services have higher thresholds)
                    if avg_response_time > 10.0:  # 10 seconds for AI services
                        create_performance_alert(
                            service=f"ai_services.{service}",
                            metric="response_time",
                            value=avg_response_time,
                            threshold=10.0
                        )
                    
                    # Check success rate
                    if success_rate < 0.95:  # 95% success rate
                        create_error_rate_alert(
                            service=f"ai_services.{service}",
                            error_rate=1 - success_rate,
                            threshold=0.05
                        )
            
            logger.info("AI services check completed")
            
        except Exception as e:
            logger.error(f"AI services check failed: {e}")
    
    def get_system_summary(self):
        """Get system monitoring summary"""
        try:
            # Get active alerts
            active_alerts = alert_manager.get_active_alerts()
            
            # Get recent performance data
            current_time = timezone.now()
            
            summary = {
                'timestamp': current_time.isoformat(),
                'active_alerts': len(active_alerts),
                'critical_alerts': len([a for a in active_alerts if a.severity.value == 'critical']),
                'high_alerts': len([a for a in active_alerts if a.severity.value == 'high']),
                'monitoring_status': 'active',
                'last_check': cache.get('monitoring:last_run'),
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Failed to get system summary: {e}")
            return {'error': str(e)}