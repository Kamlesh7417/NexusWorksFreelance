import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(new URL('/auth/error?error=MissingCode', request.url));
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL(`/auth/error?error=${error.message}`, request.url));
    }

    // Redirect to the dashboard or home page
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Unexpected error during callback:', error);
    return NextResponse.redirect(new URL('/auth/error?error=UnexpectedError', request.url));
  }
}