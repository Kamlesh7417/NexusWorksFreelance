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
  Flame,
  Play,
  ChevronRight
} from 'lucide-react';

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
      title: "Quantum AI Matching",
      description: "Advanced neural networks analyze 10,000+ data points to match clients with perfect developers in under 3 seconds.",
      color: "text-cyan-500",
      stats: { accuracy: "99.2%", speed: "2.8s", matches: "45K+" }
    },
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Military-grade quantum-resistant encryption protects $50M+ in transactions with zero security breaches.",
      color: "text-green-500",
      stats: { secured: "$50M+", breaches: "0", encryption: "256-bit" }
    },
    {
      icon: Users,
      title: "Neural Collaboration",
      description: "Holographic workspaces with BCI integration enable seamless real-time collaboration across continents.",
      color: "text-purple-500",
      stats: { workspaces: "12K+", latency: "15ms", satisfaction: "97%" }
    },
    {
      icon: Globe,
      title: "Global Talent Pool",
      description: "Access 50,000+ verified developers across 120 countries with expertise in 500+ technologies.",
      color: "text-blue-500",
      stats: { developers: "50K+", countries: "120", technologies: "500+" }
    },
    {
      icon: TrendingUp,
      title: "Dynamic Pricing",
      description: "AI analyzes market conditions, complexity, and demand to optimize pricing with 94% accuracy.",
      color: "text-yellow-500",
      stats: { accuracy: "94%", savings: "23%", optimization: "Real-time" }
    },
    {
      icon: Rocket,
      title: "Future-Ready Platform",
      description: "Built for quantum computing, AR/VR, and next-gen AI with 99.9% uptime and infinite scalability.",
      color: "text-red-500",
      stats: { uptime: "99.9%", scalability: "∞", technologies: "Next-gen" }
    }
  ];

  const platformStats = [
    { label: "Active Developers", value: stats.developers, suffix: "+", icon: Code, color: "text-cyan-500" },
    { label: "Projects Completed", value: stats.projects, suffix: "+", icon: CheckCircle, color: "text-green-500" },
    { label: "Client Satisfaction", value: stats.satisfaction, suffix: "%", icon: Star, color: "text-yellow-500" },
    { label: "Countries Served", value: stats.countries, suffix: "+", icon: Globe, color: "text-purple-500" }
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-500/5 to-purple-500/5"></div>
        <div className="container relative">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="hero-title mb-8 animate-fade-in">
              The Future of Freelancing
            </h1>
            <p className="hero-subtitle mb-12 animate-slide-up">
              Where quantum AI meets human creativity. Connect with elite developers, 
              leverage blockchain security, and build tomorrow's technology today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-scale-in">
              <button className="btn-primary group">
                <Users size={24} />
                Find Elite Developers
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="btn-outline group">
                <Code size={20} />
                Join as Developer
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Platform Preview */}
            <div className="relative max-w-4xl mx-auto">
              <div className="card glass p-8 transform hover:scale-105 transition-all duration-500">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <Zap size={16} />
                    Platform Preview
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Quantum-Powered Workspace</h3>
                  <p className="text-muted-foreground mb-6">
                    Experience the next generation of collaborative development
                  </p>
                  
                  {/* Mock Interface */}
                  <div className="bg-background border border-border rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full"></div>
                        <div className="text-left">
                          <div className="font-medium">AI Project Analyzer</div>
                          <div className="text-sm text-muted-foreground">Analyzing requirements...</div>
                        </div>
                      </div>
                      <div className="tag tag-success">Active</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">99.2%</div>
                        <div className="text-muted-foreground">Match Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">2.8s</div>
                        <div className="text-muted-foreground">Avg Response</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-500">45K+</div>
                        <div className="text-muted-foreground">Matches Made</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {platformStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="card card-hover p-6">
                    <Icon size={32} className={`${stat.color} mx-auto mb-4 group-hover:scale-110 transition-transform`} />
                    <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                      {typeof stat.value === 'number' ? 
                        (stat.value >= 1000 ? `${Math.floor(stat.value / 1000)}K` : stat.value) : 
                        stat.value
                      }{stat.suffix}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="section-title">Quantum-Powered Features</h2>
            <p className="section-subtitle">
              Experience the next generation of freelancing with cutting-edge technology 
              that transforms how clients and developers collaborate.
            </p>
          </div>
          
          <div className="grid-auto-fit">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = activeFeature === index;
              return (
                <div 
                  key={index} 
                  className={`card card-hover p-8 group cursor-pointer transition-all duration-500 ${
                    isActive ? 'ring-2 ring-primary/50 shadow-2xl' : ''
                  }`}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-xl bg-background border border-border ${feature.color} group-hover:scale-110 transition-transform`}>
                      <Icon size={24} />
                    </div>
                    <h3 className={`text-xl font-semibold ${feature.color}`}>{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-6">{feature.description}</p>
                  
                  {/* Feature Stats */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {Object.entries(feature.stats).map(([key, value], statIndex) => (
                      <div key={statIndex} className="text-center">
                        <div className={`font-bold ${feature.color}`}>{value}</div>
                        <div className="text-muted-foreground capitalize">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technologies Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="section-title">Future Technologies</h2>
            <p className="section-subtitle">
              Our platform specializes in emerging technologies that will define the next decade of innovation.
            </p>
          </div>
          
          <div className="grid-auto-fit">
            {technologies.map((tech, index) => (
              <div key={index} className="card card-hover p-6 group">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl group-hover:scale-125 transition-transform">{tech.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{tech.name}</h3>
                    <p className="text-sm text-muted-foreground">{tech.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="text-center">
                    <div className="text-green-500 font-bold">{tech.projects}</div>
                    <div className="text-muted-foreground">Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-500 font-bold">{tech.growth}</div>
                    <div className="text-muted-foreground">Growth</div>
                  </div>
                </div>
                
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-gradient-to-r from-primary to-blue-500 h-2 rounded-full transition-all duration-1000 w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="section-title">How NexusWorks Works</h2>
            <p className="section-subtitle">
              Three simple steps to connect with the world's best developers or find your next project.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* For Clients */}
            <div className="card p-8">
              <h3 className="text-2xl font-bold text-green-500 mb-6 text-center">For Clients</h3>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 font-bold text-lg">1</div>
                  <div>
                    <h4 className="font-semibold text-green-500 mb-2">Post Your Project</h4>
                    <p className="text-muted-foreground mb-2">Describe your project requirements, budget, and timeline. Our AI analyzes and optimizes your posting.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="tag tag-success">AI-powered optimization</span>
                      <span className="tag tag-success">Smart budget suggestions</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 font-bold text-lg">2</div>
                  <div>
                    <h4 className="font-semibold text-green-500 mb-2">Get Matched</h4>
                    <p className="text-muted-foreground mb-2">Quantum AI finds the perfect developers based on skills, experience, and project compatibility.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="tag tag-success">99.2% match accuracy</span>
                      <span className="tag tag-success">2.8s average matching</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 font-bold text-lg">3</div>
                  <div>
                    <h4 className="font-semibold text-green-500 mb-2">Collaborate & Pay</h4>
                    <p className="text-muted-foreground mb-2">Work together in virtual spaces with secure milestone-based payments via blockchain.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="tag tag-success">Quantum-secure payments</span>
                      <span className="tag tag-success">Real-time collaboration</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* For Developers */}
            <div className="card p-8">
              <h3 className="text-2xl font-bold text-purple-500 mb-6 text-center">For Developers</h3>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-500 font-bold text-lg">1</div>
                  <div>
                    <h4 className="font-semibold text-purple-500 mb-2">Build Your Profile</h4>
                    <p className="text-muted-foreground mb-2">Showcase your skills, portfolio, and expertise in emerging technologies with holographic presentations.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="tag tag-primary">3D portfolio display</span>
                      <span className="tag tag-primary">Skill verification</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-500 font-bold text-lg">2</div>
                  <div>
                    <h4 className="font-semibold text-purple-500 mb-2">Get Discovered</h4>
                    <p className="text-muted-foreground mb-2">AI matches you with projects that fit your skills and career goals. No more endless bidding.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="tag tag-primary">Smart project matching</span>
                      <span className="tag tag-primary">Zero bidding required</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-500 font-bold text-lg">3</div>
                  <div>
                    <h4 className="font-semibold text-purple-500 mb-2">Learn & Earn</h4>
                    <p className="text-muted-foreground mb-2">Access cutting-edge learning resources, shadow experts, and earn WORK tokens for continuous growth.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="tag tag-primary">Expert shadowing</span>
                      <span className="tag tag-primary">WORK token rewards</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <div className="card glass p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-foreground mb-6">Ready to Shape the Future?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of innovators already building tomorrow's technology on NexusWorks.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">50K+</div>
                  <div className="text-sm text-muted-foreground">Developers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">125K+</div>
                  <div className="text-sm text-muted-foreground">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-500">$50M+</div>
                  <div className="text-sm text-muted-foreground">Secured</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-500">120+</div>
                  <div className="text-sm text-muted-foreground">Countries</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button className="btn-primary group">
                  <Rocket size={20} />
                  Start Your Journey
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="btn-outline group">
                  <Play size={16} />
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}