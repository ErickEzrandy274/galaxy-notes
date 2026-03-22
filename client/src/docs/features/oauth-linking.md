# OAuth Account Linking

## Route
`/oauth-linking?provider={provider}&email={email}`

## Figma Reference
Node ID: `29-1961` — [View in Figma](https://www.figma.com/design/sy3qiDaLaCL4jDtkVRnWze/Note-Management?node-id=29-1961)

## Overview
Shown when a user signs in via OAuth (Google/GitHub/Facebook) but an email/password account already exists with the same email. The user must verify ownership by entering their existing password to merge the OAuth identity into their account.

## Component Composition
```
PasswordResetLayout
└── OAuthLinkingPage
    └── Suspense
        └── OAuthLinkingContent
            ├── AuthCard (with relative positioning)
            │   ├── X close button (absolute top-right)
            │   ├── ProviderIcon (dynamic letter based on provider)
            │   ├── AuthHeader (dynamic title/subtitle)
            │   ├── Read-only email display
            │   ├── Form
            │   │   ├── PasswordInput
            │   │   └── AuthSubmitButton ("Link Account")
            │   └── Cancel button
```

## Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| `provider` | `'google' \| 'github' \| 'facebook'` | OAuth provider that triggered the collision |
| `email` | string | The email address of the existing account |

## Dynamic Provider Support
| Provider | Icon Letter | Title |
|----------|------------|-------|
| Google | G | "Link Your Google Account" |
| GitHub | GH | "Link Your GitHub Account" |
| Facebook | f | "Link Your Facebook Account" |

## OAuth Collision Flow (End-to-End)
1. User clicks OAuth sign-in button on Login page (e.g., "Sign in with Google")
2. OAuth flow redirects to provider, user authorizes
3. Callback returns to app with OAuth credentials
4. Backend detects existing email/password account with same email
5. Backend returns error/redirect indicating collision
6. Frontend navigates to `/oauth-linking?provider=google&email=john@gmail.com`
7. User enters their existing account password
8. Frontend POSTs to `/auth/link-oauth` with `{ email, password, provider }`
9. Backend verifies password, merges OAuth identity into existing account
10. On success: toast + redirect to `/login`
11. On error: toast "Invalid password. Please try again."

## Security Considerations
- **Prevents silent takeover**: Requires password verification before linking
- **User control**: User can cancel and keep accounts separate
- **Read-only email**: Prevents email tampering in the linking request

## API Integration
- **POST** `/auth/link-oauth`
  ```json
  {
    "email": "john@gmail.com",
    "password": "user's existing password",
    "provider": "google"
  }
  ```
- **Success response**: 200 OK
- **Error response**: 401 Unauthorized (invalid password)

## PRD Reference
Edge Case #2: "OAuth email collision" — When a user signs in via OAuth and an email/password account already exists with that email, show a toast: "We found an existing account. Log in with your password to link your Google account." After password verification, merge the OAuth identity into the existing account.

## Design Specs
- X close button in top-right corner of card
- Provider icon: neutral gray circle with provider letter
- Read-only email shown in darker bg (`bg-zinc-800`) with Mail icon
- Cancel link below the button
