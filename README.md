# AI Mode Queries Tracker

A complete solution for tracking Google AI Mode searches (`udm=50`) with MongoDB storage and Chrome extension analytics.

## 🏗️ Project Structure

```
chrome-ext-ai-mode-queries/
├── extension/              # Chrome Extension (Manifest V3)
│   ├── manifest.json      # Extension configuration
│   ├── background.js      # Service worker for query detection
│   ├── popup.html         # Extension popup interface
│   ├── popup.css          # Popup styling
│   ├── popup.js           # Popup functionality
│   ├── test-local.html    # Local testing page
│   └── icons/             # Extension icons
└── server/                # Node.js/Express Server
    ├── package.json       # Server dependencies
    ├── index.js           # Main server application
    ├── vercel.json        # Vercel deployment configuration
    ├── README.md          # Project documentation
    ├── DEPLOYMENT.md      # Deployment guide
    └── .gitignore         # Git ignore rules
```

## ✨ Features

### Chrome Extension
- 🔍 **Auto-detection**: Captures Google AI Mode searches (`udm=50`)
- 📊 **Analytics Popup**: View stored queries with search and pagination
- 📥 **CSV Export**: Download all queries as CSV file
- 🔒 **Privacy-focused**: Anonymous user IDs, no personal data
- 🚀 **Manifest V3**: Future-compatible Chrome extension

### Server
- 🗄️ **MongoDB Storage**: Secure, scalable query storage
- 🌐 **REST API**: Clean endpoints for storing and retrieving data
- 📈 **Analytics**: User statistics and query insights
- 🛡️ **Security**: CORS protection, request validation
- ☁️ **Vercel Ready**: Serverless deployment configuration

## 🚀 Quick Setup

### 1. Server Deployment

1. **Create MongoDB Database**
   ```bash
   # Get MongoDB connection string from MongoDB Atlas or local instance
   # Example: mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/ai-mode-queries
   ```

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy from server directory
   cd server/
   vercel
   
   # Set environment variable in Vercel dashboard or CLI:
   vercel env add MONGODB_URI
   # Paste your MongoDB connection string
   ```

3. **Note Your Deployment URL**
   ```
   # Your app will be deployed to something like:
   https://your-app-name.vercel.app
   ```

### 2. Configure Extension

1. **Update Server URLs**
   ```javascript
   // In extension/background.js, line 2:
   const COLLECT_URL = "https://your-app-name.vercel.app/api/ai-search";
   
   // In extension/popup.js, line 2:
   const SERVER_URL = "https://your-app-name.vercel.app";
   ```

2. **Load Extension in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/` folder

## 🧪 Testing

### Extension Testing

1. **Load the extension** (see setup above)
2. **Open service worker console**:
   - Go to `chrome://extensions/`
   - Find your extension
   - Click "service worker" → "Inspect"
3. **Test AI Mode search**:
   - Visit: `https://www.google.com/search?q=test&udm=50`
   - Check console for success logs
4. **Test popup**:
   - Click extension icon in Chrome toolbar
   - Verify queries are displayed

### Server Testing

```bash
# Test health endpoint
curl https://your-app-name.vercel.app/

# Test query submission
curl -X POST https://your-app-name.vercel.app/api/ai-search \
  -H "Content-Type: application/json" \
  -d '{"uid":"test-user","query":"test query","full_url":"https://example.com","ts":1703123456789}'

# Test query retrieval
curl https://your-app-name.vercel.app/api/queries/test-user
```

### Local Development

```bash
# Server development
cd server/
npm install
npm run dev

# Create .env file with your MONGODB_URI in the server/ directory
# Update extension URLs to use localhost:3000
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/api/ai-search` | Store new query |
| `GET` | `/api/queries/:uid` | Get user's queries |
| `GET` | `/api/queries` | Get all queries (admin) |
| `GET` | `/api/stats` | Get analytics stats |

### API Examples

**Store Query:**
```json
POST /api/ai-search
{
  "uid": "user-id",
  "query": "artificial intelligence",
  "full_url": "https://www.google.com/search?q=ai&udm=50",
  "ts": 1703123456789
}
```

**Get User Queries:**
```json
GET /api/queries/user-id?limit=20&skip=0
Response: {
  "success": true,
  "queries": [...],
  "total": 45,
  "count": 20
}
```

## 🔧 Configuration

### Environment Variables

Create `server/.env`:
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/ai-mode-queries
PORT=3000
NODE_ENV=production
```

### Extension Configuration

Key files to update after deployment:
- `extension/background.js` - Update `COLLECT_URL`
- `extension/popup.js` - Update `SERVER_URL`

## 🛡️ Privacy & Security

- **Anonymous IDs**: Uses `crypto.randomUUID()` for user identification
- **No Personal Data**: Only stores search queries and timestamps
- **CORS Protection**: Server configured for extension security
- **Data Validation**: All inputs validated on server side
- **IP Hashing**: Optional IP address hashing for analytics

## 📈 Analytics

The popup provides:
- Query count and history
- Search functionality
- CSV export capability
- Pagination for large datasets

Server analytics endpoint provides:
- Total queries across all users
- Unique user count
- Daily/weekly query trends
- Top search queries

## 🔄 Updates & Maintenance

### Extension Updates
1. Update version in `extension/manifest.json`
2. Package as ZIP for Chrome Web Store
3. Update store listing with new features

### Server Updates
```bash
# Deploy updates from server directory
cd server/
vercel --prod

# Monitor logs
vercel logs
```

### Database Maintenance
- Monitor storage usage in MongoDB Atlas
- Set up automated backups
- Consider data retention policies

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 📄 License

[Add your license here]

## 🆘 Support

Common issues and solutions:

**Extension not detecting searches:**
- Verify you're using `udm=50` in Google search URLs
- Check service worker console for errors
- Ensure server URL is correct

**Popup showing "disconnected":**
- Verify server is deployed and accessible
- Check CORS configuration
- Confirm MongoDB connection

**No queries in popup:**
- Perform an AI Mode search first
- Check network tab for API requests
- Verify user ID is generated correctly 