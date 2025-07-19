'use client';

import { useState, useEffect, useRef } from 'react';
import { CharacterScene } from './character-scene';
import { CharacterState } from './character-controller';

interface JourneyCharacterProps {
  journeyType: 'client' | 'developer';
  step: number;
  isActive: boolean;
  onStepComplete?: (step: number) => void;
}

export function JourneyCharacter({ 
  journeyType, 
  step, 
  isActive, 
  onStepComplete 
}: JourneyCharacterProps) {
  const [characterController, setCharacterController] = useState<any>(null);
  const [currentAnimation, setCurrentAnimation] = useState<CharacterState>(CharacterState.IDLE);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Journey step animations
  useEffect(() => {
    if (!characterController || !isActive) return;

    const animateStep = async () => {
      switch (step) {
        case 1:
          setCurrentAnimation(CharacterState.THINKING);
          characterController.transitionTo(CharacterState.THINKING);
          break;
        case 2:
          setCurrentAnimation(CharacterState.POINTING);
          characterController.transitionTo(CharacterState.POINTING);
          break;
        case 3:
          setCurrentAnimation(CharacterState.EXPLAINING);
          characterController.transitionTo(CharacterState.EXPLAINING);
          break;
        case 4:
          setCurrentAnimation(CharacterState.CELEBRATING);
          characterController.transitionTo(CharacterState.CELEBRATING);
          break;
        default:
          setCurrentAnimation(CharacterState.IDLE);
          characterController.transitionTo(CharacterState.IDLE);
      }

      // Auto-advance to next step after animation
      timeoutRef.current = setTimeout(() => {
        onStepComplete?.(step);
      }, 3000);
    };

    animateStep();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [step, isActive, characterController, onStepComplete]);

  const getStepDescription = () => {
    const descriptions = {
      client: {
        1: "Analyzing your project requirements with AI...",
        2: "Finding the perfect developers for you...",
        3: "Setting up your project workspace...",
        4: "Your project is ready to launch!"
      },
      developer: {
        1: "Analyzing your GitHub profile and skills...",
        2: "Matching you with relevant projects...",
        3: "Preparing your developer dashboard...",
        4: "You're ready to start earning!"
      }
    };

    return descriptions[journeyType][step as keyof typeof descriptions[typeof journeyType]] || '';
  };

  return (
    <div className="relative w-full h-64 lg:h-80">
      <CharacterScene
        characterType={journeyType === 'client' ? 'client-guide' : 'developer-guide'}
        environment="dashboard"
        interactionMode="passive"
        className="w-full h-full"
        onCharacterReady={setCharacterController}
      />
      
      {/* Step indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="nexus-card px-4 py-2 text-center">
          <div className="text-sm font-semibold text-cyan-400 mb-1">
            Step {step} of 4
          </div>
          <div className="text-xs text-gray-300">
            {getStepDescription()}
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="absolute top-4 left-4 right-4">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Interactive journey demo component
export function InteractiveJourneyDemo({ journeyType }: { journeyType: 'client' | 'developer' }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const startDemo = () => {
    setIsPlaying(true);
    setCurrentStep(1);
  };

  const handleStepComplete = (step: number) => {
    if (step < 4) {
      setCurrentStep(step + 1);
    } else {
      setIsPlaying(false);
      setCurrentStep(1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-4">
          Experience the {journeyType === 'client' ? 'Client' : 'Developer'} Journey
        </h3>
        <p className="text-gray-300 mb-6">
          Watch our AI guide demonstrate the complete {journeyType} experience
        </p>
        
        {!isPlaying && (
          <button
            onClick={startDemo}
            className="btn-primary"
          >
            Start Interactive Demo
          </button>
        )}
      </div>

      {isPlaying && (
        <JourneyCharacter
          journeyType={journeyType}
          step={currentStep}
          isActive={isPlaying}
          onStepComplete={handleStepComplete}
        />
      )}
      
      {/* Journey steps overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((stepNum) => (
          <JourneyStepCard
            key={stepNum}
            step={stepNum}
            journeyType={journeyType}
            isActive={currentStep === stepNum && isPlaying}
            isCompleted={currentStep > stepNum && isPlaying}
          />
        ))}
      </div>
    </div>
  );
}

// Journey step card component
function JourneyStepCard({ 
  step, 
  journeyType, 
  isActive, 
  isCompleted 
}: { 
  step: number; 
  journeyType: 'client' | 'developer'; 
  isActive: boolean; 
  isCompleted: boolean; 
}) {
  const stepData = {
    client: {
      1: { title: 'AI Analysis', icon: '🧠', description: 'Project requirements analyzed' },
      2: { title: 'Smart Matching', icon: '🎯', description: 'Perfect developers found' },
      3: { title: 'Project Setup', icon: '🚀', description: 'Workspace configured' },
      4: { title: 'Launch Ready', icon: '✅', description: 'Ready to start' }
    },
    developer: {
      1: { title: 'Profile Analysis', icon: '📊', description: 'Skills and experience evaluated' },
      2: { title: 'Project Matching', icon: '🔗', description: 'Relevant opportunities found' },
      3: { title: 'Dashboard Setup', icon: '💼', description: 'Developer tools prepared' },
      4: { title: 'Start Earning', icon: '💰', description: 'Ready to work' }
    }
  };

  const data = stepData[journeyType][step as keyof typeof stepData[typeof journeyType]];

  return (
    <div className={`nexus-card p-4 text-center transition-all duration-300 ${
      isActive ? 'ring-2 ring-cyan-400 scale-105' : ''
    } ${isCompleted ? 'bg-green-500/10 border-green-500/30' : ''}`}>
      <div className="text-2xl mb-2">{data.icon}</div>
      <h4 className="font-semibold text-white mb-2">{data.title}</h4>
      <p className="text-xs text-gray-400">{data.description}</p>
      
      {isActive && (
        <div className="mt-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse mx-auto" />
        </div>
      )}
      
      {isCompleted && (
        <div className="mt-2">
          <div className="w-2 h-2 bg-green-400 rounded-full mx-auto" />
        </div>
      )}
    </div>
  );
}