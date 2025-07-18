"""
Calendar Integration Service for Event Scheduling

This service provides integration with multiple calendar providers
including Google Calendar, Outlook Calendar, and Apple Calendar.
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class CalendarProvider:
    """Base class for calendar providers"""
    
    def __init__(self, api_key: str, api_secret: str = None):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = ""
        self.headers = {}
    
    def create_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a calendar event"""
        raise NotImplementedError
    
    def update_event(self, event_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a calendar event"""
        raise NotImplementedError
    
    def delete_event(self, event_id: str) -> bool:
        """Delete a calendar event"""
        raise NotImplementedError
    
    def get_event(self, event_id: str) -> Dict[str, Any]:
        """Get calendar event details"""
        raise NotImplementedError
    
    def list_events(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """List events in date range"""
        raise NotImplementedError
    
    def add_attendees(self, event_id: str, attendees: List[str]) -> Dict[str, Any]:
        """Add attendees to event"""
        raise NotImplementedError
    
    def send_invitations(self, event_id: str) -> Dict[str, Any]:
        """Send calendar invitations"""
        raise NotImplementedError


class GoogleCalendarProvider(CalendarProvider):
    """Google Calendar provider"""
    
    def __init__(self, api_key: str, api_secret: str = None):
        super().__init__(api_key, api_secret)
        self.base_url = "https://www.googleapis.com/calendar/v3"
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def create_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Google Calendar event"""
        calendar_id = event_data.get('calendar_id', 'primary')
        url = f"{self.base_url}/calendars/{calendar_id}/events"
        
        google_event = {
            'summary': event_data.get('title', 'Virtual Meetup'),
            'description': event_data.get('description', ''),
            'start': {
                'dateTime': event_data.get('start_time'),
                'timeZone': event_data.get('timezone', 'UTC'),
            },
            'end': {
                'dateTime': event_data.get('end_time'),
                'timeZone': event_data.get('timezone', 'UTC'),
            },
            'location': event_data.get('location', ''),
            'attendees': [
                {'email': email} for email in event_data.get('attendee_emails', [])
            ],
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                    {'method': 'popup', 'minutes': 30},       # 30 minutes before
                ],
            },
            'guestsCanInviteOthers': event_data.get('guests_can_invite', True),
            'guestsCanModify': event_data.get('guests_can_modify', False),
            'guestsCanSeeOtherGuests': event_data.get('guests_can_see_others', True),
        }
        
        # Add video conferencing if provided
        if event_data.get('meeting_url'):
            google_event['conferenceData'] = {
                'entryPoints': [{
                    'entryPointType': 'video',
                    'uri': event_data.get('meeting_url'),
                    'label': event_data.get('meeting_label', 'Join Meeting')
                }],
                'conferenceSolution': {
                    'name': event_data.get('provider_name', 'Video Conference'),
                    'iconUri': event_data.get('provider_icon', '')
                }
            }
        
        try:
            response = requests.post(
                url, 
                headers=self.headers, 
                json=google_event,
                params={'conferenceDataVersion': 1}
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create Google Calendar event: {e}")
            raise Exception(f"Failed to create Google Calendar event: {e}")
    
    def update_event(self, event_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a Google Calendar event"""
        calendar_id = event_data.get('calendar_id', 'primary')
        url = f"{self.base_url}/calendars/{calendar_id}/events/{event_id}"
        
        update_data = {}
        if 'title' in event_data:
            update_data['summary'] = event_data['title']
        if 'description' in event_data:
            update_data['description'] = event_data['description']
        if 'start_time' in event_data:
            update_data['start'] = {
                'dateTime': event_data['start_time'],
                'timeZone': event_data.get('timezone', 'UTC')
            }
        if 'end_time' in event_data:
            update_data['end'] = {
                'dateTime': event_data['end_time'],
                'timeZone': event_data.get('timezone', 'UTC')
            }
        
        try:
            response = requests.patch(url, headers=self.headers, json=update_data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to update Google Calendar event: {e}")
            raise Exception(f"Failed to update Google Calendar event: {e}")
    
    def delete_event(self, event_id: str, calendar_id: str = 'primary') -> bool:
        """Delete a Google Calendar event"""
        url = f"{self.base_url}/calendars/{calendar_id}/events/{event_id}"
        
        try:
            response = requests.delete(url, headers=self.headers)
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to delete Google Calendar event: {e}")
            return False
    
    def get_event(self, event_id: str, calendar_id: str = 'primary') -> Dict[str, Any]:
        """Get Google Calendar event details"""
        url = f"{self.base_url}/calendars/{calendar_id}/events/{event_id}"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get Google Calendar event: {e}")
            raise Exception(f"Failed to get Google Calendar event: {e}")
    
    def list_events(self, start_date: datetime, end_date: datetime, calendar_id: str = 'primary') -> List[Dict[str, Any]]:
        """List Google Calendar events in date range"""
        url = f"{self.base_url}/calendars/{calendar_id}/events"
        
        params = {
            'timeMin': start_date.isoformat(),
            'timeMax': end_date.isoformat(),
            'singleEvents': True,
            'orderBy': 'startTime'
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get('items', [])
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to list Google Calendar events: {e}")
            return []
    
    def add_attendees(self, event_id: str, attendees: List[str], calendar_id: str = 'primary') -> Dict[str, Any]:
        """Add attendees to Google Calendar event"""
        # First get the current event
        current_event = self.get_event(event_id, calendar_id)
        
        # Add new attendees to existing ones
        existing_attendees = current_event.get('attendees', [])
        existing_emails = {att.get('email') for att in existing_attendees}
        
        new_attendees = [{'email': email} for email in attendees if email not in existing_emails]
        all_attendees = existing_attendees + new_attendees
        
        # Update the event
        return self.update_event(event_id, {
            'calendar_id': calendar_id,
            'attendees': all_attendees
        })
    
    def send_invitations(self, event_id: str, calendar_id: str = 'primary') -> Dict[str, Any]:
        """Send calendar invitations (Google handles this automatically)"""
        return {"status": "invitations_sent", "event_id": event_id}


class OutlookCalendarProvider(CalendarProvider):
    """Microsoft Outlook Calendar provider"""
    
    def __init__(self, api_key: str, api_secret: str = None):
        super().__init__(api_key, api_secret)
        self.base_url = "https://graph.microsoft.com/v1.0"
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def create_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create an Outlook Calendar event"""
        url = f"{self.base_url}/me/events"
        
        outlook_event = {
            'subject': event_data.get('title', 'Virtual Meetup'),
            'body': {
                'contentType': 'HTML',
                'content': event_data.get('description', '')
            },
            'start': {
                'dateTime': event_data.get('start_time'),
                'timeZone': event_data.get('timezone', 'UTC')
            },
            'end': {
                'dateTime': event_data.get('end_time'),
                'timeZone': event_data.get('timezone', 'UTC')
            },
            'location': {
                'displayName': event_data.get('location', '')
            },
            'attendees': [
                {
                    'emailAddress': {
                        'address': email,
                        'name': email.split('@')[0]
                    },
                    'type': 'required'
                } for email in event_data.get('attendee_emails', [])
            ],
            'allowNewTimeProposals': True,
            'isReminderOn': True,
            'reminderMinutesBeforeStart': 30
        }
        
        # Add online meeting if provided
        if event_data.get('meeting_url'):
            outlook_event['onlineMeeting'] = {
                'joinUrl': event_data.get('meeting_url')
            }
        
        try:
            response = requests.post(url, headers=self.headers, json=outlook_event)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create Outlook Calendar event: {e}")
            raise Exception(f"Failed to create Outlook Calendar event: {e}")
    
    def update_event(self, event_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an Outlook Calendar event"""
        url = f"{self.base_url}/me/events/{event_id}"
        
        update_data = {}
        if 'title' in event_data:
            update_data['subject'] = event_data['title']
        if 'description' in event_data:
            update_data['body'] = {
                'contentType': 'HTML',
                'content': event_data['description']
            }
        if 'start_time' in event_data:
            update_data['start'] = {
                'dateTime': event_data['start_time'],
                'timeZone': event_data.get('timezone', 'UTC')
            }
        if 'end_time' in event_data:
            update_data['end'] = {
                'dateTime': event_data['end_time'],
                'timeZone': event_data.get('timezone', 'UTC')
            }
        
        try:
            response = requests.patch(url, headers=self.headers, json=update_data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to update Outlook Calendar event: {e}")
            raise Exception(f"Failed to update Outlook Calendar event: {e}")
    
    def delete_event(self, event_id: str) -> bool:
        """Delete an Outlook Calendar event"""
        url = f"{self.base_url}/me/events/{event_id}"
        
        try:
            response = requests.delete(url, headers=self.headers)
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to delete Outlook Calendar event: {e}")
            return False
    
    def get_event(self, event_id: str) -> Dict[str, Any]:
        """Get Outlook Calendar event details"""
        url = f"{self.base_url}/me/events/{event_id}"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get Outlook Calendar event: {e}")
            raise Exception(f"Failed to get Outlook Calendar event: {e}")
    
    def list_events(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """List Outlook Calendar events in date range"""
        url = f"{self.base_url}/me/events"
        
        params = {
            '$filter': f"start/dateTime ge '{start_date.isoformat()}' and end/dateTime le '{end_date.isoformat()}'",
            '$orderby': 'start/dateTime'
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get('value', [])
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to list Outlook Calendar events: {e}")
            return []
    
    def add_attendees(self, event_id: str, attendees: List[str]) -> Dict[str, Any]:
        """Add attendees to Outlook Calendar event"""
        # Get current event first
        current_event = self.get_event(event_id)
        
        # Add new attendees
        existing_attendees = current_event.get('attendees', [])
        existing_emails = {att.get('emailAddress', {}).get('address') for att in existing_attendees}
        
        new_attendees = [
            {
                'emailAddress': {
                    'address': email,
                    'name': email.split('@')[0]
                },
                'type': 'required'
            } for email in attendees if email not in existing_emails
        ]
        
        all_attendees = existing_attendees + new_attendees
        
        return self.update_event(event_id, {'attendees': all_attendees})
    
    def send_invitations(self, event_id: str) -> Dict[str, Any]:
        """Send calendar invitations (Outlook handles this automatically)"""
        return {"status": "invitations_sent", "event_id": event_id}


class CalendarService:
    """Main service for managing calendar integrations"""
    
    PROVIDERS = {
        'google': GoogleCalendarProvider,
        'outlook': OutlookCalendarProvider,
    }
    
    def __init__(self):
        self.providers = {}
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize configured providers"""
        provider_configs = getattr(settings, 'CALENDAR_PROVIDERS', {})
        
        for provider_name, config in provider_configs.items():
            if provider_name in self.PROVIDERS and config.get('enabled', False):
                try:
                    provider_class = self.PROVIDERS[provider_name]
                    self.providers[provider_name] = provider_class(
                        api_key=config.get('api_key'),
                        api_secret=config.get('api_secret')
                    )
                    logger.info(f"Initialized {provider_name} calendar provider")
                except Exception as e:
                    logger.error(f"Failed to initialize {provider_name} calendar provider: {e}")
    
    def get_available_providers(self) -> List[str]:
        """Get list of available calendar providers"""
        return list(self.providers.keys())
    
    def create_event(self, provider: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a calendar event with specified provider"""
        if provider not in self.providers:
            raise ValueError(f"Calendar provider {provider} not available")
        
        try:
            result = self.providers[provider].create_event(event_data)
            
            # Cache event data
            cache_key = f"calendar_event_{result.get('id')}"
            cache.set(cache_key, {
                'provider': provider,
                'event_data': result,
                'created_at': timezone.now().isoformat()
            }, timeout=86400)  # 24 hours
            
            return result
        except Exception as e:
            logger.error(f"Failed to create calendar event with {provider}: {e}")
            raise
    
    def update_event(self, provider: str, event_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a calendar event"""
        if provider not in self.providers:
            raise ValueError(f"Calendar provider {provider} not available")
        
        return self.providers[provider].update_event(event_id, event_data)
    
    def delete_event(self, provider: str, event_id: str, **kwargs) -> bool:
        """Delete a calendar event"""
        if provider not in self.providers:
            raise ValueError(f"Calendar provider {provider} not available")
        
        result = self.providers[provider].delete_event(event_id, **kwargs)
        
        # Remove from cache
        cache_key = f"calendar_event_{event_id}"
        cache.delete(cache_key)
        
        return result
    
    def get_event(self, provider: str, event_id: str, **kwargs) -> Dict[str, Any]:
        """Get calendar event details"""
        if provider not in self.providers:
            raise ValueError(f"Calendar provider {provider} not available")
        
        # Try cache first
        cache_key = f"calendar_event_{event_id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data['event_data']
        
        return self.providers[provider].get_event(event_id, **kwargs)
    
    def list_events(self, provider: str, start_date: datetime, end_date: datetime, **kwargs) -> List[Dict[str, Any]]:
        """List calendar events in date range"""
        if provider not in self.providers:
            raise ValueError(f"Calendar provider {provider} not available")
        
        return self.providers[provider].list_events(start_date, end_date, **kwargs)
    
    def add_attendees(self, provider: str, event_id: str, attendees: List[str], **kwargs) -> Dict[str, Any]:
        """Add attendees to calendar event"""
        if provider not in self.providers:
            raise ValueError(f"Calendar provider {provider} not available")
        
        return self.providers[provider].add_attendees(event_id, attendees, **kwargs)
    
    def send_invitations(self, provider: str, event_id: str, **kwargs) -> Dict[str, Any]:
        """Send calendar invitations"""
        if provider not in self.providers:
            raise ValueError(f"Calendar provider {provider} not available")
        
        return self.providers[provider].send_invitations(event_id, **kwargs)
    
    def sync_event_to_calendars(self, event_data: Dict[str, Any], user_preferences: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Sync event to multiple calendar providers based on user preferences"""
        results = {}
        
        for preference in user_preferences:
            provider = preference.get('provider')
            if provider in self.providers:
                try:
                    # Customize event data based on user preferences
                    custom_event_data = event_data.copy()
                    custom_event_data.update(preference.get('custom_fields', {}))
                    
                    result = self.create_event(provider, custom_event_data)
                    results[provider] = {
                        'status': 'success',
                        'event_id': result.get('id'),
                        'data': result
                    }
                except Exception as e:
                    results[provider] = {
                        'status': 'error',
                        'error': str(e)
                    }
        
        return results
    
    def generate_ical_event(self, event_data: Dict[str, Any]) -> str:
        """Generate iCal format event for universal calendar compatibility"""
        from datetime import datetime
        import uuid
        
        # Parse datetime strings if needed
        start_time = event_data.get('start_time')
        end_time = event_data.get('end_time')
        
        if isinstance(start_time, str):
            start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        if isinstance(end_time, str):
            end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
        
        ical_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Freelancing Platform//Virtual Meetup//EN
BEGIN:VEVENT
UID:{uuid.uuid4()}@aifreelancingplatform.com
DTSTART:{start_time.strftime('%Y%m%dT%H%M%SZ')}
DTEND:{end_time.strftime('%Y%m%dT%H%M%SZ')}
SUMMARY:{event_data.get('title', 'Virtual Meetup')}
DESCRIPTION:{event_data.get('description', '')}
LOCATION:{event_data.get('location', event_data.get('meeting_url', ''))}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Reminder: {event_data.get('title', 'Virtual Meetup')} in 30 minutes
END:VALARM
END:VEVENT
END:VCALENDAR"""
        
        return ical_content


# Global service instance
calendar_service = CalendarService()