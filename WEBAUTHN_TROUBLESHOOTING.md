# WebAuthn Fingerprint Registration Issues - Quick Fix Guide

Use this guide if fingerprint registration is not working.

## ❌ Problem: "Cannot connect to backend" Error

### Cause
Backend server is not running or frontend can't reach it.

### Quick Fix

**Step 1: Check if backend is running**
```powershell
# Open new PowerShell window and run:
netstat -ano | findstr :8000

# If nothing shows, backend is NOT running
```

**Step 2: Start backend server**
```powershell
cd c:\Users\Xps User\inventory\backend
node server.js
```

**Step 3: Verify it's running**
```powershell
# Should show:
# Backend running at http://0.0.0.0:8000
```

**Step 4: Test the connection**
```powershell
# In another PowerShell:
curl http://localhost:8000/health

# Should return:
# {"success":true,"message":"Backend is healthy"}
```

**Step 5: Refresh frontend**
- Go back to browser
- Refresh page (F5)
- Try registering fingerprint again

---

## ❌ Problem: "WebAuthn is not supported" Error

### Cause
Browser doesn't support WebAuthn or biometric sensor not available.

### Quick Fix

**Check browser support:**
```javascript
// Open browser console (F12) and paste:
console.log("WebAuthn Support:", !!window.PublicKeyCredential);
PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  .then(available => {
    console.log("Biometric Available:", available);
  });
```

**Solution:**
- Use Chrome, Edge, Safari, or Firefox (latest version)
- Ensure your device has a biometric sensor
- Enable biometric authentication in browser settings:
  - **Chrome:** Settings → Security → Password manager → Enable biometric unlock
  - **Edge:** Settings → Privacy → Enable biometric unlock
  - **Safari:** System Preferences → Security & Privacy → Enable Touch ID/Face ID

---

## ❌ Problem: Fingerprint Scan Not Appearing

### Cause
WebAuthn prompt didn't trigger or was blocked.

### Quick Fix

**Check browser permissions:**
1. Open DevTools (F12)
2. Go to **Console** tab
3. Paste this:
```javascript
if (!window.PublicKeyCredential) {
  console.error("❌ WebAuthn not supported");
} else {
  console.log("✅ WebAuthn supported");
  navigator.credentials.get({publicKey: {}})
    .catch(e => console.log("Response:", e.message));
}
```

**Clear browser blockers:**
1. Check if popup blocker is active
2. Disable any browser extensions that block popups
3. Allow notifications/biometric prompts

**Try in incognito mode:**
- Open incognito/private window
- Disable all extensions
- Try registering again

---

## ❌ Problem: "Challenge not found" or "Registration verification failed"

### Cause
Database tables not created or Supabase connection issue.

### Quick Fix

**Step 1: Check database tables exist**

Go to Supabase Dashboard:
1. Click **SQL Editor**
2. Click **New Query**
3. Paste:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('webauthn_credentials', 'webauthn_challenges');
```
4. Click **Run**

**Expected result:** Should show both tables

**If tables missing:**
1. Go to `webauthn-migration.sql` file
2. Copy ALL content
3. Paste into new Supabase SQL query
4. Click **Run**

**Step 2: Check RLS policies**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'webauthn_credentials';
```

**Expected:** 4 policies (view, insert, update, delete)

**Step 3: Restart backend**
```powershell
# Kill the backend process
# Or press Ctrl+C in the terminal where it's running

# Restart it:
cd backend
node server.js
```

**Step 4: Try registering again**

---

## ❌ Problem: "CORS error" in Browser Console

### Cause
Backend CORS settings don't allow frontend URL.

### Quick Fix

**Edit backend CORS:**

File: `backend/server.js`

Find this line (around line 11):
```javascript
app.use(cors());
```

Replace with:
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

**Restart backend:**
```powershell
# Stop backend (Ctrl+C)
# Restart:
node server.js
```

**Refresh frontend and try again**

---

## ❌ Problem: Backend Won't Start - "Cannot find module"

### Cause
Missing npm packages in backend.

### Quick Fix

```powershell
# Navigate to backend
cd backend

# Clear old node_modules
Remove-Item -Recurse -Force node_modules

# Reinstall everything
npm install

# Start server
node server.js
```

---

## ❌ Problem: Backend Crashes Immediately

### Cause
Environment variables not loaded or incorrect.

### Quick Fix

**Check backend/.env exists:**
```powershell
ls backend\.env

# If not found, create it with:
Copy-Item backend\.env.example backend\.env  # If example exists
# Or manually create with required variables
```

**Verify required variables:**
```powershell
# Open backend/.env and ensure it has:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here
VITE_APP_DOMAIN=localhost
VITE_APP_ORIGIN=http://localhost:5173
PORT=8000
```

**Restart with error output:**
```powershell
cd backend
node server.js 2>&1 | Tee-Object -FilePath error-log.txt

# Check error-log.txt for specific errors
cat error-log.txt
```

---

## ❌ Problem: Registration Succeeds but Device Not Listed

### Cause
Credential saved but not retrieving it properly.

### Quick Fix

**Check Supabase directly:**
1. Go to Supabase Dashboard
2. Click **Table Editor**
3. Select **webauthn_credentials**
4. Verify there's a row for your user

**Check database for errors:**
```sql
SELECT * FROM webauthn_credentials ORDER BY created_at DESC LIMIT 1;
```

**If empty:**
1. Check user_id is correct
2. Verify auth.uid() matches in RLS policies
3. Try registering again with console open to see exact error

**If data exists but not showing in UI:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear cookies and cache
3. Logout and login again
4. Restart frontend: `npm run dev`

---

## ❌ Problem: "Invalid registration response"

### Cause
Mismatch between browser WebAuthn response and backend expectations.

### Quick Fix

**Check origin mismatch:**

File: `backend/routes/webauthnRoutes.js`, line ~13:
```javascript
const origin = process.env.VITE_APP_ORIGIN || "http://localhost:5173";
```

**Make sure it matches** your actual frontend URL:
- If using `http://localhost:5173` ✅
- If using `http://127.0.0.1:5173` ❌ (needs update)

**Update if needed:**
```javascript
// Change from:
const origin = process.env.VITE_APP_ORIGIN || "http://localhost:5173";

// To match your URL. Then restart backend.
```

**Also check RP ID:**
```javascript
const rpID = process.env.VITE_APP_DOMAIN || "localhost";
```

Should be just domain without protocol (localhost, not http://localhost).

---

## ✅ Complete Verification Workflow

When registration isn't working, run through this:

```powershell
# 1. Is backend running?
netstat -ano | findstr :8000
# Should show a process

# 2. Can frontend reach backend?
curl http://localhost:8000/health
# Should return {"success":true,"message":"Backend is healthy"}

# 3. Do database tables exist?
# Check in Supabase SQL Editor - run query from Step 1 above

# 4. Are environment variables correct?
cat .env | findstr VITE_API_URL
# Should show: VITE_API_URL=http://localhost:8000

# 5. Browser supports WebAuthn?
# Open browser console and check for WebAuthn support

# 6. Try registration with console open
# Look for specific error message
# Share error message for debugging
```

---

## 🔍 Browser Console Debugging

**Before attempting registration:**
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Paste this:

```javascript
console.log("=== WebAuthn Debugging ===");
console.log("WebAuthn Support:", !!window.PublicKeyCredential);
console.log("Frontend URL:", window.location.origin);
console.log("API URL:", import.meta.env.VITE_API_URL);

// Try biometric check
if (window.PublicKeyCredential) {
  PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    .then(available => {
      console.log("Biometric Available:", available ? "✅ YES" : "❌ NO");
    });
}

// Try backend connection
fetch("http://localhost:8000/health")
  .then(r => r.json())
  .then(d => console.log("Backend Health:", d))
  .catch(e => console.log("❌ Backend Connection Failed:", e.message));
```

**After this, you should see:**
```
=== WebAuthn Debugging ===
WebAuthn Support: true
Frontend URL: http://localhost:5173
API URL: http://localhost:8000
Biometric Available: ✅ YES
Backend Health: {success: true, message: "Backend is healthy"}
```

**If any show ❌ or errors:**
- Fix that specific issue
- Then try registration again

---

## 📝 Error Collection

Keep track of errors you see:

**Error Message:**
```
[Paste exact error message]
```

**Where it appeared:**
- [ ] Browser Console
- [ ] Network tab
- [ ] Backend logs
- [ ] Supabase Dashboard

**Screenshot/Details:**
```
[Describe what happened]
```

**Already tried:**
- [ ]
- [ ]
- [ ]

---

## 🚀 When It Works

You'll see:

✅ Fingerprint scan prompt appears  
✅ Successfully scanned fingerprint  
✅ "Fingerprint Registered!" message appears  
✅ Device listed in credentials section  
✅ Can login with fingerprint  
✅ No errors in console  

🎉 Congratulations! WebAuthn is working!

---

**Last Updated:** 2026-06-24
**Status:** Troubleshooting Guide v1.0
