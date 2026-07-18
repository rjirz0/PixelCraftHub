import express from 'express';
import { generateGameHint } from '../controllers/geminiController.js';
import { writeActionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Routes for /api/gemini
router.post('/hint', writeActionLimiter, generateGameHint);

export default router;
