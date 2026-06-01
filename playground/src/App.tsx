import { Header } from './components/Header';
import { Playground } from './Playground';

function App() {
  return (
    <div style={{
      maxWidth: '800px',
      width: '100%',
      margin: '0 auto',
      padding: '0 20px 40px 20px',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      {/* App Header */}
      <Header />

      {/* Main Workspace Layout */}
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flexGrow: 1
      }}>
        <div className="glass-panel" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          borderRadius: 'var(--radius-sm)'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            Practice Sandbox
          </h2>
        </div>

        {/* Workspace Canvas */}
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', minHeight: '400px' }}>
          <Playground />
        </div>
      </main>
    </div>
  );
}

export default App;
