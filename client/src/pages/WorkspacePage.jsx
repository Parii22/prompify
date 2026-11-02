import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Terminal,
  Sliders,
  Copy,
  Check,
  SplitSquareVertical,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  AlertCircle,
  Play,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Database,
  RefreshCw,
  CornerDownLeft,
} from 'lucide-react';
import { ShaderBackground } from '../components/ShaderBackground.jsx';
import * as promptService from '../services/prompt.service.js';
import * as historyService from '../services/history.service.js';

// Realistic prompt presets for quick studio testing
const PROMPT_PRESETS = [
  {
    title: 'Code Refactoring',
    prompt: 'Fix my React code and make it look cleaner and faster.',
    objective: 'Refactor a React component to improve performance, add PropTypes, and handle error states gracefully.',
  },
  {
    title: 'Cold Sales Pitch',
    prompt: 'Write an email to a CTO asking them to buy our SaaS product.',
    objective: 'Generate a high-converting, concise B2B cold email focused on developer productivity ROI.',
  },
  {
    title: 'API Documentation',
    prompt: 'Explain what our authentication API does for developers.',
    objective: 'Create developer-friendly OpenAPI-style documentation with headers, status codes, and JSON payloads.',
  },
  {
    title: 'General Query',
    prompt: 'What is AI?',
    objective: '',
  },
];

export function WorkspacePage() {
  // Input State
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [objective, setObjective] = useState('');
  const [copiedCard, setCopiedCard] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState('balanced');
  const [activeTab, setActiveTab] = useState('refinement'); // 'refinement' | 'comparison'

  // Workflow Pipeline State: 'editor' | 'refining' | 'results'
  const [workflowState, setWorkflowState] = useState('editor');
  const [refiningStage, setRefiningStage] = useState(0);
  const [refineError, setRefineError] = useState(null);

  // Real Gemini Output Data
  const [refinementData, setRefinementData] = useState(null);

  // Phase 4 Comparison & Phase 5 Persistence State
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonStage, setComparisonStage] = useState(0);
  const [comparisonData, setComparisonData] = useState(null);
  const [compareError, setCompareError] = useState(null);
  const [expandedOriginal, setExpandedOriginal] = useState(false);
  const [expandedRefined, setExpandedRefined] = useState(false);
  const [isRetryingSave, setIsRetryingSave] = useState(false);

  // Development Provider Override: 'auto' (Gemini Primary + Fallback) | 'groq' (Force Groq for testing)
  const [devProvider, setDevProvider] = useState('auto');
  const [isPromptFocused, setIsPromptFocused] = useState(false);

  // Refining Stages (Phase 3)
  const refineStages = [
    'Parsing raw prompt and detecting intent',
    'Auditing clarity, constraints, and contextual ambiguity',
    'Synthesizing Balanced, Detailed & Concise variations',
    'Enforcing strict intent preservation and constraint adherence',
    'Generating structured diagnostic audit',
    'Finalizing calibrated refinement package',
  ];

  // Comparison Stages (Phase 4 & 5)
  const compareStages = [
    'Executing original prompt with matched model parameters',
    'Executing refined prompt with matched model parameters',
    'Benchmarking both generated outputs side-by-side',
    'Evaluating quality across 5 dimensions (Relevance, Clarity, Completeness, Adherence, Utility)',
    'Persisting workflow record to Supabase database',
  ];

  // Step 1: Start Refinement
  const handleStartRefinement = async () => {
    const trimmed = originalPrompt.trim();
    if (!trimmed) {
      setRefineError('Please enter a prompt before refining.');
      return;
    }

    setRefineError(null);
    setWorkflowState('refining');
    setRefiningStage(0);
    setComparisonData(null);
    setCompareError(null);
    setExpandedOriginal(false);
    setExpandedRefined(false);

    const stageInterval = setInterval(() => {
      setRefiningStage((prev) => {
        if (prev < refineStages.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 1100);

    try {
      const response = await promptService.refinePrompt({
        prompt: trimmed,
        objective: objective.trim(),
        forceProvider: devProvider === 'groq' ? 'groq' : null,
      });

      clearInterval(stageInterval);
      setRefiningStage(refineStages.length - 1);

      setTimeout(() => {
        setRefinementData(response.data);
        setWorkflowState('results');
        setActiveTab('refinement');
      }, 500);
    } catch (err) {
      clearInterval(stageInterval);
      console.error('[Workspace Refine Error]:', err);
      setRefineError(err.message || 'Failed to refine prompt with Gemini API.');
      setWorkflowState('editor');
    }
  };

  // Step 2 & 3: Execute Both Prompts, Evaluate, and Auto-Persist to Supabase
  const handleExecuteAndCompare = async () => {
    if (isComparing) return;
    if (!refinementData) return;

    const refinedText = refinementData.refinedVersions[selectedVariant];
    if (!refinedText) return;

    setIsComparing(true);
    setCompareError(null);
    setComparisonStage(0);
    setActiveTab('comparison');

    const stageInterval = setInterval(() => {
      setComparisonStage((prev) => {
        if (prev < compareStages.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    try {
      const response = await promptService.comparePrompts({
        originalPrompt: refinementData.originalPrompt,
        refinedPrompt: refinedText,
        objective: refinementData.objective || '',
        selectedVariant,
        analysis: refinementData.analysis,
        refinedVersions: refinementData.refinedVersions,
        forceProvider: devProvider === 'groq' ? 'groq' : (refinementData.provider === 'groq' ? 'groq' : null),
      });

      clearInterval(stageInterval);
      setComparisonStage(compareStages.length - 1);

      setTimeout(() => {
        setComparisonData(response.data);
        setIsComparing(false);
      }, 600);
    } catch (err) {
      clearInterval(stageInterval);
      console.error('[Workspace Compare Error]:', err);
      setCompareError(err.message || 'Failed to execute and evaluate prompts with Gemini API.');
      setIsComparing(false);
    }
  };

  // Retry Database Save without re-executing LLM
  const handleRetrySave = async () => {
    if (!comparisonData || !refinementData) return;
    setIsRetryingSave(true);

    try {
      const response = await historyService.savePromptRun({
        originalPrompt: refinementData.originalPrompt,
        objective: refinementData.objective || '',
        analysis: refinementData.analysis,
        refinedVersions: refinementData.refinedVersions,
        selectedVariant,
        selectedRefinedPrompt: refinementData.refinedVersions[selectedVariant],
        originalResponse: comparisonData.originalResponse,
        refinedResponse: comparisonData.refinedResponse,
        evaluation: comparisonData.evaluation,
        model: comparisonData.model,
        provider: comparisonData.provider || refinementData.provider || 'gemini',
      });

      setComparisonData((prev) => ({
        ...prev,
        persistence: {
          saved: true,
          recordId: response.data.recordId,
          savedAt: response.data.savedAt,
          error: null,
        },
      }));
    } catch (err) {
      console.error('[Retry Save Error]:', err);
      setComparisonData((prev) => ({
        ...prev,
        persistence: {
          saved: false,
          recordId: null,
          savedAt: null,
          error: err.message || 'Retry database save failed.',
        },
      }));
    } finally {
      setIsRetryingSave(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCard(id);
    setTimeout(() => setCopiedCard(null), 2000);
  };

  const handlePresetClick = (preset) => {
    setOriginalPrompt(preset.prompt);
    setObjective(preset.objective);
    setRefineError(null);
  };

  const handleReset = () => {
    setWorkflowState('editor');
    setRefiningStage(0);
    setRefineError(null);
    setComparisonData(null);
    setCompareError(null);
    setExpandedOriginal(false);
    setExpandedRefined(false);
  };

  // Character & estimated token count
  const charCount = originalPrompt.length;
  const tokenEstimate = Math.ceil(charCount / 4);

  const variantConfig = {
    balanced: {
      title: 'Balanced',
      tag: 'Recommended',
      description: 'Structured and clear. Balances context, instructions, and constraints.',
    },
    detailed: {
      title: 'Detailed',
      tag: 'Comprehensive',
      description: 'Exhaustive instruction layout with explicit edge cases and output specifications.',
    },
    concise: {
      title: 'Concise',
      tag: 'Minimalist',
      description: 'Dense, high-efficiency prompt maximizing token economy with zero fluff.',
    },
  };

  // Dimensions for evaluation breakdown
  const criteriaList = [
    { key: 'relevance', name: 'Relevance', desc: 'Directly addresses user intent' },
    { key: 'clarity', name: 'Clarity', desc: 'Cohesive, logically organized structure' },
    { key: 'completeness', name: 'Completeness', desc: 'Adequately covers essential details' },
    { key: 'instructionAdherence', name: 'Instruction Adherence', desc: 'Follows instructions and constraints' },
    { key: 'usefulness', name: 'Usefulness', desc: 'Practically valuable and actionable' },
  ];

  // Helper stats for Comparison View
  const origOverall = comparisonData?.evaluation?.original?.overallScore ?? 0;
  const refOverall = comparisonData?.evaluation?.refined?.overallScore ?? 0;
  const scoreDiff = refOverall - origOverall;
  const hasImprovements = comparisonData?.evaluation?.improvements && comparisonData.evaluation.improvements.length > 0;
  const hasIssues = comparisonData?.evaluation?.remainingIssues && comparisonData.evaluation.remainingIssues.length > 0;

  return (
    <div
      style={{
        maxWidth: '1120px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem',
        position: 'relative',
        paddingBottom: '3rem',
      }}
    >
      {/* Subtle Atmospheric Ambient Lighting (Matches Overview Page) */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          right: '5%',
          width: '500px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '350px',
          left: '-5%',
          width: '450px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ==================================================== */}
      {/* STATE 1: STUDIO PROMPT EDITOR (EDITORIAL MINIMALISM) */}
      {/* ==================================================== */}
      {workflowState === 'editor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', zIndex: 1 }}>
          {/* Header & Dev Provider Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              {/* Eyebrow Label */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  marginBottom: '0.75rem',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#22d3ee',
                    boxShadow: '0 0 10px #22d3ee',
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#9292a5',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  STUDIO / PROMPT SYNTHESIS
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2.2rem, 3.8vw, 2.85rem)',
                  fontWeight: 800,
                  color: '#f8fafc',
                  letterSpacing: '-0.035em',
                  lineHeight: 1.12,
                  margin: '0 0 0.6rem 0',
                }}
              >
                Prompt Studio
              </h1>
              <p style={{ color: '#9292a5', fontSize: '0.98rem', lineHeight: 1.6, maxWidth: '640px', margin: 0 }}>
                Input your raw prompt. Diagnose structural blind spots, generate calibrated variations, and benchmark model outputs side-by-side with matched parameters.
              </p>
            </div>

            {/* Development Provider Selector (Quieter, More Integrated) */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem',
                backgroundColor: '#0c0c14',
                border: devProvider === 'groq' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-full)',
                boxShadow: devProvider === 'groq' ? '0 0 14px rgba(245, 158, 11, 0.12)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <span
                style={{
                  fontSize: '0.66rem',
                  color: devProvider === 'groq' ? '#f59e0b' : '#9292a5',
                  padding: '0 0.5rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                ENGINE:
              </span>
              <button
                type="button"
                onClick={() => setDevProvider('auto')}
                style={{
                  padding: '0.28rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: devProvider === 'auto' ? '#8b5cf6' : 'transparent',
                  color: devProvider === 'auto' ? '#ffffff' : '#9292a5',
                  boxShadow: devProvider === 'auto' ? '0 2px 8px rgba(139, 92, 246, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Auto (Gemini Primary)
              </button>
              <button
                type="button"
                onClick={() => setDevProvider('groq')}
                style={{
                  padding: '0.28rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: devProvider === 'groq' ? '#f59e0b' : 'transparent',
                  color: devProvider === 'groq' ? '#09090f' : '#9292a5',
                  boxShadow: devProvider === 'groq' ? '0 2px 8px rgba(245, 158, 11, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                }}
                title="Force execution on Groq Cloud to test without consuming Gemini quota"
              >
                Force Groq (Dev Test)
              </button>
            </div>
          </div>

          {/* Groq Dev Override Notice */}
          {devProvider === 'groq' && (
            <div
              style={{
                padding: '0.6rem 1rem',
                backgroundColor: 'rgba(245, 158, 11, 0.06)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontSize: '0.82rem',
                color: '#fcd34d',
              }}
            >
              <Sparkles size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
              <span>
                <strong>Groq Cloud Test Override Active:</strong> Prompts will execute strictly via <strong>Groq Cloud (openai/gpt-oss-120b)</strong>. Google Gemini API quota is completely preserved. Click "Auto" to restore normal Gemini primary mode.
              </span>
            </div>
          )}

          {/* Error Banner */}
          {refineError && (
            <div
              style={{
                padding: 'var(--spacing-md) var(--spacing-lg)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                color: '#fca5a5',
              }}
            >
              <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1, fontSize: '0.875rem' }}>
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: '0.2rem' }}>Refinement Request Notice</strong>
                {refineError}
              </div>
            </div>
          )}

          {/* Quick Starter Preset Chips (Minimal Editorial Chips) */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.55rem' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#9292a5',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: 'var(--font-mono)',
                marginRight: '0.35rem',
              }}
            >
              QUICK STARTERS
            </span>
            {PROMPT_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetClick(preset)}
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 500,
                  padding: '0.32rem 0.8rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  color: '#9292a5',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.45)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                  e.currentTarget.style.color = '#9292a5';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                }}
              >
                <span>{preset.title}</span>
              </button>
            ))}
          </div>

          {/* Core Prompt Canvas (Focal Writing Centerpiece) */}
          <div
            style={{
              backgroundColor: '#0c0c14',
              borderRadius: '16px',
              border: isPromptFocused
                ? '1px solid rgba(139, 92, 246, 0.45)'
                : '1px solid rgba(255, 255, 255, 0.07)',
              boxShadow: isPromptFocused
                ? '0 0 0 1px rgba(139, 92, 246, 0.25), 0 20px 48px rgba(139, 92, 246, 0.08), 0 12px 32px rgba(0, 0, 0, 0.5)'
                : '0 16px 40px rgba(0, 0, 0, 0.45)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.25s ease',
              position: 'relative',
            }}
          >
            {/* Top Canvas Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.015)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <Terminal size={14} style={{ color: isPromptFocused ? '#22d3ee' : '#8b5cf6', transition: 'color 0.2s ease' }} />
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#f8fafc',
                    letterSpacing: '0.08em',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                  }}
                >
                  RAW PROMPT BUFFER
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <span style={{ fontSize: '0.74rem', color: '#9292a5', fontFamily: 'var(--font-mono)' }}>
                  {charCount} characters <span style={{ opacity: 0.4 }}>&bull;</span> ~{tokenEstimate} tokens
                </span>
                {originalPrompt && (
                  <button
                    type="button"
                    onClick={() => setOriginalPrompt('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9292a5',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9292a5';
                    }}
                    title="Clear prompt"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Prompt Editor Textarea */}
            <div style={{ padding: '1.5rem 1.75rem 1.25rem' }}>
              <textarea
                value={originalPrompt}
                onChange={(e) => {
                  setOriginalPrompt(e.target.value);
                  if (refineError) setRefineError(null);
                }}
                onFocus={() => setIsPromptFocused(true)}
                onBlur={() => setIsPromptFocused(false)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (originalPrompt.trim()) handleStartRefinement();
                  }
                }}
                placeholder="Enter your prompt here... (e.g. 'Explain database normalization for beginners with simple examples')"
                rows={7}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '1.02rem',
                  lineHeight: 1.75,
                  fontFamily: 'var(--font-mono)',
                  resize: 'vertical',
                  minHeight: '160px',
                }}
              />
            </div>

            {/* Objective Parameter Field (Integrated naturally below main prompt area) */}
            <div
              style={{
                padding: '0.9rem 1.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#22d3ee', flexShrink: 0 }}>
                <Sliders size={14} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Objective:</span>
              </div>
              <input
                type="text"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                onFocus={() => setIsPromptFocused(true)}
                onBlur={() => setIsPromptFocused(false)}
                placeholder="Optional target outcome, audience, or constraints (e.g. 'Target junior developers with practical code examples')"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            {/* Bottom Execution Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.015)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                flexWrap: 'wrap',
                gap: 'var(--spacing-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', color: '#9292a5' }}>
                <CornerDownLeft size={13} />
                <span>Cmd + Enter to run refinement</span>
              </div>

              <button
                type="button"
                onClick={handleStartRefinement}
                disabled={!originalPrompt.trim()}
                className="btn btn-primary"
                style={{
                  padding: '0.7rem 1.6rem',
                  gap: '0.55rem',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  boxShadow: originalPrompt.trim() ? '0 4px 20px rgba(139, 92, 246, 0.28)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Sparkles size={16} />
                <span>Refine Prompt</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STATE 2: REFINING PROCESSING (HIGH-TECH HUD OVERLAY) */}
      {/* ==================================================== */}
      {workflowState === 'refining' && (
        <div
          style={{
            position: 'relative',
            minHeight: '65vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
            <ShaderBackground />
          </div>

          <div
            className="surface-glass"
            style={{
              position: 'relative',
              zIndex: 10,
              maxWidth: '540px',
              width: '92%',
              padding: 'var(--spacing-2xl)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-glow-violet)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--spacing-lg)',
                color: '#22d3ee',
              }}
            >
              <Cpu size={30} className="animate-spin" />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
              Refining with Google Gemini
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 'var(--spacing-xl)' }}>
              Executing real-time prompt diagnosis and structured multi-tier synthesis...
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', textAlign: 'left', marginBottom: 'var(--spacing-xl)' }}>
              {refineStages.map((st, i) => {
                const isDone = i < refiningStage;
                const isCurrent = i === refiningStage;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.45rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isCurrent
                        ? 'rgba(139, 92, 246, 0.15)'
                        : isDone
                        ? 'rgba(16, 185, 129, 0.08)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${
                        isCurrent
                          ? 'rgba(139, 92, 246, 0.35)'
                          : isDone
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'transparent'
                      }`,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 size={15} color="#10b981" />
                    ) : isCurrent ? (
                      <div
                        style={{
                          width: '13px',
                          height: '13px',
                          borderRadius: '50%',
                          border: '2px solid #22d3ee',
                          borderTopColor: 'transparent',
                        }}
                        className="animate-spin"
                      />
                    ) : (
                      <div
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          margin: '0 3px',
                        }}
                      />
                    )}

                    <span
                      style={{
                        fontSize: '0.825rem',
                        fontWeight: isCurrent ? 600 : 400,
                        color: isDone ? '#e2e8f0' : isCurrent ? '#ffffff' : 'var(--color-text-faint)',
                      }}
                    >
                      {st}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>
              Processing stage {refiningStage + 1} of {refineStages.length}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STATE 3: RESULTS (REFINEMENT & COMPARISON STUDIO)    */}
      {/* ==================================================== */}
      {workflowState === 'results' && refinementData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
          {/* Top Bar with Clean Segments and Reset */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--spacing-md)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: 'var(--spacing-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('refinement')}
                className={`btn btn-sm ${activeTab === 'refinement' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ gap: '0.4rem', fontWeight: 600 }}
              >
                <Sliders size={14} />
                <span>1. Variations & Diagnostics</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('comparison')}
                className={`btn btn-sm ${activeTab === 'comparison' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ gap: '0.4rem', fontWeight: 600 }}
              >
                <SplitSquareVertical size={14} />
                <span>2. Execution & Benchmark</span>
                {comparisonData && (
                  <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                    Evaluated
                  </span>
                )}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <span
                className={refinementData.provider === 'groq' ? 'badge badge-warning' : 'badge badge-violet'}
                style={{ fontSize: '0.7rem' }}
              >
                {refinementData.provider === 'groq' ? 'Groq' : 'Gemini'}
                {refinementData.fallbackUsed && ' (Fallback)'}
              </span>

              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                Model: <strong style={{ color: '#f8fafc' }}>{refinementData.model}</strong>
              </span>

              <button
                type="button"
                onClick={handleReset}
                className="btn btn-sm btn-ghost"
                style={{ gap: '0.35rem', color: 'var(--color-text-muted)' }}
              >
                <RotateCcw size={13} />
                <span>New Prompt</span>
              </button>
            </div>
          </div>

          {/* TAB 1: REFINEMENT VARIANTS & STREAMLINED DIAGNOSTICS */}
          {activeTab === 'refinement' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
              {/* Executive Diagnostic Summary Banner */}
              <div
                style={{
                  backgroundColor: '#101018',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderLeft: '4px solid #8b5cf6',
                  padding: 'var(--spacing-lg)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Sparkles size={16} color="#8b5cf6" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
                    Diagnostic Assessment
                  </h3>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                  {refinementData.analysis.overallSummary}
                </p>

                {refinementData.analysis.strengths && refinementData.analysis.strengths.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: 'var(--spacing-sm)' }}>
                    {refinementData.analysis.strengths.map((s, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.725rem',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          color: '#10b981',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Streamlined Weaknesses Matrix (No redundant rounded cards) */}
              <div
                style={{
                  backgroundColor: '#101018',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: 'var(--spacing-lg)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--spacing-md)' }}>
                  <AlertTriangle size={16} color="#f59e0b" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                    Diagnosed Vulnerabilities ({refinementData.analysis.weaknesses.length})
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {refinementData.analysis.weaknesses.map((w, idx) => {
                    const isHigh = w.severity?.toLowerCase() === 'high';
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '0.75rem var(--spacing-md)',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.04)',
                          display: 'grid',
                          gridTemplateColumns: 'minmax(180px, 1fr) 2fr',
                          gap: 'var(--spacing-md)',
                          alignItems: 'start',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '0.1rem 0.4rem',
                                borderRadius: 'var(--radius-xs)',
                                backgroundColor: isHigh ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: isHigh ? '#f43f5e' : '#f59e0b',
                                border: `1px solid ${isHigh ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                              }}
                            >
                              {w.severity || 'Medium'}
                            </span>
                            <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{w.title}</strong>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>
                            Impact: {w.impact}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '0.35rem' }}>
                            {w.explanation}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#22d3ee', fontWeight: 500 }}>
                            <strong>Prescription:</strong> {w.suggestion}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Three Calibrated Refined Prompt Variations */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                      Calibrated Prompt Variations
                    </h2>
                    <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0' }}>
                      Select a variation below to execute both prompts side-by-side:
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteAndCompare}
                    disabled={isComparing}
                    className="btn btn-accent"
                    style={{ gap: '0.5rem', fontWeight: 600, padding: '0.6rem 1.25rem' }}
                  >
                    <Play size={15} />
                    <span>Benchmark {variantConfig[selectedVariant].title}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-md)' }}>
                  {['balanced', 'detailed', 'concise'].map((key) => {
                    const config = variantConfig[key];
                    const content = refinementData.refinedVersions[key] || '';
                    const isSelected = selectedVariant === key;
                    const isCopied = copiedCard === key;

                    return (
                      <div
                        key={key}
                        onClick={() => setSelectedVariant(key)}
                        style={{
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--spacing-lg)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.06)' : '#101018',
                          border: isSelected
                            ? '1px solid #8b5cf6'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          boxShadow: isSelected ? '0 0 20px rgba(139, 92, 246, 0.25)' : 'none',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                                {config.title}
                              </h3>
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: 'var(--radius-xs)',
                                  backgroundColor: key === 'balanced' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                                  color: key === 'balanced' ? '#c4b5fd' : 'var(--color-text-muted)',
                                }}
                              >
                                {config.tag}
                              </span>
                            </div>

                            <span
                              style={{
                                fontSize: '0.725rem',
                                fontWeight: 600,
                                color: isSelected ? '#22d3ee' : 'var(--color-text-faint)',
                              }}
                            >
                              {isSelected ? '● Active' : '○ Click to select'}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)', lineHeight: 1.45 }}>
                            {config.description}
                          </p>

                          <div
                            style={{
                              backgroundColor: '#08080E',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                              borderRadius: 'var(--radius-sm)',
                              padding: 'var(--spacing-md)',
                              fontSize: '0.825rem',
                              fontFamily: 'var(--font-mono)',
                              color: '#e2e8f0',
                              lineHeight: 1.55,
                              whiteSpace: 'pre-wrap',
                              maxHeight: '260px',
                              overflowY: 'auto',
                              marginBottom: 'var(--spacing-md)',
                            }}
                          >
                            {content}
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            paddingTop: 'var(--spacing-sm)',
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedVariant(key)}
                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ flex: 1, fontWeight: 600, fontSize: '0.785rem' }}
                          >
                            {isSelected ? '✓ Selected for Benchmark' : 'Select Variant'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopy(content, key)}
                            className="btn btn-sm btn-secondary"
                            style={{ gap: '0.35rem', fontSize: '0.785rem' }}
                            title="Copy prompt text"
                          >
                            {isCopied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                            <span>{isCopied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DUAL EXECUTION & COMPARISON (STREAMLINED & PERSISTED) */}
          {activeTab === 'comparison' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              {/* Execution Error Banner */}
              {compareError && (
                <div
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    color: '#fca5a5',
                  }}
                >
                  <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1, fontSize: '0.875rem' }}>
                    <strong style={{ color: '#ffffff', display: 'block', marginBottom: '0.2rem' }}>Execution Failed</strong>
                    {compareError}
                    <button
                      type="button"
                      onClick={handleExecuteAndCompare}
                      className="btn btn-sm btn-primary"
                      style={{ marginTop: '0.5rem' }}
                    >
                      Retry Execution
                    </button>
                  </div>
                </div>
              )}

              {/* State A: Execution in Progress (Shader HUD) */}
              {isComparing && (
                <div
                  style={{
                    position: 'relative',
                    minHeight: '50vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                    <ShaderBackground />
                  </div>

                  <div
                    className="surface-glass"
                    style={{
                      position: 'relative',
                      zIndex: 10,
                      maxWidth: '520px',
                      width: '92%',
                      padding: 'var(--spacing-xl)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-glow-cyan)',
                      border: '1px solid rgba(34, 211, 238, 0.4)',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(34, 211, 238, 0.15)',
                        border: '1px solid rgba(34, 211, 238, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--spacing-md)',
                        color: '#22d3ee',
                      }}
                    >
                      <SplitSquareVertical size={28} className="animate-spin" />
                    </div>

                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
                      Dual Prompt Execution in Progress
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 'var(--spacing-lg)' }}>
                      Executing original and refined prompts side-by-side with matched parameters and persisting results...
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', textAlign: 'left', marginBottom: 'var(--spacing-lg)' }}>
                      {compareStages.map((st, i) => {
                        const isDone = i < comparisonStage;
                        const isCurrent = i === comparisonStage;
                        return (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.45rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: isCurrent
                                ? 'rgba(34, 211, 238, 0.15)'
                                : isDone
                                ? 'rgba(16, 185, 129, 0.08)'
                                : 'rgba(255, 255, 255, 0.02)',
                              border: `1px solid ${
                                isCurrent
                                  ? 'rgba(34, 211, 238, 0.35)'
                                  : isDone
                                  ? 'rgba(16, 185, 129, 0.2)'
                                  : 'transparent'
                              }`,
                              transition: 'all 0.3s ease',
                            }}
                          >
                            {isDone ? (
                              <CheckCircle2 size={15} color="#10b981" />
                            ) : isCurrent ? (
                              <div
                                style={{
                                  width: '13px',
                                  height: '13px',
                                  borderRadius: '50%',
                                  border: '2px solid #22d3ee',
                                  borderTopColor: 'transparent',
                                }}
                                className="animate-spin"
                              />
                            ) : (
                              <div
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                  margin: '0 3px',
                                }}
                              />
                            )}

                            <span
                              style={{
                                fontSize: '0.825rem',
                                fontWeight: isCurrent ? 600 : 400,
                                color: isDone ? '#e2e8f0' : isCurrent ? '#ffffff' : 'var(--color-text-faint)',
                              }}
                            >
                              {st}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>
                      Step {comparisonStage + 1} of {compareStages.length}
                    </div>
                  </div>
                </div>
              )}

              {/* State B: Empty State (Awaiting user trigger) */}
              {!isComparing && !comparisonData && !compareError && (
                <div
                  style={{
                    backgroundColor: '#101018',
                    padding: 'var(--spacing-2xl) var(--spacing-xl)',
                    textAlign: 'center',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--spacing-md)',
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(34, 211, 238, 0.1)',
                      border: '1px solid rgba(34, 211, 238, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#22d3ee',
                    }}
                  >
                    <SplitSquareVertical size={24} />
                  </div>

                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem' }}>
                      Ready for Dual Execution Benchmark
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
                      Compare your original prompt against the selected <strong>{variantConfig[selectedVariant].title}</strong> prompt.
                      Gemini will execute both, evaluate quality across 5 dimensions, and archive the run.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteAndCompare}
                    disabled={isComparing}
                    className="btn btn-lg btn-accent"
                    style={{ gap: '0.5rem', fontWeight: 600, marginTop: 'var(--spacing-xs)' }}
                  >
                    <Play size={16} />
                    <span>Run Benchmark ({variantConfig[selectedVariant].title})</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {/* State C: Comparison Results Ready */}
              {!isComparing && comparisonData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                  {/* Summary Card with Scores, Verdict, and Improvements */}
                  <div
                    style={{
                      backgroundColor: '#101018',
                      padding: 'var(--spacing-lg) var(--spacing-xl)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid rgba(139, 92, 246, 0.35)',
                      boxShadow: '0 4px 24px rgba(139, 92, 246, 0.15)',
                    }}
                  >
                    {/* Database Persistence Status Banner */}
                    {comparisonData.persistence?.saved ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                          padding: '0.45rem 0.85rem',
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: 'var(--spacing-md)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.785rem', color: '#10b981' }}>
                          <CheckCircle2 size={14} />
                          <strong>Saved to Supabase:</strong>
                          <span style={{ fontFamily: 'var(--font-mono)', color: '#e2e8f0', fontSize: '0.75rem' }}>
                            {comparisonData.persistence.recordId}
                          </span>
                        </div>

                        <Link
                          to="/app/history"
                          style={{
                            fontSize: '0.75rem',
                            color: '#22d3ee',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: 600,
                          }}
                        >
                          <span>View in History</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    ) : comparisonData.persistence && !comparisonData.persistence.saved ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                          padding: '0.45rem 0.85rem',
                          backgroundColor: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: 'var(--spacing-md)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.785rem', color: '#f59e0b', flex: 1, minWidth: '220px' }}>
                          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                          <span><strong>Database Notice:</strong> {comparisonData.persistence.error}</span>
                        </div>

                        <button
                          type="button"
                          onClick={handleRetrySave}
                          disabled={isRetryingSave}
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', gap: '0.35rem' }}
                        >
                          {isRetryingSave ? <RefreshCw size={12} className="animate-spin" /> : <Database size={12} />}
                          <span>{isRetryingSave ? 'Saving...' : 'Retry Save'}</span>
                        </button>
                      </div>
                    ) : null}

                    {/* Header + Score Gauge */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 'var(--spacing-md)',
                        marginBottom: 'var(--spacing-md)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.2rem' }}>
                          <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>AI Evaluation</span>
                          <span
                            className={comparisonData.provider === 'groq' ? 'badge badge-warning' : 'badge badge-violet'}
                            style={{ fontSize: '0.7rem' }}
                          >
                            {comparisonData.provider === 'groq' ? 'Groq' : 'Gemini'}
                            {comparisonData.fallbackUsed && ' (Fallback)'}
                          </span>
                          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                            Model: {comparisonData.model}
                          </span>
                          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                            Variant: {variantConfig[comparisonData.selectedVariant || selectedVariant]?.title || 'Refined'}
                          </span>
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                          Dual Execution Benchmark
                        </h2>
                      </div>

                      {/* Overall Scores */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-lg)',
                          padding: '0.45rem 1.25rem',
                          backgroundColor: '#08080E',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', textTransform: 'uppercase', fontWeight: 600 }}>
                            Original Prompt
                          </div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#9292a5', fontFamily: 'var(--font-mono)' }}>
                            {origOverall}
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)' }}> /10</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <ArrowRight size={15} color="var(--color-text-faint)" />
                          {scoreDiff !== 0 && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: scoreDiff > 0 ? '#10b981' : '#f59e0b',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {scoreDiff > 0 ? `+${scoreDiff.toFixed(1)}` : scoreDiff.toFixed(1)}
                            </span>
                          )}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.7rem', color: '#22d3ee', textTransform: 'uppercase', fontWeight: 700 }}>
                            Refined Prompt
                          </div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#22d3ee', fontFamily: 'var(--font-mono)' }}>
                            {refOverall}
                            <span style={{ fontSize: '0.85rem', color: 'rgba(34, 211, 238, 0.6)' }}> /10</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Verdict */}
                    <div
                      style={{
                        padding: 'var(--spacing-md)',
                        backgroundColor: '#08080E',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: '4px solid #8b5cf6',
                        fontSize: '0.875rem',
                        lineHeight: 1.55,
                        color: '#f8fafc',
                      }}
                    >
                      <strong style={{ color: '#8b5cf6' }}>Verdict: </strong>
                      {comparisonData.evaluation.verdict}
                    </div>

                    {/* Key Improvements & Remaining Issues */}
                    {(hasImprovements || hasIssues) && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: hasImprovements && hasIssues ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr',
                          gap: 'var(--spacing-sm)',
                          marginTop: 'var(--spacing-md)',
                        }}
                      >
                        {hasImprovements && (
                          <div
                            style={{
                              backgroundColor: 'rgba(16, 185, 129, 0.04)',
                              border: '1px solid rgba(16, 185, 129, 0.18)',
                              padding: '0.65rem 0.85rem',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <CheckCircle2 size={13} /> Key Improvements
                            </div>
                            <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.775rem', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
                              {comparisonData.evaluation.improvements.map((item, idx) => (
                                <li key={idx} style={{ marginBottom: '0.15rem' }}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {hasIssues && (
                          <div
                            style={{
                              backgroundColor: 'rgba(245, 158, 11, 0.04)',
                              border: '1px solid rgba(245, 158, 11, 0.18)',
                              padding: '0.65rem 0.85rem',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <AlertTriangle size={13} /> Remaining Cautions
                            </div>
                            <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.775rem', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
                              {comparisonData.evaluation.remainingIssues.map((item, idx) => (
                                <li key={idx} style={{ marginBottom: '0.15rem' }}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 5-Criteria Comparison Table */}
                  <div
                    style={{
                      backgroundColor: '#101018',
                      padding: 'var(--spacing-lg)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                        5-Criteria Evaluation Breakdown
                      </h3>
                      <p style={{ fontSize: '0.785rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0' }}>
                        Audited across 5 quality dimensions (Scale: 1.0 – 10.0)
                      </p>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--color-text-faint)', textAlign: 'left' }}>
                            <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>Criterion</th>
                            <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600, textAlign: 'center', width: '90px' }}>Original</th>
                            <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600, textAlign: 'center', width: '100px' }}>Refined</th>
                            <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>Evaluation Analysis</th>
                          </tr>
                        </thead>
                        <tbody>
                          {criteriaList.map((crit, idx) => {
                            const orig = comparisonData.evaluation.original[crit.key] || { score: 0, reason: '' };
                            const ref = comparisonData.evaluation.refined[crit.key] || { score: 0, reason: '' };
                            const diff = (ref.score - orig.score).toFixed(1);
                            const isBetter = ref.score > orig.score;
                            const isTied = ref.score === orig.score;

                            return (
                              <tr
                                key={crit.key}
                                style={{
                                  borderBottom: idx < criteriaList.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                                  backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                                }}
                              >
                                <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: '#f8fafc', verticalAlign: 'top' }}>
                                  <div>{crit.name}</div>
                                  <div style={{ fontSize: '0.725rem', color: 'var(--color-text-faint)', fontWeight: 400 }}>{crit.desc}</div>
                                </td>
                                <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontFamily: 'var(--font-mono)', verticalAlign: 'top' }}>
                                  <span className="badge badge-neutral" style={{ fontSize: '0.8rem', padding: '0.15rem 0.45rem' }}>
                                    {orig.score}
                                  </span>
                                </td>
                                <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontFamily: 'var(--font-mono)', verticalAlign: 'top' }}>
                                  <span
                                    className={isBetter ? 'badge badge-cyan' : isTied ? 'badge badge-neutral' : 'badge badge-warning'}
                                    style={{ fontSize: '0.8rem', padding: '0.15rem 0.45rem', fontWeight: 700 }}
                                  >
                                    {ref.score}
                                    {isBetter && <span style={{ fontSize: '0.675rem', marginLeft: '3px', opacity: 0.85 }}>+{diff}</span>}
                                  </span>
                                </td>
                                <td style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-muted)', fontSize: '0.8rem', lineHeight: 1.45 }}>
                                  <div>
                                    <span style={{ color: 'var(--color-text-faint)' }}>Original: </span>
                                    {orig.reason}
                                  </div>
                                  <div style={{ marginTop: '0.2rem' }}>
                                    <span style={{ color: '#22d3ee', fontWeight: 500 }}>Refined: </span>
                                    {ref.reason}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Generated AI Responses Side-by-Side */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                          Generated LLM Responses
                        </h3>
                        <p style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0' }}>
                          Side-by-side outputs from Google Gemini. Expand to inspect full response.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const anyExpanded = expandedOriginal || expandedRefined;
                          setExpandedOriginal(!anyExpanded);
                          setExpandedRefined(!anyExpanded);
                        }}
                        className="btn btn-sm btn-secondary"
                        style={{ gap: '0.35rem', fontSize: '0.75rem' }}
                      >
                        {expandedOriginal || expandedRefined ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                        <span>{expandedOriginal || expandedRefined ? 'Collapse All' : 'Expand All'}</span>
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-md)' }}>
                      {/* Left: Original Prompt Response */}
                      <div
                        style={{
                          backgroundColor: '#101018',
                          padding: 'var(--spacing-md)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                            Original Prompt Output
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(comparisonData.originalResponse, 'origResp')}
                            className="btn btn-sm btn-ghost"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            title="Copy response"
                          >
                            {copiedCard === 'origResp' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                            <span>{copiedCard === 'origResp' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>

                        <div style={{ position: 'relative' }}>
                          <div
                            style={{
                              backgroundColor: '#08080E',
                              padding: 'var(--spacing-md)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.825rem',
                              color: '#e2e8f0',
                              lineHeight: 1.6,
                              maxHeight: expandedOriginal ? '520px' : '150px',
                              overflowY: expandedOriginal ? 'auto' : 'hidden',
                              whiteSpace: 'pre-wrap',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                              transition: 'max-height 0.3s ease',
                            }}
                          >
                            {comparisonData.originalResponse}
                          </div>

                          {!expandedOriginal && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '60px',
                                background: 'linear-gradient(to bottom, transparent, #08080E)',
                                pointerEvents: 'none',
                                borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
                              }}
                            />
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedOriginal(!expandedOriginal)}
                          className="btn btn-sm btn-ghost"
                          style={{
                            width: '100%',
                            marginTop: '0.4rem',
                            fontSize: '0.75rem',
                            gap: '0.35rem',
                            color: 'var(--color-text-muted)',
                            justifyContent: 'center',
                          }}
                        >
                          {expandedOriginal ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          <span>{expandedOriginal ? 'Show Less' : 'Expand Full Response'}</span>
                        </button>
                      </div>

                      {/* Right: Refined Prompt Response */}
                      <div
                        style={{
                          backgroundColor: '#101018',
                          padding: 'var(--spacing-md)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(139, 92, 246, 0.35)',
                          boxShadow: '0 4px 16px rgba(139, 92, 246, 0.1)',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                          <span className="badge badge-violet" style={{ fontSize: '0.75rem' }}>
                            Refined Output ({variantConfig[comparisonData.selectedVariant || selectedVariant]?.title || 'Refined'})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(comparisonData.refinedResponse, 'refResp')}
                            className="btn btn-sm btn-ghost"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            title="Copy response"
                          >
                            {copiedCard === 'refResp' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                            <span>{copiedCard === 'refResp' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>

                        <div style={{ position: 'relative' }}>
                          <div
                            style={{
                              backgroundColor: '#08080E',
                              padding: 'var(--spacing-md)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.825rem',
                              color: '#ffffff',
                              lineHeight: 1.6,
                              maxHeight: expandedRefined ? '520px' : '150px',
                              overflowY: expandedRefined ? 'auto' : 'hidden',
                              whiteSpace: 'pre-wrap',
                              border: '1px solid rgba(139, 92, 246, 0.25)',
                              transition: 'max-height 0.3s ease',
                            }}
                          >
                            {comparisonData.refinedResponse}
                          </div>

                          {!expandedRefined && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '60px',
                                background: 'linear-gradient(to bottom, transparent, #08080E)',
                                pointerEvents: 'none',
                                borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
                              }}
                            />
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedRefined(!expandedRefined)}
                          className="btn btn-sm btn-ghost"
                          style={{
                            width: '100%',
                            marginTop: '0.4rem',
                            fontSize: '0.75rem',
                            gap: '0.35rem',
                            color: '#8b5cf6',
                            justifyContent: 'center',
                          }}
                        >
                          {expandedRefined ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          <span>{expandedRefined ? 'Show Less' : 'Expand Full Response'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
