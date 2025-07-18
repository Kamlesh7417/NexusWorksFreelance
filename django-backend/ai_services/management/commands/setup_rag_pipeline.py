"""
Django management command to set up the hybrid RAG pipeline infrastructure.
This command initializes the vector database, Neo4j graph database, and populates
initial data for the AI-powered matching system.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.conf import settings
import logging
import json
import os
from typing import Dict, List, Any

from ai_services.vector_models import (
    VectorEmbedding, DeveloperProfileEmbedding, ProjectRequirementEmbedding,
    SkillEmbedding, create_vector_extension, create_vector_indexes
)
from ai_services.neo4j_service import neo4j_service
from ai_services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Set up hybrid RAG pipeline infrastructure including vector database and Neo4j graph'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-vector-setup',
            action='store_true',
            help='Skip vector database setup (pgvector extension and indexes)',
        )
        parser.add_argument(
            '--skip-graph-setup',
            action='store_true',
            help='Skip Neo4j graph database setup',
        )
        parser.add_argument(
            '--skip-initial-data',
            action='store_true',
            help='Skip loading initial skill and technology data',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force setup even if components already exist',
        )
        parser.add_argument(
            '--data-file',
            type=str,
            help='Path to JSON file containing initial skills and technology data',
        )
    
    def handle(self, *args, **options):
        """Main command handler."""
        self.stdout.write(
            self.style.SUCCESS('Starting hybrid RAG pipeline setup...')
        )
        
        try:
            # Step 1: Set up PostgreSQL vector extension
            if not options['skip_vector_setup']:
                self.setup_vector_database(options['force'])
            
            # Step 2: Set up Neo4j graph database
            if not options['skip_graph_setup']:
                self.setup_graph_database(options['force'])
            
            # Step 3: Load initial data
            if not options['skip_initial_data']:
                data_file = options.get('data_file')
                self.load_initial_data(data_file, options['force'])
            
            # Step 4: Verify setup
            self.verify_setup()
            
            self.stdout.write(
                self.style.SUCCESS('Hybrid RAG pipeline setup completed successfully!')
            )
            
        except Exception as e:
            logger.error(f"Error setting up RAG pipeline: {e}")
            raise CommandError(f"Setup failed: {e}")
    
    def setup_vector_database(self, force: bool = False):
        """Set up PostgreSQL with pgvector extension."""
        self.stdout.write('Setting up vector database (PostgreSQL + pgvector)...')
        
        try:
            with connection.cursor() as cursor:
                # Check if pgvector extension exists
                cursor.execute(
                    "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector')"
                )
                extension_exists = cursor.fetchone()[0]
                
                if not extension_exists or force:
                    # Create pgvector extension
                    self.stdout.write('Creating pgvector extension...')
                    cursor.execute(create_vector_extension())
                    self.stdout.write(
                        self.style.SUCCESS('✓ pgvector extension created')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING('pgvector extension already exists')
                    )
                
                # Create vector indexes
                self.stdout.write('Creating vector indexes...')
                index_commands = create_vector_indexes()
                
                for i, index_command in enumerate(index_commands):
                    try:
                        cursor.execute(index_command)
                        self.stdout.write(f'✓ Created vector index {i+1}/{len(index_commands)}')
                    except Exception as e:
                        if 'already exists' in str(e).lower() and not force:
                            self.stdout.write(f'- Index {i+1} already exists')
                        else:
                            logger.warning(f"Error creating index {i+1}: {e}")
                
                self.stdout.write(
                    self.style.SUCCESS('✓ Vector database setup completed')
                )
                
        except Exception as e:
            logger.error(f"Error setting up vector database: {e}")
            raise CommandError(f"Vector database setup failed: {e}")
    
    def setup_graph_database(self, force: bool = False):
        """Set up Neo4j graph database with constraints and indexes."""
        self.stdout.write('Setting up Neo4j graph database...')
        
        try:
            # Test Neo4j connection
            with neo4j_service.get_session() as session:
                result = session.run("RETURN 1 as test")
                if not result.single():
                    raise ConnectionError("Cannot connect to Neo4j database")
            
            self.stdout.write('✓ Neo4j connection established')
            
            # Create constraints and indexes
            self.create_graph_constraints(force)
            self.create_graph_indexes(force)
            
            self.stdout.write(
                self.style.SUCCESS('✓ Neo4j graph database setup completed')
            )
            
        except Exception as e:
            logger.error(f"Error setting up graph database: {e}")
            raise CommandError(f"Graph database setup failed: {e}")
    
    def create_graph_constraints(self, force: bool = False):
        """Create Neo4j constraints for data integrity."""
        constraints = [
            "CREATE CONSTRAINT skill_name_unique IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE",
            "CREATE CONSTRAINT technology_name_unique IF NOT EXISTS FOR (t:Technology) REQUIRE t.name IS UNIQUE",
            "CREATE CONSTRAINT developer_id_unique IF NOT EXISTS FOR (d:Developer) REQUIRE d.id IS UNIQUE",
            "CREATE CONSTRAINT project_id_unique IF NOT EXISTS FOR (p:Project) REQUIRE p.id IS UNIQUE",
        ]
        
        self.stdout.write('Creating Neo4j constraints...')
        
        try:
            with neo4j_service.get_session() as session:
                for i, constraint in enumerate(constraints):
                    try:
                        session.run(constraint)
                        self.stdout.write(f'✓ Created constraint {i+1}/{len(constraints)}')
                    except Exception as e:
                        if 'already exists' in str(e).lower() and not force:
                            self.stdout.write(f'- Constraint {i+1} already exists')
                        else:
                            logger.warning(f"Error creating constraint {i+1}: {e}")
                            
        except Exception as e:
            logger.error(f"Error creating graph constraints: {e}")
            raise
    
    def create_graph_indexes(self, force: bool = False):
        """Create Neo4j indexes for performance."""
        indexes = [
            "CREATE INDEX skill_category_index IF NOT EXISTS FOR (s:Skill) ON (s.category)",
            "CREATE INDEX technology_type_index IF NOT EXISTS FOR (t:Technology) ON (t.type)",
            "CREATE INDEX developer_availability_index IF NOT EXISTS FOR (d:Developer) ON (d.availability_status)",
            "CREATE INDEX project_status_index IF NOT EXISTS FOR (p:Project) ON (p.status)",
            "CREATE INDEX skill_relationship_strength_index IF NOT EXISTS FOR ()-[r:RELATED_TO]-() ON (r.strength)",
            "CREATE INDEX has_skill_proficiency_index IF NOT EXISTS FOR ()-[r:HAS_SKILL]-() ON (r.proficiency)",
        ]
        
        self.stdout.write('Creating Neo4j indexes...')
        
        try:
            with neo4j_service.get_session() as session:
                for i, index in enumerate(indexes):
                    try:
                        session.run(index)
                        self.stdout.write(f'✓ Created index {i+1}/{len(indexes)}')
                    except Exception as e:
                        if 'already exists' in str(e).lower() and not force:
                            self.stdout.write(f'- Index {i+1} already exists')
                        else:
                            logger.warning(f"Error creating index {i+1}: {e}")
                            
        except Exception as e:
            logger.error(f"Error creating graph indexes: {e}")
            raise
    
    def load_initial_data(self, data_file: str = None, force: bool = False):
        """Load initial skills and technology data."""
        self.stdout.write('Loading initial skills and technology data...')
        
        try:
            # Load data from file or use default data
            if data_file and os.path.exists(data_file):
                with open(data_file, 'r') as f:
                    initial_data = json.load(f)
                self.stdout.write(f'✓ Loaded data from {data_file}')
            else:
                initial_data = self.get_default_initial_data()
                self.stdout.write('✓ Using default initial data')
            
            # Load skills into Neo4j
            self.load_skills_data(initial_data.get('skills', []), force)
            
            # Load technologies into Neo4j
            self.load_technologies_data(initial_data.get('technologies', []), force)
            
            # Create skill relationships
            self.create_skill_relationships(initial_data.get('skill_relationships', []), force)
            
            # Generate skill embeddings
            self.generate_skill_embeddings(initial_data.get('skills', []), force)
            
            self.stdout.write(
                self.style.SUCCESS('✓ Initial data loading completed')
            )
            
        except Exception as e:
            logger.error(f"Error loading initial data: {e}")
            raise CommandError(f"Initial data loading failed: {e}")
    
    def load_skills_data(self, skills_data: List[Dict[str, Any]], force: bool = False):
        """Load skills data into Neo4j."""
        self.stdout.write(f'Loading {len(skills_data)} skills into Neo4j...')
        
        success_count = 0
        for skill_data in skills_data:
            try:
                success = neo4j_service.create_skill_node(
                    skill_data['name'],
                    skill_data['category'],
                    skill_data.get('metadata', {})
                )
                if success:
                    success_count += 1
            except Exception as e:
                logger.warning(f"Error loading skill {skill_data.get('name', 'unknown')}: {e}")
        
        self.stdout.write(f'✓ Loaded {success_count}/{len(skills_data)} skills')
    
    def load_technologies_data(self, technologies_data: List[Dict[str, Any]], force: bool = False):
        """Load technologies data into Neo4j."""
        self.stdout.write(f'Loading {len(technologies_data)} technologies into Neo4j...')
        
        success_count = 0
        for tech_data in technologies_data:
            try:
                success = neo4j_service.create_technology_node(
                    tech_data['name'],
                    tech_data['type'],
                    tech_data.get('metadata', {})
                )
                if success:
                    success_count += 1
            except Exception as e:
                logger.warning(f"Error loading technology {tech_data.get('name', 'unknown')}: {e}")
        
        self.stdout.write(f'✓ Loaded {success_count}/{len(technologies_data)} technologies')
    
    def create_skill_relationships(self, relationships_data: List[Dict[str, Any]], force: bool = False):
        """Create skill relationships in Neo4j."""
        self.stdout.write(f'Creating {len(relationships_data)} skill relationships...')
        
        success_count = neo4j_service.bulk_create_skill_relationships(relationships_data)
        self.stdout.write(f'✓ Created {success_count} skill relationships')
    
    def generate_skill_embeddings(self, skills_data: List[Dict[str, Any]], force: bool = False):
        """Generate embeddings for skills."""
        self.stdout.write(f'Generating embeddings for {len(skills_data)} skills...')
        
        success_count = 0
        for skill_data in skills_data:
            try:
                skill_name = skill_data['name']
                skill_context = skill_data.get('description', '')
                
                # Check if embedding already exists
                if not force and SkillEmbedding.objects.filter(skill_name=skill_name).exists():
                    continue
                
                # Generate embedding
                embedding = embedding_service.generate_skill_embedding(skill_name, skill_context)
                
                if embedding:
                    # Save to database
                    SkillEmbedding.objects.update_or_create(
                        skill_name=skill_name,
                        defaults={
                            'skill_category': skill_data['category'],
                            'embedding': embedding,
                            'popularity_score': skill_data.get('popularity_score', 0.0),
                            'difficulty_level': skill_data.get('difficulty_level', 'medium'),
                            'related_skills': skill_data.get('related_skills', [])
                        }
                    )
                    success_count += 1
                    
            except Exception as e:
                logger.warning(f"Error generating embedding for skill {skill_data.get('name', 'unknown')}: {e}")
        
        self.stdout.write(f'✓ Generated {success_count} skill embeddings')
    
    def verify_setup(self):
        """Verify that the RAG pipeline setup is working correctly."""
        self.stdout.write('Verifying RAG pipeline setup...')
        
        try:
            # Test vector database
            self.verify_vector_database()
            
            # Test graph database
            self.verify_graph_database()
            
            # Test embedding service
            self.verify_embedding_service()
            
            self.stdout.write(
                self.style.SUCCESS('✓ RAG pipeline verification completed')
            )
            
        except Exception as e:
            logger.error(f"Error verifying setup: {e}")
            raise CommandError(f"Setup verification failed: {e}")
    
    def verify_vector_database(self):
        """Verify vector database functionality."""
        with connection.cursor() as cursor:
            # Check pgvector extension
            cursor.execute(
                "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector')"
            )
            if not cursor.fetchone()[0]:
                raise Exception("pgvector extension not found")
            
            # Check if we can create a test vector
            cursor.execute("SELECT '[1,2,3]'::vector(3)")
            
        self.stdout.write('✓ Vector database verification passed')
    
    def verify_graph_database(self):
        """Verify graph database functionality."""
        with neo4j_service.get_session() as session:
            # Test basic query
            result = session.run("MATCH (n) RETURN count(n) as node_count")
            node_count = result.single()['node_count']
            
            # Test skill nodes
            result = session.run("MATCH (s:Skill) RETURN count(s) as skill_count")
            skill_count = result.single()['skill_count']
            
            self.stdout.write(f'✓ Graph database has {node_count} nodes, {skill_count} skills')
    
    def verify_embedding_service(self):
        """Verify embedding service functionality."""
        # Test embedding generation
        test_embedding = embedding_service.generate_embedding("test text", "test")
        
        if not test_embedding or len(test_embedding) != settings.VECTOR_DIMENSION:
            raise Exception("Embedding service not working correctly")
        
        self.stdout.write('✓ Embedding service verification passed')
    
    def get_default_initial_data(self) -> Dict[str, Any]:
        """Get default initial data for skills and technologies."""
        return {
            "skills": [
                {"name": "Python", "category": "programming_language", "popularity_score": 0.9, "difficulty_level": "medium"},
                {"name": "JavaScript", "category": "programming_language", "popularity_score": 0.95, "difficulty_level": "medium"},
                {"name": "React", "category": "framework", "popularity_score": 0.85, "difficulty_level": "medium"},
                {"name": "Django", "category": "framework", "popularity_score": 0.7, "difficulty_level": "medium"},
                {"name": "Node.js", "category": "runtime", "popularity_score": 0.8, "difficulty_level": "medium"},
                {"name": "PostgreSQL", "category": "database", "popularity_score": 0.75, "difficulty_level": "medium"},
                {"name": "Docker", "category": "tool", "popularity_score": 0.8, "difficulty_level": "medium"},
                {"name": "AWS", "category": "cloud_platform", "popularity_score": 0.85, "difficulty_level": "hard"},
                {"name": "Machine Learning", "category": "domain", "popularity_score": 0.9, "difficulty_level": "hard"},
                {"name": "DevOps", "category": "domain", "popularity_score": 0.8, "difficulty_level": "hard"},
            ],
            "technologies": [
                {"name": "React", "type": "frontend_framework"},
                {"name": "Django", "type": "backend_framework"},
                {"name": "PostgreSQL", "type": "database"},
                {"name": "Redis", "type": "cache"},
                {"name": "Docker", "type": "containerization"},
                {"name": "Kubernetes", "type": "orchestration"},
                {"name": "AWS", "type": "cloud_platform"},
                {"name": "Git", "type": "version_control"},
            ],
            "skill_relationships": [
                {"skill1": "Python", "skill2": "Django", "strength": 0.9, "type": "COMPLEMENTARY"},
                {"skill1": "JavaScript", "skill2": "React", "strength": 0.9, "type": "COMPLEMENTARY"},
                {"skill1": "JavaScript", "skill2": "Node.js", "strength": 0.8, "type": "COMPLEMENTARY"},
                {"skill1": "Docker", "skill2": "DevOps", "strength": 0.8, "type": "COMPLEMENTARY"},
                {"skill1": "AWS", "skill2": "DevOps", "strength": 0.9, "type": "COMPLEMENTARY"},
                {"skill1": "Python", "skill2": "Machine Learning", "strength": 0.85, "type": "COMPLEMENTARY"},
                {"skill1": "PostgreSQL", "skill2": "Django", "strength": 0.7, "type": "COMPLEMENTARY"},
                {"skill1": "React", "skill2": "Node.js", "strength": 0.7, "type": "COMPLEMENTARY"},
            ]
        }