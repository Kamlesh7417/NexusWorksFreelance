/**
 * Supabase Client (Placeholder)
 * This is a placeholder file to prevent build errors
 * The actual Supabase integration is being replaced by Django backend
 */

// Placeholder exports to prevent build errors
export const supabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({ 
      limit: (count: number) => Promise.resolve({ data: [], error: null }),
    }),
  }),
  storage: {
    listBuckets: () => Promise.resolve({ data: [], error: null }),
  },
  channel: (name: string) => {
    const channelObj = {
      on: (event: string, config: any, callback: any) => channelObj,
      subscribe: () => Promise.resolve(),
      state: 'joined',
    };
    return channelObj;
  },
  removeChannel: (channel: any) => {},
};

export const ProjectService = {
  getProjects: () => Promise.resolve({ data: [], error: null }),
};

export const AuthService = {
  getCurrentUser: () => Promise.resolve({ data: null, error: null }),
};

export const MessageService = {
  getMessages: () => Promise.resolve({ data: [], error: null }),
};

export const BidService = {
  getBids: () => Promise.resolve({ data: [], error: null }),
};

// Note: This file is deprecated and will be removed once Django integration is complete
console.warn('Supabase integration is deprecated. Please use Django backend services instead.');

export default supabase;