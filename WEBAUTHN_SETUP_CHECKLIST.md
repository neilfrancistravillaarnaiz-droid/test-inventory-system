# WebAuthn Fingerprint Setup Checklist

Use this checklist to verify each step is completed correctly.

## Database Setup ✅

- [ ] Opened Supabase SQL Editor
- [ ] Copied all content from `webauthn-migration.sql`
- [ ] Executed SQL query successfully
- [ ] Verified `webauthn_credentials` table exists
- [ ] Verified `webauthn_challenges` table exists
- [ ] Verified 4 RLS policies exist on `webauthn_credentials`

**Verify command:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name = 'webauthn_credentials' OR table_name = 'webauthn_challenges');
```

---

## Environment Variables ✅

- [ ] Updated `.env` with `VITE_API_URL=http://localhost:8000`
- [ ] Updated `backend/.env` with `SUPABASE_URL`
- [ ] Updated `backend/.env` with `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Updated `backend/.env` with `VITE_APP_ORIGIN=http://localhost:5173`
- [ ] Updated `backend/.env` with `VITE_APP_DOMAIN=localhost`
- [ ] Saved all files (no unsaved changes)

**Verify files:**
```powershell
# Frontend
cat .env | findstr VITE_API_URL

# Backend
cat backend/.env | findstr SUPABASE_URL
cat backend/.env | findstr SUPABASE_SERVICE_ROLE_KEY
cat backend/.env | findstr PORT
```

---

## Backend Dependencies ✅

- [ ] Navigated to `backend/` folder
- [ ] Ran `npm install`
- [ ] Installation completed without errors
- [ ] `node_modules` folder created

**Verify:**
```powershell
cd backend
npm list @simplewebauthn/server
npm list @supabase/supabase-js
npm list express
```

---

## Backend Server ✅

- [ ] Started backend with `node server.js`
- [ ] Server logs show "Backend running at http://0.0.0.0:8000"
- [ ] No error messages in console
- [ ] Server stays running

**Test health endpoint:**
```powershell
curl http://localhost:8000/health
# Should return: {"success":true,"message":"Backend is healthy"}
```

**Test registration endpoint:**
```powershell
$body = @{userId="test";email="test@example.com"} | ConvertTo-Json
curl -X POST http://localhost:8000/api/webauthn/register/start `
  -H "Content-Type: application/json" `
  -d $body
# Should return options object, not an error
```

---

## Frontend Dependencies ✅

- [ ] In root folder (not backend), ran `npm install @simplewebauthn/browser`
- [ ] Installation completed without errors
- [ ] Frontend dependencies installed

**Verify:**
```powershell
npm list @simplewebauthn/browser
```

---

## Frontend Dev Server ✅

- [ ] Started frontend with `npm run dev`
- [ ] Server logs show "Local: http://localhost:5173/"
- [ ] No error messages
- [ ] Server stays running
- [ ] Browser opened to http://localhost:5173

---

## Browser Verification ✅

- [ ] Using Chrome, Edge, Safari, or Firefox (latest)
- [ ] Device has biometric sensor (fingerprint/face/Touch ID)
- [ ] Browser has WebAuthn support

**Check WebAuthn support:**
```javascript
// Open browser console (F12) and run:
console.log(window.PublicKeyCredential ? "✅ WebAuthn Supported" : "❌ Not Supported");

// Check biometric availability
if (window.PublicKeyCredential) {
  PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    .then(available => {
      console.log(available ? "✅ Biometric Sensor Available" : "❌ No Biometric Sensor");
    });
}
```

---

## Feature Test ✅

### Registration Test
- [ ] Logged in to application
- [ ] Navigated to Settings/Profile/Credentials section
- [ ] Clicked "Register Fingerprint" button
- [ ] Modal opened with input field
- [ ] Entered device name (e.g., "My Laptop")
- [ ] Clicked "Register" or "Scan Fingerprint" button
- [ ] Browser prompt appeared for biometric scan
- [ ] Successfully scanned fingerprint
- [ ] Success message appeared
- [ ] Device listed in credentials
- [ ] Refreshed page → credential still there

**Check browser console for:**
```
✅ No errors
✅ Registration successful logs
✅ Credential ID returned
```

### Authentication Test
- [ ] Logged out of application
- [ ] Went to login page
- [ ] Entered registered email
- [ ] Clicked "Sign in with Fingerprint" button
- [ ] Browser prompt appeared for biometric scan
- [ ] Successfully scanned fingerprint
- [ ] Logged in successfully
- [ ] Redirected to dashboard

**Check browser console for:**
```
✅ No network errors
✅ Authentication successful logs
✅ User data returned
```

### Multiple Credentials Test
- [ ] Registered fingerprint as "Device 1"
- [ ] Registered same fingerprint as "Device 2"
- [ ] Both listed in credentials
- [ ] Deleted "Device 2"
- [ ] Only "Device 1" remains
- [ ] Authentication still works with "Device 1"

---

## Troubleshooting Section

### If Backend Won't Start
- [ ] Check port 8000 is not in use
- [ ] Verify `backend/.env` exists
- [ ] Check Node.js version (v14+)
- [ ] Check for errors in backend/.env loading

**Debug:**
```powershell
# Kill process on port 8000
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force

# Try starting again
cd backend
node server.js
```

### If Backend Crashes
- [ ] Check `backend/.env` has all required variables
- [ ] Verify Supabase credentials are correct
- [ ] Check backend logs for specific errors
- [ ] Try: `npm install` again in backend folder

### If Frontend Says "Cannot Connect to Backend"
- [ ] Verify backend server is running
- [ ] Check .env has `VITE_API_URL=http://localhost:8000`
- [ ] Verify firewall isn't blocking port 8000
- [ ] Clear browser cache
- [ ] Restart frontend dev server

**Test endpoint:**
```powershell
curl http://localhost:8000/health
```

### If Fingerprint Scan Fails
- [ ] Check browser console for specific error
- [ ] Ensure biometric sensor available
- [ ] Try different finger/method
- [ ] Restart browser
- [ ] Verify browser has WebAuthn support

### If Registration "Verification Failed"
- [ ] Check `backend/routes/webauthnRoutes.js` for rpID and origin
- [ ] Verify they match your frontend URL
- [ ] Ensure database tables exist
- [ ] Check Supabase database for errors in logs

---

## Final Verification

Run all checks one more time:

```powershell
# 1. Backend running?
netstat -ano | findstr :8000

# 2. Frontend running?
netstat -ano | findstr :5173

# 3. Backend healthy?
curl http://localhost:8000/health

# 4. Supabase connected?
curl http://localhost:8000/test-db

# 5. Browser supports WebAuthn?
# Open http://localhost:5173 and check console

# 6. Can access login page?
# Navigate to http://localhost:5173/login
```

---

## When Everything Works ✅

If all checks pass:
1. ✅ Register fingerprint successfully
2. ✅ See registered credential listed
3. ✅ Login with fingerprint works
4. ✅ Multiple credentials work
5. ✅ Delete credential works
6. ✅ No console errors

You're ready to use WebAuthn fingerprint authentication!

---

## Next: Production Deployment

Once tested locally, see `WEBAUTHN_COMPLETE_SETUP.md` Step 8 for:
- Deploying backend to production
- Updating frontend for production domain
- Using HTTPS for security
- Configuring correct RP ID and Origin

---

**Status:** Ready for Setup
**Version:** 1.0
**Last Updated:** 2026-06-24
