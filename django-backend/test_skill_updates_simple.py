#!/usr/bin/env python
"""
Simple test script for automatic skill profile updates.
Tests core functionality without requiring Redis or external services.
"""

import os
import sys
import django
from datetime import datetime

# Setup Django with minimal configuration
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')

# Override cache settings to use dummy cache for testing
from django.conf import settings
settings.CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

django.setup()

from ai_services.tasks import _extract_skills_from_analysis, _calculate_skill_confidence_scores, _calculate_reputation_score
from ai_services.skill_validator import SkillValidator
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


def test_reputation_calculation():
    """Test reputation score calculation."""
    print("\nTesting Reputation Score Calculation...")
    
    # Mock GitHub analysis with various metrics
    mock_github_analysis = {
        'activity_score': 85,
        'complexity_score': 70,
        'collaboration_score': 60,
        'top_repositories': [
            {'name': 'popular-project', 'stars': 100, 'forks': 25},
            {'name': 'useful-tool', 'stars': 50, 'forks': 10},
            {'name': 'learning-project', 'stars': 5, 'forks': 2}
        ]
    }
    
    # Mock profile with existing reputation
    class MockProfile:
        reputation_score = 65.0
        projects_completed = 3
    
    mock_profile = MockProfile()
    
    new_reputation = _calculate_reputation_score(mock_github_analysis, mock_profile)
    
    print(f"Previous Reputation: {mock_profile.reputation_score}")
    print(f"New Reputation: {new_reputation}")
    print(f"Change: {new_reputation - mock_profile.reputation_score:+.1f}")
    
    return new_reputation


def test_skill_normalization():
    """Test skill name normalization."""
    print("\nTesting Skill Normalization...")
    
    validator = SkillValidator()
    
    test_cases = [
        'javascript',
        'Javascript',
        'JAVASCRIPT',
        'nodejs',
        'reactjs',
        'postgresql',
        'aws',
        'c++',
        'c#'
    ]
    
    print("Skill Normalization Results:")
    for skill in test_cases:
        normalized = validator._normalize_skill_name(skill)
        print(f"  {skill} -> {normalized}")
    
    return True


def test_market_trends():
    """Test market trends integration."""
    print("\nTesting Market Trends...")
    
    validator = SkillValidator()
    
    popular_skills = ['Python', 'JavaScript', 'React', 'AWS', 'Docker']
    
    print("Market Demand Analysis:")
    for skill in popular_skills:
        market_confidence = validator._calculate_market_confidence(skill)
        market_demand = validator._get_market_demand(skill)
        print(f"  {skill}: {market_demand} demand (confidence: {market_confidence:.1f})")
    
    return True


def test_skill_categories():
    """Test skill categorization."""
    print("\nTesting Skill Categories...")
    
    validator = SkillValidator()
    
    test_skills = [
        'Python', 'JavaScript', 'React', 'Django', 'PostgreSQL', 
        'AWS', 'Docker', 'Git', 'Figma', 'TensorFlow'
    ]
    
    print("Skill Categories:")
    for skill in test_skills:
        category = validator._determine_skill_category(skill)
        print(f"  {skill}: {category}")
    
    return True


def main():
    """Run all tests."""
    print("=== Simple Skill Profile Updates Test Suite ===\n")
    
    try:
        # Test individual components
        test_skill_validator()
        test_skill_extraction()
        test_confidence_scoring()
        test_reputation_calculation()
        test_skill_normalization()
        test_market_trends()
        test_skill_categories()
        
        print("\n=== All Tests Completed Successfully ===")
        print("\nKey Features Tested:")
        print("✓ Skill validation and confidence scoring")
        print("✓ GitHub analysis skill extraction")
        print("✓ Reputation score calculation")
        print("✓ Skill name normalization")
        print("✓ Market trends integration")
        print("✓ Skill categorization")
        
        print("\nNext Steps:")
        print("1. Configure Redis for caching (optional)")
        print("2. Set up GitHub API credentials for live testing")
        print("3. Run Celery worker for background tasks")
        print("4. Use management command: python manage.py update_developer_skills --help")
        
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"\nTest suite failed with error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()