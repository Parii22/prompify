import { Router } from 'express';
import healthRoutes from './health.route.js';
import promptRoutes from './prompt.route.js';
import historyRoutes from './history.route.js';

const router = Router();

// System health routes
router.use('/health', healthRoutes);

// Prompt analysis, refinement, and execution comparison routes (Phases 3 & 4)
router.use('/prompts', promptRoutes);

// Supabase history and run archive routes (Phase 5)
router.use('/history', historyRoutes);

export default router;
