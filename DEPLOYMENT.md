# Deployment Guide

Complete step-by-step guide to deploy the AI Mode Queries Tracker.

## 📋 Prerequisites

- MongoDB Atlas account (or local MongoDB)
- Vercel account
- Node.js 18+ installed
- Chrome browser for testing

## 🚀 Step 1: MongoDB Setup

### Option A: MongoDB Atlas (Recommended)

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for free account

2. **Create Cluster**
   - Choose "Build a Database"
   - Select "M0 Sandbox" (Free tier)
   - Choose your region
   - Name your cluster: `ai-mode-queries`

3. **Setup Database Access**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose password authentication
   - Username: `ai-queries-user`
   - Generate secure password
   - Database User Privileges: "Atlas admin"

4. **Configure Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Choose "Allow access from anywhere" (0.0.0.0/0)
   - For production, restrict to your server IPs

5. **Get Connection String**
   - Go to "Databases"
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string:
   ```
   mongodb+srv://ai-queries-user:<password>@your-cluster.mongodb.net/ai-mode-queries?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password

### Option B: Local MongoDB

```bash
# Install MongoDB locally
brew install mongodb/brew/mongodb-community  # macOS
# or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Connection string for local:
mongodb://localhost:27017/ai-mode-queries
```

## 🌐 Step 2: Deploy Server to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Server Directory**
   ```bash
   # Navigate to the server directory
   cd server/
   
   # Deploy from server folder
   vercel
   
   # Follow prompts:
   # - Set up and deploy? Y
   # - Which scope? (your account)
   # - Link to existing project? N
   # - Project name: ai-mode-queries-server
   # - Directory: ./ (current directory - server/)
   # - Override settings? N
   ```

4. **Set Environment Variables**
   ```bash
   # Method 1: Via CLI (from server directory)
   vercel env add MONGODB_URI
   # Paste your MongoDB connection string when prompted
   
   # Method 2: Via Dashboard
   # Go to vercel.com/dashboard
   # Select your project
   # Go to Settings → Environment Variables
   # Add: MONGODB_URI = your_connection_string
   ```

5. **Deploy to Production**
   ```bash
   # From server/ directory
   vercel --prod
   ```

6. **Note Your URLs**
   ```
   ✅ Production: https://ai-mode-queries-server.vercel.app
   ✅ Inspect: https://vercel.com/your-username/ai-mode-queries-server
   ```

## 🔧 Step 3: Configure Extension

1. **Update Server URLs**
   
   Edit `extension/background.js`:
   ```javascript
   // Line 2: Replace with your Vercel URL
   const COLLECT_URL = "https://ai-mode-queries-server.vercel.app/api/ai-search";
   ```
   
   Edit `extension/popup.js`:
   ```javascript
   // Line 2: Replace with your Vercel URL
   const SERVER_URL = "https://ai-mode-queries-server.vercel.app";
   ```

2. **Handle Icons (Optional)**
   
   Option A: Remove icon references from `extension/manifest.json`:
   ```json
   {
     "name": "AI-Mode Queries Finder",
     "description": "Logs Google AI-Mode searches (udm=50) and displays analytics.",
     "version": "1.0.0",
     "manifest_version": 3,
     "permissions": ["webNavigation", "storage", "tabs", "activeTab"],
     "host_permissions": ["https://www.google.*/*", "https://*.vercel.app/*"],
     "background": {
       "service_worker": "background.js",
       "type": "module"
     },
     "action": {
       "default_popup": "popup.html",
       "default_title": "AI Mode Queries"
     }
   }
   ```
   
   Option B: Create simple icons using ImageMagick:
   ```bash
   cd extension/icons/
   # Create simple colored icons
   convert -size 128x128 xc:'#4285f4' icon128.png
   convert -size 48x48 xc:'#4285f4' icon48.png
   convert -size 32x32 xc:'#4285f4' icon32.png
   convert -size 16x16 xc:'#4285f4' icon16.png
   ```

## 🧪 Step 4: Test Complete System

1. **Test Server Endpoints**
   ```bash
   # Health check
   curl https://ai-mode-queries-server.vercel.app/
   
   # Should return: {"status":"ok","message":"AI Mode Queries Server","timestamp":"..."}
   ```

2. **Load Extension in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `extension/` folder
   - Note the extension ID generated

3. **Test Extension Detection**
   - Click extension icon → "service worker" → "Inspect"
   - In new tab: `https://www.google.com/search?q=test&udm=50`
   - Check console for: "AI Mode query stored successfully"

4. **Test Extension Popup**
   - Click the extension icon in Chrome toolbar
   - Should show: "🟢 Connected" and user ID
   - Should display your test query
   - Try CSV download button

## 🔍 Step 5: Troubleshooting

### Common Issues

**1. Extension shows "🔴 Offline"**
```bash
# Check server is running
curl https://your-app.vercel.app/

# Check Vercel logs (from server directory)
cd server/
vercel logs
```

**2. "Failed to store query" errors**
- Verify MongoDB connection string in Vercel env vars
- Check MongoDB Atlas network access allows 0.0.0.0/0
- Verify database user has correct permissions

**3. CORS errors in extension**
- Ensure `host_permissions` in manifest includes your domain
- Check server CORS configuration in `server/index.js`

**4. No queries appearing in popup**
- Ensure you performed an AI Mode search (`udm=50`)
- Check if user ID is generated (extension storage)
- Verify server endpoints are working

### Debug Steps

1. **Check Extension Console**
   ```
   chrome://extensions/ → Your Extension → "service worker" → "Inspect"
   ```

2. **Check Server Logs**
   ```bash
   cd server/
   vercel logs --follow
   ```

3. **Test API Manually**
   ```bash
   # Test storing a query
   curl -X POST https://your-app.vercel.app/api/ai-search \
     -H "Content-Type: application/json" \
     -d '{"uid":"test-123","query":"test","full_url":"https://example.com","ts":1703123456789}'
   
   # Test retrieving queries
   curl https://your-app.vercel.app/api/queries/test-123
   ```

## 🚀 Step 6: Production Deployment

### For Chrome Web Store

1. **Prepare Extension Package**
   ```bash
   cd extension/
   zip -r ../ai-mode-queries-extension.zip . -x "*.DS_Store" "test-local.html"
   ```

2. **Chrome Web Store Developer Console**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay $5 one-time registration fee
   - Upload ZIP file
   - Fill out store listing
   - Submit for review

### For Production Server

1. **Custom Domain (Optional)**
   ```bash
   # In Vercel dashboard, add custom domain
   # Update extension URLs to use custom domain
   ```

2. **Environment Security**
   - Use strong MongoDB passwords
   - Enable MongoDB Atlas IP restrictions
   - Consider rate limiting in production

3. **Monitoring**
   ```bash
   # Set up monitoring (from server directory)
   cd server/
   vercel logs --follow
   
   # MongoDB Atlas monitoring
   # Check cluster metrics in Atlas dashboard
   ```

## ✅ Deployment Checklist

- [ ] MongoDB cluster created and configured
- [ ] Database user created with appropriate permissions
- [ ] Network access configured (0.0.0.0/0 for development)
- [ ] Vercel project deployed successfully from server/ directory
- [ ] Environment variables set in Vercel
- [ ] Extension URLs updated to point to production server
- [ ] Extension loaded in Chrome and tested
- [ ] AI Mode search detection working
- [ ] Popup displaying queries correctly
- [ ] CSV download working
- [ ] Server health check returning OK
- [ ] MongoDB storing queries successfully

## 📞 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review server logs: `cd server/ && vercel logs`
3. Test API endpoints manually
4. Verify MongoDB Atlas connection
5. Check Chrome extension console

Your deployment is now complete! 🎉 