import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import leadRoutes from './routes/leadRoutes.js';
import geminiRoutes from './routes/geminiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Pre-emptively trigger database connection (connection errors are caught internally)
connectDB().catch(() => {});

// 1. Enable Cross-Origin Resource Sharing
app.use(cors());

// 2. Add Security Headers with Helmet (Configured to support CDN files used by the frontend)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'", 
        "https://cdn.tailwindcss.com", 
        "https://unpkg.com", 
        "https://cdn.jsdelivr.net"
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'", 
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https://*"
      ],
      connectSrc: [
        "'self'"
      ]
    }
  }
}));

// 3. Request body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Global API Rate Limiting to prevent denial of service (DoS) attempts
app.use(globalLimiter);

// 5. Serve static files from the root folder (one level up from /backend)
const rootDir = path.join(__dirname, '..');
app.use(express.static(rootDir));

// 6. DB and Server Health Check Endpoint
app.get('/api/health', async (req, res, next) => {
  try {
    const conn = await connectDB();
    const isConnected = !!conn && conn.readyState === 1;
    res.json({
      status: 'ok',
      database: isConnected ? 'mongodb' : 'local_json',
      mongoConfigured: !!(process.env.MONGODB_URl || process.env.MONGODB_URL),
      mongoConnected: isConnected
    });
  } catch (err) {
    next(err);
  }
});

// 7. Route Handlers
app.use('/api/leads', leadRoutes);
app.use('/api/gemini', geminiRoutes);

// 8. Serve index.html for general frontend paths (SPA Fallback support)
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// 9. Central Error Handler
app.use(errorHandler);

// Start listening for incoming connections
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Pixel Realms Secure Server] Running on http://0.0.0.0:${PORT}`);
});

export default app;
