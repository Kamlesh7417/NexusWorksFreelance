#!/usr/bin/env python
"""
Test script for team hiring business logic only.
This tests the core algorithms without database dependencies.
"""

import os
import sys
import django
from decimal import Decimal
from datetime import timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.utils import timezone
from projects.team_hiring_service import TeamHiringService


class MockTask:
    """Mock task for testing business logic"""
    
    def __init__(self, title, required_skills, estimated_hours, priority):
        self.title = title
        self.required_skills = required_skills
        self.estimated_hours = estimated_hours
        self.priority = priority
        self.dependencies = MockQuerySet([])  # Mock empty queryset
        
        # Mock project
        self.project = MockProject()


class MockProject:
    """Mock project for testing"""
    
    def __init__(self):
        self.ai_analysis = {'complexity': 'moderate'}


class MockQuerySet:
    """Mock Django QuerySet"""
    
    def __init__(self, items):
        self.items = items
    
    def count(self):
        return len(self.items)


def test_complexity_assessment():
    """Test task complexity assessment algorithm"""
    print("\n=== Testing Task Complexity Assessment ===")
    
    test_cases = [
        {
            'task': MockTask('Simple Task', ['Python'], 8, 1),
            'expected': 'simple'
        },
        {
            'task': MockTask('Moderate Task', ['Python', 'Django'], 25, 2),
            'expected': 'moderate'
        },
        {
            'task': MockTask('Complex Task', ['Python', 'Django', 'React', 'AWS'], 60, 3),
            'expected': 'complex'
        },
        {
            'task': MockTask('Expert Task', ['Python', 'AI', 'ML', 'Blockchain', 'Kubernetes'], 100, 4),
            'expected': 'expert'
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        task = test_case['task']
        expected = test_case['expected']
        
        complexity = TeamHiringService._assess_task_complexity(task)
        
        print(f"Test {i}: {task.title}")
        print(f"  Skills: {task.required_skills}")
        print(f"  Hours: {task.estimated_hours}")
        print(f"  Priority: {task.priority}")
        print(f"  Assessed Complexity: {complexity}")
        print(f"  Expected: {expected}")
        
        if complexity == expected:
            print(f"  ✅ PASS")
        else:
            print(f"  ❌ FAIL - Expected {expected}, got {complexity}")
            return False
    
    print(f"\n✅ All complexity assessment tests passed!")
    return True


def test_market_base_rate():
    """Test market base rate calculation"""
    print("\n=== Testing Market Base Rate Calculation ===")
    
    test_cases = [
        {
            'skills': ['Python'],
            'expected_min': 70,
            'expected_max': 80
        },
        {
            'skills': ['Python', 'Django'],
            'expected_min': 70,
            'expected_max': 85
        },
        {
            'skills': ['AI', 'Machine Learning'],
            'expected_min': 90,
            'expected_max': 105
        },
        {
            'skills': ['Blockchain'],
            'expected_min': 105,
            'expected_max': 115
        },
        {
            'skills': [],
            'expected_min': 60,
            'expected_max': 70
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        skills = test_case['skills']
        expected_min = test_case['expected_min']
        expected_max = test_case['expected_max']
        
        rate = TeamHiringService._get_market_base_rate(skills)
        
        print(f"Test {i}: Skills {skills}")
        print(f"  Calculated Rate: ${rate}")
        print(f"  Expected Range: ${expected_min} - ${expected_max}")
        
        if expected_min <= float(rate) <= expected_max:
            print(f"  ✅ PASS")
        else:
            print(f"  ❌ FAIL - Rate ${rate} not in expected range")
            return False
    
    print(f"\n✅ All market base rate tests passed!")
    return True


def test_skill_premium_calculation():
    """Test skill premium calculation"""
    print("\n=== Testing Skill Premium Calculation ===")
    
    test_cases = [
        {
            'skills': ['Python', 'Django'],
            'expected_min': 0,
            'expected_max': 5
        },
        {
            'skills': ['AI', 'Machine Learning'],
            'expected_min': 30,
            'expected_max': 40
        },
        {
            'skills': ['Blockchain'],
            'expected_min': 20,
            'expected_max': 30
        },
        {
            'skills': ['AWS', 'DevOps', 'Kubernetes'],
            'expected_min': 25,
            'expected_max': 35
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        skills = test_case['skills']
        expected_min = test_case['expected_min']
        expected_max = test_case['expected_max']
        
        premium = TeamHiringService._calculate_skill_premium(skills)
        
        print(f"Test {i}: Skills {skills}")
        print(f"  Calculated Premium: ${premium}")
        print(f"  Expected Range: ${expected_min} - ${expected_max}")
        
        if expected_min <= float(premium) <= expected_max:
            print(f"  ✅ PASS")
        else:
            print(f"  ❌ FAIL - Premium ${premium} not in expected range")
            return False
    
    print(f"\n✅ All skill premium tests passed!")
    return True


def test_demand_multiplier():
    """Test demand multiplier calculation"""
    print("\n=== Testing Demand Multiplier Calculation ===")
    
    test_cases = [
        {
            'skills': ['Python', 'Django'],
            'expected_min': 0.95,
            'expected_max': 1.05
        },
        {
            'skills': ['AI'],
            'expected_min': 1.10,
            'expected_max': 1.20
        },
        {
            'skills': ['AI', 'Blockchain'],
            'expected_min': 1.25,
            'expected_max': 1.35
        },
        {
            'skills': ['Kubernetes', 'Machine Learning'],
            'expected_min': 1.25,
            'expected_max': 1.35
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        skills = test_case['skills']
        expected_min = test_case['expected_min']
        expected_max = test_case['expected_max']
        
        multiplier = TeamHiringService._calculate_demand_multiplier(skills)
        
        print(f"Test {i}: Skills {skills}")
        print(f"  Calculated Multiplier: {multiplier}")
        print(f"  Expected Range: {expected_min} - {expected_max}")
        
        if expected_min <= multiplier <= expected_max:
            print(f"  ✅ PASS")
        else:
            print(f"  ❌ FAIL - Multiplier {multiplier} not in expected range")
            return False
    
    print(f"\n✅ All demand multiplier tests passed!")
    return True


def test_urgency_multiplier():
    """Test urgency multiplier calculation"""
    print("\n=== Testing Urgency Multiplier Calculation ===")
    
    test_cases = [
        {
            'priority': 1,
            'expected': 1.0
        },
        {
            'priority': 2,
            'expected': 1.1
        },
        {
            'priority': 3,
            'expected': 1.25
        },
        {
            'priority': 4,
            'expected': 1.5
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        priority = test_case['priority']
        expected = test_case['expected']
        
        task = MockTask(f'Task Priority {priority}', ['Python'], 20, priority)
        multiplier = TeamHiringService._calculate_urgency_multiplier(task)
        
        print(f"Test {i}: Priority {priority}")
        print(f"  Calculated Multiplier: {multiplier}")
        print(f"  Expected: {expected}")
        
        if multiplier == expected:
            print(f"  ✅ PASS")
        else:
            print(f"  ❌ FAIL - Expected {expected}, got {multiplier}")
            return False
    
    print(f"\n✅ All urgency multiplier tests passed!")
    return True


def test_personalized_rate_calculation():
    """Test personalized rate calculation"""
    print("\n=== Testing Personalized Rate Calculation ===")
    
    class MockPricing:
        def __init__(self, calculated_rate, min_rate, max_rate):
            self.calculated_rate = Decimal(str(calculated_rate))
            self.min_rate = Decimal(str(min_rate))
            self.max_rate = Decimal(str(max_rate))
    
    class MockProfile:
        def __init__(self, hourly_rate):
            self.hourly_rate = Decimal(str(hourly_rate)) if hourly_rate else None
    
    test_cases = [
        {
            'pricing': MockPricing(80.00, 64.00, 104.00),
            'profile': MockProfile(75.00),
            'match_score': 0.8,
            'description': 'Developer rate lower than calculated'
        },
        {
            'pricing': MockPricing(70.00, 56.00, 91.00),
            'profile': MockProfile(85.00),
            'match_score': 0.9,
            'description': 'Developer rate higher than calculated'
        },
        {
            'pricing': MockPricing(75.00, 60.00, 97.50),
            'profile': MockProfile(None),
            'match_score': 0.7,
            'description': 'No developer rate specified'
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        pricing = test_case['pricing']
        profile = test_case['profile']
        match_score = test_case['match_score']
        description = test_case['description']
        
        personalized_rate = TeamHiringService._calculate_personalized_rate(
            pricing, profile, match_score
        )
        
        print(f"Test {i}: {description}")
        print(f"  Calculated Rate: ${pricing.calculated_rate}")
        print(f"  Developer Rate: ${profile.hourly_rate if profile.hourly_rate else 'None'}")
        print(f"  Match Score: {match_score}")
        print(f"  Personalized Rate: ${personalized_rate}")
        print(f"  Rate Range: ${pricing.min_rate} - ${pricing.max_rate}")
        
        # Verify rate is within bounds
        if pricing.min_rate <= personalized_rate <= pricing.max_rate:
            print(f"  ✅ PASS - Rate within bounds")
        else:
            print(f"  ❌ FAIL - Rate outside bounds")
            return False
    
    print(f"\n✅ All personalized rate tests passed!")
    return True


def test_completion_date_estimation():
    """Test completion date estimation"""
    print("\n=== Testing Completion Date Estimation ===")
    
    class MockProfile:
        def __init__(self, experience_level):
            self.experience_level = experience_level
    
    class MockTask:
        def __init__(self, estimated_hours):
            self.estimated_hours = estimated_hours
    
    test_cases = [
        {
            'task': MockTask(30),
            'profile': MockProfile('junior'),
            'expected_days_min': 6,
            'expected_days_max': 8
        },
        {
            'task': MockTask(30),
            'profile': MockProfile('mid'),
            'expected_days_min': 4,
            'expected_days_max': 6
        },
        {
            'task': MockTask(30),
            'profile': MockProfile('senior'),
            'expected_days_min': 3,
            'expected_days_max': 5
        },
        {
            'task': MockTask(60),
            'profile': MockProfile('lead'),
            'expected_days_min': 6,
            'expected_days_max': 8
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        task = test_case['task']
        profile = test_case['profile']
        expected_min = test_case['expected_days_min']
        expected_max = test_case['expected_days_max']
        
        start_time = timezone.now()
        completion_date = TeamHiringService._estimate_completion_date(task, profile)
        days_difference = (completion_date - start_time).days
        
        print(f"Test {i}: {task.estimated_hours}h task, {profile.experience_level} developer")
        print(f"  Estimated Days: {days_difference}")
        print(f"  Expected Range: {expected_min} - {expected_max} days")
        
        if expected_min <= days_difference <= expected_max:
            print(f"  ✅ PASS")
        else:
            print(f"  ❌ FAIL - {days_difference} days not in expected range")
            return False
    
    print(f"\n✅ All completion date estimation tests passed!")
    return True


def run_business_logic_tests():
    """Run all business logic tests"""
    print("Starting Team Hiring Business Logic Tests...")
    print("=" * 60)
    
    tests = [
        test_complexity_assessment,
        test_market_base_rate,
        test_skill_premium_calculation,
        test_demand_multiplier,
        test_urgency_multiplier,
        test_personalized_rate_calculation,
        test_completion_date_estimation
    ]
    
    passed = 0
    failed = 0
    
    for test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"\n❌ Test {test_func.__name__} failed with exception: {str(e)}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("✅ All Team Hiring Business Logic Tests Passed!")
        return True
    else:
        print("❌ Some tests failed!")
        return False


if __name__ == '__main__':
    success = run_business_logic_tests()
    sys.exit(0 if success else 1)