import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets directly from root folder
app.use(express.static(__dirname));

// DB File path for lead submission
const LEADS_FILE = path.join(__dirname, 'leads.json');

// Ensure leads.json file database exists
if (!fs.existsSync(LEADS_FILE)) {
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2));
  } catch (err) {
    console.error('Failed to initialize leads database:', err);
  }
}

// Health check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'local_json' });
});

// API endpoint to save new lead
app.post('/api/leads', (req, res) => {
  try {
    const { email, accessKey, source, timestamp, status } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

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

    console.log(`[LEADS] Registered new closed beta miner: ${email}`);
    res.status(201).json({ success: true, lead: newLead, count: leads.length });
  } catch (err) {
    console.error('Failed to save lead:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API endpoint to retrieve all registered leads
app.get('/api/leads', (req, res) => {
  try {
    let leads = [];
    if (fs.existsSync(LEADS_FILE)) {
      leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8') || '[]');
    }
    res.json(leads);
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
