import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    role: string;
    name?: string | null;
    group?: string;
    rollNo?: number | null;
    domain?: string;
    profileId?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      name?: string | null;
      group?: string;
      rollNo?: number | null;
      domain?: string;
      profileId?: string;
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    group?: string;
    rollNo?: number | null;
    domain?: string;
    profileId?: string;
  }
}
