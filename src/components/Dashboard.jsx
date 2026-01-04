import React, { useState, useEffect, useRef, useCallback } from 'react';
import { addMessage, getMessages } from '../db';

const MessageItem = ({ msg }) => {
    const [mediaUrl, setMediaUrl] = useState(null);

    useEffect(() => {
        if (msg.type === 'video' || msg.type === 'voice' || msg.type === 'image') {
            const url = URL.createObjectURL(msg.content);
            setMediaUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [msg.type, msg.content]);

    const formatTime = (ts) => {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="message-group">
            <div className="user-avatar" style={{ background: msg.type === 'system' ? '#5865F2' : '#747f8d', width: '40px', height: '40px' }}></div>
            <div className="message-text-group">
                <div className="message-meta">
                    <span className="message-author">{msg.author || 'User'}</span>
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>

                {msg.type === 'text' && <div className="message-content">{msg.content}</div>}

                {msg.type === 'image' && mediaUrl && (
                    <div className="media-attachment">
                        <img src={mediaUrl} alt="attachment" />
                    </div>
                )}

                {msg.type === 'video' && mediaUrl && (
                    <div className="media-attachment">
                        <video controls src={mediaUrl} />
                    </div>
                )}

                {msg.type === 'voice' && mediaUrl && (
                    <div className="media-attachment">
                        <audio controls src={mediaUrl} />
                    </div>
                )}

                {msg.type === 'system' && <div className="message-content" style={{ fontStyle: 'italic', color: '#949ba4' }}>{msg.content}</div>}
            </div>
        </div>
    );
};

const Category = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div style={{ marginBottom: '16px' }}>
            <div className="category-item" onClick={() => setIsOpen(!isOpen)}>
                <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} style={{ marginRight: '4px', display: 'inline-block' }}>▶</span>
                {title}
            </div>
            {isOpen && <div style={{ marginTop: '4px' }}>{children}</div>}
        </div>
    );
};

export default function Dashboard({ onClose }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

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
            msgs.sort((a, b) => a.timestamp - b.timestamp);
            setMessages(msgs);
        } catch (err) {
            console.error("Failed to load messages", err);
        }
    }, []);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const msg = {
            id: crypto.randomUUID(),
            type: 'text',
            content: inputText,
            timestamp: Date.now(),
            author: 'Guest'
        };

        try {
            await addMessage(msg);
            setInputText('');
            loadMessages();
        } catch (err) {
            console.error("Failed to send text", err);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : null;
        if (!type) {
            alert("Only image and video files are supported.");
            return;
        }

        const msg = {
            id: crypto.randomUUID(),
            type: type,
            content: file,
            timestamp: Date.now(),
            author: 'Guest'
        };

        try {
            await addMessage(msg);
            loadMessages();
        } catch (err) {
            console.error("Failed to upload file", err);
        }
        e.target.value = null;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const msg = {
                    id: crypto.randomUUID(),
                    type: 'voice',
                    content: audioBlob,
                    timestamp: Date.now(),
                    author: 'Guest'
                };
                await addMessage(msg);
                loadMessages();
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access failed", err);
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
        if (isRecording) stopRecording();
        else startRecording();
    };

    return (
        <div className={`app-container ${showMobileMenu ? 'mobile-menu-open' : ''}`}>
            <div className="mobile-overlay" onClick={() => setShowMobileMenu(false)} />

            {/* Server Sidebar */}
            <nav className="server-sidebar">
                <div className="server-icon active">D</div>
                <div className="separator"></div>
                <div className="server-icon">H</div>
                <div className="server-icon">G</div>
                <div className="server-icon" style={{ marginTop: 'auto', background: '#23a559' }}>+</div>
            </nav>

            {/* Channel Sidebar */}
            <aside className="channel-sidebar">
                <header className="sidebar-header">
                    Disclone Server
                </header>

                <div className="sidebar-scroll">
                    <Category title="Information">
                        <div className="channel-item">
                            <span className="channel-icon">📢</span> announcements
                        </div>
                        <div className="channel-item">
                            <span className="channel-icon">📜</span> rules
                        </div>
                    </Category>

                    <Category title="Text Channels">
                        <div className="channel-item active">
                            <span className="channel-icon">#</span> general
                        </div>
                        <div className="channel-item">
                            <span className="channel-icon">#</span> development
                        </div>
                        <div className="channel-item">
                            <span className="channel-icon">#</span> random
                        </div>
                    </Category>

                    <Category title="Voice Channels">
                        <div className="channel-item">
                            <span className="channel-icon">🔊</span> General VC
                        </div>
                        <div className="channel-item">
                            <span className="channel-icon">🔊</span> Gaming Lounge
                        </div>
                    </Category>
                </div>

                <div className="user-area">
                    <div className="user-avatar"></div>
                    <div className="user-info">
                        <span className="user-name">Guest</span>
                        <span className="user-tag">#9999</span>
                    </div>
                    <button className="action-btn" onClick={onClose} title="Log out" style={{ color: '#ed4245' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="chat-area">
                <header className="chat-header">
                    <button className="action-btn hamburger-btn" onClick={() => setShowMobileMenu(true)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" clipRule="evenodd" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
                        </svg>
                    </button>
                    <h3><span style={{ color: '#80848e', marginRight: '8px' }}>#</span> general</h3>
                </header>

                <div className="message-list">
                    {/* Welcome Group */}
                    <div className="message-group">
                        <div className="user-avatar" style={{ background: '#5865F2', width: '40px', height: '40px' }}></div>
                        <div className="message-text-group">
                            <div className="message-meta">
                                <span className="message-author">System</span>
                            </div>
                            <div className="message-content">
                                Welcome to the general channel. All messages are stored permanently in your local database.
                            </div>
                        </div>
                    </div>

                    {messages.map((msg) => (
                        <MessageItem key={msg.id} msg={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-wrapper">
                    <div className="chat-input-box">
                        <button className="action-btn" onClick={() => fileInputRef.current.click()} title="Upload file">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                        </button>

                        <input
                            type="file"
                            accept="video/*,image/*"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />

                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Message #general"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />

                        <div className="input-actions">
                            <button
                                className={`action-btn ${isRecording ? 'recording' : ''}`}
                                onClick={toggleRecording}
                                title={isRecording ? "Stop recording" : "Record voice message"}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                    <line x1="12" y1="19" x2="12" y2="23"></line>
                                    <line x1="8" y1="23" x2="16" y2="23"></line>
                                </svg>
                            </button>

                            <button className="action-btn" onClick={handleSendMessage} disabled={!inputText.trim()} style={{ color: inputText.trim() ? '#5865f2' : '#b5bac1' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
