'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  Award, 
  TrendingUp,
  Play,
  Clock,
  Star
} from 'lucide-react';

interface EnhancedLearningPageProps {
  onPageChange?: (page: string) => void;
}

export function EnhancedLearningPage({ onPageChange }: EnhancedLearningPageProps) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Developer Learning Hub</h1>
        <p className="text-gray-600">Enhance your skills with curated courses and hands-on projects</p>
      </div>

      {/* Featured Courses */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Featured Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Advanced React Patterns",
              description: "Master advanced React concepts and patterns",
              duration: "8 hours",
              level: "Advanced",
              rating: 4.8,
              students: 1234
            },
            {
              title: "Node.js Microservices",
              description: "Build scalable microservices with Node.js",
              duration: "12 hours",
              level: "Intermediate",
              rating: 4.9,
              students: 856
            },
            {
              title: "Python Data Science",
              description: "Complete guide to data science with Python",
              duration: "15 hours",
              level: "Beginner",
              rating: 4.7,
              students: 2341
            }
          ].map((course, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={course.level === 'Advanced' ? 'destructive' : course.level === 'Intermediate' ? 'default' : 'secondary'}>
                    {course.level}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm">{course.rating}</span>
                  </div>
                </div>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    {course.students} students
                  </div>
                </div>
                <Button className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Start Learning
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Learning Paths */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Learning Paths</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: "Full-Stack Developer",
              description: "Complete path from frontend to backend development",
              courses: 12,
              duration: "6 months",
              skills: ["React", "Node.js", "MongoDB", "TypeScript"]
            },
            {
              title: "DevOps Engineer",
              description: "Master deployment, monitoring, and infrastructure",
              courses: 8,
              duration: "4 months",
              skills: ["Docker", "Kubernetes", "AWS", "CI/CD"]
            }
          ].map((path, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{path.title}</CardTitle>
                <CardDescription>{path.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{path.courses} courses</span>
                    <span>{path.duration}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {path.skills.map((skill) => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                  <Button className="w-full">Start Path</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Skills Assessment */}
      <section className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8">
        <div className="text-center">
          <Award className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">Skill Assessment</h2>
          <p className="text-gray-600 mb-6">
            Test your knowledge and get personalized learning recommendations
          </p>
          <Button size="lg">Take Assessment</Button>
        </div>
      </section>
    </div>
  );
}