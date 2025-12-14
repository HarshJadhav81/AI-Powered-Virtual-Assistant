import React from "react";
import "./Sidebar.css";
import { FiPlus, FiMessageSquare, FiMenu, FiX } from "react-icons/fi";

const Sidebar = ({ isOpen, onClose, chatHistory, onNewChat, onSelectChat, currentChatId }) => {
    // Group chats by date
    const groupChatsByDate = (chats) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const groups = {
            today: [],
            yesterday: [],
            previous7Days: [],
            older: []
        };

        chats.forEach(chat => {
            const chatDate = new Date(chat.timestamp);
            if (chatDate.toDateString() === today.toDateString()) {
                groups.today.push(chat);
            } else if (chatDate.toDateString() === yesterday.toDateString()) {
                groups.yesterday.push(chat);
            } else if (chatDate >= sevenDaysAgo) {
                groups.previous7Days.push(chat);
            } else {
                groups.older.push(chat);
            }
        });

        return groups;
    };

    const grouped = groupChatsByDate(chatHistory);

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div className="sidebar-overlay" onClick={onClose} />
            )}

            {/* Sidebar */}
            <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
                {/* Close button for mobile */}
                <button className="sidebar-close-btn" onClick={onClose}>
                    <FiX size={20} />
                </button>

                {/* New Chat Button */}
                <button className="new-chat-btn" onClick={onNewChat}>
                    <FiPlus size={20} />
                    <span>New Chat</span>
                </button>

                {/* Chat History */}
                <div className="chat-history">
                    {grouped.today.length > 0 && (
                        <div className="history-group">
                            <div className="history-label">Today</div>
                            {grouped.today.map(chat => (
                                <button
                                    key={chat.id}
                                    className={`history-item ${currentChatId === chat.id ? 'active' : ''}`}
                                    onClick={() => onSelectChat(chat.id)}
                                >
                                    <FiMessageSquare size={16} />
                                    <span>{chat.title}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {grouped.yesterday.length > 0 && (
                        <div className="history-group">
                            <div className="history-label">Yesterday</div>
                            {grouped.yesterday.map(chat => (
                                <button
                                    key={chat.id}
                                    className={`history-item ${currentChatId === chat.id ? 'active' : ''}`}
                                    onClick={() => onSelectChat(chat.id)}
                                >
                                    <FiMessageSquare size={16} />
                                    <span>{chat.title}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {grouped.previous7Days.length > 0 && (
                        <div className="history-group">
                            <div className="history-label">Previous 7 Days</div>
                            {grouped.previous7Days.map(chat => (
                                <button
                                    key={chat.id}
                                    className={`history-item ${currentChatId === chat.id ? 'active' : ''}`}
                                    onClick={() => onSelectChat(chat.id)}
                                >
                                    <FiMessageSquare size={16} />
                                    <span>{chat.title}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {grouped.older.length > 0 && (
                        <div className="history-group">
                            <div className="history-label">Older</div>
                            {grouped.older.map(chat => (
                                <button
                                    key={chat.id}
                                    className={`history-item ${currentChatId === chat.id ? 'active' : ''}`}
                                    onClick={() => onSelectChat(chat.id)}
                                >
                                    <FiMessageSquare size={16} />
                                    <span>{chat.title}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {chatHistory.length === 0 && (
                        <div className="empty-history">
                            <p>No chat history yet</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
