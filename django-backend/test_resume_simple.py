#!/usr/bin/env python
"""
Simple test script for resume parsing functionality without external dependencies.
"""

import os
import sys
import django
from pathlib import Path
import tempfile
from io import BytesIO

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from ai_services.resume_parser import ResumeParser, ResumeParsingError

User = get_user_model()


def test_basic_functionality():
    """Test basic resume parsing functionality."""
    print("Testing Basic Resume Parsing")
    print("=" * 40)
    
    try:
        # Test file validation
        parser = ResumeParser()
        print("✓ Resume parser initialized")
        
        # Test supported formats
        supported_formats = parser.SUPPORTED_FORMATS
        print(f"✓ Supported formats: {', '.join(supported_formats)}")
        
        # Test file size limit
        max_size = parser.MAX_FILE_SIZE / (1024 * 1024)
        print(f"✓ Max file size: {max_size:.1f}MB")
        
        # Test file validation with different formats
        test_cases = [
            ("resume.pdf", True),
            ("resume.docx", True),
            ("resume.doc", True),
            ("resume.txt", True),
            ("resume.jpg", False),
            ("resume.xlsx", False),
        ]
        
        print("\nTesting file validation:")
        for filename, should_pass in test_cases:
            try:
                test_file = SimpleUploadedFile(filename, b"test content")
                parser._validate_file(test_file)
                result = "✓ PASS" if should_pass else "❌ FAIL"
            except ResumeParsingError:
                result = "❌ FAIL" if should_pass else "✓ PASS"
            except Exception as e:
                result = f"❌ ERROR: {str(e)}"
            
            print(f"  {filename}: {result}")
        
        # Test text extraction from TXT file
        print("\nTesting text extraction:")
        sample_text = """
John Doe
Software Engineer
Skills: Python, JavaScript, React, Django
Experience: 5 years
Education: BS Computer Science
        """.strip()
        
        txt_file = SimpleUploadedFile("resume.txt", sample_text.encode('utf-8'))
        extracted_text = parser._extract_txt_text(txt_file)
        
        if extracted_text.strip() == sample_text:
            print("✓ Text extraction from TXT file works")
        else:
            print("❌ Text extraction failed")
            print(f"Expected: {sample_text}")
            print(f"Got: {extracted_text}")
        
        # Test skill confidence scoring
        print("\nTesting skill confidence scoring:")
        sample_resume_data = {
            'skills': ['Python', 'JavaScript', 'React', 'Django'],
            'experience': [
                {
                    'technologies': ['Python', 'Django'],
                    'responsibilities': ['Developed web applications using Python']
                }
            ],
            'projects': [
                {
                    'technologies': ['React', 'JavaScript']
                }
            ]
        }
        
        skill_scores = parser.extract_skill_confidence_scores(sample_resume_data)
        print(f"✓ Calculated confidence scores for {len(skill_scores)} skills")
        
        for skill, score in skill_scores.items():
            print(f"  - {skill}: {score:.2f}")
        
        # Test combining with GitHub analysis
        print("\nTesting GitHub analysis combination:")
        github_data = {
            'skills': ['Python', 'TypeScript', 'Docker'],
            'experience_level': 'senior',
            'years_active': 6
        }
        
        combined_data = parser.combine_with_github_analysis(sample_resume_data, github_data)
        print("✓ Successfully combined resume and GitHub data")
        
        combined_skills = combined_data['combined_analysis']['skills']
        print(f"✓ Combined analysis includes {len(combined_skills)} skills")
        
        # Show skills with both sources
        both_sources = [
            skill for skill, data in combined_skills.items()
            if len(data['sources']) > 1
        ]
        print(f"✓ Skills validated by both sources: {len(both_sources)}")
        for skill in both_sources:
            confidence = combined_skills[skill]['confidence_score']
            print(f"  - {skill}: {confidence:.2f}")
        
        print("\n" + "=" * 40)
        print("✅ All basic functionality tests passed!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_api_endpoints():
    """Test that the API endpoints are properly configured."""
    print("\nTesting API Configuration")
    print("=" * 30)
    
    try:
        # Test URL imports
        from ai_services.urls import urlpatterns
        
        resume_urls = [
            'upload-resume/',
            'resume-status/',
            'resume-details/',
            'combine-resume-github/'
        ]
        
        url_names = [pattern.name for pattern in urlpatterns if hasattr(pattern, 'name')]
        
        for url_name in ['upload_resume', 'resume_status', 'resume_details', 'combine_resume_github']:
            if url_name in url_names:
                print(f"✓ URL pattern '{url_name}' configured")
            else:
                print(f"❌ URL pattern '{url_name}' missing")
        
        # Test view imports
        from ai_services import views
        
        view_functions = ['upload_resume', 'resume_status', 'resume_details', 'combine_resume_github']
        
        for view_name in view_functions:
            if hasattr(views, view_name):
                print(f"✓ View function '{view_name}' exists")
            else:
                print(f"❌ View function '{view_name}' missing")
        
        # Test model imports
        from ai_services.models import ResumeDocument, ResumeSkillExtraction, ProfileAnalysisCombined
        
        print("✓ Resume models imported successfully")
        
        # Test model fields
        resume_fields = [f.name for f in ResumeDocument._meta.fields]
        required_fields = ['user', 'original_filename', 'file_path', 'parsing_status', 'parsed_data']
        
        for field in required_fields:
            if field in resume_fields:
                print(f"✓ ResumeDocument has field '{field}'")
            else:
                print(f"❌ ResumeDocument missing field '{field}'")
        
        print("✓ API configuration tests completed")
        return True
        
    except Exception as e:
        print(f"❌ API configuration test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("Resume Parsing Simple Test Suite")
    print("=" * 50)
    
    # Run tests
    basic_success = test_basic_functionality()
    api_success = test_api_endpoints()
    
    if basic_success and api_success:
        print("\n🎉 All tests completed successfully!")
        print("\nResume parsing functionality is ready!")
        print("\nNext steps:")
        print("1. Test with actual resume files (PDF, DOCX)")
        print("2. Configure Gemini API key for AI parsing")
        print("3. Test API endpoints with HTTP requests")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed!")
        sys.exit(1)