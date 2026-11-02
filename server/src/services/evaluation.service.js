import { Type } from '@google/genai';
import { generateStructuredContent } from './gemini.service.js';
import { envConfig } from '../config/env.config.js';

// Schema for individual criteria scoring (1 to 10)
const criteriaScoreSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.NUMBER,
      description: 'Numerical rating between 1.0 and 10.0 (where 1 is poor and 10 is outstanding).',
    },
    reason: {
      type: Type.STRING,
      description: 'Concise explanation justifying this rating based on the actual response text.',
    },
  },
  required: ['score', 'reason'],
};

// Schema for an entire response evaluation across all 5 dimensions
const responseEvaluationSchema = {
  type: Type.OBJECT,
  properties: {
    relevance: criteriaScoreSchema,
    clarity: criteriaScoreSchema,
    completeness: criteriaScoreSchema,
    instructionAdherence: criteriaScoreSchema,
    usefulness: criteriaScoreSchema,
    overallScore: {
      type: Type.NUMBER,
      description: 'Composite overall score between 1.0 and 10.0 representing total quality.',
    },
  },
  required: [
    'relevance',
    'clarity',
    'completeness',
    'instructionAdherence',
    'usefulness',
    'overallScore',
  ],
};

// Full comparative evaluation JSON schema
const comparativeEvaluationSchema = {
  type: Type.OBJECT,
  properties: {
    original: responseEvaluationSchema,
    refined: responseEvaluationSchema,
    verdict: {
      type: Type.STRING,
      description: 'Balanced verdict summarizing which response performed better (or if they are equivalent/similar) and the primary reasons why.',
    },
    improvements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tangible improvements observed in the refined output over the original output, if any.',
    },
    remainingIssues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Residual gaps, ambiguities, or areas where both responses could still improve.',
    },
  },
  required: ['original', 'refined', 'verdict', 'improvements', 'remainingIssues'],
};

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
   - If no objective is provided, evaluate against the apparent intent of the original prompt, and explicitly note that the evaluation is based on inferred intent.

4. Scoring Rules:
   - All scores MUST be numbers between 1.0 and 10.0 (one decimal place allowed).
   - "overallScore" should represent a fair composite average of the five criteria.`;

/**
 * Evaluates both generated responses against the 5 criteria using Gemini.
 *
 * @param {Object} params
 * @param {string} params.originalPrompt - The original raw user prompt
 * @param {string} params.refinedPrompt - The chosen refined prompt
 * @param {string} params.originalResponse - AI response generated from original prompt
 * @param {string} params.refinedResponse - AI response generated from refined prompt
 * @param {string} [params.objective] - Optional user objective
 * @param {string} [params.model] - Model name
 * @returns {Promise<Object>} Structured evaluation results
 */
export const evaluateDualOutputs = async ({
  originalPrompt,
  refinedPrompt,
  originalResponse,
  refinedResponse,
  objective = '',
  model = envConfig.gemini.model,
}) => {
  const modelName = model || 'gemini-3.5-flash';

  const userPrompt = `ORIGINAL USER PROMPT:
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

  const rawResult = await generateStructuredContent({
    systemInstruction: EVALUATION_SYSTEM_INSTRUCTION,
    prompt: userPrompt,
    schema: comparativeEvaluationSchema,
    model: modelName,
  });

  if (!rawResult?.original || !rawResult?.refined) {
    throw new Error('Gemini evaluation returned an incomplete evaluation structure.');
  }

  // Sanitize, clamp scores between 1 and 10, and ensure complete fields
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

  return {
    original: sanitizeResponseEval(rawResult.original),
    refined: sanitizeResponseEval(rawResult.refined),
    verdict: rawResult.verdict || 'Evaluation completed.',
    improvements: Array.isArray(rawResult.improvements) ? rawResult.improvements : [],
    remainingIssues: Array.isArray(rawResult.remainingIssues) ? rawResult.remainingIssues : [],
  };
};
