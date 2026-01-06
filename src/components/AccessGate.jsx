import { useState } from 'react';
import { createUser, verifyUser } from '../db';

export default function AccessGate({ onAccess }) {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'created'
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [createdUser, setCreatedUser] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await verifyUser(username, passcode);
      if (user) {
        onAccess(user);
      } else {
        setError('Invalid credentials. Please check your username and passcode.');
      }
    } catch (err) {
      console.error(err);
      setError('Login failed. Please try again.');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    try {
      const user = await createUser(username);
      setCreatedUser(user);
      setMode('created');
    } catch (err) {
      console.error(err);
      setError('Signup failed.');
    }
  };

  const handleProceedAfterSignup = () => {
    // Auto login
    onAccess(createdUser);
  };

  return (
    <div className="auth-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div className="glass-panel" style={{ maxWidth: '400px', width: '90%' }}>

        {mode === 'login' && (
          <>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Welcome Back</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Login to access your secure channel.
            </p>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                className="input-field"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
              <input
                type="password"
                className="input-field"
                placeholder="Passcode (6 digits)"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                required
              />
              {error && <p style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>{error}</p>}
              <button type="submit" className="btn-primary">Login</button>
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Need an account? <span onClick={() => { setMode('signup'); setError(''); }} style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 'bold' }}>Create one</span>
              </p>
            </form>
          </>
        )}

        {mode === 'signup' && (
          <>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Create Account</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Enter a username to generate your personal key.
            </p>
            <form onSubmit={handleSignup}>
              <input
                type="text"
                className="input-field"
                placeholder="Choose a Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
              {error && <p style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>{error}</p>}
              <button type="submit" className="btn-primary">Generate Passcode</button>
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Already have an account? <span onClick={() => { setMode('login'); setError(''); }} style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 'bold' }}>Login</span>
              </p>
            </form>
          </>
        )}

        {mode === 'created' && createdUser && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#2ecc71' }}>Account Created!</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Please save your details. You will need the passcode to login.
            </p>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--accent-color)' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Username</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{createdUser.username}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Personal Passcode</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-color)', letterSpacing: '4px' }}>{createdUser.passcode}</span>
              </div>
            </div>

            <div style={{ color: '#f1c40f', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              ⚠ Do not lose this passcode! It cannot be recovered.
            </div>

            <button onClick={handleProceedAfterSignup} className="btn-primary">
              I have saved it, Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
