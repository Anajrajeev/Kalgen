# Render Deployment Guide

## Prerequisites
- Render account (free tier available)
- GitHub repository connected

## Deployment Steps

### Option 1: Using render.yaml (Recommended)
1. Push the `render.yaml` file to your repository
2. Connect your GitHub repository to Render
3. Render will automatically detect and deploy using the configuration

### Option 2: Manual Setup
1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name**: kalgen-backend
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free (or Standard for better performance)

### Option 3: Docker Deployment
1. Use the provided `Dockerfile`
2. Select Docker as environment in Render
3. Build context: `/backend`
4. Dockerfile path: `Dockerfile`

## Environment Variables
Add these in Render Dashboard:
- `DATABASE_URL` (if using external database)
- `SUPABASE_URL` and `SUPABASE_KEY`
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (for AWS services)
- `GOOGLE_API_KEY` (for Google AI)

## Benefits of Render vs Vercel
- ✅ Higher memory limits (no 500MB restriction)
- ✅ Better Python support
- ✅ Persistent storage available
- ✅ Background workers supported
- ✅ Free PostgreSQL database included
- ✅ Custom domains on free tier

## Post-Deployment
1. Test health endpoint: `https://your-app.onrender.com/health`
2. Check logs in Render Dashboard
3. Monitor resource usage in dashboard

## Troubleshooting
- If build fails, check the build logs
- For runtime errors, check service logs
- Ensure all environment variables are set
- Free tier has 15-minute timeout for inactivity
