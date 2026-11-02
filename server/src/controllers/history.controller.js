import { createRequire } from 'module';
import * as supabaseService from '../services/supabase.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const require = createRequire(import.meta.url);
let cachedHistoryArchive = [];
try {
  cachedHistoryArchive = require('../data/cachedHistory.json');
} catch (e) {
  cachedHistoryArchive = [];
}

/**
 * Controller to fetch paginated prompt refinement history.
 * Endpoint: GET /api/history
 */
export const handleGetHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, variant = 'all', search = '' } = req.query;

  // Check if Supabase credentials are configured
  if (!supabaseService.isSupabaseConfigured()) {
    let filtered = [...cachedHistoryArchive];
    if (variant && variant !== 'all') {
      filtered = filtered.filter((i) => i.selected_variant === variant);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (i) =>
          (i.original_prompt && i.original_prompt.toLowerCase().includes(q)) ||
          (i.objective && i.objective.toLowerCase().includes(q)) ||
          (i.selected_refined_prompt && i.selected_refined_prompt.toLowerCase().includes(q))
      );
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    return sendSuccess(res, {
      statusCode: 200,
      message:
        filtered.length > 0
          ? 'Archived benchmark history retrieved.'
          : 'Supabase database is not configured. History archive is empty.',
      data: {
        configured: filtered.length > 0,
        items: paginated,
        total: filtered.length,
        page: pageNum,
        pageSize: limitNum,
        totalPages: Math.ceil(filtered.length / limitNum) || 1,
        hasMore: startIndex + limitNum < filtered.length,
        notice: 'Configure SUPABASE_URL in Vercel to sync live database.',
      },
    });
  }

  try {
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
  } catch (dbError) {
    console.warn('[History DB Error - Falling back to cache]:', dbError.message);
    let filtered = [...cachedHistoryArchive];
    if (variant && variant !== 'all') {
      filtered = filtered.filter((i) => i.selected_variant === variant);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (i) =>
          (i.original_prompt && i.original_prompt.toLowerCase().includes(q)) ||
          (i.objective && i.objective.toLowerCase().includes(q)) ||
          (i.selected_refined_prompt && i.selected_refined_prompt.toLowerCase().includes(q))
      );
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Archived history records retrieved (cached mode).',
      data: {
        configured: true,
        items: paginated,
        total: filtered.length,
        page: pageNum,
        pageSize: limitNum,
        totalPages: Math.ceil(filtered.length / limitNum) || 1,
        hasMore: startIndex + limitNum < filtered.length,
        notice: 'Displaying archived sessions.',
      },
    });
  }
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

  if (supabaseService.isSupabaseConfigured()) {
    try {
      const record = await supabaseService.getPromptRunById(id);
      if (record) {
        return sendSuccess(res, {
          statusCode: 200,
          message: 'Prompt run record retrieved successfully.',
          data: record,
        });
      }
    } catch (err) {
      console.warn('[History Detail DB Error - Falling back to cache]:', err.message);
    }
  }

  const cached = cachedHistoryArchive.find((i) => i.id === id);
  if (cached) {
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Archived prompt run record retrieved.',
      data: cached,
    });
  }

  return sendError(res, {
    statusCode: 404,
    message: `Prompt run record with ID "${id}" was not found.`,
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

