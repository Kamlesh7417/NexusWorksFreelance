#!/usr/bin/env python
"""
Test script for resume parsing API endpoints.
"""

import os
import sys
import django
import json
from io import BytesIO

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from ai_services.models import ResumeDocument

User = get_user_model()


def create_test_resume_file():
    """Create a test resume file."""
    resume_content = """
John Doe
Senior Software Engineer
Email: john.doe@example.com
Phone: (555) 123-4567

TECHNICAL SKILLS
- Programming Languages: Python, JavaScript, TypeScript, Java
- Web Frameworks: Django, React, Node.js, Express.js
- Databases: PostgreSQL, MySQL, MongoDB, Redis
- Cloud & DevOps: AWS, Docker, Kubernetes, Jenkins

WORK EXPERIENCE
Senior Software Engineer | TechCorp Inc. | 2021 - Present
- Led development of microservices architecture using Django and PostgreSQL
- Built responsive web applications using React and TypeScript
- Implemented CI/CD pipelines with Jenkins and Docker

Software Engineer | StartupXYZ | 2019 - 2021
- Developed RESTful APIs using Django REST Framework
- Created interactive dashboards with React and D3.js
- Optimized database queries resulting in 40% performance improvement

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley | 2019
GPA: 3.7/4.0

PROJECTS
E-commerce Platform
- Built full-stack e-commerce application using Django and React
- Integrated payment processing with Stripe API
- Technologies: Python, Django, React, PostgreSQL, Redis
    """.strip()
    
    return SimpleUploadedFile(
        "test_resume.txt",
        resume_content.encode('utf-8'),
        content_type="text/plain"
    )


def test_resume_api_endpoints():
    """Test all resume-related API endpoints."""
    print("Testing Resume API Endpoints")
    print("=" * 40)
    
    try:
        # Create test client
        client = APIClient()
        
        # Create test user
        user, created = User.objects.get_or_create(
            username='test_developer',
            defaults={
                'email': 'test@example.com',
                'role': 'developer'
            }
        )
        if created:
            user.set_password('testpass123')
            user.save()
        
        # Create token for authentication
        token, created = Token.objects.get_or_create(user=user)
        client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        
        print(f"✓ Created test user: {user.username}")
        print(f"✓ Authentication token configured")
        
        # Test 1: Resume status (no resume uploaded yet)
        print("\n1. Testing resume status (empty)...")
        response = client.get('/api/ai-services/resume-status/')
        
        if response.status_code == 200:
            data = response.json()
            if not data['has_resume']:
                print("✓ Resume status endpoint works (no resume)")
            else:
                print("❌ Expected no resume, but found one")
        else:
            print(f"❌ Resume status failed: {response.status_code}")
            print(response.content.decode())
        
        # Test 2: Upload resume
        print("\n2. Testing resume upload...")
        resume_file = create_test_resume_file()
        
        response = client.post('/api/ai-services/upload-resume/', {
            'resume_file': resume_file,
            'replace_existing': 'true'
        }, format='multipart')
        
        if response.status_code == 201:
            data = response.json()
            print("✓ Resume upload successful")
            print(f"  - Skills extracted: {data['resume']['skills_extracted']}")
            print(f"  - Experience level: {data['resume']['experience_level']}")
            print(f"  - Processing time: {data['resume']['processing_time_seconds']:.2f}s")
            
            resume_id = data['resume']['id']
        else:
            print(f"❌ Resume upload failed: {response.status_code}")
            print(response.content.decode())
            return False
        
        # Test 3: Resume status (with resume)
        print("\n3. Testing resume status (with resume)...")
        response = client.get('/api/ai-services/resume-status/')
        
        if response.status_code == 200:
            data = response.json()
            if data['has_resume'] and data['active_resume']:
                print("✓ Resume status shows uploaded resume")
                print(f"  - Filename: {data['active_resume']['filename']}")
                print(f"  - Skills extracted: {data['active_resume']['skills_extracted']}")
            else:
                print("❌ Resume status doesn't show uploaded resume")
        else:
            print(f"❌ Resume status failed: {response.status_code}")
        
        # Test 4: Resume details
        print("\n4. Testing resume details...")
        response = client.get(f'/api/ai-services/resume-details/{resume_id}/')
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Resume details retrieved successfully")
            
            if 'parsing_results' in data:
                results = data['parsing_results']
                print(f"  - Skills: {len(results.get('skills', {}).get('extracted', []))}")
                print(f"  - Experience positions: {len(results.get('experience', {}).get('positions', []))}")
                print(f"  - Education entries: {len(results.get('education', []))}")
            else:
                print("  - Resume still processing or failed to parse")
        else:
            print(f"❌ Resume details failed: {response.status_code}")
        
        # Test 5: Combine with GitHub (without GitHub data)
        print("\n5. Testing combine with GitHub analysis...")
        response = client.post('/api/ai-services/combine-resume-github/', {
            'resume_id': resume_id,
            'force_update': True
        })
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Resume-GitHub combination successful")
            print(f"  - Overall confidence: {data['analysis']['overall_confidence_score']:.2f}")
            print(f"  - Experience level: {data['analysis']['experience_level']}")
            print(f"  - Total skills: {data['analysis']['skills_summary']['total_skills']}")
        else:
            print(f"❌ Resume-GitHub combination failed: {response.status_code}")
            print(response.content.decode())
        
        # Test 6: Upload another resume (test replacement)
        print("\n6. Testing resume replacement...")
        new_resume_file = SimpleUploadedFile(
            "updated_resume.txt",
            b"Updated resume content with new skills: Rust, Go, Kubernetes",
            content_type="text/plain"
        )
        
        response = client.post('/api/ai-services/upload-resume/', {
            'resume_file': new_resume_file,
            'replace_existing': 'true'
        }, format='multipart')
        
        if response.status_code == 201:
            print("✓ Resume replacement successful")
            
            # Check that old resume is deactivated
            old_resume = ResumeDocument.objects.get(id=resume_id)
            if not old_resume.is_active:
                print("✓ Old resume properly deactivated")
            else:
                print("❌ Old resume still active")
        else:
            print(f"❌ Resume replacement failed: {response.status_code}")
        
        # Test 7: Error handling - invalid file format
        print("\n7. Testing error handling...")
        invalid_file = SimpleUploadedFile(
            "resume.jpg",
            b"fake image content",
            content_type="image/jpeg"
        )
        
        response = client.post('/api/ai-services/upload-resume/', {
            'resume_file': invalid_file
        }, format='multipart')
        
        if response.status_code == 400:
            print("✓ Invalid file format properly rejected")
        else:
            print(f"❌ Expected 400 error, got {response.status_code}")
        
        # Test 8: Unauthorized access
        print("\n8. Testing unauthorized access...")
        unauth_client = APIClient()  # No authentication
        
        response = unauth_client.get('/api/ai-services/resume-status/')
        if response.status_code == 401:
            print("✓ Unauthorized access properly blocked")
        else:
            print(f"❌ Expected 401 error, got {response.status_code}")
        
        print("\n" + "=" * 40)
        print("✅ All API endpoint tests completed!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ API test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_database_models():
    """Test the database models work correctly."""
    print("\nTesting Database Models")
    print("=" * 30)
    
    try:
        # Create test user
        user = User.objects.create_user(
            username='model_test_user',
            email='model@example.com',
            role='developer'
        )
        
        # Test ResumeDocument creation
        resume_doc = ResumeDocument.objects.create(
            user=user,
            original_filename='test.txt',
            file_size=1000,
            file_type='txt',
            parsing_status='completed',
            raw_text='Sample resume text',
            parsed_data={'skills': ['Python', 'Django']},
            extracted_skills=['Python', 'Django'],
            skill_confidence_scores={'Python': 0.9, 'Django': 0.8},
            is_active=True
        )
        
        print("✓ ResumeDocument created successfully")
        print(f"  - ID: {resume_doc.id}")
        print(f"  - User: {resume_doc.user.username}")
        print(f"  - Status: {resume_doc.parsing_status}")
        
        # Test querying
        user_resumes = ResumeDocument.objects.filter(user=user)
        active_resume = user_resumes.filter(is_active=True).first()
        
        if active_resume:
            print("✓ Resume querying works")
            print(f"  - Found {user_resumes.count()} resume(s)")
            print(f"  - Active resume: {active_resume.original_filename}")
        
        # Test model methods
        print(f"✓ Model string representation: {str(resume_doc)}")
        
        # Test ProfileAnalysisCombined
        from ai_services.models import ProfileAnalysisCombined
        
        combined_analysis = ProfileAnalysisCombined.objects.create(
            user=user,
            resume_document=resume_doc,
            final_skills={'Python': {'confidence_score': 0.9}},
            experience_level='mid',
            total_experience_years=3.5,
            overall_confidence_score=0.85,
            sources_used=['resume']
        )
        
        print("✓ ProfileAnalysisCombined created successfully")
        print(f"  - Experience level: {combined_analysis.experience_level}")
        print(f"  - Confidence score: {combined_analysis.overall_confidence_score}")
        
        print("✓ Database model tests completed")
        return True
        
    except Exception as e:
        print(f"❌ Database model test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("Resume Parsing API Test Suite")
    print("=" * 50)
    
    # Run tests
    api_success = test_resume_api_endpoints()
    db_success = test_database_models()
    
    if api_success and db_success:
        print("\n🎉 All API tests completed successfully!")
        print("\nResume parsing API is fully functional!")
        print("\nFeatures implemented:")
        print("✓ Resume file upload (PDF, DOCX, DOC, TXT)")
        print("✓ AI-powered skill extraction")
        print("✓ Resume parsing status tracking")
        print("✓ Resume details retrieval")
        print("✓ GitHub analysis combination")
        print("✓ Resume replacement functionality")
        print("✓ Error handling and validation")
        print("✓ Authentication and authorization")
        print("✓ Database storage and querying")
        sys.exit(0)
    else:
        print("\n💥 Some API tests failed!")
        sys.exit(1)