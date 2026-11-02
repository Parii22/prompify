import React from 'react';

/**
 * Circular progress score indicator with violet/cyan accents
 */
export function CircularScore({
  score = 0,
  max = 10,
  size = 64,
  strokeWidth = 5,
  label = '',
  color = 'violet',
  sublabel = '',
}) {
  const normalizedPercentage = Math.min(100, Math.max(0, (score / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedPercentage / 100) * circumference;

  const strokeColor =
    color === 'cyan'
      ? '#22d3ee'
      : color === 'success'
      ? '#10b981'
      : color === 'warning'
      ? '#f59e0b'
      : '#8b5cf6';

  const glowColor =
    color === 'cyan'
      ? 'rgba(34, 211, 238, 0.4)'
      : color === 'success'
      ? 'rgba(16, 185, 129, 0.4)'
      : color === 'warning'
      ? 'rgba(245, 158, 11, 0.4)'
      : 'rgba(139, 92, 246, 0.4)';

  const formattedDisplay =
    typeof score === 'number'
      ? score % 1 === 0
        ? score.toString()
        : score.toFixed(1)
      : score;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              filter: `drop-shadow(0 0 6px ${glowColor})`,
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: size * 0.28,
            color: '#f8fafc',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1,
          }}
        >
          {formattedDisplay}
        </div>
      </div>
      {label && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500, textAlign: 'center' }}>
          {label}
        </span>
      )}
      {sublabel && (
        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}>
          {sublabel}
        </span>
      )}
    </div>
  );
}
