"""
Project Analysis Engine using Google Gemini AI
"""
import logging
from typing import Dict, List, Optional, Any
from decimal import Decimal
from datetime import timedelta
from django.conf import settings
from django.utils import timezone

from .gemini_client import GeminiClient, ProjectAnalysisResult
from .exceptions import (
    ProjectAnalysisException, 
    GeminiAPIException, 
    ServiceUnavailableException,
    InvalidAnalysisResultException
)

logger = logging.getLogger(__name__)


class ProjectAnalysisEngine:
    """
    AI-powered project analysis engine that breaks down projects into tasks,
    estimates budgets and timelines, and identifies required skills.
    """
    
    def __init__(self):
        self.gemini_client = GeminiClient()
        
        # Default hourly rates by experience level
        self.hourly_rates = {
            'junior': 35,
            'mid': 65,
            'senior': 95,
            'expert': 125
        }
        
        # Complexity multipliers
        self.complexity_multipliers = {
            'low': 1.0,
            'medium': 1.3,
            'high': 1.7,
            'very_high': 2.2
        }
    
    def analyze_project(self, project_description: str, project_title: str = "") -> ProjectAnalysisResult:
        """
        Analyze a project description and generate comprehensive analysis
        
        Args:
            project_description: Detailed project description
            project_title: Optional project title for context
            
        Returns:
            ProjectAnalysisResult with complete analysis
            
        Raises:
            ProjectAnalysisException: If analysis fails completely
        """
        try:
            logger.info(f"Starting project analysis for: {project_title}")
            
            # Generate the analysis prompt
            analysis_prompt = self._create_analysis_prompt(project_description, project_title)
            
            # Get AI analysis
            raw_response = self.gemini_client.generate_content(analysis_prompt)
            analysis_data = self.gemini_client.parse_json_response(raw_response)
            
            # Process and validate the analysis
            result = self._process_analysis_result(analysis_data)
            
            logger.info(f"Project analysis completed successfully for: {project_title}")
            return result
            
        except (GeminiAPIException, ServiceUnavailableException) as e:
            logger.warning(f"AI service unavailable for {project_title}, using fallback: {str(e)}")
            # Return fallback analysis for AI service issues
            return self._create_fallback_analysis(project_description)
            
        except (ValueError, InvalidAnalysisResultException) as e:
            logger.error(f"Invalid analysis result for {project_title}: {str(e)}")
            # Return fallback analysis for invalid results
            return self._create_fallback_analysis(project_description)
            
        except Exception as e:
            logger.error(f"Unexpected error in project analysis for {project_title}: {str(e)}")
            # For unexpected errors, try fallback first, then raise if that fails too
            try:
                return self._create_fallback_analysis(project_description)
            except Exception as fallback_error:
                logger.error(f"Fallback analysis also failed: {str(fallback_error)}")
                raise ProjectAnalysisException(f"Complete analysis failure: {str(e)}")
    
    def _create_analysis_prompt(self, description: str, title: str = "") -> str:
        """Create a comprehensive prompt for project analysis"""
        
        prompt = f"""
You are an expert software project analyst. Analyze the following project and provide a comprehensive breakdown.

Project Title: {title}
Project Description: {description}

Please provide your analysis in the following JSON format:

{{
    "task_breakdown": [
        {{
            "title": "Task title",
            "description": "Detailed task description",
            "required_skills": ["skill1", "skill2"],
            "estimated_hours": 20,
            "priority": 1,
            "dependencies": [],
            "complexity": "medium"
        }}
    ],
    "budget_estimate": 5000.00,
    "timeline_estimate_days": 30,
    "required_skills": ["Python", "Django", "React", "PostgreSQL"],
    "experience_level": "mid",
    "needs_senior_developer": true,
    "complexity_score": 7.5,
    "risk_factors": [
        "Complex integration requirements",
        "Tight timeline constraints"
    ],
    "recommendations": [
        "Consider breaking into smaller phases",
        "Implement comprehensive testing strategy"
    ]
}}

Analysis Guidelines:
1. Break the project into 5-15 manageable tasks
2. Each task should be 8-40 hours of work
3. Identify all required technical skills
4. Estimate realistic timeline in days
5. Budget should be based on mid-level developer rates ($65/hour)
6. Complexity score: 1-10 (1=simple, 10=extremely complex)
7. Experience level: junior, mid, senior, expert
8. Senior developer needed if: complex architecture, team coordination, or 7+ complexity
9. Include potential risks and mitigation recommendations
10. Ensure tasks have logical dependencies and priorities

Focus on:
- Technical feasibility
- Resource requirements
- Risk assessment
- Realistic timelines
- Skill requirements
- Team structure needs

Provide only the JSON response, no additional text.
"""
        return prompt
    
    def _process_analysis_result(self, analysis_data: Dict[str, Any]) -> ProjectAnalysisResult:
        """Process and validate the AI analysis result"""
        
        # Validate required fields
        required_fields = [
            'task_breakdown', 'budget_estimate', 'timeline_estimate_days',
            'required_skills', 'experience_level', 'needs_senior_developer',
            'complexity_score', 'risk_factors', 'recommendations'
        ]
        
        for field in required_fields:
            if field not in analysis_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Process task breakdown
        tasks = []
        for i, task_data in enumerate(analysis_data['task_breakdown']):
            processed_task = {
                'title': task_data.get('title', f'Task {i+1}'),
                'description': task_data.get('description', ''),
                'required_skills': task_data.get('required_skills', []),
                'estimated_hours': max(1, int(task_data.get('estimated_hours', 8))),
                'priority': max(1, min(10, int(task_data.get('priority', 1)))),
                'dependencies': task_data.get('dependencies', []),
                'complexity': task_data.get('complexity', 'medium')
            }
            tasks.append(processed_task)
        
        # Validate and process other fields
        budget = max(100.0, float(analysis_data['budget_estimate']))
        timeline_days = max(1, int(analysis_data['timeline_estimate_days']))
        complexity_score = max(1.0, min(10.0, float(analysis_data['complexity_score'])))
        
        # Validate experience level
        valid_levels = ['junior', 'mid', 'senior', 'expert']
        experience_level = analysis_data['experience_level']
        if experience_level not in valid_levels:
            experience_level = 'mid'
        
        return ProjectAnalysisResult(
            task_breakdown=tasks,
            budget_estimate=budget,
            timeline_estimate_days=timeline_days,
            required_skills=analysis_data['required_skills'],
            experience_level=experience_level,
            needs_senior_developer=bool(analysis_data['needs_senior_developer']),
            complexity_score=complexity_score,
            risk_factors=analysis_data['risk_factors'],
            recommendations=analysis_data['recommendations']
        )
    
    def _create_fallback_analysis(self, description: str) -> ProjectAnalysisResult:
        """Create a basic fallback analysis when AI analysis fails"""
        
        logger.warning("Creating fallback analysis due to AI service failure")
        
        # Basic analysis based on description length and keywords
        word_count = len(description.split())
        
        # Estimate complexity based on description length and keywords
        complexity_keywords = [
            'api', 'database', 'authentication', 'payment', 'integration',
            'real-time', 'machine learning', 'ai', 'microservices', 'scalable'
        ]
        
        complexity_score = min(10.0, 3.0 + (word_count / 50) + 
                              sum(1 for keyword in complexity_keywords 
                                  if keyword in description.lower()))
        
        # Basic task breakdown
        basic_tasks = [
            {
                'title': 'Project Setup and Configuration',
                'description': 'Set up development environment and basic project structure',
                'required_skills': ['Python', 'Django'],
                'estimated_hours': 16,
                'priority': 1,
                'dependencies': [],
                'complexity': 'low'
            },
            {
                'title': 'Core Feature Implementation',
                'description': 'Implement main project functionality',
                'required_skills': ['Python', 'Django', 'JavaScript'],
                'estimated_hours': 40,
                'priority': 2,
                'dependencies': ['Project Setup and Configuration'],
                'complexity': 'medium'
            },
            {
                'title': 'Testing and Quality Assurance',
                'description': 'Write tests and ensure code quality',
                'required_skills': ['Testing', 'Python'],
                'estimated_hours': 20,
                'priority': 3,
                'dependencies': ['Core Feature Implementation'],
                'complexity': 'medium'
            }
        ]
        
        # Calculate estimates
        total_hours = sum(task['estimated_hours'] for task in basic_tasks)
        budget_estimate = total_hours * self.hourly_rates['mid']
        timeline_days = max(7, int(total_hours / 6))  # Assuming 6 hours per day
        
        return ProjectAnalysisResult(
            task_breakdown=basic_tasks,
            budget_estimate=budget_estimate,
            timeline_estimate_days=timeline_days,
            required_skills=['Python', 'Django', 'JavaScript', 'HTML', 'CSS'],
            experience_level='mid',
            needs_senior_developer=complexity_score >= 7.0,
            complexity_score=complexity_score,
            risk_factors=['Limited project analysis due to AI service unavailability'],
            recommendations=[
                'Review and refine task breakdown manually',
                'Consider detailed requirements gathering session'
            ]
        )
    
    def update_project_with_analysis(self, project, analysis_result: ProjectAnalysisResult) -> None:
        """
        Update a project instance with analysis results
        
        Args:
            project: Project model instance
            analysis_result: ProjectAnalysisResult from analysis
        """
        from projects.models import Task
        
        try:
            # Update project fields
            project.ai_analysis = {
                'complexity_score': analysis_result.complexity_score,
                'risk_factors': analysis_result.risk_factors,
                'recommendations': analysis_result.recommendations,
                'analysis_timestamp': str(timezone.now()),
                'needs_senior_developer': analysis_result.needs_senior_developer
            }
            
            project.budget_estimate = Decimal(str(analysis_result.budget_estimate))
            project.timeline_estimate = timedelta(days=analysis_result.timeline_estimate_days)
            project.required_skills = analysis_result.required_skills
            project.experience_level_required = analysis_result.experience_level
            project.status = 'proposal_review' if analysis_result.needs_senior_developer else 'team_assembly'
            
            project.save()
            
            # Create tasks
            for i, task_data in enumerate(analysis_result.task_breakdown):
                Task.objects.create(
                    project=project,
                    title=task_data['title'],
                    description=task_data['description'],
                    required_skills=task_data['required_skills'],
                    estimated_hours=task_data['estimated_hours'],
                    priority=task_data['priority']
                )
            
            logger.info(f"Successfully updated project {project.id} with AI analysis")
            
        except Exception as e:
            logger.error(f"Failed to update project {project.id} with analysis: {str(e)}")
            raise
    
    def test_service(self) -> Dict[str, Any]:
        """Test the project analysis service"""
        try:
            # Test Gemini connection
            connection_ok = self.gemini_client.test_connection()
            
            if connection_ok:
                # Test with a simple project
                test_description = "Build a simple todo list web application with user authentication"
                result = self.analyze_project(test_description, "Test Project")
                
                return {
                    'status': 'success',
                    'gemini_connection': True,
                    'analysis_working': True,
                    'test_result': {
                        'tasks_generated': len(result.task_breakdown),
                        'budget_estimate': result.budget_estimate,
                        'timeline_days': result.timeline_estimate_days
                    }
                }
            else:
                return {
                    'status': 'error',
                    'gemini_connection': False,
                    'analysis_working': False,
                    'error': 'Cannot connect to Gemini API'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'gemini_connection': False,
                'analysis_working': False,
                'error': str(e)
            }