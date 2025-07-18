'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Target, Clock, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';
import { learningService, LearningPath, Course } from '@/lib/services/learning-service';

interface LearningPathDisplayProps {
  learningPaths: LearningPath[];
  onPathUpdate: () => void;
}

export function LearningPathDisplay({ learningPaths, onPathUpdate }: LearningPathDisplayProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [createForm, setCreateForm] = useState({
    target_skills: [] as string[],
    target_role: '',
    timeline_preference: '',
    learning_style: ''
  });
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreatePath = async () => {
    if (createForm.target_skills.length === 0) return;

    try {
      setLoading(true);
      const response = await learningService.createLearningPath(createForm);
      if (response.success) {
        setShowCreateForm(false);
        setCreateForm({
          target_skills: [],
          target_role: '',
          timeline_preference: '',
          learning_style: ''
        });
        onPathUpdate();
      }
    } catch (error) {
      console.error('Error creating learning path:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !createForm.target_skills.includes(newSkill.trim())) {
      setCreateForm(prev => ({
        ...prev,
        target_skills: [...prev.target_skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setCreateForm(prev => ({
      ...prev,
      target_skills: prev.target_skills.filter(s => s !== skill)
    }));
  };

  const handleUpdateProgress = async (pathId: string, completedSkills: string[]) => {
    try {
      const response = await learningService.updateLearningPathProgress(pathId, completedSkills);
      if (response.success) {
        onPathUpdate();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Learning Paths</h2>
          <p className="text-gray-600">Personalized roadmaps to achieve your career goals</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Path
        </Button>
      </div>

      {/* Create Learning Path Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Learning Path</CardTitle>
            <CardDescription>Define your learning goals and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="target-skills">Target Skills</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="target-skills"
                  placeholder="Enter a skill (e.g., React, Python, Machine Learning)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button type="button" onClick={addSkill}>Add</Button>
              </div>
              {createForm.target_skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {createForm.target_skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                      {skill} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="target-role">Target Role (Optional)</Label>
              <Input
                id="target-role"
                placeholder="e.g., Full Stack Developer, Data Scientist"
                value={createForm.target_role}
                onChange={(e) => setCreateForm(prev => ({ ...prev, target_role: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="timeline">Timeline Preference</Label>
              <Select value={createForm.timeline_preference} onValueChange={(value) => setCreateForm(prev => ({ ...prev, timeline_preference: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-3 months">1-3 months</SelectItem>
                  <SelectItem value="3-6 months">3-6 months</SelectItem>
                  <SelectItem value="6-12 months">6-12 months</SelectItem>
                  <SelectItem value="1+ years">1+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="learning-style">Learning Style</Label>
              <Select value={createForm.learning_style} onValueChange={(value) => setCreateForm(prev => ({ ...prev, learning_style: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select learning style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visual">Visual (videos, diagrams)</SelectItem>
                  <SelectItem value="hands-on">Hands-on (projects, coding)</SelectItem>
                  <SelectItem value="reading">Reading (documentation, articles)</SelectItem>
                  <SelectItem value="mixed">Mixed approach</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleCreatePath} disabled={loading || createForm.target_skills.length === 0}>
                {loading ? 'Creating...' : 'Create Learning Path'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Paths List */}
      {learningPaths.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Learning Paths Yet</h3>
            <p className="text-gray-600 mb-4">Create your first personalized learning path to get started</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Path
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {learningPaths.map((path) => (
            <Card key={path.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Learning Path</span>
                    </CardTitle>
                    <CardDescription>
                      Created {new Date(path.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={path.progress_percentage === 100 ? "default" : "secondary"}>
                    {path.progress_percentage}% Complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{path.progress_percentage}%</span>
                  </div>
                  <Progress value={path.progress_percentage} />
                </div>

                {/* Current Skills */}
                <div>
                  <h4 className="font-medium mb-2">Current Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {path.current_skills.map((skill) => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>

                {/* Target Skills */}
                <div>
                  <h4 className="font-medium mb-2">Target Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {path.target_skills.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>

                {/* Recommended Courses */}
                {path.recommended_courses && path.recommended_courses.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recommended Courses</h4>
                    <div className="space-y-2">
                      {path.recommended_courses.slice(0, 3).map((course) => (
                        <div key={course.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="font-medium text-sm">{course.title}</p>
                              <p className="text-xs text-gray-600">{course.duration} • {course.difficulty}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Est. completion: {path.estimated_completion_time}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button 
                    size="sm" 
                    onClick={() => setSelectedPath(path)}
                  >
                    View Details
                  </Button>
                  {path.progress_percentage < 100 && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleUpdateProgress(path.id, path.current_skills)}
                    >
                      Update Progress
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Path Details Modal/Expanded View */}
      {selectedPath && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>Learning Path Details</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedPath(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Detailed Progress */}
            <div>
              <h4 className="font-medium mb-3">Skill Progress</h4>
              <div className="space-y-3">
                {selectedPath.target_skills.map((skill) => {
                  const isCompleted = selectedPath.current_skills.includes(skill);
                  return (
                    <div key={skill} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                        )}
                        <span className={isCompleted ? 'line-through text-gray-500' : ''}>{skill}</span>
                      </div>
                      <Badge variant={isCompleted ? "default" : "outline"}>
                        {isCompleted ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All Recommended Courses */}
            {selectedPath.recommended_courses && selectedPath.recommended_courses.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">All Recommended Courses</h4>
                <div className="grid gap-3">
                  {selectedPath.recommended_courses.map((course) => (
                    <div key={course.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-medium">{course.title}</h5>
                          <p className="text-sm text-gray-600">{course.description}</p>
                        </div>
                        <Badge variant="outline">{course.difficulty}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{course.duration}</span>
                          <span>★ {course.rating}</span>
                          <span>{course.enrollment_count} enrolled</span>
                        </div>
                        <div className="flex space-x-2">
                          <span className="text-sm font-medium">
                            {course.is_free ? 'Free' : `$${course.price}`}
                          </span>
                          <Button size="sm">
                            {course.is_free ? 'Enroll' : 'View'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}