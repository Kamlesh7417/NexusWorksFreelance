"""
Vector database models for storing embeddings and similarity search functionality.
Supports both PostgreSQL with pgvector extension and external vector databases.
"""

from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.conf import settings
import uuid
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class VectorEmbedding(models.Model):
    """Base model for storing vector embeddings with metadata."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content_type = models.CharField(max_length=50)  # 'developer_profile', 'project_requirement', 'skill', etc.
    content_id = models.CharField(max_length=100)  # ID of the related object
    embedding = ArrayField(
        models.FloatField(),
        size=settings.VECTOR_DIMENSION,
        help_text="Vector embedding representation"
    )
    metadata = models.JSONField(default=dict, help_text="Additional metadata for the embedding")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'vector_embeddings'
        indexes = [
            models.Index(fields=['content_type', 'content_id']),
            models.Index(fields=['created_at']),
        ]
        unique_together = ['content_type', 'content_id']
    
    def __str__(self):
        return f"{self.content_type}:{self.content_id}"
    
    @property
    def embedding_array(self) -> np.ndarray:
        """Convert embedding list to numpy array."""
        return np.array(self.embedding)
    
    def cosine_similarity(self, other_embedding: List[float]) -> float:
        """Calculate cosine similarity with another embedding."""
        a = self.embedding_array
        b = np.array(other_embedding)
        
        # Handle zero vectors
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        return np.dot(a, b) / (norm_a * norm_b)


class DeveloperProfileEmbedding(models.Model):
    """Specialized embedding model for developer profiles."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    developer_id = models.CharField(max_length=100, unique=True)
    
    # Different embedding types for comprehensive matching
    skills_embedding = ArrayField(
        models.FloatField(),
        size=settings.VECTOR_DIMENSION,
        help_text="Embedding of developer skills"
    )
    experience_embedding = ArrayField(
        models.FloatField(),
        size=settings.VECTOR_DIMENSION,
        help_text="Embedding of developer experience and projects"
    )
    github_embedding = ArrayField(
        models.FloatField(),
        size=settings.VECTOR_DIMENSION,
        help_text="Embedding of GitHub repository analysis"
    )
    
    # Metadata for enhanced matching
    skill_tags = ArrayField(
        models.CharField(max_length=50),
        default=list,
        help_text="Extracted skill tags"
    )
    experience_level = models.CharField(max_length=20, default='mid')
    primary_technologies = ArrayField(
        models.CharField(max_length=50),
        default=list,
        help_text="Primary technology stack"
    )
    domain_expertise = ArrayField(
        models.CharField(max_length=50),
        default=list,
        help_text="Domain expertise areas"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'developer_profile_embeddings'
        indexes = [
            models.Index(fields=['developer_id']),
            models.Index(fields=['experience_level']),
            models.Index(fields=['updated_at']),
        ]
    
    def __str__(self):
        return f"DeveloperEmbedding:{self.developer_id}"
    
    def get_combined_embedding(self, weights: Optional[Dict[str, float]] = None) -> np.ndarray:
        """Get weighted combination of different embedding types."""
        if weights is None:
            weights = {'skills': 0.5, 'experience': 0.3, 'github': 0.2}
        
        combined = (
            np.array(self.skills_embedding) * weights.get('skills', 0.5) +
            np.array(self.experience_embedding) * weights.get('experience', 0.3) +
            np.array(self.github_embedding) * weights.get('github', 0.2)
        )
        
        # Normalize the combined embedding
        norm = np.linalg.norm(combined)
        if norm > 0:
            combined = combined / norm
        
        return combined


class ProjectRequirementEmbedding(models.Model):
    """Specialized embedding model for project requirements."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_id = models.CharField(max_length=100, unique=True)
    
    # Different embedding types for comprehensive matching
    description_embedding = ArrayField(
        models.FloatField(),
        size=settings.VECTOR_DIMENSION,
        help_text="Embedding of project description"
    )
    requirements_embedding = ArrayField(
        models.FloatField(),
        size=settings.VECTOR_DIMENSION,
        help_text="Embedding of technical requirements"
    )
    domain_embedding = ArrayField(
        models.FloatField(),
        size=settings.VECTOR_DIMENSION,
        help_text="Embedding of domain/industry context"
    )
    
    # Metadata for enhanced matching
    required_skills = ArrayField(
        models.CharField(max_length=50),
        default=list,
        help_text="Required technical skills"
    )
    complexity_level = models.CharField(max_length=20, default='medium')
    project_type = models.CharField(max_length=50, default='web_development')
    estimated_duration_weeks = models.IntegerField(default=4)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'project_requirement_embeddings'
        indexes = [
            models.Index(fields=['project_id']),
            models.Index(fields=['complexity_level']),
            models.Index(fields=['project_type']),
            models.Index(fields=['updated_at']),
        ]
    
    def __str__(self):
        return f"ProjectEmbedding:{self.project_id}"
    
    def get_combined_embedding(self, weights: Optional[Dict[str, float]] = None) -> np.ndarray:
        """Get weighted combination of different embedding types."""
        if weights is None:
            weights = {'description': 0.4, 'requirements': 0.4, 'domain': 0.2}
        
        combined = (
            np.array(self.description_embedding) * weights.get('description', 0.4) +
            np.array(self.requirements_embedding) * weights.get('requirements', 0.4) +
            np.array(self.domain_embedding) * weights.get('domain', 0.2)
        )
        
        # Normalize the combined embedding
        norm = np.linalg.norm(combined)
        if norm > 0:
            combined = combined / norm
        
        return combined


class SkillEmbedding(models.Model):
    """Embedding model for individual skills and technologies."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    skill_name = models.CharField(max_length=100, unique=True)
    skill_category = models.CharField(max_length=50)  # 'programming_language', 'framework', 'tool', etc.
    
    embedding = ArrayField(
        models.FloatField(),
        size=settings.VECTOR_DIMENSION,
        help_text="Skill embedding vector"
    )
    
    # Metadata
    popularity_score = models.FloatField(default=0.0, help_text="Market demand score")
    difficulty_level = models.CharField(max_length=20, default='medium')
    related_skills = ArrayField(
        models.CharField(max_length=100),
        default=list,
        help_text="Related or complementary skills"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'skill_embeddings'
        indexes = [
            models.Index(fields=['skill_name']),
            models.Index(fields=['skill_category']),
            models.Index(fields=['popularity_score']),
        ]
    
    def __str__(self):
        return f"Skill:{self.skill_name}"


class SimilaritySearchResult(models.Model):
    """Model to cache similarity search results for performance."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    query_embedding_hash = models.CharField(max_length=64, help_text="Hash of query embedding")
    content_type = models.CharField(max_length=50)
    
    # Search results stored as JSON
    results = models.JSONField(help_text="Cached similarity search results")
    similarity_threshold = models.FloatField()
    max_results = models.IntegerField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(help_text="Cache expiration time")
    
    class Meta:
        db_table = 'similarity_search_cache'
        indexes = [
            models.Index(fields=['query_embedding_hash', 'content_type']),
            models.Index(fields=['expires_at']),
        ]
        unique_together = ['query_embedding_hash', 'content_type', 'similarity_threshold', 'max_results']
    
    def __str__(self):
        return f"SearchCache:{self.query_embedding_hash[:8]}:{self.content_type}"
    
    @property
    def is_expired(self) -> bool:
        """Check if the cached result has expired."""
        from django.utils import timezone
        return timezone.now() > self.expires_at


# Database functions for vector operations (PostgreSQL with pgvector)
class VectorOperations:
    """Utility class for vector database operations."""
    
    @staticmethod
    def cosine_similarity_sql(embedding_field: str, query_embedding: List[float]) -> str:
        """Generate SQL for cosine similarity calculation."""
        embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
        return f"1 - ({embedding_field} <=> '{embedding_str}'::vector)"
    
    @staticmethod
    def euclidean_distance_sql(embedding_field: str, query_embedding: List[float]) -> str:
        """Generate SQL for Euclidean distance calculation."""
        embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
        return f"{embedding_field} <-> '{embedding_str}'::vector"
    
    @staticmethod
    def inner_product_sql(embedding_field: str, query_embedding: List[float]) -> str:
        """Generate SQL for inner product calculation."""
        embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
        return f"({embedding_field} <#> '{embedding_str}'::vector) * -1"


# Migration helper for pgvector extension
def create_vector_extension():
    """SQL command to create pgvector extension."""
    return "CREATE EXTENSION IF NOT EXISTS vector;"


def create_vector_indexes():
    """SQL commands to create vector indexes for performance."""
    return [
        "CREATE INDEX IF NOT EXISTS idx_vector_embeddings_embedding ON vector_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);",
        "CREATE INDEX IF NOT EXISTS idx_developer_skills_embedding ON developer_profile_embeddings USING ivfflat (skills_embedding vector_cosine_ops) WITH (lists = 100);",
        "CREATE INDEX IF NOT EXISTS idx_developer_experience_embedding ON developer_profile_embeddings USING ivfflat (experience_embedding vector_cosine_ops) WITH (lists = 100);",
        "CREATE INDEX IF NOT EXISTS idx_developer_github_embedding ON developer_profile_embeddings USING ivfflat (github_embedding vector_cosine_ops) WITH (lists = 100);",
        "CREATE INDEX IF NOT EXISTS idx_project_description_embedding ON project_requirement_embeddings USING ivfflat (description_embedding vector_cosine_ops) WITH (lists = 100);",
        "CREATE INDEX IF NOT EXISTS idx_project_requirements_embedding ON project_requirement_embeddings USING ivfflat (requirements_embedding vector_cosine_ops) WITH (lists = 100);",
        "CREATE INDEX IF NOT EXISTS idx_skill_embedding ON skill_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);",
    ]