'use client';

import React, { useState } from 'react';
import { useAuth } from './auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Github, Loader2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  role: 'client' | 'developer';
  firstName: string;
  lastName: string;
  githubUsername: string;
}

interface AuthFormsProps {
  redirectTo?: string;
  showTabs?: boolean;
  defaultTab?: 'login' | 'register';
}

export function AuthForms({ redirectTo = '/console', showTabs = true, defaultTab = 'login' }: AuthFormsProps) {
  const { login, register, signInWithDemo, loading, error } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Login form state
  const [loginForm, setLoginForm] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  
  // Register form state
  const [registerForm, setRegisterForm] = useState<RegisterData>({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'developer',
    firstName: '',
    lastName: '',
    githubUsername: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', { email: loginForm.email, password: loginForm.password });
    const result = await login(loginForm.email, loginForm.password);
    console.log('Login result:', result);
    if (result.success) {
      router.push(redirectTo);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const registerData = {
      email: registerForm.email,
      password: registerForm.password,
      confirmPassword: registerForm.confirmPassword,
      role: registerForm.role,
      githubUsername: registerForm.githubUsername || undefined,
    };
    const result = await register(registerData);
    if (result.success) {
      router.push(redirectTo);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      // Use NextAuth signIn function
      const { signIn } = await import('next-auth/react');
      await signIn('github', { 
        callbackUrl: redirectTo,
        redirect: true 
      });
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      // Fallback to direct redirect
      window.location.href = '/api/auth/signin/github';
    }
  };

  const handleDemoLogin = async (role: 'client' | 'developer') => {
    console.log('Demo login attempt:', role);
    const result = await signInWithDemo(role);
    console.log('Demo login result:', result);
    if (result.success) {
      router.push(redirectTo);
    }
  };

  const LoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-white">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="Enter your email"
          value={loginForm.email}
          onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
          required
          disabled={loading}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-white">Password</Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={loginForm.password}
            onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
            required
            disabled={loading}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="bg-red-500/20 border-red-500/50">
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full btn-primary" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-black px-2 text-gray-400">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        className="w-full btn-secondary"
        onClick={handleGithubSignIn}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Github className="mr-2 h-4 w-4" />
        )}
        GitHub
      </Button>

      {/* Demo Login Options */}
      <div className="mt-4 space-y-2">
        <div className="text-center text-xs text-gray-400 mb-2">Quick Demo Access</div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleDemoLogin('client')}
            disabled={loading}
            className="text-xs bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
          >
            Demo Client
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleDemoLogin('developer')}
            disabled={loading}
            className="text-xs bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
          >
            Demo Developer
          </Button>
        </div>
      </div>
    </form>
  );

  const RegisterForm = () => (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="register-firstName" className="text-white">First Name</Label>
          <Input
            id="register-firstName"
            placeholder="John"
            value={registerForm.firstName}
            onChange={(e) => setRegisterForm(prev => ({ ...prev, firstName: e.target.value }))}
            required
            disabled={loading}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-lastName" className="text-white">Last Name</Label>
          <Input
            id="register-lastName"
            placeholder="Doe"
            value={registerForm.lastName}
            onChange={(e) => setRegisterForm(prev => ({ ...prev, lastName: e.target.value }))}
            required
            disabled={loading}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email" className="text-white">Email</Label>
        <Input
          id="register-email"
          type="email"
          placeholder="john@example.com"
          value={registerForm.email}
          onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
          required
          disabled={loading}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-role" className="text-white">Role</Label>
        <Select
          value={registerForm.role}
          onValueChange={(value: 'client' | 'developer') => 
            setRegisterForm(prev => ({ ...prev, role: value }))
          }
          disabled={loading}
        >
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-white/20">
            <SelectItem value="client" className="text-white hover:bg-white/10">Client - I want to hire developers</SelectItem>
            <SelectItem value="developer" className="text-white hover:bg-white/10">Developer - I want to work on projects</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-github" className="text-white">GitHub Username (Optional)</Label>
        <Input
          id="register-github"
          placeholder="your-github-username"
          value={registerForm.githubUsername}
          onChange={(e) => setRegisterForm(prev => ({ ...prev, githubUsername: e.target.value }))}
          disabled={loading}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password" className="text-white">Password</Label>
        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            value={registerForm.password}
            onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
            required
            disabled={loading}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirmPassword" className="text-white">Confirm Password</Label>
        <div className="relative">
          <Input
            id="register-confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={registerForm.confirmPassword}
            onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            required
            disabled={loading}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={loading}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="bg-red-500/20 border-red-500/50">
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full btn-primary" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-black px-2 text-gray-400">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        className="w-full btn-secondary"
        onClick={handleGithubSignIn}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Github className="mr-2 h-4 w-4" />
        )}
        GitHub
      </Button>
    </form>
  );

  if (!showTabs) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="nexus-card">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {defaultTab === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-gray-400">
              {defaultTab === 'login' 
                ? 'Enter your credentials to access your account'
                : 'Create a new account to get started'
              }
            </p>
          </div>
          {defaultTab === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="nexus-card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to NexusWorks</h2>
          <p className="text-gray-400">
            Sign in to your account or create a new one
          </p>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2 bg-white/10 border-white/20">
            <TabsTrigger value="login" className="text-white data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="register" className="text-white data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              Sign Up
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="space-y-4 mt-6">
            <LoginForm />
          </TabsContent>
          <TabsContent value="register" className="space-y-4 mt-6">
            <RegisterForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Separate components for specific use cases
export function LoginForm({ redirectTo = '/console' }: { redirectTo?: string }) {
  return <AuthForms redirectTo={redirectTo} showTabs={false} defaultTab="login" />;
}

export function RegisterForm({ redirectTo = '/console' }: { redirectTo?: string }) {
  return <AuthForms redirectTo={redirectTo} showTabs={false} defaultTab="register" />;
}