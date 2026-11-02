import { Router } from 'express';
import { handleRefinePrompt, handleComparePrompts } from '../controllers/prompt.controller.js';

const router = Router();

// POST /api/prompts/refine
router.post('/refine', handleRefinePrompt);

// POST /api/prompts/compare
router.post('/compare', handleComparePrompts);

export default router;
