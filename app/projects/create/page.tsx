'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  ArrowLeft, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  Tag, 
  Clock, 
  Zap, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import Link from 'next/link';

export default function CreateProjectPage() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget_min: '',
    budget_max: '',
    deadline: '',
    skills_required: '',
    urgency: 'medium',
    complexity: 'moderate',
    estimated_hours: ''
  });
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/signin');
          return;
        }

        setUser(user);

        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Profile fetch error:', error);
          router.push('/onboarding');
          return;
        }

        // Only clients can create projects
        if (profile.role !== 'client' && profile.role !== 'admin') {
          router.push('/unauthorized');
          return;
        }

        setProfile(profile);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/auth/signin');
      }
    };

    getUser();
  }, [router, supabase]);

  const analyzeProject = async () => {
    if (!formData.description) {
      setError('Please provide a project description for analysis');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: formData.description,
          budget: formData.budget_max ? parseInt(formData.budget_max) : undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze project');
      }

      const data = await response.json();
      setAiAnalysis(data);

      // Update form with AI suggestions
      setFormData(prev => ({
        ...prev,
        complexity: data.complexity || prev.complexity,
        estimated_hours: data.estimatedHours?.toString() || prev.estimated_hours,
        skills_required: prev.skills_required || data.requiredSkills?.join(', ') || ''
      }));
    } catch (error) {
      console.error('Project analysis error:', error);
      setError('Failed to analyze project. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const skillsArray = formData.skills_required
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      const projectData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget_min: parseInt(formData.budget_min) || 0,
        budget_max: parseInt(formData.budget_max) || 0,
        deadline: formData.deadline || null,
        skills_required: skillsArray,
        urgency: formData.urgency,
        complexity: formData.complexity,
        estimated_hours: parseInt(formData.estimated_hours) || null,
        client_id: user.id,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSuccess('Project created successfully!');
      
      // Create milestones if AI analysis provided them
      if (aiAnalysis?.jiraStories && data?.id) {
        const milestones = aiAnalysis.jiraStories.map((story: any, index: number) => ({
          project_id: data.id,
          title: story.title,
          description: story.description,
          due_date: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending',
          amount: Math.round((parseInt(formData.budget_max) || 0) / aiAnalysis.jiraStories.length),
          completion_percentage: 0
        }));

        await supabase.from('project_milestones').insert(milestones);
      }

      // Redirect to project page after a short delay
      setTimeout(() => {
        router.push(`/projects/${data.id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Project creation error:', err);
      setError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'web-development', name: 'Web Development' },
    { id: 'mobile-app', name: 'Mobile App' },
    { id: 'ai-ml', name: 'AI/Machine Learning' },
    { id: 'blockchain', name: 'Blockchain' },
    { id: 'design', name: 'UI/UX Design' },
    { id: 'other', name: 'Other' }
  ];

  const urgencyOptions = [
    { id: 'low', name: 'Low' },
    { id: 'medium', name: 'Medium' },
    { id: 'high', name: 'High' }
  ];

  const complexityOptions = [
    { id: 'simple', name: 'Simple' },
    { id: 'moderate', name: 'Moderate' },
    { id: 'complex', name: 'Complex' },
    { id: 'expert', name: 'Expert' }
  ];

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/projects"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Projects
          </Link>
          <h1 className="text-3xl font-bold text-white">Create New Project</h1>
          <p className="text-gray-400">Post your project to find the perfect developer</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              <p className="text-green-400">{success}</p>
            </div>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Project Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                placeholder="Enter a clear, descriptive title for your project"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Project Description
              </label>
              <div className="relative">
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 min-h-[200px]"
                  placeholder="Describe your project in detail, including requirements, goals, and any specific technologies or skills needed"
                  required
                />
                <button
                  type="button"
                  onClick={analyzeProject}
                  disabled={analyzing || !formData.description}
                  className="absolute bottom-3 right-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-400 font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      AI Analysis
                    </>
                  )}
                </button>
              </div>
            </div>

            {aiAnalysis && (
              <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                  <Zap size={18} />
                  AI Project Analysis
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-sm text-gray-400 mb-1">Complexity</div>
                    <div className="font-semibold text-white capitalize">{aiAnalysis.complexity}</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-sm text-gray-400 mb-1">Estimated Hours</div>
                    <div className="font-semibold text-white">{aiAnalysis.estimatedHours} hours</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-sm text-gray-400 mb-1">Suggested Price</div>
                    <div className="font-semibold text-green-400">${aiAnalysis.suggestedPrice.toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2">Required Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.requiredSkills.map((skill: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs text-cyan-400">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                {aiAnalysis.riskFactors && aiAnalysis.riskFactors.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-2">Risk Factors</div>
                    <ul className="list-disc list-inside text-sm text-yellow-400">
                      {aiAnalysis.riskFactors.map((risk: string, index: number) => (
                        <li key={index}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Info size={12} />
                  AI analysis is based on your project description and may need adjustment
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">
                  Category
                </label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                    required
                  >
                    <option value="" className="bg-gray-900">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id} className="bg-gray-900">
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">
                  Required Skills (comma-separated)
                </label>
                <div className="relative">
                  <Tag size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.skills_required}
                    onChange={(e) => setFormData(prev => ({ ...prev, skills_required: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                    placeholder="React, Node.js, Python..."
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">
                  Budget Range (USD)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={formData.budget_min}
                      onChange={(e) => setFormData(prev => ({ ...prev, budget_min: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                      placeholder="Min"
                      required
                      min="0"
                    />
                  </div>
                  <div className="relative flex-1">
                    <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={formData.budget_max}
                      onChange={(e) => setFormData(prev => ({ ...prev, budget_max: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                      placeholder="Max"
                      required
                      min="0"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">
                  Deadline
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">
                  Urgency
                </label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                  >
                    {urgencyOptions.map(option => (
                      <option key={option.id} value={option.id} className="bg-gray-900">
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">
                  Complexity
                </label>
                <div className="relative">
                  <Zap size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={formData.complexity}
                    onChange={(e) => setFormData(prev => ({ ...prev, complexity: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                  >
                    {complexityOptions.map(option => (
                      <option key={option.id} value={option.id} className="bg-gray-900">
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Estimated Hours
              </label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  placeholder="Estimated hours to complete"
                  min="1"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Link
                href="/projects"
                className="flex-1 border border-gray-500 text-gray-300 hover:bg-gray-500/20 font-semibold py-3 px-6 rounded-lg transition-all duration-200 text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}