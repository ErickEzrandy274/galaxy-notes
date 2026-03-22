# Reset Password

## Route
`/reset-password?token={token}`

## Figma Reference
Node ID: `2-1157` — [View in Figma](https://www.figma.com/design/sy3qiDaLaCL4jDtkVRnWze/Note-Management?node-id=2-1157)

## Overview
Page where users set a new password after clicking the reset link from their email. Handles token validation and password update via the NestJS backend.

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
1. User clicks the reset link in their email: `/reset-password?token={token}`
2. On page load, `useSearchParams()` extracts the `token` from the query string
3. If no token is present, shows error toast and redirects to `/forgot-password`
4. Token is sent with the password reset request to the backend for validation

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
2. Navigates to `/reset-password?token={token}`
3. User enters new password (strength bar updates in real-time)
4. User confirms password
5. Clicks "Reset Password"
6. `POST /api/auth/reset-password` is called with `{ token, password }`
7. Backend validates token (checks existence, expiry, usage), hashes new password, updates user
8. On success: redirects to `/login` with success toast

### Error States
- **Missing token**: Toast "Invalid or expired reset link." → redirect to `/forgot-password`
- **Invalid/expired token**: Backend returns error → toast message
- **Weak password**: Inline Zod validation errors
- **Password mismatch**: "Passwords do not match"
- **API error**: Toast with error message

## API Integration
- **Endpoint**: `POST /api/auth/reset-password` (NestJS backend)
- **Body**: `{ token, password }`
- Backend validates the token against `PasswordResetToken` table, checks 15-min expiry, hashes and updates the user's password

## Design Specs
- No icon at top (unlike other pages)
- Subtitle shows password requirements
- Password strength bar with colored progress indicator
- Footer: Clock icon + "This link expires in 15 minutes"
