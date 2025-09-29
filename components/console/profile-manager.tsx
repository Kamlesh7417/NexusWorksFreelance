'use client';

import { useState, useEffect } from 'react';
import { useDjangoAuth } from '@/components/auth/django-auth-provider';
import { useFormWithRetry } from '@/lib/hooks/use-error-recovery';
import { LoadingOverlay, RetryButton } from './loading-states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Github, 
  Building, 
  DollarSign, 
  Star, 
  Plus, 
  X, 
  Save, 
  Upload,
  FileText,
  Link,
  Award,
  Briefcase
} from 'lucide-react';

interface ProfileFormData {
  full_name: string;
  email: string;
  github_username: string;
  company: string;
  hourly_rate: number;
  experience_level: string;
  bio: string;
  location: string;
  website: string;
  phone: string;
}

interface Skill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  url: string;
  image_url?: string;
  technologies: string[];
  type: 'project' | 'article' | 'certificate';
}

export function ProfileManager() {
  const { user, loading } = useDjangoAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    email: '',
    github_username: '',
    company: '',
    hourly_rate: 0,
    experience_level: 'Intermediate',
    bio: '',
    location: '',
    website: '',
    phone: ''
  });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Intermediate' as const });
  const [newPortfolioItem, setNewPortfolioItem] = useState<Partial<PortfolioItem>>({
    title: '',
    description: '',
    url: '',
    technologies: [],
    type: 'project'
  });
  const [activeTab, setActiveTab] = useState('basic');
  
  // Use form retry hook for better error handling
  const { 
    submitForm, 
    isSubmitting, 
    submitError, 
    clearError,
    retryCount,
    canRetry 
  } = useFormWithRetry();

  // Initialize form data from profile
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: `${user.first_name} ${user.last_name}`.trim() || '',
        email: user.email || '',
        github_username: user.github_username || '',
        company: '', // TODO: Add to user model
        hourly_rate: 0, // TODO: Add to user model  
        experience_level: 'Intermediate',
        bio: user.bio || '',
        location: user.location || '',
        website: '', // TODO: Add to user model
        phone: '' // TODO: Add to user model
      });

      // Initialize with empty skills for now
      // TODO: Load skills from Django backend
      setSkills([]);

      // Initialize portfolio items (mock data for now)
      setPortfolioItems([
        {
          id: '1',
          title: 'E-commerce Platform',
          description: 'Full-stack e-commerce solution built with React and Node.js',
          url: 'https://github.com/example/ecommerce',
          technologies: ['React', 'Node.js', 'MongoDB'],
          type: 'project'
        },
        {
          id: '2',
          title: 'AWS Certified Developer',
          description: 'AWS Certified Developer - Associate certification',
          url: 'https://aws.amazon.com/certification/',
          technologies: ['AWS', 'Cloud Computing'],
          type: 'certificate'
        }
      ]);
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    clearError();
    
    const result = await submitForm(async () => {
      // Simulate API call with potential failure
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate random failures for demonstration
      if (Math.random() < 0.3) {
        throw new Error('Network error occurred');
      }
      
      return { success: true, message: 'Profile updated successfully!' };
    });
    
    if (result) {
      // Success - could show a success message
      console.log('Profile saved successfully');
    }
  };

  const addSkill = () => {
    if (newSkill.name.trim() && !skills.find(s => s.name.toLowerCase() === newSkill.name.toLowerCase())) {
      setSkills(prev => [...prev, { ...newSkill }]);
      setNewSkill({ name: '', level: 'Intermediate' });
    }
  };

  const removeSkill = (skillName: string) => {
    setSkills(prev => prev.filter(s => s.name !== skillName));
  };

  const addPortfolioItem = () => {
    if (newPortfolioItem.title && newPortfolioItem.url) {
      const item: PortfolioItem = {
        id: Date.now().toString(),
        title: newPortfolioItem.title,
        description: newPortfolioItem.description || '',
        url: newPortfolioItem.url,
        technologies: newPortfolioItem.technologies || [],
        type: newPortfolioItem.type || 'project'
      };
      setPortfolioItems(prev => [...prev, item]);
      setNewPortfolioItem({
        title: '',
        description: '',
        url: '',
        technologies: [],
        type: 'project'
      });
    }
  };

  const removePortfolioItem = (id: string) => {
    setPortfolioItems(prev => prev.filter(item => item.id !== id));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Profile Management</h1>
        <p className="text-gray-400">Manage your profile information, skills, and portfolio</p>
      </div>

      {submitError && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-700 text-red-400">
          <div className="flex items-center justify-between">
            <span>{submitError}</span>
            {canRetry && (
              <RetryButton onRetry={handleSave} isLoading={isSubmitting}>
                Retry ({retryCount}/3)
              </RetryButton>
            )}
          </div>
        </div>
      )}

      <LoadingOverlay isLoading={isSubmitting} message="Saving profile...">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border border-gray-700">
          <TabsTrigger value="basic" className="data-[state=active]:bg-cyan-600">
            <User className="w-4 h-4 mr-2" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="skills" className="data-[state=active]:bg-cyan-600">
            <Award className="w-4 h-4 mr-2" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="data-[state=active]:bg-cyan-600">
            <Briefcase className="w-4 h-4 mr-2" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-600">
            <User className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-gray-300">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github_username" className="text-gray-300">GitHub Username</Label>
                <div className="relative">
                  <Github className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="github_username"
                    value={formData.github_username}
                    onChange={(e) => handleInputChange('github_username', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white pl-10"
                    placeholder="Enter GitHub username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-gray-300">Company</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white pl-10"
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-gray-300">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter your location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-gray-300">Website</Label>
                <div className="relative">
                  <Link className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white pl-10"
                    placeholder="https://your-website.com"
                  />
                </div>
              </div>

              {user?.role === 'developer' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate" className="text-gray-300">Hourly Rate ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="hourly_rate"
                        type="number"
                        value={formData.hourly_rate}
                        onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value) || 0)}
                        className="bg-gray-700 border-gray-600 text-white pl-10"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience_level" className="text-gray-300">Experience Level</Label>
                    <select
                      id="experience_level"
                      value={formData.experience_level}
                      onChange={(e) => handleInputChange('experience_level', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2"
                    >
                      <option value="Junior">Junior</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Senior">Senior</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <Label htmlFor="bio" className="text-gray-300">Bio</Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 h-24 resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Skills & Expertise</h3>
            
            {/* Add new skill */}
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <h4 className="text-white font-medium mb-3">Add New Skill</h4>
              <div className="flex gap-3">
                <Input
                  value={newSkill.name}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-600 border-gray-500 text-white flex-1"
                  placeholder="Skill name (e.g., React, Python)"
                />
                <select
                  value={newSkill.level}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, level: e.target.value as any }))}
                  className="bg-gray-600 border border-gray-500 text-white rounded-md px-3 py-2"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
                <Button onClick={addSkill} className="bg-cyan-600 hover:bg-cyan-700">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Skills list */}
            <div className="space-y-3">
              <h4 className="text-white font-medium">Current Skills</h4>
              {skills.length === 0 ? (
                <p className="text-gray-400">No skills added yet. Add your first skill above.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {skills.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                      <div>
                        <span className="text-white font-medium">{skill.name}</span>
                        <Badge 
                          variant="secondary" 
                          className={`ml-2 ${
                            skill.level === 'Expert' ? 'bg-green-600' :
                            skill.level === 'Advanced' ? 'bg-blue-600' :
                            skill.level === 'Intermediate' ? 'bg-yellow-600' :
                            'bg-gray-600'
                          }`}
                        >
                          {skill.level}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSkill(skill.name)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Portfolio & Work Samples</h3>
            
            {/* Add new portfolio item */}
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <h4 className="text-white font-medium mb-3">Add New Item</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    value={newPortfolioItem.title || ''}
                    onChange={(e) => setNewPortfolioItem(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-gray-600 border-gray-500 text-white"
                    placeholder="Project/Item title"
                  />
                  <select
                    value={newPortfolioItem.type || 'project'}
                    onChange={(e) => setNewPortfolioItem(prev => ({ ...prev, type: e.target.value as any }))}
                    className="bg-gray-600 border border-gray-500 text-white rounded-md px-3 py-2"
                  >
                    <option value="project">Project</option>
                    <option value="article">Article</option>
                    <option value="certificate">Certificate</option>
                  </select>
                </div>
                <Input
                  value={newPortfolioItem.url || ''}
                  onChange={(e) => setNewPortfolioItem(prev => ({ ...prev, url: e.target.value }))}
                  className="bg-gray-600 border-gray-500 text-white"
                  placeholder="URL (GitHub, live demo, article link, etc.)"
                />
                <textarea
                  value={newPortfolioItem.description || ''}
                  onChange={(e) => setNewPortfolioItem(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-600 border border-gray-500 text-white rounded-md px-3 py-2 h-20 resize-none"
                  placeholder="Brief description..."
                />
                <Button onClick={addPortfolioItem} className="bg-cyan-600 hover:bg-cyan-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            {/* Portfolio items list */}
            <div className="space-y-3">
              <h4 className="text-white font-medium">Portfolio Items</h4>
              {portfolioItems.length === 0 ? (
                <p className="text-gray-400">No portfolio items added yet. Add your first item above.</p>
              ) : (
                <div className="space-y-3">
                  {portfolioItems.map((item) => (
                    <div key={item.id} className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="text-white font-medium">{item.title}</h5>
                            <Badge variant="outline" className="text-xs">
                              {item.type}
                            </Badge>
                          </div>
                          {item.description && (
                            <p className="text-gray-300 text-sm mb-2">{item.description}</p>
                          )}
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
                          >
                            <Link className="w-3 h-3" />
                            View Project
                          </a>
                          {item.technologies && item.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.technologies.map((tech, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePortfolioItem(item.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="border-t border-gray-600 pt-6">
                <h4 className="text-white font-medium mb-3">Profile Visibility</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded bg-gray-700 border-gray-600" defaultChecked />
                    <span className="text-gray-300">Make profile visible to clients</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded bg-gray-700 border-gray-600" defaultChecked />
                    <span className="text-gray-300">Allow direct messages</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded bg-gray-700 border-gray-600" />
                    <span className="text-gray-300">Show hourly rate publicly</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-gray-600 pt-6">
                <h4 className="text-white font-medium mb-3">Notifications</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded bg-gray-700 border-gray-600" defaultChecked />
                    <span className="text-gray-300">Email notifications for new messages</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded bg-gray-700 border-gray-600" defaultChecked />
                    <span className="text-gray-300">Email notifications for project updates</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded bg-gray-700 border-gray-600" />
                    <span className="text-gray-300">SMS notifications for urgent updates</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      </LoadingOverlay>

      {/* Save button */}
      <div className="flex justify-end mt-6">
        <Button 
          onClick={handleSave} 
          disabled={isSubmitting}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-6"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}