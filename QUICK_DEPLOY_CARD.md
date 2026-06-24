# Deployment Quick Reference Card

## 🚀 Deploy in 3 Steps

### Step 1: Deploy Backend (Render)
```
1. https://render.com → Sign up with GitHub
2. New Web Service → Select test-inventory-system
3. Name: stockflow-backend | Build: npm install | Start: npm start
4. Environment Variables:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - VITE_APP_ORIGIN (add later)
5. Deploy → Copy URL
```

### Step 2: Deploy Frontend (Vercel)
```
1. https://vercel.com → Sign up with GitHub
2. Add Project → Select test-inventory-system
3. Deploy → Settings → Environment Variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_BACKEND_URL=https://stockflow-backend.onrender.com
   - VITE_APP_DOMAIN
   - VITE_APP_ORIGIN
4. Deployments → Redeploy
```

### Step 3: Connect Services
```
Render → stockflow-backend → Environment
Update: VITE_APP_ORIGIN=https://your-vercel-domain
```

---

## 📋 Environment Variables Checklist

### Supabase → Settings → API
- [ ] Copy Project URL → `VITE_SUPABASE_URL`
- [ ] Copy Anon Public Key → `VITE_SUPABASE_ANON_KEY`
- [ ] Copy Service Role Secret → `SUPABASE_SERVICE_ROLE_KEY`

### Vercel → Add These
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BACKEND_URL=https://stockflow-backend.onrender.com
VITE_APP_DOMAIN=
VITE_APP_ORIGIN=https://
```

### Render → Add These
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
VITE_APP_ORIGIN=https://your-vercel-domain
VITE_APP_DOMAIN=
```

---

## ✅ Test Your Deployment

```bash
# Test backend is running
curl https://stockflow-backend.onrender.com/health

# Test frontend loads
Open https://your-domain.vercel.app in browser

# Check API connection (in browser console)
fetch('https://stockflow-backend.onrender.com/health')
  .then(r => r.json())
  .then(console.log)
```

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| 404 API errors | Check `VITE_BACKEND_URL` in Vercel |
| CORS errors | Check `VITE_APP_ORIGIN` in Render |
| Blank page | Clear cache, hard refresh (Ctrl+Shift+R) |
| Build fails | Run `npm run build` locally first |
| Slow response | Free Render may be spinning up |
| WebAuthn fails | Verify user exists in Supabase |

---

## 📱 URLs After Deploy

```
Frontend:  https://your-domain.vercel.app
Backend:   https://stockflow-backend.onrender.com
Health:    https://stockflow-backend.onrender.com/health
```

---

## 🔐 Never Expose These

- API Keys
- Service Role Keys
- Database Passwords
- OAuth Secrets
- Private Keys

Always use platform environment variables!

---

## 📚 Full Guides

- **DEPLOYMENT_GUIDE.md** - Detailed steps
- **DEPLOYMENT_CHECKLIST.md** - Before deploy
- **DEPLOYMENT_TROUBLESHOOTING.md** - Problems
- **DEPLOYMENT_SUMMARY.md** - Overview

---

## 💡 Pro Tips

1. **Keep main branch stable** - Test locally first
2. **Use free tier for testing** - Upgrade after validation
3. **Monitor for free** - Use UptimeRobot to ping /health
4. **Save this card** - Bookmark for future deployments
5. **Document your domain** - Note your actual URLs

---

## 🎯 Success Criteria

✅ Backend responds to `curl https://stockflow-backend.onrender.com/health`
✅ Frontend loads without 404 errors
✅ Console has no CORS errors
✅ API calls go to your Render backend
✅ Login flow works end-to-end

---

## ⏱️ Time Estimate

- Backend: 10 minutes
- Frontend: 10 minutes  
- Connection: 2 minutes
- Testing: 5 minutes
- **Total: ~30 minutes**

---

**Print this card or save to your phone for quick reference!**
