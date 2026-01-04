import { useState } from 'react';

export default function AccessGate({ onAccess, onFail }) {
  const [code, setCode] = useState('');
  const REQUIRED_CODE = "1234"; // Hardcoded for this demo

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code === REQUIRED_CODE) {
      onAccess();
    } else {
      // "otherwise itll close the tab automatically"
      // Attempt to close
      try {
        window.close();
      } catch (err) {
        console.error("Window close blocked", err);
      }
      onFail(); // Parent handler should also try to force close or hide UI
    }
  };

  return (
    <div className="auth-container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div className="glass-panel">
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Restricted Access</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Enter absolute access code to proceed.
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="input-container" style={{ width: '100%', margin: 0 }}>
            <input
              type="password"
              className="input-field"
              placeholder="Enter Passcode..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              style={{ textAlign: 'center' }}
            />
          </div>

          <button type="submit" className="btn-primary">
            Verify Identity
          </button>
        </form>
      </div>
    </div>
  );
}
