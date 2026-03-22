# Feature: Users API (Backend)

## Overview

The Users API provides profile management, avatar photo upload, password changes, and user search. It handles differences between credentials users (`general_user`) and OAuth users (Google/GitHub/Facebook).

## API Endpoints

All endpoints are JWT-protected (`@UseGuards(AuthGuard('jwt'))`), under the `/api/users` prefix.

### GET /api/users/search?email=

Search users by email for note sharing. Case-insensitive substring match, excludes the requesting user, returns max 10 results.

**Response:** `[{ id, email, firstName, lastName, photo }]`

### GET /api/users/me

Fetch the authenticated user's profile including connected OAuth account info.

**Response:**

```json
{
  "id": "cuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "name": null,
  "bio": "Developer",
  "photo": "userId/profile/timestamp_photo.jpg",
  "userType": "general_user",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "connectedAccount": null
}
```

For OAuth users, `connectedAccount` returns:
```json
{
  "provider": "google",
  "providerEmail": "user@gmail.com"
}
```

### PATCH /api/users/me

Update profile fields. Different fields accepted based on user type:

| Field | `general_user` | OAuth user |
|-------|:--------------:|:----------:|
| `firstName` (max 100) | Yes | — |
| `lastName` (max 100) | Yes | — |
| `name` (max 200) | — | Yes |
| `bio` (max 500) | Yes | Yes |

### PATCH /api/users/me/password

Change password. Only for `general_user` accounts.

**Body:** `ChangePasswordDto` — `currentPassword`, `newPassword` (min 12), `confirmNewPassword`

**Validation:**
- Confirms passwords match
- Verifies user is `general_user` (400 if OAuth)
- Bcrypt compares current password (401 if wrong)
- Hashes new password (bcrypt, 12 rounds)

### POST /api/users/me/photo-upload-url

Generate a signed Supabase Storage upload URL for avatar photo.

**Body:** `{ fileName, mimeType, fileSize }`

**Constraints:** webp/jpeg/png only, max 1MB

**Response:** `{ signedUrl, token, path, publicUrl }`

### PATCH /api/users/me/photo

Save the avatar photo URL after client-side upload. Deletes the old photo from storage if one exists.

**Body:** `{ photoUrl }`

### DELETE /api/users/me/photo

Remove the user's avatar photo. Deletes from Supabase Storage and sets `photo: null`.

## Code Location

| File | Purpose |
|------|---------|
| `server/src/users/users.controller.ts` | Route definitions, guards, DTOs |
| `server/src/users/users.service.ts` | Business logic, Prisma queries, Supabase Storage |
| `server/src/users/users.module.ts` | Module registration (exports `UsersService` for auth module) |
| `server/src/users/dto/update-profile.dto.ts` | Profile update validation |
| `server/src/users/dto/change-password.dto.ts` | Password change validation |

## Storage

Avatar photos are stored in the `galaxy-notes-staging` Supabase Storage bucket at path `{userId}/avatar/{timestamp}_{filename}`.

Private helper methods:
- `extractStoragePath(publicUrl)` — extracts storage path from public URL
- `deleteStorageFile(publicUrl)` — deletes a file from Supabase Storage

**Note:** `User.photo` stores the user's avatar photo. This is completely separate from `Note.document` which stores PDF attachment paths for notes.
