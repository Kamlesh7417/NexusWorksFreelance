import type { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          username: profile.login,
          role: 'developer' as const,
          profileCompleted: false,
          githubUsername: profile.login,
          accessToken: '',
          refreshToken: '',
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) {
        return false;
      }

      if (account?.provider === 'github') {
        try {
          // Check if user exists in Supabase
          const { data: existingUser, error: fetchError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('email', user.email)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching user:', fetchError);
            return false;
          }

          // If user doesn't exist, create a new profile
          if (!existingUser) {
            const githubProfile = profile as any;
            
            const { data: newUser, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: user.id,
                email: user.email,
                full_name: user.name || githubProfile.login,
                role: 'developer', // Default role
                avatar_url: user.image,
                bio: githubProfile.bio || '',
                skills: [],
                github_username: githubProfile.login,
                location: githubProfile.location || '',
                experience_level: 'beginner',
                availability_status: 'available'
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating user profile:', createError);
              return false;
            }
          }
          
          return true;
        } catch (error) {
          console.error('Error during sign in:', error);
          return false;
        }
      }
      
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        
        // Fetch user profile from Supabase
        const { data: userProfile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', token.sub)
          .single();
          
        if (!error && userProfile) {
          session.user.role = userProfile.role;
          // Store profile data in session if needed
        }
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        token.githubProfile = profile;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};