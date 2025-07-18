#!/usr/bin/env python
"""
Simple test script for GitHub API client functionality without Django cache dependency.
"""

import requests
import time
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta

# Simple in-memory cache for testing
_cache = {}

class SimpleCache:
    @staticmethod
    def get(key):
        return _cache.get(key)
    
    @staticmethod
    def set(key, value, timeout=None):
        _cache[key] = value

# Mock Django cache
import sys
from unittest.mock import MagicMock
sys.modules['django.core.cache'] = MagicMock()
sys.modules['django.core.cache'].cache = SimpleCache()
sys.modules['django.conf'] = MagicMock()

# Mock settings
class MockSettings:
    GITHUB_API_BASE_URL = 'https://api.github.com'
    GITHUB_CLIENT_ID = ''
    GITHUB_CLIENT_SECRET = ''

sys.modules['django.conf'].settings = MockSettings()

# Mock exceptions
class GitHubAPIError(Exception):
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class RateLimitExceededError(GitHubAPIError):
    def __init__(self, message, reset_time=None):
        self.reset_time = reset_time
        super().__init__(message, status_code=403)

# Simple GitHub client for testing
class SimpleGitHubClient:
    def __init__(self, access_token=None):
        self.base_url = 'https://api.github.com'
        self.access_token = access_token
        self.session = requests.Session()
        
        if self.access_token:
            self.session.headers.update({
                'Authorization': f'token {self.access_token}',
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'FreelancePlatform/1.0'
            })
        else:
            self.session.headers.update({
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'FreelancePlatform/1.0'
            })
    
    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict:
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            response = self.session.get(url, params=params or {})
            
            if response.status_code == 403 and 'rate limit' in response.text.lower():
                raise RateLimitExceededError("Rate limit exceeded")
            elif response.status_code == 404:
                raise GitHubAPIError(f"Resource not found: {endpoint}", status_code=404)
            elif response.status_code == 401:
                raise GitHubAPIError("Authentication failed", status_code=401)
            elif not response.ok:
                raise GitHubAPIError(
                    f"GitHub API error: {response.status_code} - {response.text}",
                    status_code=response.status_code
                )
            
            return response.json()
            
        except requests.RequestException as e:
            raise GitHubAPIError(f"Request failed: {str(e)}")
    
    def get_user_profile(self, username: str) -> Dict:
        return self._make_request(f"users/{username}")
    
    def get_user_repositories(self, username: str, per_page: int = 30) -> List[Dict]:
        params = {
            'per_page': min(per_page, 100),
            'sort': 'updated',
            'direction': 'desc'
        }
        return self._make_request(f"users/{username}/repos", params)
    
    def get_repository_details(self, owner: str, repo: str) -> Dict:
        repo_data = self._make_request(f"repos/{owner}/{repo}")
        
        try:
            languages = self._make_request(f"repos/{owner}/{repo}/languages")
            repo_data['languages'] = languages
        except GitHubAPIError:
            repo_data['languages'] = {}
        
        return repo_data


def test_github_functionality():
    """Test basic GitHub functionality."""
    print("Testing Simple GitHub Client...")
    
    client = SimpleGitHubClient()
    
    try:
        # Test user profile retrieval
        print("\n1. Testing user profile retrieval...")
        test_username = "octocat"
        try:
            user_profile = client.get_user_profile(test_username)
            print(f"   ✅ User: {user_profile.get('name', 'N/A')} (@{user_profile.get('login', 'N/A')})")
            print(f"   Public repos: {user_profile.get('public_repos', 'N/A')}")
            print(f"   Followers: {user_profile.get('followers', 'N/A')}")
        except GitHubAPIError as e:
            print(f"   ❌ Error fetching user profile: {e}")
            return False
        
        # Test repository listing
        print("\n2. Testing repository listing...")
        try:
            repositories = client.get_user_repositories(test_username, per_page=5)
            print(f"   ✅ Found {len(repositories)} repositories")
            for repo in repositories[:3]:
                print(f"   - {repo.get('name', 'N/A')} ({repo.get('language', 'N/A')})")
        except GitHubAPIError as e:
            print(f"   ❌ Error fetching repositories: {e}")
            return False
        
        # Test repository details
        print("\n3. Testing repository details...")
        try:
            repo_details = client.get_repository_details("octocat", "Hello-World")
            print(f"   ✅ Repository: {repo_details.get('name', 'N/A')}")
            print(f"   Description: {repo_details.get('description', 'N/A')}")
            print(f"   Languages: {list(repo_details.get('languages', {}).keys())}")
            print(f"   Stars: {repo_details.get('stargazers_count', 'N/A')}")
        except GitHubAPIError as e:
            print(f"   ❌ Error fetching repository details: {e}")
            return False
        
        # Test error handling
        print("\n4. Testing error handling...")
        try:
            client.get_user_profile("this-user-definitely-does-not-exist-12345")
            print("   ❌ Should have raised an error")
            return False
        except GitHubAPIError as e:
            if e.status_code == 404:
                print("   ✅ Correctly handled 404 error")
            else:
                print(f"   ⚠️  Unexpected error: {e}")
                return False
        
        print("\n✅ All GitHub client tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ GitHub client test failed: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Simple GitHub API Client Test")
    print("=" * 60)
    
    success = test_github_functionality()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 GitHub client is working correctly!")
    else:
        print("❌ GitHub client tests failed!")
    
    exit(0 if success else 1)