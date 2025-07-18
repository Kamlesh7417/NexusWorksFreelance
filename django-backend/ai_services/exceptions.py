"""
Custom exceptions for AI services
"""


class AIServiceException(Exception):
    """Base exception for AI service errors"""
    pass


class GeminiAPIException(AIServiceException):
    """Exception for Gemini API specific errors"""
    pass


class ProjectAnalysisException(AIServiceException):
    """Exception for project analysis errors"""
    pass


class ServiceUnavailableException(AIServiceException):
    """Exception when AI service is temporarily unavailable"""
    pass


class InvalidAnalysisResultException(AIServiceException):
    """Exception when AI analysis result is invalid or incomplete"""
    pass


class GitHubAPIError(AIServiceException):
    """Exception for GitHub API errors"""
    
    def __init__(self, message: str, status_code: int = None):
        super().__init__(message)
        self.status_code = status_code


class RateLimitExceededError(GitHubAPIError):
    """Exception when GitHub API rate limit is exceeded"""
    
    def __init__(self, message: str, reset_time: int = None):
        super().__init__(message, status_code=403)
        self.reset_time = reset_time


class RepositoryAnalysisError(AIServiceException):
    """Exception for repository analysis errors"""
    pass