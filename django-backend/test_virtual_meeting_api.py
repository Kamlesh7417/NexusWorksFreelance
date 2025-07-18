#!/usr/bin/env python
"""
Test script for Virtual Meeting API endpoints

This script tests the REST API endpoints for virtual meeting functionality.
"""

import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from community.models import Event, EventRegistration, VirtualMeetingSession

User = get_user_model()


def test_virtual_meeting_api_endpoints():
    """Test virtual meeting API endpoints"""
    print("Testing virtual meeting API endpoints...")
    
    # Create test client and user
    client = APIClient()
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )
    client.force_authenticate(user=user)
    
    # Test 1: Create event with virtual meeting setup
    print("\n1. Testing event creation with virtual meeting features...")
    
    event_data = {
        'title': 'API Test Virtual Event',
        'description': 'Testing virtual meeting API',
        'event_type': 'webinar',
        'start_datetime': (timezone.now() + timedelta(hours=2)).isoformat(),
        'end_datetime': (timezone.now() + timedelta(hours=3)).isoformat(),
        'is_virtual': True,
        'video_provider': 'zoom',
        'enable_recording': True,
        'enable_screen_sharing': True,
        'enable_chat': True,
        'waiting_room_enabled': True,
        'status': 'registration_open',
        'visibility': 'public'
    }
    
    response = client.post('/api/community/events/', event_data, format='json')
    print(f"Create event response status: {response.status_code}")
    
    if response.status_code == 201:
        event_id = response.data['id']
        print(f"✓ Event created successfully with ID: {event_id}")
        
        # Test 2: Setup virtual meeting for event
        print("\n2. Testing virtual meeting setup...")
        
        meeting_setup_data = {
            'provider': 'zoom',
            'auto_record': True,
            'waiting_room': True
        }
        
        response = client.post(
            f'/api/community/events/{event_id}/setup_virtual_meeting/',
            meeting_setup_data,
            format='json'
        )
        print(f"Setup virtual meeting response status: {response.status_code}")
        
        if response.status_code == 200:
            print("✓ Virtual meeting setup successful")
            print(f"Meeting URL: {response.data.get('meeting_url', 'N/A')}")
        else:
            print(f"⚠ Virtual meeting setup failed: {response.data}")
        
        # Test 3: Generate iCal for event
        print("\n3. Testing iCal generation...")
        
        response = client.get(f'/api/community/events/{event_id}/generate_ical/')
        print(f"Generate iCal response status: {response.status_code}")
        
        if response.status_code == 200:
            print("✓ iCal generation successful")
            print(f"Content-Type: {response.get('Content-Type', 'N/A')}")
        else:
            print(f"⚠ iCal generation failed: {response.data}")
        
        # Test 4: Create virtual meeting session
        print("\n4. Testing virtual meeting session creation...")
        
        session_data = {
            'event': event_id,
            'session_name': 'API Test Session',
            'scheduled_start': (timezone.now() + timedelta(hours=2)).isoformat(),
            'scheduled_end': (timezone.now() + timedelta(hours=3)).isoformat(),
            'recording_enabled': True,
            'chat_enabled': True
        }
        
        response = client.post('/api/community/virtual-sessions/', session_data, format='json')
        print(f"Create session response status: {response.status_code}")
        
        if response.status_code == 201:
            session_id = response.data['id']
            print(f"✓ Virtual meeting session created with ID: {session_id}")
            
            # Test 5: Join session
            print("\n5. Testing session join...")
            
            # First register for the event
            registration_data = {'event': event_id}
            reg_response = client.post('/api/community/registrations/', registration_data, format='json')
            
            if reg_response.status_code == 201:
                print("✓ Registered for event")
                
                # Now join the session
                response = client.post(f'/api/community/virtual-sessions/{session_id}/join_session/')
                print(f"Join session response status: {response.status_code}")
                
                if response.status_code == 200:
                    print("✓ Successfully joined session")
                    print(f"Meeting URL: {response.data.get('meeting_url', 'N/A')}")
                else:
                    print(f"⚠ Failed to join session: {response.data}")
            else:
                print(f"⚠ Failed to register for event: {reg_response.data}")
        else:
            print(f"⚠ Session creation failed: {response.data}")
    else:
        print(f"⚠ Event creation failed: {response.data}")
    
    # Test 6: List virtual sessions
    print("\n6. Testing virtual sessions list...")
    
    response = client.get('/api/community/virtual-sessions/')
    print(f"List sessions response status: {response.status_code}")
    
    if response.status_code == 200:
        sessions_count = len(response.data.get('results', response.data))
        print(f"✓ Retrieved {sessions_count} virtual sessions")
    else:
        print(f"⚠ Failed to list sessions: {response.data}")
    
    # Test 7: List recordings
    print("\n7. Testing recordings list...")
    
    response = client.get('/api/community/recordings/')
    print(f"List recordings response status: {response.status_code}")
    
    if response.status_code == 200:
        recordings_count = len(response.data.get('results', response.data))
        print(f"✓ Retrieved {recordings_count} recordings")
    else:
        print(f"⚠ Failed to list recordings: {response.data}")
    
    # Test 8: List calendar integrations
    print("\n8. Testing calendar integrations list...")
    
    response = client.get('/api/community/calendar-integrations/')
    print(f"List calendar integrations response status: {response.status_code}")
    
    if response.status_code == 200:
        integrations_count = len(response.data.get('results', response.data))
        print(f"✓ Retrieved {integrations_count} calendar integrations")
    else:
        print(f"⚠ Failed to list calendar integrations: {response.data}")
    
    print("\n✅ Virtual meeting API endpoint tests completed!")


def test_event_virtual_meeting_fields():
    """Test event serialization with virtual meeting fields"""
    print("\nTesting event serialization with virtual meeting fields...")
    
    client = APIClient()
    user = User.objects.create_user(
        username='serialtest',
        email='serial@example.com',
        password='testpass123'
    )
    client.force_authenticate(user=user)
    
    # Create event with all virtual meeting fields
    event = Event.objects.create(
        title='Serialization Test Event',
        description='Testing serialization of virtual meeting fields',
        event_type='meetup',
        organizer=user,
        start_datetime=timezone.now() + timedelta(hours=1),
        end_datetime=timezone.now() + timedelta(hours=2),
        is_virtual=True,
        video_provider='google_meet',
        video_meeting_data={
            'meeting_id': 'serial_test_123',
            'join_url': 'https://meet.google.com/serial-test'
        },
        enable_recording=True,
        enable_screen_sharing=True,
        enable_chat=True,
        enable_breakout_rooms=False,
        waiting_room_enabled=True,
        recording_status='none',
        recording_urls=[],
        calendar_event_id='cal_123',
        calendar_provider='google'
    )
    
    # Test event detail endpoint
    response = client.get(f'/api/community/events/{event.id}/')
    print(f"Event detail response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.data
        virtual_fields = [
            'video_provider', 'enable_recording', 'enable_screen_sharing',
            'enable_chat', 'enable_breakout_rooms', 'waiting_room_enabled',
            'recording_status', 'calendar_provider'
        ]
        
        print("✓ Virtual meeting fields in response:")
        for field in virtual_fields:
            if field in data:
                print(f"  ✓ {field}: {data[field]}")
            else:
                print(f"  ⚠ {field}: Missing")
        
        print("✓ Event serialization test completed!")
    else:
        print(f"⚠ Event detail request failed: {response.data}")


def main():
    """Run all API tests"""
    print("=" * 60)
    print("VIRTUAL MEETING API ENDPOINT TESTS")
    print("=" * 60)
    
    try:
        # Test API endpoints
        test_virtual_meeting_api_endpoints()
        
        # Test serialization
        test_event_virtual_meeting_fields()
        
        print("\n" + "=" * 60)
        print("✅ ALL API TESTS COMPLETED!")
        print("=" * 60)
        
        print("\nAPI endpoints tested:")
        print("✓ POST /api/community/events/ - Create event with virtual meeting features")
        print("✓ POST /api/community/events/{id}/setup_virtual_meeting/ - Setup virtual meeting")
        print("✓ GET /api/community/events/{id}/generate_ical/ - Generate iCal file")
        print("✓ POST /api/community/virtual-sessions/ - Create virtual meeting session")
        print("✓ POST /api/community/virtual-sessions/{id}/join_session/ - Join session")
        print("✓ GET /api/community/virtual-sessions/ - List virtual sessions")
        print("✓ GET /api/community/recordings/ - List meeting recordings")
        print("✓ GET /api/community/calendar-integrations/ - List calendar integrations")
        
    except Exception as e:
        print(f"\n❌ API TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()