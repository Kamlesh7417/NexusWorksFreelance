'use client';

import { useState } from 'react';
import { Zap, Clock, DollarSign, Users } from 'lucide-react';

interface ProjectAnalysis {
  complexity: 'low' | 'medium' | 'high';
  estimatedHours: number;
  suggestedPrice: number;
  requiredSkills: string[];
  jiraStories: any[];
  riskFactors: string[];
}

export function ProjectAnalyzer() {
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeProject = async () => {
    if (!description.trim()) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description, budget }),
      });

      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Project analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="nexus-card">
      <h2>Quantum Project Analyzer</h2>
      <p>AI-powered project analysis with JIRA story generation and pricing optimization.</p>
      
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-cyan-400 mb-2">
            Project Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your project requirements, goals, and technical specifications..."
            className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white resize-none outline-none min-h-[100px]"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-cyan-400 mb-2">
            Budget Range (Optional)
          </label>
          <input
            type="text"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g., $2000-5000"
            className="w-full bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
          />
        </div>

        <button
          onClick={analyzeProject}
          disabled={isAnalyzing || !description.trim()}
          className="nexus-action-btn w-full flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              Quantum Analysis in Progress...
            </>
          ) : (
            <>
              <Zap size={16} />
              Analyze Project
            </>
          )}
        </button>
      </div>

      {analysis && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} className={getComplexityColor(analysis.complexity)} />
                <span className="text-sm">Complexity</span>
              </div>
              <div className={`font-semibold capitalize ${getComplexityColor(analysis.complexity)}`}>
                {analysis.complexity}
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-cyan-400" />
                <span className="text-sm">Est. Hours</span>
              </div>
              <div className="font-semibold text-cyan-400">
                {analysis.estimatedHours}h
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={16} className="text-green-400" />
                <span className="text-sm">Suggested Price</span>
              </div>
              <div className="font-semibold text-green-400">
                ${analysis.suggestedPrice.toLocaleString()}
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-purple-400" />
                <span className="text-sm">Skills Needed</span>
              </div>
              <div className="font-semibold text-purple-400">
                {analysis.requiredSkills.length}
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-cyan-400 font-semibold mb-2">Required Skills</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.requiredSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {analysis.jiraStories.length > 0 && (
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-cyan-400 font-semibold mb-3">Generated JIRA Stories</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {analysis.jiraStories.map((story, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-3 border border-cyan-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-cyan-400 font-medium">{story.id}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        story.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        story.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {story.priority}
                      </span>
                    </div>
                    <h5 className="font-medium mb-1">{story.title}</h5>
                    <p className="text-sm opacity-80 mb-2">{story.description}</p>
                    <div className="text-xs text-cyan-400">
                      Story Points: {story.storyPoints}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.riskFactors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <h4 className="text-red-400 font-semibold mb-2">Risk Factors</h4>
              <ul className="space-y-1">
                {analysis.riskFactors.map((risk, index) => (
                  <li key={index} className="text-sm text-red-300">
                    • {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}