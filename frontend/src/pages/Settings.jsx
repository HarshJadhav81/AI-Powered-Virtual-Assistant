import React, { useContext, useState } from 'react';
import { userDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import axios from 'axios';
import voicePersonality from '../services/voicePersonality';
import PopupSettings from '../components/PopupSettings';

// Missing ConversationHistory component - create placeholder
const ConversationHistory = () => (
  <div className='bg-[#ffffff10] backdrop-blur-lg rounded-[20px] p-[25px] border border-[#ffffff20]'>
    <h2 className='text-white text-[22px] font-semibold mb-[20px] flex items-center gap-[10px]'>
      💬 Conversation History
    </h2>
    <p className='text-gray-400 text-[14px]'>Your conversation history will appear here.</p>
  </div>
);

function Settings() {
  const { userData, serverUrl } = useContext(userDataContext);
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [activeTab, setActiveTab] = useState('language');
  const [personality, setPersonality] = useState(voicePersonality.getPersonality());

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी (Marathi)', flag: '🇮🇳' }
  ];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setSelectedLanguage(langCode);
    localStorage.setItem('preferredLanguage', langCode);
    toast.success(`Language changed to ${languages.find(l => l.code === langCode)?.name}`);
  };

  const handlePersonalityChange = (mode) => {
    if (voicePersonality.setPersonality(mode)) {
      setPersonality(mode);
      toast.success(`Voice personality set to ${mode}`);
    }
  };

  const handleScanDevices = async () => {
    setScanning(true);
    try {
      const response = await axios.post(`${serverUrl}/api/device/scan`, {}, { withCredentials: true });
      if (response.data.success) {
        setDevices(response.data.devices);
        toast.success(`Found ${response.data.count} devices`);
      } else {
        toast.error('Failed to scan devices');
      }
    } catch (error) {
      console.error('Device scan error:', error);
      toast.error('Device scanning not available - network required');
      setDevices([
        { id: '1', name: 'Living Room TV', type: 'android-tv', ip: '192.168.1.100', status: 'available' },
        { id: '2', name: 'Bedroom Chromecast', type: 'chromecast', ip: '192.168.1.101', status: 'available' }
      ]);
    } finally {
      setScanning(false);
    }
  };

  const handleConnectDevice = async (device) => {
    try {
      const response = await axios.post(`${serverUrl}/api/device/connect`, {
        deviceType: device.type,
        deviceIp: device.ip
      }, { withCredentials: true });

      if (response.data.success) {
        setConnectedDevices([...connectedDevices, device]);
        toast.success(`Connected to ${device.name}`);
      } else {
        toast.error('Failed to connect to device');
      }
    } catch (error) {
      console.error('Device connect error:', error);
      toast.error('Connection failed - device may be offline');
    }
  };

  const handleDisconnectDevice = async (deviceId) => {
    try {
      await axios.post(`${serverUrl}/api/device/disconnect`, { deviceId }, { withCredentials: true });
      setConnectedDevices(connectedDevices.filter(d => d.id !== deviceId));
      toast.success('Device disconnected');
    } catch (error) {
      console.error('Device disconnect error:', error);
      toast.error('Failed to disconnect device');
    }
  };

  return (
    <div className='w-full min-h-[100vh] bg-gradient-to-br from-[#0a0a1e] via-[#1a1a3e] to-[#0f0f2e] p-[20px]'>
      {/* Header with gradient */}
      <div className='max-w-[900px] mx-auto mb-[30px]'>
        <div className='flex items-center justify-between bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-[20px] p-[20px] shadow-lg'>
          <button
            onClick={() => navigate('/home')}
            className='px-[20px] py-[10px] bg-white/20 backdrop-blur-md text-white rounded-full font-semibold hover:bg-white/30 transition-all duration-300 flex items-center gap-[8px] border border-white/30'
          >
            <span>←</span> Back
          </button>
          <div className='flex items-center gap-[12px]'>
            <span className='text-[32px]'>⚙️</span>
            <h1 className='text-white text-[32px] font-bold'>Settings</h1>
          </div>
          <div className='w-[100px]'></div>
        </div>
      </div>

      {/* Tab Navigation - Improved */}
      <div className='max-w-[900px] mx-auto mb-[25px]'>
        <div className='flex gap-[12px] bg-[#ffffff08] backdrop-blur-xl rounded-[20px] p-[8px] border border-[#ffffff15] shadow-xl'>
          {[
            { id: 'language', icon: '🌐', label: 'Language & Voice' },
            { id: 'devices', icon: '📱', label: 'Devices' },
            { id: 'popups', icon: '🔔', label: 'Notifications' },
            { id: 'history', icon: '💬', label: 'History' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-[16px] py-[14px] rounded-[14px] font-semibold transition-all duration-300 flex items-center justify-center gap-[8px] ${activeTab === tab.id
                ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg transform scale-105'
                : 'text-white/70 hover:bg-[#ffffff10] hover:text-white'
                }`}
            >
              <span className='text-[20px]'>{tab.icon}</span>
              <span className='hidden md:inline text-[14px]'>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className='max-w-[900px] mx-auto space-y-[20px]'>
        {/* Language & Voice Settings Tab */}
        {activeTab === 'language' && (
          <>
            {/* Language Settings */}
            <div className='bg-[#ffffff08] backdrop-blur-xl rounded-[24px] p-[30px] border border-[#ffffff15] shadow-xl hover:shadow-2xl transition-all duration-300'>
              <h2 className='text-white text-[24px] font-bold mb-[24px] flex items-center gap-[12px]'>
                <span className='text-[28px]'>🌐</span>
                Language Settings
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-[16px]'>
                {languages.map((lang) => (
                  <div
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`p-[20px] rounded-[16px] cursor-pointer transition-all duration-300 border-2 transform hover:scale-105 ${selectedLanguage === lang.code
                      ? 'bg-gradient-to-br from-[#667eea]/30 to-[#764ba2]/30 border-[#667eea] shadow-lg'
                      : 'bg-[#ffffff05] border-transparent hover:bg-[#ffffff10] hover:border-[#ffffff20]'
                      }`}
                  >
                    <div className='flex flex-col items-center gap-[12px] text-center'>
                      <span className='text-[40px]'>{lang.flag}</span>
                      <span className='text-white text-[16px] font-semibold'>{lang.name}</span>
                      {selectedLanguage === lang.code && (
                        <span className='text-[#667eea] text-[24px]'>✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Voice Settings */}
            <div className='bg-[#ffffff08] backdrop-blur-xl rounded-[24px] p-[30px] border border-[#ffffff15] shadow-xl hover:shadow-2xl transition-all duration-300'>
              <h2 className='text-white text-[24px] font-bold mb-[24px] flex items-center gap-[12px]'>
                <span className='text-[28px]'>🎤</span>
                Voice Settings
              </h2>
              <div className='space-y-[16px]'>
                <div className='flex items-center justify-between p-[20px] bg-[#ffffff08] rounded-[16px] hover:bg-[#ffffff12] transition-all duration-300'>
                  <div>
                    <p className='text-white text-[16px] font-semibold'>Wake Word</p>
                    <p className='text-gray-400 text-[14px] mt-[4px]'>Say "{userData?.assistantName}" to activate</p>
                  </div>
                  <span className='text-[28px]'>🔊</span>
                </div>

                <div className='flex items-center justify-between p-[20px] bg-[#ffffff08] rounded-[16px] hover:bg-[#ffffff12] transition-all duration-300'>
                  <div>
                    <p className='text-white text-[16px] font-semibold'>Continuous Listening</p>
                    <p className='text-gray-400 text-[14px] mt-[4px]'>Always listening for commands</p>
                  </div>
                  <div className='w-[52px] h-[28px] bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full relative cursor-pointer shadow-lg'>
                    <div className='absolute right-[3px] top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-md'></div>
                  </div>
                </div>

                <div className='flex items-center justify-between p-[20px] bg-[#ffffff08] rounded-[16px] hover:bg-[#ffffff12] transition-all duration-300'>
                  <div>
                    <p className='text-white text-[16px] font-semibold'>Voice Feedback</p>
                    <p className='text-gray-400 text-[14px] mt-[4px]'>Spoken responses enabled</p>
                  </div>
                  <div className='w-[52px] h-[28px] bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full relative cursor-pointer shadow-lg'>
                    <div className='absolute right-[3px] top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-md'></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Personality */}
            <div className='bg-[#ffffff08] backdrop-blur-xl rounded-[24px] p-[30px] border border-[#ffffff15] shadow-xl hover:shadow-2xl transition-all duration-300'>
              <h2 className='text-white text-[24px] font-bold mb-[24px] flex items-center gap-[12px]'>
                <span className='text-[28px]'>🎭</span>
                Voice Personality
              </h2>
              <div className='space-y-[12px]'>
                {voicePersonality.getPersonalityModes().map((mode) => (
                  <div
                    key={mode.value}
                    onClick={() => handlePersonalityChange(mode.value)}
                    className={`p-[18px] rounded-[16px] cursor-pointer transition-all duration-300 border-2 transform hover:scale-102 ${personality === mode.value
                      ? 'bg-gradient-to-r from-[#667eea]/20 to-[#764ba2]/20 border-[#667eea] shadow-lg'
                      : 'bg-[#ffffff05] border-transparent hover:bg-[#ffffff10] hover:border-[#ffffff15]'
                      }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-white text-[16px] font-semibold'>{mode.label}</p>
                        <p className='text-gray-400 text-[14px] mt-[4px]'>{mode.description}</p>
                      </div>
                      {personality === mode.value && (
                        <span className='text-[#667eea] text-[24px]'>✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Devices Tab */}
        {activeTab === 'devices' && (
          <>
            {/* Payment Settings */}
            <div className='bg-[#ffffff08] backdrop-blur-xl rounded-[24px] p-[30px] border border-[#ffffff15] shadow-xl hover:shadow-2xl transition-all duration-300'>
              <h2 className='text-white text-[24px] font-bold mb-[24px] flex items-center gap-[12px]'>
                <span className='text-[28px]'>💳</span>
                Payment Settings
              </h2>
              <div className='space-y-[16px]'>
                <div className='p-[20px] bg-[#ffffff08] rounded-[16px]'>
                  <p className='text-white text-[16px] font-semibold mb-[12px]'>Default Payment Apps</p>
                  <div className='flex gap-[12px] flex-wrap'>
                    <span className='px-[18px] py-[10px] bg-gradient-to-r from-[#5f259f] to-[#7c3aaf] text-white rounded-full text-[14px] font-medium shadow-md'>PhonePe</span>
                    <span className='px-[18px] py-[10px] bg-gradient-to-r from-[#0d9e4a] to-[#10b981] text-white rounded-full text-[14px] font-medium shadow-md'>Google Pay</span>
                    <span className='px-[18px] py-[10px] bg-gradient-to-r from-[#00baf2] to-[#06b6d4] text-white rounded-full text-[14px] font-medium shadow-md'>Paytm</span>
                  </div>
                </div>

                <div className='p-[20px] bg-[#ffffff08] rounded-[16px]'>
                  <p className='text-gray-300 text-[14px] leading-relaxed'>
                    <span className='font-semibold text-white block mb-[8px]'>Voice commands for payments:</span>
                    • "Pay 500 rupees using PhonePe"<br />
                    • "Send 1000 via Google Pay"<br />
                    • "Transfer 200 using Paytm"
                  </p>
                </div>
              </div>
            </div>

            {/* Device Control */}
            <div className='bg-[#ffffff08] backdrop-blur-xl rounded-[24px] p-[30px] border border-[#ffffff15] shadow-xl hover:shadow-2xl transition-all duration-300'>
              <h2 className='text-white text-[24px] font-bold mb-[24px] flex items-center gap-[12px]'>
                <span className='text-[28px]'>📺</span>
                Device Control
              </h2>
              <div className='space-y-[16px]'>
                {/* Scan Button */}
                <div className='p-[20px] bg-[#ffffff08] rounded-[16px]'>
                  <p className='text-white text-[16px] font-semibold mb-[12px]'>Device Discovery</p>
                  <button
                    onClick={handleScanDevices}
                    disabled={scanning}
                    className={`px-[24px] py-[12px] ${scanning ? 'bg-gray-600' : 'bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:shadow-lg'} text-white rounded-full text-[14px] font-medium transition-all duration-300 transform hover:scale-105 shadow-md`}
                  >
                    {scanning ? '🔍 Scanning...' : '🔍 Scan for Devices'}
                  </button>
                </div>

                {/* Available Devices */}
                {devices.length > 0 && (
                  <div className='p-[20px] bg-[#ffffff08] rounded-[16px]'>
                    <p className='text-white text-[16px] font-semibold mb-[12px]'>Available Devices ({devices.length})</p>
                    <div className='space-y-[10px]'>
                      {devices.map((device) => (
                        <div key={device.id} className='flex items-center justify-between p-[16px] bg-[#ffffff10] rounded-[12px] hover:bg-[#ffffff15] transition-all duration-300'>
                          <div>
                            <p className='text-white text-[15px] font-semibold'>{device.name}</p>
                            <p className='text-gray-400 text-[13px] mt-[2px]'>{device.type} • {device.ip}</p>
                          </div>
                          <button
                            onClick={() => handleConnectDevice(device)}
                            className='px-[16px] py-[8px] bg-gradient-to-r from-green-600 to-green-700 hover:shadow-lg text-white rounded-full text-[13px] font-medium transition-all duration-300 transform hover:scale-105'
                          >
                            Connect
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connected Devices */}
                {connectedDevices.length > 0 && (
                  <div className='p-[20px] bg-[#ffffff08] rounded-[16px]'>
                    <p className='text-white text-[16px] font-semibold mb-[12px]'>Connected Devices ({connectedDevices.length})</p>
                    <div className='space-y-[10px]'>
                      {connectedDevices.map((device) => (
                        <div key={device.id} className='flex items-center justify-between p-[16px] bg-gradient-to-r from-green-900/30 to-green-800/30 rounded-[12px] border border-green-500/50 shadow-lg'>
                          <div>
                            <p className='text-white text-[15px] font-semibold flex items-center gap-[10px]'>
                              <span className='w-[10px] h-[10px] bg-green-500 rounded-full animate-pulse shadow-lg'></span>
                              {device.name}
                            </p>
                            <p className='text-gray-300 text-[13px] mt-[2px]'>{device.type} • {device.ip}</p>
                          </div>
                          <button
                            onClick={() => handleDisconnectDevice(device.id)}
                            className='px-[16px] py-[8px] bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg text-white rounded-full text-[13px] font-medium transition-all duration-300 transform hover:scale-105'
                          >
                            Disconnect
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Device Commands Help */}
                <div className='p-[20px] bg-[#ffffff08] rounded-[16px]'>
                  <p className='text-gray-300 text-[14px] leading-relaxed'>
                    <span className='font-semibold text-white block mb-[8px]'>Voice commands for device control:</span>
                    • "Turn on Android TV"<br />
                    • "Play video on Chromecast"<br />
                    • "Control projector"<br />
                    • "Set volume to 50%"
                  </p>
                </div>
              </div>
            </div>

            {/* About */}
            <div className='bg-[#ffffff08] backdrop-blur-xl rounded-[24px] p-[30px] border border-[#ffffff15] shadow-xl hover:shadow-2xl transition-all duration-300'>
              <h2 className='text-white text-[24px] font-bold mb-[16px] flex items-center gap-[12px]'>
                <span className='text-[28px]'>ℹ️</span>
                About
              </h2>
              <p className='text-gray-300 text-[16px] leading-relaxed'>
                <span className='font-semibold text-white block mb-[8px]'>AI-Powered Virtual Assistant v3.0</span>
                Made with ❤️ using React, Gemini AI, and modern web technologies
              </p>
            </div>
          </>
        )}

        {/* Notifications Tab */}
        {activeTab === 'popups' && (
          <div className='bg-[#ffffff08] backdrop-blur-xl rounded-[24px] p-[30px] border border-[#ffffff15] shadow-xl hover:shadow-2xl transition-all duration-300'>
            <h2 className='text-white text-[24px] font-bold mb-[24px] flex items-center gap-[12px]'>
              <span className='text-[28px]'>🔔</span>
              Notification Settings
            </h2>
            <div className='space-y-[16px]'>
              <div className='p-[20px] bg-[#ffffff08] rounded-[16px]'>
                <div className='flex items-center justify-between mb-[12px]'>
                  <div>
                    <p className='text-white text-[16px] font-semibold'>Show Notifications</p>
                    <p className='text-gray-400 text-[14px] mt-[4px]'>Display toast notifications for actions</p>
                  </div>
                  <div className='w-[52px] h-[28px] bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full relative cursor-pointer shadow-lg'>
                    <div className='absolute right-[3px] top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-md'></div>
                  </div>
                </div>
              </div>

              <div className='p-[20px] bg-[#ffffff08] rounded-[16px]'>
                <p className='text-white text-[16px] font-semibold mb-[12px]'>Notification Position</p>
                <p className='text-gray-400 text-[14px]'>
                  Notifications appear in the <span className='text-[#667eea] font-semibold'>top-right corner</span> of the screen
                </p>
              </div>

              <div className='p-[20px] bg-[#ffffff08] rounded-[16px]'>
                <p className='text-white text-[16px] font-semibold mb-[12px]'>Notification Limit</p>
                <p className='text-gray-400 text-[14px]'>
                  Only <span className='text-[#667eea] font-semibold'>1 notification</span> is shown at a time. New notifications replace the current one.
                </p>
              </div>

              <div className='p-[20px] bg-[#ffffff08] rounded-[16px]'>
                <p className='text-white text-[16px] font-semibold mb-[12px]'>Duration</p>
                <p className='text-gray-400 text-[14px]'>
                  Notifications auto-dismiss after <span className='text-[#667eea] font-semibold'>3 seconds</span>
                </p>
              </div>
            </div>
            <PopupSettings />
          </div>
        )}

        {/* Conversation History Tab */}
        {activeTab === 'history' && (
          <ConversationHistory />
        )}
      </div>
    </div>
  );
}

export default Settings;
