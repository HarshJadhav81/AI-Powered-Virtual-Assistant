import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import { useChatContext } from '../context/ChatContext';
import socketService from '../services/socketService';
import ModeToggle from '../components/ModeToggle';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import toast from 'react-hot-toast';

/**
 * Keyboard Chat Page
 * Perplexity-style text-based chat interface
 */
function KeyboardChat() {
    const { userData, serverUrl, setUserData } = useContext(userDataContext);
    const navigate = useNavigate();
    const [ham, setHam] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);
    const messagesContainerRef = useRef(null);

    const {
        messages,
        streamingResponse,
        isStreaming,
        searchSources,
        isLoading,
        addUserMessage,
        addAIMessage,
        updateStreamingResponse,
        finalizeStreamingResponse,
        clearStreamingResponse,
        updateSearchSources,
        clearSearchSources,
        setIsLoading,
        switchMode
    } = useChatContext();

    // Guard against missing userData
    if (!userData) {
        navigate("/signin");
        return null;
    }

    // Initialize socket connection
    useEffect(() => {
        switchMode('keyboard');

        // Connect to socket
        socketService.connect(serverUrl);
        socketRef.current = socketService.getSocket();

        if (socketRef.current) {
            // Connection events
            socketRef.current.on('connect', () => {
                console.log('[KEYBOARD-CHAT] Socket connected');
                setIsConnected(true);
                toast.success('Connected to AI assistant');
            });

            socketRef.current.on('disconnect', () => {
                console.log('[KEYBOARD-CHAT] Socket disconnected');
                setIsConnected(false);
                toast.error('Disconnected from AI assistant');
            });

            // Streaming events - Token-based streaming
            socketRef.current.on('stream-start', (data) => {
                console.log('[KEYBOARD-CHAT] Stream started:', data);
                clearStreamingResponse();
                clearSearchSources();
            });

            socketRef.current.on('stream-token', (data) => {
                console.log('[KEYBOARD-CHAT] Stream token:', data);
                if (data.content) {
                    updateStreamingResponse(prev => prev + data.content);
                }

                // If final token, finalize the response
                if (data.final) {
                    setTimeout(() => {
                        finalizeStreamingResponse();
                        setIsLoading(false);
                    }, 100);
                }
            });

            socketRef.current.on('stream-event', (data) => {
                console.log('[KEYBOARD-CHAT] Stream event:', data);

                // Handle sources event
                if (data.type === 'sources' && data.sources) {
                    updateSearchSources(data.sources);
                }
            });

            socketRef.current.on('stream-end', (data) => {
                console.log('[KEYBOARD-CHAT] Stream ended:', data);
                setIsLoading(false);
            });

            // Error handling
            socketRef.current.on('error', (error) => {
                console.error('[KEYBOARD-CHAT] Socket error:', error);
                toast.error(error.message || 'An error occurred');
                setIsLoading(false);
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.off('connect');
                socketRef.current.off('disconnect');
                socketRef.current.off('stream-start');
                socketRef.current.off('stream-token');
                socketRef.current.off('stream-event');
                socketRef.current.off('stream-end');
                socketRef.current.off('error');
            }
        };
    }, [serverUrl]);


    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages, streamingResponse]);

    // Handle response from backend
    const handleResponse = (data) => {
        const { response, metadata, sources } = data;

        if (response) {
            addAIMessage(response, { sources: sources || metadata?.sources });
        }

        if (sources && Array.isArray(sources)) {
            updateSearchSources(sources);
        }

        setIsLoading(false);
    };

    // Send message
    const handleSendMessage = (text) => {
        if (!text.trim() || !socketRef.current) return;

        // Add user message to chat
        addUserMessage(text);
        setIsLoading(true);

        // Send to backend
        socketRef.current.emit('user-message', {
            message: text,
            userId: userData._id,
            mode: 'keyboard'
        });

        console.log('[KEYBOARD-CHAT] Sent message:', text);
    };

    // Handle logout
    const handleLogOut = async () => {
        try {
            socketService.disconnect();
            const result = await fetch(`${serverUrl}/api/auth/logout`, {
                credentials: 'include'
            });
            setUserData(null);
            navigate("/signin");
        } catch (error) {
            setUserData(null);
            console.log(error);
        }
    };

    return (
        <div className="keyboard-chat-page">
            {/* Header */}
            <header className="chat-header">
                <div className="header-content">
                    {/* Logo/Title */}
                    <div className="header-left">
                        <div className="assistant-avatar">
                            <img
                                src={userData?.assistantImage || '/default-avatar.png'}
                                alt={userData?.assistantName || 'Assistant'}
                            />
                        </div>
                        <div className="assistant-info">
                            <h1 className="assistant-name">{userData?.assistantName || 'AI Assistant'}</h1>
                            <p className="connection-status">
                                {isConnected ? (
                                    <>
                                        <span className="status-dot connected"></span>
                                        Connected
                                    </>
                                ) : (
                                    <>
                                        <span className="status-dot disconnected"></span>
                                        Disconnected
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="header-center">
                        <ModeToggle currentMode="keyboard" />
                    </div>

                    {/* Menu Button */}
                    <div className="header-right">
                        <button
                            className="menu-btn"
                            onClick={() => setHam(!ham)}
                        >
                            {ham ? <RxCross1 size={24} /> : <CgMenuRight size={24} />}
                        </button>
                    </div>
                </div>

                {/* Dropdown Menu */}
                {ham && (
                    <div className="dropdown-menu">
                        <button onClick={() => navigate('/settings')} className="menu-item">
                            Settings
                        </button>
                        <button onClick={() => navigate('/customize')} className="menu-item">
                            Customize
                        </button>
                        <button onClick={handleLogOut} className="menu-item logout">
                            Logout
                        </button>
                    </div>
                )}
            </header>

            {/* Main Chat Area */}
            <main className="chat-main">
                <div className="chat-container">
                    {/* Messages */}
                    <div className="messages-container" ref={messagesContainerRef}>
                        {messages.length === 0 && !streamingResponse && (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                </div>
                                <h2 className="empty-title">Start a conversation</h2>
                                <p className="empty-description">
                                    Ask me anything - I can help with search, information, tasks, and more.
                                </p>
                                <div className="example-queries">
                                    <button
                                        className="example-query"
                                        onClick={() => handleSendMessage("What's the weather like today?")}
                                    >
                                        What's the weather like today?
                                    </button>
                                    <button
                                        className="example-query"
                                        onClick={() => handleSendMessage("Tell me about quantum computing")}
                                    >
                                        Tell me about quantum computing
                                    </button>
                                    <button
                                        className="example-query"
                                        onClick={() => handleSendMessage("Find nearby restaurants")}
                                    >
                                        Find nearby restaurants
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Message List */}
                        {messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))}

                        {/* Streaming Response */}
                        {streamingResponse && (
                            <div className="message-bubble-container ai-message">
                                <div className="message-bubble ai-bubble streaming">
                                    <div className="message-content">
                                        {streamingResponse}
                                        <span className="typing-cursor"></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loading Indicator */}
                        {isLoading && !streamingResponse && (
                            <div className="message-bubble-container ai-message">
                                <div className="message-bubble ai-bubble">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search Sources (Perplexity-style) */}
                    {searchSources && searchSources.length > 0 && (
                        <div className="search-sources-container">
                            <h3 className="sources-title">
                                <svg className="sources-icon" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path>
                                </svg>
                                Sources
                            </h3>
                            <div className="sources-list">
                                {searchSources.map((source, index) => (
                                    <a
                                        key={index}
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="source-item"
                                    >
                                        <span className="source-number">{index + 1}.</span>
                                        <div className="source-content">
                                            <p className="source-title">
                                                [{source.source}] {source.title}
                                            </p>
                                            <p className="source-url">{source.url}</p>
                                        </div>
                                        <svg className="source-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chat Input */}
                    <div className="chat-input-section">
                        <ChatInput
                            onSend={handleSendMessage}
                            isLoading={isLoading}
                            onVoiceActivate={() => navigate('/home')}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default KeyboardChat;
