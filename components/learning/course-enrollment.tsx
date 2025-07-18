'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Search, Filter, Star, Users, Clock, Award, Play, CheckCircle } from 'lucide-react';
import { learningService, Course, CourseEnrollment as CourseEnrollmentType } from '@/lib/services/learning-service';

interface CourseEnrollmentProps {
  enrollments: CourseEnrollmentType[];
  onEnrollmentUpdate: () => void;
}

export function CourseEnrollment({ enrollments, onEnrollmentUpdate }: CourseEnrollmentProps) {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [availableCourses, searchTerm, skillFilter, difficultyFilter, freeOnly]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await learningService.getCourses();
      if (response.success) {
        setAvailableCourses(response.data.results || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = availableCourses;

    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (skillFilter) {
      filtered = filtered.filter(course => 
        course.skills_covered.some(skill => 
          skill.toLowerCase().includes(skillFilter.toLowerCase())
        )
      );
    }

    if (difficultyFilter) {
      filtered = filtered.filter(course => course.difficulty === difficultyFilter);
    }

    if (freeOnly) {
      filtered = filtered.filter(course => course.is_free);
    }

    setFilteredCourses(filtered);
  };

  const handleEnrollment = async (courseId: string) => {
    try {
      const response = await learningService.enrollInCourse(courseId);
      if (response.success) {
        onEnrollmentUpdate();
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };

  const handleProgressUpdate = async (enrollmentId: string, progress: number) => {
    try {
      const response = await learningService.updateCourseProgress(enrollmentId, {
        progress_percentage: progress
      });
      if (response.success) {
        onEnrollmentUpdate();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleCourseCompletion = async (enrollmentId: string) => {
    try {
      const response = await learningService.completeCourse(enrollmentId);
      if (response.success) {
        onEnrollmentUpdate();
      }
    } catch (error) {
      console.error('Error completing course:', error);
    }
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some(enrollment => enrollment.course === courseId);
  };

  const getEnrollment = (courseId: string) => {
    return enrollments.find(enrollment => enrollment.course === courseId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Courses</h2>
        <p className="text-gray-600">Discover and enroll in courses to advance your skills</p>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">Browse Courses</TabsTrigger>
          <TabsTrigger value="enrolled">My Enrollments ({enrollments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Input
                    placeholder="Filter by skill..."
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                  />
                </div>
                <div>
                  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="free-only"
                    checked={freeOnly}
                    onChange={(e) => setFreeOnly(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="free-only" className="text-sm">Free only</label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const enrollment = getEnrollment(course.id);
                const enrolled = isEnrolled(course.id);

                return (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    {course.thumbnail_url && (
                      <div className="h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg line-clamp-2">{course.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <Badge variant="outline" className="capitalize">
                            {course.difficulty}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>{course.rating}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {course.skills_covered.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {course.skills_covered.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{course.skills_covered.length - 3}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{course.enrollment_count}</span>
                          </div>
                        </div>

                        {enrolled && enrollment && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{enrollment.progress_percentage}%</span>
                            </div>
                            <Progress value={enrollment.progress_percentage} />
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <span className="font-semibold">
                            {course.is_free ? 'Free' : `$${course.price}`}
                          </span>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCourse(course)}
                            >
                              Details
                            </Button>
                            {enrolled ? (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <Play className="h-4 w-4 mr-1" />
                                Continue
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleEnrollment(course.id)}
                              >
                                Enroll
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredCourses.length === 0 && !loading && (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Courses Found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="enrolled" className="space-y-6">
          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Enrollments Yet</h3>
                <p className="text-gray-600 mb-4">Start learning by enrolling in your first course</p>
                <Button onClick={() => document.querySelector('[value="browse"]')?.click()}>
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">Course #{enrollment.course}</h3>
                        <p className="text-sm text-gray-600">
                          Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={enrollment.completed_at ? "default" : "secondary"}>
                        {enrollment.completed_at ? "Completed" : "In Progress"}
                      </Badge>
                    </div>

                    {!enrollment.completed_at && (
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{enrollment.progress_percentage}%</span>
                        </div>
                        <Progress value={enrollment.progress_percentage} />
                      </div>
                    )}

                    {enrollment.completed_at && (
                      <div className="flex items-center space-x-2 mb-4 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm">
                          Completed on {new Date(enrollment.completed_at).toLocaleDateString()}
                        </span>
                        {enrollment.certificate_url && (
                          <Button size="sm" variant="outline" className="ml-auto">
                            <Award className="h-4 w-4 mr-1" />
                            Certificate
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        {enrollment.completed_at ? "Review" : "Continue"}
                      </Button>
                      {!enrollment.completed_at && enrollment.progress_percentage >= 90 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCourseCompletion(enrollment.id)}
                        >
                          Mark Complete
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

      {/* Course Details Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedCourse.title}</CardTitle>
                  <CardDescription>by {selectedCourse.instructor}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedCourse(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{selectedCourse.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Duration:</strong> {selectedCourse.duration}
                </div>
                <div>
                  <strong>Difficulty:</strong> {selectedCourse.difficulty}
                </div>
                <div>
                  <strong>Rating:</strong> ★ {selectedCourse.rating}
                </div>
                <div>
                  <strong>Enrolled:</strong> {selectedCourse.enrollment_count} students
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Skills You'll Learn</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCourse.skills_covered.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>

              {selectedCourse.prerequisites.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Prerequisites</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {selectedCourse.prerequisites.map((prereq, index) => (
                      <li key={index}>{prereq}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-xl font-bold">
                  {selectedCourse.is_free ? 'Free' : `$${selectedCourse.price}`}
                </span>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setSelectedCourse(null)}>
                    Close
                  </Button>
                  {isEnrolled(selectedCourse.id) ? (
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Play className="h-4 w-4 mr-1" />
                      Continue Learning
                    </Button>
                  ) : (
                    <Button onClick={() => handleEnrollment(selectedCourse.id)}>
                      Enroll Now
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}