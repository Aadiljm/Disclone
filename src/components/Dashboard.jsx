import React, { useState, useEffect, useRef, useCallback } from 'react';
import { addMessage, getMessages, findUserByUsernameOrPasscode, sendFriendRequest, getPendingRequests, acceptFriendRequest, getUserById } from '../db';
import { API_BASE_URL } from '../config';

const MessageItem = ({ msg, isOwnMessage }) => {
    const API_URL = API_BASE_URL; // Match backend URL

    // For media from server, use fileUrl. For local blobs (if any), use mediaUrl state.
    const displayUrl = msg.fileUrl ? `${API_URL}${msg.fileUrl}` : null;

    const formatTime = (ts) => {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`message-item ${isOwnMessage ? 'own-message' : ''}`} style={{ flexDirection: isOwnMessage ? 'row-reverse' : 'row' }}>
            <div className="avatar" style={{ background: isOwnMessage ? '#5865F2' : '#7289da' }}></div>
            <div className="message-content" style={{ alignItems: isOwnMessage ? 'flex-end' : 'flex-start' }}>
                <div className="message-header" style={{ flexDirection: isOwnMessage ? 'row-reverse' : 'row' }}>
                    <span className="username" style={{ color: isOwnMessage ? '#5865F2' : '#F2F3F5' }}>{msg.sender?.username || msg.author || 'User'}</span>
                    <span className="timestamp">{formatTime(msg.timestamp)}</span>
                </div>

                {(msg.fileType === 'text' || !msg.fileType || msg.fileType === 'none') && msg.text && (
                    <div className="text-content" style={{ textAlign: isOwnMessage ? 'right' : 'left' }}>{msg.text}</div>
                )}

                {msg.fileType === 'video' && displayUrl && (
                    <div className="media-content">
                        <video controls src={displayUrl} />
                    </div>
                )}

                {msg.fileType === 'image' && displayUrl && (
                    <div className="media-content">
                        <img src={displayUrl} alt="uploaded content" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                    </div>
                )}

                {msg.fileType === 'voice' && displayUrl && (
                    <div className="media-content">
                        <audio controls src={displayUrl} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default function Dashboard({ onClose, currentUser }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isRecording, setIsRecording] = useState(false);

    // Friend System State
    const [showFriendModal, setShowFriendModal] = useState(false);
    const [friendInput, setFriendInput] = useState('');
    const [friendStatus, setFriendStatus] = useState('');
    const [pendingRequests, setPendingRequests] = useState([]);

    // Mobile menu state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    const loadMessages = useCallback(async () => {
        try {
            const msgs = await getMessages();
            // Sort by timestamp
            msgs.sort((a, b) => a.timestamp - b.timestamp);
            setMessages(msgs);
        } catch (err) {
            console.error("Failed to load messages", err);
        }
    }, []);

    const loadFriendRequests = useCallback(async () => {
        if (!currentUser) return;
        try {
            const reqs = await getPendingRequests(currentUser.id);
            // Enrich with sender info
            const enriched = await Promise.all(reqs.map(async (r) => {
                const sender = await getUserById(r.fromUserId);
                return { ...r, senderName: sender?.username || 'Unknown', senderPasscode: sender?.passcode };
            }));
            setPendingRequests(enriched);
        } catch (err) {
            console.error("Failed to load requests", err);
        }
    }, [currentUser]);

    useEffect(() => {
        loadMessages();
        loadFriendRequests();
        // Poll for new stuff occasionally?
        const interval = setInterval(() => {
            loadMessages();
            loadFriendRequests();
        }, 5000);
        return () => clearInterval(interval);
    }, [loadMessages, loadFriendRequests]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const msgData = {
            text: inputText,
            sender: currentUser.id,
            channel: 'general',
            fileType: 'text'
        };

        try {
            await addMessage(msgData);
            setInputText('');
            loadMessages();
        } catch (err) {
            console.error("Failed to send text", err);
            alert("Could not send message. Check your internet or server connection.");

        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSendFriendRequest = async () => {
        if (!friendInput.trim()) return;
        setFriendStatus('Searching...');

        try {
            // "give friend request using username or using the personal passcode"
            const user = await findUserByUsernameOrPasscode(friendInput.trim());

            if (!user) {
                setFriendStatus('❌ User not found.');
                return;
            }
            if (user.id === currentUser.id) {
                setFriendStatus("❌ That's you!");
                return;
            }

            await sendFriendRequest(currentUser.id, user.id);
            setFriendStatus(`✅ Request sent to ${user.username}!`);
            setFriendInput('');
        } catch (err) {
            console.error(err);
            setFriendStatus('❌ Failed to send request.');
        }
    };

    const handleAcceptRequest = async (reqId) => {
        try {
            await acceptFriendRequest(reqId);
            loadFriendRequests();
            alert("Friend added!");
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
            alert("Only video and image files are supported.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('sender', currentUser.id);
        formData.append('channel', 'general');
        formData.append('fileType', isVideo ? 'video' : 'image');

        try {
            await addMessage(formData);
            loadMessages();
        } catch (err) {
            console.error("Failed to upload file", err);
        }

        // Reset input
        e.target.value = null;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Detect supported MIME type for better compatibility (iOS prefers audio/mp4 or audio/aac)
            let mimeType = '';
            if (typeof MediaRecorder.isTypeSupported === 'function') {
                // Check for iOS-friendly formats FIRST
                if (MediaRecorder.isTypeSupported('audio/mp4')) {
                    mimeType = 'audio/mp4';
                } else if (MediaRecorder.isTypeSupported('audio/aac')) {
                    mimeType = 'audio/aac';
                } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                    mimeType = 'audio/webm;codecs=opus';
                } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                    mimeType = 'audio/webm';
                }
            }

            // If no supported type found (or checking not supported), let browser choose default
            const options = mimeType ? { mimeType } : undefined;
            const mediaRecorder = new MediaRecorder(stream, options);

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const finalMimeType = mediaRecorder.mimeType || mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });

                const formData = new FormData();
                formData.append('file', audioBlob, 'voice_message.webm');
                formData.append('sender', currentUser.id);
                formData.append('channel', 'general');
                formData.append('fileType', 'voice');

                try {
                    await addMessage(formData);
                    loadMessages();
                } catch (err) {
                    console.error("Failed to send voice message", err);
                }

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Failed to access microphone", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    if (!currentUser) return null;

    return (
        <div className="app-container">
            {/* Friend Modal */}
            {showFriendModal && (
                <div className="mobile-overlay open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', position: 'relative' }}>
                        <button
                            onClick={() => setShowFriendModal(false)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
                        >✕</button>

                        <h2 style={{ marginBottom: '1rem', color: 'white' }}>Manage Friends</h2>

                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Add Friend by Username or Passcode</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    style={{ margin: 0 }}
                                    placeholder="Username or Passcode..."
                                    value={friendInput}
                                    onChange={e => setFriendInput(e.target.value)}
                                />
                                <button className="btn-primary" style={{ width: 'auto' }} onClick={handleSendFriendRequest}>
                                    Send
                                </button>
                            </div>
                            {friendStatus && <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#ddd' }}>{friendStatus}</p>}
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                            <h3 style={{ fontSize: '1rem', color: '#ccc', marginBottom: '0.5rem' }}>Pending Requests ({pendingRequests.length})</h3>
                            {pendingRequests.length === 0 && <p style={{ color: '#666', fontSize: '0.8rem' }}>No pending requests.</p>}
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {pendingRequests.map(req => (
                                    <li key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px', marginBottom: '4px', borderRadius: '4px' }}>
                                        <div style={{ color: 'white' }}>
                                            <span style={{ fontWeight: 'bold' }}>{req.senderName}</span>
                                            <span style={{ fontSize: '0.8rem', color: '#aaa' }}> #{req.senderPasscode}</span>
                                        </div>
                                        <button
                                            onClick={() => handleAcceptRequest(req.id)}
                                            style={{ background: '#2ecc71', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Accept
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Overlay Background */}
            <div
                className={`mobile-overlay ${mobileMenuOpen ? 'open' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
            ></div>

            {/* Sidebar Wrapper (Server + Channel List) */}
            <div className={`sidebar-wrapper ${mobileMenuOpen ? 'open' : ''}`}>

                {/* Server Sidebar (Leftmost) */}
                <nav className="server-sidebar">
                    <div className="server-icon active">D</div>
                    <div className="server-divider"></div>
                    <div className="server-icon"></div>
                    <div className="server-icon"></div>
                </nav>

                {/* Channel Sidebar (Next to servers) */}
                <div className="channel-sidebar">
                    <header className="chat-header" style={{ boxShadow: 'none' }}>
                        <span style={{ fontWeight: 'bold' }}>Disclone Server</span>
                    </header>

                    <div style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 'bold', color: '#949BA4', paddingLeft: '8px' }}>Channels</span>
                        </div>
                        <div
                            style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', marginBottom: '4px', color: '#fff', cursor: 'pointer' }}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <span style={{ color: '#80848E', marginRight: '6px', fontSize: '20px' }}>#</span>
                            <span style={{ fontWeight: 500 }}>general</span>
                        </div>

                        <div style={{ marginTop: '24px' }}>
                            <button
                                onClick={() => { setShowFriendModal(true); setMobileMenuOpen(false); }}
                                style={{ width: '100%', background: '#248046', border: 'none', color: 'white', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>👋</span> Manage Friends
                                {pendingRequests.length > 0 && <span style={{ background: '#ED4245', padding: '2px 6px', borderRadius: '10px', fontSize: '12px' }}>{pendingRequests.length}</span>}
                            </button>
                        </div>
                    </div>

                    {/* User Area */}
                    <div style={{ backgroundColor: '#232428', padding: '10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F0B132', flexShrink: 0 }}></div>
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <span style={{ fontSize: '14px', fontWeight: '600', lineHeight: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.username}</span>
                                <span style={{ fontSize: '12px', color: '#DBDEE1' }}>#{currentUser.passcode}</span>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            title="Fully Close Website"
                            style={{
                                background: '#ED4245',
                                border: 'none',
                                color: 'white',
                                width: '32px',
                                height: '32px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                flexShrink: 0
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <main className="chat-area">
                <header className="chat-header">
                    {/* Hamburger Button (Mobile Only) */}
                    <button
                        className="menu-btn"
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Open Menu"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" clipRule="evenodd" d="M3 8V6H21V8H3ZM3 13H21V11H3V13ZM3 18H21V16H3V18Z" />
                        </svg>
                    </button>

                    <span style={{ fontSize: '24px', color: '#80848E', marginRight: '8px', fontWeight: 300 }}>#</span>
                    <span style={{ fontWeight: 'bold', color: '#F2F3F5' }}>general</span>

                    {/* Mobile Close Button (Top Right) */}
                    <button
                        className="mobile-close-btn"
                        onClick={onClose}
                        title="Close Session"
                    >
                        ✕
                    </button>
                </header>

                <div className="message-list">
                    {/* Welcome Message */}
                    <div className="message-item">
                        <div className="avatar" style={{ background: '#5865F2' }}></div>
                        <div className="message-content">
                            <div className="message-header">
                                <span className="username">System</span>
                            </div>
                            <div className="text-content">
                                Welcome to your secure Disclone instance. Messages are saved locally.
                            </div>
                        </div>
                    </div>

                    {messages.map((msg) => (
                        <MessageItem key={msg.id} msg={msg} isOwnMessage={msg.authorId === currentUser.id} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="chat-input-container">
                    <input
                        type="file"
                        accept="video/*,image/*"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <button
                        className="icon-btn"
                        onClick={() => fileInputRef.current.click()}
                        title="Upload File"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                        </svg>
                    </button>

                    <input
                        type="text"
                        className="chat-input"
                        placeholder={`Message #general as ${currentUser.username}`}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />

                    <button
                        className={`icon-btn ${isRecording ? 'recording' : ''}`}
                        onClick={toggleRecording}
                        title={isRecording ? "Stop Recording" : "Record Voice Message"}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                    </button>
                </div>
            </main>
        </div>
    );
}
