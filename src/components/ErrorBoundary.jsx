import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
        // If it's a chunk error, force reload automatically
        if (error.message && (error.message.includes('dynamically imported module') || error.message.includes('Importing a module script failed'))) {
            window.location.reload();
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', textAlign: 'center', color: 'white', background: '#1e1e1e', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <h1>Update Available</h1>
                    <p>We've updated the app. Please reload to continue.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '20px', padding: '10px 20px', background: '#5865F2', border: 'none', color: 'white', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem' }}
                    >
                        Reload App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
