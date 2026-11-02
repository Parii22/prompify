/**
 * Formats and sends a standardized success response.
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {number} [options.statusCode=200]
 * @param {string} [options.message='Success']
 * @param {any} [options.data=null]
 */
export const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null } = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Formats and sends a standardized error response.
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {number} [options.statusCode=500]
 * @param {string} [options.message='Internal Server Error']
 * @param {any} [options.errors=null]
 */
export const sendError = (res, { statusCode = 500, message = 'Internal Server Error', errors = null } = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};
