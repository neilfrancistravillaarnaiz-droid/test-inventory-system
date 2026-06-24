# Complete WebAuthn Fingerprint Authentication Setup Guide

This guide provides step-by-step instructions to make your fingerprint registration feature fully functional.

## Prerequisites Checklist

Before starting, ensure you have:
- ✅ Modern browser with WebAuthn support (Chrome, Edge, Safari, Firefox)
- ✅ Biometric sensor available (fingerprint, face, or Touch ID)
- ✅ Supabase account and project
- ✅ Backend server running
- ✅ Frontend development server running

---

## Step 1: Database Setup (Critical)

### 1.1 Create WebAuthn Tables in Supabase

**Important:** If fingerprint registration is not working, the database tables are likely missing.

1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy **ALL** content from `webauthn-migration.sql`
6. Paste it into the SQL editor
7. Click **Run** button

**Verify Tables Created:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name = 'webauthn_credentials' OR table_name = 'webauthn_challenges');
```

You should see:
- `webauthn_credentials`
- `webauthn_challenges`

**Check RLS Policies:**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'webauthn_credentials';
```

You should see 4 policies: view, insert, update, delete.

---

## Step 2: Environment Variables Setup (Critical)

### 2.1 Update Frontend Environment (.env)

Edit `.env` file and ensure these variables are set:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# IMPORTANT: This must point to your backend server
VITE_API_URL=http://localhost:8000

# Backend URL for API calls
VITE_API_BASE_URL=http://localhost:8000
```

**Note:** The key variable is `VITE_API_URL` - it must match your backend port.

### 2.2 Update Backend Environment (backend/.env)

Create or update `backend/.env`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# WebAuthn Configuration
VITE_APP_DOMAIN=localhost
VITE_APP_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:8000

# Server Port
PORT=8000

# Node Environment
NODE_ENV=development
```

**Getting Supabase Keys:**
1. Go to Supabase Dashboard → Settings → API
2. Copy `Project URL` → `SUPABASE_URL`
3. Copy `Service Role Key` → `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ Keep this secret! Never commit to git!

---

## Step 3: Start the Backend Server

### 3.1 Install Backend Dependencies

```powershell
cd backend
npm install
```

Required packages (verify they exist):
```json
{
  "@simplewebauthn/server": "^0.12.0 or higher",
  "@supabase/supabase-js": "^2.x",
  "express": "^4.x",
  "cors": "^2.x",
  "dotenv": "^16.x"
}
```

### 3.2 Start Backend Server

```powershell
cd backend
node server.js
```

**Expected output:**
```
Backend running at http://0.0.0.0:8000
```

**Test Backend Health:**
Open browser: `http://localhost:8000/health`

Expected response:
```json
{
  "success": true,
  "message": "Backend is healthy"
}
```

**Test WebAuthn Endpoint:**
```powershell
# Test registration start endpoint
$headers = @{"Content-Type" = "application/json"}
$body = @{userId="test-user"; email="test@example.com"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:8000/api/webauthn/register/start" -Method POST -Headers $headers -Body $body
```

---

## Step 4: Frontend Setup

### 4.1 Install Frontend Dependencies

```powershell
npm install @simplewebauthn/browser
```

### 4.2 Start Frontend Dev Server

```powershell
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

## Step 5: Test the Feature

### 5.1 Test Fingerprint Registration

1. **Login** to your application
2. **Navigate** to Settings/Profile
3. **Find** "Register Fingerprint" button
4. **Click** to open registration modal
5. **Enter** a device name (e.g., "My Laptop")
6. **Click** "Scan Fingerprint" button
7. **Place** your finger on the biometric sensor
8. **Wait** for success message

### 5.2 Browser Console Debugging

If registration fails:

1. Open **DevTools** (F12)
2. Go to **Console** tab
3. Check for error messages
4. Look for these patterns:

**Success logs:**
```
✅ Fingerprint registration successful
✅ Credential stored: [credential-id]
```

**Common error patterns:**
```
❌ Cannot connect to backend. Make sure it's running on http://localhost:8000
❌ WebAuthn is not supported on this browser
❌ Fingerprint registration cancelled
❌ Invalid registration response
```

---

## Step 6: Troubleshooting Guide

### Issue: "Cannot connect to backend"

**Cause:** Backend server not running or wrong URL

**Solution:**
```powershell
# Check if backend is running
netstat -ano | findstr :8000

# If not running, start it:
cd backend
node server.js

# Verify it's responding:
Invoke-WebRequest http://localhost:8000/health
```

### Issue: "WebAuthn is not supported"

**Cause:** Browser or device doesn't support WebAuthn

**Solution:**
- Use Chrome, Edge, Safari, or Firefox (latest versions)
- Ensure device has biometric sensor
- Check: `chrome://settings/security` → "Manage your passwords" → ensure biometric unlock is enabled

### Issue: "Challenge not found" or "Registration verification failed"

**Cause:** Database tables not created or RLS policies blocking access

**Solution:**
```powershell
# In Supabase SQL Editor, run:
SELECT COUNT(*) FROM webauthn_challenges;
SELECT COUNT(*) FROM webauthn_credentials;

# Check RLS is enabled:
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('webauthn_credentials', 'webauthn_challenges');
```

**Expected output:** `true` for rowsecurity

### Issue: "CORS error" in browser console

**Cause:** Backend CORS not configured for frontend URL

**Solution:**
Edit `backend/server.js`:
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true
}));
```

### Issue: "Supabase authentication failed"

**Cause:** Wrong service role key or Supabase URL

**Solution:**
1. Verify `.env` file has correct values
2. Go to Supabase Dashboard → Settings → API
3. Copy-paste exact URLs and keys (no extra spaces)
4. Restart backend server: `node server.js`

### Issue: "Verification failed" but backend running

**Cause:** Origin or RP ID mismatch

**Solution:**
Edit `backend/routes/webauthnRoutes.js`:
```javascript
const rpID = process.env.VITE_APP_DOMAIN || "localhost";
const origin = process.env.VITE_APP_ORIGIN || "http://localhost:5173";

// For development, must match your frontend URL
// Change if needed:
// const rpID = "127.0.0.1"; 
// const origin = "http://127.0.0.1:5173";
```

Ensure these match your actual frontend URL!

---

## Step 7: Complete Testing Workflow

### Test Scenario 1: Fresh User Registration

```
1. Login → Settings → Register Fingerprint
2. Enter device name: "Laptop"
3. Scan fingerprint
4. ✅ Success message appears
5. ✅ Device listed in registered credentials
6. Refresh page → Device still listed
```

### Test Scenario 2: Authentication with Fingerprint

```
1. Logout
2. Go to login page
3. Enter email
4. See "Sign in with Fingerprint" option
5. Click fingerprint button
6. Scan fingerprint
7. ✅ Logged in successfully
8. ✅ Redirected to dashboard
```

### Test Scenario 3: Multiple Credentials

```
1. Register fingerprint as "Laptop"
2. Register same fingerprint as "Tablet"
3. ✅ Both devices listed
4. Delete "Tablet" credential
5. ✅ Only "Laptop" remains
6. Authentication still works with "Laptop"
```

---

## Step 8: Production Deployment

### 8.1 Update for Production Domain

Before deploying, update:

**backend/.env:**
```env
VITE_APP_DOMAIN=yourdomain.com
VITE_APP_ORIGIN=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com
PORT=3001
```

**Important:** Use `https://` for production!

### 8.2 Deploy Backend

```powershell
# Build backend
npm run build

# Deploy to hosting platform (Heroku, Railway, Vercel, etc.)
```

### 8.3 Update Frontend

**package.json script:**
```json
{
  "scripts": {
    "build": "vite build",
    "deploy": "npm run build && vercel deploy"
  }
}
```

---

## Step 9: Enable Test Mode (Optional)

To test without biometric sensor, add to `webauthnService.ts`:

```typescript
// Add at top of file
const TEST_MODE = import.meta.env.MODE === 'test' || 
                  import.meta.env.VITE_TEST_MODE === 'true';

// In registerFingerprint function
if (TEST_MODE) {
  console.log('[TEST MODE] Skipping biometric verification');
  // Mock successful registration
  return {
    success: true,
    message: "Fingerprint registered successfully (TEST MODE)",
    credentialId: "test-credential-id"
  };
}
```

---

## Quick Diagnostic Commands

Run these to debug issues:

```powershell
# Check if backend is running
netstat -ano | findstr :8000

# Test backend connectivity
curl http://localhost:8000/health

# Check environment variables loaded
node -e "require('dotenv').config({path:'backend/.env'}); console.log(process.env)"

# View backend logs with timestamps
node backend/server.js 2>&1 | Tee-Object -FilePath logs.txt

# Test Supabase connection
$env:SUPABASE_URL = "your_url"
$env:SUPABASE_SERVICE_ROLE_KEY = "your_key"
node -e "console.log('Testing Supabase...')"
```

---

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webauthn/register/start` | POST | Generate registration options |
| `/api/webauthn/register/complete` | POST | Verify and save credential |
| `/api/webauthn/authenticate/start` | POST | Generate authentication options |
| `/api/webauthn/authenticate/complete` | POST | Verify fingerprint and authenticate |
| `/api/webauthn/credentials` | GET | Get user's registered credentials |
| `/api/webauthn/credentials/:id` | DELETE | Delete a credential |

---

## Next Steps

1. ✅ Complete all steps above
2. ✅ Test fingerprint registration
3. ✅ Test fingerprint authentication
4. ✅ Verify multiple credentials work
5. ✅ Check browser compatibility
6. ✅ Deploy to production

## Support

If issues persist:
1. Check browser console for specific errors
2. Check backend server logs
3. Verify Supabase database tables exist
4. Verify all environment variables are correct
5. Restart both backend and frontend servers
6. Clear browser cache and cookies
7. Try different browser or device

---

**Last Updated:** 2026-06-24
**Status:** Production Ready
