'use client';

import { useState, useEffect } from 'react';
import { 
  Zap, 
  Brain, 
  Users, 
  Shield, 
  Globe, 
  Rocket,
  Star,
  TrendingUp,
  Code,
  Palette,
  Database,
  Lock,
  ArrowRight,
  CheckCircle,
  Activity,
  Target,
  Award,
  Clock,
  Trophy,
  Gamepad2,
  Bot,
  Sparkles,
  Crown,
  Medal,
  Flame
} from 'lucide-react';

export function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeAvatar, setActiveAvatar] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  const [stats, setStats] = useState({
    developers: 0,
    projects: 0,
    satisfaction: 0,
    countries: 0
  });

  const aiAvatars = [
    {
      name: "ARIA",
      role: "AI Project Coordinator",
      personality: "Analytical & Efficient",
      avatar: "🤖",
      color: "text-cyan-400",
      message: "I analyze 10,000+ data points to match you with the perfect developer in under 3 seconds.",
      stats: { accuracy: "99.2%", processed: "2.4M+", speed: "2.8s" }
    },
    {
      name: "NEXUS",
      role: "Quantum Security Guardian",
      personality: "Vigilant & Protective",
      avatar: "🛡️",
      color: "text-green-400",
      message: "I protect $50M+ in transactions with quantum-resistant encryption and zero breaches.",
      stats: { secured: "$50M+", breaches: "0", strength: "256-bit" }
    },
    {
      name: "ECHO",
      role: "Neural Collaboration Facilitator",
      personality: "Creative & Collaborative",
      avatar: "🧠",
      color: "text-purple-400",
      message: "I enable seamless holographic workspaces with BCI integration across continents.",
      stats: { workspaces: "12K+", latency: "15ms", satisfaction: "97%" }
    },
    {
      name: "COSMOS",
      role: "Global Talent Navigator",
      personality: "Worldly & Connected",
      avatar: "🌌",
      color: "text-blue-400",
      message: "I connect you to 50,000+ verified developers across 120 countries instantly.",
      stats: { developers: "50K+", countries: "120", languages: "500+" }
    }
  ];

  const gamificationElements = [
    {
      title: "Developer Achievements",
      icon: Trophy,
      color: "text-yellow-400",
      items: [
        { name: "Code Warrior", description: "Complete 10 projects", reward: "500 XP", rarity: "rare" },
        { name: "Quantum Master", description: "Master quantum computing", reward: "1000 XP", rarity: "legendary" },
        { name: "AI Whisperer", description: "Build 5 AI projects", reward: "750 XP", rarity: "epic" },
        { name: "Blockchain Pioneer", description: "Deploy smart contracts", reward: "600 XP", rarity: "rare" }
      ]
    },
    {
      title: "Client Rewards",
      icon: Crown,
      color: "text-green-400",
      items: [
        { name: "Project Launcher", description: "Post first project", reward: "200 XP", rarity: "common" },
        { name: "Team Builder", description: "Hire 5 developers", reward: "800 XP", rarity: "epic" },
        { name: "Innovation Leader", description: "Fund cutting-edge tech", reward: "1200 XP", rarity: "legendary" },
        { name: "Global Connector", description: "Work with 10 countries", reward: "900 XP", rarity: "epic" }
      ]
    }
  ];

  useEffect(() => {
    setIsLoaded(true);
    
    // Animate stats counter
    const animateStats = () => {
      const targets = { developers: 50000, projects: 125000, satisfaction: 98.5, countries: 120 };
      const duration = 2000;
      const steps = 60;
      const stepTime = duration / steps;
      
      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        
        setStats({
          developers: Math.floor(targets.developers * progress),
          projects: Math.floor(targets.projects * progress),
          satisfaction: Math.floor(targets.satisfaction * progress * 10) / 10,
          countries: Math.floor(targets.countries * progress)
        });
        
        if (step >= steps) {
          clearInterval(timer);
          setStats(targets);
        }
      }, stepTime);
    };

    // Animate XP gain
    const animateXP = () => {
      let currentXP = 0;
      const targetXP = 2450;
      const xpTimer = setInterval(() => {
        currentXP += 50;
        setUserXP(currentXP);
        
        // Level up logic
        const newLevel = Math.floor(currentXP / 1000) + 1;
        if (newLevel !== userLevel) {
          setUserLevel(newLevel);
        }
        
        if (currentXP >= targetXP) {
          clearInterval(xpTimer);
          setUserXP(targetXP);
        }
      }, 50);
    };

    setTimeout(animateStats, 500);
    setTimeout(animateXP, 1000);

    // Cycle through features and avatars
    const featureTimer = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 6);
    }, 4000);

    const avatarTimer = setInterval(() => {
      setActiveAvatar(prev => (prev + 1) % aiAvatars.length);
    }, 5000);

    // Initialize progress bars and animations
    const timer = setTimeout(() => {
      const progressBars = document.querySelectorAll('.nexus-progress');
      progressBars.forEach((bar, index) => {
        const element = bar as HTMLElement;
        const values = [99.9, 256, 24, 100];
        element.style.width = `${values[index] || 50}%`;
      });

      const skillBars = document.querySelectorAll('.nexus-skill-progress');
      skillBars.forEach((bar, index) => {
        const element = bar as HTMLElement;
        const values = [95, 88, 92, 85, 90, 87];
        element.style.width = `${values[index] || 50}%`;
      });

      const chartBars = document.querySelectorAll('.nexus-bar');
      chartBars.forEach((bar, index) => {
        const element = bar as HTMLElement;
        const values = [85, 92, 78, 88, 95, 82];
        element.style.height = `${values[index] || 50}%`;
      });
    }, 1000);

    return () => {
      clearInterval(featureTimer);
      clearInterval(avatarTimer);
      clearTimeout(timer);
    };
  }, [userLevel]);

  const features = [
    {
      icon: Brain,
      title: "Quantum AI Matching",
      description: "Advanced neural networks analyze 10,000+ data points to match clients with perfect developers in under 3 seconds.",
      color: "text-cyan-400",
      stats: { accuracy: "99.2%", speed: "2.8s", matches: "45K+" }
    },
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Military-grade quantum-resistant encryption protects $50M+ in transactions with zero security breaches.",
      color: "text-green-400",
      stats: { secured: "$50M+", breaches: "0", encryption: "256-bit" }
    },
    {
      icon: Users,
      title: "Neural Collaboration",
      description: "Holographic workspaces with BCI integration enable seamless real-time collaboration across continents.",
      color: "text-purple-400",
      stats: { workspaces: "12K+", latency: "15ms", satisfaction: "97%" }
    },
    {
      icon: Globe,
      title: "Global Talent Pool",
      description: "Access 50,000+ verified developers across 120 countries with expertise in 500+ technologies.",
      color: "text-blue-400",
      stats: { developers: "50K+", countries: "120", technologies: "500+" }
    },
    {
      icon: TrendingUp,
      title: "Dynamic Pricing",
      description: "AI analyzes market conditions, complexity, and demand to optimize pricing with 94% accuracy.",
      color: "text-yellow-400",
      stats: { accuracy: "94%", savings: "23%", optimization: "Real-time" }
    },
    {
      icon: Rocket,
      title: "Future-Ready Platform",
      description: "Built for quantum computing, AR/VR, and next-gen AI with 99.9% uptime and infinite scalability.",
      color: "text-red-400",
      stats: { uptime: "99.9%", scalability: "∞", technologies: "Next-gen" }
    }
  ];

  const platformStats = [
    { label: "Active Developers", value: stats.developers, suffix: "+", icon: Code, color: "text-cyan-400" },
    { label: "Projects Completed", value: stats.projects, suffix: "+", icon: CheckCircle, color: "text-green-400" },
    { label: "Client Satisfaction", value: stats.satisfaction, suffix: "%", icon: Star, color: "text-yellow-400" },
    { label: "Countries Served", value: stats.countries, suffix: "+", icon: Globe, color: "text-purple-400" }
  ];

  const technologies = [
    { 
      name: "Quantum Computing", 
      icon: "🌌", 
      description: "Next-gen quantum algorithms",
      projects: "2,450+",
      growth: "+340%"
    },
    { 
      name: "AI/Machine Learning", 
      icon: "🧠", 
      description: "Advanced neural networks",
      projects: "8,900+",
      growth: "+180%"
    },
    { 
      name: "Blockchain & Web3", 
      icon: "⛓️", 
      description: "Decentralized solutions",
      projects: "5,670+",
      growth: "+250%"
    },
    { 
      name: "AR/VR Development", 
      icon: "🥽", 
      description: "Immersive experiences",
      projects: "3,200+",
      growth: "+420%"
    },
    { 
      name: "Cybersecurity", 
      icon: "🔒", 
      description: "Quantum-resistant security",
      projects: "4,100+",
      growth: "+190%"
    },
    { 
      name: "IoT & Edge Computing", 
      icon: "📡", 
      description: "Connected ecosystems",
      projects: "6,800+",
      growth: "+160%"
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
      case 'rare': return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
      case 'epic': return 'text-purple-400 bg-purple-500/20 border-purple-500/40';
      case 'legendary': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
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
    <div className="space-y-16">
      {/* Hero Section with AI Avatar and Gamification */}
      <section className="nexus-welcome-section text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-blue-500/10 animate-pulse"></div>
        
        {/* Floating XP and Level Display */}
        <div className="fixed top-20 right-4 z-50 bg-black/80 border border-cyan-500/30 rounded-lg p-4 backdrop-blur-lg">
          <div className="flex items-center gap-3 mb-2">
            <Crown size={20} className="text-yellow-400" />
            <span className="font-bold text-yellow-400">Level {userLevel}</span>
          </div>
          <div className="w-32 bg-white/10 rounded-full h-2 mb-1">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(userXP % 1000) / 10}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-400">{userXP} XP</div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-fadeIn">
            The Future of Freelancing
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300 leading-relaxed">
            Where quantum AI meets human creativity. Connect with elite developers, 
            leverage blockchain security, and build tomorrow's technology today.
          </p>
          
          {/* Enhanced Holographic Platform Preview with 3D Animation */}
          <div className="relative mb-8">
            <div className="nexus-hologram transform-gpu perspective-1000">
              <div className="text-center relative">
                <div className="text-2xl font-bold mb-2">NexusWorks Platform</div>
                <div className="text-sm opacity-80 mb-4">[Holographic Interface Preview]</div>
                
                {/* 3D Floating Elements */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 left-4 w-8 h-8 bg-cyan-400/30 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="absolute top-8 right-6 w-6 h-6 bg-purple-400/30 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute bottom-6 left-8 w-4 h-4 bg-green-400/30 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute bottom-4 right-4 w-10 h-10 bg-yellow-400/30 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary flex items-center gap-2 group">
              <Users size={20} className="group-hover:animate-pulse" />
              Find Developers
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="btn-primary flex items-center gap-2 group" style={{
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7, #9333ea)',
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 3s ease-in-out infinite'
            }}>
              <Code size={20} className="group-hover:animate-pulse" />
              Join as Developer
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* AI Avatars Section with 3D Cards */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-cyan-400 mb-4">Meet Your AI Team</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our AI assistant handles proposals, project scoping, and client communication so you focus on what you do best - creating exceptional work.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {aiAvatars.map((avatar, index) => {
            const isActive = activeAvatar === index;
            return (
              <div 
                key={index} 
                className={`nexus-card group transition-all duration-700 transform-gpu ${
                  isActive ? 'scale-110 shadow-2xl shadow-cyan-500/30 rotate-y-12' : 'hover:scale-105 hover:rotate-y-6'
                }`}
                onMouseEnter={() => setActiveAvatar(index)}
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '1000px'
                }}
              >
                <div className="text-center">
                  <div className={`text-6xl mb-4 transition-all duration-500 ${
                    isActive ? 'animate-bounce scale-125' : 'group-hover:scale-110'
                  }`}>
                    {avatar.avatar}
                  </div>
                  <h3 className={`text-xl font-bold ${avatar.color} mb-2`}>{avatar.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{avatar.role}</p>
                  <p className="text-xs opacity-70 mb-4">{avatar.personality}</p>
                  
                  {/* Avatar Stats */}
                  <div className="grid grid-cols-3 gap-1 text-xs mb-4">
                    {Object.entries(avatar.stats).map(([key, value], statIndex) => (
                      <div key={statIndex} className="bg-white/5 rounded p-1">
                        <div className={`font-bold ${avatar.color}`}>{value}</div>
                        <div className="text-gray-400 capitalize">{key}</div>
                      </div>
                    ))}
                  </div>
                  
                  {isActive && (
                    <div className="bg-white/5 rounded-lg p-3 border border-cyan-500/20 animate-fadeIn">
                      <p className="text-sm italic">{avatar.message}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Gamification Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-cyan-400 mb-4">Level Up Your Career</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Earn XP, unlock achievements, and climb the leaderboards as you build amazing projects.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {gamificationElements.map((category, categoryIndex) => {
            const Icon = category.icon;
            return (
              <div key={categoryIndex} className="nexus-card">
                <div className="flex items-center gap-3 mb-6">
                  <Icon size={32} className={`${category.color} animate-pulse`} />
                  <h3 className={`text-2xl font-bold ${category.color}`}>{category.title}</h3>
                </div>
                
                <div className="space-y-4">
                  {category.items.map((item, itemIndex) => (
                    <div 
                      key={itemIndex} 
                      className={`p-4 rounded-lg border transition-all duration-300 hover:scale-105 transform-gpu ${getRarityColor(item.rarity)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          {item.rarity === 'legendary' && <Crown size={16} className="text-yellow-400" />}
                          {item.rarity === 'epic' && <Medal size={16} className="text-purple-400" />}
                          {item.rarity === 'rare' && <Star size={16} className="text-blue-400" />}
                          {item.name}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${getRarityColor(item.rarity)}`}>
                          {item.rarity}
                        </span>
                      </div>
                      <p className="text-sm opacity-80 mb-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-green-400 font-semibold">{item.reward}</span>
                        <div className="flex items-center gap-1">
                          <Sparkles size={14} className="text-yellow-400" />
                          <span className="text-xs text-gray-400">Unlock Progress</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Leaderboard Preview */}
        <div className="nexus-card mt-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
          <div className="flex items-center gap-3 mb-6">
            <Trophy size={32} className="text-yellow-400 animate-bounce" />
            <h3 className="text-2xl font-bold text-yellow-400">Global Leaderboard</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { rank: 1, name: "QuantumMaster", level: 87, xp: 45230, badge: "🏆" },
              { rank: 2, name: "NeuralNinja", level: 82, xp: 42100, badge: "🥈" },
              { rank: 3, name: "CodeSage", level: 79, xp: 39850, badge: "🥉" }
            ].map((player, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-3xl mb-2">{player.badge}</div>
                <div className="font-bold text-yellow-400">#{player.rank} {player.name}</div>
                <div className="text-sm text-gray-400">Level {player.level}</div>
                <div className="text-xs text-green-400">{player.xp.toLocaleString()} XP</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Stats Section with 3D Effects */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {platformStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="nexus-card text-center group hover:scale-105 transition-all duration-500 transform-gpu perspective-1000">
              <div className="transform group-hover:rotateY-12 transition-all duration-500" style={{ transformStyle: 'preserve-3d' }}>
                <Icon size={32} className={`${stat.color} mx-auto mb-4 group-hover:animate-spin transition-all duration-500`} />
                <div className={`text-3xl font-bold ${stat.color} mb-2 group-hover:scale-110 transition-all duration-300`}>
                  {typeof stat.value === 'number' ? 
                    (stat.value >= 1000 ? `${Math.floor(stat.value / 1000)}K` : stat.value) : 
                    stat.value
                  }{stat.suffix}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
                <div className="w-full bg-white/10 rounded-full h-1 mt-2">
                  <div 
                    className={`bg-gradient-to-r from-cyan-400 to-blue-500 h-1 rounded-full transition-all duration-2000`}
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Enhanced Features Section with 3D Interactive Cards */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-cyan-400 mb-4">Quantum-Powered Features</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience the next generation of freelancing with cutting-edge technology 
            that transforms how clients and developers collaborate.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isActive = activeFeature === index;
            return (
              <div 
                key={index} 
                className={`nexus-card group transition-all duration-700 transform-gpu perspective-1000 ${
                  isActive ? 'scale-110 shadow-2xl shadow-cyan-500/20 rotateY-12' : 'hover:scale-105 hover:rotateY-6'
                }`}
                onMouseEnter={() => setActiveFeature(index)}
                style={{
                  transformStyle: 'preserve-3d'
                }}
              >
                <div className="transform group-hover:translateZ-20 transition-all duration-500">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-lg bg-white/5 border border-white/10 ${feature.color} transition-all duration-500 ${
                      isActive ? 'animate-pulse scale-125 rotateY-180' : 'group-hover:scale-110 group-hover:rotateY-45'
                    }`}>
                      <Icon size={24} />
                    </div>
                    <h3 className={`text-xl font-semibold ${feature.color}`}>{feature.title}</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed mb-4">{feature.description}</p>
                  
                  {/* Feature Stats with 3D Effect */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {Object.entries(feature.stats).map(([key, value], statIndex) => (
                      <div key={statIndex} className="bg-white/5 rounded p-2 text-center transform group-hover:translateZ-10 transition-all duration-300">
                        <div className={`font-bold ${feature.color}`}>{value}</div>
                        <div className="text-gray-400 capitalize">{key}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 3D Floating Particles */}
                  {isActive && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-2 left-2 w-2 h-2 bg-cyan-400/50 rounded-full animate-ping"></div>
                      <div className="absolute top-4 right-4 w-1 h-1 bg-purple-400/50 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                      <div className="absolute bottom-6 left-6 w-3 h-3 bg-green-400/50 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Technologies Section with Enhanced 3D Animations */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-cyan-400 mb-4">Future Technologies</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our platform specializes in emerging technologies that will define the next decade of innovation.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technologies.map((tech, index) => (
            <div key={index} className="nexus-card group hover:bg-white/10 transition-all duration-500 transform-gpu perspective-1000">
              <div className="transform group-hover:rotateY-12 group-hover:translateZ-20 transition-all duration-500" style={{ transformStyle: 'preserve-3d' }}>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl group-hover:scale-125 group-hover:rotateY-180 transition-all duration-500">{tech.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-cyan-400">{tech.name}</h3>
                    <p className="text-sm text-gray-400">{tech.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="bg-white/5 rounded p-2 transform group-hover:translateZ-10 transition-all duration-300">
                    <div className="text-green-400 font-bold">{tech.projects}</div>
                    <div className="text-gray-400">Projects</div>
                  </div>
                  <div className="bg-white/5 rounded p-2 transform group-hover:translateZ-10 transition-all duration-300">
                    <div className="text-yellow-400 font-bold">{tech.growth}</div>
                    <div className="text-gray-400">Growth</div>
                  </div>
                </div>
                
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="nexus-progress bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: '0%' }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Enhanced How It Works Section with 3D Process Flow */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-cyan-400 mb-4">How NexusWorks Works</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Three simple steps to connect with the world's best developers or find your next project.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* For Clients with Enhanced 3D Visualization */}
          <div className="nexus-card transform-gpu perspective-1000">
            <h3 className="text-2xl font-bold text-green-400 mb-6 text-center">For Clients</h3>
            
            {/* Enhanced Client Process Visualization */}
            <div className="relative mb-6 h-64 bg-gradient-to-br from-green-600 to-teal-500 rounded-lg overflow-hidden transform rotateX-15 hover:rotateX-5 transition-all duration-500">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-xl font-bold mb-2">Client Journey</div>
                  <div className="text-sm opacity-80 mb-4">[Interactive Process Flow]</div>
                  
                  {/* 3D Floating Process Steps */}
                  <div className="relative">
                    <div className="absolute -top-8 -left-8 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                      <span className="text-2xl">📝</span>
                    </div>
                    <div className="absolute -top-4 right-4 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
                      <span className="text-xl">🤖</span>
                    </div>
                    <div className="absolute top-8 -right-8 w-14 h-14 bg-white/20 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '1s' }}>
                      <span className="text-xl">🚀</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold animate-pulse">1</div>
                <div>
                  <h4 className="font-semibold text-green-400 mb-2">Post Your Project</h4>
                  <p className="text-gray-300 mb-2">Describe your project requirements, budget, and timeline. Our AI analyzes and optimizes your posting.</p>
                  <div className="text-xs text-green-400">✓ AI-powered optimization • ✓ Smart budget suggestions • ✓ Timeline estimation</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold animate-pulse" style={{ animationDelay: '0.5s' }}>2</div>
                <div>
                  <h4 className="font-semibold text-green-400 mb-2">Get Matched</h4>
                  <p className="text-gray-300 mb-2">Quantum AI finds the perfect developers based on skills, experience, and project compatibility.</p>
                  <div className="text-xs text-green-400">✓ 99.2% match accuracy • ✓ 2.8s average matching • ✓ Global talent pool</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold animate-pulse" style={{ animationDelay: '1s' }}>3</div>
                <div>
                  <h4 className="font-semibold text-green-400 mb-2">Collaborate & Pay</h4>
                  <p className="text-gray-300 mb-2">Work together in virtual spaces with secure milestone-based payments via blockchain.</p>
                  <div className="text-xs text-green-400">✓ Quantum-secure payments • ✓ Holographic workspaces • ✓ Real-time collaboration</div>
                </div>
              </div>
            </div>
            
            <div className="nexus-progress-container mt-6">
              <div className="nexus-progress-label">
                <span>Client Success Rate</span>
                <span>94%</span>
              </div>
              <div className="nexus-progress-bar">
                <div className="nexus-progress" style={{ width: '94%' }}></div>
              </div>
            </div>
          </div>

          {/* For Developers with Enhanced 3D Workspace */}
          <div className="nexus-card transform-gpu perspective-1000">
            <h3 className="text-2xl font-bold text-purple-400 mb-6 text-center">For Developers</h3>
            
            {/* Enhanced Developer Process Visualization */}
            <div className="relative mb-6 h-64 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg overflow-hidden transform rotateX-15 hover:rotateX-5 transition-all duration-500">
              <div className="grid grid-cols-2 gap-2 p-4 h-full">
                <div className="bg-white/10 rounded-lg flex items-center justify-center text-center transform hover:scale-105 transition-all duration-300">
                  <div>
                    <div className="text-2xl mb-2">👨‍💻</div>
                    <div className="text-sm">Developer Profile</div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg flex items-center justify-center text-center transform hover:scale-105 transition-all duration-300">
                  <div>
                    <div className="text-2xl mb-2">🧠</div>
                    <div className="text-sm">Skill Matrix</div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg flex items-center justify-center text-center transform hover:scale-105 transition-all duration-300">
                  <div>
                    <div className="text-2xl mb-2">🎨</div>
                    <div className="text-sm">Portfolio Showcase</div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg flex items-center justify-center text-center transform hover:scale-105 transition-all duration-300">
                  <div>
                    <div className="text-2xl mb-2">🤖</div>
                    <div className="text-sm">AI Matching</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold animate-pulse">1</div>
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">Build Your Profile</h4>
                  <p className="text-gray-300 mb-2">Showcase your skills, portfolio, and expertise in emerging technologies with holographic presentations.</p>
                  <div className="text-xs text-purple-400">✓ 3D portfolio display • ✓ Skill verification • ✓ Holographic demos</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold animate-pulse" style={{ animationDelay: '0.5s' }}>2</div>
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">Get Discovered</h4>
                  <p className="text-gray-300 mb-2">AI matches you with projects that fit your skills and career goals. No more endless bidding.</p>
                  <div className="text-xs text-purple-400">✓ Smart project matching • ✓ Career path optimization • ✓ Zero bidding required</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold animate-pulse" style={{ animationDelay: '1s' }}>3</div>
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">Learn & Earn</h4>
                  <p className="text-gray-300 mb-2">Access cutting-edge learning resources, shadow experts, and earn WORK tokens for continuous growth.</p>
                  <div className="text-xs text-purple-400">✓ Expert shadowing • ✓ WORK token rewards • ✓ Continuous learning</div>
                </div>
              </div>
            </div>
            
            <div className="nexus-skill-tracker mt-6">
              {['Quantum', 'AI/ML', 'Blockchain', 'AR/VR', 'Security', 'IoT'].map((skill, index) => (
                <div key={index}>
                  <div className="nexus-skill-bar">
                    <div className="nexus-skill-progress" style={{ width: '0%' }}></div>
                  </div>
                  <div className="nexus-skill-label">{skill}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Analytics Dashboard Preview with 3D Charts */}
      <section className="nexus-card transform-gpu perspective-1000">
        <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">Platform Analytics</h2>
        <p className="text-center text-gray-300 mb-8">Real-time insights into the NexusWorks ecosystem</p>
        
        <div className="nexus-analytics-chart transform hover:rotateX-12 hover:rotateY-12 transition-all duration-500" style={{ transformStyle: 'preserve-3d' }}>
          <div className="nexus-chart-bars">
            {[85, 92, 78, 88, 95, 82].map((height, index) => (
              <div 
                key={index}
                className="nexus-bar hover:scale-110 transition-all duration-300" 
                style={{ height: '0%' }}
              ></div>
            ))}
          </div>
          <div className="nexus-chart-labels">
            {['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'].map((quarter, index) => (
              <span key={index}>{quarter}</span>
            ))}
          </div>
        </div>
        
        <div className="nexus-analytics-stats">
          <div className="nexus-stat-box transform hover:scale-110 hover:rotateY-12 transition-all duration-300">
            <div className="nexus-stat-number">$2.4M</div>
            <div>Monthly Volume</div>
          </div>
          <div className="nexus-stat-box transform hover:scale-110 hover:rotateY-12 transition-all duration-300">
            <div className="nexus-stat-number">15.2K</div>
            <div>Active Projects</div>
          </div>
          <div className="nexus-stat-box transform hover:scale-110 hover:rotateY-12 transition-all duration-300">
            <div className="nexus-stat-number">98.5%</div>
            <div>Success Rate</div>
          </div>
          <div className="nexus-stat-box transform hover:scale-110 hover:rotateY-12 transition-all duration-300">
            <div className="nexus-stat-number">2.8s</div>
            <div>Avg Match Time</div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section with 3D Visuals */}
      <section className="nexus-card text-center bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/30 relative overflow-hidden transform-gpu perspective-1000">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-blue-500/10 animate-pulse"></div>
        
        {/* 3D Floating Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-8 w-12 h-12 bg-cyan-400/20 rounded-full animate-float"></div>
          <div className="absolute top-16 right-12 w-8 h-8 bg-purple-400/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-12 left-16 w-6 h-6 bg-green-400/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-8 right-8 w-10 h-10 bg-yellow-400/20 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
        </div>
        
        <div className="relative z-10 transform hover:rotateX-6 transition-all duration-500">
          <h2 className="text-3xl font-bold text-cyan-400 mb-4">Ready to Shape the Future?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of innovators already building tomorrow's technology on NexusWorks.
          </p>
          
          {/* Enhanced Success Metrics with 3D Effect */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 rounded-lg p-3 transform hover:scale-110 hover:rotateY-12 transition-all duration-300">
              <div className="text-2xl font-bold text-cyan-400">50K+</div>
              <div className="text-sm text-gray-400">Developers</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 transform hover:scale-110 hover:rotateY-12 transition-all duration-300">
              <div className="text-2xl font-bold text-green-400">125K+</div>
              <div className="text-sm text-gray-400">Projects</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 transform hover:scale-110 hover:rotateY-12 transition-all duration-300">
              <div className="text-2xl font-bold text-yellow-400">$50M+</div>
              <div className="text-sm text-gray-400">Secured</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 transform hover:scale-110 hover:rotateY-12 transition-all duration-300">
              <div className="text-2xl font-bold text-purple-400">120+</div>
              <div className="text-sm text-gray-400">Countries</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary group transform hover:scale-110 transition-all duration-300">
              <Rocket size={20} className="group-hover:animate-bounce" />
              Start Your Journey
            </button>
            <button className="btn-secondary group transform hover:scale-110 transition-all duration-300">
              <Sparkles size={20} className="group-hover:animate-spin" />
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Enhanced Quantum Status with 3D Monitoring */}
      <div className="nexus-card bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 transform-gpu perspective-1000">
        <div className="transform hover:rotateX-6 hover:rotateY-6 transition-all duration-500" style={{ transformStyle: 'preserve-3d' }}>
          <div className="flex items-center gap-3 mb-4">
            <Zap size={24} className="text-purple-400 animate-pulse" />
            <div>
              <h3 className="font-semibold text-purple-400">Quantum Platform Status</h3>
              <p className="text-sm opacity-80">All systems operational with quantum-enhanced security</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white/5 rounded-lg p-3 text-center transform hover:translateZ-20 hover:scale-110 transition-all duration-300">
              <div className="text-green-400 font-bold text-lg">99.9%</div>
              <div className="text-gray-400 mb-2">Uptime</div>
              <div className="w-full bg-white/10 rounded-full h-1">
                <div className="nexus-progress bg-green-400 h-1 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center transform hover:translateZ-20 hover:scale-110 transition-all duration-300">
              <div className="text-cyan-400 font-bold text-lg">256-bit</div>
              <div className="text-gray-400 mb-2">Quantum Encryption</div>
              <div className="w-full bg-white/10 rounded-full h-1">
                <div className="nexus-progress bg-cyan-400 h-1 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center transform hover:translateZ-20 hover:scale-110 transition-all duration-300">
              <div className="text-yellow-400 font-bold text-lg">24/7</div>
              <div className="text-gray-400 mb-2">AI Monitoring</div>
              <div className="w-full bg-white/10 rounded-full h-1">
                <div className="nexus-progress bg-yellow-400 h-1 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center transform hover:translateZ-20 hover:scale-110 transition-all duration-300">
              <div className="text-purple-400 font-bold text-lg">Global</div>
              <div className="text-gray-400 mb-2">Neural Network</div>
              <div className="w-full bg-white/10 rounded-full h-1">
                <div className="nexus-progress bg-purple-400 h-1 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}