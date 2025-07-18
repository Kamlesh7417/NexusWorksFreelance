'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, Calendar, Code, Award, Plus, UserPlus, Send } from 'lucide-react';
import { communityService, Hackathon, HackathonTeam, HackathonSubmission } from '@/lib/services/community-service';
import { useAuth } from '@/components/auth/auth-provider';

interface HackathonManagementProps {
  hackathons: Hackathon[];
  onHackathonsUpdate: () => void;
}

export function HackathonManagement({ hackathons, onHackathonsUpdate }: HackathonManagementProps) {
  const { user } = useAuth();
  const [selectedHackathon, setSelectedHackathon] = useState<Hackathon | null>(null);
  const [teams, setTeams] = useState<HackathonTeam[]>([]);
  const [submissions, setSubmissions] = useState<HackathonSubmission[]>([]);
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<HackathonTeam | null>(null);
  const [createTeamForm, setCreateTeamForm] = useState({
    name: '',
    description: '',
    skills_needed: [] as string[],
    project_idea: ''
  });
  const [submissionForm, setSubmissionForm] = useState({
    project_title: '',
    description: '',
    demo_url: '',
    github_url: '',
    presentation_url: '',
    technologies_used: [] as string[]
  });
  const [newSkill, setNewSkill] = useState('');
  const [newTech, setNewTech] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedHackathon) {
      loadHackathonData(selectedHackathon.id);
    }
  }, [selectedHackathon]);

  const loadHackathonData = async (hackathonId: string) => {
    try {
      const [teamsRes, submissionsRes] = await Promise.all([
        communityService.getHackathonTeams(hackathonId),
        communityService.getHackathonSubmissions(hackathonId)
      ]);

      if (teamsRes.success) setTeams(teamsRes.data);
      if (submissionsRes.success) setSubmissions(submissionsRes.data);
    } catch (error) {
      console.error('Error loading hackathon data:', error);
    }
  };

  const handleCreateTeam = async () => {
    if (!selectedHackathon || !createTeamForm.name) return;

    try {
      setLoading(true);
      const response = await communityService.createHackathonTeam(selectedHackathon.id, createTeamForm);
      if (response.success) {
        setShowCreateTeamForm(false);
        setCreateTeamForm({
          name: '',
          description: '',
          skills_needed: [],
          project_idea: ''
        });
        loadHackathonData(selectedHackathon.id);
      }
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (teamId: string, role: string) => {
    try {
      const response = await communityService.joinHackathonTeam(teamId, { role });
      if (response.success) {
        loadHackathonData(selectedHackathon!.id);
      }
    } catch (error) {
      console.error('Error joining team:', error);
    }
  };

  const handleSubmitProject = async () => {
    if (!selectedTeam || !submissionForm.project_title) return;

    try {
      setLoading(true);
      const response = await communityService.submitHackathonProject(selectedTeam.id, submissionForm);
      if (response.success) {
        setShowSubmissionForm(false);
        setSubmissionForm({
          project_title: '',
          description: '',
          demo_url: '',
          github_url: '',
          presentation_url: '',
          technologies_used: []
        });
        loadHackathonData(selectedHackathon!.id);
      }
    } catch (error) {
      console.error('Error submitting project:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !createTeamForm.skills_needed.includes(newSkill.trim())) {
      setCreateTeamForm(prev => ({
        ...prev,
        skills_needed: [...prev.skills_needed, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setCreateTeamForm(prev => ({
      ...prev,
      skills_needed: prev.skills_needed.filter(s => s !== skill)
    }));
  };

  const addTechnology = () => {
    if (newTech.trim() && !submissionForm.technologies_used.includes(newTech.trim())) {
      setSubmissionForm(prev => ({
        ...prev,
        technologies_used: [...prev.technologies_used, newTech.trim()]
      }));
      setNewTech('');
    }
  };

  const removeTechnology = (tech: string) => {
    setSubmissionForm(prev => ({
      ...prev,
      technologies_used: prev.technologies_used.filter(t => t !== tech)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'judging': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isUserInTeam = (team: HackathonTeam) => {
    return team.members.some(member => member.user_id === user?.id);
  };

  const getUserTeam = () => {
    return teams.find(team => isUserInTeam(team));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Hackathons</h2>
        <p className="text-gray-600">Compete in coding challenges and win prizes</p>
      </div>

      {hackathons.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Hackathons</h3>
            <p className="text-gray-600">Check back later for upcoming hackathons</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {hackathons.map((hackathon) => (
            <Card key={hackathon.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <h3 className="font-semibold text-lg">{hackathon.title}</h3>
                      <Badge className={getStatusColor(hackathon.status)}>
                        {hackathon.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{hackathon.description}</p>
                    <p className="text-sm font-medium text-blue-600">Theme: {hackathon.theme}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p>Start: {new Date(hackathon.start_date).toLocaleDateString()}</p>
                      <p>End: {new Date(hackathon.end_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div>
                      <p>{hackathon.current_teams}/{hackathon.max_teams} teams</p>
                      <p>Max {hackathon.max_team_size} per team</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <Award className="h-4 w-4 text-gray-500" />
                    <div>
                      <p>{hackathon.prizes.length} prizes</p>
                      <p>Up to ${Math.max(...hackathon.prizes.map(p => p.value))}</p>
                    </div>
                  </div>
                </div>

                {hackathon.prizes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Prizes:</p>
                    <div className="flex flex-wrap gap-2">
                      {hackathon.prizes.slice(0, 3).map((prize) => (
                        <Badge key={prize.position} variant="secondary" className="text-xs">
                          {prize.position === 1 ? '🥇' : prize.position === 2 ? '🥈' : '🥉'} ${prize.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedHackathon(hackathon)}
                  >
                    View Details
                  </Button>
                  
                  {hackathon.status === 'registration' && (
                    <Button size="sm" onClick={() => setSelectedHackathon(hackathon)}>
                      Join Hackathon
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hackathon Details Modal */}
      {selectedHackathon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedHackathon.title}</CardTitle>
                  <CardDescription>{selectedHackathon.theme}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedHackathon(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="teams">Teams ({teams.length})</TabsTrigger>
                  <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-600">{selectedHackathon.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Timeline</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Registration Deadline:</strong> {new Date(selectedHackathon.registration_deadline).toLocaleString()}</p>
                        <p><strong>Start:</strong> {new Date(selectedHackathon.start_date).toLocaleString()}</p>
                        <p><strong>End:</strong> {new Date(selectedHackathon.end_date).toLocaleString()}</p>
                        <p><strong>Submission Deadline:</strong> {new Date(selectedHackathon.submission_deadline).toLocaleString()}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Prizes</h4>
                      <div className="space-y-2">
                        {selectedHackathon.prizes.map((prize) => (
                          <div key={prize.position} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">{prize.title}</p>
                              <p className="text-sm text-gray-600">{prize.description}</p>
                            </div>
                            <Badge variant="secondary">${prize.value}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {selectedHackathon.rules.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Rules</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {selectedHackathon.rules.map((rule, index) => (
                          <li key={index}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="teams" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Teams</h4>
                    {selectedHackathon.status === 'registration' && !getUserTeam() && (
                      <Button size="sm" onClick={() => setShowCreateTeamForm(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Create Team
                      </Button>
                    )}
                  </div>

                  {teams.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No teams yet</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {teams.map((team) => {
                        const userInTeam = isUserInTeam(team);
                        const isLeader = team.leader === user?.id;

                        return (
                          <Card key={team.id} className={userInTeam ? 'border-blue-200 bg-blue-50' : ''}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h5 className="font-semibold">{team.name}</h5>
                                  <p className="text-sm text-gray-600">{team.description}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant={team.is_recruiting ? "default" : "outline"}>
                                    {team.is_recruiting ? "Recruiting" : "Full"}
                                  </Badge>
                                  {userInTeam && (
                                    <Badge variant="secondary">Your Team</Badge>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-sm font-medium mb-1">Members ({team.members.length}/{selectedHackathon.max_team_size})</p>
                                  <div className="space-y-1">
                                    {team.members.map((member) => (
                                      <div key={member.user_id} className="flex items-center justify-between text-sm">
                                        <span>{member.username}</span>
                                        <div className="flex items-center space-x-1">
                                          <Badge variant="outline" className="text-xs">{member.role}</Badge>
                                          {member.user_id === team.leader && (
                                            <Badge variant="secondary" className="text-xs">Leader</Badge>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {team.skills_needed.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium mb-1">Skills Needed</p>
                                    <div className="flex flex-wrap gap-1">
                                      {team.skills_needed.map((skill) => (
                                        <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {team.project_idea && (
                                <div className="mb-3">
                                  <p className="text-sm font-medium mb-1">Project Idea</p>
                                  <p className="text-sm text-gray-600">{team.project_idea}</p>
                                </div>
                              )}

                              <div className="flex space-x-2">
                                {!userInTeam && team.is_recruiting && 
                                 team.members.length < selectedHackathon.max_team_size && 
                                 selectedHackathon.status === 'registration' && (
                                  <Button size="sm" onClick={() => handleJoinTeam(team.id, 'Developer')}>
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Join Team
                                  </Button>
                                )}
                                
                                {userInTeam && isLeader && selectedHackathon.status === 'ongoing' && !team.submission && (
                                  <Button size="sm" onClick={() => {
                                    setSelectedTeam(team);
                                    setShowSubmissionForm(true);
                                  }}>
                                    <Send className="h-4 w-4 mr-1" />
                                    Submit Project
                                  </Button>
                                )}

                                {team.submission && (
                                  <Badge variant="default">Project Submitted</Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="submissions" className="space-y-4">
                  {submissions.length === 0 ? (
                    <div className="text-center py-8">
                      <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No submissions yet</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {submissions.map((submission) => (
                        <Card key={submission.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h5 className="font-semibold">{submission.project_title}</h5>
                                <p className="text-sm text-gray-600">Team #{submission.team}</p>
                              </div>
                              {submission.score && (
                                <Badge variant="default">Score: {submission.score}</Badge>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 mb-3">{submission.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-sm font-medium mb-1">Technologies Used</p>
                                <div className="flex flex-wrap gap-1">
                                  {submission.technologies_used.map((tech) => (
                                    <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <p className="text-sm font-medium mb-1">Links</p>
                                <div className="space-y-1 text-sm">
                                  {submission.demo_url && (
                                    <a href={submission.demo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">
                                      🔗 Demo
                                    </a>
                                  )}
                                  {submission.github_url && (
                                    <a href={submission.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">
                                      📁 GitHub
                                    </a>
                                  )}
                                  {submission.presentation_url && (
                                    <a href={submission.presentation_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">
                                      📊 Presentation
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-gray-500">
                              Submitted: {new Date(submission.submitted_at).toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Team Form */}
      {showCreateTeamForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle>Create Team</CardTitle>
              <CardDescription>Form a team for the hackathon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  placeholder="Enter team name"
                  value={createTeamForm.name}
                  onChange={(e) => setCreateTeamForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="team-description">Description</Label>
                <textarea
                  id="team-description"
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Describe your team..."
                  value={createTeamForm.description}
                  onChange={(e) => setCreateTeamForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="project-idea">Project Idea (Optional)</Label>
                <textarea
                  id="project-idea"
                  className="w-full p-2 border rounded-md"
                  rows={2}
                  placeholder="What do you plan to build?"
                  value={createTeamForm.project_idea}
                  onChange={(e) => setCreateTeamForm(prev => ({ ...prev, project_idea: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="skills-needed">Skills Needed</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    placeholder="Add a skill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  />
                  <Button type="button" onClick={addSkill}>Add</Button>
                </div>
                {createTeamForm.skills_needed.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {createTeamForm.skills_needed.map((skill) => (
                      <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                        {skill} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleCreateTeam} disabled={loading || !createTeamForm.name}>
                  {loading ? 'Creating...' : 'Create Team'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateTeamForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Project Submission Form */}
      {showSubmissionForm && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle>Submit Project</CardTitle>
              <CardDescription>Submit your hackathon project for {selectedTeam.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="project-title">Project Title</Label>
                <Input
                  id="project-title"
                  placeholder="Enter project title"
                  value={submissionForm.project_title}
                  onChange={(e) => setSubmissionForm(prev => ({ ...prev, project_title: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="project-description">Description</Label>
                <textarea
                  id="project-description"
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Describe your project..."
                  value={submissionForm.description}
                  onChange={(e) => setSubmissionForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="demo-url">Demo URL (Optional)</Label>
                  <Input
                    id="demo-url"
                    placeholder="https://your-demo.com"
                    value={submissionForm.demo_url}
                    onChange={(e) => setSubmissionForm(prev => ({ ...prev, demo_url: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="github-url">GitHub URL</Label>
                  <Input
                    id="github-url"
                    placeholder="https://github.com/username/repo"
                    value={submissionForm.github_url}
                    onChange={(e) => setSubmissionForm(prev => ({ ...prev, github_url: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="presentation-url">Presentation URL (Optional)</Label>
                  <Input
                    id="presentation-url"
                    placeholder="https://slides.com/your-presentation"
                    value={submissionForm.presentation_url}
                    onChange={(e) => setSubmissionForm(prev => ({ ...prev, presentation_url: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="technologies">Technologies Used</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    placeholder="Add a technology"
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTechnology()}
                  />
                  <Button type="button" onClick={addTechnology}>Add</Button>
                </div>
                {submissionForm.technologies_used.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {submissionForm.technologies_used.map((tech) => (
                      <Badge key={tech} variant="secondary" className="cursor-pointer" onClick={() => removeTechnology(tech)}>
                        {tech} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSubmitProject} disabled={loading || !submissionForm.project_title}>
                  {loading ? 'Submitting...' : 'Submit Project'}
                </Button>
                <Button variant="outline" onClick={() => setShowSubmissionForm(false)}>
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