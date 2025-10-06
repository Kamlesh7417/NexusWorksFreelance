'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  Users, 
  TrendingUp, 
  Star,
  ArrowRight,
  Code,
  Zap,
  Shield,
  Brain,
  Target,
  Rocket,
  CheckCircle,
  GitBranch,
  DollarSign,
  Clock,
  Award
} from 'lucide-react';
import { useDjangoAuth } from '@/components/auth/django-auth-provider';

export function HomePage() {
  const { user } = useDjangoAuth();
  const [activeJourney, setActiveJourney] = useState<'client' | 'developer'>('client');
  const [animatedStats, setAnimatedStats] = useState({
    developers: 0,
    projects: 0,
    success: 0,
    support: 0
  });

  // Animate stats on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedStats({
        developers: 10000,
        projects: 5000,
        success: 98,
        support: 24
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/auth/signin?redirectTo=/dashboard';
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section with Glassmorphism */}
      <section className="nexus-welcome-section relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 animate-pulse"></div>
        <div className="relative z-10">
          <h1 className="text-6xl font-bold mb-6 animate-fadeIn">
            The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Freelancing</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed animate-fadeIn">
            Connect with elite developers through AI-powered matching, manage projects with intelligent automation, 
            and scale your business with our comprehensive freelancing ecosystem.
          </p>
          <div className="flex gap-6 justify-center animate-fadeIn">
            <button 
              onClick={handleGetStarted}
              className="btn-primary transform-gpu"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <a href="/demo" className="btn-secondary">
              Demo Credentials
            </a>
          </div>
        </div>
      </section>

      {/* Journey Selection */}
      <section className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-8 text-white">Choose Your Journey</h2>
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveJourney('client')}
            className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
              activeJourney === 'client'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'bg-transparent border border-cyan-500 text-cyan-400 hover:bg-cyan-500/20'
            }`}
          >
            <Briefcase className="inline-block mr-2 h-5 w-5" />
            I'm a Client
          </button>
          <button
            onClick={() => setActiveJourney('developer')}
            className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
              activeJourney === 'developer'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                : 'bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-500/20'
            }`}
          >
            <Code className="inline-block mr-2 h-5 w-5" />
            I'm a Developer
          </button>
        </div>
      </section>

      {/* Client Journey */}
      {activeJourney === 'client' && (
        <section className="space-y-12 animate-fadeIn">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-cyan-400">Client Journey</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From project conception to successful delivery, we guide you every step of the way
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="nexus-card text-center transform-gpu hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">1. AI Project Analysis</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Submit your project idea and let our AI analyze requirements, estimate timeline, and suggest optimal team structure.
              </p>
            </div>

            {/* Step 2 */}
            <div className="nexus-card text-center transform-gpu hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-blue-400">2. Smart Matching</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Get matched with pre-vetted developers based on skills, experience, and project compatibility using our advanced algorithms.
              </p>
            </div>

            {/* Step 3 */}
            <div className="nexus-card text-center transform-gpu hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-purple-400">3. Project Launch</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Collaborate with your team through our integrated project management console with real-time tracking and communication.
              </p>
            </div>

            {/* Step 4 */}
            <div className="nexus-card text-center transform-gpu hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-cyan-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-green-400">4. Secure Delivery</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Milestone-based payments, automated quality checks, and comprehensive project delivery with ongoing support.
              </p>
            </div>
          </div>

          {/* Client Benefits */}
          <div className="nexus-card">
            <h3 className="text-2xl font-bold mb-6 text-center text-cyan-400">Why Clients Choose NexusWorks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Risk-Free Development</h4>
                  <p className="text-gray-300 text-sm">Escrow payments, milestone-based releases, and comprehensive project insurance.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">AI-Powered Insights</h4>
                  <p className="text-gray-300 text-sm">Real-time project analytics, predictive timeline adjustments, and quality monitoring.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Elite Developer Network</h4>
                  <p className="text-gray-300 text-sm">Access to top 5% of developers, rigorously vetted and continuously evaluated.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Rapid Deployment</h4>
                  <p className="text-gray-300 text-sm">Start your project within 24 hours with our streamlined onboarding process.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Developer Journey */}
      {activeJourney === 'developer' && (
        <section className="space-y-12 animate-fadeIn">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-purple-400">Developer Journey</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Elevate your freelancing career with AI-powered opportunities and continuous growth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="nexus-card text-center transform-gpu hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center">
                <GitBranch className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-purple-400">1. GitHub Integration</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Connect your GitHub profile for automated skill analysis, portfolio building, and reputation scoring.
              </p>
            </div>

            {/* Step 2 */}
            <div className="nexus-card text-center transform-gpu hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-400 to-red-600 rounded-full flex items-center justify-center">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-pink-400">2. AI Skill Matching</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Get matched with projects that perfectly align with your skills, interests, and career goals using advanced ML algorithms.
              </p>
            </div>

            {/* Step 3 */}
            <div className="nexus-card text-center transform-gpu hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-blue-400">3. Premium Earnings</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Earn competitive rates with transparent pricing, milestone-based payments, and performance bonuses.
              </p>
            </div>

            {/* Step 4 */}
            <div className="nexus-card text-center transform-gpu hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-blue-600 rounded-full flex items-center justify-center">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-green-400">4. Career Growth</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Access mentorship programs, skill development courses, and exclusive networking opportunities.
              </p>
            </div>
          </div>

          {/* Developer Benefits */}
          <div className="nexus-card">
            <h3 className="text-2xl font-bold mb-6 text-center text-purple-400">Why Developers Thrive Here</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Continuous Learning</h4>
                  <p className="text-gray-300 text-sm">Access to cutting-edge courses, mentorship programs, and skill development resources.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-pink-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Flexible Schedule</h4>
                  <p className="text-gray-300 text-sm">Work on your terms with flexible hours and remote-first project opportunities.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Premium Projects</h4>
                  <p className="text-gray-300 text-sm">Work on high-impact projects with leading companies and innovative startups.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Community Support</h4>
                  <p className="text-gray-300 text-sm">Join a thriving community of developers with networking events and collaboration opportunities.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Animated Stats Section with Glassmorphism */}
      <section className="nexus-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/10 to-purple-500/5"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-center mb-8 text-white">Platform Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="transform-gpu hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-cyan-400 mb-2 font-mono">
                {animatedStats.developers.toLocaleString()}+
              </div>
              <div className="text-gray-300">Elite Developers</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-2000 ease-out"
                  style={{ width: animatedStats.developers > 0 ? '85%' : '0%' }}
                ></div>
              </div>
            </div>
            <div className="transform-gpu hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-blue-400 mb-2 font-mono">
                {animatedStats.projects.toLocaleString()}+
              </div>
              <div className="text-gray-300">Projects Delivered</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-2000 ease-out"
                  style={{ width: animatedStats.projects > 0 ? '92%' : '0%' }}
                ></div>
              </div>
            </div>
            <div className="transform-gpu hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-green-400 mb-2 font-mono">
                {animatedStats.success}%
              </div>
              <div className="text-gray-300">Success Rate</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-cyan-500 h-2 rounded-full transition-all duration-2000 ease-out"
                  style={{ width: animatedStats.success > 0 ? '98%' : '0%' }}
                ></div>
              </div>
            </div>
            <div className="transform-gpu hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-purple-400 mb-2 font-mono">
                {animatedStats.support}/7
              </div>
              <div className="text-gray-300">Support Available</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full transition-all duration-2000 ease-out"
                  style={{ width: animatedStats.support > 0 ? '100%' : '0%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features with Glassmorphism */}
      <section className="space-y-8">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="nexus-card text-center transform-gpu hover:scale-105">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center animate-float">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-cyan-400">AI-Powered Matching</h3>
            <p className="text-gray-300 leading-relaxed">
              Advanced machine learning algorithms analyze skills, project requirements, and compatibility to create perfect developer-project matches with 95% accuracy.
            </p>
          </div>

          <div className="nexus-card text-center transform-gpu hover:scale-105">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center animate-float" style={{ animationDelay: '2s' }}>
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-blue-400">Smart Project Management</h3>
            <p className="text-gray-300 leading-relaxed">
              Integrated project console with real-time tracking, automated milestone management, and intelligent task distribution for optimal productivity.
            </p>
          </div>

          <div className="nexus-card text-center transform-gpu hover:scale-105">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center animate-float" style={{ animationDelay: '4s' }}>
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-purple-400">Enterprise Security</h3>
            <p className="text-gray-300 leading-relaxed">
              Bank-grade security with encrypted communications, secure payment processing, and comprehensive project protection for peace of mind.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section with Enhanced Glassmorphism */}
      <section className="nexus-card text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-purple-500/20 animate-pulse"></div>
        <div className="relative z-10 py-8">
          <h2 className="text-4xl font-bold mb-6 text-white">Ready to Transform Your Projects?</h2>
          <p className="text-xl mb-8 text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Join thousands of successful businesses and developers already thriving on NexusWorks. 
            Start your journey today with our AI-powered freelancing platform.
          </p>
          <div className="flex gap-6 justify-center">
            <button 
              onClick={handleGetStarted}
              className="btn-primary transform-gpu"
            >
              Start Your Journey
              <Rocket className="ml-2 h-5 w-5" />
            </button>
            <button className="btn-secondary">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}