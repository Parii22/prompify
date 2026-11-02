import { sendError } from '../utils/apiResponse.js';

export const notFoundMiddleware = (req, res) => {
  return sendError(res, {
    statusCode: 404,
    message: `Endpoint not found: [${req.method}] ${req.originalUrl}`,
  });
};
