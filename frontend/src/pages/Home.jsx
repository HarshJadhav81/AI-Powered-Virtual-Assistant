import React, { useContext, useEffect, useState, useRef } from 'react';
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
  const [isDevicesDropdownOpen, setIsDevicesDropdownOpen] = useState(false);
  const isDevicePairingOpen = useDevicePairingStore(state => state.isModalOpen);
  const { openModal, selectDeviceType, setCurrentScreen } = useDevicePairingStore();

  // Video and animation refs
  const videoRef = useRef(null);
  const [orbScale, setOrbScale] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Orb animation: Control video playback speed and scale based on state
  useEffect(() => {
    if (!videoRef.current) return;

    // Idle state: slow playback
    if (!listening && !isSpeakingRef.current && !isProcessing) {
      videoRef.current.playbackRate = 1.2;
      setOrbScale(1);
    }

    // Listening state: medium speed (no pulse, just faster than idle)
    if (listening && !isSpeakingRef.current) {
      videoRef.current.playbackRate = 0.5;
      setOrbScale(1);
    }

    // Processing state: fastest playback
    if (isProcessing) {
      videoRef.current.playbackRate = 2;
      setOrbScale(1);
    }

    // Speaking state: pulse with voice intensity
    if (isSpeakingRef.current) {
      videoRef.current.playbackRate = 1.2;

      // Pulse animation while speaking (simulating voice intensity)
      const speakPulse = setInterval(() => {
        setOrbScale(scale => scale === 1 ? 1.1 : 1);
      }, 700);

      return () => clearInterval(speakPulse);
    }
  }, [listening, isProcessing, isSpeakingRef.current]);

  // Detect processing state (when user stops talking but AI hasn't responded yet)
  useEffect(() => {
    if (!listening && userText && !aiText && !isSpeakingRef.current) {
      setIsProcessing(true);
    } else {
      setIsProcessing(false);
    }
  }, [listening, userText, aiText, isSpeakingRef.current]);

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
      {/* Header Section */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'fixed',
          top: 10,
          left: '15%',
          borderRadius: '50px',
          width: '70%',
          height: '50px',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 100
        }}
      >
        {/* Left Side - Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Connection Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isConnected ? '#34C759' : '#FF3B30',
              boxShadow: isConnected ? '0 0 8px rgba(52, 199, 89, 0.5)' : '0 0 8px rgba(255, 59, 48, 0.5)'
            }} />
            <span style={{
              fontSize: '14px',
              color: '#1d1d1f',
              fontWeight: 500
            }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Assistant Status */}
          {isAssistantActive && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(111, 139, 255, 0.1)',
              borderRadius: '20px',
              border: '1px solid rgba(111, 139, 255, 0.2)'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#6F8BFF',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{
                fontSize: '13px',
                color: '#6F8BFF',
                fontWeight: 600
              }}>
                Assistant Active
              </span>
            </div>
          )}
        </div>

        {/* Right Side - Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Devices Dropdown */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setIsDevicesDropdownOpen(true)}
            onMouseLeave={() => setIsDevicesDropdownOpen(false)}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '8px 16px',
                background: 'rgba(111, 139, 255, 0.1)',
                color: '#6F8BFF',
                border: '1px solid rgba(111, 139, 255, 0.2)',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
              Devices
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{
                  transform: isDevicesDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s'
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDevicesDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    padding: '8px',
                    minWidth: '180px',
                    zIndex: 1000
                  }}
                >
                  {/* Bluetooth Option */}
                  <motion.button
                    whileHover={{ background: 'rgba(111, 139, 255, 0.1)' }}
                    onClick={() => {
                      openModal('bluetooth');
                      setIsDevicesDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#1d1d1f',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2">
                      <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11" />
                    </svg>
                    Bluetooth
                  </motion.button>

                  {/* Chromecast Option */}
                  <motion.button
                    whileHover={{ background: 'rgba(111, 139, 255, 0.1)' }}
                    onClick={() => {
                      openModal('chromecast');
                      setIsDevicesDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#1d1d1f',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2">
                      <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
                      <line x1="2" y1="20" x2="2.01" y2="20" />
                    </svg>
                    Chromecast
                  </motion.button>

                  {/* Android TV Option */}
                  <motion.button
                    whileHover={{ background: 'rgba(111, 139, 255, 0.1)' }}
                    onClick={() => {
                      openModal('android-tv');
                      setIsDevicesDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#1d1d1f',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                      <polyline points="17 2 12 7 7 2" />
                    </svg>
                    Android TV
                  </motion.button>

                  {/* Mobile Option */}
                  <motion.button
                    whileHover={{ background: 'rgba(111, 139, 255, 0.1)' }}
                    onClick={() => {
                      openModal('mobile');
                      setIsDevicesDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#1d1d1f',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                    Mobile Phones
                  </motion.button>

                  {/* Smart Home Option */}
                  <motion.button
                    whileHover={{ background: 'rgba(111, 139, 255, 0.1)' }}
                    onClick={() => {
                      openModal('smart-home');
                      setIsDevicesDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#1d1d1f',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2">
                      <path d="M3 21l1.65-3.8a9 9 0 1 1 14.7 0L21 21" />
                      <path d="M9 12h6" />
                      <path d="M12 9v6" />
                    </svg>
                    Smart Home
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Logout Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogOut}
            style={{
              padding: '8px 20px',
              background: 'rgba(0, 0, 0, 0.05)',
              color: '#1d1d1f',
              border: 'none',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
          >
            Logout
          </motion.button>

          {/* Profile Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsProfileOpen(true)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6F8BFF 0%, #5B6FE8 100%)',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(111, 139, 255, 0.3)',
              transition: 'all 0.3s'
            }}
          >
            {userData.name.charAt(0).toUpperCase()}
          </motion.button>
        </div>
      </motion.header>

      {/* Add pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6" style={{ paddingTop: '70px' }}>
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
            letterSpacing: '-0.02em',
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
              style={{
                transform: `scale(${orbScale})`,
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: '40%',
                  height: '40%',
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

        {/* Navigation Buttons - Below Video */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex gap-4 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(255,255,255,0.25)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/chat')}
            style={{
              padding: '16px 40px',
              background: 'rgba(141, 127, 127, 0.15)',
              backdropFilter: 'blur(10px)',
              color: '#565252ff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50px',
              fontSize: '17px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Chat Mode
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(255,255,255,0.25)" }}
            whileTap={{ scale: 0.95 }}
            onClick={startListening}
            style={{
              padding: '16px 40px',
              background: '#6F8BFF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '50px',
              fontSize: '17px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 16px rgba(255, 255, 255, 0.3)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            Voice Mode
          </motion.button>
        </motion.div>
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