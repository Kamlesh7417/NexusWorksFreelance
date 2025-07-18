"""
Mock data generators for testing AI services
"""
import random
import uuid
from decimal import Decimal
from datetime import datetime, timedelta
from typing import List, Dict, Any
from django.contrib.auth import get_user_model
from users.models import DeveloperProfile, ClientProfile
from projects.models import Project, Task
from ai_services.models import SkillEmbedding, ProjectAnalysisResult, DeveloperSkillAnalysis

User = get_user_model()


class MockDataGenerator:
    """Base class for mock data generation"""
    
    @staticmethod
    def random_choice(choices: List[Any]) -> Any:
        """Get random choice from list"""
        return random.choice(choices)
    
    @staticmethod
    def random_float(min_val: float, max_val: float) -> float:
        """Generate random float between min and max"""
        return random.uniform(min_val, max_val)
    
    @staticmethod
    def random_int(min_val: int, max_val: int) -> int:
        """Generate random integer between min and max"""
        return random.randint(min_val, max_val)


class UserMockGenerator(MockDataGenerator):
    """Mock data generator for users and profiles"""
    
    FIRST_NAMES = [
        'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa',
        'James', 'Maria', 'William', 'Jennifer', 'Richard', 'Linda', 'Thomas', 'Patricia'
    ]
    
    LAST_NAMES = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
        'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Taylor'
    ]
    
    SKILLS = [
        'Python', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Node.js',
        'Django', 'Flask', 'FastAPI', 'Express.js', 'Spring', 'Laravel', 'Ruby on Rails',
        'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
        'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git',
        'Machine Learning', 'Data Science', 'AI', 'Deep Learning', 'TensorFlow', 'PyTorch'
    ]
    
    EXPERIENCE_LEVELS = ['junior', 'mid', 'senior', 'lead']
    AVAILABILITY_STATUSES = ['available', 'busy', 'unavailable']
    COMPANY_SIZES = ['startup', 'small', 'medium', 'large', 'enterprise']
    INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'E-commerce', 'Education', 'Gaming']
    
    @classmethod
    def create_developer(cls, email: str = None, skills: List[str] = None) -> User:
        """Create a mock developer user with profile"""
        if not email:
            first_name = cls.random_choice(cls.FIRST_NAMES)
            last_name = cls.random_choice(cls.LAST_NAMES)
            email = f"{first_name.lower()}.{last_name.lower()}@example.com"
        
        user = User.objects.create_user(
            email=email,
            password='testpass123',
            role='developer',
            first_name=first_name if 'email' not in locals() else 'Test',
            last_name=last_name if 'email' not in locals() else 'Developer',
            github_username=f"dev_{random.randint(1000, 9999)}"
        )
        
        if not skills:
            # Select 3-6 random skills
            num_skills = cls.random_int(3, 6)
            skills = random.sample(cls.SKILLS, num_skills)
        
        profile = DeveloperProfile.objects.create(
            user=user,
            skills=skills,
            experience_level=cls.random_choice(cls.EXPERIENCE_LEVELS),
            hourly_rate=Decimal(str(cls.random_int(40, 150))),
            availability_status=cls.random_choice(cls.AVAILABILITY_STATUSES),
            bio=f"Experienced {user.first_name} with expertise in {', '.join(skills[:3])}",
            location=f"{cls.random_choice(['San Francisco', 'New York', 'Austin', 'Seattle', 'Boston'])}, USA",
            timezone='America/Los_Angeles',
            reputation_score=cls.random_float(0.0, 10.0),
            github_analysis=cls._generate_github_analysis(skills),
            skill_embeddings=cls._generate_skill_embeddings(skills)
        )
        
        return user
    
    @classmethod
    def create_client(cls, email: str = None) -> User:
        """Create a mock client user with profile"""
        if not email:
            first_name = cls.random_choice(cls.FIRST_NAMES)
            last_name = cls.random_choice(cls.LAST_NAMES)
            email = f"{first_name.lower()}.{last_name.lower()}@company.com"
        
        user = User.objects.create_user(
            email=email,
            password='testpass123',
            role='client',
            first_name=first_name if 'email' not in locals() else 'Test',
            last_name=last_name if 'email' not in locals() else 'Client'
        )
        
        ClientProfile.objects.create(
            user=user,
            company_name=f"{cls.random_choice(['Tech', 'Digital', 'Smart', 'Innovative'])} {cls.random_choice(['Solutions', 'Systems', 'Corp', 'Inc'])}",
            company_size=cls.random_choice(cls.COMPANY_SIZES),
            industry=cls.random_choice(cls.INDUSTRIES),
            budget_range=cls.random_choice(['low', 'medium', 'high', 'enterprise']),
            preferred_communication=cls.random_choice(['email', 'slack', 'phone', 'video'])
        )
        
        return user
    
    @classmethod
    def create_bulk_developers(cls, count: int) -> List[User]:
        """Create multiple mock developers"""
        developers = []
        for i in range(count):
            email = f"dev{i}@example.com"
            developer = cls.create_developer(email=email)
            developers.append(developer)
        return developers
    
    @classmethod
    def _generate_github_analysis(cls, skills: List[str]) -> Dict[str, Any]:
        """Generate mock GitHub analysis data"""
        return {
            'repositories': cls.random_int(5, 50),
            'languages': skills[:3],  # Top 3 skills as languages
            'total_commits': cls.random_int(100, 2000),
            'avg_complexity': cls.random_float(5.0, 9.0),
            'contribution_frequency': cls.random_choice(['daily', 'weekly', 'monthly']),
            'open_source_contributions': cls.random_int(0, 20),
            'stars_received': cls.random_int(0, 100),
            'forks_received': cls.random_int(0, 50)
        }
    
    @classmethod
    def _generate_skill_embeddings(cls, skills: List[str]) -> List[float]:
        """Generate mock skill embeddings"""
        # Generate 100-dimensional embedding vector
        return [cls.random_float(-1.0, 1.0) for _ in range(100)]


class ProjectMockGenerator(MockDataGenerator):
    """Mock data generator for projects and tasks"""
    
    PROJECT_TITLES = [
        'E-commerce Platform', 'Social Media App', 'Task Management System',
        'Real Estate Portal', 'Healthcare Dashboard', 'Financial Analytics Tool',
        'Learning Management System', 'Inventory Management', 'CRM System',
        'Blog Platform', 'Chat Application', 'Video Streaming Service'
    ]
    
    PROJECT_DESCRIPTIONS = [
        'Build a modern web application with user authentication and payment processing',
        'Develop a responsive mobile-first application with real-time features',
        'Create a scalable backend API with comprehensive admin dashboard',
        'Design and implement a full-stack solution with advanced analytics',
        'Build a secure platform with role-based access control and reporting'
    ]
    
    TASK_TYPES = [
        'Backend Development', 'Frontend Development', 'Database Design',
        'API Integration', 'User Authentication', 'Payment Processing',
        'Testing & QA', 'DevOps Setup', 'UI/UX Design', 'Mobile Development'
    ]
    
    @classmethod
    def create_project(cls, client: User, title: str = None, complexity: str = 'medium') -> Project:
        """Create a mock project"""
        if not title:
            title = cls.random_choice(cls.PROJECT_TITLES)
        
        description = cls.random_choice(cls.PROJECT_DESCRIPTIONS)
        
        # Adjust budget and timeline based on complexity
        complexity_multipliers = {
            'low': (0.5, 0.7),
            'medium': (0.8, 1.2),
            'high': (1.3, 2.0)
        }
        
        multiplier = cls.random_float(*complexity_multipliers.get(complexity, (0.8, 1.2)))
        
        project = Project.objects.create(
            client=client,
            title=title,
            description=description,
            budget_estimate=Decimal(str(int(5000 * multiplier))),
            timeline_estimate=timedelta(days=int(30 * multiplier)),
            status=cls.random_choice(['analyzing', 'proposal_review', 'team_hiring', 'in_progress'])
        )
        
        return project
    
    @classmethod
    def create_tasks_for_project(cls, project: Project, count: int = None) -> List[Task]:
        """Create mock tasks for a project"""
        if not count:
            count = cls.random_int(3, 8)
        
        tasks = []
        for i in range(count):
            task_title = f"{cls.random_choice(cls.TASK_TYPES)} - {project.title}"
            
            # Select relevant skills based on task type
            skill_mapping = {
                'Backend Development': ['Python', 'Django', 'PostgreSQL', 'REST API'],
                'Frontend Development': ['React', 'JavaScript', 'CSS', 'HTML'],
                'Database Design': ['PostgreSQL', 'MySQL', 'MongoDB'],
                'API Integration': ['REST API', 'GraphQL', 'Python', 'JavaScript'],
                'User Authentication': ['Django', 'JWT', 'OAuth', 'Security'],
                'Payment Processing': ['Stripe', 'PayPal', 'Python', 'Security'],
                'Testing & QA': ['pytest', 'Jest', 'Selenium', 'Testing'],
                'DevOps Setup': ['Docker', 'AWS', 'Jenkins', 'Kubernetes'],
                'UI/UX Design': ['Figma', 'CSS', 'HTML', 'Design'],
                'Mobile Development': ['React Native', 'Swift', 'Kotlin', 'Mobile']
            }
            
            task_type = cls.random_choice(cls.TASK_TYPES)
            required_skills = skill_mapping.get(task_type, ['Python', 'JavaScript'])
            
            task = Task.objects.create(
                project=project,
                title=task_title,
                description=f"Implement {task_type.lower()} for {project.title}",
                required_skills=required_skills,
                estimated_hours=cls.random_int(10, 60),
                priority=i + 1,
                status=cls.random_choice(['pending', 'assigned', 'in_progress', 'completed'])
            )
            
            tasks.append(task)
        
        return tasks


class AIMockGenerator(MockDataGenerator):
    """Mock data generator for AI services"""
    
    @classmethod
    def create_skill_embeddings(cls, skills: List[str] = None) -> List[SkillEmbedding]:
        """Create mock skill embeddings"""
        if not skills:
            skills = UserMockGenerator.SKILLS[:20]  # Use first 20 skills
        
        embeddings = []
        for skill in skills:
            embedding = SkillEmbedding.objects.create(
                skill_name=skill,
                embedding_vector=[cls.random_float(-1.0, 1.0) for _ in range(100)],
                model_version='sentence-transformers/all-MiniLM-L6-v2',
                confidence_score=cls.random_float(0.8, 1.0)
            )
            embeddings.append(embedding)
        
        return embeddings
    
    @classmethod
    def create_project_analysis(cls, project: Project) -> ProjectAnalysisResult:
        """Create mock project analysis result"""
        # Determine complexity based on project budget
        budget = float(project.budget_estimate)
        if budget < 3000:
            complexity = cls.random_float(3.0, 5.0)
        elif budget < 8000:
            complexity = cls.random_float(5.0, 7.5)
        else:
            complexity = cls.random_float(7.5, 10.0)
        
        # Generate required skills based on project description
        description_lower = project.description.lower()
        required_skills = []
        
        skill_keywords = {
            'web': ['Python', 'Django', 'JavaScript', 'React'],
            'mobile': ['React Native', 'Swift', 'Kotlin'],
            'api': ['REST API', 'GraphQL', 'Python'],
            'database': ['PostgreSQL', 'MySQL', 'MongoDB'],
            'payment': ['Stripe', 'PayPal', 'Security'],
            'auth': ['JWT', 'OAuth', 'Security']
        }
        
        for keyword, skills in skill_keywords.items():
            if keyword in description_lower:
                required_skills.extend(skills[:2])
        
        if not required_skills:
            required_skills = ['Python', 'JavaScript', 'React']
        
        # Remove duplicates
        required_skills = list(set(required_skills))
        
        analysis = ProjectAnalysisResult.objects.create(
            project=project,
            complexity_score=complexity,
            required_skills=required_skills,
            estimated_timeline=timedelta(days=cls.random_int(14, 90)),
            budget_range={
                'min': int(budget * 0.8),
                'max': int(budget * 1.2)
            },
            task_breakdown=cls._generate_task_breakdown(required_skills),
            senior_developer_required=complexity > 7.0,
            analysis_version='1.0'
        )
        
        return analysis
    
    @classmethod
    def create_developer_skill_analysis(cls, developer: User) -> DeveloperSkillAnalysis:
        """Create mock developer skill analysis"""
        profile = DeveloperProfile.objects.get(user=developer)
        
        # Generate skill scores based on profile skills
        skill_scores = {}
        for skill in profile.skills:
            base_score = cls.random_float(0.6, 0.95)
            # Adjust based on experience level
            experience_multiplier = {
                'junior': 0.8,
                'mid': 1.0,
                'senior': 1.2,
                'lead': 1.3
            }.get(profile.experience_level, 1.0)
            
            skill_scores[skill] = min(1.0, base_score * experience_multiplier)
        
        overall_score = sum(skill_scores.values()) / len(skill_scores) * 10
        
        analysis = DeveloperSkillAnalysis.objects.create(
            developer=developer,
            github_analysis=profile.github_analysis,
            resume_analysis={
                'experience_years': cls.random_int(1, 15),
                'education': cls.random_choice(['Computer Science', 'Software Engineering', 'Information Technology']),
                'certifications': cls.random_choice([[], ['AWS Certified'], ['Google Cloud Certified'], ['Microsoft Certified']])
            },
            skill_scores=skill_scores,
            overall_score=overall_score,
            analysis_version='1.0'
        )
        
        return analysis
    
    @classmethod
    def _generate_task_breakdown(cls, required_skills: List[str]) -> List[Dict[str, Any]]:
        """Generate mock task breakdown"""
        tasks = []
        
        # Common task templates
        task_templates = [
            {
                'title': 'Project Setup and Architecture',
                'skills': ['Python', 'Django'] if 'Python' in required_skills else ['JavaScript', 'Node.js'],
                'hours': cls.random_int(8, 16)
            },
            {
                'title': 'Database Design and Setup',
                'skills': ['PostgreSQL', 'Database Design'],
                'hours': cls.random_int(12, 24)
            },
            {
                'title': 'Backend API Development',
                'skills': [s for s in required_skills if s in ['Python', 'Django', 'REST API', 'GraphQL']],
                'hours': cls.random_int(20, 40)
            },
            {
                'title': 'Frontend Development',
                'skills': [s for s in required_skills if s in ['React', 'JavaScript', 'TypeScript', 'CSS']],
                'hours': cls.random_int(16, 32)
            },
            {
                'title': 'Testing and Quality Assurance',
                'skills': ['Testing', 'pytest', 'Jest'],
                'hours': cls.random_int(8, 20)
            }
        ]
        
        for template in task_templates:
            if template['skills']:  # Only add if relevant skills are present
                tasks.append(template)
        
        return tasks


class TestDataFactory:
    """Factory class for creating complete test scenarios"""
    
    @classmethod
    def create_complete_project_scenario(cls) -> Dict[str, Any]:
        """Create a complete project scenario with client, developers, and project"""
        # Create client
        client = UserMockGenerator.create_client()
        
        # Create developers with different skill sets
        python_dev = UserMockGenerator.create_developer(
            skills=['Python', 'Django', 'PostgreSQL', 'REST API']
        )
        
        react_dev = UserMockGenerator.create_developer(
            skills=['React', 'JavaScript', 'TypeScript', 'CSS']
        )
        
        fullstack_dev = UserMockGenerator.create_developer(
            skills=['Python', 'Django', 'React', 'JavaScript', 'PostgreSQL']
        )
        
        # Create project
        project = ProjectMockGenerator.create_project(client, complexity='high')
        
        # Create tasks
        tasks = ProjectMockGenerator.create_tasks_for_project(project)
        
        # Create AI analysis
        analysis = AIMockGenerator.create_project_analysis(project)
        
        # Create skill embeddings
        all_skills = set()
        for dev in [python_dev, react_dev, fullstack_dev]:
            profile = DeveloperProfile.objects.get(user=dev)
            all_skills.update(profile.skills)
        
        embeddings = AIMockGenerator.create_skill_embeddings(list(all_skills))
        
        return {
            'client': client,
            'developers': [python_dev, react_dev, fullstack_dev],
            'project': project,
            'tasks': tasks,
            'analysis': analysis,
            'embeddings': embeddings
        }
    
    @classmethod
    def create_matching_test_scenario(cls, num_developers: int = 20) -> Dict[str, Any]:
        """Create a scenario for testing matching algorithms"""
        # Create client and project
        client = UserMockGenerator.create_client()
        project = ProjectMockGenerator.create_project(client, complexity='medium')
        
        # Create diverse set of developers
        developers = UserMockGenerator.create_bulk_developers(num_developers)
        
        # Create skill embeddings for all skills
        all_skills = set()
        for dev in developers:
            profile = DeveloperProfile.objects.get(user=dev)
            all_skills.update(profile.skills)
        
        embeddings = AIMockGenerator.create_skill_embeddings(list(all_skills))
        
        # Create project analysis
        analysis = AIMockGenerator.create_project_analysis(project)
        
        return {
            'client': client,
            'project': project,
            'developers': developers,
            'analysis': analysis,
            'embeddings': embeddings
        }