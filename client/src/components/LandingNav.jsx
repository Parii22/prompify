import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function LandingNav() {
  const navigate = useNavigate();

  const navStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    width: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
  };

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '72px',
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
  };

  const linkGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xl)',
  };

  const linkStyle = {
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
    transition: 'color var(--transition-fast)',
    fontWeight: 500,
  };

  return (
    <nav style={navStyle}>
      <div className="container" style={containerStyle}>
        {/* Brand Wordmark (No standalone decorative logo box) */}
        <Link to="/" style={logoStyle}>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.025em', color: '#ffffff' }}>
            Prompify<span style={{ color: '#22d3ee' }}>.</span>
          </span>
        </Link>

        {/* Navigation Anchors */}
        <div style={linkGroupStyle} className="hide-on-mobile">
          <a
            href="#features"
            style={linkStyle}
            onMouseEnter={(e) => (e.target.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--color-text-muted)')}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            style={linkStyle}
            onMouseEnter={(e) => (e.target.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--color-text-muted)')}
          >
            How It Works
          </a>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <button
            onClick={() => navigate('/app/workspace')}
            className="btn btn-sm btn-primary"
            style={{ gap: '0.45rem', fontWeight: 600 }}
          >
            <span>Open Workspace</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </nav>
  );
}
