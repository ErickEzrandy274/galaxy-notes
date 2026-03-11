# Forgot Password

## Route
`/forgot-password`

## Figma Reference
Node ID: `2-1145` — [View in Figma](https://www.figma.com/design/sy3qiDaLaCL4jDtkVRnWze/Note-Management?node-id=2-1145)

## Overview
Allows unauthenticated users to request a password reset email by entering their registered email address.

## Component Composition
```
PasswordResetLayout
└── ForgotPasswordPage
    ├── AuthCard
    │   ├── AuthIcon (variant="purple", icon=KeyRound)
    │   ├── AuthHeader (title, subtitle)
    │   ├── Form
    │   │   ├── FormInput (email)
    │   │   └── AuthSubmitButton ("Send Reset Link")
    │   └── BackToLogin
```

## User Flow

### Happy Path
1. User clicks "Forgot password?" on the Login page
2. Navigates to `/forgot-password`
3. Enters email address
4. Clicks "Send Reset Link"
5. `supabase.auth.resetPasswordForEmail(email)` is called with `redirectTo` pointing to `/reset-password`
6. On success, redirects to `/reset-link-sent?email={encodedEmail}`

### Error States
- **Invalid email format**: Inline validation error from Zod schema ("Invalid email address")
- **Empty email**: Required field validation
- **API error**: Toast notification with error message (e.g., rate limit exceeded)
- **Network error**: Toast "Something went wrong. Please try again."

## API Integration
- **Supabase Auth**: `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
- Supabase generates a secure token internally, triggers Send Email Hook
- The hook calls a Supabase Edge Function to send branded email via Resend API

## Validation Schema
Uses `forgotPasswordSchema` from `@/schemas/auth`:
```typescript
{ email: z.string().email('Invalid email address') }
```

## Design Specs
- Dark background: `#090908`
- Card: dark with rounded corners, border
- Icon: Purple circle with KeyRound icon
- Button: Full-width purple (`bg-purple-600`)
- Typography: Inter font
