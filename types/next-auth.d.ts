import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'client' | 'developer' | 'admin';
      username: string;
      profileCompleted: boolean;
      githubUsername?: string;
    } & DefaultSession['user'];
    accessToken: string;
    refreshToken: string;
    created?: boolean;
  }

  interface User {
    id: string;
    role: 'client' | 'developer' | 'admin';
    username: string;
    profileCompleted: boolean;
    githubUsername?: string;
    accessToken: string;
    refreshToken: string;
    created?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'client' | 'developer' | 'admin';
    username: string;
    profileCompleted: boolean;
    githubUsername?: string;
    accessToken: string;
    refreshToken: string;
    created?: boolean;
  }
}