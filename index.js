const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['chrome-extension://*', 'http://localhost:*', 'https://*.vercel.app'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// MongoDB connection
let db;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

// Connect to MongoDB
MongoClient.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(client => {
  console.log('Connected to MongoDB');
  db = client.db('ai-mode-queries');
})
.catch(error => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AI Mode Queries Server',
    timestamp: new Date().toISOString()
  });
});

// Store AI search query
app.post('/api/ai-search', async (req, res) => {
  try {
    const { uid, query, full_url, ts } = req.body;
    
    if (!uid || !query || !full_url || !ts) {
      return res.status(400).json({
        error: 'Missing required fields: uid, query, full_url, ts'
      });
    }

    const queryDoc = {
      uid,
      query: query.trim(),
      full_url,
      timestamp: new Date(ts),
      created_at: new Date(),
      ip_hash: req.ip ? require('crypto').createHash('sha256').update(req.ip).digest('hex').substring(0, 16) : null
    };

    const result = await db.collection('queries').insertOne(queryDoc);
    
    console.log('Query stored:', {
      id: result.insertedId,
      query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
      uid: uid.substring(0, 8) + '...'
    });

    res.status(201).json({
      success: true,
      id: result.insertedId,
      timestamp: queryDoc.created_at
    });

  } catch (error) {
    console.error('Error storing query:', error);
    res.status(500).json({
      error: 'Failed to store query',
      message: error.message
    });
  }
});

// Get queries for a specific user
app.get('/api/queries/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { limit = 100, skip = 0 } = req.query;

    if (!uid || uid.length < 8) {
      return res.status(400).json({
        error: 'Valid uid parameter is required'
      });
    }

    const queries = await db.collection('queries')
      .find({ uid })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .project({
        query: 1,
        full_url: 1,
        timestamp: 1,
        created_at: 1,
        _id: 1
      })
      .toArray();

    const total = await db.collection('queries').countDocuments({ uid });

    res.json({
      success: true,
      queries,
      total,
      count: queries.length,
      uid: uid.substring(0, 8) + '...' // Partial UID for verification
    });

  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({
      error: 'Failed to fetch queries',
      message: error.message
    });
  }
});

// Get all queries (for admin/analytics)
app.get('/api/queries', async (req, res) => {
  try {
    const { limit = 50, skip = 0, search } = req.query;
    
    let filter = {};
    if (search) {
      filter.query = { $regex: search, $options: 'i' };
    }

    const queries = await db.collection('queries')
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .project({
        query: 1,
        timestamp: 1,
        created_at: 1,
        uid: { $substr: ['$uid', 0, 8] }, // Only show first 8 chars of UID
        _id: 1
      })
      .toArray();

    const total = await db.collection('queries').countDocuments(filter);

    res.json({
      success: true,
      queries,
      total,
      count: queries.length
    });

  } catch (error) {
    console.error('Error fetching all queries:', error);
    res.status(500).json({
      error: 'Failed to fetch queries',
      message: error.message
    });
  }
});

// Statistics endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const totalQueries = await db.collection('queries').countDocuments();
    const uniqueUsers = await db.collection('queries').distinct('uid').then(arr => arr.length);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayQueries = await db.collection('queries').countDocuments({
      created_at: { $gte: today }
    });

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const weekQueries = await db.collection('queries').countDocuments({
      created_at: { $gte: last7Days }
    });

    // Top queries
    const topQueries = await db.collection('queries').aggregate([
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 },
          lastSeen: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    res.json({
      success: true,
      stats: {
        totalQueries,
        uniqueUsers,
        todayQueries,
        weekQueries,
        topQueries
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 