#!/usr/bin/env python
"""
Simple test script for dynamic team hiring functionality.
This version creates a mock DeveloperProfile to avoid database issues.
"""

import os
import sys
import django
from decimal import Decimal
from datetime import timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from projects.models import (
    Project, Task, TeamInvitation, TaskAssignment, 
    DynamicPricing, ResourceAllocation
)
from projects.team_hiring_service import TeamHiringService

User = get_user_model()


class MockDeveloperProfile:
    """Mock developer profile for testing"""
    
    def __init__(self, user, skills=None, experience_level='mid', hourly_rate=65.00, 
                 availability_status='available', reputation_score=4.5, projects_completed=5):
        self.user = user
        self.skills = skills or ['Python', 'Django']
        self.experience_level = experience_level
        self.hourly_rate = Decimal(str(hourly_rate))
        self.availability_status = availability_status
        self.reputation_score = reputation_score
        self.projects_completed = projects_completed
        self.github_analysis = {}
        self.skill_embeddings = []
        self.bio = f"Experienced {experience_level} developer"
        self.location = "Remote"
        self.timezone = "UTC"
        self.total_earnings = Decimal('0.00')


def test_dynamic_pricing():
    """Test dynamic pricing calculation"""
    print("\n=== Testing Dynamic Pricing Calculation ===")
    
    # Create test user and project
    client_user = User.objects.create_user(
        username='testclient_pricing',
        email='client_pricing@test.com',
        user_type='client'
    )
    
    project = Project.objects.create(
        client=client_user,
        title='Test Project for Pricing',
        description='Test project for pricing calculation',
        status='team_assembly',
        budget_estimate=Decimal('5000.00'),
        timeline_estimate=timedelta(days=30),
        required_skills=['Python', 'Django'],
        ai_analysis={'complexity': 'moderate'}
    )
    
    # Create test tasks with different complexities
    tasks = [
        Task.objects.create(
            project=project,
            title='Simple Task',
            description='A simple task',
            required_skills=['Python'],
            estimated_hours=10,
            priority=1,
            status='pending'
        ),
        Task.objects.create(
            project=project,
            title='Complex Task',
            description='A complex task with multiple skills',
            required_skills=['Python', 'Django', 'React', 'AWS'],
            estimated_hours=80,
            priority=4,
            status='pending'
        ),
        Task.objects.create(
            project=project,
            title='AI Task',
            description='An AI/ML task',
            required_skills=['Python', 'Machine Learning', 'AI'],
            estimated_hours=50,
            priority=3,
            status='pending'
        )
    ]
    
    # Test pricing calculation for each task
    for task in tasks:
        try:
            pricing = TeamHiringService._calculate_dynamic_pricing(task)
            
            print(f"\nTask: {task.title}")
            print(f"  Required Skills: {task.required_skills}")
            print(f"  Estimated Hours: {task.estimated_hours}")
            print(f"  Priority: {task.priority}")
            print(f"  Complexity Level: {pricing.complexity_level}")
            print(f"  Base Rate: ${pricing.base_rate}")
            print(f"  Calculated Rate: ${pricing.calculated_rate}")
            print(f"  Rate Range: ${pricing.min_rate} - ${pricing.max_rate}")
            print(f"  Skill Premium: ${pricing.skill_premium}")
            print(f"  Complexity Multiplier: {pricing.complexity_multiplier}")
            
            # Verify pricing is reasonable
            assert pricing.calculated_rate > 0, "Calculated rate should be positive"
            assert pricing.min_rate <= pricing.calculated_rate <= pricing.max_rate, "Rate should be within bounds"
            assert pricing.complexity_level in ['simple', 'moderate', 'complex', 'expert'], "Valid complexity level"
            
            print(f"  ✅ Pricing calculation successful")
            
        except Exception as e:
            print(f"  ❌ Error calculating pricing: {str(e)}")
            raise
    
    print(f"\n✅ Dynamic pricing tests completed successfully")


def test_invitation_workflow():
    """Test invitation creation and response workflow"""
    print("\n=== Testing Invitation Workflow ===")
    
    # Create test users
    client_user = User.objects.create_user(
        username='testclient_invitation',
        email='client_invitation@test.com',
        user_type='client'
    )
    
    developer_user = User.objects.create_user(
        username='testdev_invitation',
        email='dev_invitation@test.com',
        user_type='freelancer'
    )
    
    # Mock developer profile
    developer_user.developer_profile = MockDeveloperProfile(
        user=developer_user,
        skills=['Python', 'Django'],
        experience_level='mid',
        hourly_rate=75.00
    )
    
    # Create test project and task
    project = Project.objects.create(
        client=client_user,
        title='Test Project for Invitations',
        description='Test project for invitation workflow',
        status='team_assembly',
        budget_estimate=Decimal('3000.00'),
        timeline_estimate=timedelta(days=20),
        required_skills=['Python', 'Django']
    )
    
    task = Task.objects.create(
        project=project,
        title='Backend Development',
        description='Develop backend API',
        required_skills=['Python', 'Django'],
        estimated_hours=40,
        priority=2,
        status='pending'
    )
    
    # Create pricing for the task
    pricing = DynamicPricing.objects.create(
        task=task,
        base_rate=Decimal('70.00'),
        complexity_level='moderate',
        complexity_multiplier=1.2,
        calculated_rate=Decimal('84.00'),
        min_rate=Decimal('67.20'),
        max_rate=Decimal('109.20'),
        skill_premium=Decimal('10.00'),
        rare_skills_bonus=Decimal('0.00'),
        demand_multiplier=1.0,
        urgency_multiplier=1.1
    )
    
    print(f"Created pricing: ${pricing.calculated_rate}/hr")
    
    # Create invitation
    invitation = TeamInvitation.objects.create(
        task=task,
        developer=developer_user,
        match_score=0.85,
        offered_rate=Decimal('80.00'),
        estimated_hours=40,
        estimated_completion_date=timezone.now() + timedelta(days=10),
        expires_at=timezone.now() + timedelta(hours=72),
        invitation_rank=1
    )
    
    print(f"Created invitation: {invitation}")
    print(f"  Offered Rate: ${invitation.offered_rate}/hr")
    print(f"  Match Score: {invitation.match_score}")
    print(f"  Status: {invitation.status}")
    
    # Test invitation acceptance
    try:
        result = TeamHiringService.respond_to_invitation(
            invitation=invitation,
            action='accept'
        )
        
        print(f"Acceptance result: {result}")
        
        # Verify invitation was accepted
        invitation.refresh_from_db()
        assert invitation.status == 'accepted', f"Expected 'accepted', got '{invitation.status}'"
        assert invitation.responded_at is not None, "Response timestamp should be set"
        
        # Verify task assignment was created
        assignment = TaskAssignment.objects.filter(invitation=invitation).first()
        assert assignment is not None, "Task assignment should be created"
        assert assignment.developer == developer_user, "Assignment should be to correct developer"
        assert assignment.agreed_rate == invitation.offered_rate, "Agreed rate should match offered rate"
        
        print(f"Task assignment created: {assignment}")
        print(f"  Developer: {assignment.developer.username}")
        print(f"  Agreed Rate: ${assignment.agreed_rate}/hr")
        print(f"  Status: {assignment.status}")
        
        # Verify task was updated
        task.refresh_from_db()
        assert task.assigned_developer == developer_user, "Task should be assigned to developer"
        assert task.status == 'in_progress', f"Task status should be 'in_progress', got '{task.status}'"
        
        print(f"✅ Invitation acceptance workflow successful")
        
    except Exception as e:
        print(f"❌ Error in invitation workflow: {str(e)}")
        raise


def test_resource_allocation():
    """Test resource allocation management"""
    print("\n=== Testing Resource Allocation ===")
    
    # Create test user and project
    client_user = User.objects.create_user(
        username='testclient_resource',
        email='client_resource@test.com',
        user_type='client'
    )
    
    project = Project.objects.create(
        client=client_user,
        title='Test Project for Resources',
        description='Test project for resource allocation',
        status='team_assembly',
        budget_estimate=Decimal('10000.00'),
        timeline_estimate=timedelta(days=60),
        required_skills=['Python', 'React']
    )
    
    # Initialize resource allocation
    resource_allocation = TeamHiringService._initialize_resource_allocation(project)
    
    print(f"Initial resource allocation:")
    print(f"  Total Budget: ${resource_allocation.total_budget}")
    print(f"  Allocated Budget: ${resource_allocation.allocated_budget}")
    print(f"  Remaining Budget: ${resource_allocation.remaining_budget}")
    print(f"  Team Members: {resource_allocation.total_team_members}")
    
    # Verify initial values
    assert resource_allocation.project == project, "Resource allocation should be linked to project"
    assert resource_allocation.total_budget == project.budget_estimate, "Total budget should match project budget"
    assert resource_allocation.allocated_budget == Decimal('0'), "Initial allocated budget should be 0"
    
    # Create some tasks and assignments to test updates
    task1 = Task.objects.create(
        project=project,
        title='Frontend Task',
        description='React frontend development',
        required_skills=['React', 'JavaScript'],
        estimated_hours=30,
        priority=2,
        status='pending'
    )
    
    task2 = Task.objects.create(
        project=project,
        title='Backend Task',
        description='Python backend development',
        required_skills=['Python', 'Django'],
        estimated_hours=40,
        priority=2,
        status='pending'
    )
    
    # Create developer and assignment for task1
    developer1 = User.objects.create_user(
        username='testdev_resource1',
        email='dev_resource1@test.com',
        user_type='freelancer'
    )
    
    invitation1 = TeamInvitation.objects.create(
        task=task1,
        developer=developer1,
        match_score=0.8,
        offered_rate=Decimal('70.00'),
        estimated_hours=30,
        estimated_completion_date=timezone.now() + timedelta(days=8),
        expires_at=timezone.now() + timedelta(hours=72),
        invitation_rank=1,
        status='accepted'
    )
    
    assignment1 = TaskAssignment.objects.create(
        task=task1,
        developer=developer1,
        invitation=invitation1,
        agreed_rate=Decimal('70.00'),
        agreed_hours=30,
        start_date=timezone.now(),
        expected_completion_date=timezone.now() + timedelta(days=8),
        allocated_budget=Decimal('2100.00')  # 70 * 30
    )
    
    # Update task1
    task1.assigned_developer = developer1
    task1.status = 'in_progress'
    task1.save()
    
    # Update resource allocation
    TeamHiringService._update_resource_allocation(resource_allocation)
    
    print(f"\nUpdated resource allocation:")
    print(f"  Total Team Members: {resource_allocation.total_team_members}")
    print(f"  Active Assignments: {resource_allocation.active_assignments}")
    print(f"  Allocated Budget: ${resource_allocation.allocated_budget}")
    print(f"  Remaining Budget: ${resource_allocation.remaining_budget}")
    print(f"  Tasks In Progress: {resource_allocation.tasks_in_progress}")
    print(f"  Tasks Pending: {resource_allocation.tasks_pending}")
    print(f"  Overall Progress: {resource_allocation.overall_progress_percentage}%")
    
    # Verify updates
    assert resource_allocation.total_team_members == 1, f"Expected 1 team member, got {resource_allocation.total_team_members}"
    assert resource_allocation.active_assignments == 1, f"Expected 1 active assignment, got {resource_allocation.active_assignments}"
    assert resource_allocation.allocated_budget == Decimal('2100.00'), f"Expected $2100 allocated, got ${resource_allocation.allocated_budget}"
    assert resource_allocation.remaining_budget == Decimal('7900.00'), f"Expected $7900 remaining, got ${resource_allocation.remaining_budget}"
    assert resource_allocation.tasks_in_progress == 1, f"Expected 1 task in progress, got {resource_allocation.tasks_in_progress}"
    assert resource_allocation.tasks_pending == 1, f"Expected 1 task pending, got {resource_allocation.tasks_pending}"
    
    print(f"✅ Resource allocation tests successful")


def run_simple_tests():
    """Run simplified team hiring tests"""
    print("Starting Simple Team Hiring Tests...")
    print("=" * 50)
    
    try:
        test_dynamic_pricing()
        test_invitation_workflow()
        test_resource_allocation()
        
        print("\n" + "=" * 50)
        print("✅ All Simple Team Hiring Tests Passed!")
        print("=" * 50)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test Failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = run_simple_tests()
    sys.exit(0 if success else 1)