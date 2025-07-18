'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, 
  BarChart3, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Zap,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Share2,
  MessageSquare,
  Clock,
  DollarSign,
  Users,
  Code,
  Award,
  Layers
} from 'lucide-react';
import { matchingService } from '@/lib/services/matching-service';
import { projectService } from '@/lib/services/project-service';

interface AIAnalysisVisualizationProps {
  projectId?: string;
  analysisData?: any;
  showInteractiveFeatures?: boolean;
}

interface AnalysisInsight {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  recommendation?: string;
}

interface SkillAnalysis {
  skill: string;
  demand_score: number;
  supply_score: number;
  market_rate: number;
  growth_trend: 'rising' | 'stable' | 'declining';
  related_skills: string[];
}

interface ProjectComplexityBreakdown {
  overall_score: number;
  technical_complexity: number;
  integration_complexity: number;
  ui_complexity: number;
  data_complexity: number;
  scalability_requirements: number;
}

export default function EnhancedAIAssistant({ 
  projectId, 
  analysisData, 
  showInteractiveFeatures = true 
}: AIAnalysisVisualizationProps) {
  const [analysis, setAnalysis] = useState<any>(analysisData);
  const [insights, setInsights] = useState<AnalysisInsight[]>([]);
  const [skillAnalysis, setSkillAnalysis] = useState<SkillAnalysis[]>([]);
  const [complexityBreakdown, setComplexityBreakdown] = useState<ProjectComplexityBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'complexity' | 'insights'>('overview');
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set());
  const [chatMode, setChatMode] = useState(false);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    if (projectId && !analysisData) {
      loadAnalysis();
    } else if (analysisData) {
      processAnalysisData(analysisData);
    }
  }, [projectId, analysisData]);

  const loadAnalysis = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const result = await projectService.analyzeProject(projectId);
      if (result.data) {
        setAnalysis(result.data);
        processAnalysisData(result.data);
      }
    } catch (err) {
      console.error('Failed to load analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const processAnalysisData = (data: any) => {
    // Generate insights
    const generatedInsights = generateInsights(data);
    setInsights(generatedInsights);
    
    // Process skill analysis
    if (data.analysis?.required_skills) {
      processSkillAnalysis(data.analysis.required_skills);
    }
    
    // Generate complexity breakdown
    if (data.analysis) {
      generateComplexityBreakdown(data.analysis);
    }
  };

  const generateInsights = (data: any): AnalysisInsight[] => {
    const insights: AnalysisInsight[] = [];
    
    if (data.analysis) {
      const { complexity, budget_estimate, needs_senior_developer, risk_factors } = data.analysis;
      
      // Budget insight
      if (budget_estimate > 50000) {
        insights.push({
          type: 'warning',
          title: 'High Budget Project',
          description: `This project has a significant budget of $${budget_estimate.toLocaleString()}. Consider breaking it into phases.`,
          confidence: 0.9,
          actionable: true,
          recommendation: 'Split into 2-3 development phases to reduce risk and improve cash flow.'
        });
      }
      
      // Complexity insight
      if (complexity === 'expert') {
        insights.push({
          type: 'error',
          title: 'Expert-Level Complexity',
          description: 'This project requires expert-level developers with specialized skills.',
          confidence: 0.95,
          actionable: true,
          recommendation: 'Ensure senior developers are assigned to critical components.'
        });
      }
      
      // Senior developer insight
      if (needs_senior_developer) {
        insights.push({
          type: 'info',
          title: 'Senior Developer Required',
          description: 'AI analysis indicates this project needs senior developer oversight.',
          confidence: 0.85,
          actionable: true,
          recommendation: 'Assign a senior developer as technical lead for architecture decisions.'
        });
      }
      
      // Risk factors insight
      if (risk_factors && risk_factors.length > 0) {
        insights.push({
          type: 'warning',
          title: 'Risk Factors Identified',
          description: `${risk_factors.length} potential risk factors detected in project scope.`,
          confidence: 0.8,
          actionable: true,
          recommendation: 'Review and mitigate identified risks before project start.'
        });
      }
    }
    
    return insights;
  };

  const processSkillAnalysis = async (skills: string[]) => {
    try {
      const result = await matchingService.getSkillTrends(skills);
      if (result.data) {
        const skillAnalysisData: SkillAnalysis[] = skills.map(skill => ({
          skill,
          demand_score: Math.random() * 100, // Mock data - replace with real API
          supply_score: Math.random() * 100,
          market_rate: result.data.market_rates?.[skill] || Math.random() * 100 + 50,
          growth_trend: Math.random() > 0.5 ? 'rising' : 'stable',
          related_skills: []
        }));
        
        setSkillAnalysis(skillAnalysisData);
      }
    } catch (err) {
      console.error('Failed to process skill analysis:', err);
    }
  };

  const generateComplexityBreakdown = (analysisData: any) => {
    // Mock complexity breakdown - replace with real analysis
    const breakdown: ProjectComplexityBreakdown = {
      overall_score: getComplexityScore(analysisData.complexity),
      technical_complexity: Math.random() * 100,
      integration_complexity: Math.random() * 100,
      ui_complexity: Math.random() * 100,
      data_complexity: Math.random() * 100,
      scalability_requirements: Math.random() * 100
    };
    
    setComplexityBreakdown(breakdown);
  };

  const getComplexityScore = (complexity: string): number => {
    switch (complexity) {
      case 'simple': return 25;
      case 'moderate': return 50;
      case 'complex': return 75;
      case 'expert': return 95;
      default: return 50;
    }
  };

  const toggleDetails = (id: string) => {
    const newShowDetails = new Set(showDetails);
    if (newShowDetails.has(id)) {
      newShowDetails.delete(id);
    } else {
      newShowDetails.add(id);
    }
    setShowDetails(newShowDetails);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-green-400" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-400" />;
      case 'error': return <AlertTriangle size={16} className="text-red-400" />;
      default: return <Info size={16} className="text-blue-400" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500/40 bg-green-500/10';
      case 'warning': return 'border-yellow-500/40 bg-yellow-500/10';
      case 'error': return 'border-red-500/40 bg-red-500/10';
      default: return 'border-blue-500/40 bg-blue-500/10';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp size={14} className="text-green-400" />;
      case 'declining': return <TrendingUp size={14} className="text-red-400 rotate-180" />;
      default: return <Target size={14} className="text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={40} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <Brain size={48} className="text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Analysis Available</h3>
        <p className="text-gray-400">Run AI analysis to see detailed insights and recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain size={24} className="text-cyan-400" />
            AI Analysis Results
          </h2>
          <p className="text-gray-400">Comprehensive project analysis and recommendations</p>
        </div>
        
        {showInteractiveFeatures && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setChatMode(!chatMode)}
              className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-400 px-4 py-2 rounded-lg transition-colors"
            >
              <MessageSquare size={16} />
              {chatMode ? 'Exit Chat' : 'Ask AI'}
            </button>
            
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg transition-colors">
              <Download size={16} />
              Export
            </button>
            
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg transition-colors">
              <Share2 size={16} />
              Share
            </button>
          </div>
        )}
      </div>

      {/* Chat Mode */}
      {chatMode && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              placeholder="Ask me anything about this project analysis..."
            />
            <button className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-400 px-4 py-2 rounded-lg transition-colors">
              Send
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
        {[
          { id: 'overview', name: 'Overview', icon: BarChart3 },
          { id: 'skills', name: 'Skills', icon: Code },
          { id: 'complexity', name: 'Complexity', icon: Layers },
          { id: 'insights', name: 'Insights', icon: Lightbulb }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon size={16} />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={16} className="text-purple-400" />
                  <div className="text-sm text-gray-400">Complexity</div>
                </div>
                <div className="text-2xl font-bold text-white capitalize">
                  {analysis.analysis?.complexity || 'Unknown'}
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-blue-400" />
                  <div className="text-sm text-gray-400">Est. Hours</div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {analysis.analysis?.estimated_hours || 0}h
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-green-400" />
                  <div className="text-sm text-gray-400">Budget</div>
                </div>
                <div className="text-2xl font-bold text-green-400">
                  ${analysis.analysis?.budget_estimate?.toLocaleString() || '0'}
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-orange-400" />
                  <div className="text-sm text-gray-400">Team Size</div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {analysis.tasks?.length || 0} devs
                </div>
              </div>
            </div>
            
            {/* Timeline Visualization */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Project Timeline</h3>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xl font-semibold text-cyan-400">
                  {analysis.timeline_estimate || 'Not estimated'}
                </div>
              </div>
            </div>
            
            {/* Task Breakdown */}
            {analysis.tasks && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Task Breakdown</h3>
                <div className="space-y-3">
                  {analysis.tasks.slice(0, 5).map((task: any, index: number) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white">{task.title}</h4>
                        <div className="text-sm text-gray-400">{task.estimated_hours}h</div>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{task.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {task.required_skills?.map((skill: string, skillIndex: number) => (
                          <span
                            key={skillIndex}
                            className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded text-xs text-cyan-400"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {analysis.tasks.length > 5 && (
                    <div className="text-center text-gray-400 text-sm">
                      +{analysis.tasks.length - 5} more tasks...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Skill Market Analysis</h3>
            
            {skillAnalysis.length > 0 ? (
              <div className="space-y-4">
                {skillAnalysis.map((skill, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-white">{skill.skill}</h4>
                        {getTrendIcon(skill.growth_trend)}
                      </div>
                      <div className="text-sm text-green-400 font-medium">
                        ${skill.market_rate.toFixed(0)}/hr
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Market Demand</div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-400 h-2 rounded-full"
                            style={{ width: `${skill.demand_score}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{skill.demand_score.toFixed(0)}%</div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Developer Supply</div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-400 h-2 rounded-full"
                            style={{ width: `${skill.supply_score}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{skill.supply_score.toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Code size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No skill analysis available</p>
              </div>
            )}
          </div>
        )}

        {/* Complexity Tab */}
        {activeTab === 'complexity' && complexityBreakdown && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Complexity Breakdown</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {[
                  { name: 'Technical Complexity', score: complexityBreakdown.technical_complexity, color: 'blue' },
                  { name: 'Integration Complexity', score: complexityBreakdown.integration_complexity, color: 'purple' },
                  { name: 'UI Complexity', score: complexityBreakdown.ui_complexity, color: 'green' }
                ].map((item, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{item.name}</span>
                      <span className="text-gray-400">{item.score.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className={`bg-${item.color}-400 h-3 rounded-full`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                {[
                  { name: 'Data Complexity', score: complexityBreakdown.data_complexity, color: 'yellow' },
                  { name: 'Scalability Requirements', score: complexityBreakdown.scalability_requirements, color: 'red' },
                  { name: 'Overall Score', score: complexityBreakdown.overall_score, color: 'cyan' }
                ].map((item, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{item.name}</span>
                      <span className="text-gray-400">{item.score.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className={`bg-${item.color}-400 h-3 rounded-full`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">AI Insights & Recommendations</h3>
            
            {insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getInsightIcon(insight.type)}
                        <h4 className="font-medium text-white">{insight.title}</h4>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                        <button
                          onClick={() => toggleDetails(`insight-${index}`)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {showDetails.has(`insight-${index}`) ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-3">{insight.description}</p>
                    
                    {insight.actionable && insight.recommendation && (
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Lightbulb size={14} className="text-yellow-400" />
                          <span className="text-sm font-medium text-yellow-400">Recommendation</span>
                        </div>
                        <p className="text-sm text-gray-300">{insight.recommendation}</p>
                      </div>
                    )}
                    
                    {showDetails.has(`insight-${index}`) && (
                      <div className="mt-3 pt-3 border-t border-white/20">
                        <div className="text-sm text-gray-400">
                          Additional details and context would be shown here...
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No insights available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}