import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--spacing-3xl) var(--spacing-lg)',
      }}
    >
      <div
        style={{
          fontSize: '6rem',
          fontWeight: 900,
          fontFamily: 'var(--font-mono)',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        404
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
        Page Not Found
      </h1>

      <p style={{ color: 'var(--color-text-muted)', maxWidth: '420px', marginBottom: 'var(--spacing-xl)', lineHeight: 1.6 }}>
        The requested URL was not found on this server. Return to the prompt workspace or the main landing page.
      </p>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
        <Link to="/app" className="btn btn-primary" style={{ gap: '0.45rem' }}>
          <Home size={16} />
          <span>Go to Workspace</span>
        </Link>
        <Link to="/" className="btn btn-secondary" style={{ gap: '0.45rem' }}>
          <ArrowLeft size={16} />
          <span>Landing Page</span>
        </Link>
      </div>
    </div>
  );
}
