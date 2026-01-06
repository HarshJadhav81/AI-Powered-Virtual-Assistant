import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { userDataContext } from "../context/UserContext";
import socketService from "../services/socketService";
import {
    FiMenu,
    FiSun,
    FiMoon,
    FiSend,
} from "react-icons/fi";
import Sidebar from "../components/sidebar/Sidebar";
import MarkdownRenderer from "../components/MarkdownRenderer";
import "./GeminiChat.css";

function GeminiChat() {
    const { userData, setUserData, serverUrl } = useContext(userDataContext);
    const navigate = useNavigate();

    /* ===== UI STATE ===== */
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState("dark");
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);

    /* ===== REFS ===== */
    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);
    const socketRef = useRef(null);

    /* ===== AUTH GUARD ===== */
    useEffect(() => {
        if (!userData) navigate("/signin");
    }, [userData, navigate]);

    /* ===== THEME ===== */
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    /* ===== SOCKET ===== */
    useEffect(() => {
        if (!serverUrl) return;

        socketService.connect();
        const socket = socketService.getSocket();
        socketRef.current = socket;

        socket.on("stream-start", (data) => {
            setIsTyping(true);
            setMessages((prev) => [
                ...prev,
                {
                    id: data.messageId,
                    role: "model",
                    content: "",
                    isStreaming: true,
                },
            ]);
        });

        socket.on("stream-token", (data) => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === data.messageId
                        ? {
                            ...m,
                            content: m.content + data.content,
                            isStreaming: !data.final,
                        }
                        : m
                )
            );
            if (data.final) setIsTyping(false);
        });

        return () => socket.disconnect();
    }, [serverUrl]);

    /* ===== AUTO SCROLL ===== */
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ===== SEND MESSAGE ===== */
    const sendMessage = () => {
        if (!input.trim() || isTyping) return;

        socketRef.current.emit("user-message", {
            message: input,
            userId: userData._id,
        });

        setMessages((prev) => [...prev, { role: "user", content: input }]);
        setInput("");
    };

    if (!userData) return null;

    return (
        <div className="gemini-chat-page">
            <div className="chat-shell">

                {/* SIDEBAR (Controlled by this page) */}
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    chatHistory={chatHistory}
                    currentChatId={currentChatId}
                    onSelectChat={setCurrentChatId}
                />

                {/* MAIN CONTENT */}
                <div className="main-content">

                    {/* HEADER */}
                    <header className="gemini-header">
                        <div className="header-left">
                            <button
                                className="menu-btn"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <FiMenu />
                            </button>
                            <span className="brand-name">Orvion</span>
                        </div>

                        <div className="header-right">
                            <button
                                className="theme-btn"
                                onClick={() =>
                                    setTheme((t) => (t === "dark" ? "light" : "dark"))
                                }
                            >
                                {theme === "dark" ? <FiMoon /> : <FiSun />}
                            </button>

                            <button
                                className="logout-btn"
                                onClick={() => {
                                    setUserData(null);
                                    navigate("/signin");
                                }}
                            >
                                Logout
                            </button>

                            <div className="user-avatar">
                                {userData.name?.charAt(0)?.toUpperCase()}
                            </div>
                        </div>
                    </header>

                    {/* CHAT BODY */}
                    <main className="chat-area">
                        <div className="chat-messages">
                            {messages.map((msg, i) => (
                                <div key={i} className={`message-container ${msg.role}`}>
                                    <div className="message-content">
                                        {msg.role === "model" ? (
                                            <>
                                                <MarkdownRenderer content={msg.content} />
                                                {msg.isStreaming && (
                                                    <span className="typing">…</span>
                                                )}
                                            </>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                    </main>

                    {/* INPUT */}
                    <footer className="input-area">
                        <div className="input-wrapper">
                            <textarea
                                ref={textareaRef}
                                className="chat-input"
                                placeholder="Type your message…"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button className="send-btn" onClick={sendMessage}>
                                <FiSend />
                            </button>
                        </div>
                    </footer>

                </div>
            </div>
        </div>
    );
}

export default GeminiChat;
