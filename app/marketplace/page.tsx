'use client';

import { MarketplacePage } from '@/components/pages/marketplace-page';
import { AuthProvider } from '@/components/auth/auth-provider';

export default function Marketplace() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-black animate-fadeIn">
        <MarketplacePage />
      </div>
    </AuthProvider>
  );
}