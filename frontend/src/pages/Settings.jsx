import React, { useContext, useState } from 'react';
import { motion } from 'framer-motion';
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

  // Animation variants for smooth Apple-style transitions
  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    })
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#f5f5f7',
        padding: '20px'
      }}
    >
      {/* Header - Clean Apple Style */}
      <div style={{ maxWidth: '900px', margin: '0 auto 24px auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px 30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
          border: '1px solid #e5e5ea'
        }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              padding: '8px 16px',
              background: '#f5f5f7',
              color: '#1d1d1f',
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#ebebed'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f7'}
          >
            <span>←</span> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>⚙️</span>
            <h1 style={{ color: '#1d1d1f', fontSize: '28px', fontWeight: 700, margin: 0 }}>Settings</h1>
          </div>
          <div style={{ width: '80px' }}></div>
        </div>
      </div>

      {/* Tab Navigation - Apple Style */}
      <div style={{ maxWidth: '900px', margin: '0 auto 24px auto' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '6px',
          border: '1px solid #e5e5ea',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)'
        }}>
          {[
            { id: 'language', icon: '🌐', label: 'Language & Voice' },
            { id: 'devices', icon: '📱', label: 'Devices' },
            { id: 'popups', icon: '🔔', label: 'Notifications' },
            { id: 'history', icon: '💬', label: 'History' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab.id ? '#f5f5f7' : 'transparent',
                color: activeTab === tab.id ? '#1d1d1f' : '#86868b'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.background = '#fafafa';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '18px' }}>{tab.icon}</span>
              <span className='hidden md:inline'>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Language & Voice Settings Tab */}
        {activeTab === 'language' && (
          <>
            {/* Language Settings */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '0 30px 20px 30px',
              border: '1px solid #e5e5ea',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{
                color: '#1d1d1f',
                fontSize: '20px',
                fontWeight: 600,
                padding: '20px 0 16px 0',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>🌐</span>
                Language Settings
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-[12px]'>
                {languages.map((lang, index) => (
                  <motion.div
                    key={lang.code}
                    custom={index}
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLanguageChange(lang.code)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: selectedLanguage === lang.code ? '2px solid #007aff' : '1px solid #e5e5ea',
                      background: selectedLanguage === lang.code ? '#f0f7ff' : '#f5f5f7',
                      boxShadow: selectedLanguage === lang.code ? '0 4px 12px rgba(0,122,255,0.15)' : '0 1px 3px rgba(0,0,0,0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
                      <span style={{ fontSize: '36px' }}>{lang.flag}</span>
                      <span style={{ color: '#1d1d1f', fontSize: '15px', fontWeight: 600 }}>{lang.name}</span>
                      {selectedLanguage === lang.code && (
                        <span style={{ color: '#007aff', fontSize: '20px' }}>✓</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Voice Settings */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '0 30px 20px 30px',
              border: '1px solid #e5e5ea',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{
                color: '#1d1d1f',
                fontSize: '20px',
                fontWeight: 600,
                padding: '20px 0 16px 0',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>🎤</span>
                Voice Settings
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: '#f5f5f7',
                  borderRadius: '12px',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#ebebed'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f7'}
                >
                  <div>
                    <p style={{ color: '#1d1d1f', fontSize: '15px', fontWeight: 600, margin: 0 }}>Wake Word</p>
                    <p style={{ color: '#86868b', fontSize: '13px', marginTop: '3px' }}>Say "{userData?.assistantName}" to activate</p>
                  </div>
                  <span style={{ fontSize: '24px' }}>🔊</span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: '#f5f5f7',
                  borderRadius: '12px',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#ebebed'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f7'}
                >
                  <div>
                    <p style={{ color: '#1d1d1f', fontSize: '15px', fontWeight: 600, margin: 0 }}>Continuous Listening</p>
                    <p style={{ color: '#86868b', fontSize: '13px', marginTop: '3px' }}>Always listening for commands</p>
                  </div>
                  <div style={{ width: '51px', height: '31px', background: '#34c759', borderRadius: '16px', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', right: '2px', top: '2px', width: '27px', height: '27px', background: '#ffffff', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}></div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: '#f5f5f7',
                  borderRadius: '12px',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#ebebed'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f7'}
                >
                  <div>
                    <p style={{ color: '#1d1d1f', fontSize: '15px', fontWeight: 600, margin: 0 }}>Voice Feedback</p>
                    <p style={{ color: '#86868b', fontSize: '13px', marginTop: '3px' }}>Spoken responses enabled</p>
                  </div>
                  <div style={{ width: '51px', height: '31px', background: '#34c759', borderRadius: '16px', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', right: '2px', top: '2px', width: '27px', height: '27px', background: '#ffffff', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Personality */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '0 30px 20px 30px',
              border: '1px solid #e5e5ea',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{
                color: '#1d1d1f',
                fontSize: '20px',
                fontWeight: 600,
                padding: '20px 0 16px 0',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>🎭</span>
                Voice Personality
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {voicePersonality.getPersonalityModes().map((mode) => (
                  <div
                    key={mode.value}
                    onClick={() => handlePersonalityChange(mode.value)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: personality === mode.value ? '2px solid #007aff' : '1px solid #e5e5ea',
                      background: personality === mode.value ? '#f0f7ff' : '#f5f5f7'
                    }}
                    onMouseEnter={(e) => {
                      if (personality !== mode.value) e.currentTarget.style.background = '#ebebed';
                    }}
                    onMouseLeave={(e) => {
                      if (personality !== mode.value) e.currentTarget.style.background = '#f5f5f7';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ color: '#1d1d1f', fontSize: '15px', fontWeight: 600, margin: 0 }}>{mode.label}</p>
                        <p style={{ color: '#86868b', fontSize: '13px', marginTop: '3px' }}>{mode.description}</p>
                      </div>
                      {personality === mode.value && (
                        <span style={{ color: '#007aff', fontSize: '20px' }}>✓</span>
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
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '0 30px 20px 30px',
              border: '1px solid #e5e5ea',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{
                color: '#1d1d1f',
                fontSize: '20px',
                fontWeight: 600,
                padding: '20px 0 16px 0',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>💳</span>
                Payment Settings
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '16px', background: '#f5f5f7', borderRadius: '12px' }}>
                  <p style={{ color: '#1d1d1f', fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Default Payment Apps</p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #5f259f 0%, #7c3aaf 100%)', color: '#ffffff', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>PhonePe</span>
                    <span style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #0d9e4a 0%, #10b981 100%)', color: '#ffffff', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>Google Pay</span>
                    <span style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #00baf2 0%, #06b6d4 100%)', color: '#ffffff', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>Paytm</span>
                  </div>
                </div>

                <div style={{ padding: '16px', background: '#f5f5f7', borderRadius: '12px' }}>
                  <p style={{ color: '#86868b', fontSize: '13px', lineHeight: '1.6' }}>
                    <span style={{ fontWeight: 600, color: '#1d1d1f', display: 'block', marginBottom: '8px' }}>Voice commands for payments:</span>
                    • "Pay 500 rupees using PhonePe"<br />
                    • "Send 1000 via Google Pay"<br />
                    • "Transfer 200 using Paytm"
                  </p>
                </div>
              </div>
            </div>

            {/* Device Control */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '0 30px 20px 30px',
              border: '1px solid #e5e5ea',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{
                color: '#1d1d1f',
                fontSize: '20px',
                fontWeight: 600,
                padding: '20px 0 16px 0',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>📺</span>
                Device Control
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Scan Button */}
                <div style={{ padding: '16px', background: '#f5f5f7', borderRadius: '12px' }}>
                  <p style={{ color: '#1d1d1f', fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Device Discovery</p>
                  <button
                    onClick={handleScanDevices}
                    disabled={scanning}
                    style={{
                      padding: '10px 20px',
                      background: scanning ? '#86868b' : '#007aff',
                      color: '#ffffff',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: scanning ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!scanning) e.currentTarget.style.background = '#0051d5';
                    }}
                    onMouseLeave={(e) => {
                      if (!scanning) e.currentTarget.style.background = '#007aff';
                    }}
                  >
                    {scanning ? '🔍 Scanning...' : '🔍 Scan for Devices'}
                  </button>
                </div>

                {/* Available Devices */}
                {devices.length > 0 && (
                  <div style={{ padding: '16px', background: '#f5f5f7', borderRadius: '12px' }}>
                    <p style={{ color: '#1d1d1f', fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Available Devices ({devices.length})</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {devices.map((device) => (
                        <div key={device.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          background: '#ffffff',
                          borderRadius: '10px',
                          border: '1px solid #e5e5ea',
                          transition: 'all 0.2s'
                        }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                        >
                          <div>
                            <p style={{ color: '#1d1d1f', fontSize: '15px', fontWeight: 600, margin: 0 }}>{device.name}</p>
                            <p style={{ color: '#86868b', fontSize: '13px', marginTop: '2px' }}>{device.type} • {device.ip}</p>
                          </div>
                          <button
                            onClick={() => handleConnectDevice(device)}
                            style={{
                              padding: '6px 14px',
                              background: '#34c759',
                              color: '#ffffff',
                              borderRadius: '16px',
                              fontSize: '13px',
                              fontWeight: 500,
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#2fb350'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#34c759'}
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
                  <div style={{ padding: '16px', background: '#f5f5f7', borderRadius: '12px' }}>
                    <p style={{ color: '#1d1d1f', fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Connected Devices ({connectedDevices.length})</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {connectedDevices.map((device) => (
                        <div key={device.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          background: '#f0f9ff',
                          borderRadius: '10px',
                          border: '1px solid #34c759'
                        }}>
                          <div>
                            <p style={{ color: '#1d1d1f', fontSize: '15px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '8px', height: '8px', background: '#34c759', borderRadius: '50%', display: 'inline-block' }} className='animate-pulse'></span>
                              {device.name}
                            </p>
                            <p style={{ color: '#86868b', fontSize: '13px', marginTop: '2px' }}>{device.type} • {device.ip}</p>
                          </div>
                          <button
                            onClick={() => handleDisconnectDevice(device.id)}
                            style={{
                              padding: '6px 14px',
                              background: '#ff3b30',
                              color: '#ffffff',
                              borderRadius: '16px',
                              fontSize: '13px',
                              fontWeight: 500,
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#e63329'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#ff3b30'}
                          >
                            Disconnect
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Device Commands Help */}
                <div style={{ padding: '16px', background: '#f5f5f7', borderRadius: '12px' }}>
                  <p style={{ color: '#86868b', fontSize: '13px', lineHeight: '1.6' }}>
                    <span style={{ fontWeight: 600, color: '#1d1d1f', display: 'block', marginBottom: '8px' }}>Voice commands for device control:</span>
                    • "Turn on Android TV"<br />
                    • "Play video on Chromecast"<br />
                    • "Control projector"<br />
                    • "Set volume to 50%"
                  </p>
                </div>
              </div>
            </div>

            {/* About */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '0 30px 20px 30px',
              border: '1px solid #e5e5ea',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{
                color: '#1d1d1f',
                fontSize: '20px',
                fontWeight: 600,
                padding: '20px 0 16px 0',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>ℹ️</span>
                About
              </h2>
              <p style={{ color: '#86868b', fontSize: '15px', lineHeight: '1.6' }}>
                <span style={{ fontWeight: 600, color: '#1d1d1f', display: 'block', marginBottom: '8px' }}>AI-Powered Virtual Assistant v3.0</span>
                Made with ❤️ using React, Gemini AI, and modern web technologies
              </p>
            </div>
          </>
        )}

        {/* Notifications Tab */}
        {activeTab === 'popups' && (
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '0 30px 20px 30px',
            border: '1px solid #e5e5ea',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{
              color: '#1d1d1f',
              fontSize: '20px',
              fontWeight: 600,
              padding: '20px 0 16px 0',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '24px' }}>🔔</span>
              Notification Settings
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '16px', background: '#f5f5f7', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: '#1d1d1f', fontSize: '15px', fontWeight: 600, margin: 0 }}>Show Notifications</p>
                    <p style={{ color: '#86868b', fontSize: '13px', marginTop: '3px' }}>Display toast notifications for actions</p>
                  </div>
                  <div style={{ width: '51px', height: '31px', background: '#34c759', borderRadius: '16px', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', right: '2px', top: '2px', width: '27px', height: '27px', background: '#ffffff', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}></div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px', background: '#f5f5f7', borderRadius: '12px' }}>
                <p style={{ color: '#1d1d1f', fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Notification Position</p>
                <p style={{ color: '#86868b', fontSize: '13px' }}>
                  Notifications appear in the <span style={{ color: '#007aff', fontWeight: 600 }}>top-right corner</span> of the screen
                </p>
              </div>

              <div style={{ padding: '16px', background: '#f5f5f7', borderRadius: '12px' }}>
                <p style={{ color: '#1d1d1f', fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Notification Limit</p>
                <p style={{ color: '#86868b', fontSize: '13px' }}>
                  Only <span style={{ color: '#007aff', fontWeight: 600 }}>1 notification</span> is shown at a time. New notifications replace the current one.
                </p>
              </div>

              <div style={{ padding: '16px', background: '#f5f5f7', borderRadius: '12px' }}>
                <p style={{ color: '#1d1d1f', fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Duration</p>
                <p style={{ color: '#86868b', fontSize: '13px' }}>
                  Notifications auto-dismiss after <span style={{ color: '#007aff', fontWeight: 600 }}>3 seconds</span>
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
    </motion.div>
  );
}

export default Settings;
