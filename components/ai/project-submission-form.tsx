'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Info,
  Brain,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import { projectService } from '@/lib/services/project-service';
import { matchingService } from '@/lib/services/matching-service';

interface ProjectAnalysisResult {
  analysis: {
    complexity: 'simple' | 'moderate' | 'complex' | 'expert';
    estimated_hours: number;
    budget_estimate: number;
    required_skills: string[];
    risk_factors: string[];
    needs_senior_developer: boolean;
    confidence_score: number;
  };
  tasks: Array<{
    title: string;
    description: string;
    required_skills: string[];
    estimated_hours: number;
    priority: number;
  }>;
  timeline_estimate: string;
  recommendations: string[];
}

interface ProjectFormData {
  title: string;
  description: string;
  budget_range?: {
    min: number;
    max: number;
  };
  timeline_preference?: string;
  required_skills?: string[];
}

export default function ProjectSubmissionForm() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    budget_range: { min: 0, max: 0 },
    timeline_preference: '',
    required_skills: []
  });
  const [aiAnalysis, setAiAnalysis] = useState<ProjectAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');

  const router = useRouter();

  const analyzeProject = async () => {
    if (!formData.description.trim()) {
      setError('Please provide a project description for analysis');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // Create a temporary project for analysis
      const tempProject = await projectService.createProject({
        title: formData.title || 'Temporary Project',
        description: formData.description,
        budget_range: formData.budget_range,
        timeline_preference: formData.timeline_preference,
        required_skills: formData.required_skills
      });

      if (tempProject.error || !tempProject.data) {
        throw new Error(tempProject.error || 'Failed to create project for analysis');
      }

      // Analyze the project
      const analysisResult = await projectService.analyzeProject(tempProject.data.id);
      
      if (analysisResult.error) {
        throw new Error(analysisResult.error);
      }

      setAiAnalysis(analysisResult.data);

      // Update form with AI suggestions
      if (analysisResult.data?.analysis) {
        const analysis = analysisResult.data.analysis;
        setFormData(prev => ({
          ...prev,
          budget_range: {
            min: Math.round(analysis.budget_estimate * 0.8),
            max: Math.round(analysis.budget_estimate * 1.2)
          },
          required_skills: analysis.required_skills || prev.required_skills
        }));
      }
    } catch (error) {
      console.error('Project analysis error:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze project. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await projectService.createProject(formData);
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to create project');
      }

      setSuccess('Project created successfully! Redirecting to project dashboard...');
      
      // Redirect to project page after a short delay
      setTimeout(() => {
        router.push(`/projects/${result.data.id}`);
      }, 1500);
    } catch (err) {
      console.error('Project creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.required_skills?.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...(prev.required_skills || []), skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills?.filter(skill => skill !== skillToRemove) || []
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Create New Project</h1>
        <p className="text-gray-400">Describe your project and let AI help you plan it perfectly</p>
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
          {/* Project Title */}
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

          {/* Project Description */}
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              Project Description
            </label>
            <div className="relative">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 min-h-[200px]"
                placeholder="Describe your project in detail, including requirements, goals, and any specific technologies or features needed"
                required
              />
              <button
                type="button"
                onClick={analyzeProject}
                disabled={analyzing || !formData.description.trim()}
                className="absolute bottom-3 right-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-400 font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain size={14} />
                    AI Analysis
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Analysis Results */}
          {aiAnalysis && (
            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                <Brain size={18} />
                AI Project Analysis
                <span className="text-xs bg-cyan-500/20 px-2 py-1 rounded-full">
                  {Math.round(aiAnalysis.analysis.confidence_score * 100)}% confidence
                </span>
              </h3>
              
              {/* Analysis Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-purple-400" />
                    <div className="text-sm text-gray-400">Complexity</div>
                  </div>
                  <div className="font-semibold text-white capitalize">{aiAnalysis.analysis.complexity}</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-blue-400" />
                    <div className="text-sm text-gray-400">Est. Hours</div>
                  </div>
                  <div className="font-semibold text-white">{aiAnalysis.analysis.estimated_hours}h</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={16} className="text-green-400" />
                    <div className="text-sm text-gray-400">Budget Est.</div>
                  </div>
                  <div className="font-semibold text-green-400">${aiAnalysis.analysis.budget_estimate.toLocaleString()}</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-orange-400" />
                    <div className="text-sm text-gray-400">Senior Dev</div>
                  </div>
                  <div className="font-semibold text-white">
                    {aiAnalysis.analysis.needs_senior_developer ? 'Required' : 'Optional'}
                  </div>
                </div>
              </div>
              
              {/* Required Skills */}
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <Tag size={14} />
                  Required Skills
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.analysis.required_skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-sm text-cyan-400">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Risk Factors */}
              {aiAnalysis.analysis.risk_factors.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <AlertCircle size={14} />
                    Risk Factors
                  </div>
                  <ul className="list-disc list-inside text-sm text-yellow-400 space-y-1">
                    {aiAnalysis.analysis.risk_factors.map((risk, index) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Task Breakdown Preview */}
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <Briefcase size={14} />
                  Task Breakdown ({aiAnalysis.tasks.length} tasks)
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {aiAnalysis.tasks.slice(0, 3).map((task, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-3">
                      <div className="font-medium text-white text-sm">{task.title}</div>
                      <div className="text-xs text-gray-400 mt-1">{task.estimated_hours}h • Priority {task.priority}</div>
                    </div>
                  ))}
                  {aiAnalysis.tasks.length > 3 && (
                    <div className="text-xs text-gray-400 text-center">
                      +{aiAnalysis.tasks.length - 3} more tasks...
                    </div>
                  )}
                </div>
              </div>
              
              {/* Recommendations */}
              {aiAnalysis.recommendations.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <TrendingUp size={14} />
                    AI Recommendations
                  </div>
                  <ul className="list-disc list-inside text-sm text-blue-400 space-y-1">
                    {aiAnalysis.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Info size={12} />
                AI analysis is based on your project description and current market data
              </div>
            </div>
          )}

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              Budget Range (USD)
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={formData.budget_range?.min || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      budget_range: {
                        ...prev.budget_range,
                        min: parseInt(e.target.value) || 0,
                        max: prev.budget_range?.max || 0
                      }
                    }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                    placeholder="Minimum budget"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={formData.budget_range?.max || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      budget_range: {
                        min: prev.budget_range?.min || 0,
                        max: parseInt(e.target.value) || 0
                      }
                    }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                    placeholder="Maximum budget"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Preference */}
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              Timeline Preference
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={formData.timeline_preference || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, timeline_preference: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                placeholder="e.g., 2-3 months, ASAP, flexible"
              />
            </div>
          </div>

          {/* Required Skills */}
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              Required Skills
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                    placeholder="Add a skill (e.g., React, Python, AWS)"
                  />
                </div>
                <button
                  type="button"
                  onClick={addSkill}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 px-4 py-3 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              
              {formData.required_skills && formData.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.required_skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-sm text-cyan-400 flex items-center gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-cyan-400 hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-gray-500 text-gray-300 hover:bg-gray-500/20 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
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
  );
}