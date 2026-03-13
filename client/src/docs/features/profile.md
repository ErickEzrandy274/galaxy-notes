# Feature: Profile Management

## Overview

The Profile page allows users to view and edit their profile information, change their avatar, update their password (credentials users), and see connected OAuth accounts.

## Directory Structure

```
client/src/features/profile/
├── api/profile-api.ts                # API calls (fetch, update, password, photo)
├── components/
│   ├── profile-page.tsx              # Main orchestrator (conditional rendering)
│   ├── profile-avatar.tsx            # Avatar display with upload (credentials) or provider badge (OAuth)
│   ├── profile-form.tsx              # First/Last name + Bio form (general_user)
│   ├── profile-form-oauth.tsx        # Full Name + Bio form (OAuth users)
│   ├── change-password-form.tsx      # Current/New/Confirm password with generate
│   └── connected-account.tsx         # OAuth provider info display
├── hooks/
│   └── use-profile.ts               # React Query hooks (useProfile, useUpdateProfile, etc.)
├── types/
│   └── index.ts                     # UserProfile, ConnectedAccount, UserType
└── index.ts                         # Barrel export
```

## Page Route

`/settings` → `<ProfilePage />`

## Data Flow

```
useProfile() → React Query (queryKey: ['profile'])
  → fetchProfile() → GET /api/users/me
  → ProfilePage conditionally renders components based on userType
```

## Conditional Rendering by User Type

| Component | `general_user` | OAuth user |
|-----------|:--------------:|:----------:|
| ProfileAvatar | Upload/remove photo | Provider badge, "managed by provider" |
| ProfileForm | First/Last name, Bio | — |
| ProfileFormOAuth | — | Full Name, Bio |
| ChangePasswordForm | Current/New/Confirm | — |
| ConnectedAccount | — | Provider + email |

## Profile Avatar

- **Credentials users:** Initials fallback (firstName + lastName chars), "Change Photo" button, file input (webp/jpeg/png, max 1MB), lightbox on click
- **OAuth users:** Initials from `name` field (up to 3 chars), provider badge overlay (bottom-right corner icon), "Photo managed by {provider}" text, "Connected via {provider}" pill
- **Upload flow:** File input → validate type/size → `createPhotoUploadUrl()` → PUT to Supabase → `updatePhoto(publicUrl)` → invalidate cache
- **Remove:** `removePhoto()` → backend deletes from storage + sets null

## Profile Forms

### General User Form (`ProfileForm`)
- Fields: First Name, Last Name, Email (read-only with lock icon), Bio (textarea)
- Validation: `profileSchema` (Zod) — firstName required, lastName required
- Submit: `PATCH /api/users/me` with `{ firstName, lastName, bio }`

### OAuth User Form (`ProfileFormOAuth`)
- Fields: Full Name, Email (read-only, "managed by {provider}"), Bio (textarea)
- Validation: `profileOAuthSchema` (Zod) — name required (min 1 char)
- Submit: `PATCH /api/users/me` with `{ name, bio }`

## Change Password

Only shown for `general_user` accounts.

- Fields: Current Password, New Password, Confirm New Password (each with Eye/EyeOff toggle)
- "Generate password!" button: generates 16-char crypto-random password (reuses `generatePassword` from auth feature), auto-fills both new password fields, reveals them
- Validation: `changePasswordSchema` — newPassword min 12 chars, mixed case, number, special char, confirmation must match
- Submit: `PATCH /api/users/me/password`

## Connected Account

Displayed for OAuth users with a connected provider account. Shows provider icon (Google/GitHub/Facebook), provider label, associated email, and green "Connected" badge.

## API Functions

| Function | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| `fetchProfile()` | GET | `/users/me` | Fetch current user profile |
| `updateProfile(data)` | PATCH | `/users/me` | Update name/bio |
| `changePassword(data)` | PATCH | `/users/me/password` | Change password |
| `createPhotoUploadUrl(...)` | POST | `/users/me/photo-upload-url` | Get signed upload URL |
| `updatePhoto(photoUrl)` | PATCH | `/users/me/photo` | Save photo URL after upload |
| `removePhoto()` | DELETE | `/users/me/photo` | Remove avatar photo |

## UserProfile Type

```typescript
interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;           // Used by OAuth users
  bio: string | null;
  photo: string | null;          // Avatar storage path (User.photo, NOT Note.document)
  userType: UserType;
  createdAt: string;
  connectedAccount: ConnectedAccount | null;
}
```

**Note:** `UserProfile.photo` refers to the user's avatar photo on the `User` model — this is separate from `Note.document` which stores PDF attachment paths.
