import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import socketService from '../services/socketService';
import { FiSend, FiMenu, FiSun, FiMoon, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './GeminiChat.css';

/**
 * GeminiChat (fixed)
 * - Creates model placeholder using backend messageId from stream-start (or fallback to streamId)
 * - Updates exact message by messageId for every stream-token
 * - Uses safeOn helper to avoid duplicate listeners
 * - Separates theme effect from socket lifecycle
 * - Proper cleanup on unmount
 */

function GeminiChat() {
    const { userData, setUserData, serverUrl } = useContext(userDataContext);
    const navigate = useNavigate();

    // Redirect to signin if no userData (wrapped in effect to avoid render redirect)
    useEffect(() => {
        if (!userData) {
            navigate('/signin');
        }
    }, [userData, navigate]);

    const [history, setHistory] = useState([]); // messages: { id, role: 'user'|'model', content, timestamp, isStreaming }
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [theme, setTheme] = useState('light');
    const [isConnected, setIsConnected] = useState(false);

    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);
    const socketRef = useRef(null);

    // Apply theme separately (so toggling theme won't re-create socket listeners)
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Initialize socket connection and listeners — depends only on serverUrl
    useEffect(() => {
        if (!serverUrl) return;

        socketService.connect(serverUrl);
        const socket = socketService.getSocket();
        socketRef.current = socket;

        // safeOn: ensures only one listener attached per event
        const safeOn = (event, handler) => {
            try { socket.off(event); } catch (e) { }
            socket.on(event, handler);
        };

        safeOn('connect', () => {
            console.log('[GEMINI-CHAT] Socket connected');
            setIsConnected(true);
        });

        safeOn('disconnect', () => {
            console.log('[GEMINI-CHAT] Socket disconnected');
            setIsConnected(false);
            setIsLoading(false);
        });

        // STREAM-START: backend will send { streamId, messageId, timestamp, status }
        safeOn('stream-start', (data) => {
            const { streamId, messageId } = data || {};
            console.log('[GEMINI-CHAT] stream-start', data);
            setIsLoading(true);

            // Use messageId if provided, otherwise fallback to streamId
            const id = messageId || streamId || `msg_${Date.now()}`;

            // Create a placeholder model message (only once)
            setHistory(prev => {
                // Avoid duplicate placeholder if already exists
                if (prev.some(m => m.id === id)) return prev;
                return [
                    ...prev,
                    {
                        id,
                        role: 'model',
                        content: '',
                        timestamp: new Date().toISOString(),
                        isStreaming: true
                    }
                ];
            });
        });

        // STREAM-TOKEN: { streamId, messageId, content, index, final }
        safeOn('stream-token', (data) => {
            if (!data) return;
            const { streamId, messageId, content, final } = data;
            // Determine id to update
            const id = messageId || streamId;
            if (!id) return;

            setHistory(prev => {
                const updated = [...prev];
                const idx = updated.findIndex(m => m.id === id);

                if (idx >= 0) {
                    // update existing model message
                    const msg = { ...updated[idx] };
                    msg.content = (msg.content || '') + (content || '');
                    msg.isStreaming = !Boolean(final);
                    updated[idx] = msg;
                } else {
                    // fallback: push a new model message
                    updated.push({
                        id,
                        role: 'model',
                        content: content || '',
                        timestamp: new Date().toISOString(),
                        isStreaming: !Boolean(final)
                    });
                }
                return updated;
            });

            if (final) {
                setIsLoading(false);
            }
        });

        // STREAM-END: ensure finalization
        safeOn('stream-end', (data) => {
            console.log('[GEMINI-CHAT] stream-end', data);
            setIsLoading(false);
            const { streamId, messageId } = data || {};
            const id = messageId || streamId;
            if (!id) return;

            setHistory(prev => {
                const updated = [...prev];
                for (let i = updated.length - 1; i >= 0; i--) {
                    if (updated[i].id === id && updated[i].role === 'model') {
                        updated[i] = { ...updated[i], isStreaming: false };
                        break;
                    }
                }
                return updated;
            });
        });

        // STREAM-ERROR
        safeOn('stream-error', (err) => {
            console.error('[GEMINI-CHAT] stream-error', err);
            const { streamId, messageId, error } = err || {};
            const id = messageId || streamId;
            toast.error('Streaming error: ' + (error || 'Unknown'));
            setIsLoading(false);
            if (id) {
                setHistory(prev => {
                    const updated = [...prev];
                    const idx = updated.findIndex(m => m.id === id);
                    if (idx >= 0) {
                        updated[idx] = {
                            ...updated[idx],
                            isStreaming: false,
                            content: (updated[idx].content || '') + `\n\n[Stream error: ${error || 'unknown'}]`
                        };
                    }
                    return updated;
                });
            }
        });

        // STREAM-CANCELLED (server acknowledged cancel)
        safeOn('stream-cancelled', (data) => {
            console.log('[GEMINI-CHAT] stream-cancelled', data);
            setIsLoading(false);
            const id = (data && (data.messageId || data.streamId)) || null;
            if (id) {
                setHistory(prev => prev.map(m => m.id === id ? { ...m, isStreaming: false } : m));
            }
        });

        // STREAM-EVENT (metadata)
        safeOn('stream-event', (evt) => {
            // optional metadata events: intent-detected, sources, action, thinking, etc.
            console.log('[GEMINI-CHAT] stream-event', evt);
            // you can update UI/notifications based on evt.type if desired
            // e.g. show sources, actions, etc.
        });

        // cleanup
        return () => {
            try {
                socket.off('connect');
                socket.off('disconnect');
                socket.off('stream-start');
                socket.off('stream-token');
                socket.off('stream-end');
                socket.off('stream-error');
                socket.off('stream-cancelled');
                socket.off('stream-event');
            } catch (e) { }
            socketRef.current = null;
        };
    }, [serverUrl]); // note: theme intentionally NOT a dependency

    // Auto-scroll to bottom when history changes
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    // Send message helper
    const sendMessage = async (userMessage) => {
        if (!userMessage || !userMessage.trim()) return;
        if (isLoading) {
            toast('Still processing previous response — please wait.');
            return;
        }
        const socket = socketRef.current;
        if (!socket || !isConnected) {
            toast.error('Not connected to server.');
            return;
        }

        setIsLoading(true);

        const userMsg = {
            id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString()
        };

        setHistory(prev => [...prev, userMsg]);
        setInput('');

        try {
            socket.emit('user-message', {
                message: userMessage,
                userId: userData?._id,
                mode: 'keyboard'
            });
        } catch (err) {
            console.error('[GEMINI-CHAT] sendMessage error', err);
            toast.error('Failed to send message.');
            setIsLoading(false);
        }
    };

    const handleSend = () => {
        if (input.trim() && !isLoading) sendMessage(input.trim());
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    const handleNewChat = () => {
        setHistory([]);
        toast.success('New chat started');
    };

    const handleLogOut = async () => {
        try {
            setUserData(null);
            navigate('/signin');
        } catch (err) {
            console.error(err);
        }
    };

    // If userData not present (redirecting), don't render UI
    if (!userData) return null;

    return (
        <div className="gemini-chat-container">
            {/* Header */}
            <div className="gemini-header">
                <div className="header-left">
                    <button className="header-btn" onClick={() => navigate('/home')}>
                        <FiMenu size={20} />
                    </button>
                    <div className="header-title">
                        <FiZap className="gemini-icon" />
                        <h1>Orvion</h1>
                    </div>
                </div>
                <div className="header-right">
                    <button className="header-btn" onClick={handleNewChat}>New Chat</button>
                    <button className="header-btn" onClick={toggleTheme}>
                        {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
                    </button>
                    <button className="header-btn" onClick={handleLogOut}>Logout</button>
                </div>
            </div>

            {/* Chat History */}
            <div className="gemini-chat-history">
                {history.length === 0 ? (
                    <div className="gemini-empty-state">
                        <FiZap className="empty-icon" />
                        <h2>Hello, {userData?.name || 'there'}!</h2>
                        <p>How can I help you today?</p>
                        <div className="example-prompts">
                            <button className="example-card" onClick={() => setInput("Explain quantum computing in simple terms")}>
                                <span className="example-title">Explain concepts</span>
                                <span className="example-text">Quantum computing in simple terms</span>
                            </button>
                            <button className="example-card" onClick={() => setInput("Write a creative story about space exploration")}>
                                <span className="example-title">Creative writing</span>
                                <span className="example-text">Story about space exploration</span>
                            </button>
                            <button className="example-card" onClick={() => setInput("Help me plan a healthy meal for the week")}>
                                <span className="example-title">Get advice</span>
                                <span className="example-text">Plan a healthy meal</span>
                            </button>
                            <button className="example-card" onClick={() => setInput("Explain the latest developments in AI")}>
                                <span className="example-title">Learn something new</span>
                                <span className="example-text">Latest AI developments</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {history.map((message) => (
                            <div key={message.id} className={`message-container ${message.role}`}>
                                <div className="message-avatar">
                                    {message.role === 'user' ? (
                                        <div className="user-avatar">{userData?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                                    ) : (
                                        <div className="model-avatar"><FiZap /></div>
                                    )}
                                </div>
                                <div className="message-content">
                                    <div className="message-role">{message.role === 'user' ? 'You' : 'Orvion'}</div>
                                    <div className="message-text">
                                        {message.content}
                                        {message.isStreaming && <span className="cursor-blink">▋</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="gemini-input-container">
                <div className="gemini-input-wrapper">
                    <textarea
                        ref={textareaRef}
                        className="gemini-input"
                        placeholder="Enter a prompt here"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        className="send-button"
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        title={!isConnected ? 'Not connected' : 'Send'}
                    >
                        <FiSend size={20} />
                    </button>
                </div>
                <div className="input-footer">
                    Orvion may display inaccurate info, so double-check its responses.
                </div>
            </div>
        </div>
    );
}

export default GeminiChat;
