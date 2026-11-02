import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { PlusCircle, ExternalLink } from 'lucide-react';

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/app':
        return 'Overview';
      case '/app/workspace':
        return 'Prompt Workspace';
      case '/app/history':
        return 'Refinement History';
      default:
        return 'Workspace';
    }
  };

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'rgba(19, 19, 29, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--spacing-xl)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Title & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Workspace</span>
          <span style={{ color: 'var(--color-text-faint)' }}>/</span>
          <span style={{ fontWeight: 600, color: '#f8fafc' }}>{getPageTitle(location.pathname)}</span>
        </div>
      </div>

      {/* Right Actions (No API Operational Badge) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <Link
          to="/"
          className="btn btn-sm btn-ghost"
          style={{ gap: '0.4rem', fontSize: '0.8rem' }}
          title="View Landing Page"
        >
          <span>Landing</span>
          <ExternalLink size={13} />
        </Link>

        {location.pathname !== '/app/workspace' && (
          <button
            onClick={() => navigate('/app/workspace')}
            className="btn btn-sm btn-primary"
            style={{ gap: '0.4rem', fontWeight: 600 }}
          >
            <PlusCircle size={15} />
            <span>New Refinement</span>
          </button>
        )}
      </div>
    </header>
  );
}
