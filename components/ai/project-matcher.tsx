'use client';

import { useState } from 'react';
import { Search, Star, Zap, AlertCircle } from 'lucide-react';

interface ProjectMatch {
  projectId: string;
  matchScore: number;
  reasoning: string;
  skillAlignment: string[];
  missingSkills: string[];
}

export function ProjectMatcher() {
  const [userSkills, setUserSkills] = useState('');
  const [preferences, setPreferences] = useState({
    budget: '',
    timeline: '',
    workType: 'remote'
  });
  const [matches, setMatches] = useState<ProjectMatch[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  const findMatches = async () => {
    if (!userSkills.trim()) return;

    setIsMatching(true);
    try {
      const response = await fetch('/api/ai/project-matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userSkills: userSkills.split(',').map(s => s.trim()),
          preferences
        }),
      });

      const data = await response.json();
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Project matching error:', error);
    } finally {
      setIsMatching(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMatchBadge = (score: number) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 70) return 'Good Match';
    return 'Partial Match';
  };

  return (
    <div className="nexus-card">
      <h2>Quantum Project Matcher</h2>
      <p>AI-powered project matching with real-time compatibility analysis.</p>
      
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-cyan-400 mb-2">
            Your Skills (comma-separated)
          </label>
          <input
            type="text"
            value={userSkills}
            onChange={(e) => setUserSkills(e.target.value)}
            placeholder="e.g., React, Node.js, Python, AI/ML"
            className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              Budget Preference
            </label>
            <select
              value={preferences.budget}
              onChange={(e) => setPreferences(prev => ({ ...prev, budget: e.target.value }))}
              className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
            >
              <option value="">Any Budget</option>
              <option value="0-1000">$0 - $1,000</option>
              <option value="1000-5000">$1,000 - $5,000</option>
              <option value="5000+">$5,000+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              Timeline
            </label>
            <select
              value={preferences.timeline}
              onChange={(e) => setPreferences(prev => ({ ...prev, timeline: e.target.value }))}
              className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
            >
              <option value="">Any Timeline</option>
              <option value="urgent">Urgent (1-2 weeks)</option>
              <option value="normal">Normal (1-2 months)</option>
              <option value="flexible">Flexible (3+ months)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              Work Type
            </label>
            <select
              value={preferences.workType}
              onChange={(e) => setPreferences(prev => ({ ...prev, workType: e.target.value }))}
              className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
            >
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </div>
        </div>

        <button
          onClick={findMatches}
          disabled={isMatching || !userSkills.trim()}
          className="nexus-action-btn w-full flex items-center justify-center gap-2"
        >
          {isMatching ? (
            <>
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              Quantum Matching in Progress...
            </>
          ) : (
            <>
              <Search size={16} />
              Find Project Matches
            </>
          )}
        </button>
      </div>

      {matches.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="text-cyan-400 font-semibold">Project Matches Found</h4>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {matches.map((match, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-cyan-400">{match.projectId}</h5>
                  <div className="flex items-center gap-2">
                    <Star size={16} className={getMatchColor(match.matchScore)} />
                    <span className={`font-semibold ${getMatchColor(match.matchScore)}`}>
                      {match.matchScore}%
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      match.matchScore >= 90 ? 'bg-green-500/20 text-green-400' :
                      match.matchScore >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {getMatchBadge(match.matchScore)}
                    </span>
                  </div>
                </div>

                <p className="text-sm opacity-80 mb-3">{match.reasoning}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h6 className="text-green-400 font-medium mb-2 flex items-center gap-1">
                      <Zap size={14} />
                      Skill Alignment
                    </h6>
                    <div className="flex flex-wrap gap-1">
                      {match.skillAlignment.map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="px-2 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-400"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {match.missingSkills.length > 0 && (
                    <div>
                      <h6 className="text-yellow-400 font-medium mb-2 flex items-center gap-1">
                        <AlertCircle size={14} />
                        Skills to Develop
                      </h6>
                      <div className="flex flex-wrap gap-1">
                        {match.missingSkills.map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full text-xs text-yellow-400"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <button className="nexus-action-btn text-sm px-4 py-1">
                    View Project
                  </button>
                  <button className="nexus-action-btn text-sm px-4 py-1">
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}