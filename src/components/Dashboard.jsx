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
    }, [msg]);

    const formatTime = (ts) => {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="message-item">
            <div className="avatar"></div>
            <div className="message-content">
                <div className="message-header">
                    <span className="username">User</span>
                    <span className="timestamp">{formatTime(msg.timestamp)}</span>
                </div>

                {msg.type === 'text' && <div className="text-content">{msg.content}</div>}

                {msg.type === 'video' && mediaUrl && (
                    <div className="media-content">
                        <video controls src={mediaUrl} />
                    </div>
                )}

                {msg.type === 'image' && mediaUrl && (
                    <div className="media-content">
                        <img src={mediaUrl} alt="uploaded content" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                    </div>
                )}

                {msg.type === 'voice' && mediaUrl && (
                    <div className="media-content">
                        <audio controls src={mediaUrl} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default function Dashboard({ onClose }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isRecording, setIsRecording] = useState(false);

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
            timestamp: Date.now()
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

        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
            alert("Only video and image files are supported.");
            return;
        }

        const msg = {
            id: crypto.randomUUID(),
            type: isVideo ? 'video' : 'image',
            content: file,
            timestamp: Date.now()
        };

        try {
            await addMessage(msg);
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
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const msg = {
                    id: crypto.randomUUID(),
                    type: 'voice',
                    content: audioBlob,
                    timestamp: Date.now()
                };
                await addMessage(msg);
                loadMessages();

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Scale to access microphone", err);
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

    return (
        <div className="app-container" style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* Server Sidebar (Left) */}
            <nav className="server-sidebar" style={{
                width: '72px',
                backgroundColor: '#1E1F22',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: '12px',
                gap: '8px',
                flexShrink: 0
            }}>
                <div className="server-icon" style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#5865F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                }}>D</div>

                <div style={{ width: '32px', height: '2px', background: '#35363C', marginBottom: '8px' }}></div>

                <div className="server-icon" style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#313338' }}></div>
            </nav>

            {/* Channel Sidebar */}
            <div className="channel-sidebar" style={{
                width: '240px',
                backgroundColor: '#2B2D31',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0
            }}>
                <header style={{ padding: '16px', borderBottom: '1px solid #1F2023', fontWeight: 'bold', boxShadow: '0 1px 0 rgba(4,4,5,0.2),0 1.5px 0 rgba(6,6,7,0.05),0 2px 0 rgba(4,4,5,0.05)' }}>
                    Disclone Server
                </header>

                <div style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', marginBottom: '4px', color: '#fff', cursor: 'pointer' }}>
                        <span style={{ color: '#80848E', marginRight: '6px', fontSize: '20px' }}>#</span>
                        <span style={{ fontWeight: 500 }}>general</span>
                    </div>
                </div>

                {/* User Area */}
                <div style={{ backgroundColor: '#232428', padding: '10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F0B132' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', lineHeight: '18px' }}>Guest</span>
                            <span style={{ fontSize: '12px', color: '#DBDEE1' }}>#9999</span>
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
                            fontWeight: 'bold'
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <main className="chat-area" style={{ flex: 1, backgroundColor: '#313338', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <header style={{ padding: '16px', borderBottom: '1px solid #26272D', display: 'flex', alignItems: 'center', boxShadow: '0 1px 0 rgba(4,4,5,0.2),0 1.5px 0 rgba(6,6,7,0.05),0 2px 0 rgba(4,4,5,0.05)' }}>
                    <span style={{ fontSize: '24px', color: '#80848E', marginRight: '8px', fontWeight: 300 }}>#</span>
                    <span style={{ fontWeight: 'bold', color: '#F2F3F5' }}>general</span>
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
                        <MessageItem key={msg.id} msg={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{ padding: '0 16px 24px 16px' }}>
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
                            placeholder="Message #general"
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
                </div>
            </main>
        </div>
    );
}
