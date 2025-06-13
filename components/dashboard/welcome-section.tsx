'use client';

import { useState } from 'react';
import { OnboardingModal } from '@/components/modals/onboarding-modal';

export function WelcomeSection() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <>
      <div className="nexus-welcome-section">
        <h1>Welcome to NexusWorks</h1>
        <p>The Future of Freelancing with Holographic Immersion & AI Integration</p>
        <button 
          className="nexus-action-btn mt-4" 
          onClick={() => setShowOnboarding(true)}
        >
          Quick Start: Set Up Profile
        </button>
      </div>
      
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />
    </>
  );
}