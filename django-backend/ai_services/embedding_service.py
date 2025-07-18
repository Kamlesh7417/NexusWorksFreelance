"""
Embedding generation service for creating vector representations of developer profiles,
project requirements, skills, and other platform entities.
"""

from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional, Union, Tuple
import numpy as np
import logging
import hashlib
import json
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import re
import asyncio
from concurrent.futures import ThreadPoolExecutor
import threading

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating and managing embeddings."""
    
    def __init__(self):
        self.model = None
        self.model_name = settings.EMBEDDING_MODEL
        self.vector_dimension = settings.VECTOR_DIMENSION
        self.cache_timeout = 3600 * 24  # 24 hours
        self._lock = threading.Lock()
        self._load_model()
    
    def _load_model(self):
        """Load the sentence transformer model."""
        try:
            self.model = SentenceTransformer(self.model_name)
            logger.info(f"Loaded embedding model: {self.model_name}")
        except Exception as e:
            logger.error(f"Failed to load embedding model {self.model_name}: {e}")
            # Fallback to a smaller model
            try:
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("Loaded fallback embedding model: all-MiniLM-L6-v2")
            except Exception as fallback_error:
                logger.error(f"Failed to load fallback model: {fallback_error}")
                self.model = None
    
    def _get_cache_key(self, text: str, embedding_type: str) -> str:
        """Generate cache key for embedding."""
        text_hash = hashlib.md5(text.encode()).hexdigest()
        return f"embedding:{embedding_type}:{text_hash}"
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for consistent embedding generation."""
        if not text:
            return ""
        
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Convert to lowercase for consistency
        text = text.lower()
        
        return text
    
    def generate_embedding(self, text: str, embedding_type: str = "general", 
                         use_cache: bool = True) -> Optional[List[float]]:
        """Generate embedding for a single text."""
        if not self.model:
            logger.error("Embedding model not available")
            return None
        
        if not text or not text.strip():
            logger.warning("Empty text provided for embedding generation")
            return [0.0] * self.vector_dimension
        
        normalized_text = self._normalize_text(text)
        
        # Check cache first
        if use_cache:
            cache_key = self._get_cache_key(normalized_text, embedding_type)
            cached_embedding = cache.get(cache_key)
            if cached_embedding:
                return cached_embedding
        
        try:
            with self._lock:
                embedding = self.model.encode(normalized_text, convert_to_numpy=True)
                embedding_list = embedding.tolist()
            
            # Cache the result
            if use_cache:
                cache.set(cache_key, embedding_list, self.cache_timeout)
            
            return embedding_list
            
        except Exception as e:
            logger.error(f"Error generating embedding for text: {e}")
            return None
    
    def generate_batch_embeddings(self, texts: List[str], embedding_type: str = "general",
                                use_cache: bool = True) -> List[Optional[List[float]]]:
        """Generate embeddings for multiple texts efficiently."""
        if not self.model:
            logger.error("Embedding model not available")
            return [None] * len(texts)
        
        if not texts:
            return []
        
        # Normalize texts and check cache
        normalized_texts = []
        cache_keys = []
        cached_results = {}
        uncached_indices = []
        
        for i, text in enumerate(texts):
            if not text or not text.strip():
                normalized_texts.append("")
                cache_keys.append("")
                continue
                
            normalized_text = self._normalize_text(text)
            normalized_texts.append(normalized_text)
            
            if use_cache:
                cache_key = self._get_cache_key(normalized_text, embedding_type)
                cache_keys.append(cache_key)
                
                cached_embedding = cache.get(cache_key)
                if cached_embedding:
                    cached_results[i] = cached_embedding
                else:
                    uncached_indices.append(i)
            else:
                cache_keys.append("")
                uncached_indices.append(i)
        
        # Generate embeddings for uncached texts
        results = [None] * len(texts)
        
        # Fill cached results
        for i, embedding in cached_results.items():
            results[i] = embedding
        
        # Generate embeddings for uncached texts
        if uncached_indices:
            uncached_texts = [normalized_texts[i] for i in uncached_indices if normalized_texts[i]]
            
            if uncached_texts:
                try:
                    with self._lock:
                        embeddings = self.model.encode(uncached_texts, convert_to_numpy=True)
                    
                    # Process results
                    embedding_idx = 0
                    for i in uncached_indices:
                        if normalized_texts[i]:  # Non-empty text
                            embedding_list = embeddings[embedding_idx].tolist()
                            results[i] = embedding_list
                            
                            # Cache the result
                            if use_cache and cache_keys[i]:
                                cache.set(cache_keys[i], embedding_list, self.cache_timeout)
                            
                            embedding_idx += 1
                        else:  # Empty text
                            results[i] = [0.0] * self.vector_dimension
                            
                except Exception as e:
                    logger.error(f"Error generating batch embeddings: {e}")
                    # Fill remaining with None
                    for i in uncached_indices:
                        if results[i] is None:
                            results[i] = [0.0] * self.vector_dimension if normalized_texts[i] == "" else None
        
        # Handle empty texts
        for i, text in enumerate(normalized_texts):
            if text == "" and results[i] is None:
                results[i] = [0.0] * self.vector_dimension
        
        return results
    
    def generate_developer_profile_embedding(self, developer_data: Dict[str, Any]) -> Dict[str, List[float]]:
        """Generate comprehensive embeddings for a developer profile."""
        embeddings = {}
        
        # Skills embedding
        skills_text = self._format_skills_text(developer_data.get('skills', []))
        embeddings['skills'] = self.generate_embedding(skills_text, "developer_skills")
        
        # Experience embedding
        experience_text = self._format_experience_text(developer_data)
        embeddings['experience'] = self.generate_embedding(experience_text, "developer_experience")
        
        # GitHub embedding (if available)
        github_text = self._format_github_text(developer_data.get('github_analysis', {}))
        embeddings['github'] = self.generate_embedding(github_text, "developer_github")
        
        return embeddings
    
    def generate_project_requirement_embedding(self, project_data: Dict[str, Any]) -> Dict[str, List[float]]:
        """Generate comprehensive embeddings for project requirements."""
        embeddings = {}
        
        # Description embedding
        description = project_data.get('description', '')
        embeddings['description'] = self.generate_embedding(description, "project_description")
        
        # Requirements embedding
        requirements_text = self._format_requirements_text(project_data)
        embeddings['requirements'] = self.generate_embedding(requirements_text, "project_requirements")
        
        # Domain embedding
        domain_text = self._format_domain_text(project_data)
        embeddings['domain'] = self.generate_embedding(domain_text, "project_domain")
        
        return embeddings
    
    def generate_skill_embedding(self, skill_name: str, skill_context: str = "") -> List[float]:
        """Generate embedding for a skill with optional context."""
        skill_text = skill_name
        if skill_context:
            skill_text += f" {skill_context}"
        
        return self.generate_embedding(skill_text, "skill")
    
    def _format_skills_text(self, skills: List[str]) -> str:
        """Format skills list into text for embedding."""
        if not skills:
            return ""
        
        # Group skills by category if possible
        skill_text = "Skills: " + ", ".join(skills)
        return skill_text
    
    def _format_experience_text(self, developer_data: Dict[str, Any]) -> str:
        """Format developer experience into text for embedding."""
        experience_parts = []
        
        # Experience level
        if 'experience_level' in developer_data:
            experience_parts.append(f"Experience level: {developer_data['experience_level']}")
        
        # Years of experience
        if 'years_of_experience' in developer_data:
            experience_parts.append(f"Years of experience: {developer_data['years_of_experience']}")
        
        # Previous projects or roles
        if 'previous_projects' in developer_data:
            projects = developer_data['previous_projects']
            if projects:
                project_descriptions = [p.get('description', '') for p in projects if p.get('description')]
                if project_descriptions:
                    experience_parts.append(f"Previous projects: {' '.join(project_descriptions)}")
        
        # Education
        if 'education' in developer_data:
            education = developer_data['education']
            if education:
                experience_parts.append(f"Education: {education}")
        
        # Certifications
        if 'certifications' in developer_data:
            certifications = developer_data['certifications']
            if certifications:
                experience_parts.append(f"Certifications: {', '.join(certifications)}")
        
        return " ".join(experience_parts)
    
    def _format_github_text(self, github_analysis: Dict[str, Any]) -> str:
        """Format GitHub analysis into text for embedding."""
        github_parts = []
        
        # Languages used
        if 'languages' in github_analysis:
            languages = github_analysis['languages']
            if languages:
                github_parts.append(f"Programming languages: {', '.join(languages)}")
        
        # Repository topics
        if 'topics' in github_analysis:
            topics = github_analysis['topics']
            if topics:
                github_parts.append(f"Repository topics: {', '.join(topics)}")
        
        # Project types
        if 'project_types' in github_analysis:
            project_types = github_analysis['project_types']
            if project_types:
                github_parts.append(f"Project types: {', '.join(project_types)}")
        
        # Technologies used
        if 'technologies' in github_analysis:
            technologies = github_analysis['technologies']
            if technologies:
                github_parts.append(f"Technologies: {', '.join(technologies)}")
        
        # Code quality metrics
        if 'code_quality' in github_analysis:
            quality = github_analysis['code_quality']
            if quality:
                github_parts.append(f"Code quality indicators: {quality}")
        
        return " ".join(github_parts)
    
    def _format_requirements_text(self, project_data: Dict[str, Any]) -> str:
        """Format project requirements into text for embedding."""
        requirements_parts = []
        
        # Required skills
        if 'required_skills' in project_data:
            skills = project_data['required_skills']
            if skills:
                requirements_parts.append(f"Required skills: {', '.join(skills)}")
        
        # Technical requirements
        if 'technical_requirements' in project_data:
            tech_reqs = project_data['technical_requirements']
            if tech_reqs:
                requirements_parts.append(f"Technical requirements: {tech_reqs}")
        
        # Project type
        if 'project_type' in project_data:
            project_type = project_data['project_type']
            requirements_parts.append(f"Project type: {project_type}")
        
        # Complexity level
        if 'complexity_level' in project_data:
            complexity = project_data['complexity_level']
            requirements_parts.append(f"Complexity: {complexity}")
        
        # Timeline
        if 'estimated_duration' in project_data:
            duration = project_data['estimated_duration']
            requirements_parts.append(f"Duration: {duration}")
        
        return " ".join(requirements_parts)
    
    def _format_domain_text(self, project_data: Dict[str, Any]) -> str:
        """Format project domain/industry context into text for embedding."""
        domain_parts = []
        
        # Industry
        if 'industry' in project_data:
            industry = project_data['industry']
            domain_parts.append(f"Industry: {industry}")
        
        # Domain expertise
        if 'domain_expertise' in project_data:
            domain_expertise = project_data['domain_expertise']
            if domain_expertise:
                domain_parts.append(f"Domain expertise: {', '.join(domain_expertise)}")
        
        # Business context
        if 'business_context' in project_data:
            business_context = project_data['business_context']
            domain_parts.append(f"Business context: {business_context}")
        
        # Target audience
        if 'target_audience' in project_data:
            target_audience = project_data['target_audience']
            domain_parts.append(f"Target audience: {target_audience}")
        
        return " ".join(domain_parts)
    
    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings."""
        if not embedding1 or not embedding2:
            return 0.0
        
        try:
            a = np.array(embedding1)
            b = np.array(embedding2)
            
            # Handle zero vectors
            norm_a = np.linalg.norm(a)
            norm_b = np.linalg.norm(b)
            
            if norm_a == 0 or norm_b == 0:
                return 0.0
            
            return np.dot(a, b) / (norm_a * norm_b)
            
        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
            return 0.0
    
    def find_most_similar(self, query_embedding: List[float], 
                         candidate_embeddings: List[Tuple[str, List[float]]], 
                         top_k: int = 10) -> List[Tuple[str, float]]:
        """Find most similar embeddings to a query embedding."""
        if not query_embedding or not candidate_embeddings:
            return []
        
        similarities = []
        for identifier, embedding in candidate_embeddings:
            similarity = self.calculate_similarity(query_embedding, embedding)
            similarities.append((identifier, similarity))
        
        # Sort by similarity (descending) and return top k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]
    
    def update_embedding_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics for monitoring."""
        # This would need to be implemented based on your cache backend
        # For now, return basic info
        return {
            'model_name': self.model_name,
            'vector_dimension': self.vector_dimension,
            'cache_timeout': self.cache_timeout,
            'model_loaded': self.model is not None
        }


# Singleton instance
embedding_service = EmbeddingService()