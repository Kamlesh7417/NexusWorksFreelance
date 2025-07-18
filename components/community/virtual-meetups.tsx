'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Video, Calendar, Users, Clock, Plus, Play, Square, ExternalLink } from 'lucide-react';
import { communityService, VirtualMeeting } from '@/lib/services/community-service';
import { useAuth } from '@/components/auth/auth-provider';

export function VirtualMeetups() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<VirtualMeeting[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<VirtualMeeting | null>(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    start_time: '',
    duration_minutes: 60,
    max_participants: 50,
    is_recording_enabled: false
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    status: '',
    host: ''
  });

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const response = await communityService.getVirtualMeetings(filter);
      if (response.success) {
        setMeetings(response.data.results || []);
      }
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async () => {
    if (!createForm.title || !createForm.start_time) return;

    try {
      setLoading(true);
      const response = await communityService.createVirtualMeeting(createForm);
      if (response.success) {
        setShowCreateForm(false);
        setCreateForm({
          title: '',
          description: '',
          start_time: '',
          duration_minutes: 60,
          max_participants: 50,
          is_recording_enabled: false
        });
        loadMeetings();
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = async (meetingId: string) => {
    try {
      const response = await communityService.joinVirtualMeeting(meetingId);
      if (response.success) {
        // Open meeting in new window
        window.open(response.data.meeting_url, '_blank');
        loadMeetings();
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
    }
  };

  const handleEndMeeting = async (meetingId: string) => {
    try {
      const response = await communityService.endVirtualMeeting(meetingId);
      if (response.success) {
        loadMeetings();
      }
    } catch (error) {
      console.error('Error ending meeting:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      case 'ongoing': return <Play className="h-4 w-4" />;
      case 'completed': return <Square className="h-4 w-4" />;
      case 'cancelled': return <Square className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const isHost = (meeting: VirtualMeeting) => {
    return meeting.host === user?.id;
  };

  const canJoin = (meeting: VirtualMeeting) => {
    const now = new Date();
    const startTime = new Date(meeting.start_time);
    const endTime = new Date(startTime.getTime() + meeting.duration_minutes * 60000);
    
    return meeting.status === 'ongoing' || 
           (meeting.status === 'scheduled' && now >= startTime && now <= endTime);
  };

  const filteredMeetings = meetings.filter(meeting => {
    if (filter.status && meeting.status !== filter.status) return false;
    if (filter.host && meeting.host !== filter.host) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Virtual Meetups</h2>
          <p className="text-gray-600">Host and join virtual meetings with the community</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">All statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <Label>Host</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={filter.host}
                onChange={(e) => setFilter(prev => ({ ...prev, host: e.target.value }))}
              >
                <option value="">All hosts</option>
                <option value={user?.id || ''}>My meetings</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meetings List */}
      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredMeetings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Meetings Found</h3>
            <p className="text-gray-600 mb-4">Schedule your first virtual meetup</p>
            <Button onClick={() => setShowCreateForm(true)}>
              Schedule Meeting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredMeetings.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Video className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-lg">{meeting.title}</h3>
                      <Badge className={getStatusColor(meeting.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(meeting.status)}
                          <span className="capitalize">{meeting.status}</span>
                        </div>
                      </Badge>
                      {isHost(meeting) && (
                        <Badge variant="outline">Host</Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{meeting.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p>{new Date(meeting.start_time).toLocaleDateString()}</p>
                      <p className="text-gray-500">
                        {new Date(meeting.start_time).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{meeting.duration_minutes} minutes</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>
                      {meeting.current_participants}
                      {meeting.max_participants && `/${meeting.max_participants}`} participants
                    </span>
                  </div>
                </div>

                {meeting.participants.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Participants:</p>
                    <div className="flex flex-wrap gap-2">
                      {meeting.participants.slice(0, 5).map((participant) => (
                        <Badge key={participant.user_id} variant="secondary" className="text-xs">
                          {participant.username}
                        </Badge>
                      ))}
                      {meeting.participants.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{meeting.participants.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p>Host: User #{meeting.host}</p>
                    {meeting.is_recording_enabled && (
                      <p className="flex items-center space-x-1">
                        <Video className="h-3 w-3" />
                        <span>Recording enabled</span>
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedMeeting(meeting)}
                    >
                      Details
                    </Button>

                    {canJoin(meeting) && (
                      <Button
                        size="sm"
                        onClick={() => handleJoinMeeting(meeting.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Join
                      </Button>
                    )}

                    {isHost(meeting) && meeting.status === 'ongoing' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEndMeeting(meeting.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Square className="h-4 w-4 mr-1" />
                        End
                      </Button>
                    )}

                    {meeting.status === 'completed' && meeting.recording_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(meeting.recording_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Recording
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Meeting Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle>Schedule Virtual Meeting</CardTitle>
              <CardDescription>Create a new virtual meetup for the community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meeting-title">Meeting Title</Label>
                <Input
                  id="meeting-title"
                  placeholder="e.g., Weekly Frontend Discussion"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="meeting-description">Description</Label>
                <textarea
                  id="meeting-description"
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Describe the meeting purpose and agenda..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="datetime-local"
                    value={createForm.start_time}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <select
                    id="duration"
                    className="w-full p-2 border rounded-md"
                    value={createForm.duration_minutes}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="max-participants">Max Participants</Label>
                <Input
                  id="max-participants"
                  type="number"
                  min="2"
                  max="500"
                  value={createForm.max_participants}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 50 }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recording-enabled"
                  checked={createForm.is_recording_enabled}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, is_recording_enabled: e.target.checked }))}
                />
                <Label htmlFor="recording-enabled">Enable recording</Label>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleCreateMeeting} disabled={loading || !createForm.title || !createForm.start_time}>
                  {loading ? 'Scheduling...' : 'Schedule Meeting'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Meeting Details Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedMeeting.title}</CardTitle>
                  <CardDescription>
                    {new Date(selectedMeeting.start_time).toLocaleString()} • {selectedMeeting.duration_minutes} minutes
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedMeeting(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-600">{selectedMeeting.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Meeting Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Status:</strong> {selectedMeeting.status}</p>
                    <p><strong>Host:</strong> User #{selectedMeeting.host}</p>
                    <p><strong>Participants:</strong> {selectedMeeting.current_participants}
                      {selectedMeeting.max_participants && `/${selectedMeeting.max_participants}`}</p>
                    <p><strong>Recording:</strong> {selectedMeeting.is_recording_enabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>

                {selectedMeeting.participants.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Participants</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedMeeting.participants.map((participant) => (
                        <div key={participant.user_id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                          <span>{participant.username}</span>
                          {participant.duration_minutes && (
                            <span className="text-gray-500">{participant.duration_minutes}m</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedMeeting.meeting_id && (
                <div>
                  <h4 className="font-medium mb-2">Meeting Info</h4>
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    <p><strong>Meeting ID:</strong> {selectedMeeting.meeting_id}</p>
                    {selectedMeeting.passcode && (
                      <p><strong>Passcode:</strong> {selectedMeeting.passcode}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-4 border-t">
                <Button onClick={() => setSelectedMeeting(null)}>
                  Close
                </Button>
                {canJoin(selectedMeeting) && (
                  <Button onClick={() => {
                    handleJoinMeeting(selectedMeeting.id);
                    setSelectedMeeting(null);
                  }}>
                    Join Meeting
                  </Button>
                )}
                {selectedMeeting.recording_url && (
                  <Button variant="outline" onClick={() => window.open(selectedMeeting.recording_url, '_blank')}>
                    View Recording
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}