import React, { useContext, useEffect, useState } from 'react';
import { userDataContext } from '../context/UserContext';
import { useChatContext } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

// UI Components
import Button from '@/components/VoiceOrb';
import { CgMenuRight } from "react-icons/cg";
import ModeToggle from '../components/ModeToggle';
import ConnectionStatus from '../components/Home/ConnectionStatus';
import AssistantStatus from '../components/Home/AssistantStatus';
import MobileMenu from '../components/Home/MobileMenu';
import AudioVisualizer from '../components/Home/AudioVisualizer';

// Hooks & Controllers
import { useSocketConnection } from '../hooks/useSocketConnection';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { useVAD } from '../hooks/useVAD';
import { useGreeting } from '../hooks/useGreeting';
import { processCommand } from '../controllers/commandController';

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext);
  const { switchMode } = useChatContext();
  const navigate = useNavigate();
  const [ham, setHam] = useState(false);

  // Set mode to voice on mount
  useEffect(() => {
    switchMode('voice');
  }, [switchMode]);

  useEffect(() => {
    if (!userData) navigate("/signin");
  }, [userData, navigate]);

  // 1. Connection Hook
  const { isConnected } = useSocketConnection();

  // 2. Voice Assistant Hook
  const {
    listening,
    isAssistantActive,
    userText,
    aiText,
    speak,
    isSpeakingRef,
    startListening // Added
  } = useVoiceAssistant({
    userData,
    getGeminiResponse,
    processCommand,
    navigate
  });

  // 3. VAD Hook (Interruption + Wake Up)
  const handleSpeechStart = React.useCallback(() => {
    // If user speaks while AI is talking -> Interrupt
    if (isSpeakingRef.current) {
      isSpeakingRef.current = false;
    }
    // Always ensure we are listening when speech is detected
    startListening();
  }, [startListening]);

  useVAD(isSpeakingRef, handleSpeechStart);

  // 4. Greeting Hook
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
    <div className='w-full h-[100vh] bg-white flex justify-center items-center flex-col gap-[15px] overflow-hidden relative'>
      {/* Status Indicators */}
      <ConnectionStatus isConnected={isConnected} />

      <div className='absolute top-[20px] left-[50%] transform -translate-x-1/2 z-50'>
        <ModeToggle currentMode="voice" />
      </div>

      <AssistantStatus isAssistantActive={isAssistantActive} assistantName={userData.assistantName} />

      {/* Mobile Menu */}
      <CgMenuRight
        className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px] z-50'
        onClick={() => setHam(true)}
      />
      <MobileMenu
        ham={ham}
        setHam={setHam}
        handleLogOut={handleLogOut}
        navigate={navigate}
        userData={userData}
      />

      {/* Desktop Buttons */}
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px] bg-white rounded-full cursor-pointer text-[19px]' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold bg-white absolute top-[100px] right-[20px] rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] hidden lg:block' onClick={() => navigate("/customize")}>Customize your Assistant</button>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold bg-white absolute top-[180px] right-[20px] rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] hidden lg:block' onClick={() => navigate("/settings")}>⚙️ Settings</button>

      {/* Voice Orb */}
      <div className="relative w-[200px] h-[200px] flex items-center justify-center">
        <Button />
      </div>

      {/* Transcription Output */}
      <h1 className='text-white text-[18px] font-semibold text-wrap p-4 text-center z-10'>
        {userText ? userText : aiText ? aiText : null}
      </h1>

      {/* Visualizer - Manages its own audio level subscription */}
      <AudioVisualizer listening={listening} />
    </div>
  );
}

export default Home;