"""
GitHub API client for repository analysis and developer skill assessment.
Handles authentication, rate limiting, and comprehensive repository analysis.
"""

import requests
import time
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from django.conf import settings
from django.core.cache import cache
from .exceptions import GitHubAPIError, RateLimitExceededError

logger = logging.getLogger(__name__)


class GitHubClient:
    """
    GitHub API client with authentication, rate limiting, and error handling.
    Provides methods for repository analysis and developer profile assessment.
    """
    
    def __init__(self, access_token: Optional[str] = None):
        """
        Initialize GitHub client with optional access token.
        
        Args:
            access_token: GitHub personal access token or OAuth token
        """
        self.base_url = settings.GITHUB_API_BASE_URL
        self.access_token = access_token
        self.session = requests.Session()
        
        # Set up authentication headers
        if self.access_token:
            self.session.headers.update({
                'Authorization': f'token {self.access_token}',
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'FreelancePlatform/1.0'
            })
        else:
            # Use client credentials for higher rate limits
            self.session.auth = (
                settings.GITHUB_CLIENT_ID,
                settings.GITHUB_CLIENT_SECRET
            )
            self.session.headers.update({
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'FreelancePlatform/1.0'
            })
    
    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict:
        """
        Make authenticated request to GitHub API with rate limiting and error handling.
        
        Args:
            endpoint: API endpoint (without base URL)
            params: Query parameters
            
        Returns:
            JSON response data
            
        Raises:
            GitHubAPIError: For API errors
            RateLimitExceededError: When rate limit is exceeded
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        # Check rate limit before making request
        self._check_rate_limit()
        
        try:
            response = self.session.get(url, params=params or {})
            
            # Handle rate limiting
            if response.status_code == 403 and 'rate limit' in response.text.lower():
                reset_time = int(response.headers.get('X-RateLimit-Reset', 0))
                wait_time = max(0, reset_time - int(time.time()))
                raise RateLimitExceededError(
                    f"Rate limit exceeded. Reset in {wait_time} seconds.",
                    reset_time=reset_time
                )
            
            # Handle other HTTP errors
            if response.status_code == 404:
                raise GitHubAPIError(f"Resource not found: {endpoint}", status_code=404)
            elif response.status_code == 401:
                raise GitHubAPIError("Authentication failed", status_code=401)
            elif not response.ok:
                raise GitHubAPIError(
                    f"GitHub API error: {response.status_code} - {response.text}",
                    status_code=response.status_code
                )
            
            # Update rate limit info in cache
            self._update_rate_limit_info(response.headers)
            
            return response.json()
            
        except requests.RequestException as e:
            logger.error(f"Request failed for {url}: {str(e)}")
            raise GitHubAPIError(f"Request failed: {str(e)}")
    
    def _check_rate_limit(self) -> None:
        """Check current rate limit status and wait if necessary."""
        rate_limit_info = cache.get('github_rate_limit_info')
        if rate_limit_info:
            remaining = rate_limit_info.get('remaining', 1)
            reset_time = rate_limit_info.get('reset', 0)
            
            if remaining <= 10 and reset_time > time.time():
                wait_time = int(reset_time - time.time()) + 1
                logger.warning(f"Approaching rate limit. Waiting {wait_time} seconds.")
                time.sleep(wait_time)
    
    def _update_rate_limit_info(self, headers: Dict) -> None:
        """Update rate limit information in cache."""
        rate_limit_info = {
            'limit': int(headers.get('X-RateLimit-Limit', 0)),
            'remaining': int(headers.get('X-RateLimit-Remaining', 0)),
            'reset': int(headers.get('X-RateLimit-Reset', 0)),
            'updated_at': time.time()
        }
        cache.set('github_rate_limit_info', rate_limit_info, timeout=3600)
    
    def get_user_profile(self, username: str) -> Dict:
        """
        Get GitHub user profile information.
        
        Args:
            username: GitHub username
            
        Returns:
            User profile data
        """
        cache_key = f"github_user_{username}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        try:
            user_data = self._make_request(f"users/{username}")
            
            # Cache for 1 hour
            cache.set(cache_key, user_data, timeout=3600)
            return user_data
            
        except GitHubAPIError as e:
            logger.error(f"Failed to fetch user profile for {username}: {str(e)}")
            raise
    
    def get_user_repositories(self, username: str, per_page: int = 100) -> List[Dict]:
        """
        Get all public repositories for a user.
        
        Args:
            username: GitHub username
            per_page: Number of repositories per page (max 100)
            
        Returns:
            List of repository data
        """
        cache_key = f"github_repos_{username}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        repositories = []
        page = 1
        
        try:
            while True:
                params = {
                    'per_page': min(per_page, 100),
                    'page': page,
                    'sort': 'updated',
                    'direction': 'desc'
                }
                
                repos_data = self._make_request(f"users/{username}/repos", params)
                
                if not repos_data:
                    break
                
                repositories.extend(repos_data)
                
                # Stop if we got less than requested (last page)
                if len(repos_data) < per_page:
                    break
                
                page += 1
                
                # Limit to prevent excessive API calls
                if page > 10:  # Max 1000 repositories
                    break
            
            # Cache for 30 minutes
            cache.set(cache_key, repositories, timeout=1800)
            return repositories
            
        except GitHubAPIError as e:
            logger.error(f"Failed to fetch repositories for {username}: {str(e)}")
            raise
    
    def get_repository_details(self, owner: str, repo: str) -> Dict:
        """
        Get detailed repository information including languages and statistics.
        
        Args:
            owner: Repository owner username
            repo: Repository name
            
        Returns:
            Repository details with languages and stats
        """
        cache_key = f"github_repo_details_{owner}_{repo}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        try:
            # Get basic repository info
            repo_data = self._make_request(f"repos/{owner}/{repo}")
            
            # Get languages
            try:
                languages = self._make_request(f"repos/{owner}/{repo}/languages")
                repo_data['languages'] = languages
            except GitHubAPIError:
                repo_data['languages'] = {}
            
            # Get commit activity (last year)
            try:
                commit_activity = self._make_request(f"repos/{owner}/{repo}/stats/commit_activity")
                repo_data['commit_activity'] = commit_activity
            except GitHubAPIError:
                repo_data['commit_activity'] = []
            
            # Get contributors
            try:
                contributors = self._make_request(f"repos/{owner}/{repo}/contributors")
                repo_data['contributors'] = contributors[:10]  # Top 10 contributors
            except GitHubAPIError:
                repo_data['contributors'] = []
            
            # Cache for 1 hour
            cache.set(cache_key, repo_data, timeout=3600)
            return repo_data
            
        except GitHubAPIError as e:
            logger.error(f"Failed to fetch repository details for {owner}/{repo}: {str(e)}")
            raise
    
    def get_repository_contents(self, owner: str, repo: str, path: str = "") -> List[Dict]:
        """
        Get repository contents for analysis.
        
        Args:
            owner: Repository owner username
            repo: Repository name
            path: Path within repository (default: root)
            
        Returns:
            List of file/directory information
        """
        try:
            contents = self._make_request(f"repos/{owner}/{repo}/contents/{path}")
            return contents if isinstance(contents, list) else [contents]
        except GitHubAPIError as e:
            logger.error(f"Failed to fetch contents for {owner}/{repo}/{path}: {str(e)}")
            return []
    
    def get_file_content(self, owner: str, repo: str, path: str) -> Optional[str]:
        """
        Get content of a specific file.
        
        Args:
            owner: Repository owner username
            repo: Repository name
            path: File path
            
        Returns:
            File content as string, or None if not accessible
        """
        try:
            file_data = self._make_request(f"repos/{owner}/{repo}/contents/{path}")
            
            if file_data.get('encoding') == 'base64':
                import base64
                content = base64.b64decode(file_data['content']).decode('utf-8', errors='ignore')
                return content
            
            return file_data.get('content', '')
            
        except GitHubAPIError:
            return None
    
    def get_commit_history(self, owner: str, repo: str, since: Optional[datetime] = None, 
                          per_page: int = 100) -> List[Dict]:
        """
        Get commit history for repository analysis.
        
        Args:
            owner: Repository owner username
            repo: Repository name
            since: Only commits after this date
            per_page: Number of commits per page
            
        Returns:
            List of commit data
        """
        params = {'per_page': min(per_page, 100)}
        
        if since:
            params['since'] = since.isoformat()
        
        try:
            commits = self._make_request(f"repos/{owner}/{repo}/commits", params)
            return commits
        except GitHubAPIError as e:
            logger.error(f"Failed to fetch commit history for {owner}/{repo}: {str(e)}")
            return []
    
    def search_repositories(self, query: str, language: Optional[str] = None, 
                           sort: str = 'stars', per_page: int = 30) -> Dict:
        """
        Search repositories by query.
        
        Args:
            query: Search query
            language: Filter by programming language
            sort: Sort order (stars, forks, updated)
            per_page: Number of results per page
            
        Returns:
            Search results
        """
        search_query = query
        if language:
            search_query += f" language:{language}"
        
        params = {
            'q': search_query,
            'sort': sort,
            'order': 'desc',
            'per_page': min(per_page, 100)
        }
        
        try:
            return self._make_request("search/repositories", params)
        except GitHubAPIError as e:
            logger.error(f"Repository search failed for query '{query}': {str(e)}")
            return {'items': [], 'total_count': 0}
    
    def get_rate_limit_status(self) -> Dict:
        """
        Get current rate limit status.
        
        Returns:
            Rate limit information
        """
        try:
            return self._make_request("rate_limit")
        except GitHubAPIError as e:
            logger.error(f"Failed to fetch rate limit status: {str(e)}")
            return {}


class GitHubAnalyzer:
    """
    High-level analyzer for GitHub profiles and repositories.
    Provides comprehensive analysis for developer skill assessment.
    """
    
    def __init__(self, access_token: Optional[str] = None):
        """Initialize with GitHub client."""
        self.client = GitHubClient(access_token)
    
    def analyze_developer_profile(self, username: str) -> Dict:
        """
        Comprehensive analysis of a developer's GitHub profile.
        
        Args:
            username: GitHub username
            
        Returns:
            Complete profile analysis
        """
        try:
            # Get user profile
            user_profile = self.client.get_user_profile(username)
            
            # Get repositories
            repositories = self.client.get_user_repositories(username)
            
            # Analyze repositories
            repo_analysis = self._analyze_repositories(repositories, username)
            
            # Combine analysis
            analysis = {
                'profile': user_profile,
                'repository_count': len(repositories),
                'languages': repo_analysis['languages'],
                'frameworks': repo_analysis['frameworks'],
                'activity_score': repo_analysis['activity_score'],
                'complexity_score': repo_analysis['complexity_score'],
                'collaboration_score': repo_analysis['collaboration_score'],
                'recent_activity': repo_analysis['recent_activity'],
                'top_repositories': repo_analysis['top_repositories'],
                'skill_assessment': repo_analysis['skill_assessment'],
                'analyzed_at': datetime.now().isoformat()
            }
            
            return analysis
            
        except GitHubAPIError as e:
            logger.error(f"Profile analysis failed for {username}: {str(e)}")
            raise
    
    def _analyze_repositories(self, repositories: List[Dict], username: str) -> Dict:
        """
        Analyze a list of repositories for skill assessment.
        
        Args:
            repositories: List of repository data
            username: GitHub username for filtering contributions
            
        Returns:
            Repository analysis results
        """
        languages = {}
        frameworks = set()
        total_stars = 0
        total_forks = 0
        recent_commits = 0
        collaboration_repos = 0
        top_repos = []
        
        # Analyze each repository
        for repo in repositories[:50]:  # Limit to top 50 repositories
            if repo.get('fork'):
                continue  # Skip forked repositories for primary analysis
            
            # Language analysis
            repo_languages = repo.get('language')
            if repo_languages:
                languages[repo_languages] = languages.get(repo_languages, 0) + 1
            
            # Stars and forks
            total_stars += repo.get('stargazers_count', 0)
            total_forks += repo.get('forks_count', 0)
            
            # Recent activity (updated in last 6 months)
            updated_at = repo.get('updated_at')
            if updated_at:
                try:
                    update_date = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
                    if update_date > datetime.now().replace(tzinfo=update_date.tzinfo) - timedelta(days=180):
                        recent_commits += 1
                except:
                    pass
            
            # Collaboration (has contributors other than owner)
            if repo.get('stargazers_count', 0) > 0 or repo.get('forks_count', 0) > 0:
                collaboration_repos += 1
            
            # Top repositories by stars
            if repo.get('stargazers_count', 0) > 0:
                top_repos.append({
                    'name': repo['name'],
                    'description': repo.get('description', ''),
                    'language': repo.get('language'),
                    'stars': repo.get('stargazers_count', 0),
                    'forks': repo.get('forks_count', 0),
                    'url': repo['html_url']
                })
        
        # Sort top repositories by stars
        top_repos.sort(key=lambda x: x['stars'], reverse=True)
        top_repos = top_repos[:10]
        
        # Calculate scores
        activity_score = min(100, (recent_commits / max(1, len(repositories))) * 100)
        complexity_score = min(100, (total_stars + total_forks) / max(1, len(repositories)) * 10)
        collaboration_score = min(100, (collaboration_repos / max(1, len(repositories))) * 100)
        
        # Skill assessment based on languages and activity
        skill_assessment = self._assess_skills(languages, activity_score, complexity_score)
        
        return {
            'languages': dict(sorted(languages.items(), key=lambda x: x[1], reverse=True)),
            'frameworks': list(frameworks),
            'activity_score': round(activity_score, 2),
            'complexity_score': round(complexity_score, 2),
            'collaboration_score': round(collaboration_score, 2),
            'recent_activity': recent_commits,
            'top_repositories': top_repos,
            'skill_assessment': skill_assessment
        }
    
    def _assess_skills(self, languages: Dict[str, int], activity_score: float, 
                      complexity_score: float) -> Dict:
        """
        Assess skill levels based on language usage and activity.
        
        Args:
            languages: Language usage counts
            activity_score: Activity score
            complexity_score: Complexity score
            
        Returns:
            Skill assessment with proficiency levels
        """
        skill_levels = {}
        total_repos = sum(languages.values())
        
        for language, count in languages.items():
            # Base proficiency on usage frequency
            usage_ratio = count / max(1, total_repos)
            
            # Adjust based on activity and complexity
            proficiency = usage_ratio * 100
            proficiency += (activity_score * 0.1)
            proficiency += (complexity_score * 0.1)
            
            # Normalize to 0-100 scale
            proficiency = min(100, max(0, proficiency))
            
            # Categorize proficiency level
            if proficiency >= 80:
                level = 'Expert'
            elif proficiency >= 60:
                level = 'Advanced'
            elif proficiency >= 40:
                level = 'Intermediate'
            elif proficiency >= 20:
                level = 'Beginner'
            else:
                level = 'Novice'
            
            skill_levels[language] = {
                'proficiency': round(proficiency, 2),
                'level': level,
                'repository_count': count
            }
        
        return skill_levels