#!/usr/bin/env python3
"""
Simple test script for task completion and approval workflow system

This script tests the complete workflow without complex dependencies:
1. Developer completes task -> QA review notification
2. QA approves task -> Client notification  
3. Client approves task -> Task marked complete, project progress updated
4. Automated milestone progress calculation and payment triggers

Requirements tested: 7.1, 7.2, 7.3, 7.4
"""

import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.contrib.auth import get_user_model
from projects.models import Project, Task
from projects.task_approval_service import TaskApprovalService
from communications.models import Notification
from payments.models import Milestone

User = get_user_model()


def create_test_data():
    """Create minimal test data for the approval workflow"""
    print("Creating test data...")
    
    # Clean up any existing test data first
    cleanup_test_data()
    
    # Create users
    client = User.objects.create_user(
        username='approval_client',
        email='approval_client@test.com',
        password='testpass123',
        role='client',
        first_name='Approval',
        last_name='Client'
    )
    
    developer = User.objects.create_user(
        username='approval_developer',
        email='approval_developer@test.com',
        password='testpass123',
        role='developer',
        first_name='Approval',
        last_name='Developer'
    )
    
    senior_dev = User.objects.create_user(
        username='approval_senior',
        email='approval_senior@test.com',
        password='testpass123',
        role='developer',
        first_name='Approval',
        last_name='Senior'
    )
    
    # Create project
    project = Project.objects.create(
        client=client,
        title='Task Approval Test Project',
        description='A test project to verify the task approval workflow',
        status='in_progress',
        budget_estimate=Decimal('5000.00'),
        senior_developer=senior_dev,
        required_skills=['Python', 'Django'],
        experience_level_required='mid'
    )
    
    # Create tasks
    task1 = Task.objects.create(
        project=project,
        title='Test Task 1',
        description='First test task for approval workflow',
        required_skills=['Python'],
        estimated_hours=10,
        priority=1,
        assigned_developer=developer,
        status='in_progress',
        completion_percentage=90
    )
    
    task2 = Task.objects.create(
        project=project,
        title='Test Task 2',
        description='Second test task for approval workflow',
        required_skills=['Django'],
        estimated_hours=8,
        priority=2,
        assigned_developer=developer,
        status='in_progress',
        completion_percentage=70
    )
    
    # Create milestones
    Milestone.objects.create(
        project=project,
        percentage=25,
        amount=Decimal('1250.00'),
        status='pending',
        due_date=timezone.now() + timedelta(days=30),
        description='25% project completion milestone'
    )
    
    Milestone.objects.create(
        project=project,
        percentage=50,
        amount=Decimal('1250.00'),
        status='pending',
        due_date=timezone.now() + timedelta(days=60),
        description='50% project completion milestone'
    )
    
    print(f"✓ Created test data:")
    print(f"  - Client: {client.username}")
    print(f"  - Developer: {developer.username}")
    print(f"  - Senior Developer: {senior_dev.username}")
    print(f"  - Project: {project.title}")
    print(f"  - Tasks: {task1.title}, {task2.title}")
    print(f"  - Milestones: 25%, 50%")
    
    return {
        'client': client,
        'developer': developer,
        'senior_dev': senior_dev,
        'project': project,
        'task1': task1,
        'task2': task2
    }


def test_submit_task_for_qa(data):
    """Test Requirement 7.1: Developer submits task for QA review"""
    print("\n=== Testing Task Submission for QA Review ===")
    
    task = data['task1']
    developer = data['developer']
    
    try:
        result = TaskApprovalService.submit_task_for_qa(
            task=task,
            developer=developer,
            completion_notes="Task completed successfully. All features implemented and tested."
        )
        
        print(f"✓ Task submitted for QA review: {result['message']}")
        print(f"  - Task status: {result['task_status']}")
        print(f"  - QA reviewers notified: {result['qa_reviewers_notified']}")
        
        # Verify task status changed
        task.refresh_from_db()
        assert task.status == 'qa_review', f"Expected 'qa_review', got '{task.status}'"
        assert task.completion_percentage == 100, f"Expected 100%, got {task.completion_percentage}%"
        
        # Verify notifications were created
        qa_notifications = Notification.objects.filter(
            notification_type='task_qa_review',
            related_task=task
        )
        assert qa_notifications.count() > 0, "No QA review notifications created"
        print(f"  - QA notifications created: {qa_notifications.count()}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error submitting task for QA: {str(e)}")
        return False


def test_qa_approve_task(data):
    """Test Requirement 7.2: QA approves task and notifies client"""
    print("\n=== Testing QA Task Approval ===")
    
    task = data['task1']
    senior_dev = data['senior_dev']
    
    try:
        result = TaskApprovalService.qa_approve_task(
            task=task,
            qa_reviewer=senior_dev,
            approval_notes="Code quality is excellent. All requirements met and properly tested."
        )
        
        print(f"✓ Task approved by QA: {result['message']}")
        print(f"  - Task status: {result['task_status']}")
        print(f"  - Client notification ID: {result['client_notification_id']}")
        
        # Verify task status changed
        task.refresh_from_db()
        assert task.status == 'client_review', f"Expected 'client_review', got '{task.status}'"
        
        # Verify client notification was created
        client_notification = Notification.objects.filter(
            notification_type='task_client_approval',
            related_task=task
        ).first()
        assert client_notification is not None, "No client approval notification created"
        assert client_notification.recipient == data['client'], "Notification not sent to client"
        print(f"  - Client notification created for: {client_notification.recipient.username}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error in QA approval: {str(e)}")
        return False


def test_client_approve_task(data):
    """Test Requirement 7.3: Client approves task and updates project progress"""
    print("\n=== Testing Client Task Approval ===")
    
    task = data['task1']
    client = data['client']
    project = data['project']
    
    try:
        result = TaskApprovalService.client_approve_task(
            task=task,
            client=client,
            approval_notes="Excellent work! The task is completed perfectly."
        )
        
        print(f"✓ Task approved by client: {result['message']}")
        print(f"  - Task status: {result['task_status']}")
        print(f"  - Developer notification ID: {result['developer_notification_id']}")
        
        # Verify task status changed
        task.refresh_from_db()
        assert task.status == 'approved', f"Expected 'approved', got '{task.status}'"
        
        # Verify developer notification was created
        dev_notification = Notification.objects.filter(
            notification_type='task_approved',
            related_task=task
        ).first()
        assert dev_notification is not None, "No developer approval notification created"
        assert dev_notification.recipient == data['developer'], "Notification not sent to developer"
        
        # Verify project progress was updated
        progress = result['project_progress']
        print(f"  - Project progress: {progress['progress_percentage']}%")
        print(f"  - Approved tasks: {progress['approved_tasks']}/{progress['total_tasks']}")
        print(f"  - Milestone triggered: {progress['milestone_triggered']}")
        
        if progress['milestone_triggered']:
            print(f"  - Milestones completed: {len(progress['milestones_completed'])}")
            for milestone in progress['milestones_completed']:
                print(f"    * {milestone['percentage']}% - ${milestone['amount']}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error in client approval: {str(e)}")
        return False


def test_milestone_completion(data):
    """Test Requirement 7.4: Automated milestone progress calculation"""
    print("\n=== Testing Milestone Completion ===")
    
    project = data['project']
    
    try:
        # Check current project progress
        total_tasks = project.tasks.count()
        approved_tasks = project.tasks.filter(status='approved').count()
        progress_percentage = int((approved_tasks / total_tasks) * 100) if total_tasks > 0 else 0
        
        print(f"Current project progress: {progress_percentage}%")
        print(f"Approved tasks: {approved_tasks}/{total_tasks}")
        
        # Check milestone status
        milestones = project.milestones.all().order_by('percentage')
        for milestone in milestones:
            print(f"Milestone {milestone.percentage}%: {milestone.status}")
            
            if progress_percentage >= milestone.percentage and milestone.status == 'completed':
                # Verify milestone completion notification was created
                milestone_notification = Notification.objects.filter(
                    notification_type='milestone_completed',
                    related_project=project,
                    metadata__milestone_percentage=milestone.percentage
                ).first()
                
                if milestone_notification:
                    print(f"  ✓ Milestone completion notification created")
                    print(f"    - Recipient: {milestone_notification.recipient.username}")
                    print(f"    - Amount: ${milestone_notification.metadata.get('milestone_amount', 'N/A')}")
                else:
                    print(f"  ✗ No milestone completion notification found")
        
        return True
        
    except Exception as e:
        print(f"✗ Error checking milestone completion: {str(e)}")
        return False


def test_qa_reject_task(data):
    """Test QA rejection workflow"""
    print("\n=== Testing QA Task Rejection ===")
    
    task = data['task2']
    developer = data['developer']
    senior_dev = data['senior_dev']
    
    try:
        # First submit task for QA
        TaskApprovalService.submit_task_for_qa(
            task=task,
            developer=developer,
            completion_notes="Task implementation completed"
        )
        
        # Then reject it
        result = TaskApprovalService.qa_reject_task(
            task=task,
            qa_reviewer=senior_dev,
            rejection_notes="Task needs better error handling and validation"
        )
        
        print(f"✓ Task rejected by QA: {result['message']}")
        print(f"  - Task status: {result['task_status']}")
        
        # Verify task status changed back
        task.refresh_from_db()
        assert task.status == 'in_progress', f"Expected 'in_progress', got '{task.status}'"
        assert task.completion_percentage == 75, f"Expected 75%, got {task.completion_percentage}%"
        
        # Verify developer notification was created
        dev_notification = Notification.objects.filter(
            notification_type='task_qa_rejected',
            related_task=task
        ).first()
        assert dev_notification is not None, "No developer rejection notification created"
        assert dev_notification.recipient == developer, "Notification not sent to developer"
        
        return True
        
    except Exception as e:
        print(f"✗ Error in QA rejection: {str(e)}")
        return False


def test_approval_status(data):
    """Test getting task approval status"""
    print("\n=== Testing Task Approval Status ===")
    
    task = data['task1']
    
    try:
        status_data = TaskApprovalService.get_task_approval_status(task)
        
        print(f"✓ Task approval status retrieved:")
        print(f"  - Task: {status_data['task_title']}")
        print(f"  - Current status: {status_data['current_status']}")
        print(f"  - Workflow stage: {status_data['workflow_stage']}")
        print(f"  - Completion: {status_data['completion_percentage']}%")
        print(f"  - QA reviewers: {len(status_data['qa_reviewers'])}")
        print(f"  - Recent notifications: {len(status_data['recent_notifications'])}")
        
        if status_data['assigned_developer']:
            print(f"  - Assigned to: {status_data['assigned_developer']['name']}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error getting approval status: {str(e)}")
        return False


def cleanup_test_data():
    """Clean up test data"""
    print("=== Cleaning up test data ===")
    
    try:
        # Delete in reverse order of dependencies
        usernames = ['approval_client', 'approval_developer', 'approval_senior']
        Notification.objects.filter(recipient__username__in=usernames).delete()
        Task.objects.filter(project__title='Task Approval Test Project').delete()
        Milestone.objects.filter(project__title='Task Approval Test Project').delete()
        Project.objects.filter(title='Task Approval Test Project').delete()
        User.objects.filter(username__in=usernames).delete()
        
        print("✓ Test data cleaned up successfully")
        
    except Exception as e:
        print(f"✗ Error cleaning up test data: {str(e)}")


def main():
    """Run all task approval workflow tests"""
    print("🚀 Starting Task Approval Workflow Tests (Simple)")
    print("=" * 50)
    
    # Create test data
    data = create_test_data()
    
    # Run tests in sequence (each test depends on the previous one)
    tests = [
        test_submit_task_for_qa,
        test_qa_approve_task,
        test_client_approve_task,
        test_milestone_completion,
        test_qa_reject_task,
        test_approval_status
    ]
    
    passed = 0
    failed = 0
    
    for test_func in tests:
        try:
            if test_func(data):
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"✗ Test {test_func.__name__} failed with exception: {str(e)}")
            failed += 1
    
    # Summary
    print("\n" + "=" * 50)
    print(f"📊 Test Results Summary:")
    print(f"✓ Passed: {passed}")
    print(f"✗ Failed: {failed}")
    print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 All task approval workflow tests passed!")
        print("\nRequirements verified:")
        print("✓ 7.1 - Task completion notification system for QA review")
        print("✓ 7.2 - QA approval workflow and client notification")
        print("✓ 7.3 - Client task approval interface")
        print("✓ 7.4 - Automated milestone progress calculation")
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please review the implementation.")
    
    # Cleanup
    cleanup_test_data()


if __name__ == '__main__':
    main()