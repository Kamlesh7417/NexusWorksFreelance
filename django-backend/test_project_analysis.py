#!/usr/bin/env python
"""
Test script for project analysis functionality
"""
import os
import sys
import django
from pathlib import Path

# Add the project directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from ai_services.project_analysis import ProjectAnalysisEngine
from ai_services.gemini_client import GeminiClient
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_gemini_connection():
    """Test Gemini API connection"""
    print("Testing Gemini API connection...")
    try:
        client = GeminiClient()
        result = client.test_connection()
        print(f"Gemini connection test: {'SUCCESS' if result else 'FAILED'}")
        return result
    except Exception as e:
        print(f"Gemini connection test FAILED: {str(e)}")
        return False

def test_project_analysis():
    """Test project analysis functionality"""
    print("\nTesting project analysis...")
    
    test_description = """
    Build a modern e-commerce web application with the following features:
    - User authentication and registration
    - Product catalog with search and filtering
    - Shopping cart functionality
    - Payment processing with Stripe
    - Order management system
    - Admin dashboard for managing products and orders
    - Real-time notifications
    - Mobile-responsive design
    - API for mobile app integration
    
    The application should be built using React for the frontend and Django for the backend,
    with PostgreSQL as the database. It should support high traffic and be scalable.
    """
    
    try:
        engine = ProjectAnalysisEngine()
        result = engine.analyze_project(test_description, "E-commerce Platform")
        
        print("✅ Project analysis completed successfully!")
        print(f"📋 Tasks generated: {len(result.task_breakdown)}")
        print(f"💰 Budget estimate: ${result.budget_estimate:,.2f}")
        print(f"⏱️  Timeline estimate: {result.timeline_estimate_days} days")
        print(f"🎯 Complexity score: {result.complexity_score}/10")
        print(f"👨‍💼 Needs senior developer: {result.needs_senior_developer}")
        print(f"🛠️  Required skills: {', '.join(result.required_skills[:5])}...")
        
        print("\n📝 Task breakdown:")
        for i, task in enumerate(result.task_breakdown[:3], 1):
            print(f"  {i}. {task['title']} ({task['estimated_hours']}h)")
        
        if len(result.task_breakdown) > 3:
            print(f"  ... and {len(result.task_breakdown) - 3} more tasks")
        
        print(f"\n⚠️  Risk factors: {len(result.risk_factors)} identified")
        print(f"💡 Recommendations: {len(result.recommendations)} provided")
        
        return True
        
    except Exception as e:
        print(f"❌ Project analysis FAILED: {str(e)}")
        return False

def test_analysis_engine_service():
    """Test the analysis engine service test method"""
    print("\nTesting analysis engine service...")
    
    try:
        engine = ProjectAnalysisEngine()
        result = engine.test_service()
        
        print(f"Service test result: {result['status']}")
        if result['status'] == 'success':
            print("✅ Analysis engine service test passed!")
            test_result = result.get('test_result', {})
            print(f"  - Tasks generated: {test_result.get('tasks_generated', 'N/A')}")
            print(f"  - Budget estimate: ${test_result.get('budget_estimate', 0):,.2f}")
            print(f"  - Timeline: {test_result.get('timeline_days', 'N/A')} days")
        else:
            print(f"❌ Analysis engine service test failed: {result.get('error', 'Unknown error')}")
        
        return result['status'] == 'success'
        
    except Exception as e:
        print(f"❌ Analysis engine service test FAILED: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Project Analysis Tests")
    print("=" * 50)
    
    # Test 1: Gemini connection
    gemini_ok = test_gemini_connection()
    
    # Test 2: Project analysis
    analysis_ok = test_project_analysis()
    
    # Test 3: Service test
    service_ok = test_analysis_engine_service()
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"  Gemini Connection: {'✅ PASS' if gemini_ok else '❌ FAIL'}")
    print(f"  Project Analysis:  {'✅ PASS' if analysis_ok else '❌ FAIL'}")
    print(f"  Service Test:      {'✅ PASS' if service_ok else '❌ FAIL'}")
    
    all_passed = gemini_ok and analysis_ok and service_ok
    print(f"\n🎯 Overall Result: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    
    if not all_passed:
        print("\n💡 Troubleshooting tips:")
        if not gemini_ok:
            print("  - Check GEMINI_API_KEY in .env file")
            print("  - Verify API key is valid and has quota")
        if not analysis_ok:
            print("  - Check network connectivity")
            print("  - Review error logs above")
        if not service_ok:
            print("  - Check all dependencies are installed")
            print("  - Verify Django settings are correct")

if __name__ == "__main__":
    main()