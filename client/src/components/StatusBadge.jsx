import React from 'react';
import { Activity } from 'lucide-react';

export function StatusBadge({ status = 'online', label, showIcon = true }) {
  const isHealthy = status === 'healthy' || status === 'online';
  const isPending = status === 'loading' || status === 'checking';

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    padding: '0.25rem 0.75rem',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.75rem',
    fontWeight: '600',
    backgroundColor: isHealthy
      ? 'rgba(16, 185, 129, 0.12)'
      : isPending
      ? 'rgba(245, 158, 11, 0.12)'
      : 'rgba(244, 63, 94, 0.12)',
    color: isHealthy ? '#34d399' : isPending ? '#fbbf24' : '#fb7185',
    border: `1px solid ${
      isHealthy
        ? 'rgba(16, 185, 129, 0.25)'
        : isPending
        ? 'rgba(245, 158, 11, 0.25)'
        : 'rgba(244, 63, 94, 0.25)'
    }`,
    boxShadow: isHealthy
      ? '0 0 10px rgba(16, 185, 129, 0.15)'
      : 'none',
  };

  const dotStyle = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'currentColor',
    boxShadow: '0 0 6px currentColor',
  };

  return (
    <span style={badgeStyle}>
      <span style={dotStyle} />
      {showIcon && <Activity size={12} style={{ opacity: 0.8 }} />}
      <span>{label || (isHealthy ? 'Backend Operational' : isPending ? 'Checking...' : 'Server Offline')}</span>
    </span>
  );
}
