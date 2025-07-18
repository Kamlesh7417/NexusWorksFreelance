'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Target, Users, Award, TrendingUp, Clock } from 'lucide-react';
import { LearningPathDisplay } from '@/components/learning/learning-path-display';
import { CourseEnrollment } from '@/components/learning/course-enrollment';
import { ShadowingManagement } from '@/components/learning/shadowing-management';
import { SkillAssessment } from '@/components/learning/skill-assessment';
import { LearningAnalytics } from '@/components/learning/learning-analytics';
import { learningService, LearningPath, Course, CourseEnrollment as CourseEnrollmentType } from '@/lib/services/learning-service';
import { isSuccessResponse } from '@/lib/api-client';
import { useAuth } from '@/components/auth/auth-provider';

export default function LearningPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollmentType[]>([]);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLearningData();
    }
  }, [user]);

  const loadLearningData = async () => {
    try {
      setLoading(true);
      const [pathsRes, enrollmentsRes, recommendationsRes, analyticsRes] = await Promise.all([
        learningService.getLearningPaths(),
        learningService.getCourseEnrollments(),
        learningService.getLearningRecommendations(),
        learningService.getLearningAnalytics()
      ]);

      if (isSuccessResponse(pathsRes)) setLearningPaths(pathsRes.data);
      if (isSuccessResponse(enrollmentsRes)) setEnrollments(enrollmentsRes.data);
      if (isSuccessResponse(recommendationsRes)) setRecommendations(recommendationsRes.data);
      if (isSuccessResponse(analyticsRes)) setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error loading learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p>Please log in to access the learning platform.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learning Platform</h1>
        <p className="text-gray-600">Advance your skills with personalized learning paths and mentorship</p>
      </div>

      {/* Quick Stats */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Courses Completed</p>
                  <p className="text-2xl font-bold">{analytics.courses_completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Skills Learned</p>
                  <p className="text-2xl font-bold">{analytics.skills_learned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Learning Hours</p>
                  <p className="text-2xl font-bold">{analytics.learning_hours}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Credits Earned</p>
                  <p className="text-2xl font-bold">{analytics.credits_earned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="shadowing">Shadowing</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Learning Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Current Learning Progress</CardTitle>
              <CardDescription>Your active learning paths and recent achievements</CardDescription>
            </CardHeader>
            <CardContent>
              {learningPaths.length > 0 ? (
                <div className="space-y-4">
                  {learningPaths.slice(0, 2).map((path) => (
                    <div key={path.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">Learning Path</h4>
                          <p className="text-sm text-gray-600">
                            Target: {path.target_skills.join(', ')}
                          </p>
                        </div>
                        <Badge variant="outline">{path.progress_percentage}% Complete</Badge>
                      </div>
                      <Progress value={path.progress_percentage} className="mb-2" />
                      <p className="text-xs text-gray-500">
                        Est. completion: {path.estimated_completion_time}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No learning paths yet</p>
                  <Button onClick={() => setActiveTab('paths')}>
                    Create Learning Path
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {recommendations && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Trending Skills</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.trending_skills?.map((skill: string) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Skill Gaps</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.skill_gaps?.map((skill: string) => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Enrollments */}
          {enrollments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Course Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {enrollments.slice(0, 3).map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Course #{enrollment.course}</p>
                        <p className="text-sm text-gray-600">
                          Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={enrollment.completed_at ? "default" : "secondary"}>
                          {enrollment.completed_at ? "Completed" : `${enrollment.progress_percentage}%`}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="paths">
          <LearningPathDisplay 
            learningPaths={learningPaths}
            onPathUpdate={loadLearningData}
          />
        </TabsContent>

        <TabsContent value="courses">
          <CourseEnrollment 
            enrollments={enrollments}
            onEnrollmentUpdate={loadLearningData}
          />
        </TabsContent>

        <TabsContent value="shadowing">
          <ShadowingManagement />
        </TabsContent>

        <TabsContent value="assessment">
          <SkillAssessment />
        </TabsContent>

        <TabsContent value="analytics">
          <LearningAnalytics analytics={analytics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}