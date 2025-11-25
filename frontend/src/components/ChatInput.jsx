import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Chat Input Component
 * Perplexity-style input with auto-expanding textarea
 */
const ChatInput = ({ onSend, isLoading, onVoiceActivate }) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef(null);
    const navigate = useNavigate();

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    // Auto-focus on mount
    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleSubmit = (e) => {
        e?.preventDefault();

        if (input.trim() && !isLoading) {
            onSend(input.trim());
            setInput('');

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e) => {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleVoiceClick = () => {
        if (onVoiceActivate) {
            onVoiceActivate();
        } else {
            // Default: navigate to voice mode
            navigate('/home');
        }
    };

    return (
        <div className="chat-input-container">
            <form onSubmit={handleSubmit} className="chat-input-form">
                <div className="chat-input-wrapper">
                    {/* Voice Activation Button */}
                    <button
                        type="button"
                        className="voice-activate-btn"
                        onClick={handleVoiceClick}
                        title="Switch to Voice Mode"
                        disabled={isLoading}
                    >
                        <svg className="voice-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </button>

                    {/* Textarea Input */}
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything..."
                        className="chat-textarea"
                        disabled={isLoading}
                        rows={1}
                    />

                    {/* Send Button */}
                    <button
                        type="submit"
                        className={`send-btn ${input.trim() ? 'active' : ''}`}
                        disabled={!input.trim() || isLoading}
                        title="Send message (Enter)"
                    >
                        {isLoading ? (
                            <svg className="loading-spinner" viewBox="0 0 24 24">
                                <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            </svg>
                        ) : (
                            <svg className="send-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Character Count */}
                {input.length > 0 && (
                    <div className="char-count">
                        {input.length} / 2000
                    </div>
                )}

                {/* Keyboard Shortcuts Hint */}
                <div className="input-hints">
                    <span className="hint-item">
                        <kbd>Enter</kbd> to send
                    </span>
                    <span className="hint-item">
                        <kbd>Shift + Enter</kbd> for new line
                    </span>
                </div>
            </form>
        </div>
    );
};

export default ChatInput;
