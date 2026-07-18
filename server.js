import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets directly from root folder
app.use(express.static(__dirname));

// DB File path for lead submission fallback
const LEADS_FILE = path.join(__dirname, 'leads.json');

// Ensure leads.json file database exists
if (!fs.existsSync(LEADS_FILE)) {
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2));
  } catch (err) {
    console.error('Failed to initialize leads database:', err);
  }
}

// MongoDB Connection URI handling (supports both casing variations)
const MONGODB_URI = process.env.MONGODB_URl || process.env.MONGODB_URL;

// Define Mongoose Schema
const leadSchema = new mongoose.Schema({
  email: { type: String, required: true },
  accessKey: { type: String, default: '' },
  source: { type: String, default: 'Static HTML Pixel Realms Portal' },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'activated' }
});

// Avoid OverwriteModelError
const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

let mongoConnectionPromise = null;

async function getMongoConnection() {
  if (!MONGODB_URI) {
    console.warn('[MONGO] MONGODB_URl environment variable is not configured. Falling back to local leads.json.');
    return null;
  }
  
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    .then((conn) => {
      console.log('[MONGO] Connected to MongoDB Atlas successfully.');
      return conn;
    })
    .catch((err) => {
      console.error('[MONGO] Failed to connect to MongoDB Atlas:', err.message);
      mongoConnectionPromise = null; // reset to allow retry on next request
      return null;
    });
  }

  return mongoConnectionPromise;
}

// Early attempt to connect, but catch error so server doesn't crash on startup
getMongoConnection().catch(() => {});

// Health check API
app.get('/api/health', async (req, res) => {
  const dbUriExists = !!MONGODB_URI;
  let isConnected = false;
  try {
    const conn = await getMongoConnection();
    isConnected = !!conn && mongoose.connection.readyState === 1;
  } catch (e) {
    console.error('[HEALTH] Error connecting to MongoDB during health check:', e.message);
  }

  res.json({
    status: 'ok',
    database: isConnected ? 'mongodb' : 'local_json',
    mongoConfigured: dbUriExists,
    mongoConnected: isConnected
  });
});

// API endpoint to save new lead
app.post('/api/leads', async (req, res) => {
  try {
    const { email, accessKey, source, timestamp, status } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const conn = await getMongoConnection();
    if (conn) {
      // Save to MongoDB
      const newLead = new Lead({
        email,
        accessKey: accessKey || '',
        source: source || 'Static HTML Pixel Realms Portal',
        timestamp: timestamp || new Date().toISOString(),
        status: status || 'activated'
      });
      await newLead.save();
      console.log(`[MONGO] Registered new closed beta miner in Atlas: ${email}`);
      
      const count = await Lead.countDocuments();
      return res.status(201).json({ success: true, lead: newLead, count });
    } else {
      // Fallback to local leads.json
      let leads = [];
      if (fs.existsSync(LEADS_FILE)) {
        leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8') || '[]');
      }

      const newLead = {
        id: Date.now().toString(),
        email,
        accessKey: accessKey || '',
        source: source || 'Static HTML Pixel Realms Portal',
        timestamp: timestamp || new Date().toISOString(),
        status: status || 'activated'
      };

      leads.push(newLead);
      fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));

      console.log(`[LEADS] Registered new closed beta miner in local JSON: ${email}`);
      return res.status(201).json({ success: true, lead: newLead, count: leads.length });
    }
  } catch (err) {
    console.error('Failed to save lead:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API endpoint to retrieve all registered leads
app.get('/api/leads', async (req, res) => {
  try {
    const conn = await getMongoConnection();
    if (conn) {
      const leads = await Lead.find({}).sort({ timestamp: -1 });
      return res.json(leads);
    } else {
      let leads = [];
      if (fs.existsSync(LEADS_FILE)) {
        leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8') || '[]');
      }
      return res.json(leads);
    }
  } catch (err) {
    console.error('Failed to read leads:', err);
    res.status(500).json({ error: 'Failed to read database' });
  }
});

// Fallback to serving index.html for general paths
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Pixel Realms Backend Server] Active and running on http://0.0.0.0:${PORT}`);
});
