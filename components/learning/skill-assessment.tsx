'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Award, TrendingUp, CheckCircle, Clock, Star, Brain, Code, FileText } from 'lucide-react';
import { learningService, SkillAssessment as SkillAssessmentType } from '@/lib/services/learning-service';
import { useAuth } from '@/components/auth/auth-provider';

export function SkillAssessment() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<SkillAssessmentType[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [currentTest, setCurrentTest] = useState<any>(null);
  const [testAnswers, setTestAnswers] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({
    skill: '',
    proficiency_level: 1,
    assessment_type: 'self_reported',
    evidence: [] as string[]
  });
  const [newEvidence, setNewEvidence] = useState('');
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const response = await learningService.getSkillAssessments();
      if (response.success) {
        setAssessments(response.data);
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    if (!createForm.skill) return;

    try {
      const response = await learningService.createSkillAssessment(createForm);
      if (response.success) {
        setShowCreateForm(false);
        setCreateForm({
          skill: '',
          proficiency_level: 1,
          assessment_type: 'self_reported',
          evidence: []
        });
        loadAssessments();
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
    }
  };

  const handleTakeTest = async (skill: string) => {
    try {
      setTestLoading(true);
      const response = await learningService.takeSkillTest(skill);
      if (response.success) {
        setCurrentTest(response.data);
        setTestAnswers(new Array(response.data.questions.length).fill(''));
        setShowTestModal(true);
      }
    } catch (error) {
      console.error('Error starting test:', error);
    } finally {
      setTestLoading(false);
    }
  };

  const handleSubmitTest = async () => {
    if (!currentTest) return;

    try {
      const response = await learningService.submitSkillTest(currentTest.test_id, testAnswers);
      if (response.success) {
        setShowTestModal(false);
        setCurrentTest(null);
        setTestAnswers([]);
        loadAssessments();
      }
    } catch (error) {
      console.error('Error submitting test:', error);
    }
  };

  const addEvidence = () => {
    if (newEvidence.trim() && !createForm.evidence.includes(newEvidence.trim())) {
      setCreateForm(prev => ({
        ...prev,
        evidence: [...prev.evidence, newEvidence.trim()]
      }));
      setNewEvidence('');
    }
  };

  const removeEvidence = (evidence: string) => {
    setCreateForm(prev => ({
      ...prev,
      evidence: prev.evidence.filter(e => e !== evidence)
    }));
  };

  const getProficiencyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Beginner';
      case 2: return 'Novice';
      case 3: return 'Intermediate';
      case 4: return 'Advanced';
      case 5: return 'Expert';
      default: return 'Unknown';
    }
  };

  const getProficiencyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-blue-100 text-blue-800';
      case 5: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssessmentTypeIcon = (type: string) => {
    switch (type) {
      case 'self_reported': return <FileText className="h-4 w-4" />;
      case 'github_analysis': return <Code className="h-4 w-4" />;
      case 'peer_review': return <Star className="h-4 w-4" />;
      case 'formal_test': return <Brain className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getAssessmentTypeLabel = (type: string) => {
    switch (type) {
      case 'self_reported': return 'Self-Reported';
      case 'github_analysis': return 'GitHub Analysis';
      case 'peer_review': return 'Peer Review';
      case 'formal_test': return 'Formal Test';
      default: return type;
    }
  };

  const groupedAssessments = assessments.reduce((acc, assessment) => {
    if (!acc[assessment.skill]) {
      acc[assessment.skill] = [];
    }
    acc[assessment.skill].push(assessment);
    return acc;
  }, {} as Record<string, SkillAssessmentType[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Skill Assessment</h2>
          <p className="text-gray-600">Track and validate your technical skills</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Target className="h-4 w-4 mr-2" />
          Add Assessment
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills Detail</TabsTrigger>
          <TabsTrigger value="tests">Take Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Skill Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Skills</p>
                    <p className="text-2xl font-bold">{Object.keys(groupedAssessments).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Verified Skills</p>
                    <p className="text-2xl font-bold">
                      {assessments.filter(a => a.assessment_type !== 'self_reported').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg. Proficiency</p>
                    <p className="text-2xl font-bold">
                      {assessments.length > 0 
                        ? (assessments.reduce((sum, a) => sum + a.proficiency_level, 0) / assessments.length).toFixed(1)
                        : '0'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Assessments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>Your latest skill evaluations</CardDescription>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No skill assessments yet</p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    Create Your First Assessment
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {assessments.slice(0, 5).map((assessment) => (
                    <div key={assessment.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        {getAssessmentTypeIcon(assessment.assessment_type)}
                        <div>
                          <p className="font-medium">{assessment.skill}</p>
                          <p className="text-sm text-gray-600">
                            {getAssessmentTypeLabel(assessment.assessment_type)} • 
                            {new Date(assessment.assessed_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getProficiencyColor(assessment.proficiency_level)}>
                          {getProficiencyLabel(assessment.proficiency_level)}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Confidence</p>
                          <p className="text-sm font-medium">{Math.round(assessment.confidence_score * 100)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          {Object.keys(groupedAssessments).length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Skills Assessed</h3>
                <p className="text-gray-600 mb-4">Start by adding your first skill assessment</p>
                <Button onClick={() => setShowCreateForm(true)}>
                  Add Skill Assessment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedAssessments).map(([skill, skillAssessments]) => {
                const latestAssessment = skillAssessments.sort((a, b) => 
                  new Date(b.assessed_at).getTime() - new Date(a.assessed_at).getTime()
                )[0];

                return (
                  <Card key={skill}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <span>{skill}</span>
                            <Badge className={getProficiencyColor(latestAssessment.proficiency_level)}>
                              {getProficiencyLabel(latestAssessment.proficiency_level)}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {skillAssessments.length} assessment{skillAssessments.length !== 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                        <Button size="sm" onClick={() => handleTakeTest(skill)} disabled={testLoading}>
                          <Brain className="h-4 w-4 mr-1" />
                          Take Test
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Proficiency Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Proficiency Level</span>
                          <span>{latestAssessment.proficiency_level}/5</span>
                        </div>
                        <Progress value={(latestAssessment.proficiency_level / 5) * 100} />
                      </div>

                      {/* Assessment History */}
                      <div>
                        <h4 className="font-medium mb-2">Assessment History</h4>
                        <div className="space-y-2">
                          {skillAssessments.map((assessment) => (
                            <div key={assessment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                {getAssessmentTypeIcon(assessment.assessment_type)}
                                <div>
                                  <p className="text-sm font-medium">
                                    {getAssessmentTypeLabel(assessment.assessment_type)}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {new Date(assessment.assessed_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className={getProficiencyColor(assessment.proficiency_level)} variant="outline">
                                  {getProficiencyLabel(assessment.proficiency_level)}
                                </Badge>
                                <p className="text-xs text-gray-600 mt-1">
                                  {Math.round(assessment.confidence_score * 100)}% confidence
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Evidence */}
                      {latestAssessment.evidence.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Evidence</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {latestAssessment.evidence.map((evidence, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span>•</span>
                                <span>{evidence}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skill Tests</CardTitle>
              <CardDescription>Take formal tests to validate your skills</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git'].map((skill) => (
                  <Card key={skill} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{skill}</h4>
                        <Brain className="h-5 w-5 text-blue-500" />
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Test your {skill} knowledge with our comprehensive assessment
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>~30 minutes</span>
                        <span>25 questions</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleTakeTest(skill)}
                        disabled={testLoading}
                      >
                        {testLoading ? 'Loading...' : 'Start Test'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Assessment Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle>Add Skill Assessment</CardTitle>
              <CardDescription>Evaluate your proficiency in a specific skill</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="skill">Skill</Label>
                <Input
                  id="skill"
                  placeholder="e.g., JavaScript, Python, React"
                  value={createForm.skill}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, skill: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="proficiency">Proficiency Level</Label>
                <Select value={createForm.proficiency_level.toString()} onValueChange={(value) => setCreateForm(prev => ({ ...prev, proficiency_level: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Beginner</SelectItem>
                    <SelectItem value="2">2 - Novice</SelectItem>
                    <SelectItem value="3">3 - Intermediate</SelectItem>
                    <SelectItem value="4">4 - Advanced</SelectItem>
                    <SelectItem value="5">5 - Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assessment-type">Assessment Type</Label>
                <Select value={createForm.assessment_type} onValueChange={(value) => setCreateForm(prev => ({ ...prev, assessment_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self_reported">Self-Reported</SelectItem>
                    <SelectItem value="github_analysis">GitHub Analysis</SelectItem>
                    <SelectItem value="peer_review">Peer Review</SelectItem>
                    <SelectItem value="formal_test">Formal Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="evidence">Evidence (Optional)</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    placeholder="e.g., Built 3 React apps, 2 years experience"
                    value={newEvidence}
                    onChange={(e) => setNewEvidence(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEvidence()}
                  />
                  <Button type="button" onClick={addEvidence}>Add</Button>
                </div>
                {createForm.evidence.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {createForm.evidence.map((evidence) => (
                      <Badge key={evidence} variant="secondary" className="cursor-pointer" onClick={() => removeEvidence(evidence)}>
                        {evidence} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleCreateAssessment} disabled={!createForm.skill}>
                  Create Assessment
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Modal */}
      {showTestModal && currentTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Skill Test</CardTitle>
              <CardDescription>
                Time remaining: {Math.floor(currentTest.time_limit / 60)} minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentTest.questions.map((question: any, index: number) => (
                <div key={index} className="space-y-3">
                  <h4 className="font-medium">
                    {index + 1}. {question.question}
                  </h4>
                  <div className="space-y-2">
                    {question.options.map((option: string, optionIndex: number) => (
                      <label key={optionIndex} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={option}
                          checked={testAnswers[index] === option}
                          onChange={(e) => {
                            const newAnswers = [...testAnswers];
                            newAnswers[index] = e.target.value;
                            setTestAnswers(newAnswers);
                          }}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex space-x-2 pt-4 border-t">
                <Button onClick={handleSubmitTest}>
                  Submit Test
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowTestModal(false);
                  setCurrentTest(null);
                  setTestAnswers([]);
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