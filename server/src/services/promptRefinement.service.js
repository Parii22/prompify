import * as llmProviderService from './llmProvider.service.js';

/**
 * Analyzes and refines a user prompt using the Dual-LLM Provider System
 * (Primary: Google Gemini, Automatic Fallback: Groq Cloud).
 *
 * @param {Object} params
 * @param {string} params.prompt - Original user prompt
 * @param {string} [params.objective] - Optional goal/target outcome
 * @param {Object} [params.options] - Optional execution controls (forceProvider, simulateError)
 * @returns {Promise<Object>} Structured refinement data with provider and model metadata
 */
export const refinePrompt = async ({ prompt, objective = '', options = {} }) => {
  return await llmProviderService.refinePromptWithFallback({
    prompt,
    objective,
    options,
  });
};
