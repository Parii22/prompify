import api from './api.js';

/**
 * Checks backend health status via /api/health
 */
export const checkBackendHealth = async () => {
  return await api.get('/health');
};
