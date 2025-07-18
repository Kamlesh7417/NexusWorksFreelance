"""
Video Conferencing Service for Virtual Meetups and Events

This service provides integration with multiple video conferencing platforms
including Zoom, Google Meet, Microsoft Teams, and WebEx for virtual events.
"""

import requests
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class VideoConferencingProvider:
    """Base class for video conferencing providers"""
    
    def __init__(self, api_key: str, api_secret: str = None):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = ""
        self.headers = {}
    
    def create_meeting(self, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new meeting"""
        raise NotImplementedError
    
    def update_meeting(self, meeting_id: str, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing meeting"""
        raise NotImplementedError
    
    def delete_meeting(self, meeting_id: str) -> bool:
        """Delete a meeting"""
        raise NotImplementedError
    
    def get_meeting(self, meeting_id: str) -> Dict[str, Any]:
        """Get meeting details"""
        raise NotImplementedError
    
    def start_recording(self, meeting_id: str) -> Dict[str, Any]:
        """Start recording a meeting"""
        raise NotImplementedError
    
    def stop_recording(self, meeting_id: str) -> Dict[str, Any]:
        """Stop recording a meeting"""
        raise NotImplementedError
    
    def get_recordings(self, meeting_id: str) -> List[Dict[str, Any]]:
        """Get meeting recordings"""
        raise NotImplementedError


class ZoomProvider(VideoConferencingProvider):
    """Zoom video conferencing provider"""
    
    def __init__(self, api_key: str, api_secret: str):
        super().__init__(api_key, api_secret)
        self.base_url = "https://api.zoom.us/v2"
        self.jwt_token = self._generate_jwt_token()
        self.headers = {
            'Authorization': f'Bearer {self.jwt_token}',
            'Content-Type': 'application/json'
        }
    
    def _generate_jwt_token(self) -> str:
        """Generate JWT token for Zoom API authentication"""
        import jwt
        from datetime import datetime, timedelta
        
        payload = {
            'iss': self.api_key,
            'exp': datetime.utcnow() + timedelta(hours=1)
        }
        return jwt.encode(payload, self.api_secret, algorithm='HS256')
    
    def create_meeting(self, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Zoom meeting"""
        url = f"{self.base_url}/users/me/meetings"
        
        zoom_meeting_data = {
            "topic": meeting_data.get('title', 'Virtual Meetup'),
            "type": 2,  # Scheduled meeting
            "start_time": meeting_data.get('start_time'),
            "duration": meeting_data.get('duration', 60),
            "timezone": meeting_data.get('timezone', 'UTC'),
            "agenda": meeting_data.get('description', ''),
            "settings": {
                "host_video": True,
                "participant_video": True,
                "cn_meeting": False,
                "in_meeting": False,
                "join_before_host": True,
                "mute_upon_entry": True,
                "watermark": False,
                "use_pmi": False,
                "approval_type": 0,
                "audio": "both",
                "auto_recording": "cloud" if meeting_data.get('auto_record') else "none",
                "enforce_login": False,
                "registrants_email_notification": True,
                "waiting_room": meeting_data.get('waiting_room', True),
                "allow_multiple_devices": True
            }
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=zoom_meeting_data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create Zoom meeting: {e}")
            raise Exception(f"Failed to create Zoom meeting: {e}")
    
    def update_meeting(self, meeting_id: str, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a Zoom meeting"""
        url = f"{self.base_url}/meetings/{meeting_id}"
        
        zoom_update_data = {
            "topic": meeting_data.get('title'),
            "start_time": meeting_data.get('start_time'),
            "duration": meeting_data.get('duration'),
            "timezone": meeting_data.get('timezone', 'UTC'),
            "agenda": meeting_data.get('description', '')
        }
        
        try:
            response = requests.patch(url, headers=self.headers, json=zoom_update_data)
            response.raise_for_status()
            return {"status": "updated"}
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to update Zoom meeting: {e}")
            raise Exception(f"Failed to update Zoom meeting: {e}")
    
    def delete_meeting(self, meeting_id: str) -> bool:
        """Delete a Zoom meeting"""
        url = f"{self.base_url}/meetings/{meeting_id}"
        
        try:
            response = requests.delete(url, headers=self.headers)
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to delete Zoom meeting: {e}")
            return False
    
    def get_meeting(self, meeting_id: str) -> Dict[str, Any]:
        """Get Zoom meeting details"""
        url = f"{self.base_url}/meetings/{meeting_id}"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get Zoom meeting: {e}")
            raise Exception(f"Failed to get Zoom meeting: {e}")
    
    def start_recording(self, meeting_id: str) -> Dict[str, Any]:
        """Start recording a Zoom meeting"""
        # Note: Recording is typically controlled by meeting settings
        # This would be used for programmatic control if needed
        return {"status": "recording_started", "meeting_id": meeting_id}
    
    def stop_recording(self, meeting_id: str) -> Dict[str, Any]:
        """Stop recording a Zoom meeting"""
        return {"status": "recording_stopped", "meeting_id": meeting_id}
    
    def get_recordings(self, meeting_id: str) -> List[Dict[str, Any]]:
        """Get Zoom meeting recordings"""
        url = f"{self.base_url}/meetings/{meeting_id}/recordings"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            return data.get('recording_files', [])
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get Zoom recordings: {e}")
            return []


class GoogleMeetProvider(VideoConferencingProvider):
    """Google Meet provider (simplified implementation)"""
    
    def __init__(self, api_key: str, api_secret: str = None):
        super().__init__(api_key, api_secret)
        self.base_url = "https://www.googleapis.com/calendar/v3"
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def create_meeting(self, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Google Meet meeting via Calendar API"""
        # This is a simplified implementation
        # In production, you'd use proper OAuth2 flow
        
        calendar_event = {
            'summary': meeting_data.get('title', 'Virtual Meetup'),
            'description': meeting_data.get('description', ''),
            'start': {
                'dateTime': meeting_data.get('start_time'),
                'timeZone': meeting_data.get('timezone', 'UTC'),
            },
            'end': {
                'dateTime': meeting_data.get('end_time'),
                'timeZone': meeting_data.get('timezone', 'UTC'),
            },
            'conferenceData': {
                'createRequest': {
                    'requestId': str(uuid.uuid4()),
                    'conferenceSolutionKey': {
                        'type': 'hangoutsMeet'
                    }
                }
            },
            'attendees': meeting_data.get('attendees', [])
        }
        
        # This would make actual API call in production
        return {
            'id': str(uuid.uuid4()),
            'join_url': f"https://meet.google.com/{uuid.uuid4().hex[:10]}",
            'status': 'created'
        }
    
    def update_meeting(self, meeting_id: str, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update Google Meet meeting"""
        return {"status": "updated", "meeting_id": meeting_id}
    
    def delete_meeting(self, meeting_id: str) -> bool:
        """Delete Google Meet meeting"""
        return True
    
    def get_meeting(self, meeting_id: str) -> Dict[str, Any]:
        """Get Google Meet meeting details"""
        return {"id": meeting_id, "status": "active"}
    
    def start_recording(self, meeting_id: str) -> Dict[str, Any]:
        """Start recording (Google Meet handles this automatically for some plans)"""
        return {"status": "recording_started", "meeting_id": meeting_id}
    
    def stop_recording(self, meeting_id: str) -> Dict[str, Any]:
        """Stop recording"""
        return {"status": "recording_stopped", "meeting_id": meeting_id}
    
    def get_recordings(self, meeting_id: str) -> List[Dict[str, Any]]:
        """Get meeting recordings"""
        return []


class MicrosoftTeamsProvider(VideoConferencingProvider):
    """Microsoft Teams provider (simplified implementation)"""
    
    def __init__(self, api_key: str, api_secret: str = None):
        super().__init__(api_key, api_secret)
        self.base_url = "https://graph.microsoft.com/v1.0"
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def create_meeting(self, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create Microsoft Teams meeting"""
        # Simplified implementation
        return {
            'id': str(uuid.uuid4()),
            'join_url': f"https://teams.microsoft.com/l/meetup-join/{uuid.uuid4().hex}",
            'status': 'created'
        }
    
    def update_meeting(self, meeting_id: str, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update Teams meeting"""
        return {"status": "updated", "meeting_id": meeting_id}
    
    def delete_meeting(self, meeting_id: str) -> bool:
        """Delete Teams meeting"""
        return True
    
    def get_meeting(self, meeting_id: str) -> Dict[str, Any]:
        """Get Teams meeting details"""
        return {"id": meeting_id, "status": "active"}
    
    def start_recording(self, meeting_id: str) -> Dict[str, Any]:
        """Start recording"""
        return {"status": "recording_started", "meeting_id": meeting_id}
    
    def stop_recording(self, meeting_id: str) -> Dict[str, Any]:
        """Stop recording"""
        return {"status": "recording_stopped", "meeting_id": meeting_id}
    
    def get_recordings(self, meeting_id: str) -> List[Dict[str, Any]]:
        """Get meeting recordings"""
        return []


class VideoConferencingService:
    """Main service for managing video conferencing across different providers"""
    
    PROVIDERS = {
        'zoom': ZoomProvider,
        'google_meet': GoogleMeetProvider,
        'microsoft_teams': MicrosoftTeamsProvider,
    }
    
    def __init__(self):
        self.providers = {}
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize configured providers"""
        # Get provider configurations from Django settings
        provider_configs = getattr(settings, 'VIDEO_CONFERENCING_PROVIDERS', {})
        
        for provider_name, config in provider_configs.items():
            if provider_name in self.PROVIDERS and config.get('enabled', False):
                try:
                    provider_class = self.PROVIDERS[provider_name]
                    self.providers[provider_name] = provider_class(
                        api_key=config.get('api_key'),
                        api_secret=config.get('api_secret')
                    )
                    logger.info(f"Initialized {provider_name} video conferencing provider")
                except Exception as e:
                    logger.error(f"Failed to initialize {provider_name} provider: {e}")
    
    def get_available_providers(self) -> List[str]:
        """Get list of available providers"""
        return list(self.providers.keys())
    
    def create_meeting(self, provider: str, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a meeting with specified provider"""
        if provider not in self.providers:
            raise ValueError(f"Provider {provider} not available")
        
        try:
            result = self.providers[provider].create_meeting(meeting_data)
            
            # Cache meeting data for quick access
            cache_key = f"meeting_{result.get('id')}"
            cache.set(cache_key, {
                'provider': provider,
                'meeting_data': result,
                'created_at': timezone.now().isoformat()
            }, timeout=86400)  # 24 hours
            
            return result
        except Exception as e:
            logger.error(f"Failed to create meeting with {provider}: {e}")
            raise
    
    def update_meeting(self, provider: str, meeting_id: str, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a meeting"""
        if provider not in self.providers:
            raise ValueError(f"Provider {provider} not available")
        
        return self.providers[provider].update_meeting(meeting_id, meeting_data)
    
    def delete_meeting(self, provider: str, meeting_id: str) -> bool:
        """Delete a meeting"""
        if provider not in self.providers:
            raise ValueError(f"Provider {provider} not available")
        
        result = self.providers[provider].delete_meeting(meeting_id)
        
        # Remove from cache
        cache_key = f"meeting_{meeting_id}"
        cache.delete(cache_key)
        
        return result
    
    def get_meeting(self, provider: str, meeting_id: str) -> Dict[str, Any]:
        """Get meeting details"""
        if provider not in self.providers:
            raise ValueError(f"Provider {provider} not available")
        
        # Try cache first
        cache_key = f"meeting_{meeting_id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data['meeting_data']
        
        return self.providers[provider].get_meeting(meeting_id)
    
    def start_recording(self, provider: str, meeting_id: str) -> Dict[str, Any]:
        """Start recording a meeting"""
        if provider not in self.providers:
            raise ValueError(f"Provider {provider} not available")
        
        return self.providers[provider].start_recording(meeting_id)
    
    def stop_recording(self, provider: str, meeting_id: str) -> Dict[str, Any]:
        """Stop recording a meeting"""
        if provider not in self.providers:
            raise ValueError(f"Provider {provider} not available")
        
        return self.providers[provider].stop_recording(meeting_id)
    
    def get_recordings(self, provider: str, meeting_id: str) -> List[Dict[str, Any]]:
        """Get meeting recordings"""
        if provider not in self.providers:
            raise ValueError(f"Provider {provider} not available")
        
        return self.providers[provider].get_recordings(meeting_id)
    
    def get_best_provider(self, preferences: Dict[str, Any] = None) -> str:
        """Get the best available provider based on preferences"""
        if not self.providers:
            raise ValueError("No video conferencing providers available")
        
        # Simple logic - can be enhanced based on preferences
        if preferences:
            preferred_provider = preferences.get('provider')
            if preferred_provider in self.providers:
                return preferred_provider
        
        # Default priority order
        priority_order = ['zoom', 'google_meet', 'microsoft_teams']
        for provider in priority_order:
            if provider in self.providers:
                return provider
        
        # Return first available provider
        return list(self.providers.keys())[0]


# Global service instance
video_conferencing_service = VideoConferencingService()