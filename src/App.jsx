import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import AccessGate from './components/AccessGate';
// Lazy load Dashboard to allow AccessGate to load faster on slow networks
const Dashboard = lazy(() => import('./components/Dashboard'));

function App() {
  const [accessState, setAccessState] = useState('checking'); // checking, gate, granted, terminated

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
  }, []);

  const grantAccess = () => {
    localStorage.setItem('disclone_access', 'true');
    setAccessState('granted');
  };

  useEffect(() => {
    // 1. Initial Check
    const hasAccess = localStorage.getItem('disclone_access');
    if (hasAccess === 'true') {
      setAccessState('granted');
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
    // "The website can only be fully closed when the user clicks on the close button"
    // AND "opens when ... (but this time it doesnt ask for an access code)"
    // Wait, if "Fully Closed" implies logging out, we should remove the token.
    // BUT the prompt says "Auto closes... opens again... no code".
    // Does Manual close mean "Log out"?
    // The prompt contrasts "Auto Close" (keeps auth) with "Full Close".
    // It's ambiguous if "Full Close" clears auth.
    // "create these first and ill tell you what changes to add next".
    // I will assume Main Close Button = Logout (Safety).
    // Auto Close = Session Pause (Convenience).

    localStorage.removeItem('disclone_access');
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
          <Dashboard onClose={handleManualClose} />
        </Suspense>
      ) : (
        <AccessGate onAccess={grantAccess} onFail={attemptClose} />
      )}
    </>
  );
}

export default App;
