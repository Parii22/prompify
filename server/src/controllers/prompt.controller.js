import * as promptRefinementService from '../services/promptRefinement.service.js';
import * as llmProviderService from '../services/llmProvider.service.js';
import * as supabaseService from '../services/supabase.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const MAX_PROMPT_LENGTH = 10000;
const MAX_OBJECTIVE_LENGTH = 2000;

/**
 * Controller to handle prompt refinement and dynamic analysis via Dual-LLM System.
 * Primary: Google Gemini, Secondary / Fallback: Groq Cloud.
 * Endpoint: POST /api/prompts/refine
 */
export const handleRefinePrompt = asyncHandler(async (req, res) => {
  const { prompt, objective, forceProvider, simulateError } = req.body;

  // 1. Validation: Prompt presence and type
  if (!prompt || typeof prompt !== 'string') {
    return sendError(res, {
      statusCode: 400,
      message: 'Field "prompt" is required and must be a non-empty string.',
    });
  }

  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length === 0) {
    return sendError(res, {
      statusCode: 400,
      message: 'Field "prompt" cannot be empty or contain only whitespace.',
    });
  }

  if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
    return sendError(res, {
      statusCode: 400,
      message: `Prompt exceeds maximum allowed length of ${MAX_PROMPT_LENGTH} characters.`,
    });
  }

  // 2. Validation: Objective (if provided)
  let cleanObjective = '';
  if (objective !== undefined && objective !== null) {
    if (typeof objective !== 'string') {
      return sendError(res, {
        statusCode: 400,
        message: 'Field "objective" must be a string.',
      });
    }
    cleanObjective = objective.trim();
    if (cleanObjective.length > MAX_OBJECTIVE_LENGTH) {
      return sendError(res, {
        statusCode: 400,
        message: `Objective exceeds maximum allowed length of ${MAX_OBJECTIVE_LENGTH} characters.`,
      });
    }
  }

  // 3. Optional controlled testing parameters (headers or body)
  const effectiveForceProvider = req.headers['x-force-provider'] || forceProvider;
  const effectiveSimulateError = req.headers['x-simulate-error'] || simulateError;

  // 4. Execute refinement with automatic fallback
  const result = await promptRefinementService.refinePrompt({
    prompt: trimmedPrompt,
    objective: cleanObjective,
    options: {
      forceProvider: effectiveForceProvider,
      simulateError: effectiveSimulateError,
    },
  });

  const providerLabel = result.provider === 'groq' ? 'Groq Cloud' : 'Google Gemini';
  const statusMsg = result.fallbackUsed
    ? `Prompt successfully refined via fallback provider: ${providerLabel} (${result.model}).`
    : `Prompt successfully analyzed and refined with ${providerLabel} (${result.model}).`;

  return sendSuccess(res, {
    statusCode: 200,
    message: statusMsg,
    data: result,
  });
});

/**
 * Controller to execute original & refined prompts, evaluate responses,
 * and automatically persist the completed run to Supabase.
 * Enforces provider consistency: both outputs and evaluation run on the SAME provider.
 * Endpoint: POST /api/prompts/compare
 */
export const handleComparePrompts = asyncHandler(async (req, res) => {
  const {
    originalPrompt,
    refinedPrompt,
    objective,
    selectedVariant,
    analysis,
    refinedVersions,
    forceProvider,
    simulateError,
  } = req.body;

  // 1. Validate originalPrompt
  if (!originalPrompt || typeof originalPrompt !== 'string' || originalPrompt.trim().length === 0) {
    return sendError(res, {
      statusCode: 400,
      message: 'Field "originalPrompt" is required and cannot be empty.',
    });
  }

  // 2. Validate refinedPrompt
  if (!refinedPrompt || typeof refinedPrompt !== 'string' || refinedPrompt.trim().length === 0) {
    return sendError(res, {
      statusCode: 400,
      message: 'Field "refinedPrompt" is required and cannot be empty.',
    });
  }

  const cleanOriginal = originalPrompt.trim();
  const cleanRefined = refinedPrompt.trim();

  if (cleanOriginal.length > MAX_PROMPT_LENGTH || cleanRefined.length > MAX_PROMPT_LENGTH) {
    return sendError(res, {
      statusCode: 400,
      message: `Prompt exceeds maximum allowed length of ${MAX_PROMPT_LENGTH} characters.`,
    });
  }

  const cleanObjective = typeof objective === 'string' ? objective.trim() : '';
  const cleanVariant = typeof selectedVariant === 'string' ? selectedVariant.trim() : 'balanced';

  // Optional controlled testing parameters (headers or body)
  const effectiveForceProvider = req.headers['x-force-provider'] || forceProvider;
  const effectiveSimulateError = req.headers['x-simulate-error'] || simulateError;

  console.log(`[Prompt Controller] Starting dual execution and benchmark for variant "${cleanVariant}"...`);

  // Step 1: Execute both prompts & evaluate with automatic single-provider consistency
  const comparisonResults = await llmProviderService.comparePromptsWithFallback({
    originalPrompt: cleanOriginal,
    refinedPrompt: cleanRefined,
    objective: cleanObjective,
    selectedVariant: cleanVariant,
    options: {
      forceProvider: effectiveForceProvider,
      simulateError: effectiveSimulateError,
    },
  });

  // Step 2: Automatic persistence to Supabase with provider metadata
  let persistence = {
    saved: false,
    recordId: null,
    savedAt: null,
    error: null,
  };

  if (supabaseService.isSupabaseConfigured()) {
    try {
      const savedRecord = await supabaseService.savePromptRun({
        original_prompt: cleanOriginal,
        objective: cleanObjective || null,
        analysis: analysis && typeof analysis === 'object' ? analysis : {},
        refined_versions: refinedVersions && typeof refinedVersions === 'object' ? refinedVersions : {},
        selected_variant: cleanVariant,
        selected_refined_prompt: cleanRefined,
        original_response: comparisonResults.originalResponse,
        refined_response: comparisonResults.refinedResponse,
        evaluation: comparisonResults.evaluation,
        model: comparisonResults.model,
        provider: comparisonResults.provider,
      });

      console.log(`[Prompt Controller] Successfully saved run to Supabase: ${savedRecord.id} (Provider: ${comparisonResults.provider})`);
      persistence = {
        saved: true,
        recordId: savedRecord.id,
        savedAt: savedRecord.created_at,
        error: null,
      };
    } catch (dbErr) {
      console.error('[Prompt Controller] Automatic Supabase persistence failed:', dbErr.message);
      persistence = {
        saved: false,
        recordId: null,
        savedAt: null,
        error: dbErr.message || 'Database error occurred while persisting prompt run.',
      };
    }
  } else {
    persistence = {
      saved: false,
      recordId: null,
      savedAt: null,
      error: 'Supabase credentials not configured in server environment.',
    };
  }

  const providerLabel = comparisonResults.provider === 'groq' ? 'Groq Cloud' : 'Google Gemini';
  const statusMsg = comparisonResults.fallbackUsed
    ? `Prompts executed and benchmarked via fallback provider: ${providerLabel} (${comparisonResults.model}).`
    : `Prompts executed and evaluated successfully with ${providerLabel} (${comparisonResults.model}).`;

  return sendSuccess(res, {
    statusCode: 200,
    message: statusMsg,
    data: {
      originalResponse: comparisonResults.originalResponse,
      refinedResponse: comparisonResults.refinedResponse,
      evaluation: comparisonResults.evaluation,
      selectedVariant: cleanVariant,
      executionLatencyMs: comparisonResults.executionLatencyMs,
      model: comparisonResults.model,
      provider: comparisonResults.provider,
      fallbackUsed: comparisonResults.fallbackUsed,
      fallbackReason: comparisonResults.fallbackReason || null,
      generatedAt: comparisonResults.generatedAt,
      persistence,
    },
  });
});
