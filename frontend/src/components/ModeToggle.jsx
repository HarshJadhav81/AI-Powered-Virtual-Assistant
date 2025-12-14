import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatContext } from '../context/ChatContext';

/**
 * Mode Toggle Component
 * Allows switching between keyboard chat and voice assistant modes
 */
const ModeToggle = ({ currentMode }) => {
    const navigate = useNavigate();
    const { switchMode } = useChatContext();

    const handleModeSwitch = (newMode) => {
        switchMode(newMode);

        // Navigate to appropriate page
        if (newMode === 'keyboard') {
            navigate('/chat');
        } else if (newMode === 'voice') {
            navigate('/home');
        }
    };

    return (
        <div className="mode-toggle-container">
            <div className="mode-toggle">
                <button
                    className={`mode-toggle-btn ${currentMode === 'keyboard' ? 'active' : ''}`}
                    onClick={() => handleModeSwitch('keyboard')}
                    title="Keyboard Chat Mode (Ctrl+K)"
                >
                    <svg className="mode-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="mode-label">Chat</span>
                </button>

                <button
                    className={`mode-toggle-btn ${currentMode === 'voice' ? 'active' : ''}`}
                    onClick={() => handleModeSwitch('voice')}
                    title="Voice Assistant Mode (Ctrl+V)"
                >
                    <svg className="mode-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span className="mode-label">Voice</span>
                </button>
            </div>
        </div>
    );
};

export default ModeToggle;
