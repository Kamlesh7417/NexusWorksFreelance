'use client';

import { useState, useEffect, useRef } from 'react';
import { CharacterScene } from './character-scene';
import { CharacterState } from './character-controller';
import { X, MessageCircle, HelpCircle, Sparkles } from 'lucide-react';

interface FloatingAIAssistantProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
}

export function FloatingAIAssistant({ 
  isVisible = false, 
  onToggle 
}: FloatingAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(isVisible);
  const [characterController, setCharacterController] = useState<any>(null);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messageTimeoutRef = useRef<NodeJS.Timeout>();

  const messages = [
    "Hi! I'm your AI assistant. How can I help you today?",
    "Need help finding the perfect developer for your project?",
    "Want to learn more about our AI matching system?",
    "I can guide you through any part of NexusWorks!",
    "Click on me anytime for personalized assistance!"
  ];

  useEffect(() => {
    setIsOpen(isVisible);
  }, [isVisible]);

  // Auto-cycle through messages when open
  useEffect(() => {
    if (isOpen && characterController) {
      const cycleMessages = () => {
        setIsTyping(true);
        characterController.transitionTo(CharacterState.EXPLAINING);
        
        setTimeout(() => {
          setCurrentMessage((prev) => (prev + 1) % messages.length);
          setIsTyping(false);
          characterController.transitionTo(CharacterState.IDLE);
        }, 1000);
      };

      messageTimeoutRef.current = setTimeout(cycleMessages, 5000);
      
      return () => {
        if (messageTimeoutRef.current) {
          clearTimeout(messageTimeoutRef.current);
        }
      };
    }
  }, [isOpen, currentMessage, characterController, messages.length]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
    
    if (characterController) {
      if (newState) {
        characterController.transitionTo(CharacterState.GREETING);
      } else {
        characterController.transitionTo(CharacterState.IDLE);
      }
    }
  };

  const handleCharacterClick = () => {
    if (characterController) {
      characterController.transitionTo(CharacterState.CELEBRATING);
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleToggle}
          className={`relative w-16 h-16 rounded-full shadow-lg transition-all duration-300 ${
            isOpen 
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 scale-110' 
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-110'
          }`}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse opacity-75" />
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            {isOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Sparkles className="w-6 h-6 text-white" />
            )}
          </div>
          
          {/* Notification dot */}
          {!isOpen && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          )}
        </button>
      </div>

      {/* Assistant panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 z-40 animate-fadeIn">
          <div className="nexus-card h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">AI Assistant</h3>
                    <p className="text-xs text-gray-400">Always here to help</p>
                  </div>
                </div>
                <button
                  onClick={handleToggle}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3D Character */}
            <div className="flex-1 relative">
              <CharacterScene
                characterType="ai-assistant"
                environment="dashboard"
                interactionMode="interactive"
                className="w-full h-full"
                onCharacterReady={setCharacterController}
              />
              
              {/* Character interaction overlay */}
              <div 
                className="absolute inset-0 cursor-pointer"
                onClick={handleCharacterClick}
              />
            </div>

            {/* Message area */}
            <div className="p-4 border-t border-white/10">
              <div className="nexus-card p-3 mb-3">
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    {isTyping ? (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    ) : (
                      <p className="text-sm text-white">
                        {messages[currentMessage]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Quick actions */}
              <div className="flex gap-2">
                <QuickActionButton
                  icon={<HelpCircle className="w-3 h-3" />}
                  text="Help"
                  onClick={() => setCurrentMessage(0)}
                />
                <QuickActionButton
                  icon={<MessageCircle className="w-3 h-3" />}
                  text="Chat"
                  onClick={() => setCurrentMessage(1)}
                />
                <QuickActionButton
                  icon={<Sparkles className="w-3 h-3" />}
                  text="Demo"
                  onClick={() => setCurrentMessage(2)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Quick action button component
function QuickActionButton({ 
  icon, 
  text, 
  onClick 
}: { 
  icon: React.ReactNode; 
  text: string; 
  onClick: () => void; 
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-gray-300 hover:text-white transition-colors"
    >
      {icon}
      {text}
    </button>
  );
}

// Hook for managing assistant state
export function useFloatingAssistant() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Auto-show assistant after user has been on page for a while
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasInteracted) {
        setIsVisible(true);
      }
    }, 10000); // Show after 10 seconds

    return () => clearTimeout(timer);
  }, [hasInteracted]);

  const showAssistant = () => {
    setIsVisible(true);
    setHasInteracted(true);
  };

  const hideAssistant = () => {
    setIsVisible(false);
    setHasInteracted(true);
  };

  const toggleAssistant = (visible?: boolean) => {
    const newState = visible !== undefined ? visible : !isVisible;
    setIsVisible(newState);
    setHasInteracted(true);
  };

  return {
    isVisible,
    showAssistant,
    hideAssistant,
    toggleAssistant,
    hasInteracted
  };
}