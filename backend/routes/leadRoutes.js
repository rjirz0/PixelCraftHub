import express from 'express';
import { createLead, getLeads } from '../controllers/leadController.js';
import { writeActionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Routes for /api/leads
router.route('/')
  .get(getLeads)
  .post(writeActionLimiter, createLead);

export default router;
