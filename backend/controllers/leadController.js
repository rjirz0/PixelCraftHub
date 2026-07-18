import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Lead from '../models/Lead.js';
import { connectDB } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store the fallback database at the project root
const LEADS_FILE = path.join(__dirname, '..', '..', 'leads.json');

/**
 * Ensures the fallback leads.json database is initialized.
 */
function ensureLocalFile() {
  if (!fs.existsSync(LEADS_FILE)) {
    try {
      fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2));
    } catch (err) {
      console.error('Failed to initialize local leads.json backup database:', err);
    }
  }
}

/**
 * Controller: Register a new Closed Beta miner.
 */
export async function createLead(req, res, next) {
  try {
    const { email, accessKey, source, timestamp, status } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const conn = await connectDB();
    if (conn) {
      // Save directly to MongoDB Atlas
      const newLead = new Lead({
        email,
        accessKey: accessKey || '',
        source: source || 'Static HTML Pixel Realms Portal',
        timestamp: timestamp || new Date().toISOString(),
        status: status || 'pending'
      });
      await newLead.save();
      console.log(`[MONGO] Registered new closed beta miner in Atlas: ${email}`);
      
      const count = await Lead.countDocuments();
      return res.status(201).json({ success: true, lead: newLead, count });
    } else {
      // Secure fallback to local file database
      ensureLocalFile();
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
        status: status || 'pending'
      };

      leads.push(newLead);
      fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));

      console.log(`[LOCAL] Registered new closed beta miner in local JSON: ${email}`);
      return res.status(201).json({ success: true, lead: newLead, count: leads.length });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Controller: Get all registered sign-ups.
 */
export async function getLeads(req, res, next) {
  try {
    const conn = await connectDB();
    if (conn) {
      // Retrieve from MongoDB Atlas
      const leads = await Lead.find({}).sort({ timestamp: -1 });
      return res.json(leads);
    } else {
      // Retrieve from local backup database
      ensureLocalFile();
      let leads = [];
      if (fs.existsSync(LEADS_FILE)) {
        leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8') || '[]');
      }
      return res.json(leads);
    }
  } catch (err) {
    next(err);
  }
}
