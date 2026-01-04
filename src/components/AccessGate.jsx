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
    <div className="glass-panel">
      <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Restricted Access</h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
        Enter absolute access code to proceed.
      </p>
      
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          className="input-field"
          placeholder="Enter Passcode..." // Prompt didn't strictly say it's numeric, but passcode implies it.
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
        />
        <button type="submit" className="btn-primary">
          Verify Identity
        </button>
      </form>
    </div>
  );
}
