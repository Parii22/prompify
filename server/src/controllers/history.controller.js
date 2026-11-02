import * as supabaseService from '../services/supabase.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Controller to fetch paginated prompt refinement history.
 * Endpoint: GET /api/history
 */
export const handleGetHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, variant = 'all', search = '' } = req.query;

  // Check if Supabase credentials are configured
  if (!supabaseService.isSupabaseConfigured()) {
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Supabase database is not configured. History archive is empty.',
      data: {
        configured: false,
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
        hasMore: false,
        notice: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env to activate live history storage.',
      },
    });
  }

  const result = await supabaseService.getPromptRuns({
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 20,
    variant: String(variant || 'all'),
    search: String(search || ''),
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'History records retrieved successfully.',
    data: {
      configured: true,
      ...result,
    },
  });
});

/**
 * Controller to fetch a single history record by UUID.
 * Endpoint: GET /api/history/:id
 */
export const handleGetHistoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return sendError(res, {
      statusCode: 400,
      message: 'Record ID parameter is required.',
    });
  }

  if (!supabaseService.isValidUUID(id)) {
    return sendError(res, {
      statusCode: 400,
      message: `Invalid record ID format: "${id}". Must be a valid UUIDv4.`,
    });
  }

  if (!supabaseService.isSupabaseConfigured()) {
    return sendError(res, {
      statusCode: 503,
      message: 'Supabase database is not configured in server environment.',
    });
  }

  const record = await supabaseService.getPromptRunById(id);

  if (!record) {
    return sendError(res, {
      statusCode: 404,
      message: `Prompt run record with ID "${id}" was not found.`,
    });
  }

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Prompt run record retrieved successfully.',
    data: record,
  });
});

/**
 * Controller to save or retry saving a completed workflow result to Supabase.
 * Allows saving without re-running Gemini executions.
 * Endpoint: POST /api/history/save
 */
export const handleSaveHistory = asyncHandler(async (req, res) => {
  const {
    originalPrompt,
    objective,
    analysis,
    refinedVersions,
    selectedVariant,
    selectedRefinedPrompt,
    originalResponse,
    refinedResponse,
    evaluation,
    model,
    provider,
  } = req.body;

  if (!originalPrompt || typeof originalPrompt !== 'string' || !originalPrompt.trim()) {
    return sendError(res, {
      statusCode: 400,
      message: 'Field "originalPrompt" is required.',
    });
  }

  if (!selectedRefinedPrompt || typeof selectedRefinedPrompt !== 'string' || !selectedRefinedPrompt.trim()) {
    return sendError(res, {
      statusCode: 400,
      message: 'Field "selectedRefinedPrompt" is required.',
    });
  }

  if (!originalResponse || !refinedResponse) {
    return sendError(res, {
      statusCode: 400,
      message: 'Fields "originalResponse" and "refinedResponse" are required.',
    });
  }

  if (!evaluation || typeof evaluation !== 'object') {
    return sendError(res, {
      statusCode: 400,
      message: 'Field "evaluation" object is required.',
    });
  }

  if (!supabaseService.isSupabaseConfigured()) {
    return sendError(res, {
      statusCode: 503,
      message: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env.',
    });
  }

  const savedRecord = await supabaseService.savePromptRun({
    original_prompt: originalPrompt,
    objective,
    analysis,
    refined_versions: refinedVersions,
    selected_variant: selectedVariant || 'balanced',
    selected_refined_prompt: selectedRefinedPrompt,
    original_response: originalResponse,
    refined_response: refinedResponse,
    evaluation,
    model,
    provider: provider || 'gemini',
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Workflow record successfully saved to Supabase.',
    data: {
      recordId: savedRecord.id,
      savedAt: savedRecord.created_at,
      record: savedRecord,
    },
  });
});

