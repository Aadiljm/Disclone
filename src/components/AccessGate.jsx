import { useState } from 'react';
import { verifyUser } from '../db';

export default function AccessGate({ onAccess }) {
  const [passcode, setPasscode] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Attempt to access with just the passcode
      const user = await verifyUser({ passcode });
      if (user) {
        onAccess(user);
      }
    } catch (err) {
      console.error(err);
      // Redirect to YT video on failure
      window.location.href = 'https://youtu.be/dQw4w9WgXcQ?si=IyaZ3huFgliB-1hO';
    }
  };

  return (
    <div className="auth-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div className="glass-panel" style={{ maxWidth: '400px', width: '90%' }}>
        <>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Restricted Access</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Enter access code to proceed.</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              className="input-field"
              placeholder="Access Code"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              required
              style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }}
            />
            <button type="submit" className="btn-primary">Enter</button>
          </form>
        </>
      </div>
    </div>
  );
}
