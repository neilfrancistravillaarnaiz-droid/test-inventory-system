# Quick Deployment Checklist

## Pre-Deployment Checklist

### Local Testing
- [ ] Run `npm run dev` in root - frontend loads at localhost:5173
- [ ] Run `npm start` in backend - server runs at localhost:8000
- [ ] Test /health endpoint: `curl http://localhost:8000/health`

### Code Review
- [ ] No `.env` files committed to GitHub
- [ ] All environment variables use `process.env`
- [ ] Backend CORS is configured
- [ ] Frontend API URLs are using environment variables
- [ ] No hardcoded localhost URLs in production code

### Supabase Setup
- [ ] Service Role Key generated
- [ ] Anon Key available
- [ ] RLS policies configured (if needed)

---

## Render Backend Deployment

### Step-by-Step

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy: Prepare for production"
   git push origin main
   ```

2. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub
   - Authorize Render to access your repo

3. **Create Web Service**
   - Click "New +" → "Web Service"
   - Select `test-inventory-system` repository
   - Click "Connect"

4. **Configure Service**
   - **Name**: `stockflow-backend`
   - **Environment**: `Node`
   - **Region**: Select closest to your users
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid for reliability)

5. **Add Environment Variables**
   Click "Advanced" then "Add Environment Variable"
   
   ```
   PORT=3000
   NODE_ENV=production
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   VITE_APP_ORIGIN=https://ccdinventorysystem.vercel.app
   VITE_APP_DOMAIN=ccdinventorysystem.vercel.app
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Wait for build (2-3 minutes)
   - Get your URL: `https://test-inventory-system.onrender.com`

7. **Test Backend**
   ```bash
   curl https://test-inventory-system.onrender.com/health
   ```

---

## Vercel Frontend Deployment

### Step-by-Step

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub
   - Install Vercel app and authorize

2. **Import Project**
   - Click "Add New" → "Project"
   - Select `test-inventory-system`
   - Click "Import"

3. **Configure Project**
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - Click "Deploy"

4. **Add Environment Variables**
   After initial deployment, go to Settings → Environment Variables
   
   ```
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   VITE_BACKEND_URL=https://test-inventory-system.onrender.com
   VITE_API_BASE_URL=https://test-inventory-system.onrender.com
   VITE_APP_DOMAIN=ccdinventorysystem.vercel.app
   VITE_APP_ORIGIN=https://ccdinventorysystem.vercel.app
   ```

5. **Redeploy with Environment Variables**
   - Go to Deployments
   - Click latest deployment
   - Click "Redeploy"
   - Confirm with environment variables

6. **Test Frontend**
   - Visit your Vercel URL
   - Open DevTools console
   - Check for API errors

---

## Connecting Frontend to Backend

### After Both Deployed:

1. **Update Render Environment Variables**
   - Go to Render Dashboard
   - Select stockflow-backend
   - Go to Environment
   - Update `VITE_APP_ORIGIN` with your actual Vercel URL
   - Service will auto-redeploy

2. **Test Connection**
   - Open browser DevTools
   - Go to Network tab
   - Try to login
   - Check if requests go to your Render backend

3. **Troubleshoot if Needed**
   - Check CORS errors in Console
   - Verify `VITE_APP_ORIGIN` is set correctly
   - Check Render logs for errors
   - Verify Supabase keys are correct

---

## Monitoring & Maintenance

### Check Render Backend Status
- Dashboard shows service health
- Logs tab shows any errors
- Metrics tab shows CPU/memory usage

### Check Vercel Frontend Status
- Analytics show traffic
- Deployments show build history
- Function logs show any serverless errors

### Keep Services Running
- Free Render tier spins down after 15 min inactivity
- Add monitoring URL: Use uptimerobot.com to ping /health
- Or upgrade to Render Hobby plan ($7/month)

---

## Environment Variables Summary

### Frontend (Vercel)
```
VITE_SUPABASE_URL         → Supabase Dashboard > Settings > API > URL
VITE_SUPABASE_ANON_KEY    → Supabase Dashboard > Settings > API > Anon Key
VITE_BACKEND_URL          → Your Render backend URL
VITE_API_BASE_URL         → Your Render backend URL
VITE_APP_DOMAIN           → Your Vercel domain
VITE_APP_ORIGIN           → https://ccdinventorysystem.vercel.app
```

### Backend (Render)
```
PORT                      → 3000 (auto-assigned)
NODE_ENV                  → production
SUPABASE_URL              → Supabase Dashboard > Settings > API > URL
SUPABASE_SERVICE_ROLE_KEY → Supabase Dashboard > Settings > API > Service Role
VITE_APP_ORIGIN           → Your Vercel frontend URL
VITE_APP_DOMAIN           → Your Vercel domain
```

---

## Rollback Instructions

### If Something Goes Wrong:

**Vercel:**
1. Go to Deployments
2. Find previous working deployment
3. Click "..."
4. Select "Promote to Production"

**Render:**
1. Go to Logs
2. Find last successful deployment
3. Manual rollback requires redeployment from GitHub with previous code

**Best Practice:**
- Keep main branch stable
- Use git tags for releases
- Test on staging before deploying

---

## Success Indicators

✅ **Backend is working if:**
- `/health` endpoint returns 200
- API endpoints return expected responses
- CORS errors don't appear in frontend

✅ **Frontend is working if:**
- Page loads at Vercel URL
- No 404 errors for API calls
- Console shows no CORS errors

✅ **Full integration working if:**
- Can complete login flow
- API endpoints respond
- Data loads from Supabase

---

## Next Steps

1. [ ] Deploy backend to Render
2. [ ] Deploy frontend to Vercel
3. [ ] Test both services work together
4. [ ] Set up custom domain (optional)
5. [ ] Configure monitoring/alerts
6. [ ] Document deployment process
7. [ ] Plan maintenance windows
