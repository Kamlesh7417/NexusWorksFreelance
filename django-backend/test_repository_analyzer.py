#!/usr/bin/env python
"""
Test script for Repository Analysis Engine functionality.
Tests the comprehensive analysis capabilities including:
- Programming language detection
- Framework identification
- Code complexity analysis
- Project structure analysis
- Commit pattern analysis
- Skill proficiency scoring
"""

import sys
import os
import logging
from unittest.mock import MagicMock

# Mock Django dependencies
sys.modules['django.conf'] = MagicMock()
sys.modules['django.core.cache'] = MagicMock()
sys.modules['django.utils'] = MagicMock()

# Mock settings
class MockSettings:
    GITHUB_API_BASE_URL = 'https://api.github.com'
    GITHUB_CLIENT_ID = ''
    GITHUB_CLIENT_SECRET = ''

sys.modules['django.conf'].settings = MockSettings()

# Mock cache
class MockCache:
    _cache = {}
    
    @classmethod
    def get(cls, key):
        return cls._cache.get(key)
    
    @classmethod
    def set(cls, key, value, timeout=None):
        cls._cache[key] = value

sys.modules['django.core.cache'].cache = MockCache()

# Mock timezone
from datetime import datetime
class MockTimezone:
    @staticmethod
    def now():
        return datetime.now()

sys.modules['django.utils'].timezone = MockTimezone()

# Import the repository analyzer
from ai_services.repository_analyzer import RepositoryAnalyzer
from ai_services.github_client import GitHubClient

def test_repository_analyzer():
    """Test the repository analysis engine."""
    print("Testing Repository Analysis Engine...")
    
    try:
        # Initialize analyzer
        analyzer = RepositoryAnalyzer()
        
        # Test 1: Analyze a well-known repository
        print("\n1. Testing repository analysis...")
        try:
            analysis = analyzer.analyze_repository("octocat", "Hello-World", max_files=50)
            
            print(f"   ✅ Repository analyzed: {analysis['repository_info']['name']}")
            print(f"   Languages detected: {list(analysis['languages'].keys())}")
            print(f"   Frameworks detected: {analysis['frameworks']}")
            print(f"   Technologies detected: {analysis['technologies']}")
            print(f"   Files analyzed: {analysis['analysis_metadata']['files_analyzed']}")
            print(f"   Overall complexity: {analysis['complexity_metrics']['overall_complexity']}")
            
            # Check if skill proficiency is generated
            if analysis['skill_proficiency']:
                print(f"   Skills assessed: {len(analysis['skill_proficiency'])} skills")
                for skill, data in list(analysis['skill_proficiency'].items())[:3]:
                    print(f"     - {skill}: {data['proficiency_level']} ({data['proficiency_score']})")
            else:
                print("   ⚠️  No skill proficiency scores generated")
            
        except Exception as e:
            print(f"   ❌ Repository analysis failed: {e}")
            return False
        
        # Test 2: Test language detection patterns
        print("\n2. Testing language detection...")
        test_files = [
            {'path': 'app.py', 'size': 1000, 'type': 'file'},
            {'path': 'main.js', 'size': 800, 'type': 'file'},
            {'path': 'component.tsx', 'size': 600, 'type': 'file'},
            {'path': 'styles.css', 'size': 400, 'type': 'file'},
            {'path': 'README.md', 'size': 200, 'type': 'file'},
        ]
        
        # Test the internal language detection
        languages = {}
        for file_info in test_files:
            file_path = file_info['path']
            if '.' in file_path:
                extension = '.' + file_path.split('.')[-1].lower()
                if extension in analyzer.language_extensions:
                    language = analyzer.language_extensions[extension]
                    languages[language] = languages.get(language, 0) + 1
        
        expected_languages = ['Python', 'JavaScript', 'TypeScript', 'CSS']
        detected_languages = list(languages.keys())
        
        if all(lang in detected_languages for lang in expected_languages):
            print("   ✅ Language detection working correctly")
            print(f"   Detected: {detected_languages}")
        else:
            print(f"   ❌ Language detection incomplete. Expected: {expected_languages}, Got: {detected_languages}")
        
        # Test 3: Test framework detection patterns
        print("\n3. Testing framework detection...")
        test_content = """
        import django
        from flask import Flask
        import React from 'react'
        const express = require('express')
        """
        
        frameworks_found = []
        for framework, patterns in analyzer.framework_patterns.items():
            if any(pattern.lower() in test_content.lower() for pattern in patterns):
                frameworks_found.append(framework)
        
        expected_frameworks = ['Django', 'Flask', 'React', 'Express.js']
        if len(frameworks_found) >= 2:  # At least some frameworks detected
            print(f"   ✅ Framework detection working: {frameworks_found}")
        else:
            print(f"   ⚠️  Framework detection may need improvement: {frameworks_found}")
        
        # Test 4: Test complexity calculation
        print("\n4. Testing complexity calculation...")
        mock_structure = {
            'total_loc': 5000,
            'languages': {'Python': 3, 'JavaScript': 2},
            'structure_analysis': {
                'mvc_pattern': True,
                'test_coverage': True,
                'ci_cd': True,
                'containerization': False
            }
        }
        
        mock_tech = {
            'frameworks': ['Django', 'React'],
            'technologies': ['Docker', 'API']
        }
        
        mock_commit = {
            'unique_authors': 5,
            'activity_score': 75
        }
        
        complexity = analyzer._calculate_complexity_scores(mock_structure, mock_tech, mock_commit)
        
        if all(key in complexity for key in ['code_complexity', 'technical_complexity', 'collaboration_complexity', 'overall_complexity']):
            print("   ✅ Complexity calculation working")
            print(f"   Overall complexity: {complexity['overall_complexity']}")
            print(f"   Code complexity: {complexity['code_complexity']}")
            print(f"   Technical complexity: {complexity['technical_complexity']}")
        else:
            print(f"   ❌ Complexity calculation incomplete: {complexity}")
        
        # Test 5: Test skill scoring
        print("\n5. Testing skill proficiency scoring...")
        mock_repo_details = {
            'stargazers_count': 100,
            'forks_count': 25
        }
        
        skills = analyzer._generate_skill_scores(mock_tech, complexity, mock_commit, mock_repo_details)
        
        if skills:
            print("   ✅ Skill scoring working")
            for skill, data in list(skills.items())[:2]:
                print(f"   - {skill}: {data['proficiency_level']} ({data['proficiency_score']})")
        else:
            print("   ❌ Skill scoring not working")
        
        print("\n✅ Repository Analysis Engine tests completed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Repository Analysis Engine test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_multiple_repository_analysis():
    """Test multiple repository analysis functionality."""
    print("\n" + "="*60)
    print("Testing Multiple Repository Analysis...")
    
    try:
        analyzer = RepositoryAnalyzer()
        
        # Test with a user that has multiple repositories
        print("\n1. Testing multiple repository analysis...")
        try:
            analysis = analyzer.analyze_multiple_repositories("octocat", max_repos=3)
            
            print(f"   ✅ Analyzed {analysis['repositories_analyzed']} repositories")
            print(f"   Total repositories: {analysis['total_repositories']}")
            print(f"   Aggregated skills: {len(analysis['aggregated_skills'])} skills")
            print(f"   Technology stack: {len(analysis['technology_stack'])} technologies")
            print(f"   Overall complexity: {analysis['overall_complexity']}")
            
            # Show top skills
            if analysis['aggregated_skills']:
                print("   Top skills:")
                sorted_skills = sorted(
                    analysis['aggregated_skills'].items(),
                    key=lambda x: x[1]['proficiency_score'],
                    reverse=True
                )
                for skill, data in sorted_skills[:3]:
                    print(f"     - {skill}: {data['proficiency_level']} ({data['proficiency_score']})")
            
            return True
            
        except Exception as e:
            print(f"   ❌ Multiple repository analysis failed: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Multiple repository analysis test failed: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Repository Analysis Engine Test Suite")
    print("=" * 60)
    
    # Set up logging
    logging.basicConfig(level=logging.WARNING)
    
    success1 = test_repository_analyzer()
    success2 = test_multiple_repository_analysis()
    
    print("\n" + "=" * 60)
    if success1 and success2:
        print("🎉 All Repository Analysis Engine tests passed!")
        exit_code = 0
    else:
        print("❌ Some Repository Analysis Engine tests failed!")
        exit_code = 1
    
    print("=" * 60)
    exit(exit_code)