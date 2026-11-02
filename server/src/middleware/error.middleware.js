import { sendError } from '../utils/apiResponse.js';

export const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  return sendError(res, {
    statusCode,
    message,
    errors: null,
  });
};
