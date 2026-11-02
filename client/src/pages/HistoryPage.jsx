import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Terminal,
  ArrowRight,
  Database,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Cpu,
  Clock,
  Eye,
} from 'lucide-react';
import * as historyService from '../services/history.service.js';

export function HistoryPage() {
  const navigate = useNavigate();

  // Query & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);

  // Data State
  const [historyData, setHistoryData] = useState({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    configured: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail Modal State
  const [activeItem, setActiveItem] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // reset to page 1 on search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch history records
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await historyService.fetchHistory({
        page,
        limit: 10,
        variant: filterType,
        search: debouncedSearch,
      });

      if (response && response.data) {
        setHistoryData(response.data);
      }
    } catch (err) {
      console.error('[History Fetch Error]:', err);
      setError(err.message || 'Failed to fetch prompt history.');
    } finally {
      setIsLoading(false);
    }
  }, [page, filterType, debouncedSearch]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Open detail view for a specific run
  const handleOpenDetail = async (item) => {
    setIsLoadingDetail(true);
    setDetailError(null);
    setActiveItem(item); // show initial summary while fetching full record

    try {
      const response = await historyService.fetchHistoryItem(item.id);
      if (response && response.data) {
        setActiveItem(response.data);
      }
    } catch (err) {
      console.error('[History Detail Fetch Error]:', err);
      setDetailError(err.message || 'Failed to load complete run details.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const criteriaKeys = [
    { key: 'relevance', name: 'Relevance' },
    { key: 'clarity', name: 'Clarity' },
    { key: 'completeness', name: 'Completeness' },
    { key: 'instructionAdherence', name: 'Instruction Adherence' },
    { key: 'usefulness', name: 'Usefulness' },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-cyan">Session Archive</span>
            <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
              Supabase PostgreSQL
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Refinement History
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Search and review past prompt evaluations, performance scores, and generated variations.
          </p>
        </div>

        <button
          onClick={() => navigate('/app/workspace')}
          className="btn btn-primary"
          style={{ gap: '0.5rem', fontWeight: 600 }}
        >
          <Terminal size={16} />
          <span>New Prompt Refinement</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="surface"
        style={{
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          gap: 'var(--spacing-md)',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-faint)',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts or topics..."
            className="input"
            style={{ paddingLeft: '2.4rem', backgroundColor: '#09090F' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={14} /> Variant:
          </span>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="input"
            style={{
              width: 'auto',
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              backgroundColor: '#09090F',
            }}
          >
            <option value="all">All Variations</option>
            <option value="balanced">Balanced</option>
            <option value="detailed">Detailed</option>
            <option value="concise">Concise</option>
          </select>

          <button
            onClick={loadHistory}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.45rem 0.75rem', gap: '0.35rem' }}
            title="Refresh history"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Database Setup Notice (If Supabase not yet configured) */}
      {!historyData.configured && (
        <div
          style={{
            padding: 'var(--spacing-md) var(--spacing-lg)',
            backgroundColor: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#c4b5fd' }}>
            <Database size={16} color="#8b5cf6" />
            <span>
              <strong>Supabase Database Ready:</strong> Provide <code>SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> in <code>server/.env</code> to activate live persistence.
            </span>
          </div>

          <span className="badge badge-violet" style={{ fontSize: '0.7rem' }}>
            Phase 5 Integration
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          style={{
            padding: 'var(--spacing-md) var(--spacing-lg)',
            backgroundColor: 'var(--color-error-bg)',
            border: '1px solid var(--color-error-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            color: '#fca5a5',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} style={{ color: 'var(--color-error)' }} />
            <span style={{ fontSize: '0.875rem' }}>{error}</span>
          </div>
          <button onClick={loadHistory} className="btn btn-sm btn-primary">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="surface" style={{ padding: 'var(--spacing-2xl)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: '#22d3ee', margin: '0 auto 0.75rem' }} />
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Loading saved prompt runs from Supabase...
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && historyData.items.length === 0 && (
        <div
          className="surface-elevated"
          style={{
            padding: 'var(--spacing-3xl) var(--spacing-xl)',
            textAlign: 'center',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid rgba(34, 211, 238, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22d3ee',
            }}
          >
            <Database size={28} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem' }}>
              {debouncedSearch || filterType !== 'all' ? 'No Matching Records Found' : 'No Stored Refinement Sessions'}
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto', lineHeight: 1.6 }}>
              {debouncedSearch || filterType !== 'all'
                ? 'Try adjusting your search keywords or filter to locate the desired run.'
                : 'Execute and compare prompts in the workspace to automatically archive evaluation runs in Supabase.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
            <button
              onClick={() => navigate('/app/workspace')}
              className="btn btn-primary"
              style={{ gap: '0.45rem', fontWeight: 600 }}
            >
              <span>Go to Prompt Workspace</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Populated History Cards List */}
      {!isLoading && !error && historyData.items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {historyData.items.map((item) => {
            const origScore = item.evaluation?.original?.overallScore ?? '—';
            const refScore = item.evaluation?.refined?.overallScore ?? '—';
            const verdict = item.evaluation?.verdict ?? 'No verdict available.';
            const isRefinedHigher = typeof refScore === 'number' && typeof origScore === 'number' && refScore > origScore;

            return (
              <div
                key={item.id}
                className="surface"
                style={{
                  padding: 'var(--spacing-lg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-sm)',
                }}
              >
                {/* Card Top Row: Variant, Date, and Inspect CTA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem' }}>
                    <span
                      className={
                        item.provider === 'groq'
                          ? 'badge badge-warning'
                          : 'badge badge-violet'
                      }
                      style={{ fontSize: '0.7rem' }}
                    >
                      {item.provider === 'groq' ? 'Groq' : 'Gemini'}
                    </span>

                    <span
                      className={
                        item.selected_variant === 'balanced'
                          ? 'badge badge-violet'
                          : item.selected_variant === 'detailed'
                          ? 'badge badge-cyan'
                          : 'badge badge-neutral'
                      }
                      style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
                    >
                      {item.selected_variant || 'balanced'}
                    </span>

                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {formatDate(item.created_at)}
                    </span>

                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}>
                      #{item.id.slice(0, 8)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    {/* Score comparison pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{origScore}</span>
                      <span style={{ color: 'var(--color-text-faint)' }}>&rarr;</span>
                      <span style={{ color: isRefinedHigher ? '#22d3ee' : '#ffffff', fontWeight: 700 }}>
                        {refScore}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenDetail(item)}
                      className="btn btn-sm btn-secondary"
                      style={{ gap: '0.35rem', fontSize: '0.75rem' }}
                    >
                      <Eye size={13} />
                      <span>Inspect Run</span>
                    </button>
                  </div>
                </div>

                {/* Prompt Preview */}
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>
                    Original Prompt
                  </div>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#f8fafc',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.original_prompt}
                  </div>
                </div>

                {/* Verdict Preview */}
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.45, fontStyle: 'italic' }}>
                  "{verdict.length > 180 ? `${verdict.slice(0, 180)}...` : verdict}"
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {historyData.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 'var(--spacing-md)',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Page {historyData.page} of {historyData.totalPages} ({historyData.total} total runs)
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="btn btn-sm btn-secondary"
                  style={{ gap: '0.3rem' }}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => setPage((prev) => Math.min(historyData.totalPages, prev + 1))}
                  disabled={!historyData.hasMore && page >= historyData.totalPages}
                  className="btn btn-sm btn-secondary"
                  style={{ gap: '0.3rem' }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* DETAIL INSPECTION MODAL                                   */}
      {/* ======================================================== */}
      {activeItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(9, 9, 15, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-md)',
          }}
          onClick={() => setActiveItem(null)}
        >
          <div
            className="surface-elevated"
            style={{
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              boxShadow: 'var(--shadow-glow-violet)',
              padding: 'var(--spacing-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid var(--color-border)',
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
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  Inspection: {activeItem.id}
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>
                  Recorded on {formatDate(activeItem.created_at)}
                </div>
              </div>

              <button
                onClick={() => setActiveItem(null)}
                className="btn btn-sm btn-ghost"
                style={{ padding: '0.3rem', color: 'var(--color-text-muted)' }}
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
                border: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--spacing-md)',
              }}
            >
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  AI Evaluation Verdict
                </div>
                <div style={{ fontSize: '0.875rem', color: '#f8fafc', lineHeight: 1.5 }}>
                  {activeItem.evaluation?.verdict || 'Verdict not recorded.'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>Original</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#9292a5', fontFamily: 'var(--font-mono)' }}>
                    {activeItem.evaluation?.original?.overallScore ?? '—'}
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}> /10</span>
                  </div>
                </div>

                <div style={{ color: 'var(--color-text-faint)' }}>&rarr;</div>

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-md)' }}>
              {/* Original Prompt */}
              <div className="surface" style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>
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
                    backgroundColor: '#09090F',
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--radius-sm)',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '160px',
                    overflowY: 'auto',
                  }}
                >
                  {activeItem.original_prompt}
                </div>
                {activeItem.objective && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <strong style={{ color: '#22d3ee' }}>Objective:</strong> {activeItem.objective}
                  </div>
                )}
              </div>

              {/* Selected Refined Prompt */}
              <div className="surface" style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c4b5fd', textTransform: 'uppercase' }}>
                    Selected Refined Prompt ({activeItem.selected_variant || 'balanced'})
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
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: '#09090F',
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--radius-sm)',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                  }}
                >
                  {activeItem.selected_refined_prompt}
                </div>
              </div>
            </div>

            {/* Generated AI Responses */}
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
                Generated Gemini Outputs
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-md)' }}>
                {/* Original Response */}
                <div className="surface" style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-faint)' }}>
                      Original AI Output
                    </span>
                    <button
                      onClick={() => handleCopy(activeItem.original_response, 'origResp')}
                      className="btn btn-sm btn-ghost"
                      style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                    >
                      {copiedId === 'origResp' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                      <span>{copiedId === 'origResp' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#cbd5e1',
                      backgroundColor: '#09090F',
                      padding: 'var(--spacing-sm)',
                      borderRadius: 'var(--radius-sm)',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      lineHeight: 1.5,
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {activeItem.original_response || 'No original response recorded.'}
                  </div>
                </div>

                {/* Refined Response */}
                <div className="surface" style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c4b5fd' }}>
                      Refined AI Output
                    </span>
                    <button
                      onClick={() => handleCopy(activeItem.refined_response, 'refResp')}
                      className="btn btn-sm btn-ghost"
                      style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                    >
                      {copiedId === 'refResp' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                      <span>{copiedId === 'refResp' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#ffffff',
                      backgroundColor: '#09090F',
                      padding: 'var(--spacing-sm)',
                      borderRadius: 'var(--radius-sm)',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      lineHeight: 1.5,
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                    }}
                  >
                    {activeItem.refined_response || 'No refined response recorded.'}
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Criteria Evaluation Table */}
            {activeItem.evaluation && (
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
                  5-Criteria Evaluation Breakdown
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-faint)', textAlign: 'left' }}>
                        <th style={{ padding: '0.4rem 0.6rem', fontWeight: 600 }}>Criterion</th>
                        <th style={{ padding: '0.4rem 0.6rem', textAlign: 'center', width: '80px' }}>Original</th>
                        <th style={{ padding: '0.4rem 0.6rem', textAlign: 'center', width: '80px' }}>Refined</th>
                        <th style={{ padding: '0.4rem 0.6rem' }}>Evaluation Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criteriaKeys.map((crit, idx) => {
                        const orig = activeItem.evaluation?.original?.[crit.key] || { score: '—', reason: '' };
                        const ref = activeItem.evaluation?.refined?.[crit.key] || { score: '—', reason: '' };

                        return (
                          <tr
                            key={crit.key}
                            style={{
                              borderBottom: idx < criteriaKeys.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                              backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                            }}
                          >
                            <td style={{ padding: '0.5rem 0.6rem', fontWeight: 600, color: '#f8fafc' }}>{crit.name}</td>
                            <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                              <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                                {orig.score}
                              </span>
                            </td>
                            <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                              <span className="badge badge-cyan" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                {ref.score}
                              </span>
                            </td>
                            <td style={{ padding: '0.5rem 0.6rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                              {ref.reason || orig.reason || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer with Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
              <button
                onClick={() => setActiveItem(null)}
                className="btn btn-secondary"
                style={{ fontWeight: 600 }}
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
