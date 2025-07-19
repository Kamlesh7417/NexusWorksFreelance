'use client';

import { useState, useEffect, useRef } from 'react';
import { CharacterScene } from './character-scene';
import { CharacterState } from './character-controller';
import { ArrowRight, Rocket } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

interface EnhancedHomeHeroProps {
  onGetStarted?: () => void;
}

export function EnhancedHomeHero({ onGetStarted }: EnhancedHomeHeroProps) {
  const { user, signIn } = useAuth();
  const [characterController, setCharacterController] = useState<any>(null);
  const [currentDemo, setCurrentDemo] = useState<'intro' | 'features' | 'matching'>('intro');
  const [isPlaying, setIsPlaying] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Auto-play demo sequence
  useEffect(() => {
    const sequence = async () => {
      if (!characterController) return;
      
      // Intro sequence
      await new Promise(resolve => setTimeout(resolve, 2000));
      characterController.transitionTo(CharacterState.GREETING);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      setCurrentDemo('features');
      characterController.transitionTo(CharacterState.EXPLAINING);
      
      await new Promise(resolve => setTimeout(resolve, 4000));
      setCurrentDemo('matching');
      characterController.transitionTo(CharacterState.POINTING);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      characterController.transitionTo(CharacterState.IDLE);
      setCurrentDemo('intro');
    };

    if (characterController && !isPlaying) {
      setIsPlaying(true);
      sequence().finally(() => setIsPlaying(false));
    }
  }, [characterController, isPlaying]);

  const handleGetStarted = () => {
    if (characterController) {
      characterController.transitionTo(CharacterState.CELEBRATING);
    }
    
    if (user) {
      window.location.href = '/dashboard';
    } else {
      signIn();
    }
    
    onGetStarted?.();
  };

  const handleWatchDemo = () => {
    if (characterController) {
      setIsPlaying(true);
      characterController.transitionTo(CharacterState.EXPLAINING);
      
      // Start guided demo
      setTimeout(() => {
        setCurrentDemo('features');
      }, 500);
    }
  };

  return (
    <section 
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background with enhanced glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,230,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(102,51,238,0.1),transparent_50%)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Content */}
        <div className="space-y-8 animate-fadeIn">
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              The Future of{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                Freelancing
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-2xl">
              Connect with elite developers through AI-powered matching, manage projects with intelligent automation, 
              and scale your business with our comprehensive freelancing ecosystem.
            </p>
          </div>

          {/* Dynamic content based on demo state */}
          <div className="space-y-4">
            <DemoContent currentDemo={currentDemo} />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-6">
            <button 
              onClick={handleGetStarted}
              className="btn-primary transform-gpu group"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={handleWatchDemo}
              className="btn-secondary group"
              disabled={isPlaying}
            >
              {isPlaying ? 'Playing Demo...' : 'Watch Demo'}
              <Rocket className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-4 pt-8">
            <FeatureHighlight
              icon="🤖"
              title="AI Matching"
              description="95% accuracy"
            />
            <FeatureHighlight
              icon="⚡"
              title="Fast Setup"
              description="24hr start"
            />
            <FeatureHighlight
              icon="🔒"
              title="Secure"
              description="Bank-grade"
            />
          </div>
        </div>

        {/* Right side - 3D Character */}
        <div className="relative h-[600px] lg:h-[700px]">
          <CharacterScene
            characterType="client-guide"
            environment="homepage"
            interactionMode="interactive"
            className="w-full h-full"
            onCharacterReady={setCharacterController}
            autoRotate={false}
            showControls={false}
          />
          
          {/* Character speech bubble */}
          <CharacterSpeechBubble currentDemo={currentDemo} />
          
          {/* Floating UI elements */}
          <FloatingUIElements />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}

// Dynamic content component
function DemoContent({ currentDemo }: { currentDemo: string }) {
  const content = {
    intro: {
      title: "Welcome to NexusWorks",
      description: "Where AI meets human expertise to create the perfect freelancing experience."
    },
    features: {
      title: "Intelligent Project Management",
      description: "Our AI analyzes your project requirements and automatically matches you with the perfect developers."
    },
    matching: {
      title: "Smart Developer Matching",
      description: "Advanced algorithms consider skills, experience, availability, and project compatibility."
    }
  };

  const current = content[currentDemo as keyof typeof content];

  return (
    <div className="nexus-card p-6 transform-gpu hover:scale-105 transition-all duration-300">
      <h3 className="text-2xl font-bold text-cyan-400 mb-3">{current.title}</h3>
      <p className="text-gray-300 leading-relaxed">{current.description}</p>
    </div>
  );
}

// Feature highlight component
function FeatureHighlight({ 
  icon, 
  title, 
  description 
}: { 
  icon: string; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="text-center space-y-2">
      <div className="text-2xl">{icon}</div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="text-xs text-gray-400">{description}</div>
    </div>
  );
}

// Character speech bubble
function CharacterSpeechBubble({ currentDemo }: { currentDemo: string }) {
  const messages = {
    intro: "Hi! I'm your AI guide. Let me show you around!",
    features: "Watch how our AI analyzes and matches projects...",
    matching: "Here's how we find the perfect developer for you!"
  };

  return (
    <div className="absolute top-4 left-4 max-w-xs">
      <div className="nexus-card p-4 relative">
        <p className="text-sm text-white">
          {messages[currentDemo as keyof typeof messages]}
        </p>
        <div className="absolute -bottom-2 left-6 w-4 h-4 bg-black/40 border border-white/10 rotate-45" />
      </div>
    </div>
  );
}

// Floating UI elements around the character
function FloatingUIElements() {
  return (
    <>
      {/* Floating stats */}
      <div className="absolute top-20 right-4 nexus-card p-3 animate-float">
        <div className="text-xs text-gray-400">Success Rate</div>
        <div className="text-lg font-bold text-green-400">98%</div>
      </div>
      
      <div className="absolute bottom-32 left-4 nexus-card p-3 animate-float" style={{ animationDelay: '1s' }}>
        <div className="text-xs text-gray-400">Active Projects</div>
        <div className="text-lg font-bold text-blue-400">5,000+</div>
      </div>
      
      <div className="absolute top-1/2 right-0 nexus-card p-3 animate-float" style={{ animationDelay: '2s' }}>
        <div className="text-xs text-gray-400">Developers</div>
        <div className="text-lg font-bold text-purple-400">10K+</div>
      </div>
    </>
  );
}