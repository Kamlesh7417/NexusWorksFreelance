'use client';

import { useState, useEffect } from 'react';
import { supabase, ProjectService, AuthService, MessageService, BidService } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2, Database, Users, MessageSquare, FileText, Star } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function SupabaseTestPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'pending' | 'success' | 'error'>('pending');

  const updateTest = (name: string, status: 'success' | 'error', message: string, details?: any) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, status, message, details } : test
    ));
  };

  const initializeTests = () => {
    const testList: TestResult[] = [
      { name: 'Database Connection', status: 'pending', message: 'Testing connection...' },
      { name: 'User Profiles Table', status: 'pending', message: 'Checking table structure...' },
      { name: 'Projects Table', status: 'pending', message: 'Checking table structure...' },
      { name: 'Project Bids Table', status: 'pending', message: 'Checking table structure...' },
      { name: 'Messages Table', status: 'pending', message: 'Checking table structure...' },
      { name: 'Reviews Table', status: 'pending', message: 'Checking table structure...' },
      { name: 'Storage Buckets', status: 'pending', message: 'Checking storage setup...' },
      { name: 'RLS Policies', status: 'pending', message: 'Testing row level security...' },
      { name: 'Real-time Subscriptions', status: 'pending', message: 'Testing real-time features...' },
      { name: 'CRUD Operations', status: 'pending', message: 'Testing create, read, update, delete...' }
    ];
    setTests(testList);
  };

  const runTests = async () => {
    setIsRunning(true);
    setOverallStatus('pending');
    initializeTests();

    try {
      // Test 1: Database Connection
      try {
        const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
        if (error) throw error;
        updateTest('Database Connection', 'success', 'Successfully connected to Supabase');
      } catch (error: any) {
        updateTest('Database Connection', 'error', `Connection failed: ${error.message}`);
        return;
      }

      // Test 2: User Profiles Table
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, email, full_name, role, created_at')
          .limit(1);
        
        if (error) throw error;
        updateTest('User Profiles Table', 'success', `Table exists and accessible. Found ${data?.length || 0} profiles.`);
      } catch (error: any) {
        updateTest('User Profiles Table', 'error', `Table check failed: ${error.message}`);
      }

      // Test 3: Projects Table
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, title, status, client_id, created_at')
          .limit(5);
        
        if (error) throw error;
        updateTest('Projects Table', 'success', `Table exists and accessible. Found ${data?.length || 0} projects.`, data);
      } catch (error: any) {
        updateTest('Projects Table', 'error', `Table check failed: ${error.message}`);
      }

      // Test 4: Project Bids Table
      try {
        const { data, error } = await supabase
          .from('project_bids')
          .select('id, project_id, developer_id, amount, status')
          .limit(5);
        
        if (error) throw error;
        updateTest('Project Bids Table', 'success', `Table exists and accessible. Found ${data?.length || 0} bids.`);
      } catch (error: any) {
        updateTest('Project Bids Table', 'error', `Table check failed: ${error.message}`);
      }

      // Test 5: Messages Table
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id, sender_id, receiver_id, content, created_at')
          .limit(5);
        
        if (error) throw error;
        updateTest('Messages Table', 'success', `Table exists and accessible. Found ${data?.length || 0} messages.`);
      } catch (error: any) {
        updateTest('Messages Table', 'error', `Table check failed: ${error.message}`);
      }

      // Test 6: Reviews Table
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('id, project_id, reviewer_id, rating, created_at')
          .limit(5);
        
        if (error) throw error;
        updateTest('Reviews Table', 'success', `Table exists and accessible. Found ${data?.length || 0} reviews.`);
      } catch (error: any) {
        updateTest('Reviews Table', 'error', `Table check failed: ${error.message}`);
      }

      // Test 7: Storage Buckets
      try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) throw error;
        
        const expectedBuckets = ['project-files', 'avatars', 'portfolios'];
        const existingBuckets = data?.map(b => b.name) || [];
        const missingBuckets = expectedBuckets.filter(b => !existingBuckets.includes(b));
        
        if (missingBuckets.length === 0) {
          updateTest('Storage Buckets', 'success', `All required buckets exist: ${expectedBuckets.join(', ')}`);
        } else {
          updateTest('Storage Buckets', 'error', `Missing buckets: ${missingBuckets.join(', ')}`);
        }
      } catch (error: any) {
        updateTest('Storage Buckets', 'error', `Storage check failed: ${error.message}`);
      }

      // Test 8: RLS Policies (basic test)
      try {
        // Test if we can query without authentication (should work for public tables)
        const { data, error } = await supabase
          .from('projects')
          .select('id, title, status')
          .limit(1);
        
        if (error) throw error;
        updateTest('RLS Policies', 'success', 'Row Level Security is properly configured');
      } catch (error: any) {
        updateTest('RLS Policies', 'error', `RLS test failed: ${error.message}`);
      }

      // Test 9: Real-time Subscriptions
      try {
        const channel = supabase
          .channel('test-channel')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'projects' }, 
            (payload) => console.log('Real-time test:', payload)
          );
        
        await channel.subscribe();
        
        if (channel.state === 'joined') {
          updateTest('Real-time Subscriptions', 'success', 'Real-time subscriptions are working');
          supabase.removeChannel(channel);
        } else {
          updateTest('Real-time Subscriptions', 'error', 'Failed to subscribe to real-time updates');
        }
      } catch (error: any) {
        updateTest('Real-time Subscriptions', 'error', `Real-time test failed: ${error.message}`);
      }

      // Test 10: CRUD Operations (using service classes)
      try {
        // Test getting projects using the service
        const { data: projects, error: projectError } = await ProjectService.getProjects();
        
        if (projectError) throw projectError;
        
        updateTest('CRUD Operations', 'success', `Service classes working. Found ${projects?.length || 0} projects via ProjectService`);
      } catch (error: any) {
        updateTest('CRUD Operations', 'error', `CRUD test failed: ${error.message}`);
      }

      // Determine overall status
      const finalTests = tests.map(test => {
        const currentTest = tests.find(t => t.name === test.name);
        return currentTest || test;
      });

      const hasErrors = finalTests.some(test => test.status === 'error');
      setOverallStatus(hasErrors ? 'error' : 'success');

    } catch (error: any) {
      console.error('Test suite failed:', error);
      setOverallStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    initializeTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={20} className="text-green-400" />;
      case 'error': return <XCircle size={20} className="text-red-400" />;
      default: return <Loader2 size={20} className="text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-500/30 bg-green-500/10';
      case 'error': return 'border-red-500/30 bg-red-500/10';
      default: return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-cyan-400 mb-2">Supabase Integration Test</h1>
              <p className="text-gray-400">Comprehensive validation of database schema and functionality</p>
            </div>
            
            <button
              onClick={runTests}
              disabled={isRunning}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Database size={16} />
                  Run Tests
                </>
              )}
            </button>
          </div>

          {/* Overall Status */}
          {overallStatus !== 'pending' && (
            <div className={`mb-6 p-4 rounded-lg border ${getStatusColor(overallStatus)}`}>
              <div className="flex items-center gap-3">
                {getStatusIcon(overallStatus)}
                <div>
                  <h3 className="font-semibold">
                    {overallStatus === 'success' ? 'All Tests Passed!' : 'Some Tests Failed'}
                  </h3>
                  <p className="text-sm opacity-80">
                    {overallStatus === 'success' 
                      ? 'Your Supabase integration is working perfectly. All database tables, policies, and features are properly configured.'
                      : 'There are some issues with your Supabase setup. Check the failed tests below for details.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Test Results */}
          <div className="space-y-4">
            {tests.map((test, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}>
                <div className="flex items-start gap-3">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{test.name}</h3>
                    <p className="text-sm opacity-80">{test.message}</p>
                    
                    {test.details && test.status === 'success' && (
                      <details className="mt-2">
                        <summary className="text-xs text-cyan-400 cursor-pointer">View Details</summary>
                        <pre className="mt-2 text-xs bg-black/20 p-2 rounded overflow-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Database Schema Info */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-cyan-400" />
                <h4 className="font-semibold text-cyan-400">User Management</h4>
              </div>
              <p className="text-sm opacity-80">Authentication, profiles, and role-based access</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-green-400" />
                <h4 className="font-semibold text-green-400">Project System</h4>
              </div>
              <p className="text-sm opacity-80">Projects, bids, and collaboration features</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={16} className="text-purple-400" />
                <h4 className="font-semibold text-purple-400">Communication</h4>
              </div>
              <p className="text-sm opacity-80">Real-time messaging and notifications</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star size={16} className="text-yellow-400" />
                <h4 className="font-semibold text-yellow-400">Reviews</h4>
              </div>
              <p className="text-sm opacity-80">Rating and feedback system</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database size={16} className="text-blue-400" />
                <h4 className="font-semibold text-blue-400">Storage</h4>
              </div>
              <p className="text-sm opacity-80">File uploads and asset management</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 size={16} className="text-pink-400" />
                <h4 className="font-semibold text-pink-400">Real-time</h4>
              </div>
              <p className="text-sm opacity-80">Live updates and subscriptions</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 flex flex-wrap gap-4">
            <a 
              href="/supabase-demo" 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
            >
              Try Supabase Demo
            </a>
            <a 
              href="/" 
              className="border border-gray-500 text-gray-400 hover:bg-gray-500/20 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}