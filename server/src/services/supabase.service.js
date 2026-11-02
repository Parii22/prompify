import { createClient } from '@supabase/supabase-js';
import { envConfig } from '../config/env.config.js';

let supabaseClient = null;

// Standard UUID format validator
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Checks whether Supabase is configured with valid URL and Service Role Key.
 * @returns {boolean}
 */
export const isSupabaseConfigured = () => {
  const { url, serviceRoleKey } = envConfig.supabase;
  return Boolean(
    url &&
    typeof url === 'string' &&
    url.trim().startsWith('http') &&
    serviceRoleKey &&
    typeof serviceRoleKey === 'string' &&
    serviceRoleKey.trim().length > 10
  );
};

/**
 * Returns the singleton Supabase client using the service role key.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase credentials are not configured or incomplete. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env.'
    );
  }

  if (!supabaseClient) {
    const { url, serviceRoleKey } = envConfig.supabase;
    supabaseClient = createClient(url.trim(), serviceRoleKey.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseClient;
};

/**
 * Validates whether a given string is a valid UUIDv4.
 * @param {string} id
 * @returns {boolean}
 */
export const isValidUUID = (id) => {
  return typeof id === 'string' && UUID_REGEX.test(id.trim());
};

/**
 * Persists a complete prompt refinement, dual execution, and evaluation record to Supabase.
 *
 * @param {Object} runData
 * @param {string} runData.original_prompt
 * @param {string} [runData.objective]
 * @param {Object} [runData.analysis]
 * @param {Object} [runData.refined_versions]
 * @param {string} runData.selected_variant
 * @param {string} runData.selected_refined_prompt
 * @param {string} runData.original_response
 * @param {string} runData.refined_response
 * @param {Object} runData.evaluation
 * @param {string} runData.model
 * @param {string} [runData.provider='gemini']
 * @returns {Promise<Object>} The newly created database record
 */
export const savePromptRun = async (runData) => {
  const client = getSupabaseClient();

  if (!runData.original_prompt || typeof runData.original_prompt !== 'string') {
    throw new Error('Field "original_prompt" is required for database persistence.');
  }
  if (!runData.selected_refined_prompt || typeof runData.selected_refined_prompt !== 'string') {
    throw new Error('Field "selected_refined_prompt" is required for database persistence.');
  }
  if (!runData.original_response || !runData.refined_response) {
    throw new Error('Execution responses are required before persisting to database.');
  }
  if (!runData.evaluation || typeof runData.evaluation !== 'object') {
    throw new Error('Evaluation data is required before persisting to database.');
  }

  const provider = runData.provider || 'gemini';
  const evaluationWithProvider = {
    ...(runData.evaluation && typeof runData.evaluation === 'object' ? runData.evaluation : {}),
    provider,
  };

  const payload = {
    original_prompt: runData.original_prompt.trim(),
    objective: runData.objective && typeof runData.objective === 'string' ? runData.objective.trim() : null,
    analysis: runData.analysis && typeof runData.analysis === 'object' ? runData.analysis : {},
    refined_versions: runData.refined_versions && typeof runData.refined_versions === 'object' ? runData.refined_versions : {},
    selected_variant: runData.selected_variant || 'balanced',
    selected_refined_prompt: runData.selected_refined_prompt.trim(),
    original_response: runData.original_response,
    refined_response: runData.refined_response,
    evaluation: evaluationWithProvider,
    model: runData.model || envConfig.gemini.model || 'gemini-3.5-flash-lite',
    provider,
  };

  // Attempt insert with provider column
  let { data, error } = await client
    .from('prompt_runs')
    .insert([payload])
    .select()
    .single();

  // If table does not yet have 'provider' column, gracefully fallback to inserting without it
  if (error && error.message?.includes('provider')) {
    console.warn('[Supabase Service] Column "provider" not yet in database; saving provider inside evaluation JSONB...');
    delete payload.provider;
    const retry = await client
      .from('prompt_runs')
      .insert([payload])
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('[Supabase Service Save Error]:', error);
    throw new Error(`Database error saving prompt run: ${error.message}`);
  }

  if (data) {
    data.provider = data.provider || data.evaluation?.provider || provider;
  }

  return data;
};

/**
 * Fetches paginated history records from the prompt_runs table.
 *
 * @param {Object} options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {string} [options.variant]
 * @param {string} [options.search]
 * @returns {Promise<Object>} Paginated result with metadata
 */
export const getPromptRuns = async ({
  page = 1,
  limit = 20,
  variant = 'all',
  search = '',
} = {}) => {
  const client = getSupabaseClient();

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const fromIndex = (safePage - 1) * safeLimit;
  const toIndex = fromIndex + safeLimit - 1;

  let query = client
    .from('prompt_runs')
    .select(
      'id, original_prompt, objective, selected_variant, selected_refined_prompt, evaluation, model, created_at',
      { count: 'exact' }
    );

  // Variant filtering
  if (variant && variant !== 'all') {
    query = query.eq('selected_variant', variant.toLowerCase());
  }

  // Search filtering
  if (search && typeof search === 'string' && search.trim().length > 0) {
    query = query.ilike('original_prompt', `%${search.trim()}%`);
  }

  query = query.order('created_at', { ascending: false }).range(fromIndex, toIndex);

  const { data, error, count } = await query;

  if (error) {
    console.error('[Supabase Service Query Error]:', error);
    throw new Error(`Database error fetching prompt runs: ${error.message}`);
  }

  const safeItems = (data || []).map((row) => ({
    ...row,
    provider: row.provider || row.evaluation?.provider || 'gemini',
  }));

  const total = count || 0;
  const totalPages = Math.ceil(total / safeLimit);

  return {
    items: safeItems,
    total,
    page: safePage,
    pageSize: safeLimit,
    totalPages,
    hasMore: safePage < totalPages,
  };
};

/**
 * Fetches an individual run record by its UUID.
 *
 * @param {string} id
 * @returns {Promise<Object>} The full run record
 */
export const getPromptRunById = async (id) => {
  const client = getSupabaseClient();

  if (!isValidUUID(id)) {
    const error = new Error('Invalid run ID format. Must be a valid UUIDv4.');
    error.statusCode = 400;
    throw error;
  }

  const { data, error } = await client
    .from('prompt_runs')
    .select('*')
    .eq('id', id.trim())
    .single();

  if (error || !data) {
    console.error('[Supabase Service GetById Error]:', error);
    const notFoundError = new Error(`Prompt run with ID "${id}" was not found.`);
    notFoundError.statusCode = 404;
    throw notFoundError;
  }

  data.provider = data.provider || data.evaluation?.provider || 'gemini';
  return data;
};

/**
 * Deletes an individual run record by its UUID.
 *
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export const deletePromptRun = async (id) => {
  const client = getSupabaseClient();

  if (!isValidUUID(id)) {
    const error = new Error('Invalid run ID format. Must be a valid UUIDv4.');
    error.statusCode = 400;
    throw error;
  }

  const { error } = await client
    .from('prompt_runs')
    .delete()
    .eq('id', id.trim());

  if (error) {
    console.error('[Supabase Service Delete Error]:', error);
    throw new Error(`Database error deleting prompt run: ${error.message}`);
  }

  return true;
};
