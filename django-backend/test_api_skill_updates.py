#!/usr/bin/env python
"""
Test script for skill update API endpoints.
Tests the REST API functionality for skill profile updates.
"""

import os
import sys
import django
import json
from django.test import Client
from django.contrib.auth import get_user_model

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')

# Override cache settings to use dummy cache for testing
from django.conf import settings
settings.CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

django.setup()

from users.models import User, DeveloperProfile
from django.urls import reverse


def create_test_user():
    """Create a test user for API testing."""
    try:
        # Clean up existing test user
        User.objects.filter(username='api_test_developer').delete()
        
        # Create test user
        user = User.objects.create_user(
            username='api_test_developer',
            email='apitest@example.com',
            password='testpass123',
            role='developer',
            github_username='octocat'
        )
        
        # Create developer profile
        profile = DeveloperProfile.objects.create(
            user=user,
            experience_level='mid',
            hourly_rate=75.00,
            skills=['Python', 'JavaScript'],
            bio='API test developer profile'
        )
        
        print(f"Created test user: {user.username} (ID: {user.id})")
        return user
        
    except Exception as e:
        print(f"Error creating test user: {str(e)}")
        return None


def test_skill_profile_status_api():
    """Test the skill profile status API endpoint."""
    print("\nTesting Skill Profile Status API...")
    
    user = create_test_user()
    if not user:
        print("Cannot test API without test user")
        return False
    
    client = Client()
    
    # Login the user
    client.force_login(user)
    
    try:
        # Test skill profile status endpoint
        response = client.get('/api/ai-services/skill-profile-status/')
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response Data:")
            print(json.dumps(data, indent=2))
            
            # Verify expected fields
            expected_fields = [
                'user_id', 'github_username', 'skills_count', 
                'embeddings_count', 'reputation_score', 'profile_completeness'
            ]
            
            for field in expected_fields:
                if field in data:
                    print(f"✓ {field}: {data[field]}")
                else:
                    print(f"✗ Missing field: {field}")
            
            return True
        else:
            print(f"API call failed: {response.content}")
            return False
            
    except Exception as e:
        print(f"API test failed: {str(e)}")
        return False


def test_validate_skills_api():
    """Test the validate skills API endpoint."""
    print("\nTesting Validate Skills API...")
    
    user = create_test_user()
    if not user:
        print("Cannot test API without test user")
        return False
    
    client = Client()
    client.force_login(user)
    
    try:
        # Test skill validation endpoint
        test_data = {
            'skills': ['Python', 'JavaScript', 'React', 'InvalidSkill123'],
            'github_analysis': {
                'languages': {'Python': 5, 'JavaScript': 3},
                'frameworks': ['React'],
                'activity_score': 75
            }
        }
        
        response = client.post(
            '/api/ai-services/validate-skills/',
            data=json.dumps(test_data),
            content_type='application/json'
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Validation Results:")
            
            validation_result = data.get('validation_result', {})
            print(f"Total extracted: {validation_result.get('total_extracted', 0)}")
            print(f"Total validated: {validation_result.get('total_validated', 0)}")
            print(f"Validation rate: {validation_result.get('validation_rate', 0):.2%}")
            
            validated_skills = validation_result.get('validated_skills', {})
            for skill, skill_data in validated_skills.items():
                print(f"  {skill}: {skill_data.get('confidence_score', 0):.1f}% confidence")
            
            return True
        else:
            print(f"API call failed: {response.content}")
            return False
            
    except Exception as e:
        print(f"API test failed: {str(e)}")
        return False


def test_skill_categories_api():
    """Test the skill categories API endpoint."""
    print("\nTesting Skill Categories API...")
    
    user = create_test_user()
    if not user:
        print("Cannot test API without test user")
        return False
    
    client = Client()
    client.force_login(user)
    
    try:
        response = client.get('/api/ai-services/skill-categories/')
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Skill Categories:")
            
            categories = data.get('skill_categories', {})
            for category, skills in categories.items():
                print(f"  {category}: {len(skills)} skills")
            
            print(f"Known skills count: {data.get('known_skills_count', 0)}")
            print(f"Market trends available: {data.get('market_trends_available', 0)}")
            
            popular_skills = data.get('popular_skills', {})
            print("Popular Skills:")
            for category, skills in popular_skills.items():
                print(f"  {category}: {', '.join(skills[:3])}...")
            
            return True
        else:
            print(f"API call failed: {response.content}")
            return False
            
    except Exception as e:
        print(f"API test failed: {str(e)}")
        return False


def test_trigger_skill_update_api():
    """Test the trigger skill update API endpoint."""
    print("\nTesting Trigger Skill Update API...")
    
    user = create_test_user()
    if not user:
        print("Cannot test API without test user")
        return False
    
    client = Client()
    client.force_login(user)
    
    try:
        # Test triggering skill update
        test_data = {
            'force_update': True  # Force update to bypass rate limiting
        }
        
        response = client.post(
            '/api/ai-services/trigger-skill-update/',
            data=json.dumps(test_data),
            content_type='application/json'
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 202:  # Accepted
            data = response.json()
            print("Skill Update Triggered:")
            print(f"  Task ID: {data.get('task_id')}")
            print(f"  User ID: {data.get('user_id')}")
            print(f"  GitHub Username: {data.get('github_username')}")
            print(f"  Force Update: {data.get('force_update')}")
            
            print("\nNote: This queues a Celery task. To process it, run:")
            print("celery -A freelance_platform worker --loglevel=info")
            
            return True
        else:
            print(f"API call failed: {response.content}")
            return False
            
    except Exception as e:
        print(f"API test failed: {str(e)}")
        return False


def cleanup_test_data():
    """Clean up test data."""
    print("\nCleaning up test data...")
    
    try:
        User.objects.filter(username='api_test_developer').delete()
        print("Test user deleted")
    except Exception as e:
        print(f"Cleanup error: {str(e)}")


def main():
    """Run all API tests."""
    print("=== Skill Update API Test Suite ===\n")
    
    try:
        # Test API endpoints
        results = []
        results.append(test_skill_profile_status_api())
        results.append(test_validate_skills_api())
        results.append(test_skill_categories_api())
        results.append(test_trigger_skill_update_api())
        
        # Summary
        passed = sum(results)
        total = len(results)
        
        print(f"\n=== Test Results: {passed}/{total} Passed ===")
        
        if passed == total:
            print("✓ All API tests passed!")
        else:
            print("✗ Some API tests failed")
        
        print("\nAPI Endpoints Available:")
        print("- GET  /api/ai-services/skill-profile-status/")
        print("- POST /api/ai-services/validate-skills/")
        print("- GET  /api/ai-services/skill-categories/")
        print("- POST /api/ai-services/trigger-skill-update/")
        print("- POST /api/ai-services/trigger-batch-skill-update/ (admin only)")
        
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"\nTest suite failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        # Ask user if they want to clean up
        try:
            response = input("\nClean up test data? (y/N): ")
            if response.lower() in ['y', 'yes']:
                cleanup_test_data()
        except:
            pass


if __name__ == '__main__':
    main()