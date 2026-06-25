# Deployment Troubleshooting Guide

## Common Issues & Solutions

---

## Backend (Render) Issues

### Issue 1: Build Fails with "npm install"
**Error Messages:**
- `npm ERR! code ERESOLVE`
- `npm ERR! ERESOLVE unable to resolve dependency tree`

**Solutions:**
1. Check `package.json` for conflicting versions
2. Try: `npm install --legacy-peer-deps`
3. Delete `package-lock.json` and commit
4. Use Node 18+ version (set in Render)

**How to set Node version in Render:**
- Environment → Add Variable
- `NODE_VERSION=18.20.0`

---

### Issue 2: "Cannot find module" Errors
**Error:**
```
Error: Cannot find module '<module-name>'
```

**Solutions:**
1. Verify `backend/package.json` has the dependency
2. Check that all imports use correct case (Linux is case-sensitive)
3. Ensure build command runs: `npm install`
4. Redeploy if dependencies changed

---

### Issue 3: Supabase Connection Fails
**Error:**
```
Error: SUPABASE_URL is not defined
Error: SUPABASE_SERVICE_ROLE_KEY is not defined
```

**Solutions:**
1. Verify environment variables are set in Render Dashboard
2. Check exact variable names (case-sensitive)
3. Restart service after adding variables
4. Try accessing Supabase directly:
   ```bash
   curl -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     https://YOUR-PROJECT.supabase.co/rest/v1/
   ```

**Finding these values:**
- Go to Supabase Dashboard
- Select your project
- Settings → API
- Copy exact values

---

### Issue 4: CORS Errors from Frontend
**Error in Browser Console:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**
1. Check `VITE_APP_ORIGIN` is set in Render
2. Verify it matches exactly (https://, no trailing slash)
3. Check backend CORS configuration:
   ```javascript
   // In server.js
   const corsOptions = {
     origin: process.env.VITE_APP_ORIGIN,
     credentials: true
   };
   ```
4. Redeploy backend after changing CORS config

**Test CORS:**
```bash
curl -H "Origin: https://your-vercel-url" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://stockflow-backend.onrender.com/health
```

---

### Issue 5: Service Spinning Down
**Symptoms:**
- First request takes 30+ seconds
- After 15 minutes of no requests, service becomes slow

**Solutions:**
1. Upgrade to Render Hobby plan ($7/month) - services always running
2. Use monitoring service (uptime robot, etc.):
   - Free tier: https://uptimerobot.com
   - Add URL: `https://stockflow-backend.onrender.com/health`
   - Set interval: 5 minutes
3. Add to Vercel cron jobs:
   ```javascript
   // pages/api/keep-alive.js
   export default async function handler(req, res) {
     await fetch('https://stockflow-backend.onrender.com/health');
     res.status(200).json({ ok: true });
   }
   ```

---

### Issue 6: 502 Bad Gateway
**Error:** Service shows "502 Bad Gateway" or "Service Unavailable"

**Solutions:**
1. Check Render logs for crash details
2. Verify all required environment variables are set
3. Check Supabase is accessible
4. Restart service in Render dashboard
5. Check memory limits - may need upgrade

**Check service status:**
```bash
curl -i https://stockflow-backend.onrender.com/health
```

---

## Frontend (Vercel) Issues

### Issue 1: Build Fails
**Error:**
```
Build failed: failed to build
```

**Solutions:**
1. Check build logs in Vercel dashboard
2. Ensure `build` script works locally: `npm run build`
3. Check for TypeScript errors: `npx tsc --noEmit`
4. Verify all imports are correct
5. Check for missing environment variables

---

### Issue 2: Environment Variables Not Loaded
**Symptoms:**
- Frontend works locally but fails in production
- API calls go to wrong URL
- Supabase keys not found

**Solutions:**
1. Variables must start with `VITE_` for Vite
2. Redeploy after adding variables (they don't auto-apply)
3. Check in Settings → Environment Variables
4. Hard refresh browser (Ctrl+Shift+R)
5. Clear `.next` or `dist` folder locally and rebuild

**Debug environment variables:**
```javascript
// In your component
console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL);
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
```

---

### Issue 3: API Calls Failing (404s)
**Error:**
```
GET https://stockflow-backend.onrender.com/api/... 404
```

**Solutions:**
1. Check `VITE_BACKEND_URL` is set correctly (no trailing slash)
2. Verify backend is running: `curl https://stockflow-backend.onrender.com/health`
3. Check backend deployed successfully
4. Verify API routes exist in backend
5. Check network tab - what URL is actually being called?

---

### Issue 4: Authentication Not Working
**Error:**
```
User not found
No credentials registered for this user
```

**Solutions:**
1. Verify user exists in Supabase
2. User must have a registered credential or valid login method
3. Check the relevant credentials table in Supabase
4. Verify authentication-related database tables exist
5. Run migration if tables missing


---

### Issue 5: Blank Page or 404 on Route
**Symptoms:**
- Homepage works but other routes show 404
- Page shows blank white screen

**Solutions:**
1. Check `vercel.json` has rewrite rule:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
2. Hard refresh browser
3. Check browser console for JavaScript errors
4. Verify React Router is configured correctly
5. Check static files are generated in `dist` folder

---

### Issue 6: Slow Performance
**Symptoms:**
- Page takes 5+ seconds to load
- Backend requests are slow

**Solutions:**
1. Check Vercel Analytics
2. Verify backend isn't spinning down:
   ```bash
   curl -w "Time: %{time_total}s\n" https://stockflow-backend.onrender.com/health
   ```
3. If > 10 seconds, backend is spinning up
4. Upgrade Render to paid plan or add monitoring
5. Check Supabase is responsive

---

## Integration Issues

### Issue 1: Frontend Can't Reach Backend
**Error:**
```
Failed to fetch from backend
CORS error in console
```

**Checklist:**
- [ ] Backend is deployed (test /health)
- [ ] VITE_BACKEND_URL is set in Vercel
- [ ] Backend VITE_APP_ORIGIN includes https://
- [ ] No trailing slashes in URLs
- [ ] No typos in domains
- [ ] Both use HTTPS (not HTTP)
- [ ] Ports are correct (3000 for render, 5174 for vercel dev)

**Test manually:**
```bash
# From your Vercel URL
fetch('https://stockflow-backend.onrender.com/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

---

### Issue 2: Login Works Locally but Not in Production
**Symptoms:**
- Works on localhost
- Fails on Vercel/Render URLs

**Common Causes:**
1. Supabase keys are different (anon vs service role)
2. Frontend using service role key (security issue!)
3. Environment variables not set
4. CORS blocking requests
5. Session storage not working in Vercel

**Fix:**
- Frontend: Use `VITE_SUPABASE_ANON_KEY` (public)
- Backend: Use `SUPABASE_SERVICE_ROLE_KEY` (secret)
- Check MemoryStorage is working

---

### Issue 3: Production Authentication Fails
**Error:**
```
Error: User not found
Error initiating authentication
```

**Solutions:**
1. Verify user exists in profiles table
2. Check required tables created:
   ```sql
   SELECT * FROM credentials;
   SELECT * FROM challenges;
   ```
3. Verify user can authenticate
4. Check RLS policies if enabled

---

## Database (Supabase) Issues

### Issue 1: Tables Don't Exist
**Error:**
```
relation "credentials" does not exist
```

**Solution:**
1. Run the migration SQL in Supabase SQL Editor
2. Wait for execution to complete
3. Refresh table list in Data Editor
4. Tables should appear

---

### Issue 2: RLS Policy Errors
**Error:**
```
Policy violation or permission denied
```

**Solution:**
1. Go to Supabase Authentication → Policies
2. Check policies allow your operations
3. For public access: `(role() = 'anon')`
4. For authenticated: `(auth.uid() = user_id)`
5. Test without RLS first, add policies later

---

### Issue 3: Service Role Key Compromised
**Symptoms:**
- Someone has access to your backend code
- Service role key is visible

**Immediate Actions:**
1. Go to Supabase Settings → API
2. Click refresh icon next to Service Role Key
3. Update Render environment variables
4. Redeploy backend
5. Rotate any other exposed keys

---

## Debugging Commands

### Check Backend Health
```bash
# Test if server is running
curl https://stockflow-backend.onrender.com/health

# Check backend configuration
curl https://stockflow-backend.onrender.com/ai/debug-config
```

### Check Logs
**Render:**
1. Dashboard → Select service
2. Logs tab shows real-time output
3. Export logs for analysis

**Vercel:**
1. Deployments → Select deployment
2. Build Logs shows build output
3. Function Logs shows runtime errors

### Check Deployment Status
```bash
# Vercel deployment
curl -i https://your-domain.vercel.app

# Render deployment
curl -i https://stockflow-backend.onrender.com
```

---

## Performance Optimization

### Backend (Render)
- Use paid tier to prevent spindowns
- Add connection pooling if using database
- Cache frequently accessed data
- Monitor memory usage

### Frontend (Vercel)
- Enable caching for assets
- Lazy load components
- Optimize images
- Split code by route

### Database (Supabase)
- Add indexes to frequently queried columns
- Use connection limits appropriate for tier
- Monitor query performance
- Enable Read Replicas for high traffic

---

## Getting Help

### Render Support
- Docs: https://render.com/docs
- Status: https://status.render.com
- Community: Discord

### Vercel Support
- Docs: https://vercel.com/docs
- Status: https://www.vercel-status.com
- Community: https://forums.vercel.com

### Supabase Support
- Docs: https://supabase.com/docs
- Status: https://status.supabase.com
- Community: Discord, GitHub Discussions
