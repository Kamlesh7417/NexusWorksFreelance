'use client';

import { useState, useEffect } from 'react';
import { WelcomeSection } from '@/components/dashboard/welcome-section';
import { ProfileCard } from '@/components/dashboard/profile-card';
import { MarketplaceCard } from '@/components/dashboard/marketplace-card';
import { LearningCard } from '@/components/dashboard/learning-card';
import { ProjectOrchestratorCard } from '@/components/dashboard/project-orchestrator-card';
import { EnhancedTokenEconomyCard } from '@/components/dashboard/enhanced-token-economy-card';
import { CommunityCard } from '@/components/dashboard/community-card';
import { SecurityCard } from '@/components/dashboard/security-card';
import { AnalyticsCard } from '@/components/dashboard/analytics-card';
import { WorkspaceCard } from '@/components/dashboard/workspace-card';
import { EmotionFeedbackCard } from '@/components/dashboard/emotion-feedback-card';
import { BCICalibrationCard } from '@/components/dashboard/bci-calibration-card';
import { ReputationVotingCard } from '@/components/dashboard/reputation-voting-card';
import { NotificationsCard } from '@/components/dashboard/notifications-card';
import { ProjectAnalyzer } from '@/components/ai/project-analyzer';
import { SkillAnalyzer } from '@/components/ai/skill-analyzer';
import { ProjectMatcher } from '@/components/ai/project-matcher';

export function EnhancedDashboardPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    // Initialize progress bars and animations
    const timer = setTimeout(() => {
      // Animate progress bars
      const progressBars = document.querySelectorAll('.nexus-progress');
      progressBars.forEach((bar, index) => {
        const element = bar as HTMLElement;
        const values = [78, 65, 85, 92, 76, 88];
        element.style.width = `${values[index] || 50}%`;
      });

      // Animate skill bars
      const skillBars = document.querySelectorAll('.nexus-skill-progress');
      skillBars.forEach((bar, index) => {
        const element = bar as HTMLElement;
        const values = [85, 78, 92, 65, 88, 72];
        element.style.width = `${values[index] || 50}%`;
      });

      // Animate chart bars
      const chartBars = document.querySelectorAll('.nexus-bar');
      chartBars.forEach((bar, index) => {
        const element = bar as HTMLElement;
        const values = [60, 75, 85, 70, 90, 80];
        element.style.height = `${values[index] || 50}%`;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return (
      <div className="nexus-loading-overlay flex">
        <div className="nexus-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <WelcomeSection />
      <div className="nexus-dashboard">
        <ProfileCard />
        <MarketplaceCard />
        <LearningCard />
        <ProjectOrchestratorCard />
        <EnhancedTokenEconomyCard />
        <CommunityCard />
        <SecurityCard />
        <AnalyticsCard />
        <WorkspaceCard />
        <EmotionFeedbackCard />
        <BCICalibrationCard />
        <ReputationVotingCard />
        <NotificationsCard />
        
        {/* AI-Enhanced Components */}
        <ProjectAnalyzer />
        <SkillAnalyzer />
        <ProjectMatcher />
      </div>
    </div>
  );
}