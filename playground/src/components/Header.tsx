import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="glass-panel" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      borderRadius: '0 0 var(--radius-md) var(--radius-md)',
      borderTop: 'none',
      marginBottom: '24px'
    }}>
      {/* Brand Logo and Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
        }}>
          {/* Atomic React Spin Logo representation */}
          <span style={{
            position: 'absolute',
            width: '18px',
            height: '18px',
            border: '2px solid rgba(255,255,255,0.7)',
            borderRadius: '50%',
            transform: 'rotateX(70deg)'
          }}></span>
          <span style={{
            position: 'absolute',
            width: '18px',
            height: '18px',
            border: '2px solid rgba(255,255,255,0.7)',
            borderRadius: '50%',
            transform: 'rotateY(70deg)'
          }}></span>
          <span style={{
            position: 'absolute',
            width: '5px',
            height: '5px',
            background: '#fff',
            borderRadius: '50%'
          }}></span>
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.01em', background: 'linear-gradient(135deg, var(--text-main), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            React Interview Sandbox
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vite + TypeScript Playground</p>
        </div>
      </div>

      {/* Tech Badges / Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Vite Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(0, 0, 0, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-full)',
          padding: '4px 10px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)' }}></span>
          Vite v5
        </div>

        {/* React Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(0, 0, 0, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-full)',
          padding: '4px 10px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)' }}></span>
          React 18
        </div>

        {/* TypeScript Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(0, 0, 0, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-full)',
          padding: '4px 10px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#3178c6' }}></span>
          TS v5
        </div>
      </div>
    </header>
  );
};
