import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { userDataContext } from "../context/UserContext";
import socketService from "../services/socketService";
import {
    FiMenu, FiSun, FiMoon, FiSend, FiPlus, FiImage, FiMic,
    FiZap, FiCode, FiEdit3, FiCompass
} from "react-icons/fi";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar/Sidebar";
import MarkdownRenderer from "../components/MarkdownRenderer";
import "./GeminiChat.css";

function GeminiChat() {
    const { userData, setUserData, serverUrl } = useContext(userDataContext);
    const navigate = useNavigate();

    // State
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState("dark");
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);

    // Refs
    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);
    const socketRef = useRef(null);

    // Auth redirect
    useEffect(() => {
        if (!userData) navigate("/signin");
    }, [userData, navigate]);

    // Theme
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    // Socket initialization
    useEffect(() => {
        if (!serverUrl) return;

        // Initialize socket connection
        socketService.connect();
        const socket = socketService.getSocket();

        if (!socket) {
            console.warn("[GEMINI] Socket not initialized yet");
            return;
        }

        socketRef.current = socket;

        const safeOn = (event, handler) => {
            try { socket.off(event); } catch { }
            socket.on(event, handler);
        };

        safeOn("connect", () => console.log("[GEMINI] Connected"));
        safeOn("disconnect", () => setIsTyping(false));

        safeOn("stream-start", (data) => {
            const id = data?.messageId || data?.streamId || `msg_${Date.now()}`;
            setIsTyping(true);

            setMessages((prev) => {
                if (prev.some((m) => m.id === id)) return prev;
                return [
                    ...prev,
                    {
                        id,
                        role: "model",
                        content: "",
                        timestamp: new Date().toISOString(),
                        isStreaming: true,
                    },
                ];
            });
        });

        safeOn("stream-token", (data) => {
            if (!data) return;
            const id = data.messageId || data.streamId;
            if (!id) return;

            setMessages((prev) => {
                const updated = [...prev];
                const idx = updated.findIndex((m) => m.id === id);

                if (idx >= 0) {
                    updated[idx] = {
                        ...updated[idx],
                        content: updated[idx].content + (data.content || ""),
                        isStreaming: !data.final,
                    };
                }
                return updated;
            });

            if (data.final) setIsTyping(false);
        });

        safeOn("stream-end", (data) => {
            const id = data?.messageId || data?.streamId;
            if (!id) return;

            setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, isStreaming: false } : m))
            );
            setIsTyping(false);
        });

        safeOn("stream-error", () => {
            toast.error("Stream error occurred.");
            setIsTyping(false);
        });

        // [NEW] Real-time event listeners
        safeOn("acknowledgment", (data) => {
            toast.success(data.text, {
                icon: '⚡',
                duration: 2000
            });
        });

        safeOn("confirmation-required", (data) => {
            setMessages((prev) => [
                ...prev,
                {
                    id: `conf_${Date.now()}`,
                    role: "system",
                    content: `⚠️ ${data.message}`,
                    isConfirmation: true,
                    timestamp: new Date().toISOString()
                }
            ]);
        });

        safeOn("clarification", (data) => {
            setMessages((prev) => [
                ...prev,
                {
                    id: `clar_${Date.now()}`,
                    role: "model",
                    content: data.question,
                    timestamp: new Date().toISOString()
                }
            ]);
        });

        return () => {
            try {
                socket.off("connect");
                socket.off("disconnect");
                socket.off("stream-start");
                socket.off("stream-token");
                socket.off("stream-end");
                socket.off("stream-error");
                socket.off("acknowledgment");
                socket.off("confirmation-required");
                socket.off("clarification");
            } catch { }
        };
    }, [serverUrl]);

    // Auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }, [input]);

    // Send message
    const sendMessage = (text = input) => {
        if (!text.trim()) return;
        if (isTyping) return toast("Processing previous reply. Please wait.");

        const socket = socketRef.current;
        if (!socket) return toast.error("Not connected to server.");

        const userMsg = {
            id: `usr_${Date.now()}`,
            role: "user",
            content: text.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");

        // Update chat history
        if (!currentChatId) {
            const newChatId = `chat_${Date.now()}`;
            const title = text.trim().substring(0, 50) + (text.length > 50 ? "..." : "");
            setChatHistory((prev) => [
                { id: newChatId, title, timestamp: new Date().toISOString() },
                ...prev,
            ]);
            setCurrentChatId(newChatId);
        }

        socket.emit("user-message", {
            message: userMsg.content,
            userId: userData?._id,
            mode: "keyboard",
        });
    };

    // Handle key down
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // New chat
    const handleNewChat = () => {
        setMessages([]);
        setCurrentChatId(null);
        setSidebarOpen(false);
        toast.success("New chat started");
    };

    // Select chat
    const handleSelectChat = (chatId) => {
        setCurrentChatId(chatId);
        setSidebarOpen(false);
        // In a real app, you'd load messages for this chat
        toast.info("Chat history loading not implemented yet");
    };

    // Suggestion cards
    const suggestions = [
        {
            icon: <FiZap />,
            title: "Brainstorm ideas",
            text: "for a new project",
            prompt: "Help me brainstorm ideas for a new project",
        },
        {
            icon: <FiCode />,
            title: "Help me write",
            text: "clean code",
            prompt: "Help me write clean and efficient code",
        },
        {
            icon: <FiEdit3 />,
            title: "Draft an email",
            text: "professional tone",
            prompt: "Help me draft a professional email",
        },
        {
            icon: <FiCompass />,
            title: "Plan a trip",
            text: "with itinerary",
            prompt: "Help me plan a trip with a detailed itinerary",
        },
    ];

    if (!userData) return null;

    return (
        <div className="gemini-chat-container">
            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                chatHistory={chatHistory}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                currentChatId={currentChatId}
            />

            {/* Main Content */}
            <div className="main-content">
                {/* Header */}
                <div className="gemini-header">
                    <div className="header-left">
                        <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
                            <FiMenu size={20} />
                        </button>
                        <div className="brand-name">Orvion</div>
                    </div>

                    <div className="header-right">
                        <button
                            className="theme-btn"
                            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
                        >
                            {theme === "light" ? <FiMoon size={18} /> : <FiSun size={18} />}
                        </button>

                        <button className="logout-btn" onClick={() => {
                            setUserData(null);
                            navigate("/signin");
                        }}>
                            <span>Logout</span>
                        </button>

                        <div className="user-avatar">
                            {userData?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="chat-area">
                    {messages.length === 0 ? (
                        /* Welcome Screen */
                        <div className="welcome-screen">
                            <div className="welcome-greeting">
                                Hello, {userData?.name || "there"}
                            </div>
                            <div className="welcome-subtitle">
                                How can I help you today?
                            </div>

                            <div className="suggestion-cards">
                                {suggestions.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        className="suggestion-card"
                                        onClick={() => sendMessage(suggestion.prompt)}
                                    >
                                        <div className="suggestion-icon">{suggestion.icon}</div>
                                        <div className="suggestion-title">{suggestion.title}</div>
                                        <div className="suggestion-text">{suggestion.text}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Chat Messages */
                        <div className="chat-messages">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`message-container ${msg.role}`}>
                                    <div className={`message-avatar ${msg.role}-avatar`}>
                                        {msg.role === "user"
                                            ? userData?.name?.charAt(0)?.toUpperCase() || "U"
                                            : "O"}
                                    </div>

                                    <div className="message-content">
                                        <div className="message-role">
                                            {msg.role === "user" ? "You" : "Orvion"}
                                        </div>

                                        <div className={`message-text ${msg.role === "model" ? "orvion-markdown" : ""}`}>
                                            {msg.role === "user" ? (
                                                msg.content
                                            ) : (
                                                <>
                                                    <MarkdownRenderer content={msg.content} />
                                                    {msg.isStreaming && (
                                                        <div className="typing-indicator">
                                                            <div className="typing-dot"></div>
                                                            <div className="typing-dot"></div>
                                                            <div className="typing-dot"></div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="input-area">
                    <div className="input-wrapper">
                        <div className="input-actions-left">
                            <button className="input-btn" title="Add attachment">
                                <FiPlus size={20} />
                            </button>
                        </div>

                        <textarea
                            ref={textareaRef}
                            className="chat-input"
                            placeholder="Enter a prompt here..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />

                        <div className="input-actions-left">
                            <button className="input-btn" title="Upload image">
                                <FiImage size={20} />
                            </button>
                            <button className="input-btn" title="Voice input">
                                <FiMic size={20} />
                            </button>
                        </div>

                        <button
                            className="send-btn"
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isTyping}
                        >
                            <FiSend size={18} />
                        </button>
                    </div>

                    <div className="input-footer">
                        Orvion may display inaccurate info. Always verify important details.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GeminiChat;
