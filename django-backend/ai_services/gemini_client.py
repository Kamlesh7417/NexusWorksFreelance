"""
Google Gemini API client for AI-powered project analysis
"""
import google.generativeai as genai
from django.conf import settings
import logging
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import time

from .exceptions import GeminiAPIException, ServiceUnavailableException

logger = logging.getLogger(__name__)


@dataclass
class ProjectAnalysisResult:
    """Data class for project analysis results"""
    task_breakdown: List[Dict[str, Any]]
    budget_estimate: float
    timeline_estimate_days: int
    required_skills: List[str]
    experience_level: str
    needs_senior_developer: bool
    complexity_score: float
    risk_factors: List[str]
    recommendations: List[str]


class GeminiClient:
    """Google Gemini API client with error handling and retry logic"""
    
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in settings")
        
        # Configure the Gemini API
        genai.configure(api_key=self.api_key)
        
        # Initialize the model
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Configuration for generation
        self.generation_config = {
            'temperature': 0.7,
            'top_p': 0.8,
            'top_k': 40,
            'max_output_tokens': 4096,
        }
        
        # Safety settings
        self.safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
    
    def generate_content(self, prompt: str, max_retries: int = 3) -> str:
        """
        Generate content using Gemini API with retry logic
        
        Args:
            prompt: The input prompt for generation
            max_retries: Maximum number of retry attempts
            
        Returns:
            Generated content as string
            
        Raises:
            GeminiAPIException: If all retry attempts fail
            ServiceUnavailableException: If service is temporarily unavailable
        """
        for attempt in range(max_retries):
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config=self.generation_config,
                    safety_settings=self.safety_settings
                )
                
                if response.text:
                    return response.text.strip()
                else:
                    logger.warning(f"Empty response from Gemini API on attempt {attempt + 1}")
                    if attempt == max_retries - 1:
                        raise GeminiAPIException("Received empty response from Gemini API")
                        
            except Exception as e:
                logger.error(f"Gemini API error on attempt {attempt + 1}: {str(e)}")
                if attempt == max_retries - 1:
                    if "quota" in str(e).lower() or "rate limit" in str(e).lower():
                        raise ServiceUnavailableException(f"Gemini API quota/rate limit exceeded: {str(e)}")
                    else:
                        raise GeminiAPIException(f"Failed to generate content after {max_retries} attempts: {str(e)}")
                
                # Exponential backoff
                time.sleep(2 ** attempt)
        
        raise GeminiAPIException("Unexpected error in content generation")
    
    def parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse JSON response from Gemini API with error handling
        
        Args:
            response_text: Raw response text from API
            
        Returns:
            Parsed JSON as dictionary
            
        Raises:
            ValueError: If JSON parsing fails
        """
        try:
            # Clean the response text - remove markdown code blocks if present
            cleaned_text = response_text.strip()
            if cleaned_text.startswith('```json'):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith('```'):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()
            
            return json.loads(cleaned_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {str(e)}")
            logger.error(f"Raw response: {response_text}")
            raise ValueError(f"Invalid JSON response from Gemini API: {str(e)}")
    
    def test_connection(self) -> bool:
        """
        Test the connection to Gemini API
        
        Returns:
            True if connection is successful, False otherwise
        """
        try:
            test_prompt = "Hello, please respond with 'Connection successful'"
            response = self.generate_content(test_prompt, max_retries=1)
            return "successful" in response.lower()
        except Exception as e:
            logger.error(f"Gemini API connection test failed: {str(e)}")
            return False