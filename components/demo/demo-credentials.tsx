'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, EyeOff, User, Briefcase } from 'lucide-react';
import { DEMO_CREDENTIALS } from '@/lib/demo-credentials';

export function DemoCredentials() {
  const [showPasswords, setShowPasswords] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Demo Credentials</h2>
        <p className="text-gray-400">Use these credentials to test the platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Demo Account */}
        <Card className="nexus-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-cyan-400">Demo Client Account</CardTitle>
                <CardDescription>For testing client features</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-gray-800 px-3 py-2 rounded text-sm text-white">
                    {DEMO_CREDENTIALS.client.email}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(DEMO_CREDENTIALS.client.email, 'client-email')}
                    className="px-2"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                {copiedField === 'client-email' && (
                  <p className="text-xs text-green-400 mt-1">Copied!</p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-400">Password</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-gray-800 px-3 py-2 rounded text-sm text-white">
                    {showPasswords ? DEMO_CREDENTIALS.client.password : '••••••'}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(DEMO_CREDENTIALS.client.password, 'client-password')}
                    className="px-2"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                {copiedField === 'client-password' && (
                  <p className="text-xs text-green-400 mt-1">Copied!</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <h4 className="text-sm font-medium text-white mb-2">Profile Info</h4>
              <div className="space-y-1 text-sm text-gray-400">
                <p>Name: {DEMO_CREDENTIALS.client.profile.full_name}</p>
                <p>Company: {DEMO_CREDENTIALS.client.profile.company}</p>
                <p>Projects: {DEMO_CREDENTIALS.client.profile.projects_completed}</p>
                <p>Rating: {DEMO_CREDENTIALS.client.profile.rating}/5.0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Developer Demo Account */}
        <Card className="nexus-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-purple-400">Demo Developer Account</CardTitle>
                <CardDescription>For testing developer features</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-gray-800 px-3 py-2 rounded text-sm text-white">
                    {DEMO_CREDENTIALS.developer.email}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(DEMO_CREDENTIALS.developer.email, 'dev-email')}
                    className="px-2"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                {copiedField === 'dev-email' && (
                  <p className="text-xs text-green-400 mt-1">Copied!</p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-400">Password</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-gray-800 px-3 py-2 rounded text-sm text-white">
                    {showPasswords ? DEMO_CREDENTIALS.developer.password : '••••••'}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(DEMO_CREDENTIALS.developer.password, 'dev-password')}
                    className="px-2"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                {copiedField === 'dev-password' && (
                  <p className="text-xs text-green-400 mt-1">Copied!</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <h4 className="text-sm font-medium text-white mb-2">Profile Info</h4>
              <div className="space-y-1 text-sm text-gray-400">
                <p>Name: {DEMO_CREDENTIALS.developer.profile.full_name}</p>
                <p>Level: {DEMO_CREDENTIALS.developer.profile.experience_level}</p>
                <p>Rate: ${DEMO_CREDENTIALS.developer.profile.hourly_rate}/hr</p>
                <p>Projects: {DEMO_CREDENTIALS.developer.profile.projects_completed}</p>
                <p>Rating: {DEMO_CREDENTIALS.developer.profile.rating}/5.0</p>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {DEMO_CREDENTIALS.developer.profile.skills?.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toggle Password Visibility */}
      <div className="text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPasswords(!showPasswords)}
          className="gap-2"
        >
          {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showPasswords ? 'Hide' : 'Show'} Passwords
        </Button>
      </div>

      {/* Usage Instructions */}
      <Card className="nexus-card">
        <CardHeader>
          <CardTitle className="text-white">How to Use Demo Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-300">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-cyan-400 text-xs font-bold">1</span>
            </div>
            <div>
              <p className="font-medium text-white">Copy credentials</p>
              <p>Use the copy buttons to copy email and password</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-cyan-400 text-xs font-bold">2</span>
            </div>
            <div>
              <p className="font-medium text-white">Sign in</p>
              <p>Go to the sign-in page and paste the credentials, or use the "Demo" buttons</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-cyan-400 text-xs font-bold">3</span>
            </div>
            <div>
              <p className="font-medium text-white">Explore features</p>
              <p>Access the dashboard and explore client or developer specific features</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}