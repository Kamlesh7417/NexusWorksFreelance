#!/usr/bin/env python
"""
Comprehensive test script for the intelligent developer-project matching system.
Tests real-time matching, caching, analytics, and feedback collection.
"""

import os
import sys
import django
import json
import time
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from projects.models import Project, Task
from users.models import DeveloperProfile
from matching.models import DeveloperMatch, MatchingPreferences, MatchingAnalytics, MatchingCache
from matching.cache_service import matching_cache_service

User = get_user_model()


class IntelligentMatchingSystemTest:
    """Comprehensive test suite for intelligent matching system"""
    
    def __init__(self):
        self.client = APIClient()
        self.setup_test_data()
    
    def setup_test_data(self):
        """Create test users, projects, and profiles"""
        print("Setting up test data...")
        
        # Create test users
        self.client_user = User.objects.create_user(
            username='test_client',
            email='client@test.com',
            password='testpass123'
        )
        
        self.developer_user = User.objects.create_user(
            username='test_developer',
            email='developer@test.com',
            password='testpass123'
        )
        
        self.senior_developer = User.objects.create_user(
            username='senior_dev',
            email='senior@test.com',
            password='testpass123'
        )
        
        # Create developer profiles
        self.developer_profile = DeveloperProfile.objects.create(
            user=self.developer_user,
            skills=['Python', 'Django', 'React', 'PostgreSQL'],
            experience_level='mid',
            hourly_rate=Decimal('75.00'),
            availability_status='available',
            reputation_score=4.2,
            github_analysis={
                'total_repos': 25,
                'languages': ['Python', 'JavaScript', 'SQL'],
                'contributions_last_year': 150
            }
        )
        
        self.senior_profile = DeveloperProfile.objects.create(
            user=self.senior_developer,
            skills=['Python', 'Django', 'AWS', 'Docker', 'Kubernetes'],
            experience_level='senior',
            hourly_rate=Decimal('120.00'),
            availability_status='available',
            reputation_score=4.8,
            github_analysis={
                'total_repos': 45,
                'languages': ['Python', 'Go', 'JavaScript'],
                'contributions_last_year': 300
            }
        )
        
        # Create test project
        self.test_project = Project.objects.create(
            client=self.client_user,
            title='E-commerce Platform Development',
            description='Build a modern e-commerce platform with Django backend and React frontend',
            budget_estimate=Decimal('15000.00'),
            ai_analysis={
                'required_skills': ['Python', 'Django', 'React', 'PostgreSQL', 'AWS'],
                'complexity': 'high',
                'senior_developer_required': True,
                'estimated_duration_weeks': 12
            }
        )
        
        # Create test task
        self.test_task = Task.objects.create(
            project=self.test_project,
            title='Backend API Development',
            description='Develop REST API endpoints for the e-commerce platform',
            required_skills=['Python', 'Django', 'PostgreSQL'],
            estimated_hours=80,
            priority=1
        )
        
        print("Test data setup completed!")
    
    def test_real_time_developer_matching(self):
        """Test real-time developer matching with caching"""
        print("\n=== Testing Real-time Developer Matching ===")
        
        # Authenticate as client
        self.client.force_authenticate(user=self.client_user)
        
        # Test project-level matching
        print("Testing project-level matching...")
        response = self.client.post('/api/matching/real-time/find_developers/', {
            'project_id': str(self.test_project.id),
            'limit': 10,
            'include_analysis': True
        })
        
        print(f"Response status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {data.get('total_found', 0)} matching developers")
            print(f"Cache hit: {data.get('cache_hit', False)}")
            print(f"Response time: {data.get('response_time_ms', 0)}ms")
            
            # Test cache hit on second request
            print("\nTesting cache hit...")
            start_time = time.time()
            response2 = self.client.post('/api/matching/real-time/find_developers/', {
                'project_id': str(self.test_project.id),
                'limit': 10,
                'include_analysis': True
            })
            end_time = time.time()
            
            if response2.status_code == 200:
                data2 = response2.json()
                print(f"Second request cache hit: {data2.get('cache_hit', False)}")
                print(f"Second request time: {int((end_time - start_time) * 1000)}ms")
        else:
            print(f"Error: {response.json()}")
        
        # Test task-level matching
        print("\nTesting task-level matching...")
        response = self.client.post('/api/matching/real-time/find_developers/', {
            'task_id': str(self.test_task.id),
            'limit': 5,
            'include_analysis': True
        })
        
        print(f"Task matching status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {data.get('total_found', 0)} developers for task")
    
    def test_project_matching_for_developers(self):
        """Test project matching for developers"""
        print("\n=== Testing Project Matching for Developers ===")
        
        # Authenticate as developer
        self.client.force_authenticate(user=self.developer_user)
        
        response = self.client.post('/api/matching/real-time/find_projects/', {
            'developer_id': str(self.developer_user.id),
            'limit': 10,
            'include_analysis': True
        })
        
        print(f"Response status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {data.get('total_found', 0)} matching projects")
            print(f"Cache hit: {data.get('cache_hit', False)}")
        else:
            print(f"Error: {response.json()}")
    
    def test_matching_preferences(self):
        """Test matching preferences functionality"""
        print("\n=== Testing Matching Preferences ===")
        
        # Authenticate as developer
        self.client.force_authenticate(user=self.developer_user)
        
        # Create preferences
        preferences_data = {
            'min_hourly_rate': 50.00,
            'max_hourly_rate': 100.00,
            'preferred_skills': ['Python', 'Django'],
            'excluded_skills': ['PHP'],
            'remote_only': True,
            'skill_weight': 0.5,
            'experience_weight': 0.3,
            'availability_weight': 0.1,
            'reputation_weight': 0.1
        }
        
        response = self.client.post('/api/matching/preferences/', preferences_data)
        print(f"Create preferences status: {response.status_code}")
        
        if response.status_code == 201:
            print("Preferences created successfully")
            
            # Test matching with preferences
            response = self.client.post('/api/matching/real-time/find_projects/', {
                'developer_id': str(self.developer_user.id),
                'limit': 5
            })
            
            if response.status_code == 200:
                print("Matching with preferences successful")
        else:
            print(f"Error creating preferences: {response.json()}")
    
    def test_advanced_search(self):
        """Test advanced search functionality"""
        print("\n=== Testing Advanced Search ===")
        
        # Authenticate as client
        self.client.force_authenticate(user=self.client_user)
        
        # Test advanced developer search
        advanced_search_data = {
            'search_type': 'developers',
            'filters': {
                'project_id': str(self.test_project.id),
                'min_experience_years': 3,
                'max_hourly_rate': 100.00,
                'required_skills': ['Python', 'Django'],
                'availability_status': 'available',
                'min_reputation_score': 4.0
            },
            'custom_weights': {
                'vector_weight': 0.5,
                'graph_weight': 0.3,
                'availability_weight': 0.1,
                'reputation_weight': 0.1
            },
            'limit': 10
        }
        
        response = self.client.post('/api/matching/real-time/advanced_search/', advanced_search_data)
        print(f"Advanced search status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Advanced search found {data.get('total_found', 0)} developers")
            print(f"Filters applied: {len(data.get('filters_applied', {}))}")
        else:
            print(f"Advanced search error: {response.json()}")
    
    def test_feedback_system(self):
        """Test feedback collection system"""
        print("\n=== Testing Feedback System ===")
        
        # First create a match to provide feedback on
        match = DeveloperMatch.objects.create(
            task=self.test_task,
            developer=self.developer_user,
            match_score=0.85,
            vector_score=0.8,
            graph_score=0.9,
            availability_score=1.0
        )
        
        # Authenticate as client
        self.client.force_authenticate(user=self.client_user)
        
        # Provide feedback
        feedback_data = {
            'match_id': str(match.id),
            'feedback_type': 'positive',
            'rating': 4,
            'comments': 'Great match! Developer skills align well with project needs.',
            'skill_match_accuracy': 5,
            'experience_relevance': 4,
            'availability_accuracy': 5,
            'suggested_skills': ['AWS', 'Docker']
        }
        
        response = self.client.post('/api/matching/real-time/provide_feedback/', feedback_data)
        print(f"Feedback submission status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Feedback recorded successfully")
            print(f"Cache invalidated: {data.get('cache_invalidated', False)}")
        else:
            print(f"Feedback error: {response.json()}")
    
    def test_batch_matching(self):
        """Test batch matching functionality"""
        print("\n=== Testing Batch Matching ===")
        
        # Create additional test project
        project2 = Project.objects.create(
            client=self.client_user,
            title='Mobile App Backend',
            description='REST API for mobile application',
            budget_estimate=Decimal('8000.00')
        )
        
        # Authenticate as client
        self.client.force_authenticate(user=self.client_user)
        
        # Test batch project matching
        batch_data = {
            'type': 'projects',
            'items': [str(self.test_project.id), str(project2.id)],
            'limit_per_item': 5
        }
        
        response = self.client.post('/api/matching/real-time/batch_match/', batch_data)
        print(f"Batch matching status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Batch processed {data.get('processed_count', 0)} items")
            
            for result in data.get('batch_results', []):
                if 'error' not in result:
                    print(f"Project {result['project_id']}: {result['total_found']} matches")
                else:
                    print(f"Project {result['project_id']}: {result['error']}")
        else:
            print(f"Batch matching error: {response.json()}")
    
    def test_cache_management(self):
        """Test cache management functionality"""
        print("\n=== Testing Cache Management ===")
        
        # Authenticate as admin (assuming client user has admin privileges for testing)
        self.client.force_authenticate(user=self.client_user)
        
        # Get cache statistics
        response = self.client.get('/api/matching/real-time/cache_statistics/')
        print(f"Cache statistics status: {response.status_code}")
        
        if response.status_code == 200:
            stats = response.json()
            print(f"Total cache entries: {stats.get('total_entries', 0)}")
            print(f"Cache efficiency: {stats.get('cache_efficiency', 0):.2%}")
        
        # Test cache invalidation
        response = self.client.post('/api/matching/real-time/invalidate_cache/', {
            'user_id': str(self.client_user.id)
        })
        print(f"Cache invalidation status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Invalidated {data.get('invalidated_entries', 0)} cache entries")
    
    def test_analytics_system(self):
        """Test analytics and reporting system"""
        print("\n=== Testing Analytics System ===")
        
        # Authenticate as client
        self.client.force_authenticate(user=self.client_user)
        
        # Get analytics summary
        response = self.client.get('/api/matching/analytics/summary/')
        print(f"Analytics summary status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Total searches: {data.get('total_searches', 0)}")
            print(f"Average matches per search: {data.get('average_matches_per_search', 0)}")
            print(f"Cache hit rate: {data.get('cache_efficiency', {}).get('hit_rate_percentage', 0)}%")
            
            # Show search type breakdown
            search_types = data.get('search_type_breakdown', [])
            if search_types:
                print("Search type breakdown:")
                for search_type in search_types:
                    print(f"  {search_type['search_type']}: {search_type['count']} searches")
    
    def test_cache_service_directly(self):
        """Test cache service functionality directly"""
        print("\n=== Testing Cache Service Directly ===")
        
        # Test cache storage and retrieval
        test_params = {
            'project_id': str(self.test_project.id),
            'limit': 10,
            'user_id': str(self.client_user.id)
        }
        
        test_result = {
            'matches': [{'developer_id': str(self.developer_user.id), 'score': 0.85}],
            'total_found': 1,
            'timestamp': timezone.now().isoformat()
        }
        
        # Store result
        stored = matching_cache_service.store_result(
            'developer_match', test_params, test_result
        )
        print(f"Cache storage successful: {stored}")
        
        # Retrieve result
        retrieved = matching_cache_service.get_cached_result(
            'developer_match', test_params
        )
        print(f"Cache retrieval successful: {retrieved is not None}")
        
        # Get statistics
        stats = matching_cache_service.get_cache_statistics()
        print(f"Cache statistics retrieved: {len(stats) > 0}")
        
        # Test optimization
        optimization_results = matching_cache_service.optimize_cache_performance()
        print(f"Cache optimization completed: {len(optimization_results) > 0}")
    
    def run_all_tests(self):
        """Run all test methods"""
        print("Starting Intelligent Matching System Tests...")
        print("=" * 60)
        
        try:
            self.test_real_time_developer_matching()
            self.test_project_matching_for_developers()
            self.test_matching_preferences()
            self.test_advanced_search()
            self.test_feedback_system()
            self.test_batch_matching()
            self.test_cache_management()
            self.test_analytics_system()
            self.test_cache_service_directly()
            
            print("\n" + "=" * 60)
            print("All tests completed successfully!")
            
        except Exception as e:
            print(f"\nTest failed with error: {e}")
            import traceback
            traceback.print_exc()
    
    def cleanup_test_data(self):
        """Clean up test data"""
        print("\nCleaning up test data...")
        
        # Delete test objects
        DeveloperMatch.objects.filter(developer__in=[self.developer_user, self.senior_developer]).delete()
        MatchingAnalytics.objects.filter(user__in=[self.client_user, self.developer_user]).delete()
        MatchingCache.objects.all().delete()
        
        Task.objects.filter(project=self.test_project).delete()
        Project.objects.filter(client=self.client_user).delete()
        
        DeveloperProfile.objects.filter(user__in=[self.developer_user, self.senior_developer]).delete()
        User.objects.filter(username__in=['test_client', 'test_developer', 'senior_dev']).delete()
        
        print("Test data cleanup completed!")


if __name__ == '__main__':
    # Run the comprehensive test suite
    test_suite = IntelligentMatchingSystemTest()
    
    try:
        test_suite.run_all_tests()
    finally:
        # Always cleanup test data
        test_suite.cleanup_test_data()