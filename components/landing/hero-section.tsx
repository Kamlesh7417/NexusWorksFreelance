'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Users, 
  Code, 
  Brain, 
  Shield, 
  Globe, 
  Rocket,
  ArrowRight,
  Zap,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    setIsLoaded(true);
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
    
    // Cycle through features
    const featureTimer = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 6);
    }, 4000);

    return () => clearInterval(featureTimer);
  }, [supabase]);

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
      icon: Rocket,
      title: "Future-Ready Platform",
      description: "Built for quantum computing, AR/VR, and next-gen AI with 99.9% uptime and infinite scalability.",
      color: "text-red-400",
      stats: { uptime: "99.9%", scalability: "∞", technologies: "Next-gen" }
    },
    {
      icon: Zap,
      title: "Dynamic Pricing",
      description: "AI analyzes market conditions, complexity, and demand to optimize pricing with 94% accuracy.",
      color: "text-yellow-400",
      stats: { accuracy: "94%", savings: "23%", optimization: "Real-time" }
    }
  ];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-2/3 left-1/2 w-48 h-48 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <div className="mb-6 inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-cyan-400">
          <Sparkles size={16} className="mr-2" />
          The Future of Freelancing Has Arrived
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-fadeIn">
          Where Quantum AI Meets Human Creativity
        </h1>
        
        <p className="text-xl md:text-2xl mb-12 text-gray-300 leading-relaxed max-w-4xl mx-auto">
          Connect with elite developers, leverage blockchain security, and build tomorrow's technology today on the world's most advanced freelancing platform.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <Link 
            href={user ? "/dashboard" : "/auth/signin"}
            className="btn-primary flex items-center gap-2 group"
          >
            <Users size={20} className="group-hover:animate-pulse" />
            {user ? "Go to Dashboard" : "Get Started"}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link 
            href="/projects"
            className="btn-secondary flex items-center gap-2 group"
          >
            <Code size={20} className="group-hover:animate-pulse" />
            Explore Projects
          </Link>
        </div>
        
        {/* Featured Platform Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.slice(0, 3).map((feature, index) => {
            const Icon = feature.icon;
            const isActive = activeFeature === index;
            return (
              <div 
                key={index} 
                className={`nexus-card group transition-all duration-700 transform-gpu ${
                  isActive ? 'scale-105 shadow-xl shadow-cyan-500/20' : 'hover:scale-105'
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-lg bg-white/5 border border-white/10 ${feature.color} transition-all duration-500 ${
                    isActive ? 'animate-pulse scale-110' : 'group-hover:scale-110'
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
            );
          })}
        </div>
        
        {/* Platform Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="nexus-card text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-2">50K+</div>
            <div className="text-sm text-gray-400">Elite Developers</div>
          </div>
          <div className="nexus-card text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">125K+</div>
            <div className="text-sm text-gray-400">Projects Completed</div>
          </div>
          <div className="nexus-card text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">98.5%</div>
            <div className="text-sm text-gray-400">Client Satisfaction</div>
          </div>
          <div className="nexus-card text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">120+</div>
            <div className="text-sm text-gray-400">Countries Served</div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="nexus-card bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/30">
          <h2 className="text-3xl font-bold text-cyan-400 mb-4">Ready to Shape the Future?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of innovators already building tomorrow's technology on NexusWorks.
          </p>
          
          <Link 
            href={user ? "/dashboard" : "/auth/signin"}
            className="btn-primary group"
          >
            <Rocket size={20} className="group-hover:animate-bounce" />
            {user ? "Go to Dashboard" : "Start Your Journey"}
          </Link>
        </div>
      </div>
    </section>
  );
}