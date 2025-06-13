'use client';

import { useState } from 'react';
import { Brain, Target, TrendingUp, BookOpen } from 'lucide-react';

interface SkillAnalysis {
  currentLevel: number;
  targetLevel: number;
  skillGap: number;
  learningPath: any[];
  estimatedTimeToTarget: string;
}

export function SkillAnalyzer() {
  const [currentSkills, setCurrentSkills] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [analysis, setAnalysis] = useState<SkillAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeSkills = async () => {
    if (!currentSkills.trim() || !targetRole.trim()) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/skill-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentSkills: currentSkills.split(',').map(s => s.trim()),
          targetRole
        }),
      });

      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Skill analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="nexus-card">
      <h2>Neural Skill Analyzer</h2>
      <p>AI-powered skill gap analysis with personalized learning recommendations.</p>
      
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-cyan-400 mb-2">
            Current Skills (comma-separated)
          </label>
          <input
            type="text"
            value={currentSkills}
            onChange={(e) => setCurrentSkills(e.target.value)}
            placeholder="e.g., JavaScript, React, Node.js, Python"
            className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-cyan-400 mb-2">
            Target Role
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g., Senior Full Stack Developer, AI Engineer"
            className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
          />
        </div>

        <button
          onClick={analyzeSkills}
          disabled={isAnalyzing || !currentSkills.trim() || !targetRole.trim()}
          className="nexus-action-btn w-full flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              Neural Analysis in Progress...
            </>
          ) : (
            <>
              <Brain size={16} />
              Analyze Skills
            </>
          )}
        </button>
      </div>

      {analysis && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Brain size={16} className="text-cyan-400" />
                <span className="text-sm">Current Level</span>
              </div>
              <div className="font-semibold text-cyan-400">
                {analysis.currentLevel}%
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target size={16} className="text-green-400" />
                <span className="text-sm">Target Level</span>
              </div>
              <div className="font-semibold text-green-400">
                {analysis.targetLevel}%
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-yellow-400" />
                <span className="text-sm">Skill Gap</span>
              </div>
              <div className="font-semibold text-yellow-400">
                {analysis.skillGap}%
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={16} className="text-purple-400" />
                <span className="text-sm">Time to Target</span>
              </div>
              <div className="font-semibold text-purple-400">
                {analysis.estimatedTimeToTarget}
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-cyan-400 font-semibold mb-3">Skill Progress</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current</span>
                <span>{analysis.currentLevel}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${analysis.currentLevel}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Target</span>
                <span>{analysis.targetLevel}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${analysis.targetLevel}%` }}
                ></div>
              </div>
            </div>
          </div>

          {analysis.learningPath.length > 0 && (
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-cyan-400 font-semibold mb-3">Recommended Learning Path</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {analysis.learningPath.map((module, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-3 border border-cyan-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-cyan-400">{module.title}</h5>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        module.difficulty === 'advanced' ? 'bg-red-500/20 text-red-400' :
                        module.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {module.difficulty}
                      </span>
                    </div>
                    <p className="text-sm opacity-80 mb-2">{module.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cyan-400">Duration: {module.duration}</span>
                      {module.prerequisites.length > 0 && (
                        <span className="text-gray-400">
                          Prerequisites: {module.prerequisites.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}