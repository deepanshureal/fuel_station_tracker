# Deploying CNGFlow to Vercel

## Prerequisites
1. A GitHub account
2. A Vercel account (free at vercel.com)

## Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - CNGFlow app"

# Create a new repository on GitHub and push
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/cngflow.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (Easiest)
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your `cngflow` repository
5. Vercel will auto-detect the settings
6. Click "Deploy"
7. Wait ~1 minute for deployment
8. Your app will be live at `https://your-project-name.vercel.app`

### Option B: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (run from cng-tracker directory)
vercel

# Follow the prompts:
# - Set up and deploy: Y
# - Which scope: (select your account)
# - Link to existing project: N
# - Project name: cngflow (or your choice)
# - Directory: ./public
# - Override settings: N
```

## Step 3: Custom Domain (Optional)
1. In Vercel dashboard, go to your project
2. Go to Settings → Domains
3. Add your custom domain
4. Update DNS records as instructed

## Environment Variables
Since this is a frontend-only app, no environment variables are needed for basic functionality.

For Google Places API (if you add it later):
1. Go to Project Settings → Environment Variables
2. Add: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. Redeploy

## Post-Deployment

Your app will be available at:
- Production: `https://cngflow.vercel.app` (or your custom name)
- Preview deployments for each git push

### Share Your App
Once deployed, you can share the link with anyone. The app will work on:
- Desktop browsers
- Mobile browsers
- Can be installed as PWA

### Analytics (Optional)
Vercel provides free analytics. Enable in dashboard under Analytics tab.

## Updating the App
```bash
# Make changes
git add .
git commit -m "Update message"
git push

# Vercel will auto-deploy within ~1 minute
```

## Troubleshooting

### If deployment fails:
1. Check build logs in Vercel dashboard
2. Ensure all file paths are relative
3. Check vercel.json configuration

### Common issues:
- **404 errors**: Check the rewrites in vercel.json
- **Missing files**: Ensure all files are committed to git
- **CORS issues**: For API calls, may need to add headers

## Free Tier Limits
Vercel free tier includes:
- 100GB bandwidth/month
- Unlimited deployments
- SSL certificate
- Global CDN
- Perfect for CNGFlow!

## Success! 🎉
Your CNGFlow app is now live and accessible globally with:
- Fast loading via CDN
- HTTPS security
- Auto-deployment on git push
- Zero server maintenance