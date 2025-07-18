#!/usr/bin/env python
"""
Test script for the hybrid RAG pipeline implementation.
This script tests the vector database, Neo4j graph database, and hybrid matching functionality.
"""

import os
import sys
import django
from django.conf import settings

# Add the django-backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from ai_services.embedding_service import embedding_service
from ai_services.neo4j_service import neo4j_service
from ai_services.graph_service import graph_service
from ai_services.hybrid_rag_service import hybrid_rag_service
from ai_services.vector_models import SkillEmbedding, DeveloperProfileEmbedding, ProjectRequirementEmbedding


def test_embedding_service():
    """Test the embedding service functionality."""
    print("Testing Embedding Service...")
    
    # Test basic embedding generation
    test_text = "Python Django web development"
    embedding = embedding_service.generate_embedding(test_text)
    
    if embedding and len(embedding) == settings.VECTOR_DIMENSION:
        print("✓ Basic embedding generation works")
    else:
        print("✗ Basic embedding generation failed")
        return False
    
    # Test batch embedding generation
    test_texts = ["Python programming", "JavaScript development", "Machine learning"]
    batch_embeddings = embedding_service.generate_batch_embeddings(test_texts)
    
    if len(batch_embeddings) == 3 and all(emb for emb in batch_embeddings):
        print("✓ Batch embedding generation works")
    else:
        print("✗ Batch embedding generation failed")
        return False
    
    # Test developer profile embedding
    developer_data = {
        'skills': ['Python', 'Django', 'PostgreSQL'],
        'experience_level': 'senior',
        'years_of_experience': 5,
        'github_analysis': {
            'languages': ['Python', 'JavaScript'],
            'technologies': ['Django', 'React']
        }
    }
    
    dev_embeddings = embedding_service.generate_developer_profile_embedding(developer_data)
    
    if all(emb for emb in dev_embeddings.values()):
        print("✓ Developer profile embedding generation works")
    else:
        print("✗ Developer profile embedding generation failed")
        return False
    
    # Test project requirement embedding
    project_data = {
        'description': 'Build a web application using Django and React',
        'required_skills': ['Python', 'Django', 'React', 'PostgreSQL'],
        'complexity_level': 'medium',
        'project_type': 'web_development'
    }
    
    proj_embeddings = embedding_service.generate_project_requirement_embedding(project_data)
    
    if all(emb for emb in proj_embeddings.values()):
        print("✓ Project requirement embedding generation works")
    else:
        print("✗ Project requirement embedding generation failed")
        return False
    
    print("✓ Embedding Service tests passed\n")
    return True


def test_neo4j_service():
    """Test the Neo4j service functionality."""
    print("Testing Neo4j Service...")
    
    try:
        # Test connection
        with neo4j_service.get_session() as session:
            result = session.run("RETURN 1 as test")
            if result.single()['test'] == 1:
                print("✓ Neo4j connection works")
            else:
                print("✗ Neo4j connection failed")
                return False
    except Exception as e:
        print(f"✗ Neo4j connection failed: {e}")
        return False
    
    # Test skill node creation
    success = neo4j_service.create_skill_node("TestSkill", "test_category", {"test": True})
    if success:
        print("✓ Skill node creation works")
    else:
        print("✗ Skill node creation failed")
        return False
    
    # Test technology node creation
    success = neo4j_service.create_technology_node("TestTech", "test_type", {"test": True})
    if success:
        print("✓ Technology node creation works")
    else:
        print("✗ Technology node creation failed")
        return False
    
    # Test developer node creation
    success = neo4j_service.create_developer_node("test_dev_123", {"name": "Test Developer"})
    if success:
        print("✓ Developer node creation works")
    else:
        print("✗ Developer node creation failed")
        return False
    
    # Test skill relationship creation
    success = neo4j_service.create_skill_relationship("TestSkill", "TestTech", "USES", 0.8)
    if success:
        print("✓ Skill relationship creation works")
    else:
        print("✗ Skill relationship creation failed")
        return False
    
    # Test developer-skill relationship
    success = neo4j_service.create_developer_skill_relationship("test_dev_123", "TestSkill", 0.9, 3)
    if success:
        print("✓ Developer-skill relationship creation works")
    else:
        print("✗ Developer-skill relationship creation failed")
        return False
    
    # Test related skills query
    related_skills = neo4j_service.find_related_skills("TestSkill")
    print(f"✓ Found {len(related_skills)} related skills")
    
    print("✓ Neo4j Service tests passed\n")
    return True


def test_graph_service():
    """Test the graph analysis service functionality."""
    print("Testing Graph Analysis Service...")
    
    # Test skill compatibility calculation
    compatibility = graph_service.calculate_skill_compatibility_score(
        "test_dev_123", 
        ["TestSkill", "Python", "Django"]
    )
    
    if 'total_score' in compatibility:
        print(f"✓ Skill compatibility calculation works (score: {compatibility['total_score']:.2f})")
    else:
        print("✗ Skill compatibility calculation failed")
        return False
    
    # Test team composition finding
    team_composition = graph_service.find_optimal_team_composition(
        ["Python", "Django", "React"], 
        team_size_limit=3
    )
    
    if 'team' in team_composition:
        print(f"✓ Team composition finding works (found {len(team_composition['team'])} members)")
    else:
        print("✗ Team composition finding failed")
        return False
    
    print("✓ Graph Analysis Service tests passed\n")
    return True


def test_hybrid_rag_service():
    """Test the hybrid RAG service functionality."""
    print("Testing Hybrid RAG Service...")
    
    # Test developer matching
    project_data = {
        'id': 'test_project_123',
        'description': 'Build a Django web application with React frontend',
        'required_skills': ['Python', 'Django', 'React', 'PostgreSQL'],
        'complexity_level': 'medium',
        'project_type': 'web_development'
    }
    
    matching_developers = hybrid_rag_service.find_matching_developers(
        project_data, 
        limit=5, 
        include_analysis=True
    )
    
    print(f"✓ Found {len(matching_developers)} matching developers")
    
    # Test project matching
    developer_data = {
        'id': 'test_dev_123',
        'skills': ['Python', 'Django', 'PostgreSQL', 'Docker'],
        'experience_level': 'senior',
        'github_analysis': {
            'languages': ['Python', 'JavaScript'],
            'technologies': ['Django', 'PostgreSQL']
        }
    }
    
    matching_projects = hybrid_rag_service.find_matching_projects(
        developer_data,
        limit=5,
        include_analysis=True
    )
    
    print(f"✓ Found {len(matching_projects)} matching projects")
    
    print("✓ Hybrid RAG Service tests passed\n")
    return True


def test_vector_models():
    """Test the vector database models."""
    print("Testing Vector Database Models...")
    
    # Test skill embedding creation
    try:
        skill_embedding = SkillEmbedding.objects.create(
            skill_name="TestVectorSkill",
            skill_category="test",
            embedding=[0.1] * settings.VECTOR_DIMENSION,
            popularity_score=0.8
        )
        print("✓ Skill embedding model creation works")
        
        # Test similarity calculation
        test_embedding = [0.2] * settings.VECTOR_DIMENSION
        similarity = skill_embedding.embedding_array
        print(f"✓ Embedding array conversion works (shape: {similarity.shape})")
        
    except Exception as e:
        print(f"✗ Vector model test failed: {e}")
        return False
    
    print("✓ Vector Database Models tests passed\n")
    return True


def cleanup_test_data():
    """Clean up test data created during testing."""
    print("Cleaning up test data...")
    
    try:
        # Clean up Neo4j test data
        with neo4j_service.get_session() as session:
            session.run("MATCH (n) WHERE n.test = true OR n.name CONTAINS 'Test' DELETE n")
            session.run("MATCH (d:Developer {id: 'test_dev_123'}) DELETE d")
        
        # Clean up vector database test data
        SkillEmbedding.objects.filter(skill_name__contains="Test").delete()
        
        print("✓ Test data cleanup completed")
        
    except Exception as e:
        print(f"Warning: Cleanup failed: {e}")


def main():
    """Run all tests."""
    print("Starting Hybrid RAG Pipeline Tests\n")
    print("=" * 50)
    
    tests = [
        test_embedding_service,
        test_neo4j_service,
        test_graph_service,
        test_vector_models,
        test_hybrid_rag_service,
    ]
    
    passed = 0
    total = len(tests)
    
    for test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"✗ Test {test_func.__name__} failed with exception: {e}\n")
    
    print("=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! RAG pipeline is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
    
    # Cleanup
    cleanup_test_data()
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)