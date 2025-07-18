"""
Repository Analysis Engine for GitHub repositories.
Extracts programming languages, frameworks, technologies, analyzes code complexity,
project structure, commit patterns, and generates skill proficiency scores.
"""

import re
import logging
from typing import Dict, List, Optional, Tuple, Any, Set
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import json
import hashlib

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

from .github_client import GitHubClient
from .exceptions import GitHubAPIError, RepositoryAnalysisError

logger = logging.getLogger(__name__)


class RepositoryAnalyzer:
    """
    Comprehensive repository analysis engine that extracts technical insights
    from GitHub repositories for developer skill assessment.
    """
    
    def __init__(self, github_client: Optional[GitHubClient] = None):
        """Initialize with GitHub client."""
        self.github_client = github_client or GitHubClient()
        
        # Technology detection patterns
        self.framework_patterns = {
            # Python frameworks
            'Django': [r'django', r'manage\.py', r'settings\.py', r'urls\.py'],
            'Flask': [r'flask', r'app\.py', r'from flask import'],
            'FastAPI': [r'fastapi', r'from fastapi import'],
            'Tornado': [r'tornado', r'tornado\.web'],
            'Pyramid': [r'pyramid', r'pyramid\.config'],
            
            # JavaScript/Node.js frameworks
            'React': [r'react', r'jsx', r'create-react-app', r'react-dom'],
            'Vue.js': [r'vue', r'\.vue$', r'vue-cli'],
            'Angular': [r'angular', r'@angular', r'ng-'],
            'Express.js': [r'express', r'app\.listen', r'express\(\)'],
            'Next.js': [r'next', r'next\.config', r'pages/'],
            'Nuxt.js': [r'nuxt', r'nuxt\.config'],
            'Svelte': [r'svelte', r'\.svelte$'],
            
            # Java frameworks
            'Spring': [r'spring', r'@SpringBootApplication', r'springframework'],
            'Hibernate': [r'hibernate', r'@Entity', r'SessionFactory'],
            'Struts': [r'struts', r'struts\.xml'],
            
            # .NET frameworks
            'ASP.NET': [r'asp\.net', r'\.aspx', r'System\.Web'],
            '.NET Core': [r'\.net core', r'Microsoft\.AspNetCore'],
            
            # Ruby frameworks
            'Ruby on Rails': [r'rails', r'Gemfile', r'config/routes\.rb'],
            'Sinatra': [r'sinatra', r'require.*sinatra'],
            
            # PHP frameworks
            'Laravel': [r'laravel', r'artisan', r'composer\.json.*laravel'],
            'Symfony': [r'symfony', r'composer\.json.*symfony'],
            'CodeIgniter': [r'codeigniter', r'system/core'],
            
            # Go frameworks
            'Gin': [r'gin-gonic', r'gin\.Default'],
            'Echo': [r'labstack/echo', r'echo\.New'],
            'Fiber': [r'gofiber', r'fiber\.New'],
            
            # Mobile frameworks
            'React Native': [r'react-native', r'@react-native'],
            'Flutter': [r'flutter', r'pubspec\.yaml', r'lib/main\.dart'],
            'Ionic': [r'ionic', r'@ionic'],
            
            # Database ORMs
            'SQLAlchemy': [r'sqlalchemy', r'from sqlalchemy import'],
            'Mongoose': [r'mongoose', r'mongoose\.Schema'],
            'Sequelize': [r'sequelize', r'new Sequelize'],
            'Prisma': [r'prisma', r'@prisma/client'],
            
            # Testing frameworks
            'Jest': [r'jest', r'\.test\.js', r'\.spec\.js'],
            'Mocha': [r'mocha', r'describe\(', r'it\('],
            'PyTest': [r'pytest', r'test_.*\.py', r'conftest\.py'],
            'JUnit': [r'junit', r'@Test', r'import org\.junit'],
            'RSpec': [r'rspec', r'describe.*do', r'spec/.*_spec\.rb'],
        }
        
        # File extension to language mapping
        self.language_extensions = {
            '.py': 'Python',
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.jsx': 'JavaScript',
            '.tsx': 'TypeScript',
            '.java': 'Java',
            '.kt': 'Kotlin',
            '.scala': 'Scala',
            '.rb': 'Ruby',
            '.php': 'PHP',
            '.go': 'Go',
            '.rs': 'Rust',
            '.cpp': 'C++',
            '.cc': 'C++',
            '.cxx': 'C++',
            '.c': 'C',
            '.cs': 'C#',
            '.swift': 'Swift',
            '.m': 'Objective-C',
            '.dart': 'Dart',
            '.r': 'R',
            '.jl': 'Julia',
            '.hs': 'Haskell',
            '.elm': 'Elm',
            '.clj': 'Clojure',
            '.ex': 'Elixir',
            '.erl': 'Erlang',
            '.lua': 'Lua',
            '.pl': 'Perl',
            '.sh': 'Shell',
            '.bash': 'Shell',
            '.zsh': 'Shell',
            '.fish': 'Shell',
            '.ps1': 'PowerShell',
            '.sql': 'SQL',
            '.html': 'HTML',
            '.css': 'CSS',
            '.scss': 'SCSS',
            '.sass': 'Sass',
            '.less': 'Less',
            '.vue': 'Vue',
            '.svelte': 'Svelte',
        }
        
        # Configuration file patterns
        self.config_patterns = {
            'Docker': [r'Dockerfile', r'docker-compose\.yml', r'\.dockerignore'],
            'Kubernetes': [r'\.yaml$', r'\.yml$', r'kustomization'],
            'Terraform': [r'\.tf$', r'terraform'],
            'Ansible': [r'playbook\.yml', r'ansible'],
            'CI/CD': [r'\.github/workflows', r'\.gitlab-ci\.yml', r'Jenkinsfile', r'\.travis\.yml'],
            'Package Managers': [r'package\.json', r'requirements\.txt', r'Gemfile', r'pom\.xml', r'build\.gradle', r'Cargo\.toml'],
        }
        
        # Complexity indicators
        self.complexity_indicators = {
            'high_complexity_patterns': [
                r'class.*\(.*\):',  # Class inheritance
                r'def.*\*args.*\*\*kwargs',  # Variable arguments
                r'async def',  # Async functions
                r'yield',  # Generators
                r'lambda',  # Lambda functions
                r'@decorator',  # Decorators
                r'try:.*except:.*finally:',  # Complex exception handling
                r'with.*as.*:',  # Context managers
                r'if.*elif.*else:',  # Complex conditionals
                r'for.*in.*if.*',  # List comprehensions with conditions
            ],
            'architectural_patterns': [
                r'factory', r'singleton', r'observer', r'strategy',
                r'adapter', r'facade', r'proxy', r'builder',
                r'mvc', r'mvp', r'mvvm', r'repository'
            ],
            'advanced_concepts': [
                r'metaclass', r'descriptor', r'context.*manager',
                r'thread', r'multiprocess', r'async', r'await',
                r'websocket', r'graphql', r'microservice'
            ]
        }
    
    def analyze_repository(self, owner: str, repo_name: str, 
                          max_files: int = 100) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of a GitHub repository.
        
        Args:
            owner: Repository owner username
            repo_name: Repository name
            max_files: Maximum number of files to analyze
            
        Returns:
            Complete repository analysis
        """
        cache_key = f"repo_analysis_{owner}_{repo_name}"
        cached_result = cache.get(cache_key)
        
        if cached_result:
            logger.info(f"Using cached analysis for {owner}/{repo_name}")
            return cached_result
        
        try:
            logger.info(f"Starting repository analysis for {owner}/{repo_name}")
            
            # Get repository details
            repo_details = self.github_client.get_repository_details(owner, repo_name)
            
            # Analyze repository structure
            structure_analysis = self._analyze_repository_structure(owner, repo_name, max_files)
            
            # Analyze commit patterns
            commit_analysis = self._analyze_commit_patterns(owner, repo_name)
            
            # Extract technologies and frameworks
            tech_analysis = self._analyze_technologies(structure_analysis['files'])
            
            # Calculate complexity scores
            complexity_analysis = self._calculate_complexity_scores(
                structure_analysis, tech_analysis, commit_analysis
            )
            
            # Generate skill proficiency scores
            skill_scores = self._generate_skill_scores(
                tech_analysis, complexity_analysis, commit_analysis, repo_details
            )
            
            # Compile final analysis
            analysis_result = {
                'repository_info': {
                    'name': repo_details.get('name'),
                    'description': repo_details.get('description'),
                    'language': repo_details.get('language'),
                    'size': repo_details.get('size'),
                    'stars': repo_details.get('stargazers_count', 0),
                    'forks': repo_details.get('forks_count', 0),
                    'created_at': repo_details.get('created_at'),
                    'updated_at': repo_details.get('updated_at'),
                    'topics': repo_details.get('topics', []),
                },
                'languages': structure_analysis['languages'],
                'frameworks': tech_analysis['frameworks'],
                'technologies': tech_analysis['technologies'],
                'project_structure': structure_analysis['structure_analysis'],
                'complexity_metrics': complexity_analysis,
                'commit_patterns': commit_analysis,
                'skill_proficiency': skill_scores,
                'analysis_metadata': {
                    'analyzed_at': timezone.now().isoformat(),
                    'files_analyzed': len(structure_analysis['files']),
                    'total_lines_of_code': structure_analysis['total_loc'],
                    'analysis_version': '1.0'
                }
            }
            
            # Cache the result for 1 hour
            cache.set(cache_key, analysis_result, timeout=3600)
            
            logger.info(f"Repository analysis completed for {owner}/{repo_name}")
            return analysis_result
            
        except GitHubAPIError as e:
            logger.error(f"GitHub API error analyzing {owner}/{repo_name}: {str(e)}")
            raise RepositoryAnalysisError(f"Failed to analyze repository: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error analyzing {owner}/{repo_name}: {str(e)}")
            raise RepositoryAnalysisError(f"Repository analysis failed: {str(e)}")
    
    def _analyze_repository_structure(self, owner: str, repo_name: str, 
                                    max_files: int) -> Dict[str, Any]:
        """Analyze repository file structure and extract languages."""
        try:
            # Get repository contents
            contents = self._get_repository_files(owner, repo_name, max_files)
            
            # Analyze file structure
            languages = defaultdict(int)
            file_types = defaultdict(int)
            directory_structure = defaultdict(int)
            total_loc = 0
            
            analyzed_files = []
            
            for file_info in contents:
                file_path = file_info['path']
                file_size = file_info.get('size', 0)
                
                # Extract file extension
                if '.' in file_path:
                    extension = '.' + file_path.split('.')[-1].lower()
                    if extension in self.language_extensions:
                        language = self.language_extensions[extension]
                        languages[language] += 1
                        file_types[extension] += 1
                
                # Analyze directory structure
                if '/' in file_path:
                    directory = file_path.split('/')[0]
                    directory_structure[directory] += 1
                
                # Estimate lines of code (rough approximation)
                if file_size > 0:
                    estimated_loc = max(1, file_size // 50)  # Rough estimate
                    total_loc += estimated_loc
                
                analyzed_files.append({
                    'path': file_path,
                    'size': file_size,
                    'type': file_info.get('type', 'file')
                })
            
            # Analyze project structure patterns
            structure_analysis = self._analyze_project_patterns(directory_structure, analyzed_files)
            
            return {
                'languages': dict(languages),
                'file_types': dict(file_types),
                'directory_structure': dict(directory_structure),
                'structure_analysis': structure_analysis,
                'total_loc': total_loc,
                'files': analyzed_files
            }
            
        except Exception as e:
            logger.error(f"Error analyzing repository structure: {str(e)}")
            return {
                'languages': {},
                'file_types': {},
                'directory_structure': {},
                'structure_analysis': {},
                'total_loc': 0,
                'files': []
            }
    
    def _get_repository_files(self, owner: str, repo_name: str, 
                            max_files: int, path: str = "") -> List[Dict]:
        """Recursively get repository files up to max_files limit."""
        all_files = []
        
        try:
            contents = self.github_client.get_repository_contents(owner, repo_name, path)
            
            for item in contents:
                if len(all_files) >= max_files:
                    break
                
                if item['type'] == 'file':
                    all_files.append({
                        'path': item['path'],
                        'size': item.get('size', 0),
                        'type': 'file'
                    })
                elif item['type'] == 'dir' and len(all_files) < max_files:
                    # Recursively get files from subdirectories
                    subdir_files = self._get_repository_files(
                        owner, repo_name, max_files - len(all_files), item['path']
                    )
                    all_files.extend(subdir_files)
            
            return all_files
            
        except GitHubAPIError:
            return []
    
    def _analyze_project_patterns(self, directory_structure: Dict, 
                                files: List[Dict]) -> Dict[str, Any]:
        """Analyze project structure patterns to identify architecture."""
        patterns = {
            'mvc_pattern': False,
            'microservices': False,
            'monorepo': False,
            'test_coverage': False,
            'documentation': False,
            'ci_cd': False,
            'containerization': False,
            'api_design': False,
        }
        
        file_paths = [f['path'].lower() for f in files]
        
        # Check for MVC pattern
        mvc_indicators = ['models', 'views', 'controllers', 'templates']
        if sum(1 for indicator in mvc_indicators if indicator in directory_structure) >= 2:
            patterns['mvc_pattern'] = True
        
        # Check for microservices
        service_indicators = ['services', 'microservices', 'api', 'gateway']
        if any(indicator in directory_structure for indicator in service_indicators):
            patterns['microservices'] = True
        
        # Check for monorepo
        if len(directory_structure) > 10 and any(
            dir_name in ['packages', 'apps', 'libs', 'modules'] 
            for dir_name in directory_structure
        ):
            patterns['monorepo'] = True
        
        # Check for test coverage
        test_indicators = ['test', 'tests', 'spec', '__tests__']
        if any(indicator in directory_structure for indicator in test_indicators):
            patterns['test_coverage'] = True
        
        # Check for documentation
        doc_indicators = ['readme', 'docs', 'documentation', 'wiki']
        if any(any(indicator in path for indicator in doc_indicators) for path in file_paths):
            patterns['documentation'] = True
        
        # Check for CI/CD
        ci_indicators = ['.github', '.gitlab-ci', 'jenkinsfile', '.travis']
        if any(any(indicator in path for indicator in ci_indicators) for path in file_paths):
            patterns['ci_cd'] = True
        
        # Check for containerization
        container_indicators = ['dockerfile', 'docker-compose', '.dockerignore']
        if any(any(indicator in path for indicator in container_indicators) for path in file_paths):
            patterns['containerization'] = True
        
        # Check for API design
        api_indicators = ['api', 'swagger', 'openapi', 'graphql']
        if any(any(indicator in path for indicator in api_indicators) for path in file_paths):
            patterns['api_design'] = True
        
        return patterns
    
    def _analyze_commit_patterns(self, owner: str, repo_name: str) -> Dict[str, Any]:
        """Analyze commit patterns for activity and collaboration insights."""
        try:
            # Get recent commits (last 6 months)
            since_date = datetime.now() - timedelta(days=180)
            commits = self.github_client.get_commit_history(
                owner, repo_name, since=since_date, per_page=100
            )
            
            if not commits:
                return self._get_empty_commit_analysis()
            
            # Analyze commit patterns
            commit_frequency = len(commits)
            authors = set()
            commit_messages = []
            commit_dates = []
            
            for commit in commits:
                if commit.get('author'):
                    authors.add(commit['author'].get('login', 'unknown'))
                
                commit_info = commit.get('commit', {})
                if commit_info.get('message'):
                    commit_messages.append(commit_info['message'])
                
                if commit_info.get('author', {}).get('date'):
                    commit_dates.append(commit_info['author']['date'])
            
            # Calculate metrics
            collaboration_score = min(100, len(authors) * 20)  # More authors = more collaboration
            activity_score = min(100, commit_frequency * 2)  # More commits = more activity
            
            # Analyze commit message quality
            message_quality = self._analyze_commit_message_quality(commit_messages)
            
            # Analyze commit timing patterns
            timing_patterns = self._analyze_commit_timing(commit_dates)
            
            return {
                'commit_frequency': commit_frequency,
                'unique_authors': len(authors),
                'collaboration_score': collaboration_score,
                'activity_score': activity_score,
                'message_quality': message_quality,
                'timing_patterns': timing_patterns,
                'recent_activity': commit_frequency > 10,
                'analysis_period_days': 180
            }
            
        except Exception as e:
            logger.error(f"Error analyzing commit patterns: {str(e)}")
            return self._get_empty_commit_analysis()
    
    def _get_empty_commit_analysis(self) -> Dict[str, Any]:
        """Return empty commit analysis structure."""
        return {
            'commit_frequency': 0,
            'unique_authors': 0,
            'collaboration_score': 0,
            'activity_score': 0,
            'message_quality': {'score': 0, 'patterns': []},
            'timing_patterns': {'consistency': 0, 'peak_hours': []},
            'recent_activity': False,
            'analysis_period_days': 180
        }
    
    def _analyze_commit_message_quality(self, messages: List[str]) -> Dict[str, Any]:
        """Analyze quality of commit messages."""
        if not messages:
            return {'score': 0, 'patterns': []}
        
        quality_indicators = {
            'conventional_commits': 0,
            'descriptive_messages': 0,
            'proper_capitalization': 0,
            'reasonable_length': 0,
        }
        
        conventional_patterns = [
            r'^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+',
            r'^(add|update|remove|fix|improve): .+',
        ]
        
        for message in messages:
            # Check for conventional commit format
            if any(re.match(pattern, message.lower()) for pattern in conventional_patterns):
                quality_indicators['conventional_commits'] += 1
            
            # Check for descriptive messages (not just "update" or "fix")
            if len(message.split()) > 2 and not message.lower().strip() in ['update', 'fix', 'changes']:
                quality_indicators['descriptive_messages'] += 1
            
            # Check for proper capitalization
            if message and message[0].isupper():
                quality_indicators['proper_capitalization'] += 1
            
            # Check for reasonable length (not too short or too long)
            if 10 <= len(message) <= 100:
                quality_indicators['reasonable_length'] += 1
        
        # Calculate overall quality score
        total_messages = len(messages)
        quality_score = sum(
            (count / total_messages) * 25 
            for count in quality_indicators.values()
        )
        
        return {
            'score': min(100, quality_score),
            'patterns': quality_indicators
        }
    
    def _analyze_commit_timing(self, commit_dates: List[str]) -> Dict[str, Any]:
        """Analyze commit timing patterns."""
        if not commit_dates:
            return {'consistency': 0, 'peak_hours': []}
        
        try:
            # Parse dates and extract hours
            hours = []
            days_between_commits = []
            last_date = None
            
            for date_str in commit_dates:
                try:
                    date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    hours.append(date.hour)
                    
                    if last_date:
                        days_diff = (date - last_date).days
                        if days_diff > 0:
                            days_between_commits.append(days_diff)
                    last_date = date
                except:
                    continue
            
            # Calculate consistency (lower variance in commit intervals = higher consistency)
            consistency = 0
            if days_between_commits:
                import statistics
                if len(days_between_commits) > 1:
                    mean_interval = statistics.mean(days_between_commits)
                    variance = statistics.variance(days_between_commits)
                    consistency = max(0, 100 - (variance / max(1, mean_interval)) * 10)
            
            # Find peak hours
            hour_counts = Counter(hours)
            peak_hours = [hour for hour, count in hour_counts.most_common(3)]
            
            return {
                'consistency': min(100, consistency),
                'peak_hours': peak_hours
            }
            
        except Exception:
            return {'consistency': 0, 'peak_hours': []}
    
    def _analyze_technologies(self, files: List[Dict]) -> Dict[str, Any]:
        """Extract frameworks and technologies from file analysis."""
        frameworks = set()
        technologies = set()
        
        file_paths = [f['path'].lower() for f in files]
        all_content = ' '.join(file_paths)  # Simple content approximation
        
        # Detect frameworks
        for framework, patterns in self.framework_patterns.items():
            if any(re.search(pattern, all_content, re.IGNORECASE) for pattern in patterns):
                frameworks.add(framework)
        
        # Detect configuration technologies
        for tech, patterns in self.config_patterns.items():
            if any(re.search(pattern, all_content, re.IGNORECASE) for pattern in patterns):
                technologies.add(tech)
        
        # Additional technology detection based on file extensions and names
        tech_indicators = {
            'Database': ['sql', 'db', 'database', 'mongo', 'redis', 'postgres', 'mysql'],
            'Cloud': ['aws', 'azure', 'gcp', 'cloud', 'serverless'],
            'API': ['api', 'rest', 'graphql', 'swagger', 'openapi'],
            'Frontend': ['html', 'css', 'js', 'ts', 'scss', 'sass'],
            'Mobile': ['android', 'ios', 'mobile', 'react-native', 'flutter'],
            'DevOps': ['docker', 'kubernetes', 'terraform', 'ansible', 'jenkins'],
            'Testing': ['test', 'spec', 'jest', 'mocha', 'pytest', 'junit'],
        }
        
        for category, indicators in tech_indicators.items():
            if any(indicator in all_content for indicator in indicators):
                technologies.add(category)
        
        return {
            'frameworks': list(frameworks),
            'technologies': list(technologies)
        }
    
    def _calculate_complexity_scores(self, structure_analysis: Dict, 
                                   tech_analysis: Dict, 
                                   commit_analysis: Dict) -> Dict[str, float]:
        """Calculate various complexity scores."""
        
        # Code complexity based on structure
        code_complexity = 0
        if structure_analysis['total_loc'] > 0:
            # Base complexity on lines of code
            loc_score = min(10, structure_analysis['total_loc'] / 1000)
            
            # Add complexity for multiple languages
            language_score = min(3, len(structure_analysis['languages']) * 0.5)
            
            # Add complexity for project patterns
            pattern_score = sum(1 for pattern in structure_analysis['structure_analysis'].values() if pattern)
            
            code_complexity = loc_score + language_score + pattern_score
        
        # Technical complexity based on technologies
        tech_complexity = 0
        tech_complexity += len(tech_analysis['frameworks']) * 0.5
        tech_complexity += len(tech_analysis['technologies']) * 0.3
        
        # Collaboration complexity
        collab_complexity = min(5, commit_analysis['unique_authors'] * 0.5)
        
        # Overall complexity
        overall_complexity = min(10, (code_complexity + tech_complexity + collab_complexity) / 3)
        
        return {
            'code_complexity': round(code_complexity, 2),
            'technical_complexity': round(tech_complexity, 2),
            'collaboration_complexity': round(collab_complexity, 2),
            'overall_complexity': round(overall_complexity, 2)
        }
    
    def _generate_skill_scores(self, tech_analysis: Dict, complexity_analysis: Dict,
                             commit_analysis: Dict, repo_details: Dict) -> Dict[str, Dict]:
        """Generate skill proficiency scores based on analysis."""
        
        skill_scores = {}
        
        # Base scores from detected technologies
        all_technologies = tech_analysis['frameworks'] + tech_analysis['technologies']
        
        for tech in all_technologies:
            base_score = 40  # Base proficiency for detected technology
            
            # Adjust based on complexity
            complexity_bonus = complexity_analysis['overall_complexity'] * 5
            
            # Adjust based on repository popularity
            popularity_bonus = min(20, (repo_details.get('stargazers_count', 0) / 10))
            
            # Adjust based on commit activity
            activity_bonus = min(15, commit_analysis.get('activity_score', 0) / 10)
            
            # Adjust based on collaboration
            collab_bonus = min(10, commit_analysis.get('collaboration_score', 0) / 20)
            
            total_score = base_score + complexity_bonus + popularity_bonus + activity_bonus + collab_bonus
            total_score = min(100, max(0, total_score))
            
            # Determine proficiency level
            if total_score >= 80:
                level = 'Expert'
            elif total_score >= 65:
                level = 'Advanced'
            elif total_score >= 50:
                level = 'Intermediate'
            elif total_score >= 30:
                level = 'Beginner'
            else:
                level = 'Novice'
            
            skill_scores[tech] = {
                'proficiency_score': round(total_score, 2),
                'proficiency_level': level,
                'evidence': {
                    'complexity_contribution': round(complexity_bonus, 2),
                    'popularity_contribution': round(popularity_bonus, 2),
                    'activity_contribution': round(activity_bonus, 2),
                    'collaboration_contribution': round(collab_bonus, 2)
                }
            }
        
        return skill_scores
    
    def analyze_multiple_repositories(self, username: str, 
                                    max_repos: int = 20) -> Dict[str, Any]:
        """
        Analyze multiple repositories for comprehensive developer assessment.
        
        Args:
            username: GitHub username
            max_repos: Maximum number of repositories to analyze
            
        Returns:
            Aggregated analysis across all repositories
        """
        try:
            # Get user repositories
            repositories = self.github_client.get_user_repositories(username, per_page=max_repos)
            
            if not repositories:
                raise RepositoryAnalysisError(f"No repositories found for user {username}")
            
            # Analyze each repository
            repo_analyses = []
            for repo in repositories[:max_repos]:
                if repo.get('fork'):
                    continue  # Skip forked repositories
                
                try:
                    analysis = self.analyze_repository(username, repo['name'])
                    repo_analyses.append(analysis)
                except Exception as e:
                    logger.warning(f"Failed to analyze {repo['name']}: {str(e)}")
                    continue
            
            # Aggregate results
            aggregated_analysis = self._aggregate_repository_analyses(repo_analyses)
            
            return {
                'username': username,
                'repositories_analyzed': len(repo_analyses),
                'total_repositories': len(repositories),
                'aggregated_skills': aggregated_analysis['skills'],
                'overall_complexity': aggregated_analysis['complexity'],
                'technology_stack': aggregated_analysis['technologies'],
                'development_patterns': aggregated_analysis['patterns'],
                'activity_metrics': aggregated_analysis['activity'],
                'analysis_metadata': {
                    'analyzed_at': timezone.now().isoformat(),
                    'analysis_version': '1.0'
                }
            }
            
        except Exception as e:
            logger.error(f"Error in multiple repository analysis for {username}: {str(e)}")
            raise RepositoryAnalysisError(f"Multiple repository analysis failed: {str(e)}")
    
    def _aggregate_repository_analyses(self, analyses: List[Dict]) -> Dict[str, Any]:
        """Aggregate multiple repository analyses into overall assessment."""
        
        if not analyses:
            return {
                'skills': {},
                'complexity': 0,
                'technologies': [],
                'patterns': {},
                'activity': {}
            }
        
        # Aggregate skills
        all_skills = defaultdict(list)
        for analysis in analyses:
            for skill, data in analysis.get('skill_proficiency', {}).items():
                all_skills[skill].append(data['proficiency_score'])
        
        # Calculate average skill scores
        aggregated_skills = {}
        for skill, scores in all_skills.items():
            avg_score = sum(scores) / len(scores)
            max_score = max(scores)
            
            # Weight towards higher scores (developer's best work)
            final_score = (avg_score * 0.6) + (max_score * 0.4)
            
            if final_score >= 80:
                level = 'Expert'
            elif final_score >= 65:
                level = 'Advanced'
            elif final_score >= 50:
                level = 'Intermediate'
            elif final_score >= 30:
                level = 'Beginner'
            else:
                level = 'Novice'
            
            aggregated_skills[skill] = {
                'proficiency_score': round(final_score, 2),
                'proficiency_level': level,
                'repository_count': len(scores),
                'score_range': [min(scores), max(scores)]
            }
        
        # Aggregate complexity
        complexity_scores = [a.get('complexity_metrics', {}).get('overall_complexity', 0) for a in analyses]
        avg_complexity = sum(complexity_scores) / len(complexity_scores) if complexity_scores else 0
        
        # Aggregate technologies
        all_technologies = set()
        for analysis in analyses:
            all_technologies.update(analysis.get('frameworks', []))
            all_technologies.update(analysis.get('technologies', []))
        
        # Aggregate patterns
        pattern_counts = defaultdict(int)
        for analysis in analyses:
            for pattern, present in analysis.get('project_structure', {}).items():
                if present:
                    pattern_counts[pattern] += 1
        
        # Aggregate activity
        total_commits = sum(a.get('commit_patterns', {}).get('commit_frequency', 0) for a in analyses)
        avg_activity = sum(a.get('commit_patterns', {}).get('activity_score', 0) for a in analyses) / len(analyses)
        
        return {
            'skills': aggregated_skills,
            'complexity': round(avg_complexity, 2),
            'technologies': list(all_technologies),
            'patterns': dict(pattern_counts),
            'activity': {
                'total_commits_analyzed': total_commits,
                'average_activity_score': round(avg_activity, 2),
                'repositories_with_recent_activity': sum(
                    1 for a in analyses 
                    if a.get('commit_patterns', {}).get('recent_activity', False)
                )
            }
        }


class RepositoryAnalysisError(Exception):
    """Exception raised for repository analysis errors."""
    pass