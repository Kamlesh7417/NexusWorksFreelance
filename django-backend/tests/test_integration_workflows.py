"""
Integration tests for complete workflows
"""
import json
from decimal import Decimal
from datetime import timedelta
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from unittest.mock import patch, MagicMock

from projects.models import Project, Task, TeamMember, ProjectMilestone
from users.models import DeveloperProfile, ClientProfile
from ai_services.models import ProjectAnalysisResult, MatchingResult
from payments.models import Payment, PaymentMethod

User = get_user_model()


class ProjectCreationWorkflowTest(APITestCase):
    """Test complete project creation workflow"""
    
    def setUp(self):
        """Set up test data"""
        self.client_user = User.objects.create_user(
            email='client@example.com',
            password='testpass123',
            role='client'
        )
        
        self.developer_user = User.objects.create_user(
            email='dev@example.com',
            password='testpass123',
            role='developer',
            github_username='testdev'
        )
        
        self.senior_dev_user = User.objects.create_user(
            email='senior@example.com',
            password='testpass123',
            role='developer',
            github_username='seniordev'
        )
        
        # Create profiles
        ClientProfile.objects.create(
            user=self.client_user,
            company_name='Test Corp',
            company_size='medium'
        )
        
        DeveloperProfile.objects.create(
            user=self.developer_user,
            skills=['Python', 'Django'],
            experience_level='mid',
            hourly_rate=Decimal('75.00')
        )
        
        DeveloperProfile.objects.create(
            user=self.senior_dev_user,
            skills=['Python', 'Django', 'React', 'Leadership'],
            experience_level='senior',
            hourly_rate=Decimal('120.00')
        )
        
        self.client_token = Token.objects.create(user=self.client_user)
        self.api_client = APIClient()
    
    @patch('ai_services.project_analysis.ProjectAnalysisService.analyze_project')
    @patch('matching.views.MatchingService.find_matches')
    def test_complete_project_workflow(self, mock_matching, mock_analysis):
        """Test complete project creation and matching workflow"""
        
        # Mock AI analysis response
        mock_analysis.return_value = {
            'complexity_score': 7.5,
            'required_skills': ['Python', 'Django', 'React'],
            'estimated_timeline': timedelta(days=30),
            'budget_range': {'min': 8000, 'max': 12000},
            'task_breakdown': [
                {'title': 'Backend API', 'hours': 40, 'skills': ['Python', 'Django']},
                {'title': 'Frontend UI', 'hours': 30, 'skills': ['React', 'JavaScript']}
            ],
            'senior_developer_required': True
        }
        
        # Mock matching response
        mock_matching.return_value = [
            {
                'developer_id': str(self.senior_dev_user.id),
                'match_score': 0.95,
                'skill_match_score': 0.9,
                'availability_score': 1.0,
                'experience_match_score': 0.95
            },
            {
                'developer_id': str(self.developer_user.id),
                'match_score': 0.8,
                'skill_match_score': 0.85,
                'availability_score': 1.0,
                'experience_match_score': 0.75
            }
        ]
        
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        
        # Step 1: Create project
        project_data = {
            'title': 'E-commerce Platform',
            'description': 'Build a modern e-commerce platform with Django backend and React frontend',
            'budget_estimate': 10000.00,
            'timeline_estimate': 30
        }
        
        response = self.api_client.post('/api/projects/', project_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        project_id = response.data['id']
        project = Project.objects.get(id=project_id)
        
        # Verify project was created
        self.assertEqual(project.title, 'E-commerce Platform')
        self.assertEqual(project.status, 'analyzing')
        
        # Step 2: AI analysis should be triggered
        # Simulate analysis completion
        ProjectAnalysisResult.objects.create(
            project=project,
            complexity_score=7.5,
            required_skills=['Python', 'Django', 'React'],
            estimated_timeline=timedelta(days=30),
            budget_range={'min': 8000, 'max': 12000},
            senior_developer_required=True
        )
        
        # Step 3: Get project analysis results
        response = self.api_client.get(f'/api/projects/{project_id}/analysis/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['complexity_score'], 7.5)
        self.assertTrue(response.data['senior_developer_required'])
        
        # Step 4: Get matching results
        response = self.api_client.get(f'/api/projects/{project_id}/matches/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
        
        # Step 5: Assign senior developer
        assign_data = {
            'senior_developer_id': str(self.senior_dev_user.id)
        }
        response = self.api_client.post(f'/api/projects/{project_id}/assign-senior/', assign_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        project.refresh_from_db()
        self.assertEqual(project.senior_developer, self.senior_dev_user)
        self.assertEqual(project.status, 'proposal_review')
    
    def test_project_proposal_workflow(self):
        """Test project proposal review and approval workflow"""
        # Create project with senior developer
        project = Project.objects.create(
            client=self.client_user,
            title='Test Project',
            description='Test description',
            budget_estimate=Decimal('5000.00'),
            timeline_estimate=timedelta(days=15),
            senior_developer=self.senior_dev_user,
            status='proposal_review'
        )
        
        # Senior developer token
        senior_token = Token.objects.create(user=self.senior_dev_user)
        
        # Step 1: Senior developer modifies proposal
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + senior_token.key)
        
        proposal_data = {
            'budget_estimate': 6000.00,
            'timeline_estimate': 20,
            'modifications': [
                {
                    'field': 'budget_estimate',
                    'old_value': '5000.00',
                    'new_value': '6000.00',
                    'justification': 'Additional complexity identified'
                }
            ]
        }
        
        response = self.api_client.post(f'/api/projects/{project.id}/modify-proposal/', proposal_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Step 2: Client approves proposal
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        
        approval_data = {'approved': True}
        response = self.api_client.post(f'/api/projects/{project.id}/approve-proposal/', approval_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        project.refresh_from_db()
        self.assertEqual(project.status, 'team_hiring')


class TeamHiringWorkflowTest(APITestCase):
    """Test team hiring and task assignment workflow"""
    
    def setUp(self):
        """Set up test data"""
        self.client_user = User.objects.create_user(
            email='client@example.com',
            password='testpass123',
            role='client'
        )
        
        self.senior_dev = User.objects.create_user(
            email='senior@example.com',
            password='testpass123',
            role='developer'
        )
        
        self.developer1 = User.objects.create_user(
            email='dev1@example.com',
            password='testpass123',
            role='developer'
        )
        
        self.developer2 = User.objects.create_user(
            email='dev2@example.com',
            password='testpass123',
            role='developer'
        )
        
        # Create profiles
        for user in [self.developer1, self.developer2]:
            DeveloperProfile.objects.create(
                user=user,
                skills=['Python', 'Django'],
                experience_level='mid',
                hourly_rate=Decimal('75.00'),
                availability_status='available'
            )
        
        self.project = Project.objects.create(
            client=self.client_user,
            title='Test Project',
            description='Test description',
            budget_estimate=Decimal('10000.00'),
            timeline_estimate=timedelta(days=30),
            senior_developer=self.senior_dev,
            status='team_hiring'
        )
        
        # Create tasks
        self.task1 = Task.objects.create(
            project=self.project,
            title='Backend Development',
            description='Develop backend API',
            required_skills=['Python', 'Django'],
            estimated_hours=40,
            priority=1
        )
        
        self.task2 = Task.objects.create(
            project=self.project,
            title='Frontend Development',
            description='Develop frontend UI',
            required_skills=['React', 'JavaScript'],
            estimated_hours=30,
            priority=2
        )
        
        self.senior_token = Token.objects.create(user=self.senior_dev)
        self.api_client = APIClient()
    
    @patch('matching.views.MatchingService.find_task_matches')
    def test_team_hiring_workflow(self, mock_task_matching):
        """Test complete team hiring workflow"""
        
        # Mock task matching
        mock_task_matching.return_value = [
            {
                'developer_id': str(self.developer1.id),
                'match_score': 0.9,
                'hourly_rate': 75.00
            },
            {
                'developer_id': str(self.developer2.id),
                'match_score': 0.8,
                'hourly_rate': 75.00
            }
        ]
        
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.senior_token.key)
        
        # Step 1: Get task matches
        response = self.api_client.get(f'/api/projects/{self.project.id}/task-matches/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Step 2: Invite developers to tasks
        invitation_data = {
            'task_assignments': [
                {
                    'task_id': str(self.task1.id),
                    'developer_id': str(self.developer1.id),
                    'hourly_rate': 75.00
                },
                {
                    'task_id': str(self.task2.id),
                    'developer_id': str(self.developer2.id),
                    'hourly_rate': 75.00
                }
            ]
        }
        
        response = self.api_client.post(f'/api/projects/{self.project.id}/invite-team/', invitation_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify team members were created
        team_members = TeamMember.objects.filter(project=self.project)
        self.assertEqual(team_members.count(), 2)
        
        # Step 3: Developers accept invitations
        dev1_token = Token.objects.create(user=self.developer1)
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + dev1_token.key)
        
        response = self.api_client.post(f'/api/team-members/{team_members.first().id}/accept/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify task assignment
        self.task1.refresh_from_db()
        self.assertEqual(self.task1.assigned_developer, self.developer1)
        self.assertEqual(self.task1.status, 'assigned')


class PaymentWorkflowTest(APITestCase):
    """Test payment processing workflow"""
    
    def setUp(self):
        """Set up test data"""
        self.client_user = User.objects.create_user(
            email='client@example.com',
            password='testpass123',
            role='client'
        )
        
        self.developer = User.objects.create_user(
            email='dev@example.com',
            password='testpass123',
            role='developer'
        )
        
        self.project = Project.objects.create(
            client=self.client_user,
            title='Test Project',
            description='Test description',
            budget_estimate=Decimal('4000.00'),
            timeline_estimate=timedelta(days=20),
            status='in_progress'
        )
        
        # Create milestones
        for i, percentage in enumerate([25, 50, 75, 100], 1):
            ProjectMilestone.objects.create(
                project=self.project,
                percentage=percentage,
                amount=Decimal('1000.00'),
                status='pending'
            )
        
        # Create payment method
        PaymentMethod.objects.create(
            user=self.client_user,
            type='credit_card',
            is_default=True,
            details={'last_four': '1234', 'brand': 'visa'}
        )
        
        self.client_token = Token.objects.create(user=self.client_user)
        self.api_client = APIClient()
    
    @patch('payments.services.PaymentGatewayService.process_payment')
    def test_milestone_payment_workflow(self, mock_payment):
        """Test milestone-based payment workflow"""
        
        # Mock successful payment
        mock_payment.return_value = {
            'success': True,
            'transaction_id': 'txn_123456',
            'amount': 1000.00
        }
        
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        
        # Step 1: Complete 25% of tasks to trigger first milestone
        milestone = ProjectMilestone.objects.filter(project=self.project, percentage=25).first()
        
        # Simulate milestone completion
        milestone.status = 'ready_for_payment'
        milestone.save()
        
        # Step 2: Process milestone payment
        payment_data = {
            'milestone_id': str(milestone.id),
            'payment_method_id': PaymentMethod.objects.filter(user=self.client_user).first().id
        }
        
        response = self.api_client.post('/api/payments/process-milestone/', payment_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify payment was created
        payment = Payment.objects.filter(milestone=milestone).first()
        self.assertIsNotNone(payment)
        self.assertEqual(payment.amount, Decimal('1000.00'))
        self.assertEqual(payment.status, 'completed')
        
        # Verify milestone status updated
        milestone.refresh_from_db()
        self.assertEqual(milestone.status, 'paid')
    
    def test_payment_dispute_workflow(self):
        """Test payment dispute handling workflow"""
        # Create a completed payment
        milestone = ProjectMilestone.objects.filter(project=self.project, percentage=25).first()
        payment = Payment.objects.create(
            milestone=milestone,
            developer=self.developer,
            amount=Decimal('1000.00'),
            status='completed'
        )
        
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        
        # Step 1: Client raises dispute
        dispute_data = {
            'payment_id': str(payment.id),
            'reason': 'quality_issues',
            'description': 'Work does not meet requirements'
        }
        
        response = self.api_client.post('/api/payments/dispute/', dispute_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify dispute was created
        from payments.models import PaymentDispute
        dispute = PaymentDispute.objects.filter(payment=payment).first()
        self.assertIsNotNone(dispute)
        self.assertEqual(dispute.reason, 'quality_issues')
        self.assertEqual(dispute.status, 'open')