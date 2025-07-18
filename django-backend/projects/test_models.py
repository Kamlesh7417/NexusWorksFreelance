"""
Unit tests for Project models
"""
import uuid
from decimal import Decimal
from datetime import datetime, timedelta
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from projects.models import (
    Project, Task, ProjectMilestone, TeamMember, 
    ProjectProposal, ProposalModification, TaskApproval
)
from users.models import DeveloperProfile

User = get_user_model()


class ProjectModelTest(TestCase):
    """Test cases for Project model"""
    
    def setUp(self):
        """Set up test data"""
        self.client = User.objects.create(
            email='client@example.com',
            role='client'
        )
        
        self.senior_dev = User.objects.create(
            email='senior@example.com',
            role='developer'
        )
        
        self.project_data = {
            'client': self.client,
            'title': 'Test Project',
            'description': 'A test project for unit testing',
            'budget_estimate': Decimal('10000.00'),
            'timeline_estimate': timedelta(days=30),
            'status': 'analyzing'
        }
    
    def test_create_project(self):
        """Test creating a project"""
        project = Project.objects.create(**self.project_data)
        
        self.assertEqual(project.client, self.client)
        self.assertEqual(project.title, 'Test Project')
        self.assertEqual(project.status, 'analyzing')
        self.assertTrue(isinstance(project.id, uuid.UUID))
        self.assertIsNotNone(project.created_at)
    
    def test_project_str_representation(self):
        """Test project string representation"""
        project = Project.objects.create(**self.project_data)
        expected_str = f"Test Project - {self.client.email}"
        self.assertEqual(str(project), expected_str)
    
    def test_project_status_choices(self):
        """Test project status validation"""
        valid_statuses = [
            'analyzing', 'proposal_review', 'team_hiring', 
            'in_progress', 'completed', 'cancelled'
        ]
        
        for status in valid_statuses:
            project_data = self.project_data.copy()
            project_data['title'] = f'Project {status}'
            project_data['status'] = status
            project = Project.objects.create(**project_data)
            self.assertEqual(project.status, status)
    
    def test_assign_senior_developer(self):
        """Test assigning senior developer to project"""
        project = Project.objects.create(**self.project_data)
        project.senior_developer = self.senior_dev
        project.save()
        
        self.assertEqual(project.senior_developer, self.senior_dev)
    
    def test_ai_analysis_default(self):
        """Test ai_analysis field defaults to empty dict"""
        project = Project.objects.create(**self.project_data)
        self.assertEqual(project.ai_analysis, {})


class TaskModelTest(TestCase):
    """Test cases for Task model"""
    
    def setUp(self):
        """Set up test data"""
        self.client = User.objects.create(
            email='client@example.com',
            role='client'
        )
        
        self.developer = User.objects.create(
            email='dev@example.com',
            role='developer'
        )
        
        self.project = Project.objects.create(
            client=self.client,
            title='Test Project',
            description='Test project',
            budget_estimate=Decimal('5000.00'),
            timeline_estimate=timedelta(days=15)
        )
        
        self.task_data = {
            'project': self.project,
            'title': 'Test Task',
            'description': 'A test task',
            'required_skills': ['Python', 'Django'],
            'estimated_hours': 20,
            'priority': 1,
            'status': 'pending'
        }
    
    def test_create_task(self):
        """Test creating a task"""
        task = Task.objects.create(**self.task_data)
        
        self.assertEqual(task.project, self.project)
        self.assertEqual(task.title, 'Test Task')
        self.assertEqual(task.required_skills, ['Python', 'Django'])
        self.assertEqual(task.estimated_hours, 20)
        self.assertEqual(task.priority, 1)
        self.assertEqual(task.completion_percentage, 0)
    
    def test_task_str_representation(self):
        """Test task string representation"""
        task = Task.objects.create(**self.task_data)
        expected_str = f"Test Task - Test Project"
        self.assertEqual(str(task), expected_str)
    
    def test_task_status_choices(self):
        """Test task status validation"""
        valid_statuses = [
            'pending', 'assigned', 'in_progress', 
            'qa_review', 'client_review', 'completed', 'cancelled'
        ]
        
        for status in valid_statuses:
            task_data = self.task_data.copy()
            task_data['title'] = f'Task {status}'
            task_data['status'] = status
            task = Task.objects.create(**task_data)
            self.assertEqual(task.status, status)
    
    def test_assign_developer_to_task(self):
        """Test assigning developer to task"""
        task = Task.objects.create(**self.task_data)
        task.assigned_developer = self.developer
        task.save()
        
        self.assertEqual(task.assigned_developer, self.developer)
    
    def test_task_dependencies(self):
        """Test task dependencies"""
        task1 = Task.objects.create(**self.task_data)
        
        task2_data = self.task_data.copy()
        task2_data['title'] = 'Dependent Task'
        task2 = Task.objects.create(**task2_data)
        
        task2.dependencies.add(task1)
        
        self.assertIn(task1, task2.dependencies.all())
    
    def test_completion_percentage_validation(self):
        """Test completion percentage validation"""
        task_data = self.task_data.copy()
        task_data['completion_percentage'] = 150
        
        with self.assertRaises(ValidationError):
            task = Task(**task_data)
            task.full_clean()


class ProjectMilestoneModelTest(TestCase):
    """Test cases for ProjectMilestone model"""
    
    def setUp(self):
        """Set up test data"""
        self.client = User.objects.create(
            email='client@example.com',
            role='client'
        )
        
        self.project = Project.objects.create(
            client=self.client,
            title='Test Project',
            description='Test project',
            budget_estimate=Decimal('10000.00'),
            timeline_estimate=timedelta(days=30)
        )
        
        self.milestone_data = {
            'project': self.project,
            'percentage': 25,
            'amount': Decimal('2500.00'),
            'status': 'pending',
            'due_date': datetime.now() + timedelta(days=7)
        }
    
    def test_create_milestone(self):
        """Test creating a milestone"""
        milestone = ProjectMilestone.objects.create(**self.milestone_data)
        
        self.assertEqual(milestone.project, self.project)
        self.assertEqual(milestone.percentage, 25)
        self.assertEqual(milestone.amount, Decimal('2500.00'))
        self.assertEqual(milestone.status, 'pending')
    
    def test_milestone_str_representation(self):
        """Test milestone string representation"""
        milestone = ProjectMilestone.objects.create(**self.milestone_data)
        expected_str = f"Test Project - 25% Milestone"
        self.assertEqual(str(milestone), expected_str)
    
    def test_milestone_percentage_validation(self):
        """Test milestone percentage validation"""
        valid_percentages = [25, 50, 75, 100]
        
        for percentage in valid_percentages:
            milestone_data = self.milestone_data.copy()
            milestone_data['percentage'] = percentage
            milestone_data['amount'] = Decimal(str(percentage * 100))
            milestone = ProjectMilestone.objects.create(**milestone_data)
            self.assertEqual(milestone.percentage, percentage)


class TeamMemberModelTest(TestCase):
    """Test cases for TeamMember model"""
    
    def setUp(self):
        """Set up test data"""
        self.client = User.objects.create(
            email='client@example.com',
            role='client'
        )
        
        self.developer = User.objects.create(
            email='dev@example.com',
            role='developer'
        )
        
        self.project = Project.objects.create(
            client=self.client,
            title='Test Project',
            description='Test project',
            budget_estimate=Decimal('5000.00'),
            timeline_estimate=timedelta(days=15)
        )
        
        self.team_member_data = {
            'project': self.project,
            'developer': self.developer,
            'role': 'developer',
            'hourly_rate': Decimal('75.00'),
            'status': 'invited'
        }
    
    def test_create_team_member(self):
        """Test creating a team member"""
        team_member = TeamMember.objects.create(**self.team_member_data)
        
        self.assertEqual(team_member.project, self.project)
        self.assertEqual(team_member.developer, self.developer)
        self.assertEqual(team_member.role, 'developer')
        self.assertEqual(team_member.hourly_rate, Decimal('75.00'))
        self.assertEqual(team_member.status, 'invited')
    
    def test_team_member_str_representation(self):
        """Test team member string representation"""
        team_member = TeamMember.objects.create(**self.team_member_data)
        expected_str = f"{self.developer.email} - Test Project"
        self.assertEqual(str(team_member), expected_str)
    
    def test_team_member_role_choices(self):
        """Test team member role validation"""
        valid_roles = ['developer', 'senior_developer', 'tech_lead', 'qa']
        
        for role in valid_roles:
            team_member_data = self.team_member_data.copy()
            team_member_data['role'] = role
            team_member = TeamMember.objects.create(**team_member_data)
            self.assertEqual(team_member.role, role)
    
    def test_team_member_status_choices(self):
        """Test team member status validation"""
        valid_statuses = ['invited', 'accepted', 'declined', 'removed']
        
        for status in valid_statuses:
            team_member_data = self.team_member_data.copy()
            team_member_data['status'] = status
            team_member = TeamMember.objects.create(**team_member_data)
            self.assertEqual(team_member.status, status)