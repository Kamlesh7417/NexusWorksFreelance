'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, Clock, Plus, Video, CheckCircle, XCircle } from 'lucide-react';
import { communityService, CommunityEvent, EventRegistration } from '@/lib/services/community-service';
import { useAuth } from '@/components/auth/auth-provider';

interface CommunityEventsProps {
  events: CommunityEvent[];
  onEventsUpdate: () => void;
}

export function CommunityEvents({ events, onEventsUpdate }: CommunityEventsProps) {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null);
  const [myRegistrations, setMyRegistrations] = useState<EventRegistration[]>([]);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    event_type: 'meetup',
    start_date: '',
    end_date: '',
    location: '',
    is_virtual: true,
    max_participants: 50,
    skills_focus: [] as string[],
    registration_deadline: ''
  });
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    event_type: '',
    is_virtual: '',
    skills_focus: ''
  });

  React.useEffect(() => {
    loadMyRegistrations();
  }, []);

  const loadMyRegistrations = async () => {
    try {
      const response = await communityService.getMyRegistrations();
      if (response.success) {
        setMyRegistrations(response.data);
      }
    } catch (error) {
      console.error('Error loading registrations:', error);
    }
  };

  const handleCreateEvent = async () => {
    if (!createForm.title || !createForm.start_date || !createForm.end_date) return;

    try {
      setLoading(true);
      const response = await communityService.createEvent(createForm);
      if (response.success) {
        setShowCreateForm(false);
        setCreateForm({
          title: '',
          description: '',
          event_type: 'meetup',
          start_date: '',
          end_date: '',
          location: '',
          is_virtual: true,
          max_participants: 50,
          skills_focus: [],
          registration_deadline: ''
        });
        onEventsUpdate();
      }
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterForEvent = async (eventId: string) => {
    try {
      const response = await communityService.registerForEvent(eventId);
      if (response.success) {
        loadMyRegistrations();
        onEventsUpdate();
      }
    } catch (error) {
      console.error('Error registering for event:', error);
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    try {
      const response = await communityService.cancelEventRegistration(eventId);
      if (response.success) {
        loadMyRegistrations();
        onEventsUpdate();
      }
    } catch (error) {
      console.error('Error canceling registration:', error);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !createForm.skills_focus.includes(newSkill.trim())) {
      setCreateForm(prev => ({
        ...prev,
        skills_focus: [...prev.skills_focus, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setCreateForm(prev => ({
      ...prev,
      skills_focus: prev.skills_focus.filter(s => s !== skill)
    }));
  };

  const isRegistered = (eventId: string) => {
    return myRegistrations.some(reg => reg.event === eventId);
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meetup': return <Users className="h-4 w-4" />;
      case 'hackathon': return <Calendar className="h-4 w-4" />;
      case 'workshop': return <Clock className="h-4 w-4" />;
      case 'webinar': return <Video className="h-4 w-4" />;
      case 'networking': return <Users className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter.event_type && event.event_type !== filter.event_type) return false;
    if (filter.is_virtual && event.is_virtual.toString() !== filter.is_virtual) return false;
    if (filter.skills_focus && !event.skills_focus.some(skill => 
      skill.toLowerCase().includes(filter.skills_focus.toLowerCase())
    )) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Community Events</h2>
          <p className="text-gray-600">Join events to connect with fellow developers</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Event Type</Label>
              <Select value={filter.event_type} onValueChange={(value) => setFilter(prev => ({ ...prev, event_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="meetup">Meetup</SelectItem>
                  <SelectItem value="hackathon">Hackathon</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="networking">Networking</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Format</Label>
              <Select value={filter.is_virtual} onValueChange={(value) => setFilter(prev => ({ ...prev, is_virtual: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All formats</SelectItem>
                  <SelectItem value="true">Virtual</SelectItem>
                  <SelectItem value="false">In-Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Skills Focus</Label>
              <Input
                placeholder="Filter by skill..."
                value={filter.skills_focus}
                onChange={(e) => setFilter(prev => ({ ...prev, skills_focus: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or create a new event</p>
            <Button onClick={() => setShowCreateForm(true)}>
              Create First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredEvents.map((event) => {
            const registered = isRegistered(event.id);
            const isPastEvent = new Date(event.end_date) < new Date();
            const isRegistrationOpen = !event.registration_deadline || 
              new Date(event.registration_deadline) > new Date();

            return (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getEventTypeIcon(event.event_type)}
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge variant={event.is_virtual ? "secondary" : "outline"}>
                          {event.is_virtual ? "Virtual" : "In-Person"}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {event.event_type}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{event.description}</p>
                    </div>
                    <Badge variant={isPastEvent ? "outline" : "default"}>
                      {event.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p>{new Date(event.start_date).toLocaleDateString()}</p>
                        <p className="text-gray-500">
                          {new Date(event.start_date).toLocaleTimeString()} - 
                          {new Date(event.end_date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {!event.is_virtual && event.location && (
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-sm">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>
                        {event.current_participants}
                        {event.max_participants && `/${event.max_participants}`} participants
                      </span>
                    </div>
                  </div>

                  {event.skills_focus.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Skills Focus:</p>
                      <div className="flex flex-wrap gap-2">
                        {event.skills_focus.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {event.registration_deadline && (
                        <p>Registration deadline: {new Date(event.registration_deadline).toLocaleDateString()}</p>
                      )}
                      <p>Organized by: User #{event.organizer}</p>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedEvent(event)}
                      >
                        View Details
                      </Button>
                      
                      {!isPastEvent && (
                        <>
                          {registered ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelRegistration(event.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleRegisterForEvent(event.id)}
                              disabled={!isRegistrationOpen || 
                                (event.max_participants && event.current_participants >= event.max_participants)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Register
                            </Button>
                          )}
                        </>
                      )}

                      {isPastEvent && event.recording_url && (
                        <Button size="sm" variant="outline">
                          <Video className="h-4 w-4 mr-1" />
                          Recording
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Event Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Community Event</CardTitle>
              <CardDescription>Organize an event for the developer community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., React Workshop for Beginners"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Describe your event..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event-type">Event Type</Label>
                  <Select value={createForm.event_type} onValueChange={(value) => setCreateForm(prev => ({ ...prev, event_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meetup">Meetup</SelectItem>
                      <SelectItem value="hackathon">Hackathon</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="max-participants">Max Participants</Label>
                  <Input
                    id="max-participants"
                    type="number"
                    value={createForm.max_participants}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 50 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date & Time</Label>
                  <Input
                    id="start-date"
                    type="datetime-local"
                    value={createForm.start_date}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="end-date">End Date & Time</Label>
                  <Input
                    id="end-date"
                    type="datetime-local"
                    value={createForm.end_date}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    id="is-virtual"
                    checked={createForm.is_virtual}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, is_virtual: e.target.checked }))}
                  />
                  <Label htmlFor="is-virtual">Virtual Event</Label>
                </div>
                {!createForm.is_virtual && (
                  <Input
                    placeholder="Event location"
                    value={createForm.location}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                  />
                )}
              </div>

              <div>
                <Label htmlFor="registration-deadline">Registration Deadline (Optional)</Label>
                <Input
                  id="registration-deadline"
                  type="datetime-local"
                  value={createForm.registration_deadline}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, registration_deadline: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="skills-focus">Skills Focus</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    placeholder="Add a skill (e.g., React, Python)"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  />
                  <Button type="button" onClick={addSkill}>Add</Button>
                </div>
                {createForm.skills_focus.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {createForm.skills_focus.map((skill) => (
                      <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                        {skill} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleCreateEvent} disabled={loading || !createForm.title}>
                  {loading ? 'Creating...' : 'Create Event'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedEvent.title}</CardTitle>
                  <CardDescription>
                    {selectedEvent.event_type} • {selectedEvent.is_virtual ? 'Virtual' : 'In-Person'}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{selectedEvent.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Event Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Start:</strong> {new Date(selectedEvent.start_date).toLocaleString()}</p>
                    <p><strong>End:</strong> {new Date(selectedEvent.end_date).toLocaleString()}</p>
                    {!selectedEvent.is_virtual && selectedEvent.location && (
                      <p><strong>Location:</strong> {selectedEvent.location}</p>
                    )}
                    <p><strong>Participants:</strong> {selectedEvent.current_participants}
                      {selectedEvent.max_participants && `/${selectedEvent.max_participants}`}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Skills Focus</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.skills_focus.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t">
                <Button onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
                {!isRegistered(selectedEvent.id) && new Date(selectedEvent.end_date) > new Date() && (
                  <Button onClick={() => {
                    handleRegisterForEvent(selectedEvent.id);
                    setSelectedEvent(null);
                  }}>
                    Register for Event
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