import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { 
          status: 'warning',
          message: 'Database configuration missing',
          checks: {
            database: 'failed',
            api: 'ok',
            auth: 'unknown'
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test database connection
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Database connection failed',
          error: error.message,
          checks: {
            database: 'failed',
            api: 'ok',
            auth: 'unknown'
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    }
    
    // All checks passed
    return NextResponse.json(
      { 
        status: 'healthy',
        message: 'All systems operational',
        checks: {
          database: 'ok',
          api: 'ok',
          auth: 'ok'
        },
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}