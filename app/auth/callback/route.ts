import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  if (error) {
    console.error('OAuth error:', error, error_description);
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    );
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Session exchange error:', error);
        return NextResponse.redirect(
          new URL(`/auth/error?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
      }

      if (data.user) {
        // Check if user profile exists
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        // If no profile exists, create one with GitHub data
        if (!profile && !profileError) {
          const githubData = data.user.user_metadata;
          
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: githubData.full_name || githubData.name || data.user.email?.split('@')[0] || '',
              role: 'developer', // Default role, can be changed during onboarding
              avatar_url: githubData.avatar_url,
              bio: githubData.bio || '',
              location: githubData.location || '',
              skills: [], // Will be filled during onboarding
              hourly_rate: null
            });

          if (insertError) {
            console.error('Profile creation error:', insertError);
          }
        }

        // Redirect to dashboard or onboarding based on profile completeness
        const redirectTo = profile?.skills?.length > 0 ? '/dashboard' : '/onboarding';
        return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(
        new URL(`/auth/error?error=${encodeURIComponent('Authentication failed')}`, requestUrl.origin)
      );
    }
  }

  // Fallback redirect
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}