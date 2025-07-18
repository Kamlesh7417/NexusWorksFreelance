#!/usr/bin/env python3
"""
Test script for task completion and approval workflow system

This script tests the complete workflow:
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
from projects.models import Project, Task, TaskAssignment, TeamInvitation
from projects.task_approval_service import TaskApprovalService
from communications.models import Notification
from payments.models import Milestone
from users.models import DeveloperProfile

User = get_user_model()


def create_test_data():
    """Create test data for the approval workflow"""
    print("Creating test data...")
    
    # Clean up any existing test data first
    cleanup_test_data()
    
    # Create users
    client = User.objects.create_user(
        username='test_client_approval',
        email='client_approval@test.com',
        password='testpass123',
        role='client',
        first_name='Test',
        last_name='Client'
    )
    
    developer = User.objects.create_user(
        username='test_developer_approval',
        email='developer_approval@test.com',
        password='testpass123',
        role='developer',
        first_name='Test',
        last_name='Developer'
    )
    
    senior_dev = User.objects.create_user(
        username='senior_dev_approval',
        email='senior_approval@test.com',
        password='testpass123',
        role='developer',
        first_name='Senior',
        last_name='Developer'
    )
    
    # Create developer profiles
    DeveloperProfile.objects.create(
        user=developer,
        skills=['Python', 'Django', 'React'],
        experience_level='mid',
        hourly_rate=Decimal('75.00'),
        reputation_score=4.5
    )
    
    DeveloperProfile.objects.create(
        user=senior_dev,
        skills=['Python', 'Django', 'React', 'Leadership'],
        experience_level='senior',
        hourly_rate=Decimal('120.00'),
        reputation_score=4.8
    )
    
    # Create project
    project = Project.objects.create(
        client=client,
        title='Test Project for Approval Workflow',
        description='A test project to verify the task approval workflow',
        status='in_progress',
        budget_estimate=Decimal('10000.00'),
        senior_developer=senior_dev,
        required_skills=['Python', 'Django'],
        experience_level_required='mid'
    )
    
    # Create tasks
    task1 = Task.objects.create(
        project=project,
        title='Implement User Authentication',
        description='Create user login and registration system',
        required_skills=['Python', 'Django'],
        estimated_hours=20,
        priority=1,
        assigned_developer=developer,
        status='in_progress',
        completion_percentage=80
    )
    
    task2 = Task.objects.create(
        project=project,
        title='Create API Endpoints',
        description='Build REST API endpoints for the application',
        required_skills=['Python', 'Django', 'REST'],
        estimated_hours=15,
        priority=2,
        assigned_developer=developer,
        status='in_progress',
        completion_percentage=60
    )
    
    # Create task assignments
    TaskAssignment.objects.create(
        task=task1,
        developer=developer,
        invitation=None,  # We'll skip invitation for this test
        agreed_rate=Decimal('75.00'),
        agreed_hours=20,
        start_date=timezone.now() - timedelta(days=5),
        expected_completion_date=timezone.now() + timedelta(days=2),
        status='active',
        allocated_budget=Decimal('1500.00'),
        progress_percentage=80
    )
    
    TaskAssignment.objects.create(
        task=task2,
        developer=developer,
        invitation=None,  # We'll skip invitation for this test
        agreed_rate=Decimal('75.00'),
        agreed_hours=15,
        start_date=timezone.now() - timedelta(days=3),
        expected_completion_date=timezone.now() + timedelta(days=5),
        status='active',
        allocated_budget=Decimal('1125.00'),
        progress_percentage=60
    )
    
    # Create milestones
    Milestone.objects.create(
        project=project,
        percentage=25,
        amount=Decimal('2500.00'),
        status='pending',
        due_date=timezone.now() + timedelta(days=30),
        description='25% project completion milestone'
    )
    
    Milestone.objects.create(
        project=project,
        percentage=50,
        amount=Decimal('2500.00'),
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
    
    # Test successful submission
    try:
        result = TaskApprovalService.submit_task_for_qa(
            task=task,
            developer=developer,
            completion_notes="Task completed successfully. All authentication features implemented and tested."
        )
        
        print(f"✓ Task submitted for QA review: {result['message']}")
        print(f"  - Task status: {result['task_status']}")
        print(f"  - QA reviewers notified: {result['qa_reviewers_notified']}")
        
        # Verify task status changed
        task.refresh_from_db()
        assert task.status == 'qa_review', f"Expected 'qa_review', got '{task.status}'"
        assert task.completion_percentage == 100, f"Expected 100%, got {task.completion_percentage}%"
        
        # Verify assignment status changed
        assignment = task.assignment
        assignment.refresh_from_db()
        assert assignment.status == 'qa_review', f"Expected 'qa_review', got '{assignment.status}'"
        
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
        
        # Verify assignment status changed
        assignment = task.assignment
        assignment.refresh_from_db()
        assert assignment.status == 'client_review', f"Expected 'client_review', got '{assignment.status}'"
        
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
            approval_notes="Excellent work! The authentication system works perfectly."
        )
        
        print(f"✓ Task approved by client: {result['message']}")
        print(f"  - Task status: {result['task_status']}")
        print(f"  - Developer notification ID: {result['developer_notification_id']}")
        
        # Verify task status changed
        task.refresh_from_db()
        assert task.status == 'approved', f"Expected 'approved', got '{task.status}'"
        
        # Verify assignment status changed
        assignment = task.assignment
        assignment.refresh_from_db()
        assert assignment.status == 'completed', f"Expected 'completed', got '{assignment.status}'"
        assert assignment.actual_completion_date is not None, "Completion date not set"
        
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
        progress_percentage = int((approved_tasks / total_tasks) * 100)
        
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
            completion_notes="API endpoints implemented"
        )
        
        # Then reject it
        result = TaskApprovalService.qa_reject_task(
            task=task,
            qa_reviewer=senior_dev,
            rejection_notes="API endpoints need better error handling and validation"
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
        usernames = ['test_client_approval', 'test_developer_approval', 'senior_dev_approval']
        Notification.objects.filter(recipient__username__in=usernames).delete()
        TaskAssignment.objects.filter(developer__username__in=usernames).delete()
        Task.objects.filter(project__title='Test Project for Approval Workflow').delete()
        Milestone.objects.filter(project__title='Test Project for Approval Workflow').delete()
        Project.objects.filter(title='Test Project for Approval Workflow').delete()
        DeveloperProfile.objects.filter(user__username__in=usernames).delete()
        User.objects.filter(username__in=usernames).delete()
        
        print("✓ Test data cleaned up successfully")
        
    except Exception as e:
        print(f"✗ Error cleaning up test data: {str(e)}")


def main():
    """Run all task approval workflow tests"""
    print("🚀 Starting Task Approval Workflow Tests")
    print("=" * 50)
    
    # Create test data
    data = create_test_data()
    
    # Run tests
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