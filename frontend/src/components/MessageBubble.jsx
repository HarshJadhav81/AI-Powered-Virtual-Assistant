import React from 'react';

/**
 * Message Bubble Component
 * Displays user and AI messages in chat interface
 */
const MessageBubble = ({ message }) => {
    const { type, content, timestamp, metadata } = message;
    const isUser = type === 'user';

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={`message-bubble-container ${isUser ? 'user-message' : 'ai-message'}`}>
            <div className={`message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
                {/* Message Content */}
                <div className="message-content">
                    {content}
                </div>

                {/* Timestamp */}
                <div className="message-timestamp">
                    {formatTime(timestamp)}
                </div>

                {/* Copy Button */}
                <button
                    className="message-copy-btn"
                    onClick={() => {
                        navigator.clipboard.writeText(content);
                    }}
                    title="Copy message"
                >
                    <svg className="copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>
            </div>

            {/* Metadata (for AI messages with sources) */}
            {!isUser && metadata?.sources && metadata.sources.length > 0 && (
                <div className="message-sources">
                    <div className="sources-label">Sources:</div>
                    <div className="sources-list">
                        {metadata.sources.map((source, idx) => (
                            <a
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="source-link"
                            >
                                [{idx + 1}] {source.title}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageBubble;
