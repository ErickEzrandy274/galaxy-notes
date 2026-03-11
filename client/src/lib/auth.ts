import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Facebook from 'next-auth/providers/facebook';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import axios from 'axios';
import { prisma } from './prisma';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const { data } = await axios.post(
            `${apiBaseUrl}/auth/login`,
            {
              email: credentials.email,
              password: credentials.password,
            },
          );
          return data;
        } catch {
          return null;
        }
      },
    }),
  ],
  events: {
    async linkAccount({ user, account }) {
      const providerMap: Record<string, string> = {
        google: 'google_user',
        github: 'github_user',
        facebook: 'facebook_user',
      };
      const userType = providerMap[account.provider];
      if (userType && user.id) {
        // Only set userType if still general_user (first OAuth login)
        // Use updateMany to avoid throwing when no record matches
        await prisma.user.updateMany({
          where: { id: user.id, userType: 'general_user' },
          data: { userType: userType as any },
        });
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign-in
      if (user && account) {
        token.id = user.id;
        token.provider = account.provider;

        if (account.provider === 'credentials') {
          // Credentials login — backend already returned accessToken
          token.accessToken = user.accessToken;
        } else {
          // OAuth login — request a backend JWT via the internal endpoint
          try {
            const { data } = await axios.post(
              `${apiBaseUrl}/auth/oauth-login`,
              { email: user.email, provider: account.provider },
              {
                headers: {
                  'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
                },
              },
            );
            token.accessToken = data.accessToken;
            token.id = data.id;
          } catch {
            token.error = 'OAuthTokenError';
          }
        }
        token.accessTokenExpires = Date.now() + 55 * 60 * 1000;
        return token;
      }

      // Return existing token if still valid
      if (
        token.accessToken &&
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires
      ) {
        return token;
      }

      // Token expired — try refresh
      if (token.accessToken) {
        try {
          const { data } = await axios.post(
            `${apiBaseUrl}/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token.accessToken}`,
              },
            },
          );
          token.accessToken = data.accessToken;
          token.accessTokenExpires = Date.now() + 55 * 60 * 1000;
        } catch {
          token.error = 'RefreshTokenError';
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      session.accessToken = token.accessToken;
      if (token.error) {
        session.error = token.error;
      }
      return session;
    },
  },
});
