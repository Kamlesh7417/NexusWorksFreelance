'use client';

import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function OnboardingPage() {
  return (
    <ErrorBoundary>
      <OnboardingFlow />
    </ErrorBoundary>
  );
}