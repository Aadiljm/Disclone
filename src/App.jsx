import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import AccessGate from './components/AccessGate';
// Lazy load Dashboard to allow AccessGate to load faster on slow networks
const Dashboard = lazy(() => import('./components/Dashboard'));

function App() {
  const [accessState, setAccessState] = useState('checking'); // checking, gate, granted, terminated
  const [currentUser, setCurrentUser] = useState(null);

  const attemptClose = useCallback(() => {
    // Attempt to close the tab
    try {
      window.close();
    } catch (e) {
      console.error("Auto-close blocked by browser", e);
    }

    // If browser blocks window.close(), we simulate a "Gone" state
    // so the sensitive info is hidden immediately.
    setAccessState('terminated');
    setCurrentUser(null);
  }, []);

  const grantAccess = (user) => {
    localStorage.setItem('disclone_user', JSON.stringify(user));
    setCurrentUser(user);
    setAccessState('granted');
  };

  useEffect(() => {
    // 1. Initial Check
    const savedUser = localStorage.getItem('disclone_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user && user.username) {
          setCurrentUser(user);
          setAccessState('granted');
        } else {
          setAccessState('gate');
        }
      } catch (e) {
        setAccessState('gate');
      }
    } else {
      setAccessState('gate');
    }

    // 2. Visibility / Lifecycle Handler
    const handleVisibility = () => {
      if (document.hidden) {
        // "Whenever the user switches apps or tabs, the website automatically closes"
        attemptClose();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [attemptClose]);

  const handleManualClose = () => {
    localStorage.removeItem('disclone_user');
    attemptClose();
  };

  if (accessState === 'checking') {
    return null; // Or a loader
  }

  if (accessState === 'terminated') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'black', color: '#555' }}>
        <p>Session Closed</p>
        <button onClick={() => window.location.reload()} style={{ padding: '10px', marginTop: '10px' }}>Re-open</button>
      </div>
    );
  }

  return (
    <>
      {accessState === 'granted' ? (
        <Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: '#949BA4' }}>
            Loading App...
          </div>
        }>
          <Dashboard onClose={handleManualClose} currentUser={currentUser} />
        </Suspense>
      ) : (
        <AccessGate onAccess={grantAccess} onFail={attemptClose} />
      )}
    </>
  );
}

export default App;
