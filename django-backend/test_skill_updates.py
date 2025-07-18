#!/usr/bin/env python
"""
Test script for automatic skill profile updates.
Tests the GitHub analysis, skill extraction, and confidence scoring functionality.
"""

import os
import sys
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from users.models import User, DeveloperProfile
from ai_services.tasks import update_developer_profile, _extract_skills_from_analysis, _calculate_skill_confidence_scores
from ai_services.skill_validator import SkillValidator
from ai_services.github_client import GitHubAnalyzer
import json


def test_skill_validator():
    """Test the skill validator functionality."""
    print("Testing Skill Validator...")
    
    validator = SkillValidator()
    
    # Test skill validation
    test_skills = ['Python', 'JavaScript', 'React', 'Django', 'InvalidSkill123', 'AWS']
    
    # Mock GitHub analysis data
    mock_github_analysis = {
        'languages': {'Python': 5, 'JavaScript': 3},
        'frameworks': ['React', 'Django'],
        'skill_assessment': {
            'Python': {'proficiency': 85, 'level': 'Advanced'},
            'JavaScript': {'proficiency': 70, 'level': 'Intermediate'}
        },
        'activity_score': 75,
        'complexity_score': 60
    }
    
    validation_result = validator.validate_skills(test_skills, mock_github_analysis)
    
    print(f"Validation Results:")
    print(f"Total extracted: {validation_result['total_extracted']}")
    print(f"Total validated: {validation_result['total_validated']}")
    print(f"Validation rate: {validation_result['validation_rate']:.2%}")
    
    for skill, data in validation_result['validated_skills'].items():
        print(f"\nSkill: {skill}")
        print(f"  Confidence: {data['confidence_score']:.1f}%")
        print(f"  Category: {data['category']}")
        print(f"  Market Demand: {data['market_demand']}")
        print(f"  Validation Factors: {', '.join(data['validation_factors'])}")
    
    return validation_result


def test_skill_extraction():
    """Test skill extraction from GitHub analysis."""
    print("\nTesting Skill Extraction...")
    
    # Mock comprehensive GitHub analysis
    mock_analysis = {
        'languages': {
            'Python': 8,
            'JavaScript': 5,
            'TypeScript': 3,
            'HTML': 2,
            'CSS': 2
        },
        'frameworks': ['Django', 'React', 'Express.js'],
        'skill_assessment': {
            'Python': {'proficiency': 90, 'level': 'Expert'},
            'JavaScript': {'proficiency': 75, 'level': 'Advanced'},
            'Django': {'proficiency': 85, 'level': 'Advanced'}
        },
        'top_repositories': [
            {'name': 'web-app', 'language': 'Python', 'stars': 50},
            {'name': 'react-dashboard', 'language': 'JavaScript', 'stars': 25}
        ]
    }
    
    skills_data = _extract_skills_from_analysis(mock_analysis)
    
    print(f"Extracted Skills: {skills_data['skills']}")
    print(f"Primary Languages: {skills_data['primary_languages']}")
    print(f"Frameworks: {skills_data['frameworks']}")
    print(f"Total Skills: {skills_data['skill_count']}")
    
    return skills_data


def test_confidence_scoring():
    """Test confidence scoring calculation."""
    print("\nTesting Confidence Scoring...")
    
    # Mock data
    mock_github_analysis = {
        'languages': {'Python': 10, 'JavaScript': 5},
        'skill_assessment': {
            'Python': {'proficiency': 90},
            'JavaScript': {'proficiency': 70}
        },
        'activity_score': 80,
        'complexity_score': 65
    }
    
    mock_skills_data = {
        'skills': ['Python', 'JavaScript', 'Django', 'React']
    }
    
    # Create a mock profile
    class MockProfile:
        reputation_score = 75.0
    
    mock_profile = MockProfile()
    
    confidence_scores = _calculate_skill_confidence_scores(
        mock_github_analysis, mock_skills_data, mock_profile
    )
    
    print("Confidence Scores:")
    for skill, score in confidence_scores.items():
        print(f"  {skill}: {score:.1f}%")
    
    return confidence_scores


def test_github_analyzer():
    """Test GitHub analyzer with a real repository (if API key available)."""
    print("\nTesting GitHub Analyzer...")
    
    try:
        analyzer = GitHubAnalyzer()
        
        # Test with a well-known repository
        # Note: This requires a valid GitHub API token
        print("Attempting to analyze a sample repository...")
        print("(This will only work if GitHub API credentials are configured)")
        
        # You can uncomment and test with a real username if you have API access
        # analysis = analyzer.analyze_developer_profile('octocat')
        # print(f"Analysis completed for sample profile")
        # print(f"Languages found: {list(analysis.get('languages', {}).keys())}")
        
        print("GitHub analyzer test skipped (requires API credentials)")
        
    except Exception as e:
        print(f"GitHub analyzer test failed: {str(e)}")
        print("This is expected if GitHub API credentials are not configured")


def create_test_user():
    """Create a test user for testing purposes."""
    print("\nCreating test user...")
    
    try:
        # Create test user
        test_user = User.objects.create_user(
            username='test_developer',
            email='test@example.com',
            role='developer',
            github_username='octocat'  # Using GitHub's mascot account
        )
        
        # Create developer profile
        profile = DeveloperProfile.objects.create(
            user=test_user,
            experience_level='mid',
            hourly_rate=75.00,
            skills=['Python', 'JavaScript'],
            bio='Test developer profile'
        )
        
        print(f"Created test user: {test_user.username} (ID: {test_user.id})")
        return test_user
        
    except Exception as e:
        print(f"Error creating test user: {str(e)}")
        # Try to get existing user
        try:
            test_user = User.objects.get(username='test_developer')
            print(f"Using existing test user: {test_user.username}")
            return test_user
        except User.DoesNotExist:
            print("Could not create or find test user")
            return None


def test_profile_update_task():
    """Test the profile update task."""
    print("\nTesting Profile Update Task...")
    
    test_user = create_test_user()
    if not test_user:
        print("Cannot test profile update without test user")
        return
    
    try:
        # Test the update function directly (synchronous)
        print(f"Testing profile update for user: {test_user.username}")
        
        # This will attempt to analyze the GitHub profile
        # Note: This requires valid GitHub API credentials
        result = update_developer_profile(str(test_user.id), force_update=True)
        
        print("Profile Update Result:")
        print(json.dumps(result, indent=2, default=str))
        
        if result.get('success'):
            # Refresh profile from database
            test_user.refresh_from_db()
            profile = test_user.developer_profile
            
            print(f"\nUpdated Profile Data:")
            print(f"Skills: {profile.skills}")
            print(f"Reputation Score: {profile.reputation_score}")
            print(f"Skill Embeddings Count: {len(profile.skill_embeddings)}")
            
        return result
        
    except Exception as e:
        print(f"Profile update test failed: {str(e)}")
        print("This is expected if GitHub API credentials are not configured")
        return None


def cleanup_test_data():
    """Clean up test data."""
    print("\nCleaning up test data...")
    
    try:
        User.objects.filter(username='test_developer').delete()
        print("Test user deleted")
    except Exception as e:
        print(f"Cleanup error: {str(e)}")


def main():
    """Run all tests."""
    print("=== Automatic Skill Profile Updates Test Suite ===\n")
    
    try:
        # Test individual components
        test_skill_validator()
        test_skill_extraction()
        test_confidence_scoring()
        test_github_analyzer()
        
        # Test full workflow
        test_profile_update_task()
        
        print("\n=== Test Suite Completed ===")
        
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"\nTest suite failed with error: {str(e)}")
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