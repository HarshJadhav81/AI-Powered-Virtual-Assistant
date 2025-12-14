import React, { createContext, useContext, useState, useRef } from 'react';

/**
 * Chat Context for managing shared conversation state between keyboard and voice modes
 */
const ChatContext = createContext();

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within ChatProvider');
    }
    return context;
};

export const ChatProvider = ({ children }) => {
    // Message history
    const [messages, setMessages] = useState([]);

    // Current mode: 'keyboard' or 'voice'
    const [mode, setMode] = useState('keyboard');

    // Streaming response state
    const [streamingResponse, setStreamingResponse] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);

    // Search sources (Perplexity-style citations)
    const [searchSources, setSearchSources] = useState([]);

    // Partial transcript (for voice mode)
    const [partialTranscript, setPartialTranscript] = useState('');

    // Loading state
    const [isLoading, setIsLoading] = useState(false);

    // Current input text (for keyboard mode)
    const [inputText, setInputText] = useState('');

    // Refs
    const messagesEndRef = useRef(null);

    /**
     * Add a message to the conversation
     */
    const addMessage = (message) => {
        setMessages(prev => [...prev, {
            ...message,
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString()
        }]);
    };

    /**
     * Add user message
     */
    const addUserMessage = (text) => {
        addMessage({
            type: 'user',
            content: text,
            mode: mode
        });
    };

    /**
     * Add AI message
     */
    const addAIMessage = (text, metadata = {}) => {
        addMessage({
            type: 'ai',
            content: text,
            mode: mode,
            metadata
        });
    };

    /**
     * Update streaming response
     */
    const updateStreamingResponse = (text) => {
        setStreamingResponse(text);
        setIsStreaming(true);
    };

    /**
     * Finalize streaming response and add to messages
     */
    const finalizeStreamingResponse = (metadata = {}) => {
        if (streamingResponse) {
            addAIMessage(streamingResponse, metadata);
            setStreamingResponse('');
            setIsStreaming(false);
        }
    };

    /**
     * Clear streaming response
     */
    const clearStreamingResponse = () => {
        setStreamingResponse('');
        setIsStreaming(false);
    };

    /**
     * Update search sources
     */
    const updateSearchSources = (sources) => {
        setSearchSources(sources);
    };

    /**
     * Clear search sources
     */
    const clearSearchSources = () => {
        setSearchSources([]);
    };

    /**
     * Switch mode
     */
    const switchMode = (newMode) => {
        setMode(newMode);
        console.log(`[CHAT-CONTEXT] Switched to ${newMode} mode`);
    };

    /**
     * Clear conversation
     */
    const clearConversation = () => {
        setMessages([]);
        setStreamingResponse('');
        setSearchSources([]);
        setPartialTranscript('');
        setIsStreaming(false);
    };

    /**
     * Scroll to bottom of messages
     */
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const value = {
        // State
        messages,
        mode,
        streamingResponse,
        isStreaming,
        searchSources,
        partialTranscript,
        isLoading,
        inputText,
        messagesEndRef,

        // Setters
        setMessages,
        setMode,
        setPartialTranscript,
        setIsLoading,
        setInputText,

        // Methods
        addMessage,
        addUserMessage,
        addAIMessage,
        updateStreamingResponse,
        finalizeStreamingResponse,
        clearStreamingResponse,
        updateSearchSources,
        clearSearchSources,
        switchMode,
        clearConversation,
        scrollToBottom
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

export default ChatContext;
