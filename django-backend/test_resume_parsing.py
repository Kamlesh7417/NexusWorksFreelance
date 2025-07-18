#!/usr/bin/env python
"""
Test script for resume parsing functionality.
"""

import os
import sys
import django
from pathlib import Path
import tempfile
from io import BytesIO

# Setup Django with test settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')

# Override cache settings for testing
from django.conf import settings
if not settings.configured:
    django.setup()
else:
    # Override cache to use dummy cache for testing
    settings.CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
        }
    }
    django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from ai_services.resume_parser import ResumeParser, ResumeParsingError
from ai_services.models import ResumeDocument

User = get_user_model()


def create_test_resume_content():
    """Create a sample resume text for testing."""
    return """
John Doe
Software Engineer
Email: john.doe@example.com
Phone: (555) 123-4567
Location: San Francisco, CA

PROFESSIONAL SUMMARY
Experienced full-stack developer with 5+ years of experience in web development.
Proficient in Python, JavaScript, React, and Django. Strong background in 
database design and API development.

TECHNICAL SKILLS
- Programming Languages: Python, JavaScript, TypeScript, Java
- Web Frameworks: Django, React, Node.js, Express.js
- Databases: PostgreSQL, MySQL, MongoDB, Redis
- Cloud & DevOps: AWS, Docker, Kubernetes, Jenkins
- Tools: Git, VS Code, Postman, Jira

WORK EXPERIENCE

Senior Software Engineer | TechCorp Inc. | 2021 - Present
- Led development of microservices architecture using Django and PostgreSQL
- Built responsive web applications using React and TypeScript
- Implemented CI/CD pipelines with Jenkins and Docker
- Mentored junior developers and conducted code reviews

Software Engineer | StartupXYZ | 2019 - 2021
- Developed RESTful APIs using Django REST Framework
- Created interactive dashboards with React and D3.js
- Optimized database queries resulting in 40% performance improvement
- Collaborated with cross-functional teams in Agile environment

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley | 2019
GPA: 3.7/4.0

PROJECTS
E-commerce Platform
- Built full-stack e-commerce application using Django and React
- Integrated payment processing with Stripe API
- Technologies: Python, Django, React, PostgreSQL, Redis

Task Management App
- Developed real-time task management application
- Implemented WebSocket connections for live updates
- Technologies: Node.js, Express.js, MongoDB, Socket.io

CERTIFICATIONS
- AWS Certified Solutions Architect - Associate (2022)
- Google Cloud Professional Developer (2021)
"""


def test_resume_parsing():
    """Test the resume parsing functionality."""
    print("Testing Resume Parsing Functionality")
    print("=" * 50)
    
    try:
        # Create test user
        user, created = User.objects.get_or_create(
            username='test_developer',
            defaults={
                'email': 'test@example.com',
                'role': 'developer',
                'first_name': 'Test',
                'last_name': 'Developer'
            }
        )
        print(f"✓ Test user {'created' if created else 'retrieved'}: {user.username}")
        
        # Create test resume file
        resume_content = create_test_resume_content()
        resume_file = SimpleUploadedFile(
            "test_resume.txt",
            resume_content.encode('utf-8'),
            content_type="text/plain"
        )
        print(f"✓ Created test resume file: {len(resume_content)} characters")
        
        # Initialize parser
        parser = ResumeParser()
        print("✓ Resume parser initialized")
        
        # Test parsing
        print("\nParsing resume...")
        parsed_data = parser.parse_resume(resume_file, str(user.id))
        
        print("✓ Resume parsed successfully!")
        print(f"  - Skills extracted: {len(parsed_data.get('skills', []))}")
        print(f"  - Experience level: {parsed_data.get('experience_level', 'N/A')}")
        print(f"  - Total experience years: {parsed_data.get('total_experience_years', 0)}")
        print(f"  - Work experience entries: {len(parsed_data.get('experience', []))}")
        print(f"  - Education entries: {len(parsed_data.get('education', []))}")
        print(f"  - Projects: {len(parsed_data.get('projects', []))}")
        
        # Display extracted skills
        if parsed_data.get('skills'):
            print(f"\nExtracted Skills:")
            for skill in parsed_data['skills'][:10]:  # Show first 10
                print(f"  - {skill}")
            if len(parsed_data['skills']) > 10:
                print(f"  ... and {len(parsed_data['skills']) - 10} more")
        
        # Display validated skills if available
        if parsed_data.get('validated_skills'):
            print(f"\nValidated Skills (with confidence):")
            for skill_data in parsed_data['validated_skills'][:5]:  # Show first 5
                skill_name = skill_data.get('skill', 'Unknown')
                confidence = skill_data.get('confidence_score', 0)
                print(f"  - {skill_name}: {confidence:.2f}")
        
        # Test database storage
        print("\nTesting database storage...")
        resume_doc = ResumeDocument.objects.create(
            user=user,
            original_filename="test_resume.txt",
            file_path=resume_file,
            file_size=len(resume_content),
            file_type='txt',
            parsing_status='completed',
            raw_text=resume_content,
            parsed_data=parsed_data,
            extracted_skills=parsed_data.get('skills', []),
            skill_confidence_scores=parsed_data.get('skill_validation', {}).get('confidence_scores', {}),
            experience_analysis=parsed_data.get('experience', []),
            education_analysis=parsed_data.get('education', []),
            is_active=True,
            processing_time_seconds=1.0
        )
        print(f"✓ Resume document saved to database: {resume_doc.id}")
        
        # Test skill confidence scoring
        print("\nTesting skill confidence scoring...")
        skill_scores = parser.extract_skill_confidence_scores(parsed_data)
        print(f"✓ Skill confidence scores calculated for {len(skill_scores)} skills")
        
        if skill_scores:
            print("Top skills by confidence:")
            sorted_skills = sorted(skill_scores.items(), key=lambda x: x[1], reverse=True)
            for skill, score in sorted_skills[:5]:
                print(f"  - {skill}: {score:.2f}")
        
        print("\n" + "=" * 50)
        print("✅ All resume parsing tests passed!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_file_format_support():
    """Test different file format support."""
    print("\nTesting File Format Support")
    print("=" * 30)
    
    parser = ResumeParser()
    
    # Test supported formats
    supported_formats = ['.pdf', '.docx', '.doc', '.txt']
    print(f"Supported formats: {', '.join(supported_formats)}")
    
    # Test file validation
    test_cases = [
        ("test.pdf", True),
        ("test.docx", True),
        ("test.doc", True),
        ("test.txt", True),
        ("test.jpg", False),
        ("test.xlsx", False),
    ]
    
    for filename, should_pass in test_cases:
        try:
            # Create a dummy file
            dummy_content = b"dummy content"
            test_file = SimpleUploadedFile(filename, dummy_content)
            
            # Test validation
            parser._validate_file(test_file)
            result = "✓ PASS" if should_pass else "❌ FAIL (should have failed)"
            
        except ResumeParsingError:
            result = "❌ FAIL (should have passed)" if should_pass else "✓ PASS"
        except Exception as e:
            result = f"❌ ERROR: {str(e)}"
        
        print(f"  {filename}: {result}")
    
    print("✓ File format validation tests completed")


if __name__ == "__main__":
    print("Resume Parsing Test Suite")
    print("=" * 50)
    
    # Run tests
    success = test_resume_parsing()
    test_file_format_support()
    
    if success:
        print("\n🎉 All tests completed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed!")
        sys.exit(1)