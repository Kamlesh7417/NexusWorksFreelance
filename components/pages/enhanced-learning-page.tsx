'use client';

import { useState, useEffect } from 'react';
import { PageType } from '@/app/page';
import { CoursePlayer } from '@/components/learning/course-player';
import { CodingEnvironment } from '@/components/learning/coding-environment';
import { ShadowingSystem } from '@/components/learning/shadowing-system';
import { GamificationSystem } from '@/components/learning/gamification-system';
import { SkillAssessment } from '@/components/learning/skill-assessment';
import { 
  BookOpen, 
  Code, 
  Users, 
  Trophy, 
  Brain, 
  Zap, 
  Target,
  TrendingUp,
  Award,
  Clock,
  Star
} from 'lucide-react';

interface EnhancedLearningPageProps {
  onPageChange: (page: PageType) => void;
}

export function EnhancedLearningPage({ onPageChange }: EnhancedLearningPageProps) {
  const [activeTab, setActiveTab] = useState<'courses' | 'coding' | 'shadowing' | 'gamification' | 'assessment'>('courses');
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSkill, setActiveSkill] = useState(0);
  const [userLevel, setUserLevel] = useState(12);
  const [userXP, setUserXP] = useState(3450);

  const learningPaths = [
    {
      id: 'web',
      name: 'Web Development Mastery',
      icon: '🌐',
      level: 'Advanced',
      duration: '12 weeks',
      modules: 24,
      students: 8900,
      rating: 4.9,
      progress: 65,
      color: 'text-blue-400',
      description: 'Master modern web development with React, Node.js, and cloud deployment',
      skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
      nextMilestone: 'Full-Stack Application'
    },
    {
      id: 'ai',
      name: 'AI/ML Engineering',
      icon: '🤖',
      level: 'Intermediate',
      duration: '16 weeks',
      modules: 32,
      students: 7500,
      rating: 4.8,
      progress: 42,
      color: 'text-cyan-400',
      description: 'Build advanced neural networks, transformers, and production ML systems',
      skills: ['TensorFlow', 'PyTorch', 'Python', 'MLOps'],
      nextMilestone: 'Build ML Model from Scratch'
    },
    {
      id: 'blockchain',
      name: 'Blockchain & DeFi',
      icon: '⛓️',
      level: 'Advanced',
      duration: '10 weeks',
      modules: 20,
      students: 5670,
      rating: 4.7,
      progress: 78,
      color: 'text-green-400',
      description: 'Create smart contracts, DeFi protocols, and blockchain security systems',
      skills: ['Solidity', 'Web3', 'DeFi', 'Security Auditing'],
      nextMilestone: 'Deploy Smart Contract'
    },
    {
      id: 'mobile',
      name: 'Mobile Development',
      icon: '📱',
      level: 'Intermediate',
      duration: '14 weeks',
      modules: 28,
      students: 6200,
      rating: 4.6,
      progress: 23,
      color: 'text-yellow-400',
      description: 'Build cross-platform mobile applications with React Native and Flutter',
      skills: ['React Native', 'Flutter', 'iOS', 'Android'],
      nextMilestone: 'Create Mobile App'
    }
  ];

  const skillCategories = [
    {
      name: 'Web Technologies',
      icon: '🌐',
      skills: ['React', 'Node.js', 'TypeScript'],
      progress: 65,
      color: 'text-blue-400'
    },
    {
      name: 'Artificial Intelligence',
      icon: '🤖',
      skills: ['Machine Learning', 'Computer Vision', 'NLP'],
      progress: 78,
      color: 'text-cyan-400'
    },
    {
      name: 'Blockchain & Web3',
      icon: '⛓️',
      skills: ['Smart Contracts', 'DeFi', 'NFTs'],
      progress: 52,
      color: 'text-green-400'
    },
    {
      name: 'Mobile Development',
      icon: '📱',
      skills: ['React Native', 'Flutter', 'Swift'],
      progress: 34,
      color: 'text-yellow-400'
    }
  ];

  const tabs = [
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'coding', label: 'Coding Lab', icon: Code },
    { id: 'shadowing', label: 'Expert Shadowing', icon: Users },
    { id: 'gamification', label: 'Achievements', icon: Trophy },
    { id: 'assessment', label: 'Skill Assessment', icon: Brain },
  ];

  useEffect(() => {
    setIsLoaded(true);
    
    // Cycle through skills
    const skillTimer = setInterval(() => {
      setActiveSkill(prev => (prev + 1) % skillCategories.length);
    }, 3000);

    return () => {
      clearInterval(skillTimer);
    };
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'text-green-400 bg-green-500/20';
      case 'Intermediate': return 'text-yellow-400 bg-yellow-500/20';
      case 'Advanced': return 'text-red-400 bg-red-500/20';
      case 'Expert': return 'text-purple-400 bg-purple-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (!isLoaded) {
    return (
      <div className="nexus-loading-overlay flex">
        <div className="nexus-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Learning Paths Overview */}
      <div className="nexus-container mb-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-cyan-400 mb-4">Personalized Learning Paths</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            AI-curated learning journeys designed to accelerate your mastery of emerging technologies
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {learningPaths.map((path, index) => (
            <div 
              key={path.id}
              className="nexus-card group transform hover:scale-105 transition-all duration-500"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl group-hover:scale-125 transition-all duration-500">
                  {path.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold ${path.color} group-hover:text-white transition-colors`}>
                    {path.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(path.level)}`}>
                      {path.level}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400" />
                      <span className="text-sm">{path.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-sm opacity-80 mb-4">{path.description}</p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {path.skills.map((skill, skillIndex) => (
                  <span key={skillIndex} className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs">
                    {skill}
                  </span>
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-400">Duration:</span>
                  <div className="font-semibold">{path.duration}</div>
                </div>
                <div>
                  <span className="text-gray-400">Modules:</span>
                  <div className="font-semibold">{path.modules}</div>
                </div>
                <div>
                  <span className="text-gray-400">Students:</span>
                  <div className="font-semibold text-purple-400">{path.students.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{path.progress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className={`bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-1000`}
                    style={{ width: `${path.progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3 mb-4">
                <div className="text-xs text-gray-400 mb-1">Next Milestone:</div>
                <div className="font-medium text-cyan-400">{path.nextMilestone}</div>
              </div>
              
              <button className="nexus-action-btn w-full">
                Continue Learning
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Skill Categories */}
      <div className="nexus-container mb-8">
        <div className="nexus-card">
          <h3 className="text-2xl font-bold text-cyan-400 mb-6">Skill Mastery Tracker</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skillCategories.map((category, index) => {
              const isActive = activeSkill === index;
              return (
                <div 
                  key={index}
                  className={`bg-white/5 rounded-lg p-4 transition-all duration-700 transform ${
                    isActive ? 'scale-110 shadow-2xl shadow-cyan-500/20' : 'hover:scale-105'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-3xl mb-3 transition-all duration-500 ${
                      isActive ? 'animate-bounce scale-125' : 'group-hover:scale-110'
                    }`}>
                      {category.icon}
                    </div>
                    <h4 className={`font-semibold ${category.color} mb-3`}>{category.name}</h4>
                    
                    <div className="space-y-2 mb-4">
                      {category.skills.map((skill, skillIndex) => (
                        <div key={skillIndex} className="text-xs bg-white/5 rounded p-1">
                          {skill}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Mastery</span>
                        <span>{category.progress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-1000`}
                          style={{ width: `${category.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="nexus-container mb-8">
        <div className="flex gap-1 bg-white/5 rounded-lg p-1 max-w-4xl mx-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all transform hover:scale-105 ${
                  activeTab === tab.id 
                    ? 'bg-cyan-500/20 text-cyan-400 scale-105' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="nexus-container">
        {activeTab === 'courses' && <CoursePlayer />}
        {activeTab === 'coding' && <CodingEnvironment />}
        {activeTab === 'shadowing' && <ShadowingSystem />}
        {activeTab === 'gamification' && <GamificationSystem />}
        {activeTab === 'assessment' && <SkillAssessment />}
      </div>

      {/* Developer Learning Benefits */}
      <div className="nexus-container mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="nexus-card transform hover:scale-105 transition-all duration-500">
            <div className="flex items-center gap-3 mb-4">
              <Brain size={24} className="text-cyan-400" />
              <h3 className="font-semibold text-cyan-400">AI-Powered Learning</h3>
            </div>
            <p className="text-sm opacity-80">
              Personalized learning paths adapted to your skill level and career goals using advanced AI algorithms.
            </p>
          </div>
          
          <div className="nexus-card transform hover:scale-105 transition-all duration-500">
            <div className="flex items-center gap-3 mb-4">
              <Users size={24} className="text-green-400" />
              <h3 className="font-semibold text-green-400">Expert Mentorship</h3>
            </div>
            <p className="text-sm opacity-80">
              Shadow industry experts in real-time and learn from their actual work processes and decision-making.
            </p>
          </div>
          
          <div className="nexus-card transform hover:scale-105 transition-all duration-500">
            <div className="flex items-center gap-3 mb-4">
              <Trophy size={24} className="text-yellow-400" />
              <h3 className="font-semibold text-yellow-400">Earn While Learning</h3>
            </div>
            <p className="text-sm opacity-80">
              Gain tokens for completing courses, achieving milestones, and contributing to the developer community.
            </p>
          </div>
        </div>
      </div>

      {/* Learning Status */}
      <div className="nexus-container mt-6">
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-500/30 transition-all duration-500">
          <div className="flex items-center gap-3 mb-4">
            <Zap size={24} className="text-purple-400 animate-pulse" />
            <div>
              <h3 className="font-semibold text-purple-400">Learning Engine Active</h3>
              <p className="text-sm opacity-80">AI-powered personalization and real-time skill tracking for developers</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white/5 rounded-lg p-3 text-center transition-all duration-300">
              <div className="text-cyan-400 font-bold text-lg">127</div>
              <div className="text-gray-400">Courses Available</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center transition-all duration-300">
              <div className="text-green-400 font-bold text-lg">45</div>
              <div className="text-gray-400">Live Mentors</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center transition-all duration-300">
              <div className="text-yellow-400 font-bold text-lg">8.9k</div>
              <div className="text-gray-400">Active Learners</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center transition-all duration-300">
              <div className="text-purple-400 font-bold text-lg">99.2%</div>
              <div className="text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}