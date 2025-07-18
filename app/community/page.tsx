'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Trophy, Video, MessageSquare, TrendingUp } from 'lucide-react';
import { CommunityEvents } from '@/components/community/community-events';
import { HackathonManagement } from '@/components/community/hackathon-management';
import { VirtualMeetups } from '@/components/community/virtual-meetups';
import { CommunityDiscussions } from '@/components/community/community-discussions';
import { MarketplacePage } from '@/components/pages/marketplace-page';
import { communityService, CommunityEvent, Hackathon } from '@/lib/services/community-service';
import { isSuccessResponse } from '@/lib/api-client';
import { useAuth } from '@/components/auth/auth-provider';

export default function CommunityPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [trending, setTrending] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCommunityData();
    }
  }, [user]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const [eventsRes, hackathonsRes, statsRes, trendingRes] = await Promise.all([
        communityService.getEvents({ status: 'upcoming' }),
        communityService.getHackathons({ status: 'registration' }),
        communityService.getCommunityStats(),
        communityService.getTrendingTopics()
      ]);

      if (isSuccessResponse(eventsRes)) setEvents(eventsRes.data.results || []);
      if (isSuccessResponse(hackathonsRes)) setHackathons(hackathonsRes.data.results || []);
      if (isSuccessResponse(statsRes)) setStats(statsRes.data);
      if (isSuccessResponse(trendingRes)) setTrending(trendingRes.data);
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p>Please log in to access the community features.</p>
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
        <h1 className="text-3xl font-bold mb-2">Community Hub</h1>
        <p className="text-gray-600">Connect, learn, and collaborate with fellow developers</p>
      </div>

      {/* Community Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Members</p>
                  <p className="text-2xl font-bold">{stats.total_members}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Active Events</p>
                  <p className="text-2xl font-bold">{stats.active_events}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Hackathons</p>
                  <p className="text-2xl font-bold">{stats.upcoming_hackathons}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Posts</p>
                  <p className="text-2xl font-bold">{stats.total_posts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Growth</p>
                  <p className="text-2xl font-bold">+{stats.monthly_growth}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="hackathons">Hackathons</TabsTrigger>
          <TabsTrigger value="meetups">Meetups</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Trending Topics */}
          {trending && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Trending Topics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {trending.topics?.map((topic: string) => (
                      <Badge key={topic} variant="secondary">{topic}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Popular Skills</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {trending.popular_skills?.map((skill: string) => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Upcoming Events</CardTitle>
                <Button size="sm" onClick={() => setActiveTab('events')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(event.start_date).toLocaleDateString()} • {event.event_type}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={event.is_virtual ? "secondary" : "outline"}>
                          {event.is_virtual ? "Virtual" : "In-Person"}
                        </Badge>
                        <Button size="sm">Join</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Hackathons */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Active Hackathons</CardTitle>
                <Button size="sm" onClick={() => setActiveTab('hackathons')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {hackathons.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active hackathons</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hackathons.slice(0, 2).map((hackathon) => (
                    <div key={hackathon.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{hackathon.title}</h4>
                          <p className="text-sm text-gray-600">{hackathon.theme}</p>
                        </div>
                        <Badge variant="outline">{hackathon.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>
                          {hackathon.current_teams}/{hackathon.max_teams} teams
                        </span>
                        <span>
                          Ends: {new Date(hackathon.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex space-x-1">
                          {hackathon.prizes.slice(0, 2).map((prize, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              ${prize.value}
                            </Badge>
                          ))}
                        </div>
                        <Button size="sm">Register</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Discussions */}
          {trending?.active_discussions && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Active Discussions</CardTitle>
                  <Button size="sm" onClick={() => setActiveTab('discussions')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trending.active_discussions.slice(0, 3).map((post: any) => (
                    <div key={post.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{post.title}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Badge variant="outline" className="text-xs">{post.post_type}</Badge>
                          <span>{post.comments_count} comments</span>
                          <span>{post.likes_count} likes</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="events">
          <CommunityEvents 
            events={events}
            onEventsUpdate={loadCommunityData}
          />
        </TabsContent>

        <TabsContent value="hackathons">
          <HackathonManagement 
            hackathons={hackathons}
            onHackathonsUpdate={loadCommunityData}
          />
        </TabsContent>

        <TabsContent value="meetups">
          <VirtualMeetups />
        </TabsContent>

        <TabsContent value="discussions">
          <CommunityDiscussions />
        </TabsContent>

        <TabsContent value="marketplace">
          <MarketplacePage />
        </TabsContent>
      </Tabs>
    </div>
  );
}