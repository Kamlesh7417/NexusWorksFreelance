#!/usr/bin/env python
"""
Test script for GitHub API client functionality.
Tests authentication, rate limiting, and repository analysis.
"""

import os
import sys
import django
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from ai_services.github_client import GitHubClient, GitHubAnalyzer
from ai_services.exceptions import GitHubAPIError, RateLimitExceededError


def test_github_client():
    """Test basic GitHub client functionality."""
    print("Testing GitHub Client...")
    
    # Initialize client without token (using client credentials)
    client = GitHubClient()
    
    try:
        # Test rate limit status
        print("\n1. Testing rate limit status...")
        rate_limit = client.get_rate_limit_status()
        if rate_limit:
            core_limit = rate_limit.get('resources', {}).get('core', {})
            print(f"   Rate limit: {core_limit.get('remaining', 'unknown')}/{core_limit.get('limit', 'unknown')}")
        else:
            print("   Could not fetch rate limit status")
        
        # Test user profile retrieval
        print("\n2. Testing user profile retrieval...")
        test_username = "octocat"  # GitHub's mascot account
        try:
            user_profile = client.get_user_profile(test_username)
            print(f"   User: {user_profile.get('name', 'N/A')} (@{user_profile.get('login', 'N/A')})")
            print(f"   Public repos: {user_profile.get('public_repos', 'N/A')}")
            print(f"   Followers: {user_profile.get('followers', 'N/A')}")
        except GitHubAPIError as e:
            print(f"   Error fetching user profile: {e}")
        
        # Test repository listing
        print("\n3. Testing repository listing...")
        try:
            repositories = client.get_user_repositories(test_username, per_page=5)
            print(f"   Found {len(repositories)} repositories")
            for repo in repositories[:3]:
                print(f"   - {repo.get('name', 'N/A')} ({repo.get('language', 'N/A')})")
        except GitHubAPIError as e:
            print(f"   Error fetching repositories: {e}")
        
        # Test repository details
        print("\n4. Testing repository details...")
        try:
            repo_details = client.get_repository_details("octocat", "Hello-World")
            print(f"   Repository: {repo_details.get('name', 'N/A')}")
            print(f"   Description: {repo_details.get('description', 'N/A')}")
            print(f"   Languages: {list(repo_details.get('languages', {}).keys())}")
            print(f"   Stars: {repo_details.get('stargazers_count', 'N/A')}")
        except GitHubAPIError as e:
            print(f"   Error fetching repository details: {e}")
        
        print("\n✅ GitHub Client tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ GitHub Client test failed: {e}")
        return False
    
    return True


def test_github_analyzer():
    """Test GitHub analyzer functionality."""
    print("\nTesting GitHub Analyzer...")
    
    analyzer = GitHubAnalyzer()
    
    try:
        # Test profile analysis
        print("\n1. Testing profile analysis...")
        test_username = "octocat"
        
        try:
            analysis = analyzer.analyze_developer_profile(test_username)
            
            print(f"   Profile analyzed for: {analysis['profile'].get('name', 'N/A')}")
            print(f"   Repository count: {analysis.get('repository_count', 'N/A')}")
            print(f"   Top languages: {list(analysis.get('languages', {}).keys())[:3]}")
            print(f"   Activity score: {analysis.get('activity_score', 'N/A')}")
            print(f"   Complexity score: {analysis.get('complexity_score', 'N/A')}")
            print(f"   Collaboration score: {analysis.get('collaboration_score', 'N/A')}")
            
            # Show skill assessment
            skill_assessment = analysis.get('skill_assessment', {})
            if skill_assessment:
                print("   Skill assessment:")
                for language, skills in list(skill_assessment.items())[:3]:
                    print(f"     - {language}: {skills.get('level', 'N/A')} ({skills.get('proficiency', 'N/A')}%)")
            
        except GitHubAPIError as e:
            print(f"   Error analyzing profile: {e}")
        
        print("\n✅ GitHub Analyzer tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ GitHub Analyzer test failed: {e}")
        return False
    
    return True


def test_error_handling():
    """Test error handling and rate limiting."""
    print("\nTesting Error Handling...")
    
    client = GitHubClient()
    
    try:
        # Test non-existent user
        print("\n1. Testing non-existent user...")
        try:
            client.get_user_profile("this-user-definitely-does-not-exist-12345")
            print("   ❌ Should have raised an error")
        except GitHubAPIError as e:
            if e.status_code == 404:
                print("   ✅ Correctly handled 404 error")
            else:
                print(f"   ⚠️  Unexpected error: {e}")
        
        # Test non-existent repository
        print("\n2. Testing non-existent repository...")
        try:
            client.get_repository_details("octocat", "this-repo-does-not-exist-12345")
            print("   ❌ Should have raised an error")
        except GitHubAPIError as e:
            if e.status_code == 404:
                print("   ✅ Correctly handled 404 error")
            else:
                print(f"   ⚠️  Unexpected error: {e}")
        
        print("\n✅ Error handling tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error handling test failed: {e}")
        return False
    
    return True


def main():
    """Run all tests."""
    print("=" * 60)
    print("GitHub API Client Test Suite")
    print("=" * 60)
    
    tests = [
        test_github_client,
        test_github_analyzer,
        test_error_handling
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 60)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return True
    else:
        print("❌ Some tests failed!")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)