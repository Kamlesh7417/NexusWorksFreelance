"""
Unit tests for AI Services models
"""
import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from ai_services.models import (
    SkillEmbedding, ProjectAnalysisResult, DeveloperSkillAnalysis,
    MatchingResult, ResumeDocument, ProfileAnalysisCombined
)
from projects.models import Project
from decimal import Decimal
from datetime import timedelta

User = get_user_model()


class SkillEmbeddingModelTest(TestCase):
    """Test cases for SkillEmbedding model"""
    
    def setUp(self):
        """Set up test data"""
        self.embedding_data = {
            'skill_name': 'Python',
            'embedding_vector': [0.1, 0.2, 0.3, 0.4, 0.5],
            'model_version': 'sentence-transformers/all-MiniLM-L6-v2',
            'confidence_score': 0.95
        }
    
    def test_create_skill_embedding(self):
        """Test creating a skill embedding"""
        embedding = SkillEmbedding.objects.create(**self.embedding_data)
        
        self.assertEqual(embedding.skill_name, 'Python')
        self.assertEqual(embedding.embedding_vector, [0.1, 0.2, 0.3, 0.4, 0.5])
        self.assertEqual(embedding.model_version, 'sentence-transformers/all-MiniLM-L6-v2')
        self.assertEqual(embedding.confidence_score, 0.95)
        self.assertIsNotNone(embedding.created_at)
    
    def test_skill_embedding_str_representation(self):
        """Test skill embedding string representation"""
        embedding = SkillEmbedding.objects.create(**self.embedding_data)
        expected_str = f"Python - sentence-transformers/all-MiniLM-L6-v2"
        self.assertEqual(str(embedding), expected_str)
    
    def test_skill_name_unique(self):
        """Test that skill name must be unique per model version"""
        SkillEmbedding.objects.create(**self.embedding_data)
        
        # Same skill name and model version should raise error
        with self.assertRaises(Exception):
            SkillEmbedding.objects.create(**self.embedding_data)


class ProjectAnalysisResultModelTest(TestCase):
    """Test cases for ProjectAnalysisResult model"""
    
    def setUp(self):
        """Set up test data"""
        self.client = User.objects.create(
            email='client@example.com',
            role='client'
        )
        
        self.project = Project.objects.create(
            client=self.client,
            title='Test Project',
            description='A test project',
            budget_estimate=Decimal('5000.00'),
            timeline_estimate=timedelta(days=15)
        )
        
        self.analysis_data = {
            'project': self.project,
            'complexity_score': 7.5,
            'required_skills': ['Python', 'Django', 'React'],
            'estimated_timeline': timedelta(days=20),
            'budget_range': {'min': 4000, 'max': 6000},
            'task_breakdown': [
                {'title': 'Backend API', 'hours': 40},
                {'title': 'Frontend UI', 'hours': 30}
            ],
            'senior_developer_required': True,
            'analysis_version': '1.0'
        }
    
    def test_create_project_analysis(self):
        """Test creating a project analysis result"""
        analysis = ProjectAnalysisResult.objects.create(**self.analysis_data)
        
        self.assertEqual(analysis.project, self.project)
        self.assertEqual(analysis.complexity_score, 7.5)
        self.assertEqual(analysis.required_skills, ['Python', 'Django', 'React'])
        self.assertTrue(analysis.senior_developer_required)
        self.assertIsNotNone(analysis.created_at)
    
    def test_project_analysis_str_representation(self):
        """Test project analysis string representation"""
        analysis = ProjectAnalysisResult.objects.create(**self.analysis_data)
        expected_str = f"Analysis for Test Project (Score: 7.5)"
        self.assertEqual(str(analysis), expected_str)


class DeveloperSkillAnalysisModelTest(TestCase):
    """Test cases for DeveloperSkillAnalysis model"""
    
    def setUp(self):
        """Set up test data"""
        self.developer = User.objects.create(
            email='dev@example.com',
            role='developer',
            github_username='testdev'
        )
        
        self.skill_analysis_data = {
            'developer': self.developer,
            'github_analysis': {
                'repositories': 15,
                'languages': ['Python', 'JavaScript', 'TypeScript'],
                'total_commits': 500
            },
            'resume_analysis': {
                'experience_years': 5,
                'education': 'Computer Science',
                'certifications': ['AWS Certified']
            },
            'skill_scores': {
                'Python': 0.9,
                'Django': 0.8,
                'React': 0.7
            },
            'overall_score': 8.2,
            'analysis_version': '1.0'
        }
    
    def test_create_developer_skill_analysis(self):
        """Test creating a developer skill analysis"""
        analysis = DeveloperSkillAnalysis.objects.create(**self.skill_analysis_data)
        
        self.assertEqual(analysis.developer, self.developer)
        self.assertEqual(analysis.overall_score, 8.2)
        self.assertEqual(analysis.skill_scores['Python'], 0.9)
        self.assertIsNotNone(analysis.created_at)
    
    def test_developer_skill_analysis_str_representation(self):
        """Test developer skill analysis string representation"""
        analysis = DeveloperSkillAnalysis.objects.create(**self.skill_analysis_data)
        expected_str = f"Skill Analysis for dev@example.com (Score: 8.2)"
        self.assertEqual(str(analysis), expected_str)


class MatchingResultModelTest(TestCase):
    """Test cases for MatchingResult model"""
    
    def setUp(self):
        """Set up test data"""
        self.client = User.objects.create(
            email='client@example.com',
            role='client'
        )
        
        self.developer = User.objects.create(
            email='dev@example.com',
            role='developer'
        )
        
        self.project = Project.objects.create(
            client=self.client,
            title='Test Project',
            description='A test project',
            budget_estimate=Decimal('5000.00'),
            timeline_estimate=timedelta(days=15)
        )
        
        self.matching_data = {
            'project': self.project,
            'developer': self.developer,
            'match_score': 0.85,
            'skill_match_score': 0.9,
            'availability_score': 0.8,
            'experience_match_score': 0.85,
            'matching_details': {
                'matched_skills': ['Python', 'Django'],
                'missing_skills': ['React'],
                'experience_level': 'mid'
            },
            'algorithm_version': '1.0'
        }
    
    def test_create_matching_result(self):
        """Test creating a matching result"""
        result = MatchingResult.objects.create(**self.matching_data)
        
        self.assertEqual(result.project, self.project)
        self.assertEqual(result.developer, self.developer)
        self.assertEqual(result.match_score, 0.85)
        self.assertEqual(result.skill_match_score, 0.9)
        self.assertIsNotNone(result.created_at)
    
    def test_matching_result_str_representation(self):
        """Test matching result string representation"""
        result = MatchingResult.objects.create(**self.matching_data)
        expected_str = f"Match: dev@example.com -> Test Project (Score: 0.85)"
        self.assertEqual(str(result), expected_str)


class ResumeDocumentModelTest(TestCase):
    """Test cases for ResumeDocument model"""
    
    def setUp(self):
        """Set up test data"""
        self.developer = User.objects.create(
            email='dev@example.com',
            role='developer'
        )
        
        self.resume_data = {
            'developer': self.developer,
            'file_name': 'resume.pdf',
            'file_size': 1024000,
            'content_type': 'application/pdf',
            'extracted_text': 'John Doe\nSoftware Engineer\n5 years experience...',
            'parsing_status': 'completed',
            'parsed_data': {
                'name': 'John Doe',
                'experience_years': 5,
                'skills': ['Python', 'Django', 'React'],
                'education': 'Computer Science'
            }
        }
    
    def test_create_resume_document(self):
        """Test creating a resume document"""
        resume = ResumeDocument.objects.create(**self.resume_data)
        
        self.assertEqual(resume.developer, self.developer)
        self.assertEqual(resume.file_name, 'resume.pdf')
        self.assertEqual(resume.parsing_status, 'completed')
        self.assertEqual(resume.parsed_data['name'], 'John Doe')
        self.assertIsNotNone(resume.uploaded_at)
    
    def test_resume_document_str_representation(self):
        """Test resume document string representation"""
        resume = ResumeDocument.objects.create(**self.resume_data)
        expected_str = f"Resume: dev@example.com - resume.pdf"
        self.assertEqual(str(resume), expected_str)
    
    def test_parsing_status_choices(self):
        """Test parsing status validation"""
        valid_statuses = ['pending', 'processing', 'completed', 'failed']
        
        for status in valid_statuses:
            resume_data = self.resume_data.copy()
            resume_data['parsing_status'] = status
            resume_data['file_name'] = f'resume_{status}.pdf'
            resume = ResumeDocument.objects.create(**resume_data)
            self.assertEqual(resume.parsing_status, status)