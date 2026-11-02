/**
 * Centralized API client service for communicating with the backend.
 * Uses VITE_API_BASE_URL defined in environment variables.
 */

const defaultBaseUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? '/api'
  : 'http://localhost:5001/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultBaseUrl;

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Generic fetch wrapper with JSON serialization and centralized error handling
 * @param {string} endpoint - Relative path (e.g. '/health')
 * @param {RequestInit} [options={}] - Standard fetch options
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = result?.message || `HTTP error! Status: ${response.status}`;
      throw new ApiError(errorMessage, response.status, result?.errors);
    }

    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or parser error
    throw new ApiError(error.message || 'Network connection failed', 0, null);
  }
}

export default {
  get: (endpoint, options) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) =>
    apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    }),
  put: (endpoint, body, options) =>
    apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    }),
  delete: (endpoint, options) => apiRequest(endpoint, { method: 'DELETE', ...options }),
};
