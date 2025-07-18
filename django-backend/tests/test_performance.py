"""
Performance tests for critical system components
"""
import time
import statistics
from decimal import Decimal
from datetime import timedelta
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.db import connection
from django.test.utils import override_settings
from unittest.mock import patch

from projects.models import Project, Task
from users.models import DeveloperProfile
from ai_services.models import SkillEmbedding, MatchingResult
from matching.views import MatchingService
from ai_services.hybrid_rag_service import HybridRAGService

User = get_user_model()


class MatchingPerformanceTest(TransactionTestCase):
    """Performance tests for matching algorithms"""
    
    def setUp(self):
        """Set up large dataset for performance testing"""
        # Create client
        self.client_user = User.objects.create_user(
            email='client@example.com',
            password='testpass123',
            role='client'
        )
        
        # Create skill embeddings
        skills = [
            'Python', 'Django', 'React', 'JavaScript', 'TypeScript',
            'Java', 'Spring', 'Angular', 'Vue.js', 'Node.js',
            'C#', '.NET', 'PHP', 'Laravel', 'Ruby', 'Rails',
            'Go', 'Rust', 'Swift', 'Kotlin', 'Flutter', 'React Native'
        ]
        
        for skill in skills:
            SkillEmbedding.objects.create(
                skill_name=skill,
                embedding_vector=[0.1, 0.2, 0.3, 0.4, 0.5] * 20,
                model_version='test-model',
                confidence_score=0.9
            )
        
        # Create large number of developers
        self.developers = []
        skill_combinations = [
            ['Python', 'Django', 'React'],
            ['JavaScript', 'React', 'Node.js'],
            ['Java', 'Spring', 'Angular'],
            ['C#', '.NET', 'TypeScript'],
            ['PHP', 'Laravel', 'Vue.js'],
            ['Ruby', 'Rails', 'JavaScript'],
            ['Go', 'React', 'TypeScript'],
            ['Python', 'Django', 'Vue.js']
        ]
        
        for i in range(200):  # Create 200 developers
            user = User.objects.create_user(
                email=f'dev{i}@example.com',
                password='testpass123',
                role='developer',
                github_username=f'dev{i}'
            )
            
            skills = skill_combinations[i % len(skill_combinations)]
            
            DeveloperProfile.objects.create(
                user=user,
                skills=skills,
                experience_level=['junior', 'mid', 'senior'][i % 3],
                hourly_rate=Decimal(str(50 + (i % 100))),
                availability_status='available',
                reputation_score=float(i % 10)
            )
            
            self.developers.append(user)
    
    def test_matching_algorithm_performance(self):
        """Test matching algorithm performance with large dataset"""
        # Create project
        project = Project.objects.create(
            client=self.client_user,
            title='Performance Test Project',
            description='Testing matching performance with large dataset',
            budget_estimate=Decimal('10000.00'),
            timeline_estimate=timedelta(days=30)
        )
        
        # Create multiple tasks
        tasks = []
        for i in range(5):
            task = Task.objects.create(
                project=project,
                title=f'Task {i+1}',
                description=f'Performance test task {i+1}',
                required_skills=['Python', 'Django', 'React'][:(i % 3) + 1],
                estimated_hours=20 + (i * 10),
                priority=i + 1
            )
            tasks.append(task)
        
        # Measure matching performance
        matching_service = MatchingService()
        
        # Run multiple iterations to get average performance
        times = []
        for _ in range(5):
            start_time = time.time()
            matches = matching_service.find_matches(project)
            end_time = time.time()
            times.append(end_time - start_time)
        
        avg_time = statistics.mean(times)
        max_time = max(times)
        
        # Performance assertions
        self.assertLess(avg_time, 3.0, f"Average matching time {avg_time:.2f}s exceeds 3s threshold")
        self.assertLess(max_time, 5.0, f"Maximum matching time {max_time:.2f}s exceeds 5s threshold")
        self.assertTrue(len(matches) > 0, "No matches found")
        
        # Verify results quality
        if len(matches) > 1:
            # Check that results are properly sorted by match score
            for i in range(len(matches) - 1):
                self.assertGreaterEqual(
                    matches[i]['match_score'], 
                    matches[i + 1]['match_score'],
                    "Matches not properly sorted by score"
                )
    
    def test_database_query_performance(self):
        """Test database query performance for matching operations"""
        # Reset query count
        connection.queries_log.clear()
        
        project = Project.objects.create(
            client=self.client_user,
            title='DB Performance Test',
            description='Testing database query performance',
            budget_estimate=Decimal('5000.00'),
            timeline_estimate=timedelta(days=20)
        )
        
        # Create task
        task = Task.objects.create(
            project=project,
            title='Test Task',
            description='Database performance test task',
            required_skills=['Python', 'Django'],
            estimated_hours=40,
            priority=1
        )
        
        # Measure query performance
        start_queries = len(connection.queries)
        start_time = time.time()
        
        # Perform matching operation
        matching_service = MatchingService()
        matches = matching_service.find_matches(project)
        
        end_time = time.time()
        end_queries = len(connection.queries)
        
        query_count = end_queries - start_queries
        query_time = end_time - start_time
        
        # Performance assertions
        self.assertLess(query_count, 50, f"Too many database queries: {query_count}")
        self.assertLess(query_time, 2.0, f"Database queries too slow: {query_time:.2f}s")
    
    @patch('ai_services.embedding_service.EmbeddingService.get_embedding')
    def test_vector_similarity_performance(self, mock_embedding):
        """Test vector similarity search performance"""
        mock_embedding.return_value = [0.1, 0.2, 0.3, 0.4, 0.5] * 20
        
        # Create project with complex requirements
        project = Project.objects.create(
            client=self.client_user,
            title='Vector Performance Test',
            description='Testing vector similarity performance',
            budget_estimate=Decimal('8000.00'),
            timeline_estimate=timedelta(days=25)
        )
        
        # Test vector similarity search
        rag_service = HybridRAGService()
        
        times = []
        for _ in range(10):
            start_time = time.time()
            results = rag_service.vector_similarity_search(
                project_requirements=['Python', 'Django', 'React', 'PostgreSQL'],
                limit=50
            )
            end_time = time.time()
            times.append(end_time - start_time)
        
        avg_time = statistics.mean(times)
        
        # Performance assertions
        self.assertLess(avg_time, 1.0, f"Vector similarity search too slow: {avg_time:.2f}s")
        self.assertTrue(len(results) > 0, "No vector similarity results")
    
    def test_concurrent_matching_performance(self):
        """Test performance under concurrent matching requests"""
        import threading
        import queue
        
        # Create multiple projects
        projects = []
        for i in range(10):
            project = Project.objects.create(
                client=self.client_user,
                title=f'Concurrent Test Project {i}',
                description=f'Concurrent matching test {i}',
                budget_estimate=Decimal('5000.00'),
                timeline_estimate=timedelta(days=15)
            )
            projects.append(project)
        
        # Function to run matching in thread
        def run_matching(project, result_queue):
            try:
                start_time = time.time()
                matching_service = MatchingService()
                matches = matching_service.find_matches(project)
                end_time = time.time()
                
                result_queue.put({
                    'project_id': project.id,
                    'time': end_time - start_time,
                    'matches': len(matches),
                    'success': True
                })
            except Exception as e:
                result_queue.put({
                    'project_id': project.id,
                    'error': str(e),
                    'success': False
                })
        
        # Run concurrent matching
        result_queue = queue.Queue()
        threads = []
        
        start_time = time.time()
        
        for project in projects:
            thread = threading.Thread(target=run_matching, args=(project, result_queue))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Collect results
        results = []
        while not result_queue.empty():
            results.append(result_queue.get())
        
        # Performance assertions
        self.assertEqual(len(results), 10, "Not all concurrent requests completed")
        
        successful_results = [r for r in results if r['success']]
        self.assertEqual(len(successful_results), 10, "Some concurrent requests failed")
        
        # Check individual request times
        individual_times = [r['time'] for r in successful_results]
        avg_individual_time = statistics.mean(individual_times)
        max_individual_time = max(individual_times)
        
        self.assertLess(avg_individual_time, 5.0, f"Average concurrent request time too high: {avg_individual_time:.2f}s")
        self.assertLess(max_individual_time, 10.0, f"Maximum concurrent request time too high: {max_individual_time:.2f}s")
        self.assertLess(total_time, 15.0, f"Total concurrent execution time too high: {total_time:.2f}s")


class DatabasePerformanceTest(TestCase):
    """Performance tests for database operations"""
    
    def setUp(self):
        """Set up test data"""
        self.client_user = User.objects.create_user(
            email='client@example.com',
            password='testpass123',
            role='client'
        )
    
    def test_bulk_developer_creation_performance(self):
        """Test performance of bulk developer creation"""
        # Prepare bulk data
        users_data = []
        profiles_data = []
        
        for i in range(100):
            users_data.append(User(
                email=f'bulk_dev{i}@example.com',
                role='developer',
                github_username=f'bulk_dev{i}'
            ))
        
        # Measure bulk creation time
        start_time = time.time()
        
        # Bulk create users
        users = User.objects.bulk_create(users_data)
        
        # Bulk create profiles
        for user in users:
            profiles_data.append(DeveloperProfile(
                user=user,
                skills=['Python', 'Django'],
                experience_level='mid',
                hourly_rate=Decimal('75.00')
            ))
        
        DeveloperProfile.objects.bulk_create(profiles_data)
        
        end_time = time.time()
        creation_time = end_time - start_time
        
        # Performance assertion
        self.assertLess(creation_time, 2.0, f"Bulk creation too slow: {creation_time:.2f}s")
        
        # Verify data was created
        self.assertEqual(User.objects.filter(email__startswith='bulk_dev').count(), 100)
        self.assertEqual(DeveloperProfile.objects.filter(user__email__startswith='bulk_dev').count(), 100)
    
    def test_complex_query_performance(self):
        """Test performance of complex queries"""
        # Create test data
        developers = []
        for i in range(50):
            user = User.objects.create_user(
                email=f'query_dev{i}@example.com',
                password='testpass123',
                role='developer'
            )
            
            DeveloperProfile.objects.create(
                user=user,
                skills=['Python', 'Django', 'React'][:(i % 3) + 1],
                experience_level=['junior', 'mid', 'senior'][i % 3],
                hourly_rate=Decimal(str(50 + i)),
                availability_status='available',
                reputation_score=float(i % 10)
            )
            developers.append(user)
        
        # Test complex query performance
        start_time = time.time()
        
        # Complex query with joins, filters, and ordering
        results = DeveloperProfile.objects.select_related('user').filter(
            availability_status='available',
            experience_level__in=['mid', 'senior'],
            hourly_rate__lte=Decimal('100.00'),
            reputation_score__gte=5.0
        ).order_by('-reputation_score', 'hourly_rate')[:10]
        
        # Force evaluation
        list(results)
        
        end_time = time.time()
        query_time = end_time - start_time
        
        # Performance assertion
        self.assertLess(query_time, 0.5, f"Complex query too slow: {query_time:.2f}s")
    
    def test_matching_result_bulk_operations(self):
        """Test performance of bulk matching result operations"""
        # Create project and developers
        project = Project.objects.create(
            client=self.client_user,
            title='Bulk Test Project',
            description='Testing bulk operations',
            budget_estimate=Decimal('5000.00'),
            timeline_estimate=timedelta(days=20)
        )
        
        developers = []
        for i in range(100):
            user = User.objects.create_user(
                email=f'bulk_match_dev{i}@example.com',
                password='testpass123',
                role='developer'
            )
            developers.append(user)
        
        # Test bulk matching result creation
        matching_results = []
        for i, developer in enumerate(developers):
            matching_results.append(MatchingResult(
                project=project,
                developer=developer,
                match_score=0.5 + (i % 50) / 100.0,
                skill_match_score=0.6 + (i % 40) / 100.0,
                availability_score=1.0,
                experience_match_score=0.7 + (i % 30) / 100.0,
                algorithm_version='test-v1'
            ))
        
        start_time = time.time()
        MatchingResult.objects.bulk_create(matching_results)
        end_time = time.time()
        
        creation_time = end_time - start_time
        
        # Performance assertion
        self.assertLess(creation_time, 1.0, f"Bulk matching result creation too slow: {creation_time:.2f}s")
        
        # Verify data was created
        self.assertEqual(MatchingResult.objects.filter(project=project).count(), 100)