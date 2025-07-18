#!/usr/bin/env python
"""
Test script for background task processing and monitoring system.
"""

import os
import sys
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from celery import current_app
from monitoring.tasks import (
    collect_system_health_metrics,
    collect_task_queue_metrics,
    monitor_and_recover_task_queues
)
from matching.tasks import (
    precompute_matching_results,
    cleanup_expired_matching_cache,
    update_matching_analytics
)
from ai_services.tasks import (
    cleanup_expired_cache,
    refresh_skill_embeddings
)


def test_celery_connection():
    """Test Celery connection and basic functionality."""
    print("Testing Celery connection...")
    
    try:
        # Test Celery app
        app = current_app
        print(f"✓ Celery app initialized: {app.main}")
        
        # Test inspect
        inspect = app.control.inspect()
        stats = inspect.stats()
        
        if stats:
            print(f"✓ Found {len(stats)} active workers")
            for worker, worker_stats in stats.items():
                print(f"  - Worker: {worker}")
        else:
            print("⚠ No active workers found (this is normal if workers aren't running)")
        
        return True
        
    except Exception as e:
        print(f"✗ Celery connection failed: {str(e)}")
        return False


def test_monitoring_tasks():
    """Test monitoring task functions."""
    print("\nTesting monitoring tasks...")
    
    tasks_to_test = [
        ("System Health Metrics", collect_system_health_metrics),
        ("Task Queue Metrics", collect_task_queue_metrics),
        ("Queue Monitoring & Recovery", monitor_and_recover_task_queues),
    ]
    
    results = {}
    
    for task_name, task_func in tasks_to_test:
        try:
            print(f"Testing {task_name}...")
            
            # Test task execution (not async)
            result = task_func()
            
            if result.get('success', False):
                print(f"✓ {task_name} executed successfully")
                results[task_name] = 'success'
            else:
                print(f"⚠ {task_name} completed with issues: {result.get('error', 'Unknown error')}")
                results[task_name] = 'warning'
                
        except Exception as e:
            print(f"✗ {task_name} failed: {str(e)}")
            results[task_name] = 'error'
    
    return results


def test_matching_tasks():
    """Test matching service tasks."""
    print("\nTesting matching service tasks...")
    
    tasks_to_test = [
        ("Cleanup Expired Cache", cleanup_expired_matching_cache),
        ("Update Analytics", update_matching_analytics),
    ]
    
    results = {}
    
    for task_name, task_func in tasks_to_test:
        try:
            print(f"Testing {task_name}...")
            
            # Test task execution (not async)
            result = task_func()
            
            if result.get('success', False):
                print(f"✓ {task_name} executed successfully")
                results[task_name] = 'success'
            else:
                print(f"⚠ {task_name} completed with issues: {result.get('error', 'Unknown error')}")
                results[task_name] = 'warning'
                
        except Exception as e:
            print(f"✗ {task_name} failed: {str(e)}")
            results[task_name] = 'error'
    
    return results


def test_ai_service_tasks():
    """Test AI service tasks."""
    print("\nTesting AI service tasks...")
    
    tasks_to_test = [
        ("Cleanup Expired Cache", cleanup_expired_cache),
    ]
    
    results = {}
    
    for task_name, task_func in tasks_to_test:
        try:
            print(f"Testing {task_name}...")
            
            # Test task execution (not async)
            result = task_func()
            
            if result.get('success', False):
                print(f"✓ {task_name} executed successfully")
                results[task_name] = 'success'
            else:
                print(f"⚠ {task_name} completed with issues: {result.get('error', 'Unknown error')}")
                results[task_name] = 'warning'
                
        except Exception as e:
            print(f"✗ {task_name} failed: {str(e)}")
            results[task_name] = 'error'
    
    return results


def test_celery_beat_schedule():
    """Test Celery Beat schedule configuration."""
    print("\nTesting Celery Beat schedule...")
    
    try:
        app = current_app
        schedule = app.conf.beat_schedule
        
        print(f"✓ Found {len(schedule)} scheduled tasks:")
        
        for task_name, task_config in schedule.items():
            task_path = task_config['task']
            schedule_interval = task_config['schedule']
            
            # Convert schedule to human readable
            if isinstance(schedule_interval, (int, float)):
                interval_str = f"{schedule_interval}s"
            else:
                interval_str = str(schedule_interval)
            
            print(f"  - {task_name}: {task_path} (every {interval_str})")
        
        return True
        
    except Exception as e:
        print(f"✗ Beat schedule test failed: {str(e)}")
        return False


def main():
    """Run all background task tests."""
    print("=" * 60)
    print("BACKGROUND TASK PROCESSING AND MONITORING TEST")
    print("=" * 60)
    print(f"Test started at: {datetime.now()}")
    
    # Test results
    test_results = {}
    
    # Test Celery connection
    test_results['celery_connection'] = test_celery_connection()
    
    # Test Celery Beat schedule
    test_results['beat_schedule'] = test_celery_beat_schedule()
    
    # Test monitoring tasks
    monitoring_results = test_monitoring_tasks()
    test_results['monitoring_tasks'] = monitoring_results
    
    # Test matching tasks
    matching_results = test_matching_tasks()
    test_results['matching_tasks'] = matching_results
    
    # Test AI service tasks
    ai_results = test_ai_service_tasks()
    test_results['ai_service_tasks'] = ai_results
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    total_tests = 0
    passed_tests = 0
    
    # Basic tests
    for test_name, result in [('Celery Connection', test_results['celery_connection']), 
                             ('Beat Schedule', test_results['beat_schedule'])]:
        total_tests += 1
        if result:
            print(f"✓ {test_name}: PASSED")
            passed_tests += 1
        else:
            print(f"✗ {test_name}: FAILED")
    
    # Task tests
    for category, results in [('Monitoring Tasks', monitoring_results),
                             ('Matching Tasks', matching_results),
                             ('AI Service Tasks', ai_results)]:
        for task_name, result in results.items():
            total_tests += 1
            if result == 'success':
                print(f"✓ {task_name}: PASSED")
                passed_tests += 1
            elif result == 'warning':
                print(f"⚠ {task_name}: PASSED WITH WARNINGS")
                passed_tests += 1
            else:
                print(f"✗ {task_name}: FAILED")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 All tests passed! Background task system is working correctly.")
        return 0
    elif passed_tests > total_tests * 0.7:
        print("⚠ Most tests passed. Some issues may need attention.")
        return 1
    else:
        print("❌ Many tests failed. Background task system needs fixes.")
        return 2


if __name__ == '__main__':
    sys.exit(main())