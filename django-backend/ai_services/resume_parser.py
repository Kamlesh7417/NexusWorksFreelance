"""
Resume parsing and skill extraction service using AI.
"""

import logging
import re
import json
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from pathlib import Path
import tempfile
import os

import PyPDF2
import docx
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile

from .gemini_client import GeminiClient
from .skill_validator import SkillValidator

logger = logging.getLogger(__name__)


class ResumeParsingError(Exception):
    """Custom exception for resume parsing errors"""
    pass


class ResumeParser:
    """
    AI-powered resume parser that extracts skills, experience, and education
    from uploaded resume documents.
    """
    
    SUPPORTED_FORMATS = ['.pdf', '.docx', '.doc', '.txt']
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    def __init__(self):
        self.gemini_client = GeminiClient()
        try:
            self.skill_validator = SkillValidator()
        except Exception as e:
            logger.warning(f"SkillValidator initialization failed: {str(e)}. Skill validation will be limited.")
            self.skill_validator = None
        
    def parse_resume(self, uploaded_file: UploadedFile, user_id: str = None) -> Dict:
        """
        Parse an uploaded resume file and extract structured information.
        
        Args:
            uploaded_file: Django UploadedFile object
            user_id: Optional user ID for logging
            
        Returns:
            Dict containing parsed resume data
            
        Raises:
            ResumeParsingError: If parsing fails
        """
        try:
            # Validate file
            self._validate_file(uploaded_file)
            
            # Extract text from file
            text_content = self._extract_text(uploaded_file)
            
            if not text_content or len(text_content.strip()) < 100:
                raise ResumeParsingError("Resume content is too short or empty")
            
            logger.info(f"Extracted {len(text_content)} characters from resume for user {user_id}")
            
            # Parse with AI
            parsed_data = self._parse_with_ai(text_content)
            
            # Validate and enhance skills
            if parsed_data.get('skills') and self.skill_validator:
                try:
                    skill_validation = self.skill_validator.validate_skills(
                        parsed_data['skills'],
                        context={'source': 'resume', 'text_length': len(text_content)}
                    )
                    parsed_data['skill_validation'] = skill_validation
                    parsed_data['validated_skills'] = [
                        skill for skill in skill_validation['validated_skills']
                        if skill['confidence_score'] >= 0.3
                    ]
                except Exception as e:
                    logger.warning(f"Skill validation failed: {str(e)}. Using basic skill list.")
                    parsed_data['skill_validation'] = {'confidence_scores': {}}
                    parsed_data['validated_skills'] = [
                        {'skill': skill, 'confidence_score': 0.5} 
                        for skill in parsed_data['skills']
                    ]
            elif parsed_data.get('skills'):
                # No skill validator available, use basic validation
                parsed_data['skill_validation'] = {'confidence_scores': {}}
                parsed_data['validated_skills'] = [
                    {'skill': skill, 'confidence_score': 0.5} 
                    for skill in parsed_data['skills']
                ]
            
            # Add metadata
            parsed_data['metadata'] = {
                'file_name': uploaded_file.name,
                'file_size': uploaded_file.size,
                'content_length': len(text_content),
                'parsed_at': datetime.now().isoformat(),
                'parser_version': '1.0'
            }
            
            logger.info(f"Successfully parsed resume for user {user_id}")
            return parsed_data
            
        except Exception as e:
            logger.error(f"Error parsing resume for user {user_id}: {str(e)}")
            raise ResumeParsingError(f"Failed to parse resume: {str(e)}")
    
    def _validate_file(self, uploaded_file: UploadedFile) -> None:
        """Validate uploaded file format and size."""
        if not uploaded_file:
            raise ResumeParsingError("No file provided")
        
        if uploaded_file.size > self.MAX_FILE_SIZE:
            raise ResumeParsingError(f"File size exceeds {self.MAX_FILE_SIZE / (1024*1024):.1f}MB limit")
        
        file_extension = Path(uploaded_file.name).suffix.lower()
        if file_extension not in self.SUPPORTED_FORMATS:
            raise ResumeParsingError(
                f"Unsupported file format: {file_extension}. "
                f"Supported formats: {', '.join(self.SUPPORTED_FORMATS)}"
            )
    
    def _extract_text(self, uploaded_file: UploadedFile) -> str:
        """Extract text content from uploaded file."""
        file_extension = Path(uploaded_file.name).suffix.lower()
        
        try:
            if file_extension == '.pdf':
                return self._extract_pdf_text(uploaded_file)
            elif file_extension in ['.docx', '.doc']:
                return self._extract_docx_text(uploaded_file)
            elif file_extension == '.txt':
                return self._extract_txt_text(uploaded_file)
            else:
                raise ResumeParsingError(f"Unsupported file format: {file_extension}")
                
        except Exception as e:
            logger.error(f"Error extracting text from {file_extension} file: {str(e)}")
            raise ResumeParsingError(f"Failed to extract text from file: {str(e)}")
    
    def _extract_pdf_text(self, uploaded_file: UploadedFile) -> str:
        """Extract text from PDF file."""
        text_content = []
        
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                for chunk in uploaded_file.chunks():
                    temp_file.write(chunk)
                temp_file_path = temp_file.name
            
            # Extract text using PyPDF2
            with open(temp_file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text_content.append(page.extract_text())
            
            # Clean up temporary file
            os.unlink(temp_file_path)
            
            return '\n'.join(text_content)
            
        except Exception as e:
            logger.error(f"Error extracting PDF text: {str(e)}")
            raise ResumeParsingError(f"Failed to extract text from PDF: {str(e)}")
    
    def _extract_docx_text(self, uploaded_file: UploadedFile) -> str:
        """Extract text from DOCX file."""
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_file:
                for chunk in uploaded_file.chunks():
                    temp_file.write(chunk)
                temp_file_path = temp_file.name
            
            # Extract text using python-docx
            doc = docx.Document(temp_file_path)
            text_content = []
            
            for paragraph in doc.paragraphs:
                text_content.append(paragraph.text)
            
            # Clean up temporary file
            os.unlink(temp_file_path)
            
            return '\n'.join(text_content)
            
        except Exception as e:
            logger.error(f"Error extracting DOCX text: {str(e)}")
            raise ResumeParsingError(f"Failed to extract text from DOCX: {str(e)}")
    
    def _extract_txt_text(self, uploaded_file: UploadedFile) -> str:
        """Extract text from TXT file."""
        try:
            content = uploaded_file.read()
            
            # Try different encodings
            for encoding in ['utf-8', 'latin-1', 'cp1252']:
                try:
                    return content.decode(encoding)
                except UnicodeDecodeError:
                    continue
            
            raise ResumeParsingError("Unable to decode text file with supported encodings")
            
        except Exception as e:
            logger.error(f"Error extracting TXT text: {str(e)}")
            raise ResumeParsingError(f"Failed to extract text from TXT: {str(e)}")
    
    def _parse_with_ai(self, text_content: str) -> Dict:
        """Parse resume text using AI to extract structured information."""
        
        prompt = f"""
        Analyze the following resume text and extract structured information in JSON format.
        
        Please extract:
        1. Personal information (name, email, phone, location)
        2. Professional summary/objective
        3. Technical skills (programming languages, frameworks, tools, databases)
        4. Work experience (company, position, duration, responsibilities, achievements)
        5. Education (degree, institution, graduation year, GPA if mentioned)
        6. Projects (name, description, technologies used)
        7. Certifications
        8. Years of experience (estimate total professional experience)
        9. Experience level (junior, mid, senior, lead based on experience and responsibilities)
        
        Return the response as a valid JSON object with the following structure:
        {{
            "personal_info": {{
                "name": "string",
                "email": "string",
                "phone": "string",
                "location": "string"
            }},
            "summary": "string",
            "skills": ["skill1", "skill2", ...],
            "experience": [
                {{
                    "company": "string",
                    "position": "string",
                    "start_date": "string",
                    "end_date": "string",
                    "duration_months": number,
                    "responsibilities": ["string", ...],
                    "achievements": ["string", ...],
                    "technologies": ["string", ...]
                }}
            ],
            "education": [
                {{
                    "degree": "string",
                    "institution": "string",
                    "graduation_year": "string",
                    "gpa": "string",
                    "field_of_study": "string"
                }}
            ],
            "projects": [
                {{
                    "name": "string",
                    "description": "string",
                    "technologies": ["string", ...],
                    "url": "string"
                }}
            ],
            "certifications": [
                {{
                    "name": "string",
                    "issuer": "string",
                    "date": "string"
                }}
            ],
            "total_experience_years": number,
            "experience_level": "junior|mid|senior|lead"
        }}
        
        Resume text:
        {text_content}
        """
        
        try:
            response = self.gemini_client.generate_content(prompt)
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if not json_match:
                raise ResumeParsingError("AI response does not contain valid JSON")
            
            json_str = json_match.group()
            parsed_data = json.loads(json_str)
            
            # Validate required fields
            self._validate_parsed_data(parsed_data)
            
            return parsed_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing AI response JSON: {str(e)}")
            raise ResumeParsingError(f"Failed to parse AI response: {str(e)}")
        except Exception as e:
            logger.error(f"Error in AI parsing: {str(e)}")
            raise ResumeParsingError(f"AI parsing failed: {str(e)}")
    
    def _validate_parsed_data(self, data: Dict) -> None:
        """Validate that parsed data contains required fields."""
        required_fields = ['skills', 'experience', 'education']
        
        for field in required_fields:
            if field not in data:
                data[field] = []
        
        # Ensure skills is a list
        if not isinstance(data.get('skills'), list):
            data['skills'] = []
        
        # Ensure experience level is valid
        valid_levels = ['junior', 'mid', 'senior', 'lead']
        if data.get('experience_level') not in valid_levels:
            # Estimate based on years of experience
            years = data.get('total_experience_years', 0)
            if years < 2:
                data['experience_level'] = 'junior'
            elif years < 5:
                data['experience_level'] = 'mid'
            elif years < 8:
                data['experience_level'] = 'senior'
            else:
                data['experience_level'] = 'lead'
        
        # Ensure total_experience_years is a number
        if not isinstance(data.get('total_experience_years'), (int, float)):
            data['total_experience_years'] = 0
    
    def combine_with_github_analysis(self, resume_data: Dict, github_analysis: Dict) -> Dict:
        """
        Combine resume data with GitHub analysis to create comprehensive profile.
        
        Args:
            resume_data: Parsed resume data
            github_analysis: GitHub repository analysis data
            
        Returns:
            Combined profile data with confidence scores
        """
        try:
            combined_data = {
                'resume_data': resume_data,
                'github_data': github_analysis,
                'combined_analysis': {}
            }
            
            # Combine skills with confidence scoring
            resume_skills = set(resume_data.get('skills', []))
            github_skills = set(github_analysis.get('skills', []))
            
            all_skills = resume_skills.union(github_skills)
            skill_confidence = {}
            
            for skill in all_skills:
                confidence = 0.0
                sources = []
                
                if skill in resume_skills:
                    confidence += 0.6  # Resume mention
                    sources.append('resume')
                
                if skill in github_skills:
                    confidence += 0.4  # GitHub usage
                    sources.append('github')
                
                skill_confidence[skill] = {
                    'confidence_score': min(confidence, 1.0),
                    'sources': sources
                }
            
            combined_data['combined_analysis']['skills'] = skill_confidence
            
            # Combine experience levels
            resume_level = resume_data.get('experience_level', 'mid')
            github_level = github_analysis.get('experience_level', 'mid')
            
            # Use the higher of the two levels
            level_hierarchy = {'junior': 1, 'mid': 2, 'senior': 3, 'lead': 4}
            resume_rank = level_hierarchy.get(resume_level, 2)
            github_rank = level_hierarchy.get(github_level, 2)
            
            final_level = max(resume_rank, github_rank)
            final_level_name = [k for k, v in level_hierarchy.items() if v == final_level][0]
            
            combined_data['combined_analysis']['experience_level'] = {
                'final_level': final_level_name,
                'resume_level': resume_level,
                'github_level': github_level,
                'confidence_score': 0.8 if resume_level == github_level else 0.6
            }
            
            # Combine years of experience
            resume_years = resume_data.get('total_experience_years', 0)
            github_years = github_analysis.get('years_active', 0)
            
            combined_data['combined_analysis']['experience_years'] = {
                'estimated_years': max(resume_years, github_years),
                'resume_years': resume_years,
                'github_years': github_years
            }
            
            # Generate overall confidence score
            combined_data['combined_analysis']['overall_confidence'] = self._calculate_overall_confidence(
                resume_data, github_analysis
            )
            
            return combined_data
            
        except Exception as e:
            logger.error(f"Error combining resume and GitHub analysis: {str(e)}")
            raise ResumeParsingError(f"Failed to combine analyses: {str(e)}")
    
    def _calculate_overall_confidence(self, resume_data: Dict, github_analysis: Dict) -> float:
        """Calculate overall confidence score for the combined profile."""
        confidence_factors = []
        
        # Resume completeness
        resume_completeness = 0.0
        if resume_data.get('personal_info', {}).get('name'):
            resume_completeness += 0.2
        if resume_data.get('skills'):
            resume_completeness += 0.3
        if resume_data.get('experience'):
            resume_completeness += 0.3
        if resume_data.get('education'):
            resume_completeness += 0.2
        
        confidence_factors.append(('resume_completeness', resume_completeness, 0.4))
        
        # GitHub activity
        github_activity = 0.0
        if github_analysis.get('total_repositories', 0) > 0:
            github_activity += 0.3
        if github_analysis.get('total_commits', 0) > 10:
            github_activity += 0.3
        if github_analysis.get('languages'):
            github_activity += 0.4
        
        confidence_factors.append(('github_activity', github_activity, 0.3))
        
        # Skill overlap
        resume_skills = set(resume_data.get('skills', []))
        github_skills = set(github_analysis.get('skills', []))
        
        if resume_skills and github_skills:
            overlap = len(resume_skills.intersection(github_skills))
            total_unique = len(resume_skills.union(github_skills))
            skill_consistency = overlap / total_unique if total_unique > 0 else 0
        else:
            skill_consistency = 0.5  # Neutral if one source is missing
        
        confidence_factors.append(('skill_consistency', skill_consistency, 0.3))
        
        # Calculate weighted average
        total_weight = sum(weight for _, _, weight in confidence_factors)
        weighted_sum = sum(score * weight for _, score, weight in confidence_factors)
        
        return weighted_sum / total_weight if total_weight > 0 else 0.5
    
    def extract_skill_confidence_scores(self, resume_data: Dict, github_analysis: Dict = None) -> Dict[str, float]:
        """
        Extract skill confidence scores based on resume and optional GitHub data.
        
        Args:
            resume_data: Parsed resume data
            github_analysis: Optional GitHub analysis data
            
        Returns:
            Dictionary mapping skills to confidence scores
        """
        skill_scores = {}
        
        # Process resume skills
        resume_skills = resume_data.get('skills', [])
        for skill in resume_skills:
            # Base confidence from resume mention
            confidence = 0.5
            
            # Boost confidence if mentioned in experience
            for exp in resume_data.get('experience', []):
                if skill.lower() in ' '.join(exp.get('technologies', [])).lower():
                    confidence += 0.2
                if skill.lower() in ' '.join(exp.get('responsibilities', [])).lower():
                    confidence += 0.1
            
            # Boost confidence if mentioned in projects
            for project in resume_data.get('projects', []):
                if skill.lower() in ' '.join(project.get('technologies', [])).lower():
                    confidence += 0.2
            
            skill_scores[skill] = min(confidence, 1.0)
        
        # Enhance with GitHub data if available
        if github_analysis:
            github_skills = github_analysis.get('skills', [])
            
            for skill in github_skills:
                if skill in skill_scores:
                    # Skill mentioned in both sources - high confidence
                    skill_scores[skill] = min(skill_scores[skill] + 0.3, 1.0)
                else:
                    # Skill only in GitHub - moderate confidence
                    skill_scores[skill] = 0.6
        
        return skill_scores