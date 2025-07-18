from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

# Import vector models to ensure they're included in migrations
from .vector_models import (
    VectorEmbedding, DeveloperProfileEmbedding, ProjectRequirementEmbedding,
    SkillEmbedding, SimilaritySearchResult
)


class EmbeddingModel(models.Model):
    """Base model for storing embeddings"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    embedding = ArrayField(
        models.FloatField(),
        size=384,  # Default for all-MiniLM-L6-v2
        help_text="Vector embedding representation"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class DeveloperEmbedding(EmbeddingModel):
    """Store developer skill and profile embeddings"""
    developer = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,
        related_name='embedding_profile'
    )
    skills_text = models.TextField(help_text="Concatenated skills and experience text")
    github_summary = models.TextField(blank=True, help_text="GitHub profile analysis summary")
    resume_summary = models.TextField(blank=True, help_text="Resume analysis summary")
    
    # Metadata for embedding generation
    last_github_update = models.DateTimeField(null=True, blank=True)
    embedding_version = models.CharField(max_length=50, default='v1.0')
    
    class Meta:
        db_table = 'ai_developer_embeddings'
        indexes = [
            models.Index(fields=['developer']),
            models.Index(fields=['last_github_update']),
        ]


class ProjectEmbedding(EmbeddingModel):
    """Store project requirement embeddings"""
    project = models.OneToOneField(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='embedding_profile'
    )
    requirements_text = models.TextField(help_text="Processed project requirements text")
    technical_keywords = ArrayField(
        models.CharField(max_length=100),
        default=list,
        help_text="Extracted technical keywords"
    )
    complexity_level = models.CharField(
        max_length=20,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('very_high', 'Very High')
        ],
        default='medium'
    )
    
    class Meta:
        db_table = 'ai_project_embeddings'
        indexes = [
            models.Index(fields=['project']),
            models.Index(fields=['complexity_level']),
        ]


class TaskEmbedding(EmbeddingModel):
    """Store individual task embeddings for fine-grained matching"""
    task = models.OneToOneField(
        'projects.Task',
        on_delete=models.CASCADE,
        related_name='embedding_profile'
    )
    task_description_text = models.TextField(help_text="Processed task description")
    required_skills = ArrayField(
        models.CharField(max_length=100),
        default=list,
        help_text="Required skills for this task"
    )
    
    class Meta:
        db_table = 'ai_task_embeddings'
        indexes = [
            models.Index(fields=['task']),
        ]


class SkillNode(models.Model):
    """Represent skills as nodes in a graph-like structure within PostgreSQL"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(
        max_length=50,
        choices=[
            ('programming_language', 'Programming Language'),
            ('framework', 'Framework'),
            ('database', 'Database'),
            ('tool', 'Tool'),
            ('methodology', 'Methodology'),
            ('domain', 'Domain Knowledge'),
        ]
    )
    description = models.TextField(blank=True)
    popularity_score = models.FloatField(default=0.0, help_text="Market demand score")
    
    # Graph-like relationships
    related_skills = models.ManyToManyField(
        'self',
        through='SkillRelationship',
        symmetrical=False,
        related_name='reverse_related_skills'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_skill_nodes'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category']),
            models.Index(fields=['popularity_score']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.category})"


class SkillRelationship(models.Model):
    """Define relationships between skills (graph edges)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    from_skill = models.ForeignKey(
        SkillNode,
        on_delete=models.CASCADE,
        related_name='outgoing_relationships'
    )
    to_skill = models.ForeignKey(
        SkillNode,
        on_delete=models.CASCADE,
        related_name='incoming_relationships'
    )
    relationship_type = models.CharField(
        max_length=50,
        choices=[
            ('prerequisite', 'Prerequisite'),
            ('complementary', 'Complementary'),
            ('alternative', 'Alternative'),
            ('builds_on', 'Builds On'),
            ('used_with', 'Used With'),
        ]
    )
    strength = models.FloatField(
        default=1.0,
        help_text="Relationship strength (0.0 to 1.0)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_skill_relationships'
        unique_together = ['from_skill', 'to_skill', 'relationship_type']
        indexes = [
            models.Index(fields=['from_skill', 'relationship_type']),
            models.Index(fields=['to_skill', 'relationship_type']),
            models.Index(fields=['strength']),
        ]


class DeveloperSkillProficiency(models.Model):
    """Track developer proficiency in specific skills"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    developer = models.ForeignKey(User, on_delete=models.CASCADE)
    skill = models.ForeignKey(SkillNode, on_delete=models.CASCADE)
    proficiency_level = models.CharField(
        max_length=20,
        choices=[
            ('beginner', 'Beginner'),
            ('intermediate', 'Intermediate'),
            ('advanced', 'Advanced'),
            ('expert', 'Expert'),
        ]
    )
    years_experience = models.FloatField(default=0.0)
    confidence_score = models.FloatField(
        default=0.5,
        help_text="AI confidence in this assessment (0.0 to 1.0)"
    )
    
    # Evidence sources
    github_evidence = models.JSONField(default=dict, help_text="GitHub-based evidence")
    resume_evidence = models.JSONField(default=dict, help_text="Resume-based evidence")
    project_evidence = models.JSONField(default=dict, help_text="Project-based evidence")
    
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_developer_skill_proficiency'
        unique_together = ['developer', 'skill']
        indexes = [
            models.Index(fields=['developer', 'proficiency_level']),
            models.Index(fields=['skill', 'proficiency_level']),
            models.Index(fields=['confidence_score']),
        ]


class ProjectSkillRequirement(models.Model):
    """Track skill requirements for projects"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE)
    skill = models.ForeignKey(SkillNode, on_delete=models.CASCADE)
    required_level = models.CharField(
        max_length=20,
        choices=[
            ('beginner', 'Beginner'),
            ('intermediate', 'Intermediate'),
            ('advanced', 'Advanced'),
            ('expert', 'Expert'),
        ]
    )
    importance = models.CharField(
        max_length=20,
        choices=[
            ('nice_to_have', 'Nice to Have'),
            ('preferred', 'Preferred'),
            ('required', 'Required'),
            ('critical', 'Critical'),
        ],
        default='required'
    )
    weight = models.FloatField(default=1.0, help_text="Importance weight for matching")
    
    class Meta:
        db_table = 'ai_project_skill_requirements'
        unique_together = ['project', 'skill']
        indexes = [
            models.Index(fields=['project', 'importance']),
            models.Index(fields=['skill', 'required_level']),
        ]


class MatchingResult(models.Model):
    """Store matching results for analysis and improvement"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE)
    developer = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Matching scores
    vector_similarity_score = models.FloatField(help_text="Cosine similarity score")
    graph_relationship_score = models.FloatField(help_text="Graph-based relationship score")
    availability_score = models.FloatField(help_text="Developer availability score")
    reputation_score = models.FloatField(help_text="Developer reputation score")
    final_match_score = models.FloatField(help_text="Weighted final score")
    
    # Matching details
    matching_algorithm_version = models.CharField(max_length=50, default='v1.0')
    matching_metadata = models.JSONField(
        default=dict,
        help_text="Additional matching details and explanations"
    )
    
    # Outcome tracking
    was_selected = models.BooleanField(default=False)
    selection_feedback = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_matching_results'
        unique_together = ['project', 'developer']
        indexes = [
            models.Index(fields=['project', 'final_match_score']),
            models.Index(fields=['developer', 'final_match_score']),
            models.Index(fields=['was_selected']),
            models.Index(fields=['created_at']),
        ]


class EmbeddingCache(models.Model):
    """Cache for expensive embedding computations"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cache_key = models.CharField(max_length=255, unique=True)
    embedding = ArrayField(
        models.FloatField(),
        size=384,
        help_text="Cached embedding vector"
    )
    metadata = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(help_text="Cache expiration time")
    
    class Meta:
        db_table = 'ai_embedding_cache'
        indexes = [
            models.Index(fields=['cache_key']),
            models.Index(fields=['expires_at']),
        ]


class ResumeDocument(models.Model):
    """Store uploaded resume documents and parsing results"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resume_documents')
    
    # File information
    original_filename = models.CharField(max_length=255)
    file_path = models.FileField(upload_to='resumes/%Y/%m/', max_length=500)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    file_type = models.CharField(max_length=10, choices=[
        ('pdf', 'PDF'),
        ('docx', 'DOCX'),
        ('doc', 'DOC'),
        ('txt', 'TXT'),
    ])
    
    # Parsing status
    parsing_status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ], default='pending')
    parsing_error = models.TextField(blank=True, help_text="Error message if parsing failed")
    
    # Parsed content
    raw_text = models.TextField(blank=True, help_text="Extracted raw text content")
    parsed_data = models.JSONField(default=dict, help_text="Structured parsed data from AI")
    
    # Analysis results
    extracted_skills = models.JSONField(default=list, help_text="List of extracted skills")
    skill_confidence_scores = models.JSONField(default=dict, help_text="Confidence scores for skills")
    experience_analysis = models.JSONField(default=dict, help_text="Work experience analysis")
    education_analysis = models.JSONField(default=dict, help_text="Education analysis")
    
    # Metadata
    is_active = models.BooleanField(default=True, help_text="Whether this is the active resume")
    processing_time_seconds = models.FloatField(null=True, help_text="Time taken to process")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    parsed_at = models.DateTimeField(null=True, help_text="When parsing was completed")
    
    class Meta:
        db_table = 'ai_resume_documents'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['parsing_status']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Resume: {self.original_filename} ({self.user.username})"


class ResumeSkillExtraction(models.Model):
    """Track individual skill extractions from resumes with confidence scores"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.ForeignKey(ResumeDocument, on_delete=models.CASCADE, related_name='skill_extractions')
    skill = models.ForeignKey(SkillNode, on_delete=models.CASCADE)
    
    # Extraction details
    confidence_score = models.FloatField(help_text="AI confidence in skill extraction (0.0 to 1.0)")
    extraction_method = models.CharField(max_length=50, choices=[
        ('direct_mention', 'Direct Mention'),
        ('context_inference', 'Context Inference'),
        ('experience_analysis', 'Experience Analysis'),
        ('project_analysis', 'Project Analysis'),
    ])
    
    # Evidence
    text_evidence = models.JSONField(default=list, help_text="Text snippets supporting this skill")
    context_sections = models.JSONField(default=list, help_text="Resume sections where skill was found")
    
    # Validation
    is_validated = models.BooleanField(default=False)
    validation_source = models.CharField(max_length=50, blank=True, choices=[
        ('github', 'GitHub Analysis'),
        ('manual', 'Manual Validation'),
        ('project_history', 'Project History'),
    ])
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_resume_skill_extractions'
        unique_together = ['resume', 'skill']
        indexes = [
            models.Index(fields=['resume', 'confidence_score']),
            models.Index(fields=['skill', 'confidence_score']),
            models.Index(fields=['is_validated']),
        ]


class ProfileAnalysisCombined(models.Model):
    """Store combined analysis results from resume + GitHub + other sources"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='combined_profile_analysis')
    
    # Source data references
    resume_document = models.ForeignKey(ResumeDocument, null=True, on_delete=models.SET_NULL)
    github_analysis_data = models.JSONField(default=dict, help_text="GitHub analysis results")
    
    # Combined analysis results
    final_skills = models.JSONField(default=dict, help_text="Final skill list with confidence scores")
    experience_level = models.CharField(max_length=20, choices=[
        ('junior', 'Junior'),
        ('mid', 'Mid-level'),
        ('senior', 'Senior'),
        ('lead', 'Lead'),
    ])
    total_experience_years = models.FloatField(default=0.0)
    
    # Confidence metrics
    overall_confidence_score = models.FloatField(help_text="Overall profile confidence (0.0 to 1.0)")
    resume_confidence = models.FloatField(default=0.0)
    github_confidence = models.FloatField(default=0.0)
    consistency_score = models.FloatField(default=0.0, help_text="Consistency between sources")
    
    # Analysis metadata
    analysis_version = models.CharField(max_length=20, default='1.0')
    sources_used = models.JSONField(default=list, help_text="List of data sources used")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_profile_analysis_combined'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['overall_confidence_score']),
            models.Index(fields=['experience_level']),
            models.Index(fields=['updated_at']),
        ]
    
    def __str__(self):
        return f"Combined Profile: {self.user.username} ({self.experience_level})"
