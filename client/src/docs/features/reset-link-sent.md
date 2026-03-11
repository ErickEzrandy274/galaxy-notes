# Reset Link Sent

## Route
`/reset-link-sent?email={encodedEmail}`

## Figma Reference
Node ID: `18-187` — [View in Figma](https://www.figma.com/design/sy3qiDaLaCL4jDtkVRnWze/Note-Management?node-id=18-187)

## Overview
Confirmation page shown after a password reset email has been sent. Displays the target email, provides an "Open Email App" button, and includes a resend mechanism with a countdown timer.

## Component Composition
```
PasswordResetLayout
└── ResetLinkSentPage
    └── Suspense
        └── ResetLinkSentContent
            ├── AuthCard
            │   ├── AuthIcon (variant="green", icon=Mail)
            │   ├── AuthHeader (title, subtitle with bold email)
            │   ├── Expiry notice text
            │   ├── CountdownTimer (60s, onResend callback)
            │   └── BackToLogin
```

## Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| `email` | string | The email address the reset link was sent to (URL-encoded) |

## Countdown Timer Behavior
- Starts at **60 seconds** on page load
- Displays "Resend in M:SS" in muted text while active
- When timer reaches 0, displays a clickable "Resend" link in purple/accent color
- Clicking "Resend" re-calls `supabase.auth.resetPasswordForEmail(email)` and resets the timer to 60s
- Success toast: "Reset link sent again!"
- Error toast: Shows Supabase error message or generic fallback

## Rate Limiting
- **Supabase side**: Built-in rate limiting on `resetPasswordForEmail`
- **Client side**: 60-second cooldown between resend attempts via CountdownTimer
- **Resend API**: Free tier allows 3,000 emails/month, 100/day

## Design Specs
- Icon: Green/emerald circle with Mail icon
- Email displayed in bold white text within muted subtitle
- Secondary text: "Click the link in the email to reset your password. The link will expire in 15 minutes."
