# Post-Deployment Verification Guide

## Immediate Tests (Do Right After Deploy)

### 1. Backend Health Check (2 minutes)

**Test Command:**
```bash
curl -i https://stockflow-backend.onrender.com/health
```

**Expected Response:**
```
HTTP/1.1 200 OK
Content-Type: application/json

{"success":true,"message":"Backend is healthy"}
```

**If Failed:**
- Check Render logs: https://dashboard.render.com
- Verify SUPABASE_URL environment variable
- Verify SUPABASE_SERVICE_ROLE_KEY environment variable
- Restart service

---

### 2. Frontend Load Test (2 minutes)

**Steps:**
1. Visit: `https://your-domain.vercel.app`
2. Open DevTools: F12
3. Check Console tab for errors
4. Check Network tab - all resources load?

**Expected:**
- Page loads without 404 errors
- No red error messages in console
- JavaScript files load successfully

**If Failed:**
- Hard refresh: Ctrl+Shift+R
- Check Vercel build logs
- Verify environment variables are set
- Redeploy from Vercel dashboard

---

### 3. API Connectivity Test (2 minutes)

**In Browser Console (F12):**
```javascript
fetch('https://stockflow-backend.onrender.com/health')
  .then(r => r.json())
  .then(data => console.log('Backend OK:', data))
  .catch(err => console.error('Backend Error:', err))
```

**Expected Output:**
```
Backend OK: {success: true, message: "Backend is healthy"}
```

**If Error:**
- Check CORS configuration in backend
- Verify VITE_APP_ORIGIN is set in Render
- Check browser console for exact error

---

### 4. Backend Verification (2 minutes)

**Test Command:**
```bash
curl https://stockflow-backend.onrender.com/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Backend is healthy"
}
```

**If the backend is not responding:**
1. Check Render logs
2. Verify environment variables are set
3. Redeploy the backend

---

## Detailed Verification Tests

### 5. Authentication Flow Test (5 minutes)

**Steps:**
1. Go to `https://your-domain.vercel.app/admin-login`
2. Try login with password/OTP method
3. Check if it reaches backend
4. Verify admin account exists in Supabase

**Expected:**
- Login page loads
- Can enter credentials
- Backend receives request (check Network tab)

---

### 6. Database Connectivity Test (5 minutes)

**On Vercel (in browser console):**
```javascript
// Verify Supabase connection
console.log('Supabase configured:', !!window.__supabase)

// Or check in Network tab
// Look for requests to supabase.co
```

**If Issues:**
- Verify VITE_SUPABASE_URL in Vercel
- Verify VITE_SUPABASE_ANON_KEY in Vercel
- Check Supabase dashboard for any alerts

---

### 7. Environment Variable Validation (5 minutes)

**Test Frontend Variables:**
```javascript
// In browser console
console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL)
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('App Domain:', import.meta.env.VITE_APP_DOMAIN)
console.log('App Origin:', import.meta.env.VITE_APP_ORIGIN)
```

**Should Show:**
```
Backend URL: https://stockflow-backend.onrender.com
Supabase URL: https://your-project.supabase.co
App Domain: your-domain.vercel.app
App Origin: https://your-domain.vercel.app
```

**Test Backend Variables:**
Go to `https://stockflow-backend.onrender.com/ai/debug-config`

**Should Show:**
```json
{
  "success": true,
  "openaiConfigured": false,
  "groqConfigured": false,
  "tavilyConfigured": false,
  "supabaseUrlConfigured": true,
  "supabaseServiceRoleConfigured": true
}
```

---

## Performance Verification (5 minutes)

### Response Times

**Expected Times:**
- Health check: < 100ms (first request may be 5-30s if spinning up)
- API calls: < 500ms
- Page load: < 2 seconds (after first load)
- Backend health check: < 200ms

**Test:**
```javascript
// In browser console
console.time('Backend Response');
fetch('https://stockflow-backend.onrender.com/health')
  .then(r => r.json())
  .then(() => console.timeEnd('Backend Response'));
```

**If Slow:**
- First request spinning up (Render free tier)
- Check Render metrics dashboard
- Consider upgrading to paid tier

---

## Security Verification Checklist

- [ ] No `.env` files visible in GitHub
- [ ] API keys not in console logs
- [ ] HTTPS for all connections
- [ ] CORS restricted to your domain
- [ ] Service role key only on backend
- [ ] Anon key only on frontend
- [ ] No hardcoded credentials in code

---

## Monitoring Setup (10 minutes)

### Option 1: UptimeRobot (Free)

1. Go to https://uptimerobot.com
2. Sign up (free)
3. Add new monitor:
   - URL: `https://stockflow-backend.onrender.com/health`
   - Check interval: Every 5 minutes
   - Alert contacts: Your email
4. Activate

**Benefits:**
- Keeps backend awake (prevents 15-min spindown)
- Alerts if service goes down
- Completely free

### Option 2: Vercel Analytics (Free + Paid)

1. Vercel Dashboard → Analytics
2. View traffic and errors
3. Monitor deployment performance

### Option 3: Render Monitoring (Built-in)

1. Render Dashboard → Metrics
2. View CPU/Memory/Network usage
3. Check service logs

---

## Deployment Success Checklist

- [ ] Backend health check returns 200
- [ ] Frontend page loads without 404s
- [ ] No CORS errors in console
- [ ] API requests reach backend (Network tab)
- [ ] Environment variables are set
- [ ] Database tables accessible
- [ ] Database connectivity working
- [ ] Login flow works (at least password method)
- [ ] Performance acceptable
- [ ] All security checks passed
- [ ] Monitoring configured

---

## Create Backups Before Production

### GitHub Backup
```bash
git tag -a v1.0-production -m "Production deployment v1.0"
git push origin v1.0-production
```

### Supabase Backup
1. Supabase Dashboard → Database → Backups
2. Enable automated backups
3. Create manual backup now

---

## Post-Deployment Maintenance

### Daily
- [ ] Check Render logs for errors
- [ ] Monitor UptimeRobot alerts
- [ ] Review user feedback

### Weekly
- [ ] Check Vercel analytics
- [ ] Review Render metrics
- [ ] Check Supabase usage
- [ ] Test login flow once

### Monthly
- [ ] Review security advisories
- [ ] Update dependencies: `npm update`
- [ ] Check costs
- [ ] Review performance trends

---

## Common Issues Found in Testing

### Issue: API Returns 404
**Cause:** `VITE_BACKEND_URL` wrong
**Fix:** Check Vercel env vars, redeploy

### Issue: CORS Error in Console
**Cause:** `VITE_APP_ORIGIN` not set in Render
**Fix:** Add it, redeploy backend

### Issue: Page Blank on Load
**Cause:** JavaScript error or missing env var
**Fix:** Check console tab, reload

### Issue: Login Fails
**Cause:** Database or auth issue
**Fix:** Check Supabase, verify account exists

### Issue: Authentication Not Working
**Cause:** Tables missing or user has no credentials
**Fix:** Verify database schema and authentication data

---

## Next Steps After Verification

### If Everything Works ✅
1. Announce deployment
2. Monitor for 24 hours
3. Set up regular backups
4. Document any custom changes
5. Plan next features

### If Something Fails ❌
1. Check DEPLOYMENT_TROUBLESHOOTING.md
2. Review environment variables
3. Check service logs
4. Rollback if critical: See rollback plan in DEPLOYMENT_GUIDE.md
5. Fix issue and redeploy

---

## Performance Optimization After Deploy

### Vercel
- Enable caching headers: Already in vercel.json
- Lazy load components: Consider for future
- Optimize images: Use next/image for future
- Monitor Core Web Vitals: Check Analytics

### Render
- Upgrade to paid tier: Prevents spindown
- Add connection pooling: For database
- Monitor response times: Check metrics
- Enable compression: Already enabled

### Supabase
- Add database indexes: For frequently queried columns
- Enable Read Replicas: For high traffic
- Monitor query performance: Check logs
- Adjust connection limits: Based on usage

---

## Disaster Recovery Plan

### If Backend Goes Down
1. Check Render dashboard
2. Look at logs tab
3. Try restarting service
4. Check environment variables
5. Redeploy from GitHub

### If Frontend Goes Down
1. Check Vercel deployments
2. Look at build logs
3. Redeploy from Vercel
4. Check for JavaScript errors

### If Database Goes Down
1. Check Supabase dashboard
2. Contact Supabase support
3. Use backup if available
4. Restore from latest backup

### If You Lose Environment Variables
1. Use `.env.production.example` template
2. Restore from platform dashboards
3. Redeploy services
4. Test thoroughly

---

## Success! 🎉

You now have a production deployment with:
- ✅ Global CDN frontend (Vercel)
- ✅ Cloud backend (Render)
- ✅ Managed database (Supabase)
- ✅ Authentication security
- ✅ Monitoring in place

**Your app is live and ready for users!**

---

## Support

Still having issues? Check these in order:
1. QUICK_DEPLOY_CARD.md - Quick reference
2. DEPLOYMENT_CHECKLIST.md - Verification steps
3. DEPLOYMENT_TROUBLESHOOTING.md - Problem solutions
4. DEPLOYMENT_GUIDE.md - Detailed setup
5. Platform docs: Vercel, Render, Supabase

Good luck! 🚀
