"""
End-to-end tests for AI matching pipeline
"""
import json
from decimal import Decimal
from datetime import timedelta
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock

from projects.models import Project, Task
from users.models import DeveloperProfile
from ai_services.models import (
    SkillEmbedding, ProjectAnalysisResult, DeveloperSkillAnalysis, MatchingResult
)
from ai_services.hybrid_rag_service import HybridRAGService
from ai_services.project_analysis import ProjectAnalysisService
from matching.views import MatchingService

User = get_user_model()


class AIMatchingPipelineE2ETest(TransactionTestCase):
    """End-to-end tests for complete AI matching pipeline"""
    
    def setUp(self):
        """Set up test data"""
        # Create client
        self.client_user = User.objects.create_user(
            email='client@example.com',
            password='testpass123',
            role='client'
        )
        
        # Create developers with different skill sets
        self.python_dev = User.objects.create_user(
            email='python_dev@example.com',
            password='testpass123',
            role='developer',
            github_username='pythondev'
        )
        
        self.react_dev = User.objects.create_user(
            email='react_dev@example.com',
            password='testpass123',
            role='developer',
            github_username='reactdev'
        )
        
        self.fullstack_dev = User.objects.create_user(
            email='fullstack_dev@example.com',
            password='testpass123',
            role='developer',
            github_username='fullstackdev'
        )
        
        # Create developer profiles
        DeveloperProfile.objects.create(
            user=self.python_dev,
            skills=['Python', 'Django', 'PostgreSQL', 'REST API'],
            experience_level='mid',
            hourly_rate=Decimal('75.00'),
            availability_status='available',
            github_analysis={
                'repositories': 20,
                'languages': ['Python'],
                'total_commits': 800,
                'avg_complexity': 7.2
            }
        )
        
        DeveloperProfile.objects.create(
            user=self.react_dev,
            skills=['React', 'JavaScript', 'TypeScript', 'CSS', 'HTML'],
            experience_level='mid',
            hourly_rate=Decimal('70.00'),
            availability_status='available',
            github_analysis={
                'repositories': 15,
                'languages': ['JavaScript', 'TypeScript'],
                'total_commits': 600,
                'avg_complexity': 6.5
            }
        )
        
        DeveloperProfile.objects.create(
            user=self.fullstack_dev,
            skills=['Python', 'Django', 'React', 'JavaScript', 'PostgreSQL'],
            experience_level='senior',
            hourly_rate=Decimal('120.00'),
            availability_status='available',
            github_analysis={
                'repositories': 35,
                'languages': ['Python', 'JavaScript', 'TypeScript'],
                'total_commits': 1500,
                'avg_complexity': 8.5
            }
        )
        
        # Create skill embeddings (mock data)
        skills = ['Python', 'Django', 'React', 'JavaScript', 'PostgreSQL', 'REST API']
        for skill in skills:
            SkillEmbedding.objects.create(
                skill_name=skill,
                embedding_vector=[0.1, 0.2, 0.3, 0.4, 0.5] * 20,  # 100-dim vector
                model_version='sentence-transformers/all-MiniLM-L6-v2',
                confidence_score=0.9
            )
    
    @patch('ai_services.gemini_client.GeminiClient.analyze_project')
    @patch('ai_services.embedding_service.EmbeddingService.get_embedding')
    @patch('ai_services.neo4j_service.Neo4jService.find_related_skills')
    def test_complete_ai_matching_pipeline(self, mock_neo4j, mock_embedding, mock_gemini):
        """Test complete AI matching pipeline from project creation to developer matching"""
        
        # Mock Gemini API response
        mock_gemini.return_value = {
            'complexity_score': 8.0,
            'required_skills': ['Python', 'Django', 'React', 'PostgreSQL'],
            'estimated_timeline': 45,
            'budget_estimate': {'min': 12000, 'max': 18000},
            'task_breakdown': [
                {
                    'title': 'Backend API Development',
                    'description': 'Develop REST API with Django',
                    'skills': ['Python', 'Django', 'PostgreSQL', 'REST API'],
                    'estimated_hours': 60,
                    'priority': 1
                },
                {
                    'title': 'Frontend Development',
                    'description': 'Build React frontend',
                    'skills': ['React', 'JavaScript', 'CSS'],
                    'estimated_hours': 40,
                    'priority': 2
                }
            ],
            'senior_developer_required': True
        }
        
        # Mock embedding service
        mock_embedding.return_value = [0.1, 0.2, 0.3, 0.4, 0.5] * 20
        
        # Mock Neo4j related skills
        mock_neo4j.return_value = {
            'Python': ['Django', 'Flask', 'FastAPI'],
            'React': ['JavaScript', 'TypeScript', 'Redux'],
            'Django': ['Python', 'PostgreSQL', 'REST API']
        }
        
        # Step 1: Create project
        project = Project.objects.create(
            client=self.client_user,
            title='E-commerce Platform',
            description='Build a full-stack e-commerce platform with Django backend and React frontend. Need user authentication, product catalog, shopping cart, and payment integration.',
            budget_estimate=Decimal('15000.00'),
            timeline_estimate=timedelta(days=45),
            status='analyzing'
        )
        
        # Step 2: Run AI project analysis
        analysis_service = ProjectAnalysisService()
        analysis_result = analysis_service.analyze_project(project)
        
        # Verify analysis was created
        self.assertIsNotNone(analysis_result)
        analysis_obj = ProjectAnalysisResult.objects.get(project=project)
        self.assertEqual(analysis_obj.complexity_score, 8.0)
        self.assertIn('Python', analysis_obj.required_skills)
        self.assertIn('React', analysis_obj.required_skills)
        self.assertTrue(analysis_obj.senior_developer_required)
        
        # Step 3: Create tasks based on analysis
        for task_data in mock_gemini.return_value['task_breakdown']:
            Task.objects.create(
                project=project,
                title=task_data['title'],
                description=task_data['description'],
                required_skills=task_data['skills'],
                estimated_hours=task_data['estimated_hours'],
                priority=task_data['priority']
            )
        
        # Step 4: Run matching algorithm
        matching_service = MatchingService()
        matches = matching_service.find_matches(project)
        
        # Verify matches were created
        self.assertTrue(len(matches) > 0)
        
        # Check that fullstack developer has highest match score
        fullstack_match = next((m for m in matches if m['developer_id'] == str(self.fullstack_dev.id)), None)
        self.assertIsNotNone(fullstack_match)
        
        # Fullstack dev should have high score due to having both Python and React skills
        self.assertGreater(fullstack_match['match_score'], 0.8)
        
        # Step 5: Verify matching results in database
        matching_results = MatchingResult.objects.filter(project=project)
        self.assertTrue(matching_results.exists())
        
        # Check that all developers were evaluated
        developer_ids = set(str(mr.developer.id) for mr in matching_results)
        expected_ids = {str(self.python_dev.id), str(self.react_dev.id), str(self.fullstack_dev.id)}
        self.assertEqual(developer_ids, expected_ids)
    
    @patch('ai_services.github_client.GitHubClient.analyze_repositories')
    @patch('ai_services.embedding_service.EmbeddingService.get_embedding')
    def test_developer_skill_analysis_pipeline(self, mock_embedding, mock_github):
        """Test developer skill analysis and profile updates"""
        
        # Mock GitHub analysis
        mock_github.return_value = {
            'repositories': [
                {
                    'name': 'django-ecommerce',
                    'languages': {'Python': 85, 'JavaScript': 15},
                    'complexity_score': 8.2,
                    'commits': 150,
                    'technologies': ['Django', 'PostgreSQL', 'Redis']
                },
                {
                    'name': 'react-dashboard',
                    'languages': {'JavaScript': 70, 'TypeScript': 30},
                    'complexity_score': 7.5,
                    'commits': 80,
                    'technologies': ['React', 'Redux', 'Material-UI']
                }
            ],
            'overall_stats': {
                'total_commits': 230,
                'languages': ['Python', 'JavaScript', 'TypeScript'],
                'avg_complexity': 7.85,
                'experience_indicators': ['senior_level_projects', 'consistent_commits']
            }
        }
        
        mock_embedding.return_value = [0.1, 0.2, 0.3, 0.4, 0.5] * 20
        
        # Run skill analysis
        from ai_services.tasks import update_developer_skills
        update_developer_skills(str(self.fullstack_dev.id))
        
        # Verify skill analysis was created
        skill_analysis = DeveloperSkillAnalysis.objects.filter(developer=self.fullstack_dev).first()
        self.assertIsNotNone(skill_analysis)
        self.assertGreater(skill_analysis.overall_score, 7.0)
        
        # Verify profile was updated
        profile = DeveloperProfile.objects.get(user=self.fullstack_dev)
        self.assertIn('Django', profile.skills)
        self.assertIn('React', profile.skills)
    
    @patch('ai_services.hybrid_rag_service.HybridRAGService.vector_similarity_search')
    @patch('ai_services.hybrid_rag_service.HybridRAGService.graph_relationship_search')
    def test_hybrid_rag_matching_accuracy(self, mock_graph_search, mock_vector_search):
        """Test hybrid RAG matching accuracy and ranking"""
        
        # Mock vector similarity scores
        mock_vector_search.return_value = [
            {'developer_id': str(self.fullstack_dev.id), 'score': 0.92},
            {'developer_id': str(self.python_dev.id), 'score': 0.85},
            {'developer_id': str(self.react_dev.id), 'score': 0.78}
        ]
        
        # Mock graph relationship scores
        mock_graph_search.return_value = [
            {'developer_id': str(self.fullstack_dev.id), 'score': 0.88},
            {'developer_id': str(self.python_dev.id), 'score': 0.82},
            {'developer_id': str(self.react_dev.id), 'score': 0.75}
        ]
        
        # Create project requiring both Python and React
        project = Project.objects.create(
            client=self.client_user,
            title='Full-stack Application',
            description='Need both backend and frontend development',
            budget_estimate=Decimal('10000.00'),
            timeline_estimate=timedelta(days=30)
        )
        
        # Create project analysis
        ProjectAnalysisResult.objects.create(
            project=project,
            complexity_score=7.5,
            required_skills=['Python', 'Django', 'React', 'JavaScript'],
            estimated_timeline=timedelta(days=30),
            senior_developer_required=False
        )
        
        # Run hybrid RAG matching
        rag_service = HybridRAGService()
        matches = rag_service.find_best_matches(project, limit=3)
        
        # Verify ranking - fullstack developer should be first
        self.assertEqual(len(matches), 3)
        self.assertEqual(matches[0]['developer_id'], str(self.fullstack_dev.id))
        self.assertGreater(matches[0]['combined_score'], matches[1]['combined_score'])
        self.assertGreater(matches[1]['combined_score'], matches[2]['combined_score'])
    
    def test_matching_performance_with_large_dataset(self):
        """Test matching performance with larger dataset"""
        import time
        
        # Create additional developers
        developers = []
        for i in range(50):
            user = User.objects.create_user(
                email=f'dev{i}@example.com',
                password='testpass123',
                role='developer',
                github_username=f'dev{i}'
            )
            
            # Vary skills randomly
            skill_sets = [
                ['Python', 'Django'],
                ['JavaScript', 'React'],
                ['Java', 'Spring'],
                ['C#', '.NET'],
                ['PHP', 'Laravel'],
                ['Ruby', 'Rails']
            ]
            
            DeveloperProfile.objects.create(
                user=user,
                skills=skill_sets[i % len(skill_sets)],
                experience_level='mid',
                hourly_rate=Decimal('75.00'),
                availability_status='available'
            )
            developers.append(user)
        
        # Create project
        project = Project.objects.create(
            client=self.client_user,
            title='Performance Test Project',
            description='Testing matching performance',
            budget_estimate=Decimal('5000.00'),
            timeline_estimate=timedelta(days=20)
        )
        
        # Measure matching time
        start_time = time.time()
        matching_service = MatchingService()
        matches = matching_service.find_matches(project)
        end_time = time.time()
        
        matching_time = end_time - start_time
        
        # Verify performance (should complete within reasonable time)
        self.assertLess(matching_time, 5.0)  # Should complete within 5 seconds
        self.assertTrue(len(matches) > 0)
        
        # Verify results are properly ranked
        if len(matches) > 1:
            for i in range(len(matches) - 1):
                self.assertGreaterEqual(matches[i]['match_score'], matches[i + 1]['match_score'])