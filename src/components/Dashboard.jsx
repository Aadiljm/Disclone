import React, { useState, useEffect, useRef, useCallback } from 'react';
import { addMessage, getMessages } from '../db';

// --- Icons (Simplified SVGs) ---
const HomeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L4 9v11a2 2 0 002 2h4v-7h4v7h4a2 2 0 002-2V9l-8-7z" />
    </svg>
);

const BellIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const MessageCirclePlus = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L22 4z"></path>
        <line x1="12" y1="9" x2="12" y2="15"></line>
        <line x1="9" y1="12" x2="15" y2="12"></line>
    </svg>
);

// --- Sub-components ---

const ChatView = ({ friend, onBack, messages, onSend, onUpload, onRecord, isRecording }) => {
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [text, setText] = useState('');

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (text.trim()) {
            onSend(text);
            setText('');
        }
    };

    return (
        <div className="chat-overlay animate-slide">
            <header className="chat-header" style={{ padding: '0 16px', background: 'var(--bottom-nav-bg)' }}>
                <button className="nav-icon" style={{ background: 'none', border: 'none', color: 'white', padding: '8px', marginRight: '8px' }} onClick={onBack}>←</button>
                <h3>{friend.name}</h3>
            </header>

            <div className="message-list" style={{ padding: '16px 0' }}>
                {messages.map(msg => (
                    <div key={msg.id} className="message-bubble">
                        <div className="avatar-small"></div>
                        <div className="dm-content">
                            <div className="dm-name-row">
                                <span className="dm-name" style={{ fontSize: '14px' }}>{msg.author}</span>
                                <span className="message-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="message-content">{msg.content instanceof Blob ? (
                                msg.type === 'image' ? <img src={URL.createObjectURL(msg.content)} style={{ maxWidth: '100%', borderRadius: '8px' }} /> :
                                    msg.type === 'video' ? <video controls src={URL.createObjectURL(msg.content)} style={{ maxWidth: '100%', borderRadius: '8px' }} /> :
                                        msg.type === 'voice' ? <audio controls src={URL.createObjectURL(msg.content)} /> : 'File'
                            ) : msg.content}</div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-wrapper">
                <div className="chat-input-box">
                    <button className="action-btn" onClick={() => fileInputRef.current.click()}>+</button>
                    <input
                        type="file"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={(e) => onUpload(e.target.files[0])}
                        accept="video/*,image/*"
                    />
                    <input
                        className="chat-input"
                        placeholder={`Message @${friend.name}`}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <div className="input-actions" style={{ gap: '12px' }}>
                        <button className={`action-btn ${isRecording ? 'recording' : ''}`} onClick={onRecord}>🎙️</button>
                        <button className="action-btn" style={{ color: text ? 'var(--accent-blue)' : 'inherit' }} onClick={handleSend}>➤</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HomeScreen = ({ onOpenChat }) => {
    const friends = [
        { id: 1, name: 'Sarah', status: 'online', lastMsg: 'Ik ur busy and dw I\'ll be on standby', time: '3d' },
        { id: 2, name: 'chixirra', status: 'offline', lastMsg: 'Accepted your friend request', time: '1mo' },
        { id: 3, name: 'Wannaabeyourss', status: 'online', lastMsg: 'Hello there!', time: '2mo' }
    ];

    return (
        <div className="home-layout">
            <div className="mini-sidebar">
                <div className="sidebar-circle active">💬</div>
                <div className="sidebar-circle">📁</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>S-Bs</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Ds</div>
                <div className="sidebar-circle" style={{ color: 'var(--accent-green)' }}>+</div>
            </div>

            <div className="messages-pane">
                <div className="messages-header">
                    <div className="header-title-row">
                        <h2>Messages</h2>
                    </div>
                    <div className="action-row">
                        <div className="search-bar-inline">
                            <SearchIcon />
                        </div>
                        <button className="add-friends-btn">
                            👤+ Add Friends
                        </button>
                    </div>
                </div>

                <div className="active-row">
                    {friends.map(f => (
                        <div key={f.id} className="active-user">
                            <div className="avatar-large">
                                <div className="status-dot"></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="dm-list">
                    {friends.map(f => (
                        <div key={f.id} className="dm-item" onClick={() => onOpenChat(f)}>
                            <div className="dm-avatar"></div>
                            <div className="dm-content">
                                <div className="dm-name-row">
                                    <span className="dm-name">{f.name}</span>
                                    <span className="dm-time">{f.time}</span>
                                </div>
                                <div className="dm-last-msg">{f.lastMsg}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="fab">
                    <MessageCirclePlus />
                </div>
            </div>
        </div>
    );
};

const NotificationsScreen = () => {
    const notifications = [
        { id: 1, name: 'chixirra', text: 'accepted your friend request.', time: '1mo' },
        { id: 2, name: 'Wannaabeyourss', text: 'accepted your friend request.', time: '2mo' }
    ];

    return (
        <div>
            <header className="notif-header">
                <h2>Notifications</h2>
                <div className="top-circle-btn">•••</div>
            </header>
            {notifications.map(n => (
                <div key={n.id} className="notif-item">
                    <div className="dm-avatar"></div>
                    <div className="notif-body">
                        <div className="notif-text">
                            <strong>{n.name}</strong> {n.text}
                            <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '12px' }}>{n.time}</span>
                        </div>
                        <button className="notif-btn">Send Message</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const YouScreen = ({ onClose }) => {
    return (
        <div>
            <div className="profile-banner">
                <div className="profile-actions-top">
                    <div className="top-circle-btn">🏆</div>
                    <div className="top-circle-btn">🏠</div>
                    <div className="top-circle-btn" style={{ width: 'auto', padding: '0 12px', borderRadius: '16px' }}>Nitro</div>
                    <div className="top-circle-btn">⚙️</div>
                </div>
            </div>

            <div className="profile-avatar-container">
                <div className="profile-avatar"></div>
                <div className="status-bubble">
                    <span>➕</span>
                    <span style={{ fontStyle: 'italic', opacity: 0.8 }}>What have you been reading?</span>
                </div>
            </div>

            <div className="profile-info">
                <h1 className="profile-name">Juggernaut ∨</h1>
                <div className="profile-tag">addummy • He/Him</div>

                <button className="edit-btn">✎ Edit Profile</button>

                <div className="amp-card">
                    <div className="card-title-row">
                        <span style={{ fontWeight: 'bold' }}>Amp up your profile</span>
                        <span>✕</span>
                    </div>
                    <div className="amp-buttons">
                        <button className="amp-btn">🚀 Get Nitro</button>
                        <button className="amp-btn">🏠 Shop</button>
                    </div>
                </div>

                <div className="stat-card">
                    <span style={{ fontWeight: 'bold' }}>Orbs Balance</span>
                    <div className="try-orbs-btn">✨ Try Orbs</div>
                </div>

                <div className="checkpoint-banner">
                    <div className="banner-content">
                        <div className="banner-title">CHECKPOINT</div>
                        <div style={{ fontSize: '13px' }}>Take a look back at your 2025</div>
                    </div>
                    <div className="banner-action">→</div>
                </div>

                <div className="about-section">
                    <div className="section-label">About Me</div>
                    <div style={{ fontSize: '15px' }}>✨I am what u imagine✨</div>
                </div>

                <button
                    onClick={onClose}
                    className="edit-btn"
                    style={{ background: 'var(--error-color)', marginTop: '32px' }}
                >
                    Log Out
                </button>
            </div>
        </div>
    );
}

// --- Main Component ---

export default function Dashboard({ onClose }) {
    const [activeTab, setActiveTab] = useState('home'); // home, notifs, you
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isRecording, setIsRecording] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const loadMessages = useCallback(async () => {
        try {
            const msgs = await getMessages();
            msgs.sort((a, b) => a.timestamp - b.timestamp);
            setMessages(msgs);
        } catch (err) {
            console.error("Failed to load messages", err);
        }
    }, []);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    const handleSendText = async (content) => {
        const msg = {
            id: crypto.randomUUID(),
            type: 'text',
            content,
            timestamp: Date.now(),
            author: 'You'
        };
        await addMessage(msg);
        loadMessages();
    };

    const handleUpload = async (file) => {
        if (!file) return;
        const type = file.type.startsWith('image/') ? 'image' : 'video';
        const msg = {
            id: crypto.randomUUID(),
            type,
            content: file,
            timestamp: Date.now(),
            author: 'You'
        };
        await addMessage(msg);
        loadMessages();
    };

    const toggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;
                audioChunksRef.current = [];
                recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
                recorder.onstop = async () => {
                    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const msg = { id: crypto.randomUUID(), type: 'voice', content: blob, timestamp: Date.now(), author: 'You' };
                    await addMessage(msg);
                    loadMessages();
                    stream.getTracks().forEach(t => t.stop());
                };
                recorder.start();
                setIsRecording(true);
            } catch {
                alert("Microphone access denied");
            }
        }
    };

    return (
        <div className="dashboard-container">
            <main className="main-content">
                {activeTab === 'home' && <HomeScreen onOpenChat={setActiveChat} />}
                {activeTab === 'notifs' && <NotificationsScreen />}
                {activeTab === 'you' && <YouScreen onClose={onClose} />}

                {activeChat && (
                    <ChatView
                        friend={activeChat}
                        onBack={() => setActiveChat(null)}
                        messages={messages}
                        onSend={handleSendText}
                        onUpload={handleUpload}
                        onRecord={toggleRecording}
                        isRecording={isRecording}
                    />
                )}
            </main>

            <nav className="bottom-nav">
                <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
                    <div className="nav-icon"><HomeIcon /></div>
                    <span className="nav-label">Home</span>
                </div>
                <div className={`nav-item ${activeTab === 'notifs' ? 'active' : ''}`} onClick={() => setActiveTab('notifs')}>
                    <div className="nav-icon"><BellIcon /></div>
                    <span className="nav-label">Notifications</span>
                </div>
                <div className={`nav-item ${activeTab === 'you' ? 'active' : ''}`} onClick={() => setActiveTab('you')}>
                    <div className="profile-avatar" style={{ width: '24px', height: '24px', border: '2px solid' + (activeTab === 'you' ? 'white' : 'transparent') }}></div>
                    <span className="nav-label">You</span>
                </div>
            </nav>
        </div>
    );
}
