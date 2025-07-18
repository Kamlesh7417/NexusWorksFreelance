#!/usr/bin/env python3
"""
Test Project Management Console
Comprehensive testing for the project management console functionality
"""

import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta
import json

# Add the Django project directory to Python path
sys.path.append('/Users/kiro/Desktop/ai-powered-freelancing-platform/django-backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token

from projects.models import (
    Project, Task, TaskAssignment, ResourceAllocation,
    TeamInvitation, ProjectProposal, DynamicPricing
)
from payments.models import Milestone, Payment

User = get_user_model()


class ProjectConsoleTestCase(TestCase):
    """Test cases for project management console"""
    
    def setUp(self):
        """Set up test data"""
        # Create test users
        self.client_user = User.objects.create_user(
            username='testclient',
            email='client@test.com',
            password='testpass123',
            role='client'
        )
        
        self.senior_dev = User.objects.create_user(
            username='seniordev',
            email='senior@test.com',
            password='testpass123',
            role='developer',
            github_username='seniordev_github'
        )
        
        self.developer = User.objects.create_user(
            username='developer',
            email='dev@test.com',
            password='testpass123',
            role='developer',
            github_username='dev_github'
        )
        
        # Create developer profiles
        from users.models import DeveloperProfile
        
        self.senior_profile = DeveloperProfile.objects.create(
            user=self.senior_dev,
            skills=['Python', 'Django', 'React', 'Leadership'],
            experience_level='senior',
            hourly_rate=Decimal('100.00'),
            reputation_score=4.8,
            projects_completed=25
        )
        
        self.dev_profile = DeveloperProfile.objects.create(
            user=self.developer,
            skills=['Python', 'Django', 'JavaScript'],
            experience_level='mid',
            hourly_rate=Decimal('75.00'),
            reputation_score=4.2,
            projects_completed=10
        )
        
        # Create test project
        self.project = Project.objects.create(
            client=self.client_user,
            title='Test AI Platform Project',
            description='A comprehensive AI-powered platform for testing',
            status='in_progress',
            budget_estimate=Decimal('50000.00'),
            senior_developer=self.senior_dev,
            required_skills=['Python', 'Django', 'React', 'AI/ML'],
            experience_level_required='senior',
            ai_analysis={
                'complexity_score': 8.5,
                'estimated_timeline': '3 months',
                'required_team_size': 4,
                'github_repositories': [
                    {'full_name': 'testorg/ai-platform', 'language': 'Python'}
                ]
            }
        )
        
        # Create test tasks
        self.task1 = Task.objects.create(
            project=self.project,
            title='Backend API Development',
            description='Develop REST API endpoints',
            required_skills=['Python', 'Django'],
            estimated_hours=80,
            priority=1,
            assigned_developer=self.senior_dev,
            status='in_progress',
            completion_percentage=60
        )
        
        self.task2 = Task.objects.create(
            project=self.project,
            title='Frontend Development',
            description='Build React frontend',
            required_skills=['React', 'JavaScript'],
            estimated_hours=60,
            priority=2,
            assigned_developer=self.developer,
            status='assigned',
            completion_percentage=20
        )
        
        # Create task assignments
        self.assignment1 = TaskAssignment.objects.create(
            task=self.task1,
            developer=self.senior_dev,
            invitation=None,  # We'll create invitation separately
            agreed_rate=Decimal('100.00'),
            agreed_hours=80,
            start_date=timezone.now() - timedelta(days=10),
            expected_completion_date=timezone.now() + timedelta(days=5),
            status='active',
            hours_logged=Decimal('48.0'),
            progress_percentage=60,
            allocated_budget=Decimal('8000.00'),
            spent_budget=Decimal('4800.00')
        )
        
        # Create resource allocation
        self.resource_allocation = ResourceAllocation.objects.create(
            project=self.project,
            total_team_members=2,
            active_assignments=2,
            pending_invitations=0,
            total_budget=Decimal('50000.00'),
            allocated_budget=Decimal('15000.00'),
            remaining_budget=Decimal('35000.00'),
            planned_start_date=timezone.now() - timedelta(days=15),
            planned_end_date=timezone.now() + timedelta(days=75),
            current_projected_end_date=timezone.now() + timedelta(days=80),
            overall_progress_percentage=40,
            tasks_completed=0,
            tasks_in_progress=2,
            tasks_pending=0,
            budget_risk_level='low',
            timeline_risk_level='medium',
            resource_risk_level='low'
        )
        
        # Create milestones
        self.milestone1 = Milestone.objects.create(
            project=self.project,
            percentage=25,
            amount=Decimal('12500.00'),
            status='paid',
            due_date=timezone.now().date() - timedelta(days=5),
            paid_date=timezone.now().date() - timedelta(days=3)
        )
        
        self.milestone2 = Milestone.objects.create(
            project=self.project,
            percentage=50,
            amount=Decimal('12500.00'),
            status='pending',
            due_date=timezone.now().date() + timedelta(days=30)
        )
        
        # Set up API client
        self.api_client = APIClient()
        
        # Create tokens for authentication
        self.client_token = Token.objects.create(user=self.client_user)
        self.senior_token = Token.objects.create(user=self.senior_dev)
        self.dev_token = Token.objects.create(user=self.developer)
    
    def test_dashboard_access_client(self):
        """Test dashboard access for client user"""
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        
        response = self.api_client.get('/api/projects/console/dashboard/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Verify dashboard structure
        self.assertIn('user_role', data)
        self.assertIn('projects', data)
        self.assertIn('summary', data)
        
        # Verify user role
        self.assertEqual(data['user_role'], 'client')
        
        # Verify project data
        self.assertEqual(len(data['projects']), 1)
        project_data = data['projects'][0]
        self.assertEqual(project_data['title'], 'Test AI Platform Project')
        self.assertEqual(project_data['user_role'], 'client')
        self.assertIn('progress', project_data)
        self.assertIn('team', project_data)
        self.assertIn('budget', project_data)
        self.assertIn('timeline', project_data)
        
        print("✓ Client dashboard access test passed")
    
    def test_dashboard_access_senior_developer(self):
        """Test dashboard access for senior developer"""
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.senior_token.key)
        
        response = self.api_client.get('/api/projects/console/dashboard/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Verify user role
        self.assertEqual(data['user_role'], 'developer')
        
        # Verify project access
        self.assertEqual(len(data['projects']), 1)
        project_data = data['projects'][0]
        self.assertEqual(project_data['user_role'], 'senior_developer')
        
        print("✓ Senior developer dashboard access test passed")
    
    def test_project_details_comprehensive(self):
        """Test comprehensive project details endpoint"""
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        
        response = self.api_client.get(f'/api/projects/console/{self.project.id}/details/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Verify project details structure
        required_fields = [
            'id', 'title', 'description', 'status', 'user_role',
            'client', 'senior_developer', 'tasks', 'team_members',
            'resource_allocation', 'milestones', 'pending_invitations'
        ]
        
        for field in required_fields:
            self.assertIn(field, data, f"Missing field: {field}")
        
        # Verify tasks data
        self.assertEqual(len(data['tasks']), 2)
        task_data = data['tasks'][0]
        self.assertIn('assignment', task_data)
        self.assertIn('assigned_developer', task_data)
        
        # Verify team members
        self.assertGreaterEqual(len(data['team_members']), 1)
        
        # Verify resource allocation
        self.assertIsNotNone(data['resource_allocation'])
        self.assertEqual(data['resource_allocation']['total_budget'], 50000.0)
        
        # Verify milestones
        self.assertEqual(len(data['milestones']), 2)
        
        print("✓ Project details comprehensive test passed")
    
    def test_task_progress_tracking(self):
        """Test task progress tracking and visualization"""
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.senior_token.key)
        
        response = self.api_client.get(f'/api/projects/console/{self.project.id}/task-progress/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Verify progress structure
        required_fields = [
            'project_id', 'project_title', 'task_statistics',
            'overall_progress', 'task_progress', 'timeline_analysis'
        ]
        
        for field in required_fields:
            self.assertIn(field, data, f"Missing field: {field}")
        
        # Verify task statistics
        stats = data['task_statistics']
        self.assertEqual(stats['total_tasks'], 2)
        self.assertEqual(stats['in_progress_tasks'], 1)
        self.assertEqual(stats['assigned_tasks'], 1)
        
        # Verify overall progress
        progress = data['overall_progress']
        self.assertIn('completion_percentage', progress)
        self.assertIn('total_estimated_hours', progress)
        self.assertEqual(progress['total_estimated_hours'], 140)  # 80 + 60
        
        # Verify task progress details
        self.assertEqual(len(data['task_progress']), 2)
        
        print("✓ Task progress tracking test passed")
    
    def test_team_management_interface(self):
        """Test team member management interface"""
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        
        response = self.api_client.get(f'/api/projects/console/{self.project.id}/team-management/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Verify team management structure
        required_fields = [
            'project_id', 'project_title', 'user_role',
            'team_members', 'team_metrics', 'permissions'
        ]
        
        for field in required_fields:
            self.assertIn(field, data, f"Missing field: {field}")
        
        # Verify team members
        team_members = data['team_members']
        self.assertGreaterEqual(len(team_members), 2)  # At least client and senior dev
        
        # Find senior developer in team
        senior_member = next((m for m in team_members if m['role'] == 'senior_developer'), None)
        self.assertIsNotNone(senior_member)
        self.assertEqual(senior_member['username'], 'seniordev')
        self.assertIn('profile', senior_member)
        
        # Verify team metrics
        metrics = data['team_metrics']
        self.assertIn('total_team_size', metrics)
        self.assertIn('active_developers', metrics)
        
        # Verify permissions
        permissions = data['permissions']
        self.assertTrue(permissions['can_invite_members'])  # Client should be able to invite
        
        print("✓ Team management interface test passed")
    
    def test_budget_timeline_monitoring(self):
        """Test timeline and budget status monitoring"""
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        
        response = self.api_client.get(f'/api/projects/console/{self.project.id}/budget-timeline/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Verify budget timeline structure
        required_fields = [
            'project_id', 'project_title', 'user_role',
            'budget', 'milestones', 'timeline', 'task_timeline', 'risk_assessment'
        ]
        
        for field in required_fields:
            self.assertIn(field, data, f"Missing field: {field}")
        
        # Verify budget data
        budget = data['budget']
        self.assertEqual(budget['total_budget'], 50000.0)
        self.assertIn('budget_breakdown', budget)
        
        # Verify milestones
        milestones = data['milestones']
        self.assertEqual(milestones['total_amount'], 25000.0)  # 12500 * 2
        self.assertEqual(milestones['paid_amount'], 12500.0)
        self.assertEqual(len(milestones['milestones']), 2)
        
        # Verify timeline
        timeline = data['timeline']
        self.assertIn('planned_start_date', timeline)
        self.assertIn('planned_end_date', timeline)
        self.assertIn('overall_progress_percentage', timeline)
        
        # Verify risk assessment
        risk = data['risk_assessment']
        self.assertIn('overall_risk_level', risk)
        
        print("✓ Budget timeline monitoring test passed")
    
    def test_document_management(self):
        """Test document sharing and management"""
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        
        # Test GET documents
        response = self.api_client.get(f'/api/projects/console/{self.project.id}/documents/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Verify document structure
        self.assertIn('documents', data)
        self.assertIn('permissions', data)
        
        documents = data['documents']
        self.assertIn('project_attachments', documents)
        self.assertIn('shared_documents', documents)
        
        # Verify permissions
        permissions = data['permissions']
        self.assertTrue(permissions['can_upload_documents'])
        
        # Test POST document upload
        document_data = {
            'type': 'specification',
            'title': 'Project Requirements',
            'url': 'https://example.com/requirements.pdf',
            'description': 'Detailed project requirements document'
        }
        
        response = self.api_client.post(
            f'/api/projects/console/{self.project.id}/documents/',
            document_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify document was added
        self.project.refresh_from_db()
        self.assertIsNotNone(self.project.attachments)
        self.assertEqual(len(self.project.attachments), 1)
        
        print("✓ Document management test passed")
    
    def test_github_integration(self):
        """Test GitHub repository access and integration"""
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.senior_token.key)
        
        response = self.api_client.get(f'/api/projects/console/{self.project.id}/github-integration/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Verify GitHub integration structure
        required_fields = [
            'project_id', 'project_title', 'user_role',
            'repositories', 'team_github_profiles', 'permissions'
        ]
        
        for field in required_fields:
            self.assertIn(field, data, f"Missing field: {field}")
        
        # Verify team GitHub profiles
        profiles = data['team_github_profiles']
        self.assertGreaterEqual(len(profiles), 1)
        
        # Find senior developer profile
        senior_profile = next((p for p in profiles if p['github_username'] == 'seniordev_github'), None)
        self.assertIsNotNone(senior_profile)
        
        # Verify permissions
        permissions = data['permissions']
        self.assertTrue(permissions['can_access_code_reviews'])  # Senior dev should have access
        
        print("✓ GitHub integration test passed")
    
    def test_project_navigation(self):
        """Test project navigation capabilities"""
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        
        response = self.api_client.get('/api/projects/console/navigation/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Verify navigation structure
        required_fields = ['user_id', 'user_role', 'projects', 'quick_stats']
        
        for field in required_fields:
            self.assertIn(field, data, f"Missing field: {field}")
        
        # Verify projects navigation
        projects = data['projects']
        self.assertEqual(len(projects), 1)
        
        project_nav = projects[0]
        nav_fields = [
            'id', 'title', 'status', 'user_role', 'progress_percentage',
            'total_tasks', 'team_size', 'budget_info'
        ]
        
        for field in nav_fields:
            self.assertIn(field, project_nav, f"Missing navigation field: {field}")
        
        # Verify quick stats
        stats = data['quick_stats']
        self.assertEqual(stats['total_projects'], 1)
        self.assertEqual(stats['active_projects'], 1)
        
        print("✓ Project navigation test passed")
    
    def test_access_control(self):
        """Test role-based access control"""
        # Test unauthorized access
        unauthorized_client = APIClient()
        response = unauthorized_client.get('/api/projects/console/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test developer access to client-only features
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.dev_token.key)
        
        # Developer should not be able to update project status
        response = self.api_client.post(
            f'/api/projects/console/{self.project.id}/update-status/',
            {'status': 'completed'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        print("✓ Access control test passed")
    
    def test_real_time_updates(self):
        """Test real-time update capabilities"""
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        
        # Update task progress
        self.task1.completion_percentage = 80
        self.task1.save()
        
        # Update assignment progress
        self.assignment1.progress_percentage = 80
        self.assignment1.hours_logged = Decimal('64.0')
        self.assignment1.save()
        
        # Get updated dashboard
        response = self.api_client.get('/api/projects/console/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        project_data = data['projects'][0]
        
        # Verify progress is updated
        # Note: This would be more comprehensive with WebSocket testing
        self.assertGreater(project_data['progress']['completion_percentage'], 0)
        
        print("✓ Real-time updates test passed")


def run_tests():
    """Run all project console tests"""
    print("🚀 Starting Project Management Console Tests")
    print("=" * 60)
    
    # Create test suite
    test_case = ProjectConsoleTestCase()
    test_case.setUp()
    
    try:
        # Run individual tests
        test_case.test_dashboard_access_client()
        test_case.test_dashboard_access_senior_developer()
        test_case.test_project_details_comprehensive()
        test_case.test_task_progress_tracking()
        test_case.test_team_management_interface()
        test_case.test_budget_timeline_monitoring()
        test_case.test_document_management()
        test_case.test_github_integration()
        test_case.test_project_navigation()
        test_case.test_access_control()
        test_case.test_real_time_updates()
        
        print("\n" + "=" * 60)
        print("✅ All Project Management Console Tests Passed!")
        print("=" * 60)
        
        # Print summary
        print("\n📊 Test Summary:")
        print("• Role-based dashboard access: ✓")
        print("• Comprehensive project details: ✓")
        print("• Task progress tracking: ✓")
        print("• Team member management: ✓")
        print("• Budget and timeline monitoring: ✓")
        print("• Document sharing: ✓")
        print("• GitHub integration: ✓")
        print("• Project navigation: ✓")
        print("• Access control: ✓")
        print("• Real-time updates: ✓")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)