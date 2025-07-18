'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Target, Clock, Award, TrendingUp, Calendar, Flame, Trophy } from 'lucide-react';

interface LearningAnalyticsProps {
  analytics: {
    courses_completed: number;
    skills_learned: number;
    learning_hours: number;
    credits_earned: number;
    progress_by_skill: Record<string, number>;
    learning_streak: number;
  } | null;
}

export function LearningAnalytics({ analytics }: LearningAnalyticsProps) {
  const [timeframe, setTimeframe] = useState('30d');

  if (!analytics) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
          <p className="text-gray-600">Start learning to see your progress analytics</p>
        </CardContent>
      </Card>
    );
  }

  const skillProgressEntries = Object.entries(analytics.progress_by_skill || {});
  const topSkills = skillProgressEntries
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Learning Analytics</h2>
          <p className="text-gray-600">Track your learning progress and achievements</p>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Courses Completed</p>
                <p className="text-2xl font-bold">{analytics.courses_completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Skills Learned</p>
                <p className="text-2xl font-bold">{analytics.skills_learned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Learning Hours</p>
                <p className="text-2xl font-bold">{analytics.learning_hours}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Credits Earned</p>
                <p className="text-2xl font-bold">{analytics.credits_earned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Streak */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span>Learning Streak</span>
          </CardTitle>
          <CardDescription>Keep up your daily learning momentum</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-500">{analytics.learning_streak}</p>
              <p className="text-sm text-gray-600">Days</p>
            </div>
            <div className="flex-1">
              <div className="flex space-x-1">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-8 w-8 rounded ${
                      i < analytics.learning_streak % 7 
                        ? 'bg-orange-500' 
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
            </div>
          </div>
          {analytics.learning_streak > 0 && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-800">
                🔥 Great job! You've been learning consistently for {analytics.learning_streak} days. 
                Keep it up to maintain your streak!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skill Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Progress</CardTitle>
          <CardDescription>Your progress across different skills</CardDescription>
        </CardHeader>
        <CardContent>
          {topSkills.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No skill progress data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topSkills.map(([skill, progress]) => (
                <div key={skill} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{skill}</span>
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.courses_completed >= 1 && (
                <div className="flex items-center space-x-3 p-2 bg-yellow-50 rounded">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-sm">First Course Completed</p>
                    <p className="text-xs text-gray-600">Completed your first course</p>
                  </div>
                </div>
              )}
              
              {analytics.learning_streak >= 7 && (
                <div className="flex items-center space-x-3 p-2 bg-orange-50 rounded">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-sm">Week Warrior</p>
                    <p className="text-xs text-gray-600">7-day learning streak</p>
                  </div>
                </div>
              )}
              
              {analytics.skills_learned >= 5 && (
                <div className="flex items-center space-x-3 p-2 bg-green-50 rounded">
                  <Target className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">Skill Collector</p>
                    <p className="text-xs text-gray-600">Learned 5+ skills</p>
                  </div>
                </div>
              )}
              
              {analytics.learning_hours >= 50 && (
                <div className="flex items-center space-x-3 p-2 bg-purple-50 rounded">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-sm">Time Investor</p>
                    <p className="text-xs text-gray-600">50+ hours of learning</p>
                  </div>
                </div>
              )}

              {[analytics.courses_completed, analytics.learning_streak, analytics.skills_learned, analytics.learning_hours].every(v => v === 0) && (
                <div className="text-center py-4">
                  <p className="text-gray-600 text-sm">Complete courses and maintain streaks to unlock achievements!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span>Learning Goals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Weekly Goal */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Weekly Learning Goal</span>
                  <span className="text-sm text-gray-600">5 hours</span>
                </div>
                <Progress value={Math.min((analytics.learning_hours / 5) * 100, 100)} />
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.learning_hours >= 5 ? '✅ Goal achieved!' : `${5 - analytics.learning_hours} hours remaining`}
                </p>
              </div>

              {/* Monthly Goal */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Monthly Course Goal</span>
                  <span className="text-sm text-gray-600">2 courses</span>
                </div>
                <Progress value={Math.min((analytics.courses_completed / 2) * 100, 100)} />
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.courses_completed >= 2 ? '✅ Goal achieved!' : `${2 - analytics.courses_completed} courses remaining`}
                </p>
              </div>

              {/* Skill Goal */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Skill Mastery Goal</span>
                  <span className="text-sm text-gray-600">3 skills</span>
                </div>
                <Progress value={Math.min((analytics.skills_learned / 3) * 100, 100)} />
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.skills_learned >= 3 ? '✅ Goal achieved!' : `${3 - analytics.skills_learned} skills remaining`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span>Learning Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Strengths</h4>
              <div className="space-y-2">
                {analytics.learning_streak > 0 && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Consistent daily learning</span>
                  </div>
                )}
                {analytics.courses_completed > 0 && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Course completion rate</span>
                  </div>
                )}
                {topSkills.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Diverse skill development</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Recommendations</h4>
              <div className="space-y-2">
                {analytics.learning_streak === 0 && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Start a daily learning routine</span>
                  </div>
                )}
                {analytics.courses_completed === 0 && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Complete your first course</span>
                  </div>
                )}
                {topSkills.length < 3 && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Explore more skill areas</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Set weekly learning goals</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}