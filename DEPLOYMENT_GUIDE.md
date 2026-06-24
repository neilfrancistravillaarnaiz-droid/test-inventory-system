# Deployment Guide: Vercel + Render

This guide covers deploying your StockFlow inventory application:
- **Frontend**: Vercel (React/Vite)
- **Backend**: Render (Node.js/Express)
- **Database**: Supabase (no deployment needed, already in cloud)

---

## Part 1: Backend Deployment on Render

### Step 1: Create a Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)
3. Connect your GitHub repository

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Select your repository (test-inventory-system)
3. Fill in the details:
   - **Name**: `stockflow-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Region**: Choose closest to you

### Step 3: Configure Environment Variables
In Render dashboard, go to **Environment** and add:

```
PORT=3000
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
VITE_APP_DOMAIN=stockflow-backend.onrender.com
VITE_APP_ORIGIN=https://your-frontend-vercel-url.vercel.app
```

**Where to find these values:**
- `SUPABASE_URL`: Supabase Dashboard → Settings → API → URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard → Settings → API → Service Role Key
- `VITE_APP_ORIGIN`: Your Vercel frontend URL (we'll get this later)

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Render will automatically deploy from your GitHub repo
3. Wait for build to complete (takes 2-3 minutes)
4. Copy your backend URL: `https://stockflow-backend.onrender.com`

### ⚠️ Important Note
Free Render services spin down after 15 minutes of inactivity. To keep it running:
- Upgrade to paid plan ($7+/month), OR
- Use a monitoring service to ping your backend every 15 minutes

---

## Part 2: Frontend Deployment on Vercel

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Install Vercel GitHub app and authorize your repository

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Select your repository (test-inventory-system)
3. Configure build settings:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables
In Vercel, go to **Settings** → **Environment Variables** and add:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_DOMAIN=your-domain.vercel.app
VITE_APP_ORIGIN=https://your-domain.vercel.app
VITE_BACKEND_URL=https://stockflow-backend.onrender.com
```

**Where to find these values:**
- `VITE_SUPABASE_URL`: Supabase Dashboard → Settings → API → URL
- `VITE_SUPABASE_ANON_KEY`: Supabase Dashboard → Settings → API → Anon Key
- `VITE_BACKEND_URL`: Your Render backend URL from Part 1

### Step 4: Update Backend for Frontend URL
Go back to **Render Dashboard** and update:
- `VITE_APP_ORIGIN=https://your-domain.vercel.app` (your new Vercel URL)

### Step 5: Deploy
1. Click **"Deploy"**
2. Vercel will build and deploy automatically
3. Wait 2-3 minutes for deployment
4. Your frontend is now live at the provided URL!

---

## Part 3: Update API Endpoints

### Frontend API Configuration
Update your frontend code to use the Render backend URL.

**In `src/services/webauthnService.ts` (line ~12):**
```typescript
const API_BASE_URL = process.env.VITE_BACKEND_URL || "https://stockflow-backend.onrender.com";
```

**In `src/lib/supabaseClient.ts`:**
```typescript
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
```

### Backend CORS Configuration
In `backend/server.js`, update CORS to allow your Vercel frontend:
```javascript
app.use(cors({
  origin: process.env.VITE_APP_ORIGIN || "http://localhost:5174",
  credentials: true
}));
```

---

## Part 4: Supabase Configuration

### 1. Get Your API Keys
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### 2. Enable WebAuthn Tables
Run the migration SQL in your Supabase database:
1. Go to **SQL Editor** → **New Query**
2. Paste the SQL from `webauthn-migration.sql`
3. Execute it

---

## Environment Variables Checklist

### Frontend (.env.local in Vercel):
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_BACKEND_URL` (Render backend URL)
- [ ] `VITE_APP_DOMAIN`
- [ ] `VITE_APP_ORIGIN`

### Backend (.env in Render):
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `VITE_APP_DOMAIN` (Render domain)
- [ ] `VITE_APP_ORIGIN` (Vercel frontend URL)
- [ ] `PORT` (should be 3000 or auto-assigned)

---

## Testing Deployment

### 1. Test Backend
```
curl https://stockflow-backend.onrender.com/health
```
Should return: `{"success":true,"message":"Backend is healthy"}`

### 2. Test Frontend
Visit: `https://your-domain.vercel.app`
Should load the inventory app

### 3. Test WebAuthn Setup
```
curl https://stockflow-backend.onrender.com/api/webauthn/setup
```

---

## Troubleshooting

### Backend Won't Deploy
- Check build command: `npm install` (should complete successfully)
- Check logs in Render dashboard
- Verify all environment variables are set
- Check that `package.json` has `"type": "module"`

### Frontend Shows 404 Errors
- Verify `VITE_BACKEND_URL` is set in Vercel
- Check that backend CORS allows your frontend origin
- Clear browser cache and redeploy

### WebAuthn Not Working
- Verify backend can reach Supabase (test with `/api/webauthn/setup`)
- Check `SUPABASE_SERVICE_ROLE_KEY` is correct
- Verify WebAuthn tables exist in Supabase

### Render Service Spinning Down
- Free tier services spin down after 15 mins inactivity
- Upgrade to paid plan or set up monitoring to keep alive

---

## Custom Domain Setup

### On Vercel:
1. Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### On Render:
1. Settings → Custom Domains
2. Add your domain
3. Update DNS records as instructed

---

## Security Best Practices

1. **Never commit .env files** - Always use platform environment variables
2. **Use Service Role Key only on backend** - Frontend should only use Anon Key
3. **Enable RLS (Row Level Security)** in Supabase
4. **Rotate keys regularly** - Generate new Supabase keys periodically
5. **HTTPS everywhere** - Both Vercel and Render provide free HTTPS

---

## Performance Optimization

### Frontend (Vercel):
- Already optimized with Vite
- Use Vercel's image optimization
- Enable automatic GZIP compression

### Backend (Render):
- Use paid tier to prevent spindown
- Add caching headers for static responses
- Monitor memory usage

---

## Next Steps

1. [ ] Deploy backend to Render
2. [ ] Get backend URL
3. [ ] Deploy frontend to Vercel
4. [ ] Update environment variables on both platforms
5. [ ] Test the complete flow
6. [ ] Set up custom domains (optional)
7. [ ] Configure monitoring/alerting

---

## Support

For issues:
- Vercel docs: https://vercel.com/docs
- Render docs: https://render.com/docs
- Supabase docs: https://supabase.com/docs
