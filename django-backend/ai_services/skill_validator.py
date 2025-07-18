"""
Skill validation and confidence scoring service.
Validates extracted skills and calculates confidence scores based on multiple factors.
"""

import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from collections import Counter
import re

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger(__name__)


class SkillValidator:
    """
    Service for validating skills and calculating confidence scores.
    Combines GitHub analysis, market trends, and historical data.
    """
    
    def __init__(self):
        """Initialize skill validator with known skills and patterns."""
        self.known_skills = self._load_known_skills()
        self.skill_categories = self._load_skill_categories()
        self.market_trends = self._load_market_trends()
        
    def validate_skills(self, extracted_skills: List[str], 
                       github_analysis: Dict = None) -> Dict[str, Any]:
        """
        Validate a list of extracted skills and calculate confidence scores.
        
        Args:
            extracted_skills: List of skill names to validate
            github_analysis: Optional GitHub analysis data for context
            
        Returns:
            Dict with validated skills and confidence scores
        """
        validated_skills = {}
        
        for skill in extracted_skills:
            validation_result = self._validate_single_skill(skill, github_analysis)
            if validation_result['is_valid']:
                validated_skills[skill] = validation_result
        
        return {
            'validated_skills': validated_skills,
            'total_extracted': len(extracted_skills),
            'total_validated': len(validated_skills),
            'validation_rate': len(validated_skills) / max(1, len(extracted_skills)),
            'validated_at': timezone.now().isoformat()
        }
    
    def _validate_single_skill(self, skill: str, github_analysis: Dict = None) -> Dict[str, Any]:
        """
        Validate a single skill and calculate its confidence score.
        
        Args:
            skill: Skill name to validate
            github_analysis: Optional GitHub analysis data
            
        Returns:
            Dict with validation results and confidence score
        """
        # Normalize skill name
        normalized_skill = self._normalize_skill_name(skill)
        
        # Check if skill is known
        is_known_skill = self._is_known_skill(normalized_skill)
        
        # Calculate base confidence
        base_confidence = self._calculate_base_confidence(normalized_skill, is_known_skill)
        
        # Adjust confidence based on GitHub analysis
        github_confidence = self._calculate_github_confidence(
            normalized_skill, github_analysis
        ) if github_analysis else 0
        
        # Adjust confidence based on market trends
        market_confidence = self._calculate_market_confidence(normalized_skill)
        
        # Calculate final confidence score
        final_confidence = self._combine_confidence_scores(
            base_confidence, github_confidence, market_confidence
        )
        
        # Determine skill category
        category = self._determine_skill_category(normalized_skill)
        
        # Check for skill variations and aliases
        aliases = self._find_skill_aliases(normalized_skill)
        
        return {
            'is_valid': final_confidence >= 30,  # Minimum confidence threshold
            'normalized_name': normalized_skill,
            'original_name': skill,
            'confidence_score': final_confidence,
            'confidence_breakdown': {
                'base_confidence': base_confidence,
                'github_confidence': github_confidence,
                'market_confidence': market_confidence
            },
            'category': category,
            'is_known_skill': is_known_skill,
            'aliases': aliases,
            'market_demand': self._get_market_demand(normalized_skill),
            'validation_factors': self._get_validation_factors(
                normalized_skill, github_analysis
            )
        }
    
    def _normalize_skill_name(self, skill: str) -> str:
        """Normalize skill name for consistent processing."""
        # Remove extra whitespace and convert to title case
        normalized = re.sub(r'\s+', ' ', skill.strip()).title()
        
        # Handle common variations
        skill_mappings = {
            'Javascript': 'JavaScript',
            'Typescript': 'TypeScript',
            'Nodejs': 'Node.js',
            'Reactjs': 'React',
            'Vuejs': 'Vue.js',
            'Angularjs': 'AngularJS',
            'Postgresql': 'PostgreSQL',
            'Mysql': 'MySQL',
            'Mongodb': 'MongoDB',
            'Redis': 'Redis',
            'Elasticsearch': 'Elasticsearch',
            'Aws': 'AWS',
            'Gcp': 'Google Cloud Platform',
            'Azure': 'Microsoft Azure',
            'Docker': 'Docker',
            'Kubernetes': 'Kubernetes',
            'Git': 'Git',
            'Github': 'GitHub',
            'Gitlab': 'GitLab',
            'Jira': 'Jira',
            'Slack': 'Slack',
        }
        
        return skill_mappings.get(normalized, normalized)
    
    def _is_known_skill(self, skill: str) -> bool:
        """Check if skill is in the known skills database."""
        return skill.lower() in [s.lower() for s in self.known_skills]
    
    def _calculate_base_confidence(self, skill: str, is_known_skill: bool) -> float:
        """Calculate base confidence score for a skill."""
        if is_known_skill:
            return 70.0  # High confidence for known skills
        
        # Check if skill matches common patterns
        programming_patterns = [
            r'.*\+\+$',  # C++, etc.
            r'^[A-Z][a-z]+$',  # Single word, capitalized
            r'^[A-Z][a-z]+\.[a-z]+$',  # Framework.extension
            r'^[A-Z]{2,}$',  # Acronyms like SQL, API
        ]
        
        for pattern in programming_patterns:
            if re.match(pattern, skill):
                return 50.0  # Medium confidence for pattern matches
        
        # Check skill length and format
        if 2 <= len(skill) <= 30 and skill.replace('.', '').replace('-', '').replace(' ', '').isalnum():
            return 30.0  # Low confidence for reasonable-looking skills
        
        return 10.0  # Very low confidence for unusual skills
    
    def _calculate_github_confidence(self, skill: str, github_analysis: Dict) -> float:
        """Calculate confidence based on GitHub analysis data."""
        if not github_analysis:
            return 0.0
        
        confidence_bonus = 0.0
        
        # Check if skill appears in languages
        languages = github_analysis.get('languages', {})
        if skill in languages:
            usage_count = languages[skill]
            total_usage = sum(languages.values())
            usage_ratio = usage_count / max(1, total_usage)
            confidence_bonus += usage_ratio * 30  # Up to 30 points
        
        # Check if skill appears in frameworks
        frameworks = github_analysis.get('frameworks', [])
        if skill in frameworks:
            confidence_bonus += 20  # 20 points for framework detection
        
        # Check skill assessment data
        skill_assessment = github_analysis.get('skill_assessment', {})
        if skill in skill_assessment:
            assessment = skill_assessment[skill]
            proficiency = assessment.get('proficiency', 0)
            confidence_bonus += min(25, proficiency / 4)  # Up to 25 points
        
        # Check repository activity
        activity_score = github_analysis.get('activity_score', 0)
        if activity_score > 50:
            confidence_bonus += 10  # Activity bonus
        
        return min(40, confidence_bonus)  # Cap at 40 points
    
    def _calculate_market_confidence(self, skill: str) -> float:
        """Calculate confidence based on market trends and demand."""
        market_data = self.market_trends.get(skill.lower(), {})
        
        if not market_data:
            return 0.0
        
        # Base market confidence
        demand_score = market_data.get('demand_score', 0)  # 0-100
        trend_score = market_data.get('trend_score', 0)    # -50 to +50
        
        # Calculate market confidence (0-20 points)
        market_confidence = (demand_score / 5) + max(0, trend_score / 2.5)
        
        return min(20, market_confidence)
    
    def _combine_confidence_scores(self, base: float, github: float, market: float) -> float:
        """Combine different confidence scores into final score."""
        # Weighted combination
        weights = {
            'base': 0.4,
            'github': 0.4,
            'market': 0.2
        }
        
        final_score = (
            base * weights['base'] +
            github * weights['github'] +
            market * weights['market']
        )
        
        return round(min(100, max(0, final_score)), 2)
    
    def _determine_skill_category(self, skill: str) -> str:
        """Determine the category of a skill."""
        for category, skills in self.skill_categories.items():
            if skill.lower() in [s.lower() for s in skills]:
                return category
        
        # Pattern-based categorization
        if re.match(r'^[A-Z][a-z]*$', skill) and skill.lower() in ['python', 'java', 'javascript', 'typescript', 'go', 'rust', 'swift', 'kotlin']:
            return 'Programming Languages'
        elif skill.lower().endswith(('.js', '.py', '.rb', '.php')):
            return 'Programming Languages'
        elif 'framework' in skill.lower() or skill.endswith(('JS', 'js')):
            return 'Frameworks'
        elif skill.lower() in ['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch']:
            return 'Databases'
        elif skill.lower() in ['aws', 'azure', 'gcp', 'docker', 'kubernetes']:
            return 'DevOps & Cloud'
        elif skill.lower() in ['git', 'github', 'gitlab', 'jira', 'slack']:
            return 'Tools'
        
        return 'Other'
    
    def _find_skill_aliases(self, skill: str) -> List[str]:
        """Find common aliases for a skill."""
        aliases_map = {
            'JavaScript': ['JS', 'ECMAScript', 'Node.js'],
            'TypeScript': ['TS'],
            'Python': ['Python3', 'Python2'],
            'Java': ['JVM'],
            'C++': ['CPP', 'C Plus Plus'],
            'C#': ['CSharp', 'C Sharp'],
            'PostgreSQL': ['Postgres', 'PSQL'],
            'MySQL': ['My SQL'],
            'MongoDB': ['Mongo'],
            'React': ['ReactJS', 'React.js'],
            'Vue.js': ['Vue', 'VueJS'],
            'Angular': ['AngularJS', 'Angular2+'],
            'AWS': ['Amazon Web Services'],
            'GCP': ['Google Cloud Platform', 'Google Cloud'],
            'Azure': ['Microsoft Azure'],
        }
        
        return aliases_map.get(skill, [])
    
    def _get_market_demand(self, skill: str) -> str:
        """Get market demand level for a skill."""
        market_data = self.market_trends.get(skill.lower(), {})
        demand_score = market_data.get('demand_score', 0)
        
        if demand_score >= 80:
            return 'Very High'
        elif demand_score >= 60:
            return 'High'
        elif demand_score >= 40:
            return 'Medium'
        elif demand_score >= 20:
            return 'Low'
        else:
            return 'Very Low'
    
    def _get_validation_factors(self, skill: str, github_analysis: Dict = None) -> List[str]:
        """Get list of factors that contributed to skill validation."""
        factors = []
        
        if self._is_known_skill(skill):
            factors.append('Known skill in database')
        
        if github_analysis:
            languages = github_analysis.get('languages', {})
            if skill in languages:
                factors.append('Detected in GitHub repositories')
            
            frameworks = github_analysis.get('frameworks', [])
            if skill in frameworks:
                factors.append('Identified as framework')
            
            skill_assessment = github_analysis.get('skill_assessment', {})
            if skill in skill_assessment:
                factors.append('GitHub skill assessment available')
        
        market_data = self.market_trends.get(skill.lower(), {})
        if market_data.get('demand_score', 0) > 50:
            factors.append('High market demand')
        
        return factors
    
    def _load_known_skills(self) -> List[str]:
        """Load known skills from cache or database."""
        cache_key = 'known_skills_list'
        cached_skills = cache.get(cache_key)
        
        if cached_skills:
            return cached_skills
        
        # Default known skills list
        known_skills = [
            # Programming Languages
            'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust',
            'Swift', 'Kotlin', 'Ruby', 'PHP', 'Scala', 'R', 'MATLAB', 'Perl',
            'Haskell', 'Clojure', 'Elixir', 'Dart', 'Julia', 'Lua',
            
            # Web Frameworks
            'React', 'Vue.js', 'Angular', 'Django', 'Flask', 'FastAPI', 'Express.js',
            'Next.js', 'Nuxt.js', 'Svelte', 'Laravel', 'Symfony', 'Ruby on Rails',
            'Spring', 'ASP.NET', 'Gin', 'Echo', 'Fiber',
            
            # Databases
            'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite',
            'Oracle', 'SQL Server', 'Cassandra', 'DynamoDB', 'Neo4j',
            
            # Cloud & DevOps
            'AWS', 'Google Cloud Platform', 'Microsoft Azure', 'Docker', 'Kubernetes',
            'Terraform', 'Ansible', 'Jenkins', 'GitLab CI', 'GitHub Actions',
            
            # Tools & Technologies
            'Git', 'GitHub', 'GitLab', 'Jira', 'Slack', 'Figma', 'Adobe Creative Suite',
            'Photoshop', 'Illustrator', 'Sketch', 'InVision',
            
            # Mobile Development
            'React Native', 'Flutter', 'Ionic', 'Xamarin', 'Swift', 'Kotlin',
            'Android', 'iOS',
            
            # Data Science & ML
            'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Jupyter',
            'Apache Spark', 'Hadoop', 'Tableau', 'Power BI',
            
            # Testing
            'Jest', 'Mocha', 'PyTest', 'JUnit', 'RSpec', 'Selenium', 'Cypress',
        ]
        
        # Cache for 1 hour
        cache.set(cache_key, known_skills, timeout=3600)
        return known_skills
    
    def _load_skill_categories(self) -> Dict[str, List[str]]:
        """Load skill categories mapping."""
        return {
            'Programming Languages': [
                'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go',
                'Rust', 'Swift', 'Kotlin', 'Ruby', 'PHP', 'Scala', 'R'
            ],
            'Web Frameworks': [
                'React', 'Vue.js', 'Angular', 'Django', 'Flask', 'Express.js',
                'Next.js', 'Laravel', 'Ruby on Rails', 'Spring'
            ],
            'Databases': [
                'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
                'SQLite', 'Oracle', 'SQL Server'
            ],
            'DevOps & Cloud': [
                'AWS', 'Google Cloud Platform', 'Microsoft Azure', 'Docker',
                'Kubernetes', 'Terraform', 'Ansible', 'Jenkins'
            ],
            'Mobile Development': [
                'React Native', 'Flutter', 'Ionic', 'Swift', 'Kotlin', 'Android', 'iOS'
            ],
            'Data Science & ML': [
                'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn',
                'Apache Spark', 'Tableau'
            ],
            'Tools': [
                'Git', 'GitHub', 'GitLab', 'Jira', 'Figma', 'Photoshop', 'Sketch'
            ]
        }
    
    def _load_market_trends(self) -> Dict[str, Dict[str, float]]:
        """Load market trends data for skills."""
        # This would typically come from an external API or database
        # For now, using static data based on common market trends
        return {
            'python': {'demand_score': 95, 'trend_score': 20},
            'javascript': {'demand_score': 90, 'trend_score': 15},
            'typescript': {'demand_score': 85, 'trend_score': 25},
            'react': {'demand_score': 88, 'trend_score': 20},
            'node.js': {'demand_score': 82, 'trend_score': 15},
            'aws': {'demand_score': 92, 'trend_score': 30},
            'docker': {'demand_score': 85, 'trend_score': 25},
            'kubernetes': {'demand_score': 80, 'trend_score': 35},
            'java': {'demand_score': 85, 'trend_score': 5},
            'go': {'demand_score': 75, 'trend_score': 30},
            'rust': {'demand_score': 65, 'trend_score': 40},
            'vue.js': {'demand_score': 70, 'trend_score': 10},
            'angular': {'demand_score': 75, 'trend_score': -5},
            'django': {'demand_score': 78, 'trend_score': 10},
            'flask': {'demand_score': 65, 'trend_score': 5},
            'postgresql': {'demand_score': 80, 'trend_score': 15},
            'mongodb': {'demand_score': 75, 'trend_score': 10},
            'redis': {'demand_score': 70, 'trend_score': 15},
        }