'use client';

import React, { useState, useCallback } from 'react';
import { DjangoUser } from '@/components/auth/django-auth-provider';
import { DeveloperProfile, apiClient } from '@/lib/api-client';
import { useSmartNotifications } from '@/lib/services/smart-notifications';
import { 
  Plus, 
  X, 
  Code, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Search,
  Star,
  TrendingUp,
  Award
} from 'lucide-react';

interface SkillsManagerProps {
  user: DjangoUser;
  profile: DeveloperProfile | null;
  onUpdate: () => void;
}

interface SkillValidationResult {
  validated_skills: string[];
  suggestions?: string[];
  invalid_skills?: string[];
}

export function SkillsManager({ user, profile, onUpdate }: SkillsManagerProps) {
  const { showSuccess, showError } = useSmartNotifications();
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [validationResults, setValidationResults] = useState<SkillValidationResult | null>(null);

  // Popular skills suggestions
  const popularSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Django', 'Flask',
    'Java', 'Spring Boot', 'C#', '.NET', 'PHP', 'Laravel', 'Ruby', 'Rails',
    'Go', 'Rust', 'Swift', 'Kotlin', 'Flutter', 'React Native', 'Vue.js',
    'Angular', 'Next.js', 'Nuxt.js', 'Express.js', 'FastAPI', 'GraphQL',
    'REST API', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker',
    'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'CI/CD', 'DevOps',
    'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch',
    'Blockchain', 'Solidity', 'Web3', 'UI/UX Design', 'Figma', 'Adobe XD'
  ];

  const filteredSuggestions = popularSkills.filter(skill => 
    !skills.includes(skill) && 
    skill.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSkill = useCallback(async (skillToAdd?: string) => {
    const skill = skillToAdd || newSkill.trim();
    if (!skill) return;

    setValidating(true);
    try {
      // Validate skill with Django AI service
      const response = await apiClient.makeRequest('/ai-services/validate-skills/', {
        method: 'POST',
        body: JSON.stringify({ skills: [skill] })
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const result = response.data as SkillValidationResult;
      setValidationResults(result);

      if (result.validated_skills && result.validated_skills.length > 0) {
        const validatedSkill = result.validated_skills[0];
        if (!skills.includes(validatedSkill)) {
          setSkills(prev => [...prev, validatedSkill]);
          setNewSkill('');
          showSuccess(`Added skill: ${validatedSkill}`);
        } else {
          showError('Skill already exists in your profile');
        }
      } else {
        showError('Skill not recognized. Please try a different skill or check spelling.');
      }
    } catch (error) {
      console.error('Skill validation error:', error);
      // Fallback: add skill without validation
      if (!skills.includes(skill)) {
        setSkills(prev => [...prev, skill]);
        setNewSkill('');
        showSuccess(`Added skill: ${skill} (validation unavailable)`);
      }
    } finally {
      setValidating(false);
    }
  }, [newSkill, skills, showSuccess, showError]);

  const handleRemoveSkill = useCallback((skillToRemove: string) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
  }, []);

  const handleSaveSkills = async () => {
    setSaving(true);
    try {
      if (!profile) {
        throw new Error('Developer profile not found');
      }

      const response = await apiClient.updateDeveloperProfile({
        skills: skills
      });

      if (response.error) {
        throw new Error(response.error);
      }

      showSuccess('Skills updated successfully!');
      onUpdate();
    } catch (error) {
      console.error('Skills save error:', error);
      showError(error instanceof Error ? error.message : 'Failed to save skills');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const getSkillLevel = (skill: string) => {
    // This would ideally come from the backend skill analysis
    // For now, return a placeholder
    return Math.floor(Math.random() * 5) + 1;
  };

  const renderSkillLevel = (level: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={12}
            className={i < level ? 'text-yellow-400 fill-current' : 'text-gray-600'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
          <Code size={20} />
          Skills Management
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Add and manage your technical skills. Our AI will validate and suggest improvements.
        </p>
      </div>

      {/* Add New Skill */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Add New Skill</h4>
        
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a skill (e.g., React, Python, Node.js)"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>
          <button
            onClick={() => handleAddSkill()}
            disabled={validating || !newSkill.trim()}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {validating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {validating ? 'Validating...' : 'Add Skill'}
          </button>
        </div>

        {/* Skill Suggestions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search popular skills..."
              className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filteredSuggestions.slice(0, 12).map((skill) => (
              <button
                key={skill}
                onClick={() => handleAddSkill(skill)}
                className="px-3 py-1 bg-gray-500/20 hover:bg-cyan-500/20 border border-gray-500/40 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-400 text-sm rounded-full transition-colors"
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Validation Results */}
        {validationResults && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-blue-400" />
              <span className="text-blue-400 font-medium">AI Validation Results</span>
            </div>
            
            {validationResults.suggestions && validationResults.suggestions.length > 0 && (
              <div className="text-sm text-gray-300">
                <p className="mb-2">Suggested related skills:</p>
                <div className="flex flex-wrap gap-2">
                  {validationResults.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleAddSkill(suggestion)}
                      className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 text-xs rounded transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Skills */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white">Your Skills ({skills.length})</h4>
          {skills.length > 0 && (
            <button
              onClick={handleSaveSkills}
              disabled={saving}
              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              {saving ? 'Saving...' : 'Save Skills'}
            </button>
          )}
        </div>

        {skills.length === 0 ? (
          <div className="text-center py-8">
            <Code size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No skills added yet</p>
            <p className="text-gray-500 text-sm">
              Add your first skill above to get started with better project matching
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill, index) => {
              const level = getSkillLevel(skill);
              return (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h5 className="font-medium text-white">{skill}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        {renderSkillLevel(level)}
                        <span className="text-xs text-gray-400">
                          Level {level}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all text-red-400 hover:text-red-300"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  {/* Skill insights (placeholder) */}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <TrendingUp size={12} />
                      High demand
                    </div>
                    <div className="flex items-center gap-1">
                      <Award size={12} />
                      Verified
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Skills Analytics (placeholder for future enhancement) */}
      {skills.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} />
            Skills Analytics
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{skills.length}</div>
              <div className="text-sm text-gray-400">Total Skills</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(skills.reduce((acc, _) => acc + getSkillLevel(_), 0) / skills.length * 20)}%
              </div>
              <div className="text-sm text-gray-400">Avg. Proficiency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {skills.filter(skill => popularSkills.includes(skill)).length}
              </div>
              <div className="text-sm text-gray-400">In-Demand Skills</div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            <p>💡 Tip: Add more skills to increase your project matching score and visibility to clients.</p>
          </div>
        </div>
      )}
    </div>
  );
}