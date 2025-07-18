#!/usr/bin/env python
"""
Test script for project analysis API endpoints
"""
import os
import sys
import django
from pathlib import Path
import json

# Add the project directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

User = get_user_model()

def setup_test_users():
    """Create test users for API testing"""
    print("Setting up test users...")
    
    # Create client user
    client_user, created = User.objects.get_or_create(
        email='testclient@example.com',
        defaults={
            'username': 'testclient',
            'role': 'client',
            'is_verified': True
        }
    )
    if created:
        client_user.set_password('testpass123')
        client_user.save()
    
    # Create developer user
    dev_user, created = User.objects.get_or_create(
        email='testdev@example.com',
        defaults={
            'username': 'testdev',
            'role': 'developer',
            'is_verified': True
        }
    )
    if created:
        dev_user.set_password('testpass123')
        dev_user.save()
    
    # Create tokens
    client_token, _ = Token.objects.get_or_create(user=client_user)
    dev_token, _ = Token.objects.get_or_create(user=dev_user)
    
    print(f"✅ Test users created/found")
    return client_user, dev_user, client_token.key, dev_token.key

def test_analyze_project_endpoint():
    """Test the analyze-project endpoint"""
    print("\nTesting /api/ai-services/analyze-project/ endpoint...")
    
    client_user, dev_user, client_token, dev_token = setup_test_users()
    client = Client()
    
    # Test data
    test_data = {
        'title': 'Simple Todo App',
        'description': '''
        Create a simple todo list application with the following features:
        - Add, edit, and delete tasks
        - Mark tasks as complete/incomplete
        - Filter tasks by status
        - User authentication
        - Responsive design
        - Data persistence with database
        
        The app should be built with React frontend and Django backend.
        '''
    }
    
    # Test with client user (should work)
    response = client.post(
        '/api/ai-services/analyze-project/',
        data=json.dumps(test_data),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {client_token}'
    )
    
    print(f"Response status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("✅ Project analysis endpoint working!")
        print(f"  - Success: {data.get('success')}")
        print(f"  - Tasks generated: {len(data.get('analysis', {}).get('task_breakdown', []))}")
        print(f"  - Budget estimate: ${data.get('analysis', {}).get('budget_estimate', 0):,.2f}")
        print(f"  - Needs senior dev: {data.get('analysis', {}).get('needs_senior_developer')}")
        return True
    else:
        print(f"❌ Project analysis endpoint failed: {response.content.decode()}")
        return False

def test_create_project_with_analysis_endpoint():
    """Test the create-project-with-analysis endpoint"""
    print("\nTesting /api/ai-services/create-project-with-analysis/ endpoint...")
    
    client_user, dev_user, client_token, dev_token = setup_test_users()
    client = Client()
    
    # Test data
    test_data = {
        'title': 'API Integration Project',
        'description': '''
        Build a REST API integration service that connects multiple third-party APIs:
        - Payment processing (Stripe)
        - Email service (SendGrid)
        - File storage (AWS S3)
        - Authentication (OAuth2)
        - Rate limiting and caching
        - Error handling and logging
        - API documentation
        - Unit and integration tests
        
        The service should be scalable and handle high traffic loads.
        '''
    }
    
    # Test with client user (should work)
    response = client.post(
        '/api/ai-services/create-project-with-analysis/',
        data=json.dumps(test_data),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {client_token}'
    )
    
    print(f"Response status: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        print("✅ Create project with analysis endpoint working!")
        print(f"  - Project ID: {data.get('project', {}).get('id')}")
        print(f"  - Project status: {data.get('project', {}).get('status')}")
        print(f"  - Task count: {data.get('project', {}).get('task_count')}")
        print(f"  - Budget: ${data.get('project', {}).get('budget_estimate', 0):,.2f}")
        
        project_id = data.get('project', {}).get('id')
        return project_id
    else:
        print(f"❌ Create project endpoint failed: {response.content.decode()}")
        return None

def test_project_analysis_status_endpoint(project_id):
    """Test the project analysis status endpoint"""
    if not project_id:
        print("\n⏭️  Skipping project analysis status test (no project ID)")
        return False
        
    print(f"\nTesting /api/ai-services/project-analysis-status/{project_id}/ endpoint...")
    
    client_user, dev_user, client_token, dev_token = setup_test_users()
    client = Client()
    
    # Test with client user (should work)
    response = client.get(
        f'/api/ai-services/project-analysis-status/{project_id}/',
        HTTP_AUTHORIZATION=f'Token {client_token}'
    )
    
    print(f"Response status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("✅ Project analysis status endpoint working!")
        print(f"  - Project title: {data.get('title')}")
        print(f"  - Analysis available: {data.get('analysis_available')}")
        print(f"  - Total tasks: {data.get('task_breakdown', {}).get('total_tasks')}")
        print(f"  - Complexity score: {data.get('complexity_score')}")
        return True
    else:
        print(f"❌ Project analysis status endpoint failed: {response.content.decode()}")
        return False

def test_analysis_service_health():
    """Test the service health endpoint"""
    print("\nTesting /api/ai-services/test-analysis/ endpoint...")
    
    client = Client()
    
    response = client.get('/api/ai-services/test-analysis/')
    
    print(f"Response status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("✅ Analysis service health endpoint working!")
        print(f"  - Test result status: {data.get('test_result', {}).get('status')}")
        print(f"  - Project analysis service: {data.get('services', {}).get('project_analysis')}")
        return True
    else:
        print(f"❌ Analysis service health endpoint failed: {response.content.decode()}")
        return False

def main():
    """Run all API tests"""
    print("🚀 Starting Project Analysis API Tests")
    print("=" * 60)
    
    # Test 1: Analyze project endpoint
    analyze_ok = test_analyze_project_endpoint()
    
    # Test 2: Create project with analysis endpoint
    project_id = test_create_project_with_analysis_endpoint()
    create_ok = project_id is not None
    
    # Test 3: Project analysis status endpoint
    status_ok = test_project_analysis_status_endpoint(project_id)
    
    # Test 4: Service health endpoint
    health_ok = test_analysis_service_health()
    
    print("\n" + "=" * 60)
    print("📊 API Test Results Summary:")
    print(f"  Analyze Project:       {'✅ PASS' if analyze_ok else '❌ FAIL'}")
    print(f"  Create Project:        {'✅ PASS' if create_ok else '❌ FAIL'}")
    print(f"  Analysis Status:       {'✅ PASS' if status_ok else '❌ FAIL'}")
    print(f"  Service Health:        {'✅ PASS' if health_ok else '❌ FAIL'}")
    
    all_passed = analyze_ok and create_ok and status_ok and health_ok
    print(f"\n🎯 Overall Result: {'✅ ALL API TESTS PASSED' if all_passed else '❌ SOME API TESTS FAILED'}")
    
    if project_id:
        print(f"\n📝 Test project created with ID: {project_id}")
        print("   You can use this ID to test other endpoints manually")

if __name__ == "__main__":
    main()