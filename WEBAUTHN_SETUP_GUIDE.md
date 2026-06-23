# WebAuthn Fingerprint Sign-In Implementation Guide

This guide walks you through the complete setup and integration of WebAuthn fingerprint biometric authentication in your StockFlow inventory system.

## Table of Contents
1. [Overview](#overview)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Backend Configuration](#backend-configuration)
5. [Environment Variables](#environment-variables)
6. [Frontend Integration](#frontend-integration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

WebAuthn allows users to sign in using their device's biometric sensors (fingerprint, face, etc.). This implementation uses:
- **Frontend**: `@simplewebauthn/browser` for browser-side WebAuthn operations
- **Backend**: `@simplewebauthn/server` for server-side verification
- **Database**: Supabase PostgreSQL for storing credentials and challenges

### Features
✅ Register multiple fingerprint credentials per user  
✅ Secure biometric authentication  
✅ Device naming for easy management  
✅ Credential management (view, delete)  
✅ Fallback to password authentication  
✅ Cross-browser compatibility  

---

## Installation

### 1. Install Frontend Dependencies
```bash
cd c:\Users\Xps User\inventory
npm install @simplewebauthn/browser
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install @simplewebauthn/server
```

---

## Database Setup

### 1. Apply SQL Migration

Copy and execute the SQL from `webauthn-migration.sql` in your Supabase SQL Editor:

1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to SQL Editor
4. Click "New Query"
5. Copy the entire content of `webauthn-migration.sql`
6. Paste and execute

This creates:
- `webauthn_credentials` table - stores user fingerprint credentials
- `webauthn_challenges` table - stores temporary authentication challenges
- RLS policies - ensures users can only access their own credentials
- Indexes - optimizes query performance

### 2. Verify Tables Were Created
```sql
SELECT * FROM webauthn_credentials;
SELECT * FROM webauthn_challenges;
```

---

## Backend Configuration

### 1. Environment Variables

Update your `.env` file with:
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# WebAuthn
VITE_APP_DOMAIN=localhost
VITE_APP_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:3001
```

### 2. Backend Routes

The WebAuthn routes are already set up in:
- `backend/routes/webauthnRoutes.js` - All registration and authentication endpoints
- `backend/supabaseClient.js` - Supabase client initialization

Routes available:
- `POST /api/webauthn/register/start` - Initiate fingerprint registration
- `POST /api/webauthn/register/complete` - Complete fingerprint registration
- `POST /api/webauthn/authenticate/start` - Initiate fingerprint authentication
- `POST /api/webauthn/authenticate/complete` - Complete fingerprint authentication

### 3. Start Backend Server

```bash
cd backend
npm start
```

The backend should be running on `http://localhost:3001` (or your configured port).

---

## Environment Variables

### Frontend (.env.local or .env)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3001
VITE_APP_DOMAIN=localhost
VITE_APP_ORIGIN=http://localhost:5173
```

### Backend (.env)
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_APP_DOMAIN=localhost
VITE_APP_ORIGIN=http://localhost:5173
```

---

## Frontend Integration

### 1. WebAuthn Service

Located in: `src/services/webauthnService.ts`

Provides functions:
- `registerFingerprint()` - Register a new fingerprint
- `authenticateWithFingerprint()` - Sign in with fingerprint
- `getUserCredentials()` - Get all registered fingerprints
- `deleteCredential()` - Remove a fingerprint
- `isWebauthnSupported()` - Check browser support
- `canUseFingerprint()` - Check fingerprint support

### 2. Components

#### FingerprintRegistrationModal
Shows a modal for registering a new fingerprint. Use in settings/account pages:

```tsx
import FingerprintRegistrationModal from "../components/auth/FingerprintRegistrationModal";

const [showRegisterModal, setShowRegisterModal] = useState(false);

<FingerprintRegistrationModal
  isOpen={showRegisterModal}
  onClose={() => setShowRegisterModal(false)}
  userId={currentUser.id}
  email={currentUser.email}
  onSuccess={() => {
    // Refresh credentials or show success message
  }}
/>
```

#### FingerprintLogin
Adds a fingerprint sign-in button to the login page:

```tsx
import FingerprintLogin from "../components/auth/FingerprintLogin";

<FingerprintLogin
  email={email}
  onSuccess={(user) => {
    // Handle successful authentication
    navigate("/dashboard");
  }}
  onError={(error) => {
    // Handle authentication error
    console.error(error);
  }}
/>
```

#### CredentialsManager
Manage all registered fingerprints:

```tsx
import CredentialsManager from "../components/auth/CredentialsManager";

<CredentialsManager
  userId={currentUser.id}
  onAddNew={() => setShowRegisterModal(true)}
/>
```

### 3. Update Login Page

Update `src/pages/auth/Login.tsx` to include fingerprint option:

```tsx
import { useState } from "react";
import FingerprintLogin from "../../components/auth/FingerprintLogin";
import { Fingerprint } from "lucide-react";

const Login = () => {
  const [showFingerprintLogin, setShowFingerprintLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");

  return (
    <div>
      {/* Existing email/password form */}
      
      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* Fingerprint Login */}
      {showFingerprintLogin ? (
        <FingerprintLogin
          email={loginEmail}
          onSuccess={(user) => {
            // Handle successful fingerprint auth
            navigate("/dashboard");
          }}
          onError={(error) => {
            alert(error);
          }}
        />
      ) : (
        <button
          onClick={() => setShowFingerprintLogin(true)}
          className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Fingerprint className="w-4 h-4" />
          Sign in with Fingerprint
        </button>
      )}
    </div>
  );
};
```

### 4. Add to Account Settings

Create a page in `src/pages/profile/FingerprintSettings.tsx`:

```tsx
import { useState, useEffect } from "react";
import CredentialsManager from "../../components/auth/CredentialsManager";
import FingerprintRegistrationModal from "../../components/auth/FingerprintRegistrationModal";
import { useAuth } from "../../hooks/useAuth";

const FingerprintSettings = () => {
  const { user } = useAuth();
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Fingerprint Settings</h1>
      
      <CredentialsManager
        userId={user.id}
        onAddNew={() => setShowRegisterModal(true)}
      />

      <FingerprintRegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        userId={user.id}
        email={user.email || ""}
        onSuccess={() => {
          // Refresh credentials
          setShowRegisterModal(false);
        }}
      />
    </div>
  );
};

export default FingerprintSettings;
```

---

## Testing

### 1. Local Testing

#### Requirements
- Modern browser with WebAuthn support (Chrome, Firefox, Safari, Edge)
- Device with biometric capability (fingerprint, face recognition)
- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:5173`

#### Test Steps

1. **Register Fingerprint**
   - Go to Settings → Fingerprint Settings
   - Click "Register Fingerprint"
   - Enter device name (e.g., "My Laptop")
   - Scan your fingerprint when prompted

2. **Sign In with Fingerprint**
   - Go to Login page
   - Enter email
   - Click "Sign in with Fingerprint"
   - Scan your fingerprint

3. **Manage Credentials**
   - View registered fingerprints
   - Delete credentials
   - Register multiple fingerprints

### 2. Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome/Edge | ✅ | Full support on Windows Hello |
| Firefox | ✅ | Requires Windows Hello on Windows |
| Safari | ✅ | macOS/iOS Touch ID or Face ID |
| Mobile | ✅ | Native biometric support |

### 3. Testing on Different Devices

- **Windows**: Uses Windows Hello (fingerprint, face, PIN)
- **macOS**: Uses Touch ID (fingerprint)
- **iOS**: Uses Face ID or Touch ID
- **Android**: Uses device-specific biometric API

---

## Troubleshooting

### Issue: "WebAuthn is not supported on this browser"

**Solution:**
- Use a modern browser (Chrome 67+, Firefox 60+, Safari 13+, Edge 18+)
- On mobile, ensure you have biometric capability
- Check browser console for detailed errors

### Issue: "No credentials registered for this user"

**Solution:**
- The user hasn't registered any fingerprints yet
- Go to Settings → Fingerprint Settings and register one
- Ensure backend is running and connected to Supabase

### Issue: Challenge not found during authentication

**Solution:**
- The challenge expired (they're valid for 10 minutes)
- Try again by starting a new authentication flow
- Check that `webauthn_challenges` table has proper timestamps

### Issue: Backend returns "Failed to save credential"

**Solution:**
- Check Supabase credentials in `.env`
- Verify `webauthn_credentials` table was created
- Check RLS policies are correct
- Look at backend logs for detailed error

### Issue: Registration works but authentication fails

**Solution:**
- Verify `credential_public_key` was saved correctly
- Check that `sign_count` is initialized to 0
- Ensure origin and rpID match between registration and authentication

### Issue: Cross-origin errors

**Solution:**
- Update `VITE_APP_ORIGIN` to match your frontend URL
- Update `backend/routes/webauthnRoutes.js` line with correct origin
- HTTPS required for production (WebAuthn requires secure context)

### Enable Debug Logging

Add to `webauthnService.ts`:

```typescript
const DEBUG = true;

const log = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[WebAuthn] ${message}`, data);
  }
};
```

---

## Security Best Practices

1. **Always use HTTPS in production** - WebAuthn requires secure context
2. **Validate origin and rpID** - Must match exactly
3. **Store public keys securely** - Never store private keys
4. **Clean up expired challenges** - Add scheduled cleanup job
5. **Rate limit authentication** - Prevent brute force attacks
6. **Monitor sign_count** - Detect potential credential cloning
7. **Enable RLS policies** - Users can only access own credentials
8. **Use service role key for backend only** - Never expose in frontend

---

## Production Deployment

### 1. Update Environment Variables
```env
VITE_APP_DOMAIN=yourdomain.com
VITE_APP_ORIGIN=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com
```

### 2. Enable HTTPS
- WebAuthn requires secure context (HTTPS)
- Use SSL/TLS certificate
- Update rpID and origin accordingly

### 3. Backend Deployment
- Deploy to production server (Heroku, Vercel, Railway, etc.)
- Update environment variables
- Ensure Supabase connectivity

### 4. Database Backups
- Regularly backup Supabase database
- Credentials are sensitive - secure backups

---

## Additional Resources

- [MDN WebAuthn API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [SimpleWebAuthn Documentation](https://simplewebauthn.dev/)
- [FIDO2/WebAuthn Specs](https://fidoalliance.org/)
- [Supabase Documentation](https://supabase.com/docs)

---

## Support

For issues or questions:
1. Check browser console for error messages
2. Check backend server logs
3. Verify all environment variables are set correctly
4. Ensure Supabase tables were created properly
5. Test in different browser for compatibility
