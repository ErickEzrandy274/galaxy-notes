export type UserType =
  | 'general_user'
  | 'google_user'
  | 'github_user'
  | 'facebook_user';

export interface ConnectedAccount {
  provider: string;
  providerEmail: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  bio: string | null;
  photo: string | null;
  userType: UserType;
  createdAt: string;
  connectedAccount: ConnectedAccount | null;
}

export interface SignedUploadUrlResponse {
  signedUrl: string;
  token: string;
  path: string;
  publicUrl: string;
}
