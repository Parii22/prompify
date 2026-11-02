import { Router } from 'express';
import {
  handleGetHistory,
  handleGetHistoryById,
  handleSaveHistory,
} from '../controllers/history.controller.js';

const router = Router();

// GET /api/history - Paginated history list
router.get('/', handleGetHistory);

// POST /api/history/save - Explicit persistence / retry without re-executing LLM
router.post('/save', handleSaveHistory);

// GET /api/history/:id - Fetch individual record details
router.get('/:id', handleGetHistoryById);

export default router;

