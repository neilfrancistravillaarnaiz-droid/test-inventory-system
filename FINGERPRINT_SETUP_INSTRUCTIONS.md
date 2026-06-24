# 🔐 WebAuthn Fingerprint Setup - Complete Guide

## Current Status ✅
- **Backend**: Running on `http://localhost:8000` ✓
- **Frontend**: Running on `http://localhost:5175` ✓
- **WebAuthn Tables**: Created in Supabase ✓
- **Configuration**: Correctly configured ✓

## 🎯 How to Register Your Fingerprint

### Step 1: Navigate to Admin Login
Open your browser and go to:
```
http://localhost:5175
```

You should see the Admin Login page with "Choose your authentication method".

### Step 2: Sign In with Password First
1. Click **"Sign in with Password"**
2. Enter your admin email and password
3. Enter the OTP code from your email
4. You'll be logged into the dashboard

### Step 3: Go to Your Profile
Once logged in:
1. Click your **profile icon** (usually top right)
2. Click **"Profile" or "Settings"**

### Step 4: Register Your Fingerprint
On the profile page:
1. Look for **"Register Fingerprint"** or **"Add Fingerprint"** button
2. Click to open the registration modal
3. Give your device a name (e.g., "My Laptop")
4. Click **"Register Fingerprint"**
5. **Follow the browser prompt** to scan your fingerprint
6. Your device will guide you through the scanning process

### Step 5: Test Fingerprint Login
Once registered:
1. Log out from the dashboard
2. Go back to admin login page
3. Click **"Sign in with Fingerprint"**
4. Enter your email
5. Click the fingerprint button
6. Scan your fingerprint when prompted
7. You should be logged in automatically! ✓

## 🛠️ Troubleshooting

### Error: "No fingerprint registered for this email"
**Solution**: 
- Make sure you're using the same email for both registration and login
- Verify you completed the registration step
- Check that your device has biometric support (Windows Hello, Touch ID, etc.)

### Error: "Cannot connect to backend"
**Solution**:
- Verify backend is running: `http://localhost:8000/health`
- Should return: `{"success":true,"message":"Backend is healthy"}`
- If not running, restart it: `cd backend && node server.js`

### Fingerprint scan not working
**Solution**:
- Your device needs biometric hardware (fingerprint sensor)
- Not all browsers support WebAuthn - use Chrome, Edge, or Firefox (latest versions)
- Try a different browser if one doesn't work

### Registration modal doesn't appear
**Solution**:
- Make sure you're logged in first
- Check that you're on the Profile page
- Clear browser cache and reload

## 📋 Technical Details

### Database Tables
- **webauthn_credentials**: Stores registered fingerprints
  - User can have multiple fingerprints (different devices)
  - Each fingerprint is tied to a user account
  
- **webauthn_challenges**: Temporary storage for registration/auth challenges
  - Auto-expires after 10 minutes
  - Cleaned up automatically after use

### Authentication Flow

**Registration Flow:**
```
Admin User (Logged In)
    ↓
Click "Register Fingerprint"
    ↓
Enter Device Name
    ↓
Browser scans fingerprint (WebAuthn)
    ↓
Send credential to Backend
    ↓
Backend stores in Supabase
    ↓
Success! Can now use fingerprint to login
```

**Login Flow (Fingerprint):**
```
Admin User (Not Logged In)
    ↓
Click "Sign in with Fingerprint"
    ↓
Enter Email
    ↓
Click Fingerprint Button
    ↓
Browser scans fingerprint (WebAuthn)
    ↓
Backend verifies credential
    ↓
Backend creates Supabase session
    ↓
Automatic redirect to Dashboard ✓
```

## 🔒 Security Notes

1. **Fingerprints are never stored as images**
   - Only cryptographic credential data is stored
   - Fingerprint never leaves your device

2. **End-to-end security**
   - Communication uses HTTPS in production
   - Backend validates all cryptographic signatures
   - WebAuthn spec ensures security

3. **Multiple devices supported**
   - Register multiple fingerprints on different devices
   - Each device gets its own credential entry
   - Can be managed from Profile page

## 📞 If You Still Have Issues

1. Check backend console for errors:
   - Look for messages when you try to register/login
   - Errors will show what's failing

2. Check browser console (F12):
   - Network tab shows API calls
   - Console shows JavaScript errors

3. Verify configuration:
   - Frontend `.env`: `VITE_API_URL=http://localhost:8000`
   - Backend `.env`: `VITE_APP_ORIGIN=http://localhost:5175`
   - Both must match your actual running ports!

## ✅ Verification Checklist

- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 5175
- [ ] You can log in with password + OTP
- [ ] You can access Profile page
- [ ] "Register Fingerprint" button is visible
- [ ] Your device has biometric support
- [ ] Using a modern browser (Chrome, Edge, Firefox)
- [ ] Successfully scanned fingerprint
- [ ] Got "Successfully registered!" message
- [ ] Logged out and back in with fingerprint

Once all checks pass, your fingerprint login is fully functional! 🎉
