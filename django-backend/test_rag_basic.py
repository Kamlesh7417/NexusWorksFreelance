#!/usr/bin/env python
"""
Basic test script to verify RAG pipeline components are importable and functional.
This is a minimal test that doesn't require full database setup.
"""

import os
import sys

# Add the django-backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')

try:
    import django
    django.setup()
    print("✓ Django setup successful")
except Exception as e:
    print(f"✗ Django setup failed: {e}")
    sys.exit(1)

def test_imports():
    """Test that all RAG pipeline modules can be imported."""
    print("\nTesting module imports...")
    
    try:
        from ai_services.embedding_service import embedding_service
        print("✓ Embedding service imported")
    except Exception as e:
        print(f"✗ Embedding service import failed: {e}")
        return False
    
    try:
        from ai_services.neo4j_service import neo4j_service
        print("✓ Neo4j service imported")
    except Exception as e:
        print(f"✗ Neo4j service import failed: {e}")
        return False
    
    try:
        from ai_services.graph_service import graph_service
        print("✓ Graph service imported")
    except Exception as e:
        print(f"✗ Graph service import failed: {e}")
        return False
    
    try:
        from ai_services.hybrid_rag_service import hybrid_rag_service
        print("✓ Hybrid RAG service imported")
    except Exception as e:
        print(f"✗ Hybrid RAG service import failed: {e}")
        return False
    
    try:
        from ai_services.vector_models import (
            VectorEmbedding, DeveloperProfileEmbedding, 
            ProjectRequirementEmbedding, SkillEmbedding
        )
        print("✓ Vector models imported")
    except Exception as e:
        print(f"✗ Vector models import failed: {e}")
        return False
    
    return True

def test_basic_functionality():
    """Test basic functionality without database connections."""
    print("\nTesting basic functionality...")
    
    try:
        from ai_services.embedding_service import embedding_service
        
        # Test embedding service initialization
        if embedding_service.model is not None:
            print("✓ Embedding model loaded successfully")
        else:
            print("⚠️  Embedding model not loaded (this is expected if sentence-transformers is not installed)")
        
        # Test cache key generation
        cache_key = embedding_service._get_cache_key("test text", "test_type")
        if cache_key:
            print("✓ Cache key generation works")
        else:
            print("✗ Cache key generation failed")
            return False
        
        # Test text normalization
        normalized = embedding_service._normalize_text("  Test   Text  ")
        if normalized == "test text":
            print("✓ Text normalization works")
        else:
            print("✗ Text normalization failed")
            return False
        
    except Exception as e:
        print(f"✗ Basic functionality test failed: {e}")
        return False
    
    return True

def test_configuration():
    """Test that configuration is properly set up."""
    print("\nTesting configuration...")
    
    try:
        from django.conf import settings
        
        # Check vector configuration
        if hasattr(settings, 'VECTOR_DIMENSION'):
            print(f"✓ Vector dimension configured: {settings.VECTOR_DIMENSION}")
        else:
            print("✗ Vector dimension not configured")
            return False
        
        if hasattr(settings, 'EMBEDDING_MODEL'):
            print(f"✓ Embedding model configured: {settings.EMBEDDING_MODEL}")
        else:
            print("✗ Embedding model not configured")
            return False
        
        # Check Neo4j configuration
        if hasattr(settings, 'NEO4J_CONFIG'):
            print("✓ Neo4j configuration found")
        else:
            print("✗ Neo4j configuration not found")
            return False
        
        # Check matching weights
        if hasattr(settings, 'PLATFORM_CONFIG') and 'MATCHING_ALGORITHM_WEIGHTS' in settings.PLATFORM_CONFIG:
            print("✓ Matching algorithm weights configured")
        else:
            print("✗ Matching algorithm weights not configured")
            return False
        
    except Exception as e:
        print(f"✗ Configuration test failed: {e}")
        return False
    
    return True

def test_model_definitions():
    """Test that model definitions are valid."""
    print("\nTesting model definitions...")
    
    try:
        from ai_services.vector_models import (
            VectorEmbedding, DeveloperProfileEmbedding, 
            ProjectRequirementEmbedding, SkillEmbedding
        )
        
        # Test model field definitions
        vector_fields = [f.name for f in VectorEmbedding._meta.fields]
        required_fields = ['id', 'content_type', 'content_id', 'embedding', 'metadata']
        
        if all(field in vector_fields for field in required_fields):
            print("✓ VectorEmbedding model fields are correct")
        else:
            print("✗ VectorEmbedding model fields are missing")
            return False
        
        # Test developer embedding fields
        dev_fields = [f.name for f in DeveloperProfileEmbedding._meta.fields]
        dev_required = ['id', 'developer_id', 'skills_embedding', 'experience_embedding']
        
        if all(field in dev_fields for field in dev_required):
            print("✓ DeveloperProfileEmbedding model fields are correct")
        else:
            print("✗ DeveloperProfileEmbedding model fields are missing")
            return False
        
        # Test project embedding fields
        proj_fields = [f.name for f in ProjectRequirementEmbedding._meta.fields]
        proj_required = ['id', 'project_id', 'description_embedding', 'requirements_embedding']
        
        if all(field in proj_fields for field in proj_required):
            print("✓ ProjectRequirementEmbedding model fields are correct")
        else:
            print("✗ ProjectRequirementEmbedding model fields are missing")
            return False
        
    except Exception as e:
        print(f"✗ Model definition test failed: {e}")
        return False
    
    return True

def main():
    """Run all basic tests."""
    print("Starting Basic RAG Pipeline Tests")
    print("=" * 40)
    
    tests = [
        test_imports,
        test_configuration,
        test_model_definitions,
        test_basic_functionality,
    ]
    
    passed = 0
    total = len(tests)
    
    for test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"✗ Test {test_func.__name__} failed with exception: {e}")
    
    print("\n" + "=" * 40)
    print(f"Basic Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All basic tests passed! RAG pipeline components are properly set up.")
        print("\nNext steps:")
        print("1. Run database migrations: python manage.py migrate")
        print("2. Set up RAG pipeline: python manage.py setup_rag_pipeline")
        print("3. Run full tests: python test_rag_pipeline.py")
    else:
        print("⚠️  Some basic tests failed. Check the output above for details.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)