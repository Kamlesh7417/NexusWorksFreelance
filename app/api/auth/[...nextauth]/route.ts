import NextAuth, { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';

// Django API base URL
const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000/api';

interface DjangoUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  user_type: 'client' | 'developer' | 'admin';
  github_username?: string;
  profile_completed: boolean;
}

interface DjangoAuthResponse {
  access: string;
  refresh: string;
  user: DjangoUser;
}

interface DjangoGithubAuthResponse {
  access: string;
  refresh: string;
  user: DjangoUser;
  created: boolean;
}

// Helper function to authenticate with Django backend
async function authenticateWithDjango(email: string, password: string): Promise<DjangoAuthResponse | null> {
  try {
    const response = await fetch(`${DJANGO_API_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: email, password }),
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Django authentication error:', error);
    return null;
  }
}

// Helper function to register/authenticate GitHub user with Django
async function authenticateGithubWithDjango(githubProfile: any, accessToken: string): Promise<DjangoGithubAuthResponse | null> {
  try {
    const response = await fetch(`${DJANGO_API_URL}/auth/github-oauth/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        github_id: githubProfile.id,
        username: githubProfile.login,
        email: githubProfile.email,
        first_name: githubProfile.name?.split(' ')[0] || '',
        last_name: githubProfile.name?.split(' ').slice(1).join(' ') || '',
        avatar_url: githubProfile.avatar_url,
        github_access_token: accessToken,
        bio: githubProfile.bio || '',
        location: githubProfile.location || '',
        public_repos: githubProfile.public_repos || 0,
        followers: githubProfile.followers || 0,
        following: githubProfile.following || 0,
      }),
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Django GitHub authentication error:', error);
    return null;
  }
}

// Helper function to refresh Django JWT token
async function refreshDjangoToken(refreshToken: string): Promise<{ access: string } | null> {
  try {
    const response = await fetch(`${DJANGO_API_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Django token refresh error:', error);
    return null;
  }
}

// Helper function to get user profile from Django
async function getDjangoUserProfile(accessToken: string): Promise<DjangoUser | null> {
  try {
    const response = await fetch(`${DJANGO_API_URL}/users/profile/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Django user profile fetch error:', error);
    return null;
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const authResponse = await authenticateWithDjango(credentials.email, credentials.password);
        
        if (authResponse) {
          return {
            id: authResponse.user.id,
            email: authResponse.user.email,
            name: `${authResponse.user.first_name} ${authResponse.user.last_name}`.trim(),
            role: authResponse.user.user_type,
            username: authResponse.user.username,
            accessToken: authResponse.access,
            refreshToken: authResponse.refresh,
            profileCompleted: authResponse.user.profile_completed,
            githubUsername: authResponse.user.github_username,
          };
        }

        return null;
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github' && profile) {
        try {
          const githubAuthResponse = await authenticateGithubWithDjango(profile, account.access_token!);
          
          if (githubAuthResponse) {
            // Store Django tokens in the user object for later use
            user.accessToken = githubAuthResponse.access;
            user.refreshToken = githubAuthResponse.refresh;
            user.role = githubAuthResponse.user.user_type;
            user.username = githubAuthResponse.user.username;
            user.profileCompleted = githubAuthResponse.user.profile_completed;
            user.created = githubAuthResponse.created;
            return true;
          }
          return false;
        } catch (error) {
          console.error('GitHub sign-in error:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }: { token: JWT; user?: any; account?: any }) {
      // Initial sign in
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.role = user.role;
        token.username = user.username;
        token.profileCompleted = user.profileCompleted;
        token.githubUsername = user.githubUsername;
        token.created = user.created;
      }

      // Check if access token needs refresh (refresh 5 minutes before expiry)
      if (token.accessToken && token.refreshToken) {
        try {
          // Decode JWT to check expiry (simplified check)
          const tokenPayload = JSON.parse(atob(token.accessToken.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const tokenExpiry = tokenPayload.exp;

          // Refresh token if it expires in the next 5 minutes
          if (tokenExpiry - currentTime < 300) {
            const refreshResponse = await refreshDjangoToken(token.refreshToken);
            if (refreshResponse) {
              token.accessToken = refreshResponse.access;
              
              // Also refresh user profile data
              const userProfile = await getDjangoUserProfile(refreshResponse.access);
              if (userProfile) {
                token.role = userProfile.user_type;
                token.profileCompleted = userProfile.profile_completed;
                token.githubUsername = userProfile.github_username;
              }
            }
          }
        } catch (error) {
          console.error('Token refresh error:', error);
          // If refresh fails, clear tokens to force re-authentication
          token.accessToken = null;
          token.refreshToken = null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as 'client' | 'developer' | 'admin';
        session.user.username = token.username as string;
        session.user.profileCompleted = token.profileCompleted as boolean;
        session.user.githubUsername = token.githubUsername as string;
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.created = token.created as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };