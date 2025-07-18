'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  Heart, 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Clock, 
  DollarSign,
  MapPin,
  Award,
  Eye,
  MessageSquare,
  ExternalLink,
  Bookmark,
  Crown
} from 'lucide-react';
import { marketplaceService, FeaturedProject, FeaturedDeveloper } from '@/lib/services/marketplace-service';
import { useAuth } from '@/components/auth/auth-provider';

interface MarketplacePageProps {
  onPageChange?: (page: string) => void;
}

export function MarketplacePage({ onPageChange }: MarketplacePageProps = {}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<FeaturedProject[]>([]);
  const [developers, setDevelopers] = useState<FeaturedDeveloper[]>([]);
  const [selectedProject, setSelectedProject] = useState<FeaturedProject | null>(null);
  const [selectedDeveloper, setSelectedDeveloper] = useState<FeaturedDeveloper | null>(null);
  const [trends, setTrends] = useState<any>(null);
  const [favorites, setFavorites] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [projectFilters, setProjectFilters] = useState({
    skills_required: '',
    complexity_level: '',
    budget_range: '',
    project_type: ''
  });
  const [developerFilters, setDeveloperFilters] = useState({
    skills: '',
    experience_years: '',
    hourly_rate_min: '',
    hourly_rate_max: '',
    availability_status: '',
    rating_min: ''
  });

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  useEffect(() => {
    if (activeTab === 'projects') {
      loadProjects();
    } else if (activeTab === 'developers') {
      loadDevelopers();
    }
  }, [activeTab, projectFilters, developerFilters]);

  const loadMarketplaceData = async () => {
    try {
      const [trendsRes, favoritesRes] = await Promise.all([
        marketplaceService.getMarketplaceTrends(),
        marketplaceService.getFavorites()
      ]);

      if (trendsRes.success) setTrends(trendsRes.data);
      if (favoritesRes.success) setFavorites(favoritesRes.data);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await marketplaceService.getFeaturedProjects(projectFilters);
      if (response.success) {
        setProjects(response.data.results || []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDevelopers = async () => {
    try {
      setLoading(true);
      const response = await marketplaceService.getFeaturedDevelopers(developerFilters);
      if (response.success) {
        setDevelopers(response.data.results || []);
      }
    } catch (error) {
      console.error('Error loading developers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToProject = async (projectId: string) => {
    // This would open an application modal
    console.log('Apply to project:', projectId);
  };

  const handleContactDeveloper = async (developerId: string) => {
    // This would open a contact modal
    console.log('Contact developer:', developerId);
  };

  const handleAddToFavorites = async (type: 'project' | 'developer', id: string) => {
    try {
      await marketplaceService.addToFavorites(type, id);
      loadMarketplaceData();
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-orange-100 text-orange-800';
      case 'enterprise': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatBudgetRange = (range: string) => {
    return range.replace('-', ' - $');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
        <p className="text-gray-600">Discover featured projects and top developers</p>
      </div>

      {/* Trending Section */}
      {trends && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Market Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2">Trending Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {trends.trending_skills?.slice(0, 5).map((skill: string) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Popular Project Types</h4>
                <div className="flex flex-wrap gap-2">
                  {trends.popular_project_types?.slice(0, 4).map((type: string) => (
                    <Badge key={type} variant="outline">{type}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Average Rates</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(trends.average_rates || {}).slice(0, 3).map(([skill, rate]) => (
                    <div key={skill} className="flex justify-between">
                      <span>{skill}</span>
                      <span>${rate}/hr</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects">Featured Projects</TabsTrigger>
          <TabsTrigger value="developers">Top Developers</TabsTrigger>
          <TabsTrigger value="favorites">My Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          {/* Project Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Skills Required</Label>
                  <Input
                    placeholder="e.g., React, Python"
                    value={projectFilters.skills_required}
                    onChange={(e) => setProjectFilters(prev => ({ ...prev, skills_required: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Complexity</Label>
                  <Select value={projectFilters.complexity_level} onValueChange={(value) => setProjectFilters(prev => ({ ...prev, complexity_level: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All levels</SelectItem>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="complex">Complex</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Budget Range</Label>
                  <Select value={projectFilters.budget_range} onValueChange={(value) => setProjectFilters(prev => ({ ...prev, budget_range: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All budgets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All budgets</SelectItem>
                      <SelectItem value="1000-5000">$1K - $5K</SelectItem>
                      <SelectItem value="5000-15000">$5K - $15K</SelectItem>
                      <SelectItem value="15000-50000">$15K - $50K</SelectItem>
                      <SelectItem value="50000+">$50K+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Project Type</Label>
                  <Input
                    placeholder="e.g., Web App, Mobile"
                    value={projectFilters.project_type}
                    onChange={(e) => setProjectFilters(prev => ({ ...prev, project_type: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
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
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Featured Projects</h3>
                <p className="text-gray-600">Try adjusting your filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        {project.is_featured && <Crown className="h-4 w-4 text-yellow-500" />}
                        <Badge className={getComplexityColor(project.complexity_level)}>
                          {project.complexity_level}
                        </Badge>
                      </div>
                      <button
                        onClick={() => handleAddToFavorites('project', project.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Heart className="h-4 w-4" />
                      </button>
                    </div>

                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{project.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">{project.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span>{formatBudgetRange(project.budget_range)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{project.duration_estimate}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{project.applications_count} applications</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {project.skills_required.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                        ))}
                        {project.skills_required.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.skills_required.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedProject(project)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApplyToProject(project.id)}
                        className="flex-1"
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

        <TabsContent value="developers" className="space-y-6">
          {/* Developer Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Skills</Label>
                  <Input
                    placeholder="e.g., React, Python"
                    value={developerFilters.skills}
                    onChange={(e) => setDeveloperFilters(prev => ({ ...prev, skills: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Experience</Label>
                  <Select value={developerFilters.experience_years} onValueChange={(value) => setDeveloperFilters(prev => ({ ...prev, experience_years: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All levels</SelectItem>
                      <SelectItem value="0-2">0-2 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="6-10">6-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hourly Rate</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={developerFilters.hourly_rate_min}
                      onChange={(e) => setDeveloperFilters(prev => ({ ...prev, hourly_rate_min: e.target.value }))}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={developerFilters.hourly_rate_max}
                      onChange={(e) => setDeveloperFilters(prev => ({ ...prev, hourly_rate_max: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Availability</Label>
                  <Select value={developerFilters.availability_status} onValueChange={(value) => setDeveloperFilters(prev => ({ ...prev, availability_status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Developers Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
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
          ) : developers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Featured Developers</h3>
                <p className="text-gray-600">Try adjusting your filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {developers.map((developer) => (
                <Card key={developer.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        {developer.is_featured && <Crown className="h-4 w-4 text-yellow-500" />}
                        <Badge className={getAvailabilityColor(developer.availability_status)}>
                          {developer.availability_status}
                        </Badge>
                      </div>
                      <button
                        onClick={() => handleAddToFavorites('developer', developer.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Heart className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-center mb-4">
                      <h3 className="font-semibold text-lg">{developer.username}</h3>
                      <p className="text-gray-600 text-sm">{developer.title}</p>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{developer.bio}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>{developer.rating}</span>
                        </div>
                        <span>{developer.completed_projects} projects</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>{developer.experience_years} years exp.</span>
                        <span>${developer.hourly_rate}/hr</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {developer.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                        ))}
                        {developer.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{developer.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDeveloper(developer)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Profile
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleContactDeveloper(developer.id)}
                        className="flex-1"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6">
          {!favorites ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bookmark className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
                <p className="text-gray-600">Save projects and developers you're interested in</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Favorite Projects */}
              {favorites.projects && favorites.projects.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Favorite Projects</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.projects.map((project: FeaturedProject) => (
                      <Card key={project.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-3">
                            <Badge className={getComplexityColor(project.complexity_level)}>
                              {project.complexity_level}
                            </Badge>
                            <Heart className="h-4 w-4 text-red-500 fill-current" />
                          </div>
                          <h4 className="font-semibold mb-2">{project.title}</h4>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{formatBudgetRange(project.budget_range)}</span>
                            <Button size="sm" variant="outline">View</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Favorite Developers */}
              {favorites.developers && favorites.developers.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Favorite Developers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.developers.map((developer: FeaturedDeveloper) => (
                      <Card key={developer.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-3">
                            <Badge className={getAvailabilityColor(developer.availability_status)}>
                              {developer.availability_status}
                            </Badge>
                            <Heart className="h-4 w-4 text-red-500 fill-current" />
                          </div>
                          <div className="text-center mb-3">
                            <h4 className="font-semibold">{developer.username}</h4>
                            <p className="text-gray-600 text-sm">{developer.title}</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm">{developer.rating}</span>
                            </div>
                            <Button size="sm" variant="outline">Contact</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedProject.title}</CardTitle>
                  <CardDescription>
                    {selectedProject.project_type} • {formatBudgetRange(selectedProject.budget_range)}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedProject(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-600">{selectedProject.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Project Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Complexity:</strong> {selectedProject.complexity_level}</p>
                    <p><strong>Duration:</strong> {selectedProject.duration_estimate}</p>
                    <p><strong>Applications:</strong> {selectedProject.applications_count}</p>
                    <p><strong>Status:</strong> {selectedProject.status}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.skills_required.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t">
                <Button onClick={() => setSelectedProject(null)}>
                  Close
                </Button>
                <Button onClick={() => handleApplyToProject(selectedProject.id)}>
                  Apply to Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Developer Profile Modal */}
      {selectedDeveloper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedDeveloper.username}</CardTitle>
                  <CardDescription>{selectedDeveloper.title}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedDeveloper(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">About</h4>
                <p className="text-gray-600">{selectedDeveloper.bio}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Experience</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Years:</strong> {selectedDeveloper.experience_years}</p>
                    <p><strong>Projects:</strong> {selectedDeveloper.completed_projects}</p>
                    <p><strong>Rating:</strong> {selectedDeveloper.rating}/5</p>
                    <p><strong>Rate:</strong> ${selectedDeveloper.hourly_rate}/hr</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDeveloper.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {selectedDeveloper.portfolio_items && selectedDeveloper.portfolio_items.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Portfolio</h4>
                  <div className="space-y-2">
                    {selectedDeveloper.portfolio_items.slice(0, 3).map((item) => (
                      <div key={item.id} className="border rounded p-3">
                        <h5 className="font-medium">{item.title}</h5>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.technologies.map((tech) => (
                            <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-4 border-t">
                <Button onClick={() => setSelectedDeveloper(null)}>
                  Close
                </Button>
                <Button onClick={() => handleContactDeveloper(selectedDeveloper.id)}>
                  Contact Developer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}