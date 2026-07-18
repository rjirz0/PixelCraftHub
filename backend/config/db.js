import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URl || process.env.MONGODB_URL;

let mongoConnectionPromise = null;

/**
 * Establishes a connection to the MongoDB Atlas database.
 * Falls back to local JSON persistence if the URI is not configured.
 */
export async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('[MONGO] MONGODB_URl environment variable is not configured. Falling back to local leads.json.');
    return null;
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(MONGODB_URI, {
      dbName: 'BETA_REGISTRY',
      serverSelectionTimeoutMS: 5000,
    })
    .then((conn) => {
      console.log('[MONGO] Connected to MongoDB Atlas - targeting database: BETA_REGISTRY');
      return conn;
    })
    .catch((err) => {
      console.error('[MONGO] Failed to connect to MongoDB Atlas:', err.message);
      mongoConnectionPromise = null; // Reset promise to allow retry on the next request
      return null;
    });
  }

  return mongoConnectionPromise;
}
