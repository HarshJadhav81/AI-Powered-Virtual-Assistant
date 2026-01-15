/**
 * Minimalistic Scanning Screen - Compact & Clean
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useDevicePairingStore from '../../../store/devicePairingStore';
import useVoiceDeviceControl from '../../../hooks/useVoiceDeviceControl';
import earbudImage from '../../../assets/Earbud.png';
import tvImage from '../../../assets/TV.png';

const ScanningScreen = ({ onScanClick }) => {
    const { selectedDeviceType, foundDevices, isScanning } = useDevicePairingStore();
    const { scanForDevices } = useVoiceDeviceControl();
    const [hasClickedScan, setHasClickedScan] = useState(false);
    const [scanTriggered, setScanTriggered] = useState(false);

    // Auto-trigger scan when component mounts (for Chromecast and others)
    useEffect(() => {
        if (!scanTriggered && isScanning) {
            console.log('[SCANNING-SCREEN] Auto-triggering scan for:', selectedDeviceType);
            setScanTriggered(true);
            scanForDevices(selectedDeviceType);
        }
    }, [scanTriggered, isScanning, selectedDeviceType, scanForDevices]);

    const handleScanClick = () => {
        setHasClickedScan(true);
        if (onScanClick) onScanClick();
    };

    const needsUserGesture = [].includes(selectedDeviceType); // Removed chromecast - auto-scan now
    const showScanButton = needsUserGesture && !hasClickedScan;
    const showAnimation = isScanning && foundDevices.length === 0;

    // Select image based on device type (Chromecast and Android TV both show TV)
    const deviceImage = (selectedDeviceType === 'android-tv' || selectedDeviceType === 'chromecast') ? tvImage : earbudImage;
    const deviceName = (selectedDeviceType === 'android-tv' || selectedDeviceType === 'chromecast') ? 'TV' : 'Earbud';

    return (
        <div className="relative px-6 py-10 flex flex-col items-center justify-center min-h-[400px]">
            {showAnimation ? (
                <motion.div
                    key={selectedDeviceType}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center"
                >
                    {/* Floating Device Image */}
                    <motion.img
                        src={deviceImage}
                        alt={`Scanning ${deviceName}`}
                        className="w-48 h-48 object-contain"
                        animate={{
                            y: [-10, 10, -10],
                            rotate: [-1.5, 1.5, -1.5]
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                        style={{
                            filter: 'drop-shadow(0 15px 30px rgba(0, 0, 0, 0.12))'
                        }}
                    />

                    {/* Text */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-center mt-6"
                    >
                        <h2 className="text-2xl font-semibold mb-2" style={{
                            color: '#1d1d1f',
                            fontWeight: 600
                        }}>
                            Searching...
                        </h2>
                        <p className="text-sm" style={{ color: '#86868b' }}>
                            Looking for devices
                        </p>

                        {/* Dots */}
                        <div className="flex items-center justify-center gap-1.5 mt-3">
                            {[...Array(3)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ background: '#86868b' }}
                                    animate={{
                                        opacity: [0.3, 1, 0.3],
                                        scale: [1, 1.2, 1]
                                    }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        delay: i * 0.15
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>

                    {/* Pulse ring */}
                    <motion.div
                        className="absolute w-64 h-64 rounded-full pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)'
                        }}
                        animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.4, 0.15, 0.4]
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity
                        }}
                    />
                </motion.div>
            ) : showScanButton ? (
                <motion.div key="button" className="text-center">
                    <div className="mb-6 text-6xl">🎧</div>
                    <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1d1d1f' }}>
                        Ready to Connect
                    </h2>
                    <p className="text-sm mb-8" style={{ color: '#86868b' }}>
                        Find devices nearby
                    </p>
                    <button
                        onClick={handleScanClick}
                        className="px-6 py-2.5 rounded-full text-sm font-medium transition-all"
                        style={{
                            background: '#0071e3',
                            color: '#fff',
                            border: 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#0077ed'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#0071e3'}
                    >
                        Start Scanning
                    </button>
                </motion.div>
            ) : (
                <motion.div key="prep" className="text-center">
                    <div className="mb-4 text-6xl">🎧</div>
                    <h2 className="text-2xl font-semibold" style={{ color: '#1d1d1f' }}>
                        Preparing...
                    </h2>
                </motion.div>
            )}
        </div>
    );
};

export default ScanningScreen;
