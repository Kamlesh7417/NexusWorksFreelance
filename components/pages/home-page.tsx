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
  ChevronRight,
  DollarSign,
  Briefcase,
  GraduationCap,
  Mail
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
      const targets = { developers: 50000, projects: 125000, satisfaction: 97, countries: 120 };
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
          satisfaction: Math.floor(targets.satisfaction * progress),
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
      setActiveFeature(prev => (prev + 1) % 4);
    }, 4000);

    return () => {
      clearInterval(featureTimer);
    };
  }, []);

  const platformCapabilities = [
    {
      icon: DollarSign,
      title: "Revolutionary Economics",
      description: "3% platform fees vs industry standard 20%. Instant blockchain payments with no waiting periods. Students earn WORK cryptocurrency while building real skills.",
      color: "text-green-400",
      stats: { fees: "3%", payments: "Instant", earnings: "$2.4M+" }
    },
    {
      icon: Brain,
      title: "AI Enhancement Suite", 
      description: "AI writes your proposals in 30 seconds. Voice-controlled development tools. Automated project scoping and pricing with 99.2% accuracy.",
      color: "text-cyan-400",
      stats: { speed: "30s", accuracy: "99.2%", tools: "Voice-AI" }
    },
    {
      icon: GraduationCap,
      title: "Global Learning Ecosystem",
      description: "University partnerships for real project experience. Mentorship through project shadowing. Build portfolio while earning income.",
      color: "text-purple-400",
      stats: { universities: "50+", mentors: "2.4K+", students: "15K+" }
    },
    {
      icon: Shield,
      title: "Transparent Collaboration",
      description: "Blockchain-secured escrow and payments. Real-time project tracking and communication. Community-driven innovation projects.",
      color: "text-blue-400",
      stats: { secured: "$50M+", uptime: "99.9%", projects: "12K+" }
    }
  ];

  const valuePropositions = [
    {
      title: "For Freelancers",
      subtitle: "Keep 97% of earnings + AI superpowers",
      description: "Save 15+ hours weekly with AI assistance",
      icon: Code,
      color: "text-purple-400",
      benefits: ["97% earnings retention", "AI proposal writing", "Voice-controlled tools", "Global project access"]
    },
    {
      title: "For Students", 
      subtitle: "Earn cryptocurrency while learning",
      description: "Real-world projects with mentorship",
      icon: GraduationCap,
      color: "text-cyan-400", 
      benefits: ["WORK token rewards", "University partnerships", "Expert mentorship", "Portfolio building"]
    },
    {
      title: "For Clients",
      subtitle: "Access global talent with AI enhancement",
      description: "Transparent blockchain payments",
      icon: Briefcase,
      color: "text-green-400",
      benefits: ["99.2% match accuracy", "Quantum-secure payments", "Real-time collaboration", "Quality assurance"]
    }
  ];

  const socialProof = [
    { metric: "50+", label: "Universities", description: "Trusted by leading institutions" },
    { metric: "$2.4M+", label: "Student Earnings", description: "In WORK tokens distributed" },
    { metric: "97%", label: "Client Satisfaction", description: "Verified project success rate" },
    { metric: "15hrs", label: "Time Saved", description: "Weekly with AI assistance" }
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
      {/* Hero Section - Redesigned */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-500/5 to-purple-500/5"></div>
        <div className="container relative">
          <div className="text-center max-w-6xl mx-auto">
            {/* New Professional Logo */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-white font-bold text-2xl">N</span>
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold text-foreground">NexusWorks</h1>
                <p className="text-lg text-cyan-400 font-medium">Where Learning Meets Earning</p>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent leading-tight">
              The World's First Work-to-Earn Freelancing Platform
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Students earn cryptocurrency by contributing to real projects. Freelancers keep 97% of earnings with AI assistance. 
              Clients get better results through collaborative innovation.
            </p>
            
            {/* Large Primary CTAs - 40% Larger */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <button className="btn-primary group shadow-2xl">
                <Users size={28} />
                Find Developers
                <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </button>
              <button className="btn-primary group shadow-2xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                <Rocket size={28} />
                Start Earning Today
                <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>

            {/* Social Proof Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              {socialProof.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{item.metric}</div>
                  <div className="text-lg font-semibold text-foreground mb-1">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Revolutionary Value for Everyone
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform creates value for all participants in the innovation ecosystem
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {valuePropositions.map((prop, index) => {
              const Icon = prop.icon;
              return (
                <div key={index} className="card p-8 group hover:scale-105 transition-all duration-500">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-4 rounded-2xl bg-background border border-border ${prop.color}`}>
                      <Icon size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{prop.title}</h3>
                      <p className={`text-lg font-semibold ${prop.color}`}>{prop.subtitle}</p>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground text-lg mb-6 leading-relaxed">{prop.description}</p>
                  
                  <div className="space-y-3">
                    {prop.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-green-500" />
                        <span className="text-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI-Powered Productivity Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              AI-Powered Productivity
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our AI assistant handles proposals, project scoping, and client communication 
              so you focus on what you do best - creating exceptional work.
            </p>
          </div>
          
          <div className="grid-auto-fit">
            {platformCapabilities.map((capability, index) => {
              const Icon = capability.icon;
              const isActive = activeFeature === index;
              return (
                <div 
                  key={index} 
                  className={`card p-8 group cursor-pointer transition-all duration-500 ${
                    isActive ? 'ring-2 ring-primary/50 shadow-2xl scale-105' : ''
                  }`}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-4 rounded-2xl bg-background border border-border ${capability.color} group-hover:scale-110 transition-transform`}>
                      <Icon size={28} />
                    </div>
                    <h3 className={`text-2xl font-bold ${capability.color}`}>{capability.title}</h3>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed mb-6 text-lg">{capability.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {Object.entries(capability.stats).map(([key, value], statIndex) => (
                      <div key={statIndex} className="text-center bg-background/50 rounded-lg p-3">
                        <div className={`font-bold text-lg ${capability.color}`}>{value}</div>
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

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              How NexusWorks Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Three simple steps to connect with the world's best developers or find your next project.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* For Clients */}
            <div className="card p-8">
              <h3 className="text-3xl font-bold text-green-500 mb-8 text-center">For Clients</h3>
              
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 font-bold text-xl">1</div>
                  <div>
                    <h4 className="text-xl font-semibold text-green-500 mb-3">Post Your Project</h4>
                    <p className="text-muted-foreground mb-3 leading-relaxed">Describe your project requirements, budget, and timeline. Our AI analyzes and optimizes your posting for maximum visibility.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="tag tag-success">AI optimization</span>
                      <span className="tag tag-success">Smart budgeting</span>
                      <span className="tag tag-success">Timeline estimation</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 font-bold text-xl">2</div>
                  <div>
                    <h4 className="text-xl font-semibold text-green-500 mb-3">Get Matched</h4>
                    <p className="text-muted-foreground mb-3 leading-relaxed">Quantum AI finds the perfect developers based on skills, experience, and project compatibility in under 3 seconds.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="tag tag-success">99.2% accuracy</span>
                      <span className="tag tag-success">2.8s matching</span>
                      <span className="tag tag-success">Global talent</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 font-bold text-xl">3</div>
                  <div>
                    <h4 className="text-xl font-semibold text-green-500 mb-3">Collaborate & Pay</h4>
                    <p className="text-muted-foreground mb-3 leading-relaxed">Work together with secure milestone-based payments via blockchain technology and real-time collaboration tools.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="tag tag-success">Quantum-secure</span>
                      <span className="tag tag-success">Real-time tools</span>
                      <span className="tag tag-success">Milestone payments</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* For Developers */}
            <div className="card p-8">
              <h3 className="text-3xl font-bold text-purple-500 mb-8 text-center">For Developers</h3>
              
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-500 font-bold text-xl">1</div>
                  <div>
                    <h4 className="text-xl font-semibold text-purple-500 mb-3">Build Your Profile</h4>
                    <p className="text-muted-foreground mb-3 leading-relaxed">Showcase your skills, portfolio, and expertise. Our AI verifies your capabilities and creates compelling presentations.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="tag tag-primary">Skill verification</span>
                      <span className="tag tag-primary">AI enhancement</span>
                      <span className="tag tag-primary">Portfolio showcase</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-500 font-bold text-xl">2</div>
                  <div>
                    <h4 className="text-xl font-semibold text-purple-500 mb-3">Get Discovered</h4>
                    <p className="text-muted-foreground mb-3 leading-relaxed">AI matches you with projects that fit your skills and career goals. No more endless bidding or proposal writing.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="tag tag-primary">Smart matching</span>
                      <span className="tag tag-primary">Zero bidding</span>
                      <span className="tag tag-primary">Career optimization</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-500 font-bold text-xl">3</div>
                  <div>
                    <h4 className="text-xl font-semibold text-purple-500 mb-3">Learn & Earn</h4>
                    <p className="text-muted-foreground mb-3 leading-relaxed">Access cutting-edge learning resources, shadow experts, and earn WORK tokens for continuous growth and skill development.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="tag tag-primary">Expert shadowing</span>
                      <span className="tag tag-primary">WORK tokens</span>
                      <span className="tag tag-primary">Continuous learning</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Statistics */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Active Developers", value: stats.developers, suffix: "+", icon: Code, color: "text-cyan-500" },
              { label: "Projects Completed", value: stats.projects, suffix: "+", icon: CheckCircle, color: "text-green-500" },
              { label: "Client Satisfaction", value: stats.satisfaction, suffix: "%", icon: Star, color: "text-yellow-500" },
              { label: "Countries Served", value: stats.countries, suffix: "+", icon: Globe, color: "text-purple-500" }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="card p-8 hover:scale-105 transition-all duration-300">
                    <Icon size={40} className={`${stat.color} mx-auto mb-4 group-hover:scale-110 transition-transform`} />
                    <div className={`text-4xl font-bold ${stat.color} mb-2`}>
                      {typeof stat.value === 'number' ? 
                        (stat.value >= 1000 ? `${Math.floor(stat.value / 1000)}K` : stat.value) : 
                        stat.value
                      }{stat.suffix}
                    </div>
                    <div className="text-lg font-medium text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Secondary CTAs */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join the future of work where innovation meets opportunity
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="btn-secondary text-lg px-8 py-4 group">
              <Briefcase size={24} />
              Post a Project
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="btn-secondary text-lg px-8 py-4 group">
              <Users size={24} />
              Join as Developer
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24">
        <div className="container">
          <div className="card glass p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10"></div>
            
            <div className="relative z-10">
              <h2 className="text-5xl font-bold text-foreground mb-6">Shape the Future of Work</h2>
              <p className="text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
                Join thousands of innovators already building tomorrow's technology on the world's first work-to-earn platform.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">50K+</div>
                  <div className="text-lg text-muted-foreground">Developers</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-500">125K+</div>
                  <div className="text-lg text-muted-foreground">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-500">$50M+</div>
                  <div className="text-lg text-muted-foreground">Secured</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-500">120+</div>
                  <div className="text-lg text-muted-foreground">Countries</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button className="btn-primary text-xl px-12 py-6 group">
                  <Rocket size={24} />
                  Start Your Journey
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="btn-outline text-xl px-12 py-6 group">
                  <Play size={20} />
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Email Signup Section */}
      <section className="py-16">
        <div className="container">
          <div className="card p-12 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">Get Early Access</h2>
              <p className="text-lg text-muted-foreground">
                Be among the first to experience the future of work-to-earn freelancing
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="w-full bg-background border border-border rounded-xl px-12 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button className="btn-primary whitespace-nowrap">
                Get Access
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground text-center mt-4">
              We respect your privacy. No spam, just updates about our platform.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}