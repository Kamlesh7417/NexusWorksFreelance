"""
Hybrid RAG (Retrieval-Augmented Generation) service that combines vector similarity search
with graph-based relationship analysis for intelligent developer-project matching.
"""

from typing import List, Dict, Any, Optional, Tuple, Union
import logging
import numpy as np
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import asyncio
from concurrent.futures import ThreadPoolExecutor
import json
import hashlib

from .embedding_service import embedding_service
from .graph_service import graph_service
from .neo4j_service import neo4j_service
from .vector_models import (
    VectorEmbedding, DeveloperProfileEmbedding, ProjectRequirementEmbedding,
    SkillEmbedding, SimilaritySearchResult
)

logger = logging.getLogger(__name__)


class HybridRAGService:
    """
    Hybrid RAG service combining vector similarity search with graph analysis
    for comprehensive developer-project matching.
    """
    
    def __init__(self):
        self.embedding_service = embedding_service
        self.graph_service = graph_service
        self.neo4j_service = neo4j_service
        self.cache_timeout = 3600  # 1 hour
        self.similarity_threshold = settings.SIMILARITY_THRESHOLD
        
        # Matching algorithm weights from settings
        self.matching_weights = settings.PLATFORM_CONFIG['MATCHING_ALGORITHM_WEIGHTS']
    
    def find_matching_developers(self, project_data: Dict[str, Any], 
                               limit: int = 20,
                               include_analysis: bool = True) -> List[Dict[str, Any]]:
        """
        Find developers matching project requirements using hybrid RAG approach.
        
        Args:
            project_data: Project information including requirements and description
            limit: Maximum number of developers to return
            include_analysis: Whether to include detailed matching analysis
            
        Returns:
            List of matching developers with scores and analysis
        """
        try:
            project_id = project_data.get('id', 'temp_project')
            
            # Generate cache key
            cache_key = self._generate_cache_key('developer_match', project_data, limit)
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.info(f"Returning cached developer matches for project {project_id}")
                return cached_result
            
            # Step 1: Vector-based similarity search
            vector_matches = self._vector_similarity_search(project_data, limit * 2)
            
            # Step 2: Graph-based relationship analysis
            graph_matches = self._graph_relationship_analysis(project_data, vector_matches)
            
            # Step 3: Combine and rank results
            hybrid_matches = self._combine_matching_scores(vector_matches, graph_matches)
            
            # Step 4: Add availability and reputation filtering
            filtered_matches = self._apply_availability_filter(hybrid_matches)
            
            # Step 5: Generate detailed analysis if requested
            if include_analysis:
                final_matches = self._add_detailed_analysis(filtered_matches, project_data)
            else:
                final_matches = filtered_matches
            
            # Sort by final score and limit results
            final_matches.sort(key=lambda x: x.get('final_score', 0), reverse=True)
            result = final_matches[:limit]
            
            # Cache the result
            cache.set(cache_key, result, self.cache_timeout)
            
            logger.info(f"Found {len(result)} matching developers for project {project_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error finding matching developers: {e}")
            return []
    
    def find_matching_projects(self, developer_data: Dict[str, Any], 
                             limit: int = 20,
                             include_analysis: bool = True) -> List[Dict[str, Any]]:
        """
        Find projects matching developer skills using hybrid RAG approach.
        
        Args:
            developer_data: Developer information including skills and experience
            limit: Maximum number of projects to return
            include_analysis: Whether to include detailed matching analysis
            
        Returns:
            List of matching projects with scores and analysis
        """
        try:
            developer_id = developer_data.get('id', 'temp_developer')
            
            # Generate cache key
            cache_key = self._generate_cache_key('project_match', developer_data, limit)
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.info(f"Returning cached project matches for developer {developer_id}")
                return cached_result
            
            # Step 1: Vector-based similarity search
            vector_matches = self._vector_project_search(developer_data, limit * 2)
            
            # Step 2: Graph-based skill analysis
            graph_matches = self._graph_project_analysis(developer_data, vector_matches)
            
            # Step 3: Combine and rank results
            hybrid_matches = self._combine_project_scores(vector_matches, graph_matches)
            
            # Step 4: Add detailed analysis if requested
            if include_analysis:
                final_matches = self._add_project_analysis(hybrid_matches, developer_data)
            else:
                final_matches = hybrid_matches
            
            # Sort by final score and limit results
            final_matches.sort(key=lambda x: x.get('final_score', 0), reverse=True)
            result = final_matches[:limit]
            
            # Cache the result
            cache.set(cache_key, result, self.cache_timeout)
            
            logger.info(f"Found {len(result)} matching projects for developer {developer_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error finding matching projects: {e}")
            return []
    
    def _vector_similarity_search(self, project_data: Dict[str, Any], 
                                limit: int) -> List[Dict[str, Any]]:
        """Perform vector-based similarity search for developers."""
        try:
            # Generate project embeddings
            project_embeddings = self.embedding_service.generate_project_requirement_embedding(project_data)
            
            if not any(project_embeddings.values()):
                logger.warning("Failed to generate project embeddings")
                return []
            
            # Get combined project embedding
            combined_embedding = self._combine_project_embeddings(project_embeddings)
            
            # Search for similar developer profiles
            developer_embeddings = DeveloperProfileEmbedding.objects.all()
            
            matches = []
            for dev_embedding in developer_embeddings:
                # Calculate similarity with combined developer embedding
                dev_combined = dev_embedding.get_combined_embedding()
                similarity = self.embedding_service.calculate_similarity(
                    combined_embedding.tolist(), dev_combined.tolist()
                )
                
                if similarity >= self.similarity_threshold:
                    matches.append({
                        'developer_id': dev_embedding.developer_id,
                        'vector_score': similarity,
                        'embedding_breakdown': {
                            'skills_similarity': self.embedding_service.calculate_similarity(
                                project_embeddings['requirements'], dev_embedding.skills_embedding
                            ),
                            'experience_similarity': self.embedding_service.calculate_similarity(
                                project_embeddings['description'], dev_embedding.experience_embedding
                            ),
                            'github_similarity': self.embedding_service.calculate_similarity(
                                project_embeddings['requirements'], dev_embedding.github_embedding
                            )
                        }
                    })
            
            # Sort by vector score and return top matches
            matches.sort(key=lambda x: x['vector_score'], reverse=True)
            return matches[:limit]
            
        except Exception as e:
            logger.error(f"Error in vector similarity search: {e}")
            return []
    
    def _graph_relationship_analysis(self, project_data: Dict[str, Any], 
                                   vector_matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Perform graph-based relationship analysis for developers."""
        try:
            required_skills = project_data.get('required_skills', [])
            if not required_skills:
                # Extract skills from description using AI
                required_skills = self._extract_skills_from_description(project_data.get('description', ''))
            
            graph_matches = []
            for match in vector_matches:
                developer_id = match['developer_id']
                
                # Calculate skill compatibility using graph analysis
                compatibility = self.graph_service.calculate_skill_compatibility_score(
                    developer_id, required_skills
                )
                
                graph_matches.append({
                    'developer_id': developer_id,
                    'graph_score': compatibility.get('total_score', 0.0),
                    'skill_analysis': compatibility
                })
            
            return graph_matches
            
        except Exception as e:
            logger.error(f"Error in graph relationship analysis: {e}")
            return []
    
    def _combine_matching_scores(self, vector_matches: List[Dict[str, Any]], 
                               graph_matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Combine vector and graph scores using weighted algorithm."""
        try:
            # Create lookup for graph scores
            graph_scores = {match['developer_id']: match for match in graph_matches}
            
            combined_matches = []
            for vector_match in vector_matches:
                developer_id = vector_match['developer_id']
                graph_match = graph_scores.get(developer_id, {})
                
                # Calculate weighted final score
                vector_score = vector_match.get('vector_score', 0.0)
                graph_score = graph_match.get('graph_score', 0.0)
                
                final_score = (
                    vector_score * self.matching_weights['vector_score'] +
                    graph_score * self.matching_weights['graph_score']
                )
                
                combined_match = {
                    'developer_id': developer_id,
                    'vector_score': vector_score,
                    'graph_score': graph_score,
                    'final_score': final_score,
                    'embedding_breakdown': vector_match.get('embedding_breakdown', {}),
                    'skill_analysis': graph_match.get('skill_analysis', {})
                }
                
                combined_matches.append(combined_match)
            
            return combined_matches
            
        except Exception as e:
            logger.error(f"Error combining matching scores: {e}")
            return []
    
    def _apply_availability_filter(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply availability and reputation filtering to matches."""
        try:
            from users.models import User
            
            filtered_matches = []
            for match in matches:
                try:
                    developer = User.objects.get(id=match['developer_id'])
                    developer_profile = getattr(developer, 'developerprofile', None)
                    
                    if not developer_profile:
                        continue
                    
                    # Calculate availability score
                    availability_score = self._calculate_availability_score(developer_profile)
                    
                    # Calculate reputation score
                    reputation_score = developer_profile.reputation_score or 0.0
                    
                    # Update final score with availability and reputation
                    base_score = match['final_score']
                    final_score = (
                        base_score * (1 - self.matching_weights['availability_score'] - self.matching_weights['reputation_score']) +
                        availability_score * self.matching_weights['availability_score'] +
                        reputation_score * self.matching_weights['reputation_score']
                    )
                    
                    match.update({
                        'availability_score': availability_score,
                        'reputation_score': reputation_score,
                        'final_score': final_score,
                        'developer_info': {
                            'experience_level': developer_profile.experience_level,
                            'hourly_rate': float(developer_profile.hourly_rate) if developer_profile.hourly_rate else 0.0,
                            'availability_status': developer_profile.availability_status
                        }
                    })
                    
                    filtered_matches.append(match)
                    
                except User.DoesNotExist:
                    logger.warning(f"Developer {match['developer_id']} not found")
                    continue
                except Exception as e:
                    logger.error(f"Error processing developer {match['developer_id']}: {e}")
                    continue
            
            return filtered_matches
            
        except Exception as e:
            logger.error(f"Error applying availability filter: {e}")
            return matches
    
    def _calculate_availability_score(self, developer_profile) -> float:
        """Calculate availability score for a developer."""
        status_scores = {
            'available': 1.0,
            'partially_available': 0.7,
            'busy': 0.3,
            'unavailable': 0.0
        }
        
        return status_scores.get(developer_profile.availability_status, 0.5)
    
    def _add_detailed_analysis(self, matches: List[Dict[str, Any]], 
                             project_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Add detailed matching analysis to results."""
        try:
            for match in matches:
                # Add skill gap analysis
                skill_analysis = match.get('skill_analysis', {})
                missing_skills = skill_analysis.get('missing_skills', [])
                
                # Add learning recommendations
                learning_recommendations = self._generate_learning_recommendations(
                    match['developer_id'], missing_skills
                )
                
                # Add team fit analysis
                team_fit = self._analyze_team_fit(match['developer_id'], project_data)
                
                match['detailed_analysis'] = {
                    'missing_skills': missing_skills,
                    'learning_recommendations': learning_recommendations,
                    'team_fit_score': team_fit,
                    'match_confidence': self._calculate_match_confidence(match),
                    'estimated_ramp_up_time': self._estimate_ramp_up_time(skill_analysis)
                }
            
            return matches
            
        except Exception as e:
            logger.error(f"Error adding detailed analysis: {e}")
            return matches
    
    def _vector_project_search(self, developer_data: Dict[str, Any], 
                             limit: int) -> List[Dict[str, Any]]:
        """Perform vector-based similarity search for projects."""
        try:
            # Generate developer embeddings
            developer_embeddings = self.embedding_service.generate_developer_profile_embedding(developer_data)
            
            if not any(developer_embeddings.values()):
                logger.warning("Failed to generate developer embeddings")
                return []
            
            # Get combined developer embedding
            combined_embedding = self._combine_developer_embeddings(developer_embeddings)
            
            # Search for similar project requirements
            project_embeddings = ProjectRequirementEmbedding.objects.all()
            
            matches = []
            for proj_embedding in project_embeddings:
                # Calculate similarity with combined project embedding
                proj_combined = proj_embedding.get_combined_embedding()
                similarity = self.embedding_service.calculate_similarity(
                    combined_embedding.tolist(), proj_combined.tolist()
                )
                
                if similarity >= self.similarity_threshold:
                    matches.append({
                        'project_id': proj_embedding.project_id,
                        'vector_score': similarity,
                        'embedding_breakdown': {
                            'description_similarity': self.embedding_service.calculate_similarity(
                                developer_embeddings['experience'], proj_embedding.description_embedding
                            ),
                            'requirements_similarity': self.embedding_service.calculate_similarity(
                                developer_embeddings['skills'], proj_embedding.requirements_embedding
                            ),
                            'domain_similarity': self.embedding_service.calculate_similarity(
                                developer_embeddings['experience'], proj_embedding.domain_embedding
                            )
                        }
                    })
            
            # Sort by vector score and return top matches
            matches.sort(key=lambda x: x['vector_score'], reverse=True)
            return matches[:limit]
            
        except Exception as e:
            logger.error(f"Error in vector project search: {e}")
            return []
    
    def _graph_project_analysis(self, developer_data: Dict[str, Any], 
                              vector_matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Perform graph-based analysis for project matching."""
        try:
            developer_id = developer_data.get('id')
            developer_skills = developer_data.get('skills', [])
            
            graph_matches = []
            for match in vector_matches:
                project_id = match['project_id']
                
                # Get project requirements from graph
                project_requirements = self._get_project_requirements_from_graph(project_id)
                
                if project_requirements:
                    # Calculate skill match using graph analysis
                    skill_match = self.graph_service.calculate_skill_compatibility_score(
                        developer_id, project_requirements
                    )
                    
                    graph_matches.append({
                        'project_id': project_id,
                        'graph_score': skill_match.get('total_score', 0.0),
                        'skill_analysis': skill_match
                    })
                else:
                    graph_matches.append({
                        'project_id': project_id,
                        'graph_score': 0.0,
                        'skill_analysis': {}
                    })
            
            return graph_matches
            
        except Exception as e:
            logger.error(f"Error in graph project analysis: {e}")
            return []
    
    def _combine_project_scores(self, vector_matches: List[Dict[str, Any]], 
                              graph_matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Combine vector and graph scores for project matching."""
        try:
            # Create lookup for graph scores
            graph_scores = {match['project_id']: match for match in graph_matches}
            
            combined_matches = []
            for vector_match in vector_matches:
                project_id = vector_match['project_id']
                graph_match = graph_scores.get(project_id, {})
                
                # Calculate weighted final score
                vector_score = vector_match.get('vector_score', 0.0)
                graph_score = graph_match.get('graph_score', 0.0)
                
                final_score = (
                    vector_score * self.matching_weights['vector_score'] +
                    graph_score * self.matching_weights['graph_score']
                )
                
                combined_match = {
                    'project_id': project_id,
                    'vector_score': vector_score,
                    'graph_score': graph_score,
                    'final_score': final_score,
                    'embedding_breakdown': vector_match.get('embedding_breakdown', {}),
                    'skill_analysis': graph_match.get('skill_analysis', {})
                }
                
                combined_matches.append(combined_match)
            
            return combined_matches
            
        except Exception as e:
            logger.error(f"Error combining project scores: {e}")
            return []
    
    def _add_project_analysis(self, matches: List[Dict[str, Any]], 
                            developer_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Add detailed project analysis to results."""
        try:
            for match in matches:
                # Add project fit analysis
                project_fit = self._analyze_project_fit(match['project_id'], developer_data)
                
                # Add growth opportunity analysis
                growth_opportunities = self._analyze_growth_opportunities(
                    match['project_id'], developer_data
                )
                
                match['detailed_analysis'] = {
                    'project_fit_score': project_fit,
                    'growth_opportunities': growth_opportunities,
                    'match_confidence': self._calculate_match_confidence(match),
                    'skill_utilization': self._calculate_skill_utilization(match)
                }
            
            return matches
            
        except Exception as e:
            logger.error(f"Error adding project analysis: {e}")
            return matches
    
    # Helper methods
    
    def _generate_cache_key(self, search_type: str, data: Dict[str, Any], limit: int) -> str:
        """Generate cache key for search results."""
        data_str = json.dumps(data, sort_keys=True)
        data_hash = hashlib.md5(data_str.encode()).hexdigest()
        return f"hybrid_rag:{search_type}:{data_hash}:{limit}"
    
    def _combine_project_embeddings(self, embeddings: Dict[str, List[float]]) -> np.ndarray:
        """Combine different project embedding types."""
        weights = {'description': 0.4, 'requirements': 0.4, 'domain': 0.2}
        
        combined = np.zeros(self.embedding_service.vector_dimension)
        for embed_type, embedding in embeddings.items():
            if embedding:
                weight = weights.get(embed_type, 0.33)
                combined += np.array(embedding) * weight
        
        # Normalize
        norm = np.linalg.norm(combined)
        if norm > 0:
            combined = combined / norm
        
        return combined
    
    def _combine_developer_embeddings(self, embeddings: Dict[str, List[float]]) -> np.ndarray:
        """Combine different developer embedding types."""
        weights = {'skills': 0.5, 'experience': 0.3, 'github': 0.2}
        
        combined = np.zeros(self.embedding_service.vector_dimension)
        for embed_type, embedding in embeddings.items():
            if embedding:
                weight = weights.get(embed_type, 0.33)
                combined += np.array(embedding) * weight
        
        # Normalize
        norm = np.linalg.norm(combined)
        if norm > 0:
            combined = combined / norm
        
        return combined
    
    def _extract_skills_from_description(self, description: str) -> List[str]:
        """Extract skills from project description using AI."""
        # This would use the Gemini API to extract skills
        # For now, return empty list as placeholder
        return []
    
    def _generate_learning_recommendations(self, developer_id: str, 
                                         missing_skills: List[str]) -> List[str]:
        """Generate learning recommendations for missing skills."""
        recommendations = []
        for skill in missing_skills[:3]:  # Top 3 missing skills
            recommendations.append(f"Learn {skill} to improve project match")
        return recommendations
    
    def _analyze_team_fit(self, developer_id: str, project_data: Dict[str, Any]) -> float:
        """Analyze how well developer fits with potential team."""
        # Placeholder implementation
        return 0.8
    
    def _calculate_match_confidence(self, match: Dict[str, Any]) -> float:
        """Calculate confidence score for the match."""
        vector_score = match.get('vector_score', 0.0)
        graph_score = match.get('graph_score', 0.0)
        
        # Higher confidence when both scores are high and similar
        avg_score = (vector_score + graph_score) / 2
        score_difference = abs(vector_score - graph_score)
        
        confidence = avg_score * (1 - score_difference * 0.5)
        return min(confidence, 1.0)
    
    def _estimate_ramp_up_time(self, skill_analysis: Dict[str, Any]) -> str:
        """Estimate ramp-up time based on skill analysis."""
        missing_skills = skill_analysis.get('missing_skills', [])
        
        if not missing_skills:
            return "Immediate"
        elif len(missing_skills) <= 2:
            return "1-2 weeks"
        elif len(missing_skills) <= 4:
            return "2-4 weeks"
        else:
            return "1-2 months"
    
    def _get_project_requirements_from_graph(self, project_id: str) -> List[str]:
        """Get project requirements from Neo4j graph."""
        try:
            with self.neo4j_service.get_session() as session:
                query = """
                MATCH (p:Project {id: $project_id})-[r:REQUIRES_SKILL]->(s:Skill)
                RETURN s.name as skill_name
                ORDER BY r.importance DESC
                """
                
                result = session.run(query, {'project_id': project_id})
                return [record['skill_name'] for record in result]
                
        except Exception as e:
            logger.error(f"Error getting project requirements from graph: {e}")
            return []
    
    def _analyze_project_fit(self, project_id: str, developer_data: Dict[str, Any]) -> float:
        """Analyze how well project fits developer's career goals."""
        # Placeholder implementation
        return 0.75
    
    def _analyze_growth_opportunities(self, project_id: str, 
                                    developer_data: Dict[str, Any]) -> List[str]:
        """Analyze growth opportunities in the project."""
        # Placeholder implementation
        return ["Learn new technologies", "Leadership experience", "Domain expertise"]
    
    def _calculate_skill_utilization(self, match: Dict[str, Any]) -> float:
        """Calculate how well the project utilizes developer's skills."""
        # Placeholder implementation
        return 0.8


# Singleton instance
hybrid_rag_service = HybridRAGService()