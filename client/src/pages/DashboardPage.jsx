import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Terminal,
  History,
  Clock,
  Check,
  Copy,
  X,
  Layers,
  ChevronRight,
  Eye,
} from 'lucide-react';
import * as historyService from '../services/history.service.js';

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalRuns: 0, avgScore: null, recentRuns: [] });
  const [loading, setLoading] = useState(true);

  // Detail Modal State (Clicking a row inspects the full history record)
  const [activeItem, setActiveItem] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      try {
        const response = await historyService.fetchHistory({ page: 1, limit: 6 });
        if (isMounted && response?.data) {
          const items = response.data.items || response.data.runs || [];
          const total = typeof response.data.total === 'number' ? response.data.total : items.length;

          // Compute average refined score if evaluated runs exist
          let avg = null;
          const scoresWithValues = items
            .map((r) => r.evaluation?.refined?.overallScore)
            .filter((s) => typeof s === 'number');

          if (scoresWithValues.length > 0) {
            const sum = scoresWithValues.reduce((a, b) => a + b, 0);
            avg = (sum / scoresWithValues.length).toFixed(1);
          }

          setStats({
            totalRuns: total,
            avgScore: avg,
            recentRuns: items,
          });
        }
      } catch (err) {
        console.warn('[Dashboard stats error]:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const handleOpenDetail = async (item) => {
    setActiveItem(item);
    setIsLoadingDetail(true);
    try {
      const res = await historyService.fetchHistoryItem(item.id);
      if (res?.data) {
        setActiveItem(res.data);
      }
    } catch (err) {
      console.warn('[Dashboard detail load error]:', err.message);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      style={{
        maxWidth: '1160px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '3.5rem',
        paddingBottom: '4rem',
        position: 'relative',
      }}
    >
      {/* Subtle Atmospheric Ambient Lighting */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          right: '5%',
          width: '500px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
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
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ============================================================ */}
      {/* 1. HERO SECTION — EDITORIAL ASYMMETRIC COMPOSITION           */}
      {/* ============================================================ */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3rem',
          alignItems: 'center',
          paddingTop: '0.5rem',
        }}
      >
        {/* Left Column: Editorial Typography & Narrative */}
        <div style={{ maxWidth: '620px' }}>
          {/* Eyebrow Label */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginBottom: '1.25rem',
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
              PROMPT INTELLIGENCE / YOUR WORKSPACE
            </span>
          </div>

          {/* Large Expressive Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 4.5vw, 3.75rem)',
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              color: '#f8fafc',
              margin: '0 0 1.25rem 0',
            }}
          >
            Make every{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              prompt count.
            </span>
          </h1>

          {/* Supporting Text */}
          <div
            style={{
              fontSize: '1.15rem',
              fontWeight: 600,
              color: '#c4b5fd',
              letterSpacing: '-0.01em',
              marginBottom: '0.75rem',
            }}
          >
            Diagnose. Refine. Execute. Compare.
          </div>

          <p
            style={{
              color: '#9292a5',
              fontSize: '1rem',
              lineHeight: 1.65,
              maxWidth: '520px',
              margin: '0 0 2rem 0',
            }}
          >
            An impartial prompt engineering studio that audits structural weaknesses, synthesizes calibrated variations, and benchmarks model responses side-by-side with matched parameters.
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <button
              onClick={() => navigate('/app/workspace')}
              className="btn btn-primary"
              style={{
                padding: '0.8rem 1.6rem',
                fontSize: '0.92rem',
                fontWeight: 600,
                gap: '0.6rem',
                boxShadow: '0 4px 24px rgba(139, 92, 246, 0.25)',
                transition: 'all 0.2s ease',
              }}
            >
              <Terminal size={16} />
              <span>Start New Refinement</span>
              <ArrowRight size={15} />
            </button>

            <button
              onClick={() => navigate('/app/history')}
              style={{
                background: 'none',
                border: 'none',
                color: '#9292a5',
                fontSize: '0.92rem',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '0.5rem 0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9292a5';
              }}
            >
              <span>View History</span>
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>

        {/* Right Column: Abstract Prompt-Transformation Visualization */}
        <div
          style={{
            position: 'relative',
            padding: '2rem',
            borderRadius: '20px',
            background: 'linear-gradient(145deg, rgba(19, 19, 29, 0.5) 0%, rgba(9, 9, 15, 0.75) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Schematic Stage 1: Raw Prompt */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              backgroundColor: '#0c0c14',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9292a5', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Stage 01 • Raw Prompt
              </span>
              <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                Uncalibrated
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.4 }}>
              "Explain how caching works and why we need it."
            </div>
          </div>

          {/* Transition Connector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.25rem' }}>
            <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(139, 92, 246, 0.4)' }} />
            <span style={{ fontSize: '0.7rem', color: '#8b5cf6', fontWeight: 600, letterSpacing: '0.04em' }}>
              Diagnostic Audit &amp; Structural Synthesis
            </span>
          </div>

          {/* Schematic Stage 2: Refined Prompt */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              backgroundColor: '#12121e',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.08)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Stage 02 • Refined Prompt
              </span>
              <span className="badge badge-violet" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                Balanced • Fidelity Preserved
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#f8fafc', lineHeight: 1.4 }}>
              "Explain caching mechanisms in distributed systems. Cover eviction policies, cache invalidation, and practical trade-offs."
            </div>
          </div>

          {/* Transition Connector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.25rem' }}>
            <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(34, 211, 238, 0.4)' }} />
            <span style={{ fontSize: '0.7rem', color: '#22d3ee', fontWeight: 600, letterSpacing: '0.04em' }}>
              Dual Execution &amp; 5-Criteria Benchmark
            </span>
          </div>

          {/* Schematic Stage 3: Better Results */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              backgroundColor: '#0c0c14',
              border: '1px solid rgba(34, 211, 238, 0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#a5f3fc', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Stage 03 • Benchmark Results
              </div>
              <div style={{ fontSize: '0.8rem', color: '#9292a5' }}>
                Impartial evaluation across Relevance, Clarity &amp; Utility
              </div>
            </div>
            <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#22d3ee' }}>
                +2.2
              </div>
              <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>
                Score Gain
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. STATISTICS — HORIZONTAL EDITORIAL STRIP                   */}
      {/* ============================================================ */}
      <section
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2.5rem 0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center',
          }}
        >
          {/* Stat 1: Total Prompts Refined */}
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#9292a5',
                marginBottom: '0.5rem',
              }}
            >
              TOTAL PROMPTS REFINED
            </div>
            <div
              style={{
                fontSize: '3.25rem',
                fontWeight: 800,
                color: '#f8fafc',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1,
                marginBottom: '0.5rem',
                letterSpacing: '-0.03em',
              }}
            >
              {loading ? '—' : stats.totalRuns}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#9292a5' }}>
              {stats.totalRuns > 0
                ? `${stats.totalRuns} execution runs archived in Supabase`
                : 'Awaiting your first prompt execution'}
            </div>
          </div>

          {/* Stat 2: Average Refined Quality Score */}
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#9292a5',
                marginBottom: '0.5rem',
              }}
            >
              AVERAGE REFINED QUALITY SCORE
            </div>
            <div
              style={{
                fontSize: '3.25rem',
                fontWeight: 800,
                color: stats.avgScore ? '#22d3ee' : '#f8fafc',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1,
                marginBottom: '0.5rem',
                letterSpacing: '-0.03em',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.35rem',
              }}
            >
              {loading ? '—' : stats.avgScore || '—'}
              {stats.avgScore && (
                <span style={{ fontSize: '1.25rem', color: '#9292a5', fontWeight: 600 }}>/ 10</span>
              )}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#9292a5' }}>
              {stats.avgScore
                ? 'Derived from 5-metric comparative evaluations'
                : 'Calculated dynamically after initial benchmark'}
            </div>
          </div>

          {/* Stat 3: Architecture / Inference Engine Status */}
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#9292a5',
                marginBottom: '0.5rem',
              }}
            >
              INFERENCE ARCHITECTURE
            </div>
            <div
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#f8fafc',
                lineHeight: 1.2,
                marginBottom: '0.5rem',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
              }}
            >
              <span>Dual LLM Engine</span>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 10px #10b981',
                  display: 'inline-block',
                }}
              />
            </div>
            <div style={{ fontSize: '0.82rem', color: '#9292a5' }}>
              Primary: Gemini 3.5 • Automatic fallback: Groq Cloud
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. RECENT ACTIVITY — EDITORIAL ROW LIST                      */}
      {/* ============================================================ */}
      <section style={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.025em',
                margin: '0 0 0.35rem 0',
              }}
            >
              Recent work.
            </h2>
            <p style={{ color: '#9292a5', fontSize: '0.9rem', margin: 0 }}>
              Previous refinement sessions, benchmark evaluations, and archived prompt runs.
            </p>
          </div>

          <button
            onClick={() => navigate('/app/history')}
            style={{
              background: 'none',
              border: 'none',
              color: '#c4b5fd',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'color 0.2s ease',
              padding: '0.25rem 0',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#c4b5fd';
            }}
          >
            <span>View full archive</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Row-Based List (No boxed cards) */}
        {stats.recentRuns.length > 0 ? (
          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {stats.recentRuns.map((run) => {
              const origScore = run.evaluation?.original?.overallScore;
              const refScore = run.evaluation?.refined?.overallScore;
              const provider = run.provider || run.evaluation?.provider || 'gemini';

              return (
                <div
                  key={run.id}
                  onClick={() => handleOpenDetail(run)}
                  style={{
                    padding: '1.25rem 0.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    borderRadius: '8px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.paddingLeft = '0.75rem';
                    e.currentTarget.style.paddingRight = '0.75rem';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.paddingLeft = '0.5rem';
                    e.currentTarget.style.paddingRight = '0.5rem';
                  }}
                >
                  {/* Left: Original Prompt Title / Excerpt */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.96rem',
                        fontWeight: 600,
                        color: '#f8fafc',
                        lineHeight: 1.4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '0.4rem',
                      }}
                    >
                      {run.original_prompt || 'Untitled prompt'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span
                        className={provider === 'groq' ? 'badge badge-warning' : 'badge badge-violet'}
                        style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}
                      >
                        {provider === 'groq' ? 'Groq' : 'Gemini'}
                      </span>

                      <span
                        className={
                          run.selected_variant === 'detailed'
                            ? 'badge badge-cyan'
                            : run.selected_variant === 'concise'
                            ? 'badge badge-neutral'
                            : 'badge badge-violet'
                        }
                        style={{ fontSize: '0.68rem', textTransform: 'capitalize', padding: '0.1rem 0.45rem' }}
                      >
                        {run.selected_variant || 'balanced'}
                      </span>

                      <span style={{ fontSize: '0.75rem', color: '#9292a5', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={11} />
                        {formatDate(run.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Scores & Inspect Action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
                    {typeof refScore === 'number' && (
                      <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.92rem' }}>
                          {typeof origScore === 'number' && (
                            <>
                              <span style={{ color: '#9292a5' }}>{origScore}</span>
                              <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>&rarr;</span>
                            </>
                          )}
                          <span style={{ color: '#22d3ee', fontWeight: 700 }}>
                            {refScore}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#9292a5', textTransform: 'uppercase' }}>
                          Score / 10
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9292a5',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Editorial Empty State */
          <div
            style={{
              padding: '4rem 1.5rem',
              textAlign: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#8b5cf6',
              }}
            >
              <Sparkles size={20} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
              No prompt sessions recorded yet.
            </h3>
            <p style={{ color: '#9292a5', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.75rem', lineHeight: 1.5 }}>
              Enter any raw prompt into the Prompt Studio. Prompify will audit structural weaknesses and generate three production-ready candidates.
            </p>

            <button
              onClick={() => navigate('/app/workspace')}
              className="btn btn-primary"
              style={{ gap: '0.5rem', fontWeight: 600 }}
            >
              <span>Start Your First Refinement</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 4. DETAIL INSPECTION MODAL (Opens when clicking any row)     */}
      {/* ============================================================ */}
      {activeItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 5, 10, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-md)',
          }}
          onClick={() => setActiveItem(null)}
        >
          <div
            style={{
              backgroundColor: '#101018',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 'var(--spacing-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-lg)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: 'var(--spacing-md)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.25rem' }}>
                  <span className="badge badge-cyan">Saved Run Record</span>
                  <span
                    className={activeItem.provider === 'groq' ? 'badge badge-warning' : 'badge badge-violet'}
                    style={{ fontSize: '0.7rem' }}
                  >
                    Provider: {activeItem.provider === 'groq' ? 'Groq' : 'Gemini'}
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                    Variant: {activeItem.selected_variant || 'balanced'}
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                    {activeItem.model || 'gemini-3.5-flash-lite'}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0.25rem 0' }}>
                  Inspection: {activeItem.id}
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#9292a5' }}>
                  Recorded on {formatDate(activeItem.created_at)}
                </div>
              </div>

              <button
                onClick={() => setActiveItem(null)}
                className="btn btn-sm btn-ghost"
                style={{ padding: '0.3rem', color: '#9292a5' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Score Banner & Verdict */}
            <div
              style={{
                padding: 'var(--spacing-md) var(--spacing-lg)',
                backgroundColor: '#09090F',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--spacing-md)',
              }}
            >
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  AI Evaluation Verdict
                </div>
                <div style={{ fontSize: '0.875rem', color: '#f8fafc', lineHeight: 1.5 }}>
                  {activeItem.evaluation?.verdict || 'Verdict not recorded.'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#9292a5', textTransform: 'uppercase' }}>Original</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#9292a5', fontFamily: 'var(--font-mono)' }}>
                    {activeItem.evaluation?.original?.overallScore ?? '—'}
                    <span style={{ fontSize: '0.75rem', color: '#9292a5' }}> /10</span>
                  </div>
                </div>

                <div style={{ color: '#9292a5' }}>&rarr;</div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#22d3ee', textTransform: 'uppercase', fontWeight: 700 }}>Refined</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22d3ee', fontFamily: 'var(--font-mono)' }}>
                    {activeItem.evaluation?.refined?.overallScore ?? '—'}
                    <span style={{ fontSize: '0.75rem', color: 'rgba(34, 211, 238, 0.6)' }}> /10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Original vs Selected Refined Prompt */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
              {/* Original Prompt */}
              <div style={{ backgroundColor: '#09090F', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9292a5', textTransform: 'uppercase' }}>
                    Original Prompt
                  </span>
                  <button
                    onClick={() => handleCopy(activeItem.original_prompt, 'origPrompt')}
                    className="btn btn-sm btn-ghost"
                    style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                  >
                    {copiedId === 'origPrompt' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                    <span>{copiedId === 'origPrompt' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: '#e2e8f0',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: '#050508',
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--radius-sm)',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '160px',
                    overflowY: 'auto',
                  }}
                >
                  {activeItem.original_prompt}
                </div>
              </div>

              {/* Selected Refined Prompt */}
              <div style={{ backgroundColor: '#09090F', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase' }}>
                    Selected Refined ({activeItem.selected_variant || 'balanced'})
                  </span>
                  <button
                    onClick={() => handleCopy(activeItem.selected_refined_prompt, 'refPrompt')}
                    className="btn btn-sm btn-ghost"
                    style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                  >
                    {copiedId === 'refPrompt' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                    <span>{copiedId === 'refPrompt' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: '#f8fafc',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: '#050508',
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--radius-sm)',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '160px',
                    overflowY: 'auto',
                  }}
                >
                  {activeItem.selected_refined_prompt || 'Selected refined prompt not stored.'}
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                onClick={() => {
                  setActiveItem(null);
                  navigate('/app/history');
                }}
                className="btn btn-sm btn-secondary"
                style={{ gap: '0.4rem' }}
              >
                <span>View Full Record in History</span>
                <ArrowRight size={13} />
              </button>
              <button
                onClick={() => setActiveItem(null)}
                className="btn btn-sm btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
