import React, { useContext, useState } from 'react';
import { userDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import axios from 'axios';
import voicePersonality from '../services/voicePersonality';
import PopupSettings from '../components/PopupSettings';

function Settings() {
  const { userData, serverUrl } = useContext(userDataContext);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [activeTab, setActiveTab] = useState('language'); // 'language', 'devices', 'history', 'popups'
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
      // Mock devices for testing
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
    <div className='w-full min-h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] p-[20px]'>
      {/* Header */}
      <div className='flex items-center justify-between mb-[30px]'>
        <button
          onClick={() => navigate('/home')}
          className='px-[20px] py-[10px] bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition'
        >
          ← Back to Home
        </button>
        <h1 className='text-white text-[28px] font-bold'>Settings</h1>
        <div className='w-[120px]'></div> {/* Spacer for center alignment */}
      </div>

      {/* Tab Navigation */}
      <div className='max-w-[800px] mx-auto mb-[20px] flex gap-[10px] bg-[#ffffff10] backdrop-blur-lg rounded-[20px] p-[10px] border border-[#ffffff20]'>
        <button
          onClick={() => setActiveTab('language')}
          className={`flex-1 px-[20px] py-[12px] rounded-[12px] font-semibold transition ${
            activeTab === 'language'
              ? 'bg-[#009dff] text-white'
              : 'text-white hover:bg-[#ffffff10]'
          }`}
        >
          🌐 Language
        </button>
        <button
          onClick={() => setActiveTab('devices')}
          className={`flex-1 px-[20px] py-[12px] rounded-[12px] font-semibold transition ${
            activeTab === 'devices'
              ? 'bg-[#009dff] text-white'
              : 'text-white hover:bg-[#ffffff10]'
          }`}
        >
          📱 Devices
        </button>
        <button
          onClick={() => setActiveTab('popups')}
          className={`flex-1 px-[20px] py-[12px] rounded-[12px] font-semibold transition ${
            activeTab === 'popups'
              ? 'bg-[#009dff] text-white'
              : 'text-white hover:bg-[#ffffff10]'
          }`}
        >
          🎨 Popups
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-[20px] py-[12px] rounded-[12px] font-semibold transition ${
            activeTab === 'history'
              ? 'bg-[#009dff] text-white'
              : 'text-white hover:bg-[#ffffff10]'
          }`}
        >
          💬 History
        </button>
      </div>

      <div className='max-w-[800px] mx-auto space-y-[20px]'>
        {/* Language Settings Tab */}
        {activeTab === 'language' && (
          <div className='bg-[#ffffff10] backdrop-blur-lg rounded-[20px] p-[25px] border border-[#ffffff20]'>
            <h2 className='text-white text-[22px] font-semibold mb-[20px] flex items-center gap-[10px]'>
              🌐 Language Settings
            </h2>
            <div className='space-y-[15px]'>
            {languages.map((lang) => (
              <div
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`p-[15px] rounded-[12px] cursor-pointer transition border-2 ${
                  selectedLanguage === lang.code
                    ? 'bg-[#009dff40] border-[#009dff]'
                    : 'bg-[#ffffff05] border-transparent hover:bg-[#ffffff10]'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-[15px]'>
                    <span className='text-[28px]'>{lang.flag}</span>
                    <span className='text-white text-[18px] font-medium'>{lang.name}</span>
                  </div>
                  {selectedLanguage === lang.code && (
                    <span className='text-[#009dff] text-[20px]'>✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Voice Settings - Shown in language tab */}
        {activeTab === 'language' && (
        <div className='bg-[#ffffff10] backdrop-blur-lg rounded-[20px] p-[25px] border border-[#ffffff20]'>
          <h2 className='text-white text-[22px] font-semibold mb-[20px] flex items-center gap-[10px]'>
            🎤 Voice Settings
          </h2>
          <div className='space-y-[15px]'>
            <div className='flex items-center justify-between p-[15px] bg-[#ffffff05] rounded-[12px]'>
              <div>
                <p className='text-white text-[16px] font-medium'>Wake Word</p>
                <p className='text-gray-400 text-[14px]'>Say "{userData?.assistantName}" to activate</p>
              </div>
              <span className='text-[#009dff] text-[24px]'>🔊</span>
            </div>
            
            <div className='flex items-center justify-between p-[15px] bg-[#ffffff05] rounded-[12px]'>
              <div>
                <p className='text-white text-[16px] font-medium'>Continuous Listening</p>
                <p className='text-gray-400 text-[14px]'>Always listening for commands</p>
              </div>
              <div className='w-[50px] h-[26px] bg-[#009dff] rounded-full relative cursor-pointer'>
                <div className='absolute right-[3px] top-[3px] w-[20px] h-[20px] bg-white rounded-full'></div>
              </div>
            </div>

            <div className='flex items-center justify-between p-[15px] bg-[#ffffff05] rounded-[12px]'>
              <div>
                <p className='text-white text-[16px] font-medium'>Voice Feedback</p>
                <p className='text-gray-400 text-[14px]'>Spoken responses enabled</p>
              </div>
              <div className='w-[50px] h-[26px] bg-[#009dff] rounded-full relative cursor-pointer'>
                <div className='absolute right-[3px] top-[3px] w-[20px] h-[20px] bg-white rounded-full'></div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Voice Personality Settings */}
        {activeTab === 'language' && (
        <div className='bg-[#ffffff10] backdrop-blur-lg rounded-[20px] p-[25px] border border-[#ffffff20]'>
          <h2 className='text-white text-[22px] font-semibold mb-[20px] flex items-center gap-[10px]'>
            🎭 Voice Personality
          </h2>
          <div className='space-y-[15px]'>
            {voicePersonality.getPersonalityModes().map((mode) => (
              <div
                key={mode.value}
                onClick={() => handlePersonalityChange(mode.value)}
                className={`p-[15px] rounded-[12px] cursor-pointer transition border-2 ${
                  personality === mode.value
                    ? 'bg-[#009dff40] border-[#009dff]'
                    : 'bg-[#ffffff05] border-transparent hover:bg-[#ffffff10]'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-white text-[16px] font-medium'>{mode.label}</p>
                    <p className='text-gray-400 text-[14px]'>{mode.description}</p>
                  </div>
                  {personality === mode.value && (
                    <span className='text-[#009dff] text-[20px]'>✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Devices Tab */}
        {activeTab === 'devices' && (
        <>
        {/* Payment Settings */}
        <div className='bg-[#ffffff10] backdrop-blur-lg rounded-[20px] p-[25px] border border-[#ffffff20]'>
          <h2 className='text-white text-[22px] font-semibold mb-[20px] flex items-center gap-[10px]'>
            💳 Payment Settings
          </h2>
          <div className='space-y-[15px]'>
            <div className='p-[15px] bg-[#ffffff05] rounded-[12px]'>
              <div className='flex items-center gap-[15px] mb-[10px]'>
                <span className='text-[24px]'>📱</span>
                <p className='text-white text-[16px] font-medium'>Default Payment Apps</p>
              </div>
              <div className='flex gap-[10px] flex-wrap'>
                <span className='px-[15px] py-[8px] bg-[#5f259f] text-white rounded-full text-[14px]'>PhonePe</span>
                <span className='px-[15px] py-[8px] bg-[#0d9e4a] text-white rounded-full text-[14px]'>Google Pay</span>
                <span className='px-[15px] py-[8px] bg-[#00baf2] text-white rounded-full text-[14px]'>Paytm</span>
              </div>
            </div>

            <div className='p-[15px] bg-[#ffffff05] rounded-[12px]'>
              <p className='text-gray-400 text-[14px] leading-relaxed'>
                Voice commands for payments:
                <br />• "Pay 500 rupees using PhonePe"
                <br />• "Send 1000 via Google Pay"
                <br />• "Transfer 200 using Paytm"
              </p>
            </div>
          </div>
        </div>

        {/* Device Control */}
        <div className='bg-[#ffffff10] backdrop-blur-lg rounded-[20px] p-[25px] border border-[#ffffff20]'>
          <h2 className='text-white text-[22px] font-semibold mb-[20px] flex items-center gap-[10px]'>
            📺 Device Control
          </h2>
          <div className='space-y-[15px]'>
            {/* Scan Button */}
            <div className='p-[15px] bg-[#ffffff05] rounded-[12px]'>
              <p className='text-white text-[16px] font-medium mb-[10px]'>Device Discovery</p>
              <button 
                onClick={handleScanDevices}
                disabled={scanning}
                className={`px-[15px] py-[8px] ${scanning ? 'bg-gray-500' : 'bg-[#009dff] hover:bg-[#0088dd]'} text-white rounded-full text-[14px] transition`}
              >
                {scanning ? '🔍 Scanning...' : '🔍 Scan for Devices'}
              </button>
            </div>

            {/* Available Devices */}
            {devices.length > 0 && (
              <div className='p-[15px] bg-[#ffffff05] rounded-[12px]'>
                <p className='text-white text-[16px] font-medium mb-[10px]'>Available Devices ({devices.length})</p>
                <div className='space-y-[8px]'>
                  {devices.map((device) => (
                    <div key={device.id} className='flex items-center justify-between p-[10px] bg-[#ffffff08] rounded-[8px]'>
                      <div>
                        <p className='text-white text-[14px] font-medium'>{device.name}</p>
                        <p className='text-gray-400 text-[12px]'>{device.type} • {device.ip}</p>
                      </div>
                      <button
                        onClick={() => handleConnectDevice(device)}
                        className='px-[12px] py-[6px] bg-green-600 hover:bg-green-700 text-white rounded-full text-[12px] transition'
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
              <div className='p-[15px] bg-[#ffffff05] rounded-[12px]'>
                <p className='text-white text-[16px] font-medium mb-[10px]'>Connected Devices ({connectedDevices.length})</p>
                <div className='space-y-[8px]'>
                  {connectedDevices.map((device) => (
                    <div key={device.id} className='flex items-center justify-between p-[10px] bg-green-900 bg-opacity-30 rounded-[8px] border border-green-500'>
                      <div>
                        <p className='text-white text-[14px] font-medium flex items-center gap-[8px]'>
                          <span className='w-[8px] h-[8px] bg-green-500 rounded-full animate-pulse'></span>
                          {device.name}
                        </p>
                        <p className='text-gray-400 text-[12px]'>{device.type} • {device.ip}</p>
                      </div>
                      <button
                        onClick={() => handleDisconnectDevice(device.id)}
                        className='px-[12px] py-[6px] bg-red-600 hover:bg-red-700 text-white rounded-full text-[12px] transition'
                      >
                        Disconnect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Device Commands Help */}
            <div className='p-[15px] bg-[#ffffff05] rounded-[12px]'>
              <p className='text-gray-400 text-[14px] leading-relaxed'>
                Voice commands for device control:
                <br />• "Turn on Android TV"
                <br />• "Play video on Chromecast"
                <br />• "Control projector"
                <br />• "Set volume to 50%"
              </p>
            </div>
          </div>
        </div>

        {/* About */}
        <div className='bg-[#ffffff10] backdrop-blur-lg rounded-[20px] p-[25px] border border-[#ffffff20]'>
          <h2 className='text-white text-[22px] font-semibold mb-[20px] flex items-center gap-[10px]'>
            ℹ️ About
          </h2>
          <p className='text-gray-300 text-[16px]'>
            AI-Powered Virtual Assistant v3.0
            <br />Made with ❤️ using React, Gemini AI, and modern web technologies
          </p>
        </div>
        </>
        )}

        {/* Conversation History Tab */}
        {activeTab === 'history' && (
          <ConversationHistory />
        )}

        {/* Popup Settings Tab */}
        {activeTab === 'popups' && (
          <PopupSettings />
        )}
      </div>
    </div>
  );
}

export default Settings;
