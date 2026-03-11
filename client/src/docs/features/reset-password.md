# Reset Password

## Route
`/reset-password`

## Figma Reference
Node ID: `2-1157` — [View in Figma](https://www.figma.com/design/sy3qiDaLaCL4jDtkVRnWze/Note-Management?node-id=2-1157)

## Overview
Page where users set a new password after clicking the reset link from their email. Handles Supabase token exchange and password update.

## Component Composition
```
PasswordResetLayout
└── ResetPasswordPage
    ├── AuthCard (loading state)
    │   └── Spinner
    ├── AuthCard (ready state)
    │   ├── AuthHeader (title, subtitle with requirements)
    │   ├── Form
    │   │   ├── PasswordInput (New Password) + PasswordStrengthBar
    │   │   ├── PasswordInput (Confirm New Password)
    │   │   └── AuthSubmitButton ("Reset Password")
    │   └── Expiry notice (Clock icon + text)
```

## Token Handling
1. Supabase sends a magic link with `access_token` and `refresh_token` in the URL hash fragment
2. On page load, `useEffect` extracts tokens from `window.location.hash`
3. Calls `supabase.auth.setSession({ access_token, refresh_token })` to establish a session
4. If session is valid, shows the password form
5. If invalid/expired, shows error toast and redirects to `/forgot-password`

## Password Strength Bar
Visual indicator computed from the password string:

| Level | Criteria | Color | Width |
|-------|----------|-------|-------|
| Weak | Score 0-2 | Red | 25% |
| Fair | Score 3 | Yellow | 50% |
| Good | Score 4 | Blue | 75% |
| Strong | Score 5-6 | Green | 100% |

**Scoring** (1 point each):
- Length >= 8 characters
- Length >= 12 characters
- Contains uppercase letter
- Contains lowercase letter
- Contains number
- Contains special character

## Validation Rules
Uses `resetPasswordSchema` from `@/schemas/auth`:
- **Min length**: 12 characters
- **Uppercase**: At least one uppercase letter
- **Lowercase**: At least one lowercase letter
- **Number**: At least one digit
- **Special character**: At least one non-alphanumeric character
- **Confirmation**: Must match password field

## User Flow

### Happy Path
1. User clicks reset link in email
2. Redirected to `/reset-password#access_token=...&refresh_token=...`
3. Token exchange happens automatically
4. User enters new password (strength bar updates in real-time)
5. User confirms password
6. Clicks "Reset Password"
7. `supabase.auth.updateUser({ password })` is called
8. On success: signs out, redirects to `/login` with success toast

### Error States
- **Invalid/expired token**: Toast "Invalid or expired reset link." → redirect to `/forgot-password`
- **Weak password**: Inline Zod validation errors
- **Password mismatch**: "Passwords do not match"
- **API error**: Toast with error message

## API Integration
- **Token exchange**: `supabase.auth.setSession({ access_token, refresh_token })`
- **Password update**: `supabase.auth.updateUser({ password })`
- **Sign out**: `supabase.auth.signOut()` (after successful reset)

## Design Specs
- No icon at top (unlike other pages)
- Subtitle shows password requirements
- Password strength bar with colored progress indicator
- Footer: Clock icon + "This link expires in 15 minutes"
