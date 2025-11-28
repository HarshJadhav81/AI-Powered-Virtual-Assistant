import React, { useState } from 'react';
import { FiPlus, FiMessageSquare, FiTrash2, FiEdit2 } from 'react-icons/fi';

/**
 * Conversation Sidebar Component
 * ChatGPT-style conversation history sidebar
 */
function ConversationSidebar({ conversations, activeConversationId, onNewChat, onSelectConversation, onDeleteConversation }) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className={`chatgpt-sidebar ${!isOpen ? 'hidden' : ''}`}>
            {/* Header with New Chat Button */}
            <div className="sidebar-header">
                <button className="new-chat-btn" onClick={onNewChat}>
                    <FiPlus size={18} />
                    <span>New Chat</span>
                </button>
            </div>

            {/* Conversations List */}
            <div className="conversations-list">
                {conversations && conversations.length > 0 ? (
                    conversations.map((conversation) => (
                        <div
                            key={conversation.id}
                            className={`conversation-item ${activeConversationId === conversation.id ? 'active' : ''}`}
                            onClick={() => onSelectConversation(conversation.id)}
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FiMessageSquare size={16} />
                                <span className="truncate">{conversation.title || 'New Conversation'}</span>
                            </div>
                            <button
                                className="opacity-0 hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteConversation(conversation.id);
                                }}
                            >
                                <FiTrash2 size={14} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                        No conversations yet
                    </div>
                )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <button
                    className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors text-left"
                    onClick={() => setIsOpen(false)}
                >
                    Hide sidebar
                </button>
            </div>
        </div>
    );
}

export default ConversationSidebar;
