'use client';

import { useState, useEffect } from 'react';
import { Trophy, Star, Zap, Target, Award, TrendingUp, Users, Gift } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  reward: number;
}

interface SkillNode {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  unlocked: boolean;
  prerequisites: string[];
  description: string;
  category: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  reward: number;
  timeLimit: string;
  participants: number;
  status: 'active' | 'completed' | 'upcoming';
}

export function GamificationSystem() {
  const [userLevel, setUserLevel] = useState(42);
  const [userXP, setUserXP] = useState(8750);
  const [nextLevelXP, setNextLevelXP] = useState(10000);
  const [workTokens, setWorkTokens] = useState(2450);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [skillTree, setSkillTree] = useState<SkillNode[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'skills' | 'challenges' | 'leaderboard'>('overview');

  const mockAchievements: Achievement[] = [
    {
      id: 'first-course',
      title: 'Neural Initiate',
      description: 'Complete your first quantum computing course',
      icon: '🧠',
      rarity: 'common',
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      reward: 100
    },
    {
      id: 'coding-streak',
      title: 'Code Warrior',
      description: 'Code for 7 consecutive days',
      icon: '⚔️',
      rarity: 'rare',
      progress: 5,
      maxProgress: 7,
      unlocked: false,
      reward: 250
    },
    {
      id: 'mentor-shadow',
      title: 'Shadow Master',
      description: 'Complete 10 shadowing sessions',
      icon: '👥',
      rarity: 'epic',
      progress: 7,
      maxProgress: 10,
      unlocked: false,
      reward: 500
    },
    {
      id: 'quantum-expert',
      title: 'Quantum Sage',
      description: 'Master all quantum computing skills',
      icon: '🌌',
      rarity: 'legendary',
      progress: 3,
      maxProgress: 5,
      unlocked: false,
      reward: 1000
    }
  ];

  const mockSkillTree: SkillNode[] = [
    {
      id: 'quantum-basics',
      name: 'Quantum Fundamentals',
      level: 5,
      maxLevel: 5,
      unlocked: true,
      prerequisites: [],
      description: 'Basic quantum computing concepts',
      category: 'quantum'
    },
    {
      id: 'quantum-gates',
      name: 'Quantum Gates',
      level: 4,
      maxLevel: 5,
      unlocked: true,
      prerequisites: ['quantum-basics'],
      description: 'Understanding quantum gate operations',
      category: 'quantum'
    },
    {
      id: 'quantum-algorithms',
      name: 'Quantum Algorithms',
      level: 2,
      maxLevel: 5,
      unlocked: true,
      prerequisites: ['quantum-gates'],
      description: 'Advanced quantum algorithm design',
      category: 'quantum'
    },
    {
      id: 'ai-basics',
      name: 'AI Fundamentals',
      level: 3,
      maxLevel: 5,
      unlocked: true,
      prerequisites: [],
      description: 'Machine learning basics',
      category: 'ai'
    },
    {
      id: 'neural-networks',
      name: 'Neural Networks',
      level: 2,
      maxLevel: 5,
      unlocked: true,
      prerequisites: ['ai-basics'],
      description: 'Deep learning architectures',
      category: 'ai'
    },
    {
      id: 'transformers',
      name: 'Transformers',
      level: 0,
      maxLevel: 5,
      unlocked: false,
      prerequisites: ['neural-networks'],
      description: 'Advanced transformer models',
      category: 'ai'
    }
  ];

  const mockChallenges: Challenge[] = [
    {
      id: 'quantum-challenge-1',
      title: 'Quantum Supremacy Sprint',
      description: 'Build a quantum algorithm that outperforms classical computing',
      difficulty: 'expert',
      reward: 1000,
      timeLimit: '7 days',
      participants: 156,
      status: 'active'
    },
    {
      id: 'ai-challenge-1',
      title: 'Neural Network Optimization',
      description: 'Optimize a neural network for maximum efficiency',
      difficulty: 'hard',
      reward: 500,
      timeLimit: '3 days',
      participants: 89,
      status: 'active'
    },
    {
      id: 'blockchain-challenge-1',
      title: 'DeFi Protocol Design',
      description: 'Create an innovative DeFi protocol with unique features',
      difficulty: 'medium',
      reward: 300,
      timeLimit: '5 days',
      participants: 234,
      status: 'upcoming'
    }
  ];

  useEffect(() => {
    setAchievements(mockAchievements);
    setSkillTree(mockSkillTree);
    setChallenges(mockChallenges);
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
      case 'rare': return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
      case 'epic': return 'text-purple-400 bg-purple-500/20 border-purple-500/40';
      case 'legendary': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'hard': return 'text-orange-400 bg-orange-500/20';
      case 'expert': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'quantum': return 'text-purple-400 bg-purple-500/20';
      case 'ai': return 'text-cyan-400 bg-cyan-500/20';
      case 'blockchain': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const levelUpSkill = (skillId: string) => {
    setSkillTree(prev => prev.map(skill => {
      if (skill.id === skillId && skill.level < skill.maxLevel) {
        return { ...skill, level: skill.level + 1 };
      }
      return skill;
    }));
    
    // Award XP for leveling up
    setUserXP(prev => prev + 100);
    setWorkTokens(prev => prev + 50);
  };

  const joinChallenge = (challengeId: string) => {
    alert(`Joined challenge: ${challengeId}`);
  };

  return (
    <div className="nexus-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Neural Achievement System</h2>
          <p className="text-sm opacity-80">Level up your skills and earn rewards</p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-400">Level {userLevel}</div>
          <div className="font-bold text-cyan-400">{workTokens} WORK</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: Target },
          { id: 'achievements', label: 'Achievements', icon: Trophy },
          { id: 'skills', label: 'Skill Tree', icon: Star },
          { id: 'challenges', label: 'Challenges', icon: Zap },
          { id: 'leaderboard', label: 'Leaderboard', icon: Users },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-cyan-500/20 text-cyan-400' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Level Progress */}
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg p-6 border border-cyan-500/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-cyan-400">Level {userLevel}</h3>
                <p className="text-sm opacity-80">Neural Engineer</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-400">{workTokens} WORK</div>
                <div className="text-sm text-gray-400">Total Earned</div>
              </div>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>XP Progress</span>
                <span>{userXP} / {nextLevelXP}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${(userXP / nextLevelXP) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={16} className="text-yellow-400" />
                <span className="text-sm">Achievements</span>
              </div>
              <div className="text-xl font-bold text-yellow-400">
                {achievements.filter(a => a.unlocked).length}
              </div>
              <div className="text-xs text-gray-400">
                of {achievements.length} unlocked
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star size={16} className="text-purple-400" />
                <span className="text-sm">Skills Mastered</span>
              </div>
              <div className="text-xl font-bold text-purple-400">
                {skillTree.filter(s => s.level === s.maxLevel).length}
              </div>
              <div className="text-xs text-gray-400">
                of {skillTree.length} skills
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-orange-400" />
                <span className="text-sm">Active Challenges</span>
              </div>
              <div className="text-xl font-bold text-orange-400">
                {challenges.filter(c => c.status === 'active').length}
              </div>
              <div className="text-xs text-gray-400">
                challenges available
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-green-400" />
                <span className="text-sm">Weekly XP</span>
              </div>
              <div className="text-xl font-bold text-green-400">
                1,250
              </div>
              <div className="text-xs text-gray-400">
                +15% from last week
              </div>
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-cyan-400 mb-3">Recent Achievements</h4>
            <div className="space-y-2">
              {achievements.filter(a => a.unlocked).slice(0, 3).map(achievement => (
                <div key={achievement.id} className="flex items-center gap-3 p-2 bg-white/5 rounded">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{achievement.title}</div>
                    <div className="text-xs text-gray-400">{achievement.description}</div>
                  </div>
                  <div className="text-green-400 font-semibold">+{achievement.reward} WORK</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map(achievement => (
            <div key={achievement.id} className={`rounded-lg p-4 border ${
              achievement.unlocked ? getRarityColor(achievement.rarity) : 'bg-white/5 border-white/10 opacity-60'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{achievement.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold">{achievement.title}</h3>
                  <p className="text-sm opacity-80">{achievement.description}</p>
                </div>
                {achievement.unlocked && <Award size={20} className="text-yellow-400" />}
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{achievement.progress} / {achievement.maxProgress}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
                    style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${getRarityColor(achievement.rarity)}`}>
                  {achievement.rarity}
                </span>
                <span className="text-green-400 font-semibold">+{achievement.reward} WORK</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skill Tree Tab */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          {['quantum', 'ai', 'blockchain'].map(category => (
            <div key={category} className="bg-white/5 rounded-lg p-4">
              <h3 className={`font-semibold mb-4 capitalize ${getCategoryColor(category).split(' ')[0]}`}>
                {category} Skills
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {skillTree.filter(skill => skill.category === category).map(skill => (
                  <div key={skill.id} className={`rounded-lg p-4 border ${
                    skill.unlocked ? 'bg-white/5 border-cyan-500/20' : 'bg-white/5 border-white/10 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{skill.name}</h4>
                      <span className="text-xs bg-white/10 px-2 py-1 rounded">
                        {skill.level}/{skill.maxLevel}
                      </span>
                    </div>
                    
                    <p className="text-sm opacity-80 mb-3">{skill.description}</p>
                    
                    <div className="mb-3">
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full"
                          style={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {skill.unlocked && skill.level < skill.maxLevel && (
                      <button
                        onClick={() => levelUpSkill(skill.id)}
                        className="nexus-action-btn w-full text-sm py-1"
                      >
                        Level Up (+100 XP)
                      </button>
                    )}
                    
                    {!skill.unlocked && (
                      <div className="text-xs text-gray-400">
                        Requires: {skill.prerequisites.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          {challenges.map(challenge => (
            <div key={challenge.id} className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-cyan-400">{challenge.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-sm opacity-80 mb-2">{challenge.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Gift size={14} />
                      <span>{challenge.reward} WORK</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{challenge.timeLimit}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{challenge.participants} participants</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => joinChallenge(challenge.id)}
                  disabled={challenge.status !== 'active'}
                  className={`nexus-action-btn text-sm px-4 py-1 ${
                    challenge.status === 'upcoming' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {challenge.status === 'active' ? 'Join Challenge' : 
                   challenge.status === 'upcoming' ? 'Coming Soon' : 'Completed'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
            <h3 className="font-semibold text-yellow-400 mb-3">Global Leaderboard</h3>
            
            <div className="space-y-2">
              {[
                { rank: 1, name: 'QuantumMaster', level: 87, xp: 45230, tokens: 12450 },
                { rank: 2, name: 'NeuralNinja', level: 82, xp: 42100, tokens: 11890 },
                { rank: 3, name: 'CodeSage', level: 79, xp: 39850, tokens: 10230 },
                { rank: 4, name: 'You', level: userLevel, xp: userXP, tokens: workTokens },
                { rank: 5, name: 'BlockchainBoss', level: 71, xp: 35600, tokens: 9450 }
              ].map((player, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded ${
                  player.name === 'You' ? 'bg-cyan-500/20 border border-cyan-500/40' : 'bg-white/5'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      player.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                      player.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                      player.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-white/10'
                    }`}>
                      {player.rank}
                    </div>
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-gray-400">Level {player.level}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-green-400">{player.tokens} WORK</div>
                    <div className="text-xs text-gray-400">{player.xp.toLocaleString()} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}