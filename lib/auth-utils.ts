import { getServerSession } from 'next-auth/next';
import { createClient } from '@supabase/supabase-js';

export async function getUserProfile(userId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

export async function getServerSideSession() {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return null;
    }

    // Fetch additional user data if needed
    if (session.user.id) {
      const profile = await getUserProfile(session.user.id);
      if (profile) {
        session.user.role = profile.role;
        session.user.profile = profile;
      }
    }

    return session;
  } catch (error) {
    console.error('Error in getServerSideSession:', error);
    return null;
  }
}

export function isAuthorized(session: any, allowedRoles: string[] = []) {
  if (!session || !session.user) {
    return false;
  }

  if (allowedRoles.length === 0) {
    return true;
  }

  return allowedRoles.includes(session.user.role);
}