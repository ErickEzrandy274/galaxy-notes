import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: string;
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    provider?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    loginAt?: number;
    error?: string;
  }
}
