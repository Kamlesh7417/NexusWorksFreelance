"""
URL configuration for freelance_platform project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .health import health_check, api_status

urlpatterns = [
    path('admin/', admin.site.urls),
    # Health check and monitoring endpoints
    path('', include('monitoring.urls')),
    path('api/status/', api_status, name='api_status'),
    # API endpoints
    path('api/auth/', include('authentication.urls')),
    path('api/users/', include('users.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/matching/', include('matching.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/communications/', include('communications.urls')),
    path('api/learning/', include('learning.urls')),
    path('api/community/', include('community.urls')),
    path('api/marketplace/', include('marketplace.urls')),
    path('api/ai-services/', include('ai_services.urls')),
    # DRF auth token endpoint
    path('api-auth/', include('rest_framework.urls')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
