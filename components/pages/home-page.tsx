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
  Target
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';

export function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [stats, setStats] = useState({
    developers: 0,
    projects: 0,
    satisfaction: 0,
    countries: 0
  });

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

    setTimeout(animateStats, 500);

    // Cycle through features
    const featureTimer = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 6);
    }, 4000);

    return () => {
      clearInterval(featureTimer);
    };
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI Matching",
      description: "Advanced algorithms analyze thousands of data points to match clients with perfect developers in under 3 seconds.",
      color: "text-cyan-400",
      stats: { accuracy: "99.2%", speed: "2.8s", matches: "45K+" }
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Military-grade encryption protects $50M+ in transactions with zero security breaches.",
      color: "text-green-400",
      stats: { secured: "$50M+", breaches: "0", encryption: "256-bit" }
    },
    {
      icon: Users,
      title: "Seamless Collaboration",
      description: "Real-time workspaces enable seamless collaboration across continents.",
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
      description: "Built for modern technologies with 99.9% uptime and infinite scalability.",
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
      name: "Advanced Computing", 
      icon: "🌌", 
      description: "Next-gen algorithms",
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
      description: "Advanced security",
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

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-t-transparent border-cyan-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-blue-500/10 animate-pulse"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-fadeIn">
            The Future of Freelancing
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300 leading-relaxed">
            Connect with elite developers, leverage secure payments, and build tomorrow's technology today.
          </p>
          
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

      {/* Features Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-cyan-400 mb-4">Platform Features</h2>
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
                className={`bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 transition-all duration-500 ${
                  isActive ? 'scale-105 shadow-xl shadow-cyan-500/20' : 'hover:scale-105'
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-lg bg-white/5 border border-white/10 ${feature.color} transition-all duration-500 ${
                      isActive ? 'scale-110' : ''
                    }`}>
                      <Icon size={24} />
                    </div>
                    <h3 className={`text-xl font-semibold ${feature.color}`}>{feature.title}</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed mb-4">{feature.description}</p>
                  
                  {/* Feature Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {Object.entries(feature.stats).map(([key, value], statIndex) => (
                      <div key={statIndex} className="bg-white/5 rounded p-2 text-center">
                        <div className={`font-bold ${feature.color}`}>{value}</div>
                        <div className="text-gray-400 capitalize">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Technologies Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-cyan-400 mb-4">Future Technologies</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our platform specializes in emerging technologies that will define the next decade of innovation.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technologies.map((tech, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl transition-all duration-300">{tech.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-cyan-400">{tech.name}</h3>
                    <p className="text-sm text-gray-400">{tech.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="bg-white/5 rounded p-2">
                    <div className="text-green-400 font-bold">{tech.projects}</div>
                    <div className="text-gray-400">Projects</div>
                  </div>
                  <div className="bg-white/5 rounded p-2">
                    <div className="text-yellow-400 font-bold">{tech.growth}</div>
                    <div className="text-gray-400">Growth</div>
                  </div>
                </div>
                
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: '85%' }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-cyan-400 mb-4">How NexusWorks Works</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Three simple steps to connect with the world's best developers or find your next project.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* For Clients */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h3 className="text-2xl font-bold text-green-400 mb-6 text-center">For Clients</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">1</div>
                <div>
                  <h4 className="font-semibold text-green-400 mb-2">Post Your Project</h4>
                  <p className="text-gray-300 mb-2">Describe your project requirements, budget, and timeline. Our AI analyzes and optimizes your posting.</p>
                  <div className="text-xs text-green-400">✓ AI-powered optimization • ✓ Smart budget suggestions • ✓ Timeline estimation</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">2</div>
                <div>
                  <h4 className="font-semibold text-green-400 mb-2">Get Matched</h4>
                  <p className="text-gray-300 mb-2">AI finds the perfect developers based on skills, experience, and project compatibility.</p>
                  <div className="text-xs text-green-400">✓ 99.2% match accuracy • ✓ 2.8s average matching • ✓ Global talent pool</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">3</div>
                <div>
                  <h4 className="font-semibold text-green-400 mb-2">Collaborate & Pay</h4>
                  <p className="text-gray-300 mb-2">Work together with secure milestone-based payments via blockchain.</p>
                  <div className="text-xs text-green-400">✓ Secure payments • ✓ Real-time collaboration • ✓ Milestone tracking</div>
                </div>
              </div>
            </div>
          </div>

          {/* For Developers */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h3 className="text-2xl font-bold text-purple-400 mb-6 text-center">For Developers</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold">1</div>
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">Build Your Profile</h4>
                  <p className="text-gray-300 mb-2">Showcase your skills, portfolio, and expertise in emerging technologies.</p>
                  <div className="text-xs text-purple-400">✓ Portfolio display • ✓ Skill verification • ✓ Project showcases</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold">2</div>
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">Get Discovered</h4>
                  <p className="text-gray-300 mb-2">AI matches you with projects that fit your skills and career goals. No more endless bidding.</p>
                  <div className="text-xs text-purple-400">✓ Smart project matching • ✓ Career path optimization • ✓ Zero bidding required</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold">3</div>
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">Learn & Earn</h4>
                  <p className="text-gray-300 mb-2">Access cutting-edge learning resources, shadow experts, and earn tokens for continuous growth.</p>
                  <div className="text-xs text-purple-400">✓ Expert shadowing • ✓ Token rewards • ✓ Continuous learning</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Dashboard Preview */}
      <section className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
        <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">Platform Analytics</h2>
        <p className="text-center text-gray-300 mb-8">Real-time insights into the NexusWorks ecosystem</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white/5 border border-white/20 rounded-lg p-4 text-center hover:bg-white/10 transition-all duration-300">
            <div className="text-3xl font-bold text-cyan-400 mb-2">$2.4M</div>
            <div className="text-sm text-gray-400">Monthly Volume</div>
          </div>
          <div className="bg-white/5 border border-white/20 rounded-lg p-4 text-center hover:bg-white/10 transition-all duration-300">
            <div className="text-3xl font-bold text-green-400 mb-2">15.2K</div>
            <div className="text-sm text-gray-400">Active Projects</div>
          </div>
          <div className="bg-white/5 border border-white/20 rounded-lg p-4 text-center hover:bg-white/10 transition-all duration-300">
            <div className="text-3xl font-bold text-yellow-400 mb-2">98.5%</div>
            <div className="text-sm text-gray-400">Success Rate</div>
          </div>
          <div className="bg-white/5 border border-white/20 rounded-lg p-4 text-center hover:bg-white/10 transition-all duration-300">
            <div className="text-3xl font-bold text-purple-400 mb-2">2.8s</div>
            <div className="text-sm text-gray-400">Avg Match Time</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-blue-500/10 animate-pulse"></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-cyan-400 mb-4">Ready to Shape the Future?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of innovators already building tomorrow's technology on NexusWorks.
          </p>
          
          {/* Success Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all duration-300">
              <div className="text-2xl font-bold text-cyan-400">50K+</div>
              <div className="text-sm text-gray-400">Developers</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all duration-300">
              <div className="text-2xl font-bold text-green-400">125K+</div>
              <div className="text-sm text-gray-400">Projects</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all duration-300">
              <div className="text-2xl font-bold text-yellow-400">$50M+</div>
              <div className="text-sm text-gray-400">Secured</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all duration-300">
              <div className="text-2xl font-bold text-purple-400">120+</div>
              <div className="text-sm text-gray-400">Countries</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary group">
              <Rocket size={20} className="group-hover:animate-bounce" />
              Start Your Journey
            </button>
            <button className="btn-secondary group">
              <Zap size={20} />
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Platform Status */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <Activity size={24} className="text-purple-400" />
          <div>
            <h3 className="font-semibold text-purple-400">Platform Status</h3>
            <p className="text-sm opacity-80">All systems operational with enhanced security</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white/5 rounded-lg p-3 text-center hover:bg-white/10 transition-all duration-300">
            <div className="text-green-400 font-bold text-lg">99.9%</div>
            <div className="text-gray-400 mb-2">Uptime</div>
            <div className="w-full bg-white/10 rounded-full h-1">
              <div className="bg-green-400 h-1 rounded-full w-full"></div>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center hover:bg-white/10 transition-all duration-300">
            <div className="text-cyan-400 font-bold text-lg">256-bit</div>
            <div className="text-gray-400 mb-2">Encryption</div>
            <div className="w-full bg-white/10 rounded-full h-1">
              <div className="bg-cyan-400 h-1 rounded-full w-full"></div>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center hover:bg-white/10 transition-all duration-300">
            <div className="text-yellow-400 font-bold text-lg">24/7</div>
            <div className="text-gray-400 mb-2">AI Monitoring</div>
            <div className="w-full bg-white/10 rounded-full h-1">
              <div className="bg-yellow-400 h-1 rounded-full w-full"></div>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center hover:bg-white/10 transition-all duration-300">
            <div className="text-purple-400 font-bold text-lg">Global</div>
            <div className="text-gray-400 mb-2">Network</div>
            <div className="w-full bg-white/10 rounded-full h-1">
              <div className="bg-purple-400 h-1 rounded-full w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}