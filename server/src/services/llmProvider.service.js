import * as geminiService from './gemini.service.js';
import * as groqService from './groq.service.js';
import { envConfig } from '../config/env.config.js';
import { Type } from '@google/genai';

// ============================================================
// Prompt Refinement Prompts & Schemas
// ============================================================

const REFINEMENT_GEMINI_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.OBJECT,
      properties: {
        overallSummary: { type: Type.STRING },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              explanation: { type: Type.STRING },
              impact: { type: Type.STRING },
              suggestion: { type: Type.STRING },
              severity: { type: Type.STRING },
            },
            required: ['title', 'explanation', 'impact', 'suggestion', 'severity'],
          },
        },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['overallSummary', 'strengths', 'weaknesses', 'suggestions'],
    },
    refinedVersions: {
      type: Type.OBJECT,
      properties: {
        balanced: { type: Type.STRING },
        detailed: { type: Type.STRING },
        concise: { type: Type.STRING },
      },
      required: ['balanced', 'detailed', 'concise'],
    },
  },
  required: ['analysis', 'refinedVersions'],
};

const REFINEMENT_SCHEMA_DESCRIPTION = JSON.stringify({
  analysis: {
    overallSummary: 'Executive summary evaluating prompt clarity, structure, and effectiveness.',
    strengths: ['Strength item 1', 'Strength item 2'],
    weaknesses: [
      {
        title: 'Weakness title',
        explanation: 'Detailed explanation of weakness',
        impact: 'How this affects model comprehension',
        suggestion: 'Specific technique to fix it',
        severity: 'Low | Medium | High',
      },
    ],
    suggestions: ['Actionable suggestion 1'],
  },
  refinedVersions: {
    balanced: 'Balanced variation text',
    detailed: 'Detailed variation text',
    concise: 'Concise variation text',
  },
}, null, 2);

const REFINEMENT_SYSTEM_INSTRUCTION = `You are a Principal Prompt Engineer specializing in prompt fidelity, structural clarity, and LLM optimization.
Your role is to analyze user-submitted prompts and generate three refined prompt variations: Balanced, Detailed, and Concise.

CRITICAL RULES ON FIDELITY & NO INVENTED CONSTRAINTS:
1. Strict Intent & Scope Preservation:
   - Preserve the user's exact intent and all explicitly stated constraints.
   - DO NOT invent personas, roles (e.g., "Act as a Senior Educator", "Act as a CMO"), target audiences (e.g., "for business executives", "for non-technical beginners", "for students"), arbitrary tone restrictions, word limits (e.g., "in 300 words"), or rigid formatting rules that the user never specified.
   - If the user prompt is "What is AI?", the user simply asked what AI is. Do NOT decide on your own who the audience is! Keep audience and tone neutral and natural.
   - All three versions MUST share the exact same audience and scope assumption. Never assign different or conflicting audiences/personas across the three variations.

2. Handling Missing Information:
   - When key details (such as target audience, programming language, technical depth, or output format) are missing from the original prompt, retain them as open/general, OR if an assumption is essential, explicitly prefix or label it as an optional parameter or assumption (e.g., "[Audience: General/Unspecified - adjust if needed]").
   - In the diagnostic analysis, you may note that audience or depth was not specified, but DO NOT silently force an unrequested audience into the refined prompts themselves.

3. Difference Between the Three Variations:
   - The variations must differ ONLY in structure, organization, and depth of instruction—NOT by inventing different audiences or conflicting requirements:
   - "Balanced": The well-structured standard prompt. Clarifies the core question/task, organizes the request with clear logical flow, and removes ambiguity while keeping instructions natural and readable.
   - "Detailed": The comprehensive, high-rigor prompt. Organizes the prompt into thorough, systematic inquiry areas. Requests structured organization without imposing arbitrary word counts or fake personas.
   - "Concise": The high-efficiency, minimalist prompt. Direct and punchy. States the core request with sharp clarity and asks for the key points with zero wasted words.

4. Dynamic Diagnostic Analysis:
   - Analyze Clarity, Specificity, Context, Completeness, Structure, Constraints, and Ambiguity.
   - Every weakness must be grounded in the user's actual prompt.
   - For each weakness, provide a title, explanation, impact, suggested improvement, and severity.
   - If an objective was provided, measure the prompt against it; if not, evaluate the standalone prompt without assuming unstated goals.`;

// ============================================================
// Evaluation Prompts & Schemas
// ============================================================

const criteriaScoreGeminiSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER },
    reason: { type: Type.STRING },
  },
  required: ['score', 'reason'],
};

const responseEvalGeminiSchema = {
  type: Type.OBJECT,
  properties: {
    relevance: criteriaScoreGeminiSchema,
    clarity: criteriaScoreGeminiSchema,
    completeness: criteriaScoreGeminiSchema,
    instructionAdherence: criteriaScoreGeminiSchema,
    usefulness: criteriaScoreGeminiSchema,
    overallScore: { type: Type.NUMBER },
  },
  required: ['relevance', 'clarity', 'completeness', 'instructionAdherence', 'usefulness', 'overallScore'],
};

const EVALUATION_GEMINI_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    original: responseEvalGeminiSchema,
    refined: responseEvalGeminiSchema,
    verdict: { type: Type.STRING },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
    remainingIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['original', 'refined', 'verdict', 'improvements', 'remainingIssues'],
};

const EVALUATION_SCHEMA_DESCRIPTION = JSON.stringify({
  original: {
    relevance: { score: 7.0, reason: 'string' },
    clarity: { score: 7.0, reason: 'string' },
    completeness: { score: 7.0, reason: 'string' },
    instructionAdherence: { score: 7.0, reason: 'string' },
    usefulness: { score: 7.0, reason: 'string' },
    overallScore: 7.0,
  },
  refined: {
    relevance: { score: 9.0, reason: 'string' },
    clarity: { score: 9.0, reason: 'string' },
    completeness: { score: 9.0, reason: 'string' },
    instructionAdherence: { score: 9.0, reason: 'string' },
    usefulness: { score: 9.0, reason: 'string' },
    overallScore: 9.0,
  },
  verdict: 'Balanced summary comparing both responses and highlighting differences.',
  improvements: ['Key improvement observed in refined response'],
  remainingIssues: ['Residual gap or caution for both responses'],
}, null, 2);

const EVALUATION_SYSTEM_INSTRUCTION = `You are an Objective AI Evaluation Judge and Prompt Quality Benchmarking Auditor.
Your task is to conduct an impartial, rigorous side-by-side comparative evaluation of two AI responses: Response A (generated from the Original Prompt) and Response B (generated from the Refined Prompt).

STRICT EVALUATION PRINCIPLES:
1. Impartiality & Ground Truth:
   - Base your evaluation EXCLUSIVELY on the actual generated text of both responses.
   - Do NOT automatically favor Response B simply because it comes from a refined prompt! If Response A is already superior, more direct, or more accurate, score Response A higher.
   - If both responses are equivalent in quality or usefulness, assign similar scores and acknowledge their similarity in the verdict.

2. Benchmark Criteria (Score each from 1.0 to 10.0):
   - Relevance: Does the response directly address the user's core request/need?
   - Clarity: Is the writing coherent, accessible, well-structured, and easy to follow?
   - Completeness: Does it provide thorough and adequate coverage without glaring omissions?
   - Instruction Adherence: How accurately does it obey the explicit requirements and constraints of its prompt?
   - Usefulness: How practically valuable, actionable, and ready-to-use is the response?

3. Reference Standard:
   - If an explicit User Objective is provided, evaluate both responses primarily against that stated objective.
   - If no objective is provided, evaluate against the apparent intent of the original prompt.

4. Scoring Rules:
   - All scores MUST be numbers between 1.0 and 10.0 (one decimal place allowed).
   - "overallScore" should represent a fair composite average of the five criteria.`;

// ============================================================
// Helper: Error Classifier for Automatic Fallback
// ============================================================

/**
 * Determines whether a given provider error represents an infrastructure outage,
 * quota exhaustion (429), model unavailability (404), or rate limit that warrants fallback.
 *
 * Does NOT trigger fallback on user validation errors (such as 400 Bad Request).
 *
 * @param {Error} error
 * @returns {boolean} True if fallback should be triggered
 */
export const isFallbackTriggerError = (error) => {
  if (!error) return false;

  const status = error.statusCode || error.status;
  const msg = (error.message || '').toLowerCase();
  const code = (error.code || '').toLowerCase();

  // 1. Quota & Rate Limit (429)
  if (status === 429) return true;
  if (msg.includes('resource_exhausted') || msg.includes('rate limit') || msg.includes('quota') || msg.includes('429')) {
    return true;
  }

  // 2. Service Unavailable / Outage / Overload (503, 502, 504)
  if (status === 503 || status === 502 || status === 504) return true;
  if (msg.includes('overloaded') || msg.includes('unavailable') || msg.includes('service unavailable')) {
    return true;
  }

  // 3. Model Not Found or Deprecated (404)
  if (status === 404 || msg.includes('not found') || msg.includes('model_not_found') || msg.includes('no longer available')) {
    return true;
  }

  // 4. Missing API key or configuration
  if (code.includes('key_missing') || msg.includes('key is not configured')) {
    return true;
  }

  // 5. Auth / Invalid Key (401)
  if (status === 401 || msg.includes('api_key_invalid') || msg.includes('invalid_api_key')) {
    return true;
  }

  return false;
};

// ============================================================
// Helper: Sanitize Evaluation Data
// ============================================================

const clampScore = (num, fallback = 7.0) => {
  const val = typeof num === 'number' ? num : parseFloat(num);
  if (isNaN(val)) return fallback;
  return Math.round(Math.min(10, Math.max(1, val)) * 10) / 10;
};

const sanitizeResponseEval = (data) => {
  const criteria = ['relevance', 'clarity', 'completeness', 'instructionAdherence', 'usefulness'];
  const sanitized = {};
  let sum = 0;

  for (const key of criteria) {
    const item = data?.[key] || {};
    const score = clampScore(item.score);
    sanitized[key] = {
      score,
      reason: item.reason || 'Evaluation completed.',
    };
    sum += score;
  }

  sanitized.overallScore = clampScore(data?.overallScore || sum / criteria.length);
  return sanitized;
};

// ============================================================
// Provider Refinement Execution
// ============================================================

async function callGeminiRefinement({ prompt, objective, model }) {
  const userContent = `Original Prompt Submitted by User:
"""
${prompt.trim()}
"""

${objective?.trim() ? `User Stated Objective / Target Outcome:\n"""\n${objective.trim()}\n"""` : 'No explicit target objective provided. Do NOT invent a target audience, persona, or unrequested constraints.'}

Instructions:
- Analyze the prompt's weaknesses based strictly on the text provided.
- Synthesize Balanced, Detailed, and Concise prompt variations.
- Remember: All three variations must address the SAME topic with the SAME audience (neutral/unspecified if not stated by the user). Do NOT assign different audiences to different variations.`;

  const rawResult = await geminiService.generateStructuredContent({
    systemInstruction: REFINEMENT_SYSTEM_INSTRUCTION,
    prompt: userContent,
    schema: REFINEMENT_GEMINI_SCHEMA,
    model: model || envConfig.gemini.model,
  });

  return sanitizeRefinementResult(rawResult);
}

async function callGroqRefinement({ prompt, objective, model }) {
  const userContent = `Original Prompt Submitted by User:
"""
${prompt.trim()}
"""

${objective?.trim() ? `User Stated Objective / Target Outcome:\n"""\n${objective.trim()}\n"""` : 'No explicit target objective provided. Do NOT invent a target audience, persona, or unrequested constraints.'}

Instructions:
- Analyze the prompt's weaknesses based strictly on the text provided.
- Synthesize Balanced, Detailed, and Concise prompt variations.
- Remember: All three variations must address the SAME topic with the SAME audience (neutral/unspecified if not stated by the user). Do NOT assign different audiences to different variations.`;

  const rawResult = await groqService.generateStructuredContent({
    systemInstruction: REFINEMENT_SYSTEM_INSTRUCTION,
    prompt: userContent,
    schemaDescription: REFINEMENT_SCHEMA_DESCRIPTION,
    model: model || envConfig.groq.model,
  });

  return sanitizeRefinementResult(rawResult);
}

function sanitizeRefinementResult(rawResult) {
  if (!rawResult?.analysis || !rawResult?.refinedVersions) {
    throw new Error('LLM provider returned an incomplete refinement response structure.');
  }

  const analysis = {
    overallSummary: rawResult.analysis.overallSummary || 'Prompt analysis completed.',
    strengths: Array.isArray(rawResult.analysis.strengths) ? rawResult.analysis.strengths : [],
    weaknesses: Array.isArray(rawResult.analysis.weaknesses) ? rawResult.analysis.weaknesses : [],
    suggestions: Array.isArray(rawResult.analysis.suggestions) ? rawResult.analysis.suggestions : [],
  };

  const refinedVersions = {
    balanced: rawResult.refinedVersions.balanced || '',
    detailed: rawResult.refinedVersions.detailed || '',
    concise: rawResult.refinedVersions.concise || '',
  };

  return { analysis, refinedVersions };
}

// ============================================================
// Master Refinement Workflow (Primary: Gemini, Fallback: Groq)
// ============================================================

/**
 * Executes prompt analysis & refinement with automatic fallback from Gemini to Groq.
 *
 * @param {Object} params
 * @param {string} params.prompt
 * @param {string} [params.objective]
 * @param {Object} [params.options]
 * @param {string} [params.options.forceProvider] - 'gemini' | 'groq'
 * @param {string} [params.options.simulateError] - 'gemini_quota' | 'all_fail'
 * @returns {Promise<Object>} Refinement data with provider and model metadata
 */
export const refinePromptWithFallback = async ({ prompt, objective = '', options = {} }) => {
  const { forceProvider, simulateError } = options;
  const effectiveForceProvider = forceProvider || envConfig.forceLlmProvider;

  // 1. Simulation: Both providers fail
  if (simulateError === 'all_fail') {
    const error = new Error(
      'All LLM providers are currently unavailable. Primary (Google Gemini): Simulated 429 Quota Exceeded. Secondary (Groq Cloud): Simulated Outage.'
    );
    error.statusCode = 503;
    throw error;
  }

  // 2. Direct Groq execution (when forced or requested)
  if (effectiveForceProvider === 'groq') {
    console.log('[LLM Provider] Forced execution using secondary provider: Groq');
    const groqModel = envConfig.groq.model || 'openai/gpt-oss-120b';
    const result = await callGroqRefinement({ prompt, objective, model: groqModel });
    return {
      originalPrompt: prompt.trim(),
      objective: objective?.trim() || null,
      analysis: result.analysis,
      refinedVersions: result.refinedVersions,
      provider: 'groq',
      model: groqModel,
      fallbackUsed: false,
      generatedAt: new Date().toISOString(),
    };
  }

  // 3. Primary Provider: Google Gemini
  const geminiModel = envConfig.gemini.model || 'gemini-3.5-flash-lite';
  let primaryError = null;

  if (simulateError === 'gemini_quota') {
    console.warn('[LLM Provider Simulation] Simulating Gemini 429 RESOURCE_EXHAUSTED error to trigger automatic fallback.');
    primaryError = new Error('Gemini API rate limit or quota exceeded (simulated 429 RESOURCE_EXHAUSTED).');
    primaryError.statusCode = 429;
  } else {
    try {
      console.log(`[LLM Provider] Attempting primary provider: Google Gemini ("${geminiModel}")...`);
      const result = await callGeminiRefinement({ prompt, objective, model: geminiModel });

      return {
        originalPrompt: prompt.trim(),
        objective: objective?.trim() || null,
        analysis: result.analysis,
        refinedVersions: result.refinedVersions,
        provider: 'gemini',
        model: geminiModel,
        fallbackUsed: false,
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      primaryError = err;
      console.warn(`[LLM Provider] Primary provider (Gemini) failed: ${err.message}`);

      // If error is NOT a fallback trigger (e.g. user validation error 400), throw immediately
      if (!isFallbackTriggerError(err)) {
        throw err;
      }
    }
  }

  // 4. Automatic Fallback: Groq Cloud
  console.log(`[LLM Provider] Initiating automatic fallback to secondary provider: Groq Cloud...`);
  const groqModel = envConfig.groq.model || 'openai/gpt-oss-120b';

  try {
    const result = await callGroqRefinement({ prompt, objective, model: groqModel });
    console.log(`[LLM Provider] Fallback to Groq ("${groqModel}") succeeded.`);

    return {
      originalPrompt: prompt.trim(),
      objective: objective?.trim() || null,
      analysis: result.analysis,
      refinedVersions: result.refinedVersions,
      provider: 'groq',
      model: groqModel,
      fallbackUsed: true,
      fallbackReason: primaryError.message,
      generatedAt: new Date().toISOString(),
    };
  } catch (groqErr) {
    console.error(`[LLM Provider] Secondary provider (Groq) also failed: ${groqErr.message}`);
    const dualError = new Error(
      `All LLM providers are currently unavailable. Primary (Google Gemini): ${primaryError.message}. Secondary (Groq Cloud): ${groqErr.message}.`
    );
    dualError.statusCode = 503;
    throw dualError;
  }
};

// ============================================================
// Single Provider Comparison Execution (Ensures Fair Benchmark)
// ============================================================

async function runComparisonOnGemini({ originalPrompt, refinedPrompt, objective, model, temperature = 0.7 }) {
  const modelName = model || envConfig.gemini.model || 'gemini-3.5-flash-lite';
  const startOriginal = Date.now();
  const startRefined = Date.now();

  // Execute both prompts simultaneously on Gemini
  const [originalText, refinedText] = await Promise.all([
    geminiService.generateTextContent({ prompt: originalPrompt, model: modelName, temperature }),
    geminiService.generateTextContent({ prompt: refinedPrompt, model: modelName, temperature }),
  ]);

  const latencyMs = {
    original: Date.now() - startOriginal,
    refined: Date.now() - startRefined,
  };

  // Evaluate both responses with Gemini
  const evalPrompt = buildEvaluationPrompt({ originalPrompt, refinedPrompt, originalResponse: originalText, refinedResponse: refinedText, objective });
  const rawEval = await geminiService.generateStructuredContent({
    systemInstruction: EVALUATION_SYSTEM_INSTRUCTION,
    prompt: evalPrompt,
    schema: EVALUATION_GEMINI_SCHEMA,
    model: modelName,
  });

  return {
    originalResponse: originalText,
    refinedResponse: refinedText,
    evaluation: sanitizeEvaluationResult(rawEval),
    executionLatencyMs: latencyMs,
    model: modelName,
  };
}

async function runComparisonOnGroq({ originalPrompt, refinedPrompt, objective, model, temperature = 0.7 }) {
  const modelName = model || envConfig.groq.model || 'openai/gpt-oss-120b';
  const startOriginal = Date.now();
  const startRefined = Date.now();

  // Execute both prompts simultaneously on Groq
  const [originalText, refinedText] = await Promise.all([
    groqService.generateTextContent({ prompt: originalPrompt, model: modelName, temperature }),
    groqService.generateTextContent({ prompt: refinedPrompt, model: modelName, temperature }),
  ]);

  const latencyMs = {
    original: Date.now() - startOriginal,
    refined: Date.now() - startRefined,
  };

  // Evaluate both responses with Groq
  const evalPrompt = buildEvaluationPrompt({ originalPrompt, refinedPrompt, originalResponse: originalText, refinedResponse: refinedText, objective });
  const rawEval = await groqService.generateStructuredContent({
    systemInstruction: EVALUATION_SYSTEM_INSTRUCTION,
    prompt: evalPrompt,
    schemaDescription: EVALUATION_SCHEMA_DESCRIPTION,
    model: modelName,
  });

  return {
    originalResponse: originalText,
    refinedResponse: refinedText,
    evaluation: sanitizeEvaluationResult(rawEval),
    executionLatencyMs: latencyMs,
    model: modelName,
  };
}

function buildEvaluationPrompt({ originalPrompt, refinedPrompt, originalResponse, refinedResponse, objective }) {
  return `ORIGINAL USER PROMPT:
"""
${originalPrompt}
"""

REFINED PROMPT:
"""
${refinedPrompt}
"""

USER STATED OBJECTIVE / GOAL:
"""
${objective?.trim() || 'No explicit objective provided. Evaluate against the apparent intent of the original prompt.'}
"""

---
RESPONSE A (Generated from Original Prompt):
"""
${originalResponse}
"""

---
RESPONSE B (Generated from Refined Prompt):
"""
${refinedResponse}
"""

Please evaluate Response A and Response B strictly and impartially against the 5 criteria: Relevance, Clarity, Completeness, Instruction Adherence, and Usefulness.`;
}

function sanitizeEvaluationResult(rawResult) {
  if (!rawResult?.original || !rawResult?.refined) {
    throw new Error('LLM evaluation returned an incomplete evaluation structure.');
  }

  return {
    original: sanitizeResponseEval(rawResult.original),
    refined: sanitizeResponseEval(rawResult.refined),
    verdict: rawResult.verdict || 'Evaluation completed.',
    improvements: Array.isArray(rawResult.improvements) ? rawResult.improvements : [],
    remainingIssues: Array.isArray(rawResult.remainingIssues) ? rawResult.remainingIssues : [],
  };
}

// ============================================================
// Master Comparison Workflow with Automatic Fallback
// ============================================================

/**
 * Executes dual prompt execution and evaluation.
 * Enforces provider consistency: both outputs and evaluation run on the SAME provider.
 * If Gemini fails at any point, the entire comparison workflow is restarted on Groq.
 *
 * @param {Object} params
 * @param {string} params.originalPrompt
 * @param {string} params.refinedPrompt
 * @param {string} [params.objective]
 * @param {string} [params.selectedVariant]
 * @param {Object} [params.options]
 * @returns {Promise<Object>} Complete comparison benchmark data
 */
export const comparePromptsWithFallback = async ({
  originalPrompt,
  refinedPrompt,
  objective = '',
  selectedVariant = 'balanced',
  options = {},
}) => {
  const { forceProvider, simulateError } = options;
  const effectiveForceProvider = forceProvider || envConfig.forceLlmProvider;

  // 1. Simulation: Both providers fail
  if (simulateError === 'all_fail') {
    const error = new Error(
      'All LLM providers are currently unavailable for benchmark. Primary (Google Gemini): Simulated 429 Quota Exceeded. Secondary (Groq Cloud): Simulated Outage.'
    );
    error.statusCode = 503;
    throw error;
  }

  // 2. Direct Groq benchmark (when forced)
  if (effectiveForceProvider === 'groq') {
    console.log('[LLM Provider] Forced benchmark execution using secondary provider: Groq');
    const groqModel = envConfig.groq.model || 'openai/gpt-oss-120b';
    const result = await runComparisonOnGroq({ originalPrompt, refinedPrompt, objective, model: groqModel });
    return {
      ...result,
      selectedVariant,
      provider: 'groq',
      fallbackUsed: false,
      generatedAt: new Date().toISOString(),
    };
  }

  // 3. Primary Provider: Google Gemini
  const geminiModel = envConfig.gemini.model || 'gemini-3.5-flash-lite';
  let primaryError = null;

  if (simulateError === 'gemini_quota') {
    console.warn('[LLM Provider Simulation] Simulating Gemini 429 during comparison to trigger automatic Groq fallback.');
    primaryError = new Error('Gemini API rate limit or quota exceeded during dual execution (simulated 429).');
    primaryError.statusCode = 429;
  } else {
    try {
      console.log(`[LLM Provider] Attempting full benchmark on primary provider: Google Gemini ("${geminiModel}")...`);
      const result = await runComparisonOnGemini({
        originalPrompt,
        refinedPrompt,
        objective,
        model: geminiModel,
      });

      return {
        ...result,
        selectedVariant,
        provider: 'gemini',
        fallbackUsed: false,
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      primaryError = err;
      console.warn(`[LLM Provider] Primary provider failed during comparison workflow: ${err.message}`);

      if (!isFallbackTriggerError(err)) {
        throw err;
      }
    }
  }

  // 4. Automatic Fallback: Restart Complete Workflow on Groq
  console.log('[LLM Provider] Restarting complete dual execution and evaluation benchmark on Groq to preserve consistency...');
  const groqModel = envConfig.groq.model || 'openai/gpt-oss-120b';

  try {
    const result = await runComparisonOnGroq({
      originalPrompt,
      refinedPrompt,
      objective,
      model: groqModel,
    });
    console.log(`[LLM Provider] Fallback benchmark on Groq ("${groqModel}") succeeded.`);

    return {
      ...result,
      selectedVariant,
      provider: 'groq',
      model: groqModel,
      fallbackUsed: true,
      fallbackReason: primaryError.message,
      generatedAt: new Date().toISOString(),
    };
  } catch (groqErr) {
    console.error(`[LLM Provider] Secondary provider (Groq) also failed during comparison: ${groqErr.message}`);
    const dualError = new Error(
      `All LLM providers are currently unavailable. Primary (Google Gemini): ${primaryError.message}. Secondary (Groq Cloud): ${groqErr.message}.`
    );
    dualError.statusCode = 503;
    throw dualError;
  }
};

