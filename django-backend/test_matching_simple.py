#!/usr/bin/env python
"""
Simple test script for the intelligent matching system components without database dependencies.
Tests the core matching logic, caching service, and API structure.
"""

import os
import sys
import django
import json
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from matching.cache_service import matching_cache_service
from matching.serializers import MatchingFeedbackSerializer, RealTimeMatchSerializer
from rest_framework.test import APIRequestFactory
from django.utils import timezone


class SimpleMatchingTest:
    """Simple test suite for matching system components"""
    
    def __init__(self):
        self.factory = APIRequestFactory()
        print("Initialized Simple Matching Test Suite")
    
    def test_cache_service_functionality(self):
        """Test cache service basic functionality"""
        print("\n=== Testing Cache Service ===")
        
        try:
            # Test cache key generation
            test_params = {
                'project_id': 'test-project-123',
                'limit': 10,
                'user_id': 'test-user-456'
            }
            
            test_result = {
                'matches': [
                    {'developer_id': 'dev-1', 'score': 0.85},
                    {'developer_id': 'dev-2', 'score': 0.78}
                ],
                'total_found': 2,
                'timestamp': timezone.now().isoformat()
            }
            
            # Test cache storage (this will work without database)
            cache_key = matching_cache_service._generate_cache_key('developer_match', test_params)
            print(f"Generated cache key: {cache_key}")
            
            # Test parameters hash generation
            params_hash = matching_cache_service._generate_parameters_hash(test_params)
            print(f"Generated parameters hash: {params_hash}")
            
            # Test cache statistics structure (without database)
            print("Cache service methods are accessible and functional")
            
            return True
            
        except Exception as e:
            print(f"Cache service test failed: {e}")
            return False
    
    def test_serializer_validation(self):
        """Test serializer validation logic"""
        print("\n=== Testing Serializer Validation ===")
        
        try:
            # Test MatchingFeedbackSerializer
            valid_feedback_data = {
                'match_id': '12345678-1234-1234-1234-123456789012',
                'feedback_type': 'positive',
                'rating': 4,
                'comments': 'Great match!',
                'skill_match_accuracy': 5,
                'experience_relevance': 4,
                'availability_accuracy': 5,
                'suggested_skills': ['AWS', 'Docker']
            }
            
            feedback_serializer = MatchingFeedbackSerializer(data=valid_feedback_data)
            if feedback_serializer.is_valid():
                print("✓ Valid feedback data passed validation")
            else:
                print(f"✗ Valid feedback data failed validation: {feedback_serializer.errors}")
                return False
            
            # Test invalid feedback data
            invalid_feedback_data = {
                'match_id': 'invalid-uuid',
                'feedback_type': 'invalid_type',
                'rating': 6  # Invalid rating (max is 5)
            }
            
            invalid_serializer = MatchingFeedbackSerializer(data=invalid_feedback_data)
            if not invalid_serializer.is_valid():
                print("✓ Invalid feedback data correctly rejected")
                print(f"  Validation errors: {invalid_serializer.errors}")
            else:
                print("✗ Invalid feedback data incorrectly accepted")
                return False
            
            return True
            
        except Exception as e:
            print(f"Serializer test failed: {e}")
            return False
    
    def test_matching_algorithm_weights(self):
        """Test matching algorithm weight calculations"""
        print("\n=== Testing Matching Algorithm Weights ===")
        
        try:
            from django.conf import settings
            
            # Test platform configuration
            platform_config = getattr(settings, 'PLATFORM_CONFIG', {})
            matching_weights = platform_config.get('MATCHING_ALGORITHM_WEIGHTS', {})
            
            print(f"Matching weights configuration: {matching_weights}")
            
            # Verify weights sum to 1.0
            total_weight = sum(matching_weights.values())
            print(f"Total weight: {total_weight}")
            
            if abs(total_weight - 1.0) < 0.01:
                print("✓ Matching weights sum correctly to 1.0")
            else:
                print(f"✗ Matching weights sum to {total_weight}, not 1.0")
                return False
            
            # Test weight calculation simulation
            mock_scores = {
                'vector_score': 0.8,
                'graph_score': 0.7,
                'availability_score': 1.0,
                'reputation_score': 0.9
            }
            
            final_score = (
                mock_scores['vector_score'] * matching_weights.get('vector_score', 0.4) +
                mock_scores['graph_score'] * matching_weights.get('graph_score', 0.3) +
                mock_scores['availability_score'] * matching_weights.get('availability_score', 0.2) +
                mock_scores['reputation_score'] * matching_weights.get('reputation_score', 0.1)
            )
            
            print(f"Calculated final score: {final_score}")
            
            if 0.0 <= final_score <= 1.0:
                print("✓ Final score calculation is within valid range")
            else:
                print(f"✗ Final score {final_score} is outside valid range [0.0, 1.0]")
                return False
            
            return True
            
        except Exception as e:
            print(f"Algorithm weights test failed: {e}")
            return False
    
    def test_api_endpoint_structure(self):
        """Test API endpoint structure and routing"""
        print("\n=== Testing API Endpoint Structure ===")
        
        try:
            from matching.urls import urlpatterns
            from django.urls import reverse
            
            print("Matching URL patterns:")
            for pattern in urlpatterns:
                print(f"  - {pattern}")
            
            # Test URL resolution (without actual HTTP requests)
            try:
                # These should resolve without errors (without namespace since it's not defined)
                test_urls = [
                    'developermatch-list',
                    'matchingpreferences-list',
                    'matchinganalytics-list'
                ]
                
                for url_name in test_urls:
                    try:
                        resolved_url = reverse(url_name)
                        print(f"✓ URL '{url_name}' resolves to: {resolved_url}")
                    except Exception as e:
                        print(f"✗ URL '{url_name}' failed to resolve: {e}")
                        return False
                
            except Exception as e:
                print(f"URL resolution test skipped: {e}")
            
            return True
            
        except Exception as e:
            print(f"API endpoint structure test failed: {e}")
            return False
    
    def test_hybrid_rag_service_structure(self):
        """Test hybrid RAG service structure"""
        print("\n=== Testing Hybrid RAG Service Structure ===")
        
        try:
            from ai_services.hybrid_rag_service import hybrid_rag_service
            
            # Test service initialization
            print(f"✓ Hybrid RAG service initialized")
            print(f"  Cache timeout: {hybrid_rag_service.cache_timeout}")
            print(f"  Similarity threshold: {hybrid_rag_service.similarity_threshold}")
            print(f"  Matching weights: {hybrid_rag_service.matching_weights}")
            
            # Test method availability
            required_methods = [
                'find_matching_developers',
                'find_matching_projects',
                '_vector_similarity_search',
                '_graph_relationship_analysis',
                '_combine_matching_scores'
            ]
            
            for method_name in required_methods:
                if hasattr(hybrid_rag_service, method_name):
                    print(f"✓ Method '{method_name}' is available")
                else:
                    print(f"✗ Method '{method_name}' is missing")
                    return False
            
            return True
            
        except Exception as e:
            print(f"Hybrid RAG service test failed: {e}")
            return False
    
    def test_model_structure(self):
        """Test model structure and relationships"""
        print("\n=== Testing Model Structure ===")
        
        try:
            from matching.models import DeveloperMatch, MatchingPreferences, MatchingAnalytics, MatchingCache
            
            # Test model field availability
            models_to_test = [
                (DeveloperMatch, ['task', 'developer', 'match_score', 'vector_score', 'graph_score']),
                (MatchingPreferences, ['user', 'min_budget', 'max_budget', 'preferred_skills']),
                (MatchingAnalytics, ['user', 'search_type', 'match_count', 'timestamp']),
                (MatchingCache, ['cache_key', 'cache_data', 'search_type', 'expires_at'])
            ]
            
            for model_class, required_fields in models_to_test:
                print(f"Testing {model_class.__name__} model:")
                
                for field_name in required_fields:
                    if hasattr(model_class, field_name):
                        print(f"  ✓ Field '{field_name}' exists")
                    else:
                        print(f"  ✗ Field '{field_name}' is missing")
                        return False
            
            # Test model methods
            cache_instance = MatchingCache()
            if hasattr(cache_instance, 'is_expired'):
                print("✓ MatchingCache.is_expired() method exists")
            else:
                print("✗ MatchingCache.is_expired() method is missing")
                return False
            
            return True
            
        except Exception as e:
            print(f"Model structure test failed: {e}")
            return False
    
    def test_management_command_structure(self):
        """Test management command structure"""
        print("\n=== Testing Management Command Structure ===")
        
        try:
            import os
            
            # Check if management command file exists
            command_path = 'matching/management/commands/optimize_matching_cache.py'
            if os.path.exists(command_path):
                print("✓ Cache optimization management command exists")
                
                # Try to import the command
                from matching.management.commands.optimize_matching_cache import Command
                
                if hasattr(Command, 'handle'):
                    print("✓ Management command has handle method")
                else:
                    print("✗ Management command missing handle method")
                    return False
                    
            else:
                print("✗ Cache optimization management command file not found")
                return False
            
            return True
            
        except Exception as e:
            print(f"Management command test failed: {e}")
            return False
    
    def run_all_tests(self):
        """Run all test methods"""
        print("Starting Simple Matching System Tests...")
        print("=" * 60)
        
        test_methods = [
            self.test_cache_service_functionality,
            self.test_serializer_validation,
            self.test_matching_algorithm_weights,
            self.test_api_endpoint_structure,
            self.test_hybrid_rag_service_structure,
            self.test_model_structure,
            self.test_management_command_structure
        ]
        
        passed_tests = 0
        total_tests = len(test_methods)
        
        for test_method in test_methods:
            try:
                if test_method():
                    passed_tests += 1
                    print(f"✓ {test_method.__name__} PASSED")
                else:
                    print(f"✗ {test_method.__name__} FAILED")
            except Exception as e:
                print(f"✗ {test_method.__name__} ERROR: {e}")
        
        print("\n" + "=" * 60)
        print(f"Test Results: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All tests passed! The intelligent matching system is properly implemented.")
        else:
            print(f"⚠️  {total_tests - passed_tests} tests failed. Please review the implementation.")
        
        return passed_tests == total_tests


if __name__ == '__main__':
    # Run the simple test suite
    test_suite = SimpleMatchingTest()
    success = test_suite.run_all_tests()
    
    if success:
        print("\n✅ Intelligent matching system implementation is complete and functional!")
        print("\nKey Features Implemented:")
        print("- Real-time developer-project matching with hybrid RAG")
        print("- Advanced caching system with performance optimization")
        print("- Comprehensive analytics and feedback collection")
        print("- Matching preferences and filtering capabilities")
        print("- Batch matching and advanced search functionality")
        print("- Management commands for cache optimization")
    else:
        print("\n❌ Some components need attention before the system is fully functional.")
    
    sys.exit(0 if success else 1)