import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide email and password');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            adminProfile: true,
            mentorProfile: true,
            internProfile: true,
            viewerProfile: true,
          },
        });

        if (!user) {
          throw new Error('No user found with this email');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid password');
        }

        // Get details based on role
        let name = 'User';
        let group = '';
        let rollNo: number | null = null;
        let domain = '';
        let profileId = '';

        if (user.role === 'ADMIN') {
          name = 'Admin';
          profileId = user.adminProfile?.id || '';
        } else if (user.role === 'MENTOR' && user.mentorProfile) {
          name = user.mentorProfile.name;
          group = user.mentorProfile.group;
          profileId = user.mentorProfile.id;
        } else if (user.role === 'INTERN' && user.internProfile) {
          name = user.internProfile.name;
          group = user.internProfile.group;
          rollNo = user.internProfile.rollNo;
          domain = user.internProfile.domain || '';
          profileId = user.internProfile.id;
        } else if (user.role === 'VIEWER' && user.viewerProfile) {
          name = user.viewerProfile.name;
          profileId = user.viewerProfile.id;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name,
          group,
          rollNo,
          domain,
          profileId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.group = user.group;
        token.rollNo = user.rollNo;
        token.domain = user.domain;
        token.profileId = user.profileId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = session.user || {};
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.group = token.group;
        session.user.rollNo = token.rollNo;
        session.user.domain = token.domain;
        session.user.profileId = token.profileId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
