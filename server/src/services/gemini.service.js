import { GoogleGenAI } from '@google/genai';
import { envConfig } from '../config/env.config.js';

let aiClient = null;

/**
 * Initializes and returns the GoogleGenAI client singleton.
 * Throws a descriptive configuration error if GEMINI_API_KEY is missing.
 */
export const getGeminiClient = () => {
  const apiKey = envConfig.gemini.apiKey?.trim();

  if (!apiKey) {
    const error = new Error(
      'Gemini API key is not configured on the server. Please set GEMINI_API_KEY in your server/.env file.'
    );
    error.statusCode = 503;
    error.code = 'GEMINI_KEY_MISSING';
    throw error;
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }

  return aiClient;
};

/**
 * Executes a standard text generation request against Gemini LLM.
 *
 * @param {Object} options
 * @param {string} options.prompt - Prompt text to execute
 * @param {string} [options.systemInstruction] - Optional system guidelines
 * @param {string} [options.model] - Specific model name
 * @param {number} [options.temperature=0.7] - Generation temperature
 * @returns {Promise<string>} Generated text content
 */
export const generateTextContent = async ({
  prompt,
  systemInstruction,
  model = envConfig.gemini.model,
  temperature = 0.7,
}) => {
  const client = getGeminiClient();
  const selectedModel = model || 'gemini-3.5-flash';
  console.log(`[Gemini Service] Generating text content with "${selectedModel}"...`);
  const startTime = Date.now();

  try {
    const config = { temperature };
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const response = await client.models.generateContent({
      model: selectedModel,
      contents: prompt,
      config,
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini API returned an empty response.');
    }

    console.log(`[Gemini Service] Text generation completed in ${Date.now() - startTime}ms`);
    return text.trim();
  } catch (error) {
    handleGeminiError(error, selectedModel);
  }
};

/**
 * Executes a structured content generation request against Gemini LLM.
 *
 * @param {Object} options
 * @param {string} options.systemInstruction - System guidelines for the model
 * @param {string} options.prompt - User prompt and instructions
 * @param {Object} options.schema - JSON Schema defining expected output structure
 * @param {string} [options.model] - Specific model to use, defaults to env config
 * @returns {Promise<Object>} Parsed JSON response from Gemini
 */
export const generateStructuredContent = async ({
  systemInstruction,
  prompt,
  schema,
  model = envConfig.gemini.model,
}) => {
  const client = getGeminiClient();
  const selectedModel = model || 'gemini-3.5-flash';
  console.log(`[Gemini Service] Calling model "${selectedModel}" with structured schema...`);
  const startTime = Date.now();

  try {
    const response = await client.models.generateContent({
      model: selectedModel,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    console.log(`[Gemini Service] Completed in ${Date.now() - startTime}ms`);
    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini API returned an empty response.');
    }

    // Safely parse structured JSON output
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('[Gemini Service] JSON parse failure on response:', responseText);
      throw new Error('Failed to parse structured model response as valid JSON.');
    }
  } catch (error) {
    handleGeminiError(error, selectedModel);
  }
};

/**
 * Common error mapping helper for Gemini SDK errors
 */
function handleGeminiError(error, model) {
  console.error('[Gemini Service Error]:', error.message || error);

  if (error.statusCode === 503 && error.code === 'GEMINI_KEY_MISSING') {
    throw error;
  }

  const message = error.message || '';

  if (message.includes('API_KEY_INVALID') || message.includes('API key not valid')) {
    const authError = new Error('Invalid Gemini API key provided in server environment.');
    authError.statusCode = 401;
    throw authError;
  }

  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429') || message.includes('quota')) {
    const quotaError = new Error('Gemini API rate limit or quota exceeded. Please wait a moment and retry.');
    quotaError.statusCode = 429;
    throw quotaError;
  }

  if (message.includes('NOT_FOUND') || message.includes('model not found') || message.includes('no longer available')) {
    const modelError = new Error(`Gemini model "${model}" was not found or is unavailable.`);
    modelError.statusCode = 404;
    throw modelError;
  }

  const apiError = new Error(
    error.message || 'An unexpected error occurred during Gemini API execution.'
  );
  apiError.statusCode = error.statusCode || 500;
  throw apiError;
}
