import Groq from 'groq-sdk';
import { envConfig } from '../config/env.config.js';

let groqClient = null;

/**
 * Retries an asynchronous Groq API operation if a 429 rate limit is encountered,
 * extracting the dynamic wait time if returned by the API.
 */
async function executeWithRateLimitRetry(fn, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit =
        err?.status === 429 ||
        err?.statusCode === 429 ||
        (err?.message && (err.message.includes('429') || err.message.includes('rate_limit') || err.message.includes('Rate limit')));

      if (isRateLimit && attempt < maxRetries) {
        const match = err?.message?.match(/try again in ([\d\.]+)s/i);
        const waitMs = match
          ? Math.min(Math.ceil(parseFloat(match[1]) * 1000) + 1000, 15000)
          : (attempt + 1) * 3500;

        console.warn(`[Groq Service] Rate limit reached. Automatically waiting ${waitMs}ms before retry ${attempt + 1}/${maxRetries}...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Initializes and returns the Groq client singleton.
 * Throws a descriptive configuration error if GROQ_API_KEY is missing.
 */
export const getGroqClient = () => {
  const apiKey = envConfig.groq.apiKey?.trim();

  if (!apiKey) {
    const error = new Error(
      'Groq API key is not configured on the server. Please set GROQ_API_KEY in your server/.env file.'
    );
    error.statusCode = 503;
    error.code = 'GROQ_KEY_MISSING';
    throw error;
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }

  return groqClient;
};

/**
 * Executes a standard text generation request against Groq LLM.
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
  model = envConfig.groq.model,
  temperature = 0.7,
}) => {
  const client = getGroqClient();
  const selectedModel = model || envConfig.groq.model || 'openai/gpt-oss-120b';
  console.log(`[Groq Service] Generating text content with "${selectedModel}"...`);
  const startTime = Date.now();

  try {
    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const completion = await executeWithRateLimitRetry(() =>
      client.chat.completions.create({
        model: selectedModel,
        messages,
        temperature,
      })
    );

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      throw new Error('Groq API returned an empty response.');
    }

    console.log(`[Groq Service] Text generation completed in ${Date.now() - startTime}ms`);
    return text.trim();
  } catch (error) {
    handleGroqError(error, selectedModel);
  }
};

/**
 * Executes a structured content generation request against Groq LLM.
 *
 * @param {Object} options
 * @param {string} options.systemInstruction - System guidelines for the model
 * @param {string} options.prompt - User prompt and instructions
 * @param {string} [options.schemaDescription] - Human-readable or JSON string schema representation
 * @param {string} [options.model] - Specific model to use, defaults to env config
 * @param {number} [options.temperature=0.7]
 * @returns {Promise<Object>} Parsed JSON response from Groq
 */
export const generateStructuredContent = async ({
  systemInstruction,
  prompt,
  schemaDescription = '',
  model = envConfig.groq.model,
  temperature = 0.7,
}) => {
  const client = getGroqClient();
  const selectedModel = model || envConfig.groq.model || 'openai/gpt-oss-120b';
  console.log(`[Groq Service] Calling model "${selectedModel}" with structured JSON output...`);
  const startTime = Date.now();

  try {
    let fullSystemInstruction = systemInstruction;
    if (schemaDescription) {
      fullSystemInstruction += `\n\nCRITICAL OUTPUT REQUIREMENT:
You MUST respond with ONLY a valid, parseable JSON object matching this schema specification exactly:
${schemaDescription}`;
    }

    const messages = [
      { role: 'system', content: fullSystemInstruction },
      { role: 'user', content: prompt },
    ];

    const completion = await executeWithRateLimitRetry(() =>
      client.chat.completions.create({
        model: selectedModel,
        messages,
        response_format: { type: 'json_object' },
        temperature,
      })
    );

    console.log(`[Groq Service] Completed in ${Date.now() - startTime}ms`);
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Groq API returned an empty response.');
    }

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('[Groq Service] JSON parse failure on response:', responseText);
      throw new Error('Failed to parse structured Groq model response as valid JSON.');
    }
  } catch (error) {
    handleGroqError(error, selectedModel);
  }
};

/**
 * Common error mapping helper for Groq SDK errors
 */
function handleGroqError(error, model) {
  console.error('[Groq Service Error]:', error.message || error);

  if (error.statusCode === 503 && error.code === 'GROQ_KEY_MISSING') {
    throw error;
  }

  const message = error.message || '';
  const status = error.status || error.statusCode;

  if (status === 401 || message.includes('invalid_api_key') || message.includes('Unauthorized')) {
    const authError = new Error('Invalid Groq API key provided in server environment.');
    authError.statusCode = 401;
    throw authError;
  }

  if (status === 429 || message.includes('rate_limit') || message.includes('quota') || message.includes('429')) {
    const quotaError = new Error('Groq API rate limit or quota exceeded.');
    quotaError.statusCode = 429;
    throw quotaError;
  }

  if (status === 404 || message.includes('model_not_found') || message.includes('does not exist')) {
    const modelError = new Error(`Groq model "${model}" was not found or is unavailable.`);
    modelError.statusCode = 404;
    throw modelError;
  }

  const apiError = new Error(
    error.message || 'An unexpected error occurred during Groq API execution.'
  );
  apiError.statusCode = status || 500;
  throw apiError;
}
