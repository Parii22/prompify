import api from './api.js';

/**
 * Fetches paginated history records from the backend.
 *
 * @param {Object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @param {string} [params.variant='all']
 * @param {string} [params.search='']
 * @returns {Promise<Object>}
 */
export const fetchHistory = async ({
  page = 1,
  limit = 20,
  variant = 'all',
  search = '',
} = {}) => {
  const queryParams = new URLSearchParams();
  if (page) queryParams.append('page', page);
  if (limit) queryParams.append('limit', limit);
  if (variant && variant !== 'all') queryParams.append('variant', variant);
  if (search && search.trim()) queryParams.append('search', search.trim());

  const url = `/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return await api.get(url);
};

/**
 * Fetches an individual run record by its UUID.
 *
 * @param {string} id
 * @returns {Promise<Object>}
 */
export const fetchHistoryItem = async (id) => {
  return await api.get(`/history/${encodeURIComponent(id)}`);
};

/**
 * Saves or retries saving a completed prompt run to Supabase.
 *
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const savePromptRun = async (payload) => {
  return await api.post('/history/save', payload);
};

