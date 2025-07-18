#!/usr/bin/env python
"""
Test script for AI services API endpoints
"""
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
import json

def test_ai_services():
    """Test AI services endpoints"""
    
    # Create test client
    client = Client()
    
    # Create test user
    User = get_user_model()
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'role': 'client',
            'is_verified': True
        }
    )
    
    # Create token for authentication
    token, created = Token.objects.get_or_create(user=user)
    
    # Test health endpoint
    print("Testing health endpoint...")
    response = client.get('/ai/health/', HTTP_AUTHORIZATION=f'Token {token.key}')
    print(f"Health Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Health Response: {json.loads(response.content)}")
    
    # Test project analysis endpoint
    print("\nTesting project analysis endpoint...")
    test_data = {
        'description': 'Build a modern e-commerce web application with user authentication, product catalog, shopping cart, and payment processing.',
        'title': 'E-commerce Platform'
    }
    
    response = client.post(
        '/ai/analyze-project/',
        data=json.dumps(test_data),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {token.key}'
    )
    
    print(f"Analysis Status: {response.status_code}")
    if response.status_code == 200:
        result = json.loads(response.content)
        print(f"Tasks Generated: {len(result['analysis']['task_breakdown'])}")
        print(f"Budget Estimate: ${result['analysis']['budget_estimate']}")
        print(f"Timeline: {result['analysis']['timeline_estimate_days']} days")
        print(f"Required Skills: {result['analysis']['required_skills']}")
    else:
        print(f"Error Response: {response.content}")
    
    # Test analysis with project creation
    print("\nTesting project creation with analysis...")
    test_data_with_creation = {
        'description': 'Create a task management application with real-time collaboration features.',
        'title': 'Task Management App',
        'create_project': True
    }
    
    response = client.post(
        '/ai/analyze-project/',
        data=json.dumps(test_data_with_creation),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {token.key}'
    )
    
    print(f"Project Creation Status: {response.status_code}")
    if response.status_code == 200:
        result = json.loads(response.content)
        print(f"Project ID: {result.get('project_id')}")
        print(f"Message: {result.get('message')}")
    else:
        print(f"Error Response: {response.content}")

if __name__ == '__main__':
    test_ai_services()