import api from './api.js';

/**
 * Sends a prompt and optional objective to the backend refinement endpoint.
 *
 * @param {Object} data
 * @param {string} data.prompt - Raw prompt string
 * @param {string} [data.objective] - Optional target outcome
 * @param {string} [data.forceProvider] - Optional provider override ('groq' | 'gemini')
 * @returns {Promise<Object>} API result containing dynamic analysis and 3 refined variants
 */
export const refinePrompt = async ({ prompt, objective = '', forceProvider = null }) => {
  return await api.post('/prompts/refine', {
    prompt,
    objective,
    ...(forceProvider ? { forceProvider } : {}),
  });
};

/**
 * Executes both original and refined prompts, evaluates responses,
 * and automatically persists to Supabase database.
 *
 * @param {Object} data
 * @param {string} data.originalPrompt
 * @param {string} data.refinedPrompt
 * @param {string} [data.objective]
 * @param {string} [data.selectedVariant]
 * @param {Object} [data.analysis]
 * @param {Object} [data.refinedVersions]
 * @param {string} [data.forceProvider] - Optional provider override ('groq' | 'gemini')
 * @returns {Promise<Object>} API result containing both AI responses, 5-criteria evaluation & persistence status
 */
export const comparePrompts = async ({
  originalPrompt,
  refinedPrompt,
  objective = '',
  selectedVariant = 'balanced',
  analysis = null,
  refinedVersions = null,
  forceProvider = null,
}) => {
  return await api.post('/prompts/compare', {
    originalPrompt,
    refinedPrompt,
    objective,
    selectedVariant,
    analysis,
    refinedVersions,
    ...(forceProvider ? { forceProvider } : {}),
  });
};
