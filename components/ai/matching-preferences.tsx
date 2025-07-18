'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  DollarSign, 
  Star, 
  MapPin, 
  Clock, 
  Filter, 
  Save, 
  RefreshCw,
  Sliders,
  Target,
  TrendingUp,
  Users,
  Award,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { matchingService, MatchingPreferences, MatchingFilters } from '@/lib/services/matching-service';

interface MatchingPreferencesProps {
  onPreferencesChange?: (preferences: MatchingPreferences) => void;
  onFiltersChange?: (filters: MatchingFilters) => void;
}

export default function MatchingPreferencesComponent({ 
  onPreferencesChange, 
  onFiltersChange 
}: MatchingPreferencesProps) {
  const [preferences, setPreferences] = useState<MatchingPreferences>({
    preferred_hourly_rate_min: 25,
    preferred_hourly_rate_max: 150,
    preferred_experience_levels: ['mid', 'senior'],
    required_skills: [],
    preferred_skills: [],
    availability_requirement: 'available',
    location_preference: '',
    timezone_preference: ''
  });

  const [filters, setFilters] = useState<MatchingFilters>({
    min_score: 0.7,
    max_results: 20,
    include_unavailable: false,
    skill_weight: 0.4,
    experience_weight: 0.3,
    availability_weight: 0.3
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [preferredSkillInput, setPreferredSkillInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const result = await matchingService.getMatchingPreferences();
      if (result.data) {
        setPreferences(result.data);
      }
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await matchingService.updateMatchingPreferences(preferences);
      
      if (result.error) {
        throw new Error(result.error);
      }

      setSuccess('Preferences saved successfully!');
      onPreferencesChange?.(preferences);
      onFiltersChange?.(filters);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = (type: 'required' | 'preferred') => {
    const input = type === 'required' ? skillInput : preferredSkillInput;
    const currentSkills = type === 'required' ? preferences.required_skills : preferences.preferred_skills;
    
    if (input.trim() && !currentSkills?.includes(input.trim())) {
      const updatedPreferences = {
        ...preferences,
        [type === 'required' ? 'required_skills' : 'preferred_skills']: [
          ...(currentSkills || []),
          input.trim()
        ]
      };
      
      setPreferences(updatedPreferences);
      
      if (type === 'required') {
        setSkillInput('');
      } else {
        setPreferredSkillInput('');
      }
    }
  };

  const removeSkill = (skill: string, type: 'required' | 'preferred') => {
    const currentSkills = type === 'required' ? preferences.required_skills : preferences.preferred_skills;
    const updatedPreferences = {
      ...preferences,
      [type === 'required' ? 'required_skills' : 'preferred_skills']: 
        currentSkills?.filter(s => s !== skill) || []
    };
    
    setPreferences(updatedPreferences);
  };

  const handleExperienceLevelChange = (level: string, checked: boolean) => {
    const currentLevels = preferences.preferred_experience_levels || [];
    const updatedLevels = checked
      ? [...currentLevels, level as any]
      : currentLevels.filter(l => l !== level);
    
    setPreferences({
      ...preferences,
      preferred_experience_levels: updatedLevels as any
    });
  };

  const resetToDefaults = () => {
    setPreferences({
      preferred_hourly_rate_min: 25,
      preferred_hourly_rate_max: 150,
      preferred_experience_levels: ['mid', 'senior'],
      required_skills: [],
      preferred_skills: [],
      availability_requirement: 'available',
      location_preference: '',
      timezone_preference: ''
    });

    setFilters({
      min_score: 0.7,
      max_results: 20,
      include_unavailable: false,
      skill_weight: 0.4,
      experience_weight: 0.3,
      availability_weight: 0.3
    });
  };

  const experienceLevels = [
    { id: 'junior', name: 'Junior', description: '0-2 years experience' },
    { id: 'mid', name: 'Mid-level', description: '2-5 years experience' },
    { id: 'senior', name: 'Senior', description: '5+ years experience' },
    { id: 'expert', name: 'Expert', description: '10+ years experience' }
  ];

  const availabilityOptions = [
    { id: 'available', name: 'Available Only', description: 'Only show available developers' },
    { id: 'any', name: 'Any Status', description: 'Show all developers regardless of availability' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings size={24} />
            Matching Preferences
          </h2>
          <p className="text-gray-400">Customize how we match developers to your projects</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Sliders size={16} />
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
          
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/40 text-gray-400 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <p className="text-green-400">{success}</p>
          </div>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 space-y-8">
        
        {/* Budget Range */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-green-400" />
            <h3 className="text-lg font-semibold text-white">Budget Range</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Minimum Rate ($/hour)</label>
              <input
                type="number"
                value={preferences.preferred_hourly_rate_min || ''}
                onChange={(e) => setPreferences({
                  ...preferences,
                  preferred_hourly_rate_min: parseInt(e.target.value) || 0
                })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                placeholder="25"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Maximum Rate ($/hour)</label>
              <input
                type="number"
                value={preferences.preferred_hourly_rate_max || ''}
                onChange={(e) => setPreferences({
                  ...preferences,
                  preferred_hourly_rate_max: parseInt(e.target.value) || 0
                })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                placeholder="150"
                min="0"
              />
            </div>
          </div>
          
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <Info size={14} />
            Current range: ${preferences.preferred_hourly_rate_min} - ${preferences.preferred_hourly_rate_max} per hour
          </div>
        </div>

        {/* Experience Levels */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Experience Levels</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {experienceLevels.map((level) => (
              <label
                key={level.id}
                className="flex items-center gap-3 p-4 bg-white/5 border border-white/20 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={preferences.preferred_experience_levels?.includes(level.id as any) || false}
                  onChange={(e) => handleExperienceLevelChange(level.id, e.target.checked)}
                  className="rounded"
                />
                
                <div>
                  <div className="font-medium text-white">{level.name}</div>
                  <div className="text-sm text-gray-400">{level.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-6">
          {/* Required Skills */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-red-400" />
              <h3 className="text-lg font-semibold text-white">Required Skills</h3>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill('required')}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                placeholder="Add required skill (e.g., React, Python)"
              />
              <button
                onClick={() => addSkill('required')}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 px-4 py-3 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            
            {preferences.required_skills && preferences.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {preferences.required_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full text-sm text-red-400 flex items-center gap-2"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill, 'required')}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Preferred Skills */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Preferred Skills</h3>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={preferredSkillInput}
                onChange={(e) => setPreferredSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill('preferred')}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                placeholder="Add preferred skill (nice to have)"
              />
              <button
                onClick={() => addSkill('preferred')}
                className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 px-4 py-3 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            
            {preferences.preferred_skills && preferences.preferred_skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {preferences.preferred_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full text-sm text-blue-400 flex items-center gap-2"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill, 'preferred')}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Availability */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Availability</h3>
          </div>
          
          <div className="space-y-3">
            {availabilityOptions.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-3 p-4 bg-white/5 border border-white/20 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
              >
                <input
                  type="radio"
                  name="availability"
                  value={option.id}
                  checked={preferences.availability_requirement === option.id}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    availability_requirement: e.target.value as any
                  })}
                  className="rounded"
                />
                
                <div>
                  <div className="font-medium text-white">{option.name}</div>
                  <div className="text-sm text-gray-400">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Location & Timezone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Location Preference</h3>
            </div>
            
            <input
              type="text"
              value={preferences.location_preference || ''}
              onChange={(e) => setPreferences({
                ...preferences,
                location_preference: e.target.value
              })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              placeholder="e.g., US, Europe, Remote"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Timezone Preference</h3>
            </div>
            
            <input
              type="text"
              value={preferences.timezone_preference || ''}
              onChange={(e) => setPreferences({
                ...preferences,
                timezone_preference: e.target.value
              })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              placeholder="e.g., EST, PST, UTC+2"
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-6 pt-6 border-t border-white/20">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Advanced Matching Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Minimum Match Score ({Math.round((filters.min_score || 0) * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={filters.min_score || 0}
                    onChange={(e) => setFilters({
                      ...filters,
                      min_score: parseFloat(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Maximum Results</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={filters.max_results || 20}
                    onChange={(e) => setFilters({
                      ...filters,
                      max_results: parseInt(e.target.value) || 20
                    })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Skill Weight ({Math.round((filters.skill_weight || 0) * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={filters.skill_weight || 0}
                    onChange={(e) => setFilters({
                      ...filters,
                      skill_weight: parseFloat(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Experience Weight ({Math.round((filters.experience_weight || 0) * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={filters.experience_weight || 0}
                    onChange={(e) => setFilters({
                      ...filters,
                      experience_weight: parseFloat(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Availability Weight ({Math.round((filters.availability_weight || 0) * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={filters.availability_weight || 0}
                    onChange={(e) => setFilters({
                      ...filters,
                      availability_weight: parseFloat(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.include_unavailable || false}
                  onChange={(e) => setFilters({
                    ...filters,
                    include_unavailable: e.target.checked
                  })}
                  className="rounded"
                />
                <span className="text-white text-sm">Include unavailable developers</span>
              </label>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-6 border-t border-white/20">
          <button
            onClick={savePreferences}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}