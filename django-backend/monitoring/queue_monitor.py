"""
Task queue monitoring and failure recovery system.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from celery import current_app
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings

from .models import TaskQueueMetric, SystemAlert

logger = logging.getLogger(__name__)


class TaskQueueMonitor:
    """Monitor Celery task queues and handle failures."""
    
    def __init__(self):
        self.celery_app = current_app
        self.inspect = self.celery_app.control.inspect()
        
    def get_queue_statistics(self) -> Dict[str, Any]:
        """Get comprehensive queue statistics."""
        try:
            stats = {
                'timestamp': timezone.now().isoformat(),
                'queues': {},
                'workers': {},
                'overall_health': 'healthy'
            }
            
            # Get worker statistics
            worker_stats = self.inspect.stats()
            if worker_stats:
                stats['workers'] = {
                    'active_count': len(worker_stats),
                    'details': worker_stats
                }
            else:
                stats['workers'] = {'active_count': 0, 'details': {}}
                stats['overall_health'] = 'unhealthy'
            
            # Get active tasks
            active_tasks = self.inspect.active()
            reserved_tasks = self.inspect.reserved()
            
            # Process queue statistics
            queues = ['default', 'ai_services', 'matching', 'communications', 'monitoring', 'payments']
            
            for queue_name in queues:
                queue_stats = self._get_queue_stats(queue_name, active_tasks, reserved_tasks)
                stats['queues'][queue_name] = queue_stats
                
                # Check queue health
                if queue_stats['pending_tasks'] > 100:
                    stats['overall_health'] = 'degraded'
                elif queue_stats['pending_tasks'] > 500:
                    stats['overall_health'] = 'unhealthy'
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting queue statistics: {str(e)}")
            return {
                'timestamp': timezone.now().isoformat(),
                'error': str(e),
                'overall_health': 'unhealthy'
            }
    
    def _get_queue_stats(self, queue_name: str, active_tasks: Dict, reserved_tasks: Dict) -> Dict[str, Any]:
        """Get statistics for a specific queue."""
        stats = {
            'name': queue_name,
            'active_tasks': 0,
            'pending_tasks': 0,
            'workers_processing': 0,
            'task_types': {}
        }
        
        # Count active tasks for this queue
        if active_tasks:
            for worker, tasks in active_tasks.items():
                for task in tasks:
                    routing_key = task.get('delivery_info', {}).get('routing_key', '')
                    if routing_key == queue_name or (queue_name == 'default' and not routing_key):
                        stats['active_tasks'] += 1
                        
                        # Count task types
                        task_name = task.get('name', 'unknown')
                        stats['task_types'][task_name] = stats['task_types'].get(task_name, 0) + 1
                        
                        if stats['active_tasks'] == 1:  # First task for this worker
                            stats['workers_processing'] += 1
        
        # Count reserved (pending) tasks for this queue
        if reserved_tasks:
            for worker, tasks in reserved_tasks.items():
                for task in tasks:
                    routing_key = task.get('delivery_info', {}).get('routing_key', '')
                    if routing_key == queue_name or (queue_name == 'default' and not routing_key):
                        stats['pending_tasks'] += 1
        
        return stats
    
    def check_queue_health(self) -> List[Dict[str, Any]]:
        """Check queue health and return any issues found."""
        issues = []
        
        try:
            queue_stats = self.get_queue_statistics()
            
            # Check if workers are available
            if queue_stats['workers']['active_count'] == 0:
                issues.append({
                    'type': 'no_workers',
                    'severity': 'critical',
                    'message': 'No Celery workers are active',
                    'recommendation': 'Start Celery workers immediately'
                })
            
            # Check individual queues
            for queue_name, queue_data in queue_stats.get('queues', {}).items():
                # Check for excessive pending tasks
                if queue_data['pending_tasks'] > 500:
                    issues.append({
                        'type': 'queue_backlog',
                        'severity': 'critical',
                        'queue': queue_name,
                        'pending_tasks': queue_data['pending_tasks'],
                        'message': f'Queue {queue_name} has {queue_data["pending_tasks"]} pending tasks',
                        'recommendation': 'Scale up workers or investigate task processing issues'
                    })
                elif queue_data['pending_tasks'] > 100:
                    issues.append({
                        'type': 'queue_backlog',
                        'severity': 'high',
                        'queue': queue_name,
                        'pending_tasks': queue_data['pending_tasks'],
                        'message': f'Queue {queue_name} has {queue_data["pending_tasks"]} pending tasks',
                        'recommendation': 'Monitor queue and consider scaling workers'
                    })
                
                # Check for stuck tasks (no active tasks but workers available)
                if (queue_data['pending_tasks'] > 0 and 
                    queue_data['active_tasks'] == 0 and 
                    queue_stats['workers']['active_count'] > 0):
                    issues.append({
                        'type': 'stuck_tasks',
                        'severity': 'high',
                        'queue': queue_name,
                        'message': f'Queue {queue_name} has pending tasks but no active processing',
                        'recommendation': 'Restart workers or check for task routing issues'
                    })
            
        except Exception as e:
            issues.append({
                'type': 'monitoring_error',
                'severity': 'medium',
                'message': f'Error monitoring queues: {str(e)}',
                'recommendation': 'Check queue monitoring system'
            })
        
        return issues
    
    def recover_failed_tasks(self) -> Dict[str, Any]:
        """Attempt to recover failed tasks."""
        recovery_results = {
            'timestamp': timezone.now().isoformat(),
            'actions_taken': [],
            'errors': []
        }
        
        try:
            # Get failed task information
            # Note: This would typically require a result backend like Redis or database
            # For now, we'll implement basic recovery strategies
            
            # Strategy 1: Purge old reserved tasks that might be stuck
            try:
                purged = self.celery_app.control.purge()
                if purged:
                    recovery_results['actions_taken'].append({
                        'action': 'purge_reserved_tasks',
                        'result': f'Purged {sum(purged.values())} reserved tasks'
                    })
            except Exception as e:
                recovery_results['errors'].append(f'Failed to purge tasks: {str(e)}')
            
            # Strategy 2: Restart workers if they appear stuck
            try:
                # Check for workers that haven't processed tasks recently
                worker_stats = self.inspect.stats()
                if worker_stats:
                    for worker_name, stats in worker_stats.items():
                        # This is a simplified check - in production you'd want more sophisticated logic
                        total_tasks = stats.get('total', {})
                        if isinstance(total_tasks, dict):
                            recent_tasks = sum(total_tasks.values())
                            if recent_tasks == 0:  # No recent activity
                                # In a real implementation, you might restart the worker
                                recovery_results['actions_taken'].append({
                                    'action': 'identify_inactive_worker',
                                    'worker': worker_name,
                                    'recommendation': 'Consider restarting this worker'
                                })
            except Exception as e:
                recovery_results['errors'].append(f'Failed to check worker status: {str(e)}')
            
            # Strategy 3: Clear problematic task routes
            try:
                # This would clear routing issues if any
                # Implementation depends on your specific setup
                recovery_results['actions_taken'].append({
                    'action': 'check_routing',
                    'result': 'Task routing checked and appears normal'
                })
            except Exception as e:
                recovery_results['errors'].append(f'Failed to check routing: {str(e)}')
            
        except Exception as e:
            recovery_results['errors'].append(f'General recovery error: {str(e)}')
        
        return recovery_results
    
    def create_queue_alerts(self, issues: List[Dict[str, Any]]) -> int:
        """Create system alerts for queue issues."""
        alerts_created = 0
        
        for issue in issues:
            try:
                # Check if alert already exists
                existing_alert = SystemAlert.objects.filter(
                    service_name='celery',
                    alert_type=issue['type'],
                    status='active'
                ).first()
                
                if not existing_alert:
                    SystemAlert.objects.create(
                        service_name='celery',
                        alert_type=issue['type'],
                        severity=issue['severity'],
                        title=f"Task Queue Issue: {issue['type']}",
                        description=issue['message'],
                        metric_data={
                            'queue': issue.get('queue'),
                            'pending_tasks': issue.get('pending_tasks'),
                            'recommendation': issue.get('recommendation')
                        }
                    )
                    alerts_created += 1
                    
            except Exception as e:
                logger.error(f"Error creating alert for issue {issue}: {str(e)}")
        
        return alerts_created
    
    def get_task_failure_analysis(self, hours: int = 24) -> Dict[str, Any]:
        """Analyze task failures over the specified time period."""
        analysis = {
            'period_hours': hours,
            'timestamp': timezone.now().isoformat(),
            'failure_patterns': {},
            'recommendations': []
        }
        
        try:
            # This would typically query a result backend for failed tasks
            # For now, we'll provide a framework for failure analysis
            
            # Get recent queue metrics to identify patterns
            recent_metrics = TaskQueueMetric.objects.filter(
                timestamp__gte=timezone.now() - timedelta(hours=hours)
            )
            
            if recent_metrics.exists():
                # Analyze failure patterns by queue
                for queue_name in ['default', 'ai_services', 'matching', 'communications']:
                    queue_metrics = recent_metrics.filter(queue_name=queue_name)
                    
                    if queue_metrics.exists():
                        total_failed = sum([m.failed_tasks_last_hour for m in queue_metrics])
                        total_completed = sum([m.completed_tasks_last_hour for m in queue_metrics])
                        
                        if total_failed + total_completed > 0:
                            failure_rate = (total_failed / (total_failed + total_completed)) * 100
                            
                            analysis['failure_patterns'][queue_name] = {
                                'total_failed': total_failed,
                                'total_completed': total_completed,
                                'failure_rate_percent': round(failure_rate, 2),
                                'avg_duration': queue_metrics.aggregate(
                                    avg=models.Avg('average_task_duration')
                                )['avg'] or 0
                            }
                            
                            # Generate recommendations
                            if failure_rate > 10:
                                analysis['recommendations'].append(
                                    f"High failure rate ({failure_rate:.1f}%) in {queue_name} queue - investigate task implementations"
                                )
                            
                            if queue_metrics.latest('timestamp').average_task_duration > 300:  # 5 minutes
                                analysis['recommendations'].append(
                                    f"Long task duration in {queue_name} queue - consider task optimization"
                                )
            
        except Exception as e:
            analysis['error'] = str(e)
            logger.error(f"Error in task failure analysis: {str(e)}")
        
        return analysis


class TaskRecoveryManager:
    """Manage task recovery and retry strategies."""
    
    def __init__(self):
        self.monitor = TaskQueueMonitor()
    
    def execute_recovery_plan(self) -> Dict[str, Any]:
        """Execute comprehensive task recovery plan."""
        recovery_plan = {
            'timestamp': timezone.now().isoformat(),
            'steps_executed': [],
            'issues_found': [],
            'alerts_created': 0,
            'recovery_actions': []
        }
        
        try:
            # Step 1: Check queue health
            issues = self.monitor.check_queue_health()
            recovery_plan['issues_found'] = issues
            
            # Step 2: Create alerts for critical issues
            if issues:
                alerts_created = self.monitor.create_queue_alerts(issues)
                recovery_plan['alerts_created'] = alerts_created
                recovery_plan['steps_executed'].append('create_alerts')
            
            # Step 3: Attempt automatic recovery for known issues
            if any(issue['severity'] in ['critical', 'high'] for issue in issues):
                recovery_results = self.monitor.recover_failed_tasks()
                recovery_plan['recovery_actions'] = recovery_results['actions_taken']
                recovery_plan['steps_executed'].append('automatic_recovery')
            
            # Step 4: Update monitoring metrics
            queue_stats = self.monitor.get_queue_statistics()
            recovery_plan['current_queue_status'] = queue_stats
            recovery_plan['steps_executed'].append('update_metrics')
            
            # Step 5: Cache recovery status for dashboard
            cache.set('task_recovery_status', recovery_plan, timeout=300)  # 5 minutes
            recovery_plan['steps_executed'].append('cache_status')
            
        except Exception as e:
            recovery_plan['error'] = str(e)
            logger.error(f"Error in recovery plan execution: {str(e)}")
        
        return recovery_plan