# Feature: Auth (Login & Register)

## Overview

The auth feature provides login, registration, and OAuth sign-in for Galaxy Notes. All feature code lives under `client/src/features/auth/` with thin page routes in the Next.js App Router.

**Figma References:**
- Login: node `2:3`
- Register: node `2:851`

## Directory Structure

```
client/src/features/auth/
├── index.ts                        # Barrel export
├── types/
│   └── index.ts                    # AuthBrandingConfig, RegisterResponse
├── utils/
│   └── generate-password.ts        # Crypto-secure password generator
├── api/
│   └── auth-api.ts                 # registerUser() via axios
├── hooks/
│   ├── use-login.ts                # signIn('credentials') + toast + redirect
│   └── use-register.ts             # Register → auto-login → redirect
└── components/
    ├── password-input.tsx           # Input with show/hide eye toggle
    ├── oauth-buttons.tsx            # Google/GitHub/Facebook sign-in buttons
    ├── auth-branding.tsx            # Configurable left panel (purple gradient)
    ├── login-form.tsx               # React Hook Form + Zod login form
    └── register-form.tsx            # React Hook Form + Zod register form
```

**Page Routes:**
- `client/src/app/(auth)/login/page.tsx` — Imports `LoginForm` + `AuthBranding`
- `client/src/app/(auth)/register/page.tsx` — Imports `RegisterForm` + `AuthBranding`

## Authentication Flows

### Credentials Login

1. User fills `LoginForm` (email + password)
2. Form validated by `loginSchema` (Zod)
3. `useLogin` hook calls `signIn('credentials', { email, password, redirect: false })` from NextAuth
4. NextAuth `authorize` callback in `lib/auth.ts` sends `POST /api/auth/login` to NestJS backend
5. Backend validates credentials (bcrypt compare), returns `{ accessToken, id, email, name }`
6. On success: toast "Welcome back!" → redirect to `/notes`
7. On error: toast "Invalid email or password"

### Registration (Two-Step)

1. User fills `RegisterForm` (firstName, lastName, email, password, confirmPassword)
2. Form validated by `registerSchema` (Zod)
3. `useRegister` hook executes two steps:
   - **Step 1**: `POST /api/auth/register` via axios (backend creates user with bcrypt-hashed password)
   - **Step 2**: Auto-login via `signIn('credentials', { email, password })`
4. On success: toast "Account created successfully!" → redirect to `/notes`
5. On 409 conflict: toast "This email is already registered"
6. If registration succeeds but auto-login fails: toast "Account created!" → redirect to `/login`

### OAuth

1. User clicks Google, GitHub, or Facebook button in `OAuthButtons`
2. Calls `signIn('google' | 'github' | 'facebook', { callbackUrl: '/notes' })`
3. NextAuth handles redirect to provider → callback → session creation via PrismaAdapter
4. User is redirected to `/notes` on success

## Components

| Component | Description |
|-----------|-------------|
| `LoginForm` | Email + password form with "Forgot password?" link, "Sign In" button, OAuth buttons, "Sign Up" link |
| `RegisterForm` | First/Last name, email, password + "Generate password" button, confirm password, "Create Account" button, OAuth buttons, "Sign In" link |
| `AuthBranding` | Server component. Purple gradient left panel with logo, note icon, configurable headline/subtitle/feature bullets. Hidden below `lg` breakpoint |
| `OAuthButtons` | Three outlined buttons (Google/GitHub/Facebook) calling NextAuth `signIn()`. Inline SVGs for Google/Facebook, Lucide `Github` icon |
| `PasswordInput` | `forwardRef` input with Eye/EyeOff toggle (Lucide). Accepts `error` prop for validation messages |

## Validation Rules

Defined in `client/src/schemas/auth.ts` using Zod:

**Login (`loginSchema`)**:
- `email`: valid email format
- `password`: min 1 character

**Register (`registerSchema`)**:
- `firstName`: min 1 character
- `lastName`: min 1 character
- `email`: valid email format
- `password`: min 12 characters, must contain uppercase, lowercase, number, and special character
- `confirmPassword`: must match password

## Password Generation

The "Generate password" button on the register form:
- Uses `crypto.getRandomValues()` for cryptographic randomness
- Generates 16-character password
- Guarantees at least one uppercase, lowercase, digit, and special character
- Shuffles with Fisher-Yates algorithm
- Auto-fills both password and confirmPassword fields via `setValue()`
- Copies generated password to clipboard
- Shows toast notification confirming generation

## API Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| POST | `/api/auth/register` | Create new user account | `{ accessToken }` or 409 |
| POST | `/api/auth/login` | Validate credentials | `{ accessToken, id, email, name }` or 401 |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth route handler (OAuth callbacks, session) | Managed by NextAuth |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXTAUTH_SECRET` | NextAuth session encryption key |
| `NEXTAUTH_URL` | NextAuth base URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth credentials |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | Facebook OAuth credentials |
| `NEXT_PUBLIC_API_URL` | NestJS backend URL (default: `http://localhost:8080`) |

## Layout & Design

- **Split-screen layout**: Left branding panel (50%) + right form panel (50%)
- **Left panel**: Purple gradient (`from-purple-700 via-purple-600 to-indigo-700`), Galaxy Notes logo, note illustration, headline, subtitle, feature bullet list with checkmark icons
- **Right panel**: Dark background (`#090908`), centered form card
- **Responsive**: Left panel hidden below `lg` (1024px), form takes full width
- **Branding varies by page**: Login shows "Capture your ideas, anywhere, anytime." / Register shows "Start your journey with Galaxy Notes."

## Dependencies

- `next-auth` (v5 beta) — Session management, OAuth, credentials auth
- `react-hook-form` + `@hookform/resolvers` — Form state and validation
- `zod` — Schema validation
- `axios` — HTTP client for backend API calls
- `react-hot-toast` — Toast notifications
- `lucide-react` — Icons (Eye, EyeOff, Check, FileText, Github)
