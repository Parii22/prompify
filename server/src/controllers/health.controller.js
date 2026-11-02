import * as healthService from '../services/health.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const checkHealth = asyncHandler(async (req, res) => {
  const healthData = healthService.getHealthData();
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Backend API is operational',
    data: healthData,
  });
});
