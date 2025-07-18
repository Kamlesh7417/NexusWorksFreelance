"""
Graph service for performing graph traversal algorithms and relationship analysis
in the Neo4j database for developer-project matching.
"""

from typing import List, Dict, Any, Optional, Tuple, Set
import logging
from django.conf import settings
from .neo4j_service import neo4j_service
import numpy as np
from collections import defaultdict, deque
import heapq

logger = logging.getLogger(__name__)


class GraphAnalysisService:
    """Service for graph-based analysis and traversal algorithms."""
    
    def __init__(self):
        self.neo4j = neo4j_service
    
    def calculate_skill_compatibility_score(self, developer_id: str, 
                                          required_skills: List[str],
                                          weights: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        """
        Calculate comprehensive skill compatibility score using graph analysis.
        
        Args:
            developer_id: ID of the developer
            required_skills: List of required skills for the project
            weights: Optional weights for different scoring components
            
        Returns:
            Dictionary containing detailed compatibility analysis
        """
        if weights is None:
            weights = {
                'direct_match': 0.4,
                'related_skills': 0.3,
                'skill_depth': 0.2,
                'learning_potential': 0.1
            }
        
        try:
            # Get direct skill matches
            direct_matches = self.neo4j.calculate_developer_skill_match(developer_id, required_skills)
            
            # Calculate related skills score
            related_score = self._calculate_related_skills_score(developer_id, required_skills)
            
            # Calculate skill depth score
            depth_score = self._calculate_skill_depth_score(developer_id, required_skills)
            
            # Calculate learning potential
            learning_score = self._calculate_learning_potential_score(developer_id, required_skills)
            
            # Combine scores
            total_score = (
                weights['direct_match'] * self._normalize_score(direct_matches) +
                weights['related_skills'] * related_score +
                weights['skill_depth'] * depth_score +
                weights['learning_potential'] * learning_score
            )
            
            return {
                'total_score': total_score,
                'direct_matches': direct_matches,
                'related_skills_score': related_score,
                'skill_depth_score': depth_score,
                'learning_potential_score': learning_score,
                'score_breakdown': weights,
                'missing_skills': [skill for skill in required_skills if direct_matches.get(skill, 0) == 0]
            }
            
        except Exception as e:
            logger.error(f"Error calculating skill compatibility for developer {developer_id}: {e}")
            return {'total_score': 0.0, 'error': str(e)}
    
    def _normalize_score(self, skill_matches: Dict[str, float]) -> float:
        """Normalize direct skill match scores."""
        if not skill_matches:
            return 0.0
        
        scores = list(skill_matches.values())
        return sum(scores) / len(scores) if scores else 0.0
    
    def _calculate_related_skills_score(self, developer_id: str, required_skills: List[str]) -> float:
        """Calculate score based on related skills the developer has."""
        try:
            with self.neo4j.get_session() as session:
                query = """
                MATCH (d:Developer {id: $developer_id})-[r:HAS_SKILL]->(dev_skill:Skill)
                UNWIND $required_skills as req_skill
                MATCH (req:Skill {name: req_skill})
                OPTIONAL MATCH path = (dev_skill)-[rel*1..2]-(req)
                WHERE ALL(r in rel WHERE r.strength >= 0.3)
                
                WITH req_skill, dev_skill.name as dev_skill_name, r.proficiency as proficiency,
                     CASE WHEN path IS NOT NULL 
                          THEN reduce(strength = 1.0, r in rel | strength * r.strength)
                          ELSE 0.0 END as relationship_strength
                
                WHERE relationship_strength > 0
                RETURN req_skill, 
                       collect({skill: dev_skill_name, proficiency: proficiency, strength: relationship_strength}) as related_skills,
                       max(relationship_strength * proficiency) as max_related_score
                """
                
                result = session.run(query, {
                    'developer_id': developer_id,
                    'required_skills': required_skills
                })
                
                related_scores = []
                for record in result:
                    related_scores.append(record['max_related_score'])
                
                return sum(related_scores) / len(required_skills) if related_scores else 0.0
                
        except Exception as e:
            logger.error(f"Error calculating related skills score: {e}")
            return 0.0
    
    def _calculate_skill_depth_score(self, developer_id: str, required_skills: List[str]) -> float:
        """Calculate score based on depth of experience in skill areas."""
        try:
            with self.neo4j.get_session() as session:
                query = """
                MATCH (d:Developer {id: $developer_id})-[r:HAS_SKILL]->(s:Skill)
                WHERE s.name IN $required_skills
                
                WITH s.name as skill_name, r.experience_years as experience, r.proficiency as proficiency
                RETURN skill_name, 
                       experience,
                       proficiency,
                       (experience * 0.1 + proficiency * 0.9) as depth_score
                """
                
                result = session.run(query, {
                    'developer_id': developer_id,
                    'required_skills': required_skills
                })
                
                depth_scores = []
                for record in result:
                    depth_scores.append(record['depth_score'])
                
                return sum(depth_scores) / len(required_skills) if depth_scores else 0.0
                
        except Exception as e:
            logger.error(f"Error calculating skill depth score: {e}")
            return 0.0
    
    def _calculate_learning_potential_score(self, developer_id: str, required_skills: List[str]) -> float:
        """Calculate learning potential based on skill adjacency and learning history."""
        try:
            with self.neo4j.get_session() as session:
                # Find skills the developer has that are adjacent to required skills
                query = """
                MATCH (d:Developer {id: $developer_id})-[r:HAS_SKILL]->(dev_skill:Skill)
                UNWIND $required_skills as req_skill
                MATCH (req:Skill {name: req_skill})
                
                OPTIONAL MATCH (dev_skill)-[rel:RELATED_TO|PREREQUISITE_FOR]-(req)
                WHERE rel.strength >= 0.5
                
                WITH req_skill, 
                     count(rel) as adjacent_skills,
                     avg(r.proficiency) as avg_proficiency
                
                RETURN req_skill,
                       adjacent_skills,
                       avg_proficiency,
                       (adjacent_skills * 0.3 + avg_proficiency * 0.7) as learning_potential
                """
                
                result = session.run(query, {
                    'developer_id': developer_id,
                    'required_skills': required_skills
                })
                
                learning_scores = []
                for record in result:
                    learning_scores.append(record['learning_potential'] or 0.0)
                
                return sum(learning_scores) / len(required_skills) if learning_scores else 0.0
                
        except Exception as e:
            logger.error(f"Error calculating learning potential score: {e}")
            return 0.0
    
    def find_optimal_team_composition(self, required_skills: List[str], 
                                    team_size_limit: int = 5,
                                    exclude_developers: List[str] = None) -> Dict[str, Any]:
        """
        Find optimal team composition using graph algorithms.
        
        Args:
            required_skills: List of skills required for the project
            team_size_limit: Maximum number of team members
            exclude_developers: List of developer IDs to exclude
            
        Returns:
            Dictionary containing optimal team composition and analysis
        """
        exclude_developers = exclude_developers or []
        
        try:
            # Get all developers with relevant skills
            candidates = self._get_skill_candidates(required_skills, exclude_developers)
            
            if not candidates:
                return {'team': [], 'coverage': 0.0, 'error': 'No suitable candidates found'}
            
            # Use greedy algorithm with optimization
            optimal_team = self._greedy_team_selection(candidates, required_skills, team_size_limit)
            
            # Calculate team metrics
            team_analysis = self._analyze_team_composition(optimal_team, required_skills)
            
            return {
                'team': optimal_team,
                'skill_coverage': team_analysis['skill_coverage'],
                'team_synergy_score': team_analysis['synergy_score'],
                'collaboration_potential': team_analysis['collaboration_potential'],
                'cost_estimate': team_analysis['cost_estimate'],
                'coverage_details': team_analysis['coverage_details']
            }
            
        except Exception as e:
            logger.error(f"Error finding optimal team composition: {e}")
            return {'team': [], 'coverage': 0.0, 'error': str(e)}
    
    def _get_skill_candidates(self, required_skills: List[str], 
                            exclude_developers: List[str]) -> List[Dict[str, Any]]:
        """Get candidate developers for required skills."""
        try:
            with self.neo4j.get_session() as session:
                query = """
                UNWIND $required_skills as skill_name
                MATCH (s:Skill {name: skill_name})<-[r:HAS_SKILL]-(d:Developer)
                WHERE NOT d.id IN $exclude_developers
                
                WITH d, collect({skill: skill_name, proficiency: r.proficiency, experience: r.experience_years}) as skills
                
                RETURN d.id as developer_id,
                       d.hourly_rate as hourly_rate,
                       d.availability_status as availability,
                       d.reputation_score as reputation,
                       skills
                ORDER BY reputation DESC
                """
                
                result = session.run(query, {
                    'required_skills': required_skills,
                    'exclude_developers': exclude_developers
                })
                
                candidates = []
                for record in result:
                    candidate = {
                        'developer_id': record['developer_id'],
                        'hourly_rate': record['hourly_rate'] or 50.0,
                        'availability': record['availability'],
                        'reputation': record['reputation'] or 0.0,
                        'skills': {skill['skill']: skill['proficiency'] for skill in record['skills']}
                    }
                    candidates.append(candidate)
                
                return candidates
                
        except Exception as e:
            logger.error(f"Error getting skill candidates: {e}")
            return []
    
    def _greedy_team_selection(self, candidates: List[Dict[str, Any]], 
                             required_skills: List[str], 
                             team_size_limit: int) -> List[Dict[str, Any]]:
        """Select optimal team using greedy algorithm with skill coverage optimization."""
        team = []
        covered_skills = set()
        remaining_skills = set(required_skills)
        
        # Sort candidates by a composite score
        def candidate_score(candidate):
            skill_count = len(candidate['skills'])
            avg_proficiency = sum(candidate['skills'].values()) / len(candidate['skills']) if candidate['skills'] else 0
            return (skill_count * 0.4 + avg_proficiency * 0.4 + candidate['reputation'] * 0.2)
        
        candidates.sort(key=candidate_score, reverse=True)
        
        while len(team) < team_size_limit and remaining_skills and candidates:
            best_candidate = None
            best_score = -1
            best_new_skills = set()
            
            for candidate in candidates:
                if candidate['availability'] != 'available':
                    continue
                
                # Calculate how many new skills this candidate would add
                candidate_skills = set(candidate['skills'].keys())
                new_skills = candidate_skills.intersection(remaining_skills)
                
                if not new_skills:
                    continue
                
                # Score based on new skills coverage and proficiency
                coverage_score = len(new_skills) / len(remaining_skills)
                proficiency_score = sum(candidate['skills'].get(skill, 0) for skill in new_skills) / len(new_skills)
                reputation_bonus = candidate['reputation'] * 0.1
                
                total_score = coverage_score * 0.5 + proficiency_score * 0.4 + reputation_bonus
                
                if total_score > best_score:
                    best_candidate = candidate
                    best_score = total_score
                    best_new_skills = new_skills
            
            if best_candidate:
                team.append(best_candidate)
                covered_skills.update(best_new_skills)
                remaining_skills -= best_new_skills
                candidates.remove(best_candidate)
            else:
                break
        
        return team
    
    def _analyze_team_composition(self, team: List[Dict[str, Any]], 
                                required_skills: List[str]) -> Dict[str, Any]:
        """Analyze the composition and effectiveness of a selected team."""
        if not team:
            return {
                'skill_coverage': 0.0,
                'synergy_score': 0.0,
                'collaboration_potential': 0.0,
                'cost_estimate': 0.0,
                'coverage_details': {}
            }
        
        # Calculate skill coverage
        covered_skills = set()
        skill_proficiencies = {}
        
        for member in team:
            for skill, proficiency in member['skills'].items():
                if skill in required_skills:
                    covered_skills.add(skill)
                    skill_proficiencies[skill] = max(skill_proficiencies.get(skill, 0), proficiency)
        
        skill_coverage = len(covered_skills) / len(required_skills) if required_skills else 0.0
        
        # Calculate team synergy (collaboration history)
        synergy_score = self._calculate_team_synergy([m['developer_id'] for m in team])
        
        # Calculate collaboration potential
        collaboration_potential = self._calculate_collaboration_potential(team)
        
        # Calculate cost estimate
        cost_estimate = sum(member['hourly_rate'] for member in team)
        
        return {
            'skill_coverage': skill_coverage,
            'synergy_score': synergy_score,
            'collaboration_potential': collaboration_potential,
            'cost_estimate': cost_estimate,
            'coverage_details': skill_proficiencies
        }
    
    def _calculate_team_synergy(self, developer_ids: List[str]) -> float:
        """Calculate team synergy based on past collaboration history."""
        if len(developer_ids) < 2:
            return 0.0
        
        try:
            with self.neo4j.get_session() as session:
                query = """
                UNWIND $developer_ids as dev1_id
                UNWIND $developer_ids as dev2_id
                WHERE dev1_id < dev2_id
                
                MATCH (d1:Developer {id: dev1_id})
                MATCH (d2:Developer {id: dev2_id})
                OPTIONAL MATCH (d1)-[r:COLLABORATED_WITH]-(d2)
                
                RETURN count(*) as total_pairs,
                       sum(CASE WHEN r IS NOT NULL THEN r.collaboration_score ELSE 0 END) as total_collaboration_score
                """
                
                result = session.run(query, {'developer_ids': developer_ids})
                record = result.single()
                
                if record and record['total_pairs'] > 0:
                    return record['total_collaboration_score'] / record['total_pairs']
                
                return 0.0
                
        except Exception as e:
            logger.error(f"Error calculating team synergy: {e}")
            return 0.0
    
    def _calculate_collaboration_potential(self, team: List[Dict[str, Any]]) -> float:
        """Calculate collaboration potential based on complementary skills."""
        if len(team) < 2:
            return 0.0
        
        # Calculate skill complementarity
        all_skills = set()
        for member in team:
            all_skills.update(member['skills'].keys())
        
        complementarity_scores = []
        for i, member1 in enumerate(team):
            for member2 in team[i+1:]:
                # Calculate how complementary their skills are
                skills1 = set(member1['skills'].keys())
                skills2 = set(member2['skills'].keys())
                
                overlap = len(skills1.intersection(skills2))
                total_unique = len(skills1.union(skills2))
                
                # Higher score for less overlap (more complementary)
                if total_unique > 0:
                    complementarity = 1.0 - (overlap / total_unique)
                    complementarity_scores.append(complementarity)
        
        return sum(complementarity_scores) / len(complementarity_scores) if complementarity_scores else 0.0
    
    def analyze_skill_market_dynamics(self, time_window_days: int = 90) -> Dict[str, Any]:
        """Analyze skill market dynamics using graph algorithms."""
        try:
            # Get market trends from Neo4j
            market_trends = self.neo4j.analyze_skill_market_trends(time_window_days)
            
            # Analyze skill clusters and relationships
            skill_clusters = self._identify_skill_clusters()
            
            # Calculate skill importance scores
            skill_importance = self._calculate_skill_importance_scores()
            
            return {
                'market_trends': market_trends,
                'skill_clusters': skill_clusters,
                'skill_importance': skill_importance,
                'recommendations': self._generate_market_recommendations(market_trends, skill_clusters)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing skill market dynamics: {e}")
            return {'error': str(e)}
    
    def _identify_skill_clusters(self) -> List[Dict[str, Any]]:
        """Identify clusters of related skills using graph algorithms."""
        try:
            with self.neo4j.get_session() as session:
                # Use community detection algorithm (simplified version)
                query = """
                MATCH (s1:Skill)-[r:RELATED_TO]-(s2:Skill)
                WHERE r.strength >= 0.5
                
                WITH s1, collect({skill: s2.name, strength: r.strength}) as related_skills
                
                RETURN s1.name as skill_name,
                       s1.category as category,
                       related_skills
                ORDER BY size(related_skills) DESC
                """
                
                result = session.run(query)
                
                # Simple clustering based on strong relationships
                clusters = []
                processed_skills = set()
                
                for record in result:
                    skill_name = record['skill_name']
                    if skill_name in processed_skills:
                        continue
                    
                    cluster = {
                        'primary_skill': skill_name,
                        'category': record['category'],
                        'related_skills': record['related_skills'],
                        'cluster_size': len(record['related_skills']) + 1
                    }
                    
                    clusters.append(cluster)
                    processed_skills.add(skill_name)
                    processed_skills.update(rs['skill'] for rs in record['related_skills'])
                
                return clusters[:10]  # Return top 10 clusters
                
        except Exception as e:
            logger.error(f"Error identifying skill clusters: {e}")
            return []
    
    def _calculate_skill_importance_scores(self) -> Dict[str, float]:
        """Calculate importance scores for skills using centrality measures."""
        try:
            with self.neo4j.get_session() as session:
                # Calculate degree centrality (simplified)
                query = """
                MATCH (s:Skill)
                OPTIONAL MATCH (s)-[r:RELATED_TO]-()
                WITH s, count(r) as degree
                
                OPTIONAL MATCH (d:Developer)-[dr:HAS_SKILL]->(s)
                WITH s, degree, count(dr) as developer_count
                
                OPTIONAL MATCH (p:Project)-[pr:REQUIRES_SKILL]->(s)
                WITH s, degree, developer_count, count(pr) as project_count
                
                RETURN s.name as skill_name,
                       degree,
                       developer_count,
                       project_count,
                       (degree * 0.3 + developer_count * 0.4 + project_count * 0.3) as importance_score
                ORDER BY importance_score DESC
                """
                
                result = session.run(query)
                
                importance_scores = {}
                for record in result:
                    importance_scores[record['skill_name']] = record['importance_score']
                
                return importance_scores
                
        except Exception as e:
            logger.error(f"Error calculating skill importance scores: {e}")
            return {}
    
    def _generate_market_recommendations(self, market_trends: List[Dict[str, Any]], 
                                       skill_clusters: List[Dict[str, Any]]) -> List[str]:
        """Generate market recommendations based on analysis."""
        recommendations = []
        
        # High demand, low supply skills
        high_demand_skills = [
            trend for trend in market_trends 
            if trend.get('demand_supply_ratio', 0) > 2.0
        ]
        
        if high_demand_skills:
            top_skill = high_demand_skills[0]['skill_name']
            recommendations.append(f"High opportunity: {top_skill} has high demand but low supply")
        
        # Emerging skill clusters
        large_clusters = [cluster for cluster in skill_clusters if cluster['cluster_size'] > 5]
        if large_clusters:
            cluster = large_clusters[0]
            recommendations.append(f"Consider skill cluster: {cluster['primary_skill']} and related technologies")
        
        return recommendations


# Singleton instance
graph_service = GraphAnalysisService()