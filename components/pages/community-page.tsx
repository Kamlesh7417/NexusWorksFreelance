'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  Trophy,
  Heart,
  Share,
  Eye,
  Clock
} from 'lucide-react';

interface CommunityPageProps {
  onPageChange?: (page: string) => void;
}

export function CommunityPage({ onPageChange }: CommunityPageProps) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Developer Community</h1>
        <p className="text-gray-600">Connect, learn, and grow with fellow developers</p>
      </div>

      {/* Community Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: Users, label: "Active Members", value: "15.2K" },
          { icon: MessageSquare, label: "Discussions", value: "3.4K" },
          { icon: Calendar, label: "Events This Month", value: "24" },
          { icon: Trophy, label: "Challenges", value: "12" }
        ].map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="pt-6">
              <stat.icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Recent Discussions */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Recent Discussions</h2>
        <div className="space-y-4">
          {[
            {
              title: "Best practices for React state management in 2024",
              author: "Sarah Chen",
              replies: 23,
              views: 1240,
              time: "2 hours ago",
              tags: ["React", "State Management", "Best Practices"]
            },
            {
              title: "How to optimize database queries for large datasets?",
              author: "Mike Johnson",
              replies: 15,
              views: 890,
              time: "4 hours ago",
              tags: ["Database", "Performance", "SQL"]
            },
            {
              title: "Transitioning from monolith to microservices",
              author: "Alex Rodriguez",
              replies: 31,
              views: 2100,
              time: "6 hours ago",
              tags: ["Architecture", "Microservices", "DevOps"]
            }
          ].map((discussion, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg hover:text-blue-600 cursor-pointer">
                    {discussion.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {discussion.views}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {discussion.replies}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {discussion.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>by {discussion.author}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {discussion.time}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: "React Advanced Patterns Workshop",
              date: "Jan 25, 2024",
              time: "2:00 PM EST",
              attendees: 156,
              type: "Workshop"
            },
            {
              title: "AI in Software Development Panel",
              date: "Jan 28, 2024",
              time: "6:00 PM EST",
              attendees: 89,
              type: "Panel"
            },
            {
              title: "Monthly Code Review Session",
              date: "Feb 1, 2024",
              time: "4:00 PM EST",
              attendees: 234,
              type: "Review"
            }
          ].map((event, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge variant="outline">{event.type}</Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    {event.attendees}
                  </div>
                </div>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription>
                  {event.date} at {event.time}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button size="sm">Join Event</Button>
                  <Button size="sm" variant="outline">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Community Guidelines */}
      <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8">
        <div className="text-center">
          <Users className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">Join Our Community</h2>
          <p className="text-gray-600 mb-6">
            Be part of a supportive community of developers helping each other grow
          </p>
          <div className="flex gap-4 justify-center">
            <Button>Start Discussion</Button>
            <Button variant="outline">View Guidelines</Button>
          </div>
        </div>
      </section>
    </div>
  );
}