import React, { useContext, useEffect, useState } from 'react';
import { userDataContext } from '../context/UserContext';
import { useChatContext } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ProfilePanel from '../components/ProfilePanel';
import orvVideo from '../assets/orv.mp4';

// UI Components
import Button from '@/components/VoiceOrb';
import ModeToggle from '../components/ModeToggle';
import ConnectionStatus from '../components/Home/ConnectionStatus';
import AssistantStatus from '../components/Home/AssistantStatus';
import AudioVisualizer from '../components/Home/AudioVisualizer';

// Hooks & Controllers
import { useSocketConnection } from '../hooks/useSocketConnection';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { useVAD } from '../hooks/useVAD';
import { useGreeting } from '../hooks/useGreeting';
import { processCommand } from '../controllers/commandController';

import useDevicePairingStore from '../store/devicePairingStore';

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext);
  const { switchMode } = useChatContext();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isDevicePairingOpen = useDevicePairingStore(state => state.isModalOpen);

  useEffect(() => {
    switchMode('voice');
  }, [switchMode]);

  useEffect(() => {
    if (!userData) navigate("/signin");
  }, [userData, navigate]);

  const { isConnected } = useSocketConnection();

  const {
    listening,
    isAssistantActive,
    userText,
    aiText,
    isSpeakingRef,
    speak,
    startListening
  } = useVoiceAssistant({
    userData,
    getGeminiResponse,
    processCommand,
    navigate
  });

  const handleSpeechStart = React.useCallback(() => {
    if (isSpeakingRef.current) {
      isSpeakingRef.current = false;
    }
    startListening();
  }, [startListening]);

  useVAD(isSpeakingRef, handleSpeechStart);
  useGreeting(userData, speak);

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      setUserData(null);
      navigate("/signin");
    } catch (error) {
      setUserData(null);
      console.log(error);
    }
  };

  if (!userData) return null;

  return (
    <div className='w-full min-h-screen relative overflow-hidden' style={{
      background: '#EDF4FC'
    }}>
      {/* Status Indicators */}
      <ConnectionStatus isConnected={isConnected} />

      <div className='absolute top-5 left-1/2 transform -translate-x-1/2 z-50'>
        <ModeToggle currentMode="voice" />
      </div>

      {/* Profile Button - Top Right */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsProfileOpen(true)}
        className="absolute top-5 right-5 z-50 w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}
      >
        {userData.name.charAt(0).toUpperCase()}
      </motion.button>

      <AssistantStatus isAssistantActive={isAssistantActive} assistantName={userData.assistantName} />

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-20">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-semibold mb-3" style={{
            color: '#000000ff',
            fontWeight: 600,
            letterSpacing: '-0.02em'
          }}>
            Hey, {userData.name}!
          </h1>
          <p className="text-lg" style={{
            color: 'rgba(25, 24, 24, 0.7)',
            fontWeight: 400
          }}>
            How can I help you today?
          </p>
        </motion.div>

        {/* Video - Hides when device pairing modal is open */}
        <AnimatePresence>
          {!isDevicePairingOpen && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="relative w-[400px] h-[400px] flex items-center justify-center mb-8"
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: '50%',
                  height: '50%',
                  objectFit: 'contain',
                  borderRadius: '20px'
                }}
              >
                <source src={orvVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcription */}
        {(userText || aiText) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <p className="text-center text-base px-6 py-3 rounded-2xl" style={{
              color: '#073A4C',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
            }}>
              {userText || aiText}
            </p>
          </motion.div>
        )}
      </div>

      {/* Profile Panel */}
      <ProfilePanel
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userData={userData}
        onLogout={handleLogOut}
      />

      {/* Visualizer */}
      <AudioVisualizer listening={listening} />
    </div>
  );
}

export default Home;