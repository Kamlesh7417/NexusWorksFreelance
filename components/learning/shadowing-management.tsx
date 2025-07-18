'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Eye, Calendar, FileText, CheckCircle, XCircle, Clock, Award, MessageSquare } from 'lucide-react';
import { learningService, ShadowingSession } from '@/lib/services/learning-service';
import { useAuth } from '@/components/auth/auth-provider';

export function ShadowingManagement() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [sessions, setSessions] = useState<ShadowingSession[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [requestForm, setRequestForm] = useState({
    project_id: '',
    learning_objectives: [] as string[],
    duration_weeks: 4,
    message_to_mentor: ''
  });
  const [newObjective, setNewObjective] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('opportunities');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [opportunitiesRes, sessionsRes] = await Promise.all([
        learningService.getShadowingOpportunities(),
        learningService.getShadowingSessions()
      ]);

      if (opportunitiesRes.success) setOpportunities(opportunitiesRes.data);
      if (sessionsRes.success) setSessions(sessionsRes.data);
    } catch (error) {
      console.error('Error loading shadowing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestShadowing = async () => {
    if (!requestForm.project_id || requestForm.learning_objectives.length === 0) return;

    try {
      const response = await learningService.requestShadowingSession(requestForm);
      if (response.success) {
        setShowRequestForm(false);
        setRequestForm({
          project_id: '',
          learning_objectives: [],
          duration_weeks: 4,
          message_to_mentor: ''
        });
        loadData();
      }
    } catch (error) {
      console.error('Error requesting shadowing session:', error);
    }
  };

  const handleRespondToRequest = async (sessionId: string, approved: boolean, message?: string) => {
    try {
      const response = await learningService.respondToShadowingRequest(sessionId, {
        approved,
        message,
        nda_required: true
      });
      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Error responding to request:', error);
    }
  };

  const handleCompleteSession = async (sessionId: string, feedback: string, skillsLearned: string[], rating: number) => {
    try {
      const response = await learningService.completeShadowingSession(sessionId, {
        feedback,
        skills_learned: skillsLearned,
        rating
      });
      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const addObjective = () => {
    if (newObjective.trim() && !requestForm.learning_objectives.includes(newObjective.trim())) {
      setRequestForm(prev => ({
        ...prev,
        learning_objectives: [...prev.learning_objectives, newObjective.trim()]
      }));
      setNewObjective('');
    }
  };

  const removeObjective = (objective: string) => {
    setRequestForm(prev => ({
      ...prev,
      learning_objectives: prev.learning_objectives.filter(obj => obj !== objective)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'active': return <Eye className="h-4 w-4" />;
      case 'completed': return <Award className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Shadowing Program</h2>
          <p className="text-gray-600">Learn from experienced developers by shadowing real projects</p>
        </div>
        <Button onClick={() => setShowRequestForm(true)}>
          <Eye className="h-4 w-4 mr-2" />
          Request Shadowing
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="my-sessions">My Sessions</TabsTrigger>
          <TabsTrigger value="mentoring">Mentoring Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-6">
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
          ) : opportunities.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Opportunities Available</h3>
                <p className="text-gray-600">Check back later for new shadowing opportunities</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {opportunities.map((opportunity) => (
                <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{opportunity.project_title}</h3>
                        <p className="text-gray-600">{opportunity.project_description}</p>
                      </div>
                      <Badge variant="outline">{opportunity.project_type}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label className="text-sm font-medium">Mentor</Label>
                        <p className="text-sm">{opportunity.mentor_name}</p>
                        <p className="text-xs text-gray-500">{opportunity.mentor_experience} years experience</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Skills</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {opportunity.skills?.slice(0, 3).map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                          ))}
                          {opportunity.skills?.length > 3 && (
                            <Badge variant="secondary" className="text-xs">+{opportunity.skills.length - 3}</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Duration</Label>
                        <p className="text-sm">{opportunity.duration_weeks} weeks</p>
                        <p className="text-xs text-gray-500">Starting {new Date(opportunity.start_date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{opportunity.spots_available} spots available</span>
                        <span>NDA required: {opportunity.nda_required ? 'Yes' : 'No'}</span>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedOpportunity(opportunity);
                          setRequestForm(prev => ({ ...prev, project_id: opportunity.project_id }));
                          setShowRequestForm(true);
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-sessions" className="space-y-6">
          {sessions.filter(session => session.student === user?.id).length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Shadowing Sessions</h3>
                <p className="text-gray-600 mb-4">Apply for shadowing opportunities to start learning</p>
                <Button onClick={() => setActiveTab('opportunities')}>
                  Browse Opportunities
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessions.filter(session => session.student === user?.id).map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">Project #{session.project}</h3>
                        <p className="text-sm text-gray-600">Mentor: User #{session.mentor}</p>
                      </div>
                      <Badge className={getStatusColor(session.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(session.status)}
                          <span className="capitalize">{session.status}</span>
                        </div>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="text-sm font-medium">Duration</Label>
                        <p className="text-sm">
                          {new Date(session.start_date).toLocaleDateString()} - {new Date(session.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Credits Awarded</Label>
                        <p className="text-sm">{session.learning_credits_awarded}</p>
                      </div>
                    </div>

                    {session.learning_objectives.length > 0 && (
                      <div className="mb-4">
                        <Label className="text-sm font-medium">Learning Objectives</Label>
                        <ul className="text-sm text-gray-600 mt-1">
                          {session.learning_objectives.map((objective, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span>•</span>
                              <span>{objective}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {session.feedback && (
                      <div className="mb-4">
                        <Label className="text-sm font-medium">Feedback</Label>
                        <p className="text-sm text-gray-600 mt-1">{session.feedback}</p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {session.status === 'active' && (
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Contact Mentor
                        </Button>
                      )}
                      {session.status === 'approved' && !session.nda_signed && (
                        <Button size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Sign NDA
                        </Button>
                      )}
                      {session.status === 'completed' && (
                        <Button size="sm" variant="outline">
                          <Award className="h-4 w-4 mr-1" />
                          View Certificate
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mentoring" className="space-y-6">
          {sessions.filter(session => session.mentor === user?.id).length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Mentoring Requests</h3>
                <p className="text-gray-600">Students will be able to request shadowing on your projects</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessions.filter(session => session.mentor === user?.id).map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">Shadowing Request</h3>
                        <p className="text-sm text-gray-600">Student: User #{session.student}</p>
                        <p className="text-sm text-gray-600">Project: #{session.project}</p>
                      </div>
                      <Badge className={getStatusColor(session.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(session.status)}
                          <span className="capitalize">{session.status}</span>
                        </div>
                      </Badge>
                    </div>

                    {session.learning_objectives.length > 0 && (
                      <div className="mb-4">
                        <Label className="text-sm font-medium">Student's Learning Objectives</Label>
                        <ul className="text-sm text-gray-600 mt-1">
                          {session.learning_objectives.map((objective, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span>•</span>
                              <span>{objective}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {session.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleRespondToRequest(session.id, true, 'Approved for shadowing')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRespondToRequest(session.id, false, 'Not available at this time')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </>
                      )}
                      {session.status === 'active' && (
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Contact Student
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Shadowing Form */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Request Shadowing Session</CardTitle>
              <CardDescription>
                {selectedOpportunity ? `Apply for: ${selectedOpportunity.project_title}` : 'Submit your shadowing request'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="learning-objectives">Learning Objectives</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    placeholder="What do you want to learn? (e.g., React patterns, API design)"
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addObjective()}
                  />
                  <Button type="button" onClick={addObjective}>Add</Button>
                </div>
                {requestForm.learning_objectives.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {requestForm.learning_objectives.map((objective) => (
                      <Badge key={objective} variant="secondary" className="cursor-pointer" onClick={() => removeObjective(objective)}>
                        {objective} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="duration">Duration (weeks)</Label>
                <Select value={requestForm.duration_weeks.toString()} onValueChange={(value) => setRequestForm(prev => ({ ...prev, duration_weeks: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 weeks</SelectItem>
                    <SelectItem value="4">4 weeks</SelectItem>
                    <SelectItem value="6">6 weeks</SelectItem>
                    <SelectItem value="8">8 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Message to Mentor (Optional)</Label>
                <textarea
                  id="message"
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Introduce yourself and explain why you're interested in this project..."
                  value={requestForm.message_to_mentor}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, message_to_mentor: e.target.value }))}
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button 
                  onClick={handleRequestShadowing} 
                  disabled={requestForm.learning_objectives.length === 0}
                >
                  Submit Request
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowRequestForm(false);
                  setSelectedOpportunity(null);
                  setRequestForm({
                    project_id: '',
                    learning_objectives: [],
                    duration_weeks: 4,
                    message_to_mentor: ''
                  });
                }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}