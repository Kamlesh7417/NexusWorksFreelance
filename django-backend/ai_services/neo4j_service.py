"""
Neo4j graph database service for managing skill-technology relationships,
developer networks, and project collaboration patterns.
"""

from neo4j import GraphDatabase, Driver
from django.conf import settings
from typing import List, Dict, Any, Optional, Tuple, Set
import logging
import json
from datetime import datetime, timedelta
from contextlib import contextmanager

logger = logging.getLogger(__name__)


class Neo4jService:
    """Service class for Neo4j graph database operations."""
    
    def __init__(self):
        self.driver: Optional[Driver] = None
        self._connect()
    
    def _connect(self):
        """Establish connection to Neo4j database."""
        try:
            config = settings.NEO4J_CONFIG
            self.driver = GraphDatabase.driver(
                config['URI'],
                auth=(config['USERNAME'], config['PASSWORD']),
                max_connection_lifetime=config.get('MAX_CONNECTION_LIFETIME', 3600),
                max_connection_pool_size=config.get('MAX_CONNECTION_POOL_SIZE', 50),
                connection_acquisition_timeout=config.get('CONNECTION_ACQUISITION_TIMEOUT', 60)
            )
            
            # Test connection
            with self.driver.session(database=config.get('DATABASE', 'neo4j')) as session:
                session.run("RETURN 1")
            
            logger.info("Successfully connected to Neo4j database")
            
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            self.driver = None
    
    @contextmanager
    def get_session(self):
        """Context manager for Neo4j sessions."""
        if not self.driver:
            self._connect()
        
        if not self.driver:
            raise ConnectionError("Unable to connect to Neo4j database")
        
        database = settings.NEO4J_CONFIG.get('DATABASE', 'neo4j')
        session = self.driver.session(database=database)
        try:
            yield session
        finally:
            session.close()
    
    def close(self):
        """Close Neo4j driver connection."""
        if self.driver:
            self.driver.close()
            logger.info("Neo4j connection closed")
    
    # Node Creation Methods
    
    def create_skill_node(self, skill_name: str, category: str, metadata: Dict[str, Any] = None) -> bool:
        """Create or update a skill node in the graph."""
        try:
            with self.get_session() as session:
                query = """
                MERGE (s:Skill {name: $skill_name})
                SET s.category = $category,
                    s.updated_at = datetime(),
                    s += $metadata
                RETURN s
                """
                
                result = session.run(query, {
                    'skill_name': skill_name,
                    'category': category,
                    'metadata': metadata or {}
                })
                
                return result.single() is not None
                
        except Exception as e:
            logger.error(f"Error creating skill node {skill_name}: {e}")
            return False
    
    def create_technology_node(self, tech_name: str, tech_type: str, metadata: Dict[str, Any] = None) -> bool:
        """Create or update a technology node in the graph."""
        try:
            with self.get_session() as session:
                query = """
                MERGE (t:Technology {name: $tech_name})
                SET t.type = $tech_type,
                    t.updated_at = datetime(),
                    t += $metadata
                RETURN t
                """
                
                result = session.run(query, {
                    'tech_name': tech_name,
                    'tech_type': tech_type,
                    'metadata': metadata or {}
                })
                
                return result.single() is not None
                
        except Exception as e:
            logger.error(f"Error creating technology node {tech_name}: {e}")
            return False
    
    def create_developer_node(self, developer_id: str, metadata: Dict[str, Any] = None) -> bool:
        """Create or update a developer node in the graph."""
        try:
            with self.get_session() as session:
                query = """
                MERGE (d:Developer {id: $developer_id})
                SET d.updated_at = datetime(),
                    d += $metadata
                RETURN d
                """
                
                result = session.run(query, {
                    'developer_id': developer_id,
                    'metadata': metadata or {}
                })
                
                return result.single() is not None
                
        except Exception as e:
            logger.error(f"Error creating developer node {developer_id}: {e}")
            return False
    
    def create_project_node(self, project_id: str, metadata: Dict[str, Any] = None) -> bool:
        """Create or update a project node in the graph."""
        try:
            with self.get_session() as session:
                query = """
                MERGE (p:Project {id: $project_id})
                SET p.updated_at = datetime(),
                    p += $metadata
                RETURN p
                """
                
                result = session.run(query, {
                    'project_id': project_id,
                    'metadata': metadata or {}
                })
                
                return result.single() is not None
                
        except Exception as e:
            logger.error(f"Error creating project node {project_id}: {e}")
            return False
    
    # Relationship Creation Methods
    
    def create_skill_relationship(self, skill1: str, skill2: str, relationship_type: str, 
                                strength: float = 1.0, metadata: Dict[str, Any] = None) -> bool:
        """Create relationship between skills."""
        try:
            with self.get_session() as session:
                query = f"""
                MATCH (s1:Skill {{name: $skill1}})
                MATCH (s2:Skill {{name: $skill2}})
                MERGE (s1)-[r:{relationship_type}]->(s2)
                SET r.strength = $strength,
                    r.updated_at = datetime(),
                    r += $metadata
                RETURN r
                """
                
                result = session.run(query, {
                    'skill1': skill1,
                    'skill2': skill2,
                    'strength': strength,
                    'metadata': metadata or {}
                })
                
                return result.single() is not None
                
        except Exception as e:
            logger.error(f"Error creating skill relationship {skill1}-{skill2}: {e}")
            return False
    
    def create_skill_technology_relationship(self, skill: str, technology: str, 
                                          relationship_type: str = "USES", 
                                          strength: float = 1.0) -> bool:
        """Create relationship between skill and technology."""
        try:
            with self.get_session() as session:
                query = f"""
                MATCH (s:Skill {{name: $skill}})
                MATCH (t:Technology {{name: $technology}})
                MERGE (s)-[r:{relationship_type}]->(t)
                SET r.strength = $strength,
                    r.updated_at = datetime()
                RETURN r
                """
                
                result = session.run(query, {
                    'skill': skill,
                    'technology': technology,
                    'strength': strength
                })
                
                return result.single() is not None
                
        except Exception as e:
            logger.error(f"Error creating skill-technology relationship {skill}-{technology}: {e}")
            return False
    
    def create_developer_skill_relationship(self, developer_id: str, skill: str, 
                                          proficiency: float, experience_years: int = 0) -> bool:
        """Create relationship between developer and skill."""
        try:
            with self.get_session() as session:
                query = """
                MATCH (d:Developer {id: $developer_id})
                MATCH (s:Skill {name: $skill})
                MERGE (d)-[r:HAS_SKILL]->(s)
                SET r.proficiency = $proficiency,
                    r.experience_years = $experience_years,
                    r.updated_at = datetime()
                RETURN r
                """
                
                result = session.run(query, {
                    'developer_id': developer_id,
                    'skill': skill,
                    'proficiency': proficiency,
                    'experience_years': experience_years
                })
                
                return result.single() is not None
                
        except Exception as e:
            logger.error(f"Error creating developer-skill relationship {developer_id}-{skill}: {e}")
            return False
    
    def create_project_skill_requirement(self, project_id: str, skill: str, 
                                       importance: float, required_level: float) -> bool:
        """Create relationship between project and required skill."""
        try:
            with self.get_session() as session:
                query = """
                MATCH (p:Project {id: $project_id})
                MATCH (s:Skill {name: $skill})
                MERGE (p)-[r:REQUIRES_SKILL]->(s)
                SET r.importance = $importance,
                    r.required_level = $required_level,
                    r.updated_at = datetime()
                RETURN r
                """
                
                result = session.run(query, {
                    'project_id': project_id,
                    'skill': skill,
                    'importance': importance,
                    'required_level': required_level
                })
                
                return result.single() is not None
                
        except Exception as e:
            logger.error(f"Error creating project-skill requirement {project_id}-{skill}: {e}")
            return False
    
    def create_collaboration_relationship(self, developer1_id: str, developer2_id: str, 
                                        project_id: str, collaboration_score: float) -> bool:
        """Create collaboration relationship between developers."""
        try:
            with self.get_session() as session:
                query = """
                MATCH (d1:Developer {id: $developer1_id})
                MATCH (d2:Developer {id: $developer2_id})
                MERGE (d1)-[r:COLLABORATED_WITH]->(d2)
                SET r.projects = CASE 
                    WHEN r.projects IS NULL THEN [$project_id]
                    WHEN NOT $project_id IN r.projects THEN r.projects + [$project_id]
                    ELSE r.projects
                END,
                r.collaboration_score = $collaboration_score,
                r.updated_at = datetime()
                RETURN r
                """
                
                result = session.run(query, {
                    'developer1_id': developer1_id,
                    'developer2_id': developer2_id,
                    'project_id': project_id,
                    'collaboration_score': collaboration_score
                })
                
                return result.single() is not None
                
        except Exception as e:
            logger.error(f"Error creating collaboration relationship: {e}")
            return False
    
    # Query Methods for Matching and Analysis
    
    def find_related_skills(self, skill: str, max_depth: int = 2, min_strength: float = 0.5) -> List[Dict[str, Any]]:
        """Find skills related to a given skill through graph traversal."""
        try:
            with self.get_session() as session:
                query = """
                MATCH path = (s:Skill {name: $skill})-[r*1..$max_depth]-(related:Skill)
                WHERE ALL(rel in r WHERE rel.strength >= $min_strength)
                WITH related, 
                     reduce(strength = 1.0, rel in r | strength * rel.strength) as path_strength,
                     length(path) as distance
                RETURN DISTINCT related.name as skill_name,
                       related.category as category,
                       path_strength,
                       distance
                ORDER BY path_strength DESC, distance ASC
                LIMIT 20
                """
                
                result = session.run(query, {
                    'skill': skill,
                    'max_depth': max_depth,
                    'min_strength': min_strength
                })
                
                return [dict(record) for record in result]
                
        except Exception as e:
            logger.error(f"Error finding related skills for {skill}: {e}")
            return []
    
    def find_skill_technologies(self, skill: str) -> List[Dict[str, Any]]:
        """Find technologies associated with a skill."""
        try:
            with self.get_session() as session:
                query = """
                MATCH (s:Skill {name: $skill})-[r:USES]->(t:Technology)
                RETURN t.name as technology_name,
                       t.type as technology_type,
                       r.strength as relationship_strength
                ORDER BY r.strength DESC
                """
                
                result = session.run(query, {'skill': skill})
                return [dict(record) for record in result]
                
        except Exception as e:
            logger.error(f"Error finding technologies for skill {skill}: {e}")
            return []
    
    def calculate_developer_skill_match(self, developer_id: str, required_skills: List[str]) -> Dict[str, float]:
        """Calculate how well a developer matches required skills."""
        try:
            with self.get_session() as session:
                query = """
                MATCH (d:Developer {id: $developer_id})
                UNWIND $required_skills as required_skill
                OPTIONAL MATCH (d)-[r:HAS_SKILL]->(s:Skill {name: required_skill})
                RETURN required_skill,
                       COALESCE(r.proficiency, 0.0) as proficiency,
                       COALESCE(r.experience_years, 0) as experience_years
                """
                
                result = session.run(query, {
                    'developer_id': developer_id,
                    'required_skills': required_skills
                })
                
                skill_matches = {}
                for record in result:
                    skill_name = record['required_skill']
                    proficiency = record['proficiency']
                    experience = record['experience_years']
                    
                    # Calculate composite score
                    score = proficiency * (1 + min(experience / 5.0, 1.0))  # Cap experience bonus at 5 years
                    skill_matches[skill_name] = score
                
                return skill_matches
                
        except Exception as e:
            logger.error(f"Error calculating skill match for developer {developer_id}: {e}")
            return {}
    
    def find_complementary_developers(self, developer_id: str, required_skills: List[str], 
                                    limit: int = 10) -> List[Dict[str, Any]]:
        """Find developers with complementary skills for team formation."""
        try:
            with self.get_session() as session:
                query = """
                MATCH (d1:Developer {id: $developer_id})-[r1:HAS_SKILL]->(s1:Skill)
                WITH collect(s1.name) as dev_skills
                
                UNWIND $required_skills as required_skill
                MATCH (s:Skill {name: required_skill})<-[r:HAS_SKILL]-(d2:Developer)
                WHERE NOT d2.id = $developer_id
                  AND NOT required_skill IN dev_skills
                
                WITH d2, 
                     collect(DISTINCT {skill: required_skill, proficiency: r.proficiency}) as matching_skills,
                     avg(r.proficiency) as avg_proficiency
                
                OPTIONAL MATCH (d1:Developer {id: $developer_id})-[collab:COLLABORATED_WITH]-(d2)
                
                RETURN d2.id as developer_id,
                       matching_skills,
                       avg_proficiency,
                       COALESCE(collab.collaboration_score, 0.0) as collaboration_history
                ORDER BY avg_proficiency DESC, collaboration_history DESC
                LIMIT $limit
                """
                
                result = session.run(query, {
                    'developer_id': developer_id,
                    'required_skills': required_skills,
                    'limit': limit
                })
                
                return [dict(record) for record in result]
                
        except Exception as e:
            logger.error(f"Error finding complementary developers: {e}")
            return []
    
    def analyze_skill_market_trends(self, time_window_days: int = 90) -> List[Dict[str, Any]]:
        """Analyze skill demand trends based on project requirements."""
        try:
            with self.get_session() as session:
                query = """
                MATCH (p:Project)-[r:REQUIRES_SKILL]->(s:Skill)
                WHERE p.created_at >= datetime() - duration({days: $time_window_days})
                
                WITH s.name as skill_name,
                     s.category as skill_category,
                     count(r) as demand_count,
                     avg(r.importance) as avg_importance,
                     avg(r.required_level) as avg_required_level
                
                MATCH (d:Developer)-[dr:HAS_SKILL]->(s2:Skill {name: skill_name})
                WITH skill_name, skill_category, demand_count, avg_importance, avg_required_level,
                     count(dr) as supply_count,
                     avg(dr.proficiency) as avg_developer_proficiency
                
                RETURN skill_name,
                       skill_category,
                       demand_count,
                       supply_count,
                       CASE WHEN supply_count > 0 THEN toFloat(demand_count) / supply_count ELSE demand_count END as demand_supply_ratio,
                       avg_importance,
                       avg_required_level,
                       avg_developer_proficiency
                ORDER BY demand_supply_ratio DESC, demand_count DESC
                """
                
                result = session.run(query, {'time_window_days': time_window_days})
                return [dict(record) for record in result]
                
        except Exception as e:
            logger.error(f"Error analyzing skill market trends: {e}")
            return []
    
    # Batch Operations
    
    def bulk_create_skill_relationships(self, relationships: List[Dict[str, Any]]) -> int:
        """Bulk create skill relationships for performance."""
        try:
            with self.get_session() as session:
                query = """
                UNWIND $relationships as rel
                MATCH (s1:Skill {name: rel.skill1})
                MATCH (s2:Skill {name: rel.skill2})
                MERGE (s1)-[r:RELATED_TO]->(s2)
                SET r.strength = rel.strength,
                    r.relationship_type = rel.type,
                    r.updated_at = datetime()
                """
                
                result = session.run(query, {'relationships': relationships})
                return result.consume().counters.relationships_created
                
        except Exception as e:
            logger.error(f"Error in bulk skill relationship creation: {e}")
            return 0
    
    def initialize_skill_graph(self, skills_data: List[Dict[str, Any]]) -> bool:
        """Initialize the skill graph with predefined skill relationships."""
        try:
            # Create skill nodes
            for skill_data in skills_data:
                self.create_skill_node(
                    skill_data['name'],
                    skill_data['category'],
                    skill_data.get('metadata', {})
                )
            
            # Create relationships
            relationships = []
            for skill_data in skills_data:
                skill_name = skill_data['name']
                for related_skill, strength in skill_data.get('related_skills', {}).items():
                    relationships.append({
                        'skill1': skill_name,
                        'skill2': related_skill,
                        'strength': strength,
                        'type': 'COMPLEMENTARY'
                    })
            
            if relationships:
                self.bulk_create_skill_relationships(relationships)
            
            logger.info(f"Initialized skill graph with {len(skills_data)} skills")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing skill graph: {e}")
            return False


# Singleton instance
neo4j_service = Neo4jService()