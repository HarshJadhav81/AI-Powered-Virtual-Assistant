import React, { useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import { useChatContext } from '../context/ChatContext';
import socketService from '../services/socketService';
import MarkdownRenderer from '../components/MarkdownRenderer';
import ConversationSidebar from '../components/ConversationSidebar';
import { FiSend, FiMic, FiPaperclip, FiMenu, FiSun, FiMoon, FiCopy, FiRefreshCw, FiMoreVertical } from 'react-icons/fi';
import toast from 'react-hot-toast';
import debounce from '../utils/debounce';
import appLaunchService from '../services/appLaunchService';
import messagingService from '../services/messagingService';
import screenService from '../services/screenService';
import instagramService from '../services/instagramService';
import chromecastService from '../services/chromecastService';
import cameraService from '../services/cameraService';
import contactsService from '../services/contactsService';
import navigationService from '../services/navigationService';
import paymentService from '../services/paymentService';
import bluetoothService from '../services/bluetoothService';
import '../styles/chatgpt-style.css';

/**
 * Keyboard Chat Page - ChatGPT Style
 * Full-featured text-based chat interface with all voice assistant capabilities
 * OPTIMIZED: Debounced scroll, memoized callbacks, performance improvements
 */
function KeyboardChat() {
    const { userData, serverUrl, setUserData } = useContext(userDataContext);
    const navigate = useNavigate();
    const [isConnected, setIsConnected] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [theme, setTheme] = useState('light');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

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
        clearMessages,
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

        // Apply theme
        document.documentElement.setAttribute('data-theme', theme);

        // Connect to socket
        socketService.connect(serverUrl);
        socketRef.current = socketService.getSocket();

        if (socketRef.current) {
            socketRef.current.on('connect', () => {
                console.log('[KEYBOARD-CHAT] Socket connected');
                setIsConnected(true);
            });

            socketRef.current.on('disconnect', () => {
                console.log('[KEYBOARD-CHAT] Socket disconnected');
                setIsConnected(false);
            });

            // Instant acknowledgment handlers
            socketRef.current.on('message-received', (data) => {
                console.log('[KEYBOARD-CHAT] Message acknowledged:', data);
                // Message already added optimistically, just confirm
            });

            socketRef.current.on('command-received', (data) => {
                console.log('[KEYBOARD-CHAT] Command acknowledged:', data);
            });

            // Streaming events
            socketRef.current.on('stream-start', (data) => {
                console.log('[KEYBOARD-CHAT] Stream started:', data);
                clearStreamingResponse();
                clearSearchSources();
                setIsLoading(true);
            });

            socketRef.current.on('stream-event', (data) => {
                if (data.type === 'thinking') {
                    console.log('[KEYBOARD-CHAT] AI is thinking...');
                    setIsLoading(true);
                } else if (data.type === 'sources' && data.sources) {
                    updateSearchSources(data.sources);
                } else if (data.type === 'intent-detected') {
                    console.log('[KEYBOARD-CHAT] Intent detected:', data.intent);
                } else if (data.type === 'action') {
                    // Execute action
                    console.log('[KEYBOARD-CHAT] Received action:', data);
                    handleAction(data);
                }
            });

            socketRef.current.on('stream-token', (data) => {
                if (data.content) {
                    updateStreamingResponse(prev => prev + data.content);
                }

                if (data.final) {
                    setTimeout(() => {
                        finalizeStreamingResponse();
                        setIsLoading(false);
                    }, 100);
                }
            });

            socketRef.current.on('stream-end', (data) => {
                console.log('[KEYBOARD-CHAT] Stream ended');
                setIsLoading(false);
            });

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
                socketRef.current.off('message-received');
                socketRef.current.off('command-received');
                socketRef.current.off('stream-start');
                socketRef.current.off('stream-token');
                socketRef.current.off('stream-event');
                socketRef.current.off('stream-end');
                socketRef.current.off('error');
            }
        };
    }, [serverUrl, theme]); // Removed handleAction dependency to avoid infinite loop, it's stable

    // Handle actions from backend (memoized)
    const handleAction = useCallback(async (data) => {
        const { action, url, metadata } = data;
        const type = data.type; // Some actions come as type

        console.log('[KEYBOARD-CHAT] Handling action:', action, url, metadata);

        // URL Actions
        if (url) {
            setTimeout(() => window.open(url, '_blank'), 500);
            toast.success('Opening link...');
            return;
        }

        // App Launch
        if (action === 'app-launch') {
            try {
                const appName = metadata?.appName || data.appName;
                const result = appLaunchService.launchApp(appName);
                if (result.success) {
                    toast.success(result.message);
                } else {
                    toast.error(result.message);
                }
            } catch (error) {
                console.error('[APP-LAUNCH]', error);
                toast.error('Failed to launch app');
            }
            return;
        }

        // App Close
        if (action === 'app-close') {
            toast(data.response || `Cannot close ${metadata?.appName || 'app'}`);
            return;
        }

        // Camera Close
        if (action === 'camera-close') {
            cameraService.stopCamera();
            toast.success('Camera closed');
            return;
        }

        // WhatsApp
        if (action === 'whatsapp-send' || type === 'whatsapp-send') {
            try {
                const phone = metadata?.phone;
                const message = metadata?.message;
                if (phone) {
                    const result = messagingService.sendWhatsAppMessage(phone, message);
                    toast.success(result.message);
                } else {
                    messagingService.openMessagingApp('whatsapp');
                    toast.success('Opening WhatsApp');
                }
            } catch (error) {
                toast.error('Failed to open WhatsApp');
            }
            return;
        }

        // Telegram
        if (action === 'telegram-send' || type === 'telegram-send') {
            try {
                messagingService.openMessagingApp('telegram');
                toast.success('Opening Telegram');
            } catch (error) {
                toast.error('Failed to open Telegram');
            }
            return;
        }

        // Instagram Actions
        if (action?.startsWith('instagram-')) {
            try {
                if (action === 'instagram-dm') {
                    const username = metadata?.username;
                    if (username) instagramService.openDirectMessage(username);
                    else instagramService.openInstagram();
                    toast.success(username ? `Opening DM with ${username}` : 'Opening Instagram');
                } else if (action === 'instagram-story') {
                    instagramService.openCamera();
                    toast.success('Opening Instagram Camera');
                } else if (action === 'instagram-profile') {
                    const username = metadata?.username;
                    if (username) instagramService.openProfile(username);
                    else instagramService.openInstagram();
                    toast.success(username ? `Opening profile of ${username}` : 'Opening Instagram');
                }
            } catch (error) {
                toast.error('Failed to perform Instagram action');
            }
            return;
        }

        // Tools & Utilities
        if (action === 'calculator-open') {
            window.open('calculator://', '_blank'); // Try protocol handler
            toast.success('Opening Calculator');
            return;
        }

        // Camera
        if (action === 'camera-photo') {
            try {
                const support = cameraService.checkSupport();
                if (!support.supported) {
                    toast.error('Camera not supported');
                    return;
                }
                toast('Starting camera...');
                await cameraService.startCamera();
                const result = await cameraService.takePhoto();
                if (result.success) {
                    toast.success('Photo captured!');
                    // Optionally display photo in chat
                } else {
                    toast.error(result.error);
                }
                cameraService.stopCamera();
            } catch (error) {
                toast.error('Camera failed');
                cameraService.stopCamera();
            }
            return;
        }

        // Screen Recording
        if (action === 'screen-record') {
            try {
                const status = screenService.getRecordingStatus();
                if (status.isRecording) {
                    screenService.stopRecording();
                    toast.success('Recording stopped');
                } else {
                    await screenService.startRecording({ includeAudio: true });
                    toast.success('Recording started');
                }
            } catch (error) {
                toast.error('Screen recording failed');
            }
            return;
        }

        // Screenshot
        if (action === 'screenshot' || type === 'screenshot') {
            try {
                toast('Taking screenshot...');
                const result = await screenService.takeScreenshot();
                if (result.success) {
                    toast.success('Screenshot saved!');
                } else {
                    toast.error('Screenshot failed');
                }
            } catch (error) {
                toast.error('Screenshot failed');
            }
            return;
        }

    }, []);

    // Auto-scroll to bottom (debounced for performance)
    const scrollToBottom = useMemo(
        () => debounce(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100),
        []
    );

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingResponse, scrollToBottom]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [inputValue]);

    // Send message (memoized for performance)
    const handleSendMessage = useCallback(() => {
        if (!inputValue.trim() || !socketRef.current || isLoading) return;

        const messageText = inputValue.trim();

        // INSTANT UI UPDATE - Add message immediately (optimistic UI)
        addUserMessage(messageText);
        setIsLoading(true);

        // Send to backend
        socketRef.current.emit('user-message', {
            message: messageText,
            userId: userData._id,
            mode: 'keyboard'
        });

        // Clear input immediately for better UX
        setInputValue('');
        console.log('[KEYBOARD-CHAT] Sent message:', messageText);
    }, [inputValue, isLoading, userData._id, addUserMessage, setIsLoading]);

    // Handle Enter key
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Copy message (memoized)
    const handleCopy = useCallback((text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    }, []);

    // Regenerate response
    const handleRegenerate = (messageText) => {
        handleSendMessage();
    };

    // Toggle theme
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    // New conversation
    const handleNewChat = () => {
        clearMessages();
        const newConv = {
            id: Date.now().toString(),
            title: 'New Conversation',
            messages: []
        };
        setConversations([newConv, ...conversations]);
        setActiveConversationId(newConv.id);
    };

    // Select conversation
    const handleSelectConversation = (id) => {
        setActiveConversationId(id);
        // Load conversation messages (implement based on your storage)
    };

    // Delete conversation
    const handleDeleteConversation = (id) => {
        setConversations(conversations.filter(c => c.id !== id));
        if (activeConversationId === id) {
            handleNewChat();
        }
    };

    // Logout
    const handleLogOut = async () => {
        try {
            socketService.disconnect();
            await fetch(`${serverUrl}/api/auth/logout`, { credentials: 'include' });
            setUserData(null);
            navigate("/signin");
        } catch (error) {
            setUserData(null);
            console.log(error);
        }
    };

    return (
        <div className="chatgpt-layout">
            {/* Sidebar */}
            {sidebarOpen && (
                <ConversationSidebar
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    onNewChat={handleNewChat}
                    onSelectConversation={handleSelectConversation}
                    onDeleteConversation={handleDeleteConversation}
                />
            )}

            {/* Main Chat Area */}
            <div className="chatgpt-main">
                {/* Header */}
                <div className="chatgpt-header">
                    <div className="flex items-center gap-3">
                        <button className="header-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <FiMenu size={20} />
                        </button>
                        <h1 className="header-title">{userData?.assistantName || 'AI Assistant'}</h1>
                        {isConnected && (
                            <span className="text-xs text-green-500 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Connected
                            </span>
                        )}
                    </div>
                    <div className="header-actions">
                        <button className="header-btn" onClick={toggleTheme}>
                            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
                        </button>
                        <button className="header-btn" onClick={() => navigate('/settings')}>
                            Settings
                        </button>
                        <button className="header-btn" onClick={handleLogOut}>
                            Logout
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="chatgpt-messages">
                    <div className="messages-wrapper">
                        {messages.length === 0 && !streamingResponse ? (
                            <div className="chatgpt-empty-state">
                                <div className="empty-state-icon">💬</div>
                                <h2 className="empty-state-title">How can I help you today?</h2>
                                <p className="empty-state-description">
                                    I can help with weather, news, device control, reminders, search, and much more!
                                </p>
                                <div className="example-prompts">
                                    <button className="example-prompt" onClick={() => setInputValue("What's the weather like today?")}>
                                        What's the weather like today?
                                    </button>
                                    <button className="example-prompt" onClick={() => setInputValue("Read me the latest news")}>
                                        Read me the latest news
                                    </button>
                                    <button className="example-prompt" onClick={() => setInputValue("Set a reminder for 5 PM")}>
                                        Set a reminder for 5 PM
                                    </button>
                                    <button className="example-prompt" onClick={() => setInputValue("Tell me about quantum computing")}>
                                        Tell me about quantum computing
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((message) => (
                                    <div key={message.id} className={`message-row ${message.role === 'ai' ? 'ai' : 'user'}`}>
                                        <div className="chatgpt-message">
                                            {/* Content */}
                                            <div className="message-body">
                                                {message.role === 'ai' ? (
                                                    <MarkdownRenderer content={message.content} />
                                                ) : (
                                                    <p>{message.content}</p>
                                                )}
                                            </div>

                                            {/* Time & Actions */}
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="message-time">
                                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>

                                                {message.role === 'ai' && (
                                                    <div className="message-actions">
                                                        <button className="message-action-btn" onClick={() => handleCopy(message.content)} title="Copy">
                                                            <FiCopy size={12} />
                                                        </button>
                                                        <button className="message-action-btn" onClick={() => handleRegenerate(message.content)} title="Regenerate">
                                                            <FiRefreshCw size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Streaming Response */}
                                {streamingResponse && (
                                    <div className="message-row ai">
                                        <div className="chatgpt-message">
                                            <div className="message-body">
                                                <MarkdownRenderer content={streamingResponse} />
                                                <span className="inline-block w-[2px] h-[18px] bg-current ml-1 animate-pulse"></span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Loading Indicator */}
                                {isLoading && !streamingResponse && (
                                    <div className="message-row ai">
                                        <div className="chatgpt-message">
                                            <div className="typing-indicator">
                                                <div className="typing-dot"></div>
                                                <div className="typing-dot"></div>
                                                <div className="typing-dot"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Search Sources */}
                                {searchSources && searchSources.length > 0 && (
                                    <div className="message-row ai">
                                        <div className="chatgpt-message">
                                            <div className="message-header">
                                                <span className="message-sender">Sources</span>
                                            </div>
                                            <div className="message-body text-sm">
                                                {searchSources.map((source, index) => (
                                                    <div key={index} className="mb-1">
                                                        <a
                                                            href={source.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            [{index + 1}] {source.title}
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input */}
                <div className="chatgpt-input-container">
                    <div className="chatgpt-input-wrapper">
                        <textarea
                            ref={textareaRef}
                            className="chatgpt-input"
                            placeholder="Message AI Assistant..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            disabled={isLoading}
                        />
                        <div className="input-actions">
                            <button className="input-action-btn" title="Attach file">
                                <FiPaperclip size={18} />
                            </button>
                            <button className="input-action-btn" title="Voice input" onClick={() => navigate('/home')}>
                                <FiMic size={18} />
                            </button>
                            <button
                                className="input-action-btn send"
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || isLoading}
                            >
                                <FiSend size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default KeyboardChat;
