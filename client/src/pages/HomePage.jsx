import React from 'react';
import { useHealthCheck } from '../hooks/useHealthCheck.js';
import { StatusBadge } from '../components/StatusBadge.jsx';

export function HomePage() {
  const { data: health, loading, error, refetch } = useHealthCheck();

  const sectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-lg)',
  };

  const statusCardStyle = {
    backgroundColor: 'var(--color-bg-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--spacing-lg)',
  };

  const statusHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--spacing-md)',
    flexWrap: 'wrap',
    gap: 'var(--spacing-sm)',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 'var(--spacing-md)',
    marginTop: 'var(--spacing-md)',
  };

  const metricBoxStyle = {
    background: '#f8fafc',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    padding: 'var(--spacing-md)',
  };

  const metricLabelStyle = {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
  };

  const metricValueStyle = {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--color-text-main)',
  };

  const refreshBtnStyle = {
    padding: '0.4rem 0.85rem',
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
    borderRadius: 'var(--radius-sm)',
    fontWeight: '500',
    fontSize: '0.85rem',
  };

  const moduleListStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 'var(--spacing-md)',
    marginTop: 'var(--spacing-md)',
  };

  const moduleItemStyle = {
    padding: 'var(--spacing-md)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: '#fafafa',
  };

  return (
    <div style={sectionStyle}>
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', marginBottom: '0.5rem' }}>
          Phase 1: Project Foundation Verified
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Core architecture initialized with React (Vite) frontend and Express.js REST backend.
        </p>
      </div>

      {/* Backend Communication Status */}
      <div style={statusCardStyle}>
        <div style={statusHeaderStyle}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Backend Health Status</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Target endpoint: <code className="code-snippet">/api/health</code>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <StatusBadge
              status={loading ? 'loading' : error ? 'error' : health?.status || 'unknown'}
              label={loading ? 'Checking...' : error ? 'Offline / Error' : 'Connected'}
            />
            <button style={refreshBtnStyle} onClick={refetch} disabled={loading}>
              {loading ? 'Pinging...' : 'Ping Server'}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
            }}
          >
            <strong>Connection Failed:</strong> {error}
          </div>
        )}

        {health && !error && (
          <div style={gridStyle}>
            <div style={metricBoxStyle}>
              <div style={metricLabelStyle}>Backend Service</div>
              <div style={metricValueStyle}>{health.service}</div>
            </div>
            <div style={metricBoxStyle}>
              <div style={metricLabelStyle}>Uptime</div>
              <div style={metricValueStyle}>{health.uptimeSeconds} seconds</div>
            </div>
            <div style={metricBoxStyle}>
              <div style={metricLabelStyle}>Environment</div>
              <div style={metricValueStyle}>{health.environment}</div>
            </div>
            <div style={metricBoxStyle}>
              <div style={metricLabelStyle}>Server Timestamp</div>
              <div style={{ ...metricValueStyle, fontSize: '0.875rem' }}>{health.timestamp}</div>
            </div>
          </div>
        )}
      </div>

      {/* Architecture Readiness Card */}
      <div style={statusCardStyle}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem' }}>
          Future Integration Architecture (Phase 2 Readiness)
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Architectural boundaries and service layers prepared for upcoming AI and persistence modules:
        </p>

        <div style={moduleListStyle}>
          <div style={moduleItemStyle}>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>1. Prompt Analysis</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Identify weaknesses, structural gaps, and clarity bottlenecks.
            </p>
          </div>
          <div style={moduleItemStyle}>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>2. AI Prompt Refinement</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Generate structured, high-context prompts using Google Gemini.
            </p>
          </div>
          <div style={moduleItemStyle}>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>3. Dual Execution Engine</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Execute original and refined prompts side-by-side.
            </p>
          </div>
          <div style={moduleItemStyle}>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>4. LLM Quality Evaluation</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Compare responses on clarity, accuracy, and adherence.
            </p>
          </div>
          <div style={moduleItemStyle}>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>5. Supabase Persistence</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Store prompts, evaluations, and history in PostgreSQL.
            </p>
          </div>
          <div style={moduleItemStyle}>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>6. Automated History Tracking</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Review past refinement runs and comparative score trends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
