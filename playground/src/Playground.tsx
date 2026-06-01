import React, { useState } from 'react';

export const Playground: React.FC = () => {
  const [counter, setCounter] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <p style={{ color: 'var(--text-muted)' }}>
        This is your clean sandbox. Edit <code>src/Playground.tsx</code> to start practicing React & TypeScript concepts!
      </p>

      {/* Clean Slate Card */}
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--color-primary)' }}>
          Interactive Workspace
        </h3>
        
        <div style={{ margin: '20px 0' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '12px' }}>
            Counter: <span style={{ fontWeight: 'bold', color: 'var(--color-accent)' }}>{counter}</span>
          </p>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setCounter(c => c + 1)}
            >
              Increment
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setCounter(0)}
            >
              Reset
            </button>
          </div>
        </div>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-dimmed)' }}>
          Vanilla CSS variables & styles are ready to use.
        </span>
      </div>
    </div>
  );
};
