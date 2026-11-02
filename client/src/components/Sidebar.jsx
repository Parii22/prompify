import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Terminal,
  History,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function Sidebar({ collapsed, setCollapsed }) {
  const navItems = [
    { name: 'Overview', path: '/app', icon: LayoutDashboard },
    { name: 'Prompt Workspace', path: '/app/workspace', icon: Terminal, badge: 'Core' },
    { name: 'History', path: '/app/history', icon: History },
  ];

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '260px',
        backgroundColor: '#13131D',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width var(--transition-normal)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* Top Header */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 var(--spacing-lg)',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        {!collapsed ? (
          <>
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#ffffff',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.025em' }}>
                Prompify<span style={{ color: '#22d3ee' }}>.</span>
              </span>
            </Link>

            <button
              onClick={() => setCollapsed(true)}
              style={{
                color: 'var(--color-text-muted)',
                padding: '0.25rem',
                borderRadius: 'var(--radius-xs)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            style={{
              color: 'var(--color-text-muted)',
              padding: '0.4rem',
              borderRadius: 'var(--radius-xs)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Expand sidebar"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: 'var(--spacing-md) var(--spacing-xs)', flex: 1 }}>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'var(--color-text-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: collapsed ? '0 0 var(--spacing-xs) 0' : '0 var(--spacing-md) var(--spacing-xs)',
            textAlign: collapsed ? 'center' : 'left',
          }}
        >
          {!collapsed ? 'Studio' : '•••'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/app'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'space-between',
                  padding: collapsed ? '0.75rem 0' : '0.65rem var(--spacing-md)',
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                  backgroundColor: isActive ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                  borderLeft: isActive ? '3px solid #8b5cf6' : '3px solid transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  transition: 'all var(--transition-fast)',
                })}
                title={collapsed ? item.name : undefined}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={18} style={{ minWidth: '18px' }} />
                  {!collapsed && <span>{item.name}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span className="badge badge-violet" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
