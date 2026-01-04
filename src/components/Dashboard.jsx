import React, { useState, useEffect, useRef, useCallback } from 'react';
import { addMessage, getMessages } from '../db';

/**
 * Mobile-First Dashboard Component
 * Designed for one-handed use and compact visual scanning.
 */
export default function Dashboard({ onClose }) {
    const [activeTab, setActiveTab] = useState('home');
    const [inputText, setInputText] = useState('');
    const [interactions, setInteractions] = useState([]);
    const mainRef = useRef(null);

    // Intent: Navigation between logical areas
    const tabs = [
        { id: 'servers', label: 'Nodes', icon: '🌐' },
        { id: 'channels', label: 'Routes', icon: '💬' },
        { id: 'home', label: 'Primary', icon: '⚡' },
        { id: 'profile', label: 'Identity', icon: '👤' }
    ];

    const scrollToBottom = useCallback(() => {
        if (mainRef.current) {
            mainRef.current.scrollTop = mainRef.current.scrollHeight;
        }
    }, []);

    const loadData = useCallback(async () => {
        try {
            const data = await getMessages();
            // Logic remained for functionality, but UI/UX is redesigned
            setInteractions(data.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20));
            scrollToBottom();
        } catch (e) {
            console.error(e);
        }
    }, [scrollToBottom]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAction = async () => {
        if (!inputText.trim()) return;

        // Maintain functional intent: Persisting a text item
        const newItem = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            type: 'text',
            content: inputText,
            timestamp: Date.now()
        };

        await addMessage(newItem);
        setInputText('');
        loadData();
    };

    return (
        <div className="app-shell">
            {/* Navigation Area - Top Context */}
            <header className="app-header">
                <div className="header-context">
                    <div className="avatar-placeholder" style={{ width: 28, height: 28 }}></div>
                    <span className="header-title">DISCLONE CORE</span>
                </div>
                <button className="icon-button" onClick={onClose} style={{ color: '#ed4245' }}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>

            {/* Main Interaction Area */}
            <main className="app-main" ref={mainRef}>
                {/* Concept Layout Items (Ignoring actual chat content semantics) */}
                {interactions.map((it) => (
                    <div key={it.id} className="interaction-card">
                        <div className="card-header">
                            <div className="avatar-placeholder" style={{ opacity: 0.5 }}></div>
                            <div className="meta-group">
                                <div className="title-line"></div>
                                <div className="subtitle-line"></div>
                            </div>
                        </div>
                        <div className="message-content">
                            {it.content}
                        </div>
                        {it.type !== 'text' && <div className="content-block"></div>}
                    </div>
                ))}

                {/* Placeholder for visual scanner depth */}
                <div className="interaction-card" style={{ opacity: 0.4 }}>
                    <div className="card-header"><div className="avatar-placeholder"></div><div className="meta-group"><div className="title-line"></div><div className="subtitle-line"></div></div></div>
                    <div className="content-block"></div>
                </div>
            </main>

            {/* Interaction/Actions Dock - Thumb friendly placement */}
            <div className="action-dock">
                <div className="input-container">
                    <button className="icon-button">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>

                    <input
                        type="text"
                        className="input-field"
                        placeholder="Initialize interaction..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                    />

                    <button className="icon-button primary" onClick={handleAction}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Utility Navigation Area - Bottom Tabs */}
            <nav className="bottom-nav">
                {tabs.map((tab) => (
                    <a
                        key={tab.id}
                        className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span style={{ fontSize: '1.4rem' }}>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </a>
                ))}
            </nav>
        </div>
    );
}
