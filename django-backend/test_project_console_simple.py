#!/usr/bin/env python3
"""
Simple Project Management Console Test
Test the project management console endpoints
"""

import os
import sys
import django
import uuid
from decimal import Decimal
from datetime import datetime, timedelta

# Add the Django project directory to Python path
sys.path.append('/Users/kiro/Desktop/ai-powered-freelancing-platform/django-backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.contrib.auth import get_user_model
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


def test_project_console():
    """Test project management console functionality"""
    print("🚀 Testing Project Management Console")
    print("=" * 50)
    
    try:
        # Get or create test users with unique usernames
        unique_id = str(uuid.uuid4())[:8]
        
        client_user, created = User.objects.get_or_create(
            username=f'testclient_{unique_id}',
            defaults={
                'email': f'client_{unique_id}@test.com',
                'role': 'client',
                'first_name': 'Test',
                'last_name': 'Client'
            }
        )
        if created:
            client_user.set_password('testpass123')
            client_user.save()
        
        senior_dev, created = User.objects.get_or_create(
            username=f'seniordev_{unique_id}',
            defaults={
                'email': f'senior_{unique_id}@test.com',
                'role': 'developer',
                'first_name': 'Senior',
                'last_name': 'Developer',
                'github_username': f'seniordev_{unique_id}'
            }
        )
        if created:
            senior_dev.set_password('testpass123')
            senior_dev.save()
        
        # Create developer profiles
        from users.models import DeveloperProfile
        
        senior_profile, created = DeveloperProfile.objects.get_or_create(
            user=senior_dev,
            defaults={
                'skills': ['Python', 'Django', 'React', 'Leadership'],
                'experience_level': 'senior',
                'hourly_rate': Decimal('100.00'),
                'reputation_score': 4.8,
                'projects_completed': 25
            }
        )
        
        # Create test project
        project = Project.objects.create(
            client=client_user,
            title=f'Test Console Project {unique_id}',
            description='A test project for console functionality',
            status='in_progress',
            budget_estimate=Decimal('25000.00'),
            senior_developer=senior_dev,
            required_skills=['Python', 'Django'],
            experience_level_required='senior',
            ai_analysis={
                'complexity_score': 7.5,
                'estimated_timeline': '2 months',
                'required_team_size': 2
            }
        )
        
        # Create test tasks
        task1 = Task.objects.create(
            project=project,
            title='Backend Development',
            description='Develop backend API',
            required_skills=['Python', 'Django'],
            estimated_hours=40,
            priority=1,
            assigned_developer=senior_dev,
            status='in_progress',
            completion_percentage=50
        )
        
        task2 = Task.objects.create(
            project=project,
            title='Frontend Development',
            description='Build frontend interface',
            required_skills=['React', 'JavaScript'],
            estimated_hours=30,
            priority=2,
            status='pending',
            completion_percentage=0
        )
        
        # Create resource allocation
        resource_allocation = ResourceAllocation.objects.create(
            project=project,
            total_team_members=1,
            active_assignments=1,
            pending_invitations=0,
            total_budget=Decimal('25000.00'),
            allocated_budget=Decimal('8000.00'),
            remaining_budget=Decimal('17000.00'),
            planned_start_date=timezone.now() - timedelta(days=10),
            planned_end_date=timezone.now() + timedelta(days=50),
            current_projected_end_date=timezone.now() + timedelta(days=55),
            overall_progress_percentage=25,
            tasks_completed=0,
            tasks_in_progress=1,
            tasks_pending=1,
            budget_risk_level='low',
            timeline_risk_level='low',
            resource_risk_level='low'
        )
        
        # Create milestone
        milestone = Milestone.objects.create(
            project=project,
            percentage=25,
            amount=Decimal('6250.00'),
            status='pending',
            due_date=timezone.now().date() + timedelta(days=15)
        )
        
        # Set up API client
        api_client = APIClient()
        
        # Create token for authentication
        client_token, created = Token.objects.get_or_create(user=client_user)
        senior_token, created = Token.objects.get_or_create(user=senior_dev)
        
        print(f"✓ Test data created successfully")
        print(f"  - Project: {project.title}")
        print(f"  - Tasks: {task1.title}, {task2.title}")
        print(f"  - Users: {client_user.username}, {senior_dev.username}")
        
        # Test 1: Dashboard Access
        print("\n1. Testing Dashboard Access...")
        api_client.credentials(HTTP_AUTHORIZATION='Token ' + client_token.key)
        
        response = api_client.get('/api/projects/console/dashboard/')
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Dashboard accessible")
            print(f"   ✓ User role: {data.get('user_role', 'N/A')}")
            print(f"   ✓ Projects count: {len(data.get('projects', []))}")
            
            if data.get('projects'):
                project_data = data['projects'][0]
                print(f"   ✓ Project progress: {project_data.get('progress', {}).get('completion_percentage', 0):.1f}%")
        else:
            print(f"   ❌ Dashboard access failed: {response.status_code}")
            print(f"   Error: {response.content.decode()}")
        
        # Test 2: Project Details
        print("\n2. Testing Project Details...")
        response = api_client.get(f'/api/projects/console/{project.id}/details/')
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Project details accessible")
            print(f"   ✓ Tasks count: {len(data.get('tasks', []))}")
            print(f"   ✓ Team members: {len(data.get('team_members', []))}")
            print(f"   ✓ Resource allocation present: {data.get('resource_allocation') is not None}")
        else:
            print(f"   ❌ Project details failed: {response.status_code}")
            print(f"   Error: {response.content.decode()}")
        
        # Test 3: Task Progress
        print("\n3. Testing Task Progress...")
        response = api_client.get(f'/api/projects/console/{project.id}/task-progress/')
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Task progress accessible")
            stats = data.get('task_statistics', {})
            print(f"   ✓ Total tasks: {stats.get('total_tasks', 0)}")
            print(f"   ✓ In progress: {stats.get('in_progress_tasks', 0)}")
            print(f"   ✓ Overall progress: {data.get('overall_progress', {}).get('completion_percentage', 0):.1f}%")
        else:
            print(f"   ❌ Task progress failed: {response.status_code}")
            print(f"   Error: {response.content.decode()}")
        
        # Test 4: Team Management
        print("\n4. Testing Team Management...")
        response = api_client.get(f'/api/projects/console/{project.id}/team-management/')
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Team management accessible")
            print(f"   ✓ Team members: {len(data.get('team_members', []))}")
            permissions = data.get('permissions', {})
            print(f"   ✓ Can invite members: {permissions.get('can_invite_members', False)}")
        else:
            print(f"   ❌ Team management failed: {response.status_code}")
            print(f"   Error: {response.content.decode()}")
        
        # Test 5: Budget Timeline
        print("\n5. Testing Budget Timeline...")
        response = api_client.get(f'/api/projects/console/{project.id}/budget-timeline/')
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Budget timeline accessible")
            budget = data.get('budget', {})
            print(f"   ✓ Total budget: ${budget.get('total_budget', 0):,.2f}")
            print(f"   ✓ Risk level: {data.get('risk_assessment', {}).get('overall_risk_level', 'unknown')}")
        else:
            print(f"   ❌ Budget timeline failed: {response.status_code}")
            print(f"   Error: {response.content.decode()}")
        
        # Test 6: Document Management
        print("\n6. Testing Document Management...")
        response = api_client.get(f'/api/projects/console/{project.id}/documents/')
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Document management accessible")
            permissions = data.get('permissions', {})
            print(f"   ✓ Can upload documents: {permissions.get('can_upload_documents', False)}")
            
            # Test document upload
            document_data = {
                'type': 'specification',
                'title': 'Test Document',
                'url': 'https://example.com/test.pdf',
                'description': 'Test document upload'
            }
            
            upload_response = api_client.post(
                f'/api/projects/console/{project.id}/documents/',
                document_data,
                format='json'
            )
            
            if upload_response.status_code == 201:
                print(f"   ✓ Document upload successful")
            else:
                print(f"   ❌ Document upload failed: {upload_response.status_code}")
        else:
            print(f"   ❌ Document management failed: {response.status_code}")
            print(f"   Error: {response.content.decode()}")
        
        # Test 7: GitHub Integration
        print("\n7. Testing GitHub Integration...")
        api_client.credentials(HTTP_AUTHORIZATION='Token ' + senior_token.key)
        response = api_client.get(f'/api/projects/console/{project.id}/github-integration/')
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ GitHub integration accessible")
            print(f"   ✓ Team GitHub profiles: {len(data.get('team_github_profiles', []))}")
            permissions = data.get('permissions', {})
            print(f"   ✓ Can access code reviews: {permissions.get('can_access_code_reviews', False)}")
        else:
            print(f"   ❌ GitHub integration failed: {response.status_code}")
            print(f"   Error: {response.content.decode()}")
        
        # Test 8: Project Navigation
        print("\n8. Testing Project Navigation...")
        api_client.credentials(HTTP_AUTHORIZATION='Token ' + client_token.key)
        response = api_client.get('/api/projects/console/navigation/')
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Project navigation accessible")
            print(f"   ✓ Projects in navigation: {len(data.get('projects', []))}")
            stats = data.get('quick_stats', {})
            print(f"   ✓ Total projects: {stats.get('total_projects', 0)}")
        else:
            print(f"   ❌ Project navigation failed: {response.status_code}")
            print(f"   Error: {response.content.decode()}")
        
        # Test 9: Role-based Access (Senior Developer)
        print("\n9. Testing Senior Developer Access...")
        api_client.credentials(HTTP_AUTHORIZATION='Token ' + senior_token.key)
        response = api_client.get('/api/projects/console/dashboard/')
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Senior developer dashboard accessible")
            if data.get('projects'):
                project_data = data['projects'][0]
                print(f"   ✓ User role in project: {project_data.get('user_role', 'N/A')}")
        else:
            print(f"   ❌ Senior developer access failed: {response.status_code}")
        
        print("\n" + "=" * 50)
        print("✅ Project Management Console Tests Completed!")
        print("=" * 50)
        
        # Cleanup
        print("\n🧹 Cleaning up test data...")
        project.delete()
        client_user.delete()
        senior_dev.delete()
        print("✓ Test data cleaned up")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = test_project_console()
    sys.exit(0 if success else 1)