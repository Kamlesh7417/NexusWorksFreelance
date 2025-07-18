#!/usr/bin/env python
"""
Test script for dynamic team hiring and task assignment functionality.

This script tests:
1. Automatic team member invitation system using AI matching
2. Dynamic pricing calculation based on task complexity and skills
3. Task assignment workflow with acceptance/decline handling
4. Automatic fallback to next best match for declined invitations
5. Timeline and resource allocation management
"""

import os
import sys
import django
from decimal import Decimal
from datetime import timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from projects.models import (
    Project, Task, TeamInvitation, TaskAssignment, 
    DynamicPricing, ResourceAllocation
)
from projects.team_hiring_service import TeamHiringService
from users.models import DeveloperProfile

User = get_user_model()


class TeamHiringTestCase(TestCase):
    """Test case for team hiring functionality"""
    
    def setUp(self):
        """Set up test data"""
        # Create test users
        self.client_user = User.objects.create_user(
            username='testclient',
            email='client@test.com',
            role='client'
        )
        
        self.senior_dev = User.objects.create_user(
            username='seniordev',
            email='senior@test.com',
            role='developer'
        )
        
        self.developer1 = User.objects.create_user(
            username='dev1',
            email='dev1@test.com',
            role='developer'
        )
        
        self.developer2 = User.objects.create_user(
            username='dev2',
            email='dev2@test.com',
            role='developer'
        )
        
        self.developer3 = User.objects.create_user(
            username='dev3',
            email='dev3@test.com',
            role='developer'
        )
        
        # Create developer profiles
        DeveloperProfile.objects.create(
            user=self.senior_dev,
            skills=['Python', 'Django', 'React', 'AWS'],
            experience_level='senior',
            hourly_rate=Decimal('85.00'),
            availability_status='available',
            reputation_score=4.8,
            projects_completed=15
        )
        
        DeveloperProfile.objects.create(
            user=self.developer1,
            skills=['Python', 'Django', 'PostgreSQL'],
            experience_level='mid',
            hourly_rate=Decimal('65.00'),
            availability_status='available',
            reputation_score=4.5,
            projects_completed=8
        )
        
        DeveloperProfile.objects.create(
            user=self.developer2,
            skills=['React', 'JavaScript', 'Node.js'],
            experience_level='mid',
            hourly_rate=Decimal('70.00'),
            availability_status='available',
            reputation_score=4.3,
            projects_completed=6
        )
        
        DeveloperProfile.objects.create(
            user=self.developer3,
            skills=['Python', 'Machine Learning', 'AI'],
            experience_level='senior',
            hourly_rate=Decimal('95.00'),
            availability_status='available',
            reputation_score=4.9,
            projects_completed=12
        )
        
        # Create test project
        self.project = Project.objects.create(
            client=self.client_user,
            title='AI-Powered Web Application',
            description='Build a web application with AI features',
            status='team_assembly',
            budget_estimate=Decimal('10000.00'),
            timeline_estimate=timedelta(days=60),
            senior_developer=self.senior_dev,
            required_skills=['Python', 'Django', 'React', 'AI'],
            ai_analysis={
                'complexity': 'complex',
                'required_skills': ['Python', 'Django', 'React', 'AI'],
                'senior_developer_required': True
            }
        )
        
        # Create test tasks
        self.task1 = Task.objects.create(
            project=self.project,
            title='Backend API Development',
            description='Develop REST API using Django',
            required_skills=['Python', 'Django', 'PostgreSQL'],
            estimated_hours=40,
            priority=2,
            status='pending'
        )
        
        self.task2 = Task.objects.create(
            project=self.project,
            title='Frontend Development',
            description='Build React frontend',
            required_skills=['React', 'JavaScript'],
            estimated_hours=35,
            priority=2,
            status='pending'
        )
        
        self.task3 = Task.objects.create(
            project=self.project,
            title='AI Integration',
            description='Integrate machine learning models',
            required_skills=['Python', 'Machine Learning', 'AI'],
            estimated_hours=50,
            priority=3,
            status='pending'
        )
    
    def test_dynamic_pricing_calculation(self):
        """Test dynamic pricing calculation for tasks"""
        print("\n=== Testing Dynamic Pricing Calculation ===")
        
        # Test pricing for different tasks
        for task in [self.task1, self.task2, self.task3]:
            pricing = TeamHiringService._calculate_dynamic_pricing(task)
            
            print(f"\nTask: {task.title}")
            print(f"Complexity Level: {pricing.complexity_level}")
            print(f"Base Rate: ${pricing.base_rate}")
            print(f"Calculated Rate: ${pricing.calculated_rate}")
            print(f"Min Rate: ${pricing.min_rate}")
            print(f"Max Rate: ${pricing.max_rate}")
            print(f"Skill Premium: ${pricing.skill_premium}")
            print(f"Rare Skills Bonus: ${pricing.rare_skills_bonus}")
            
            # Verify pricing is reasonable
            self.assertGreater(pricing.calculated_rate, 0)
            self.assertLessEqual(pricing.min_rate, pricing.calculated_rate)
            self.assertGreaterEqual(pricing.max_rate, pricing.calculated_rate)
            self.assertIn(pricing.complexity_level, ['simple', 'moderate', 'complex', 'expert'])
    
    def test_team_hiring_initiation(self):
        """Test initiating team hiring for a project"""
        print("\n=== Testing Team Hiring Initiation ===")
        
        # Mock the hybrid RAG service to return test matches
        def mock_find_matching_developers(task_data, limit, include_analysis=True):
            # Return mock matches based on task requirements
            if 'Django' in task_data.get('required_skills', []):
                return [
                    {
                        'developer_id': str(self.developer1.id),
                        'final_score': 0.85,
                        'vector_score': 0.8,
                        'graph_score': 0.9,
                        'availability_score': 1.0
                    }
                ]
            elif 'React' in task_data.get('required_skills', []):
                return [
                    {
                        'developer_id': str(self.developer2.id),
                        'final_score': 0.82,
                        'vector_score': 0.85,
                        'graph_score': 0.8,
                        'availability_score': 1.0
                    }
                ]
            elif 'AI' in task_data.get('required_skills', []):
                return [
                    {
                        'developer_id': str(self.developer3.id),
                        'final_score': 0.95,
                        'vector_score': 0.95,
                        'graph_score': 0.95,
                        'availability_score': 1.0
                    }
                ]
            return []
        
        # Patch the hybrid RAG service
        import projects.team_hiring_service
        original_method = projects.team_hiring_service.hybrid_rag_service.find_matching_developers
        projects.team_hiring_service.hybrid_rag_service.find_matching_developers = mock_find_matching_developers
        
        try:
            # Initiate team hiring
            result = TeamHiringService.initiate_team_hiring(
                project=self.project,
                max_invitations_per_task=2,
                invitation_expiry_hours=72
            )
            
            print(f"Hiring Results: {result}")
            
            # Verify results
            self.assertEqual(result['tasks_processed'], 3)
            self.assertGreater(result['invitations_sent'], 0)
            self.assertEqual(result['pricing_calculated'], 3)
            self.assertEqual(len(result['errors']), 0)
            
            # Verify invitations were created
            invitations = TeamInvitation.objects.filter(task__project=self.project)
            self.assertGreater(invitations.count(), 0)
            
            print(f"Total invitations created: {invitations.count()}")
            
            # Verify pricing was calculated
            pricing_records = DynamicPricing.objects.filter(task__project=self.project)
            self.assertEqual(pricing_records.count(), 3)
            
            # Verify resource allocation was created
            resource_allocation = ResourceAllocation.objects.filter(project=self.project).first()
            self.assertIsNotNone(resource_allocation)
            
            print(f"Resource allocation created: {resource_allocation}")
            
        finally:
            # Restore original method
            projects.team_hiring_service.hybrid_rag_service.find_matching_developers = original_method
    
    def test_invitation_acceptance_workflow(self):
        """Test invitation acceptance and task assignment creation"""
        print("\n=== Testing Invitation Acceptance Workflow ===")
        
        # Create a test invitation
        pricing = DynamicPricing.objects.create(
            task=self.task1,
            base_rate=Decimal('65.00'),
            complexity_level='moderate',
            complexity_multiplier=1.2,
            calculated_rate=Decimal('78.00'),
            min_rate=Decimal('62.40'),
            max_rate=Decimal('101.40')
        )
        
        invitation = TeamInvitation.objects.create(
            task=self.task1,
            developer=self.developer1,
            match_score=0.85,
            offered_rate=Decimal('75.00'),
            estimated_hours=40,
            estimated_completion_date=timezone.now() + timedelta(days=10),
            expires_at=timezone.now() + timedelta(hours=72),
            invitation_rank=1
        )
        
        print(f"Created invitation: {invitation}")
        
        # Test acceptance
        result = TeamHiringService.respond_to_invitation(
            invitation=invitation,
            action='accept'
        )
        
        print(f"Acceptance result: {result}")
        
        # Verify invitation status
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, 'accepted')
        self.assertIsNotNone(invitation.responded_at)
        
        # Verify task assignment was created
        assignment = TaskAssignment.objects.filter(invitation=invitation).first()
        self.assertIsNotNone(assignment)
        self.assertEqual(assignment.developer, self.developer1)
        self.assertEqual(assignment.agreed_rate, invitation.offered_rate)
        
        print(f"Task assignment created: {assignment}")
        
        # Verify task was updated
        self.task1.refresh_from_db()
        self.assertEqual(self.task1.assigned_developer, self.developer1)
        self.assertEqual(self.task1.status, 'in_progress')
    
    def test_invitation_decline_and_fallback(self):
        """Test invitation decline and automatic fallback"""
        print("\n=== Testing Invitation Decline and Fallback ===")
        
        # Create test invitations
        pricing = DynamicPricing.objects.create(
            task=self.task2,
            base_rate=Decimal('70.00'),
            complexity_level='moderate',
            complexity_multiplier=1.2,
            calculated_rate=Decimal('84.00'),
            min_rate=Decimal('67.20'),
            max_rate=Decimal('109.20')
        )
        
        invitation = TeamInvitation.objects.create(
            task=self.task2,
            developer=self.developer2,
            match_score=0.82,
            offered_rate=Decimal('80.00'),
            estimated_hours=35,
            estimated_completion_date=timezone.now() + timedelta(days=8),
            expires_at=timezone.now() + timedelta(hours=72),
            invitation_rank=1
        )
        
        print(f"Created invitation: {invitation}")
        
        # Mock fallback matching
        def mock_find_task_matches(task, limit):
            return [
                {
                    'developer': self.developer1,
                    'profile': self.developer1.developer_profile,
                    'final_score': 0.75
                }
            ]
        
        # Patch the method
        original_method = TeamHiringService._find_task_matches
        TeamHiringService._find_task_matches = mock_find_task_matches
        
        try:
            # Test decline
            result = TeamHiringService.respond_to_invitation(
                invitation=invitation,
                action='decline',
                decline_reason='Not interested in this project'
            )
            
            print(f"Decline result: {result}")
            
            # Verify invitation status
            invitation.refresh_from_db()
            self.assertEqual(invitation.status, 'declined')
            self.assertEqual(invitation.decline_reason, 'Not interested in this project')
            
            # Verify fallback was triggered
            self.assertTrue(result['fallback_triggered'])
            
            # Check if fallback invitation was created
            fallback_invitations = TeamInvitation.objects.filter(
                task=self.task2,
                is_fallback=True
            )
            
            if fallback_invitations.exists():
                fallback_invitation = fallback_invitations.first()
                print(f"Fallback invitation created: {fallback_invitation}")
                self.assertTrue(fallback_invitation.is_fallback)
                self.assertEqual(fallback_invitation.invitation_rank, 999)
            
        finally:
            # Restore original method
            TeamHiringService._find_task_matches = original_method
    
    def test_counter_offer_handling(self):
        """Test counter offer handling"""
        print("\n=== Testing Counter Offer Handling ===")
        
        # Create test invitation
        invitation = TeamInvitation.objects.create(
            task=self.task3,
            developer=self.developer3,
            match_score=0.95,
            offered_rate=Decimal('90.00'),
            estimated_hours=50,
            estimated_completion_date=timezone.now() + timedelta(days=12),
            expires_at=timezone.now() + timedelta(hours=72),
            invitation_rank=1
        )
        
        print(f"Created invitation: {invitation}")
        
        # Test counter offer
        result = TeamHiringService.respond_to_invitation(
            invitation=invitation,
            action='counter_offer',
            counter_offer_rate=Decimal('105.00')
        )
        
        print(f"Counter offer result: {result}")
        
        # Verify invitation status
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, 'pending')  # Still pending for negotiation
        self.assertEqual(invitation.counter_offer_rate, Decimal('105.00'))
        
        # Verify result
        self.assertEqual(result['status'], 'counter_offer')
        self.assertEqual(result['counter_rate'], 105.00)
    
    def test_resource_allocation_management(self):
        """Test resource allocation and timeline management"""
        print("\n=== Testing Resource Allocation Management ===")
        
        # Create resource allocation
        resource_allocation = TeamHiringService._initialize_resource_allocation(self.project)
        
        print(f"Initial resource allocation: {resource_allocation}")
        
        # Verify initial values
        self.assertEqual(resource_allocation.project, self.project)
        self.assertEqual(resource_allocation.total_budget, self.project.budget_estimate)
        
        # Create some assignments to test updates
        pricing = DynamicPricing.objects.create(
            task=self.task1,
            base_rate=Decimal('65.00'),
            complexity_level='moderate',
            complexity_multiplier=1.2,
            calculated_rate=Decimal('78.00'),
            min_rate=Decimal('62.40'),
            max_rate=Decimal('101.40')
        )
        
        invitation = TeamInvitation.objects.create(
            task=self.task1,
            developer=self.developer1,
            match_score=0.85,
            offered_rate=Decimal('75.00'),
            estimated_hours=40,
            estimated_completion_date=timezone.now() + timedelta(days=10),
            expires_at=timezone.now() + timedelta(hours=72),
            invitation_rank=1,
            status='accepted'
        )
        
        assignment = TaskAssignment.objects.create(
            task=self.task1,
            developer=self.developer1,
            invitation=invitation,
            agreed_rate=Decimal('75.00'),
            agreed_hours=40,
            start_date=timezone.now(),
            expected_completion_date=timezone.now() + timedelta(days=10),
            allocated_budget=Decimal('3000.00')
        )
        
        # Update task
        self.task1.assigned_developer = self.developer1
        self.task1.status = 'in_progress'
        self.task1.save()
        
        # Update resource allocation
        TeamHiringService._update_resource_allocation(resource_allocation)
        
        print(f"Updated resource allocation: {resource_allocation}")
        
        # Verify updates
        self.assertEqual(resource_allocation.total_team_members, 1)
        self.assertEqual(resource_allocation.active_assignments, 1)
        self.assertEqual(resource_allocation.allocated_budget, Decimal('3000.00'))
        self.assertEqual(resource_allocation.remaining_budget, Decimal('7000.00'))
        self.assertEqual(resource_allocation.tasks_in_progress, 1)
        self.assertEqual(resource_allocation.tasks_pending, 2)  # task2 and task3
    
    def test_assignment_progress_tracking(self):
        """Test task assignment progress tracking"""
        print("\n=== Testing Assignment Progress Tracking ===")
        
        # Create assignment
        invitation = TeamInvitation.objects.create(
            task=self.task1,
            developer=self.developer1,
            match_score=0.85,
            offered_rate=Decimal('75.00'),
            estimated_hours=40,
            estimated_completion_date=timezone.now() + timedelta(days=10),
            expires_at=timezone.now() + timedelta(hours=72),
            invitation_rank=1,
            status='accepted'
        )
        
        assignment = TaskAssignment.objects.create(
            task=self.task1,
            developer=self.developer1,
            invitation=invitation,
            agreed_rate=Decimal('75.00'),
            agreed_hours=40,
            start_date=timezone.now(),
            expected_completion_date=timezone.now() + timedelta(days=10),
            allocated_budget=Decimal('3000.00'),
            actual_start_date=timezone.now()
        )
        
        print(f"Created assignment: {assignment}")
        
        # Test progress updates
        assignment.hours_logged = Decimal('20.0')
        assignment.progress_percentage = 50
        assignment.spent_budget = assignment.agreed_rate * assignment.hours_logged
        assignment.save()
        
        print(f"Updated assignment progress: {assignment.progress_percentage}%")
        print(f"Hours logged: {assignment.hours_logged}")
        print(f"Spent budget: ${assignment.spent_budget}")
        
        # Verify calculations
        expected_spent = Decimal('75.00') * Decimal('20.0')
        self.assertEqual(assignment.spent_budget, expected_spent)
        self.assertEqual(assignment.progress_percentage, 50)
        
        # Test completion
        assignment.status = 'completed'
        assignment.actual_completion_date = timezone.now()
        assignment.progress_percentage = 100
        assignment.save()
        
        print(f"Assignment completed: {assignment.status}")
        self.assertEqual(assignment.status, 'completed')
        self.assertIsNotNone(assignment.actual_completion_date)


def run_tests():
    """Run all team hiring tests"""
    print("Starting Team Hiring Tests...")
    print("=" * 50)
    
    # Create test case instance
    test_case = TeamHiringTestCase()
    test_case.setUp()
    
    try:
        # Run individual tests
        test_case.test_dynamic_pricing_calculation()
        test_case.test_team_hiring_initiation()
        test_case.test_invitation_acceptance_workflow()
        test_case.test_invitation_decline_and_fallback()
        test_case.test_counter_offer_handling()
        test_case.test_resource_allocation_management()
        test_case.test_assignment_progress_tracking()
        
        print("\n" + "=" * 50)
        print("✅ All Team Hiring Tests Passed!")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ Test Failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)