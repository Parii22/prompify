import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export function MainLayout() {
  const { appName, phase } = useApp();

  const headerStyle = {
    backgroundColor: 'var(--color-bg-surface)',
    borderBottom: '1px solid var(--color-border)',
    padding: 'var(--spacing-md) 0',
    marginBottom: 'var(--spacing-xl)',
  };

  const navContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const logoStyle = {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--color-text-main)',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const metaStyle = {
    fontSize: '0.875rem',
    backgroundColor: 'var(--color-primary-light)',
    color: 'var(--color-primary)',
    padding: '0.2rem 0.6rem',
    borderRadius: 'var(--radius-sm)',
    fontWeight: '500',
  };

  const footerStyle = {
    marginTop: 'var(--spacing-2xl)',
    padding: 'var(--spacing-lg) 0',
    borderTop: '1px solid var(--color-border)',
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
  };

  return (
    <div>
      <header style={headerStyle}>
        <div className="container" style={navContainerStyle}>
          <Link to="/" style={logoStyle}>
            ⚡ {appName}
          </Link>
          <span style={metaStyle}>{phase}</span>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>

      <footer style={footerStyle}>
        <div className="container">
          <p>Prompify &bull; Full-stack architecture verification</p>
        </div>
      </footer>
    </div>
  );
}
