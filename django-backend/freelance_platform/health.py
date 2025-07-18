"""
Health check views for the Django application.
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    Simple health check endpoint to verify the Django application is running.
    """
    return JsonResponse({
        "status": "healthy",
        "message": "AI-Powered Freelancing Platform Backend is running",
        "version": "1.0.0"
    })


@csrf_exempt
@require_http_methods(["GET"])
def api_status(request):
    """
    API status endpoint to verify all services are configured.
    """
    from django.conf import settings
    
    status = {
        "database": "configured" if settings.DATABASES.get('default') else "not_configured",
        "redis": "configured" if hasattr(settings, 'REDIS_URL') else "not_configured",
        "gemini_api": "configured" if settings.GEMINI_API_KEY else "not_configured",
        "github_oauth": "configured" if settings.GITHUB_CLIENT_ID else "not_configured",
        "apps": {
            "authentication": "installed",
            "users": "installed", 
            "projects": "installed",
            "matching": "installed",
            "payments": "installed",
            "communications": "installed",
            "learning": "installed",
            "community": "installed",
            "marketplace": "installed",
            "ai_services": "installed"
        }
    }
    
    return JsonResponse(status)