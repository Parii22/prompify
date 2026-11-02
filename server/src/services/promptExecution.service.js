import { generateTextContent } from './gemini.service.js';
import { envConfig } from '../config/env.config.js';

/**
 * Executes a single prompt using the configured Gemini model.
 *
 * @param {Object} options
 * @param {string} options.prompt
 * @param {string} [options.model]
 * @param {number} [options.temperature=0.7]
 * @returns {Promise<string>}
 */
export const executePrompt = async ({ prompt, model = envConfig.gemini.model, temperature = 0.7 }) => {
  return await generateTextContent({
    prompt,
    model,
    temperature,
  });
};

/**
 * Executes both original and refined prompts side-by-side using identical
 * model and generation parameters to ensure a completely fair comparison.
 *
 * @param {Object} options
 * @param {string} options.originalPrompt
 * @param {string} options.refinedPrompt
 * @param {string} [options.model]
 * @param {number} [options.temperature=0.7]
 * @returns {Promise<{ originalResponse: string, refinedResponse: string, latencyMs: { original: number, refined: number } }>}
 */
export const executeDualPrompts = async ({
  originalPrompt,
  refinedPrompt,
  model = envConfig.gemini.model,
  temperature = 0.7,
}) => {
  const modelName = model || 'gemini-3.5-flash';

  const startOriginal = Date.now();
  const originalPromise = generateTextContent({
    prompt: originalPrompt,
    model: modelName,
    temperature,
  }).then((res) => ({
    text: res,
    latency: Date.now() - startOriginal,
  }));

  const startRefined = Date.now();
  const refinedPromise = generateTextContent({
    prompt: refinedPrompt,
    model: modelName,
    temperature,
  }).then((res) => ({
    text: res,
    latency: Date.now() - startRefined,
  }));

  // Execute both in parallel for optimal throughput
  const [originalResult, refinedResult] = await Promise.all([
    originalPromise,
    refinedPromise,
  ]);

  return {
    originalResponse: originalResult.text,
    refinedResponse: refinedResult.text,
    latencyMs: {
      original: originalResult.latency,
      refined: refinedResult.latency,
    },
  };
};
