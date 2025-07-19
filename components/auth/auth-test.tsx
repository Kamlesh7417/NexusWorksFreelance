'use client';

import { useAuth } from './auth-provider';
import { Button } from '@/components/ui/button';

export function AuthTest() {
  const { user, profile, loading, login, signInWithDemo, signOut } = useAuth();

  const testDemoLogin = async () => {
    console.log('Testing demo login...');
    const result = await signInWithDemo('developer');
    console.log('Demo login result:', result);
  };

  const testManualLogin = async () => {
    console.log('Testing manual login...');
    const result = await login('demo.developer@nexusworks.com', 'demo123');
    console.log('Manual login result:', result);
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">Auth Test Component</h2>
      
      <div className="space-y-4">
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'None'}
        </div>
        
        <div>
          <strong>Profile:</strong> {profile ? JSON.stringify(profile, null, 2) : 'None'}
        </div>
        
        <div className="flex gap-2">
          <Button onClick={testDemoLogin} disabled={loading}>
            Test Demo Login
          </Button>
          
          <Button onClick={testManualLogin} disabled={loading}>
            Test Manual Login
          </Button>
          
          {user && (
            <Button onClick={signOut} disabled={loading} variant="destructive">
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}