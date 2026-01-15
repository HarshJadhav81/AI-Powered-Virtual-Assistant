/**
 * Apple-Style Device List – Compact & Readable with Scan Button
 */

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import useDevicePairingStore from '../../../store/devicePairingStore';
import useVoiceDeviceControl from '../../../hooks/useVoiceDeviceControl';

const DeviceListScreen = () => {
    const { foundDevices, selectDevice, isScanning, selectedDeviceType } = useDevicePairingStore();
    const { scanForDevices } = useVoiceDeviceControl();
    const scanTimerRef = useRef(null);

    const myDevices = foundDevices.filter(d => d.paired || d.connected);
    const nearbyDevices = foundDevices.filter(d => !d.paired && !d.connected);

    // Handle 10-second auto-stop scanning
    useEffect(() => {
        if (isScanning) {
            // Clear any existing timer
            if (scanTimerRef.current) {
                clearTimeout(scanTimerRef.current);
            }

            // Set 10-second timer to auto-stop
            scanTimerRef.current = setTimeout(() => {
                console.log('[DEVICE-LIST] 10-second scan complete, auto-stopping');
                // The scanning will auto-stop from the store after devices are found
            }, 10000);
        }

        return () => {
            if (scanTimerRef.current) {
                clearTimeout(scanTimerRef.current);
            }
        };
    }, [isScanning]);

    // Handle scan button click
    const handleScanClick = async () => {
        console.log('[DEVICE-LIST] Scan button clicked');

        const deviceType = selectedDeviceType || 'bluetooth';
        console.log(`[DEVICE-LIST] Triggering scan for: ${deviceType}`);

        // Show scanning screen with animation
        const { setCurrentScreen, startScanning } = useDevicePairingStore.getState();
        setCurrentScreen('scanning');
        startScanning(deviceType);

        try {
            // Scan for devices - the hook handles all timing and navigation
            await scanForDevices(deviceType);
            console.log('[DEVICE-LIST] Scan complete');

        } catch (error) {
            console.error('[DEVICE-LIST] ❌ Scan error:', error);
            // Hook handles error navigation
        }
    };

    return (
        <div style={{ padding: '0 30px 20px 30px' }}>
            {/* My Devices */}
            <div>
                <h3 style={{
                    color: '#1d1d1f',
                    letterSpacing: '-0.01em',
                    fontSize: '16px',
                    fontWeight: 600,
                    marginBottom: '10px'
                }}>
                    My Devices
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {myDevices.map((device, index) => (
                        <motion.button
                            key={device.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                            onClick={() => selectDevice(device)}
                            className="w-full rounded-xl text-left"
                            style={{
                                background: '#f5f5f7',
                                border: 'none',
                                padding: '10px 14px',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#ebebed'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f7'}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Headphone Emoji */}
                                    <div style={{
                                        fontSize: '28px',
                                        lineHeight: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        🎧
                                    </div>

                                    <div>
                                        <p style={{
                                            fontSize: '15px',
                                            fontWeight: 500,
                                            color: '#1d1d1f',
                                            marginBottom: '2px',
                                            lineHeight: 1.2
                                        }}>
                                            {device.name}
                                        </p>
                                        <p style={{
                                            fontSize: '12px',
                                            color: '#86868b',
                                            lineHeight: 1.2
                                        }}>
                                            {device.connected ? 'Connected' : 'Not Connected'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Nearby Devices */}
            <div style={{ marginTop: '24px' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#1d1d1f',
                        letterSpacing: '-0.01em'
                    }}>
                        Nearby Devices
                    </h3>

                    {/* Scan Button - Minimal Icon Style */}
                    <button
                        onClick={handleScanClick}
                        disabled={isScanning}
                        className="rounded-full transition-all"
                        style={{
                            width: '32px',
                            height: '32px',
                            background: isScanning ? '#f5f5f7' : '#f5f5f7',
                            border: '1px solid #e5e5ea',
                            cursor: isScanning ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0
                        }}
                        onMouseEnter={(e) => {
                            if (!isScanning) {
                                e.currentTarget.style.background = '#ebebed';
                                e.currentTarget.style.borderColor = '#d1d1d6';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f5f5f7';
                            e.currentTarget.style.borderColor = '#e5e5ea';
                        }}
                    >
                        {isScanning ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="8" r="6" stroke="#86868b" strokeWidth="1.5" />
                                    <path d="M8 2a6 6 0 0 1 6 6" stroke="#1d1d1f" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </motion.div>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="6.5" stroke="#1d1d1f" strokeWidth="1.5" />
                                <circle cx="8" cy="8" r="2" fill="#1d1d1f" />
                                <path d="M8 3v2M8 11v2M3 8h2M11 8h2" stroke="#1d1d1f" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Device List or Searching State */}
                {nearbyDevices.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {nearbyDevices.map((device, index) => (
                            <motion.button
                                key={device.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                onClick={() => selectDevice(device)}
                                className="w-full rounded-xl text-left"
                                style={{
                                    background: '#f5f5f7',
                                    border: 'none',
                                    padding: '10px 14px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#ebebed'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f7'}
                            >
                                <div className="flex items-center gap-3">
                                    <div style={{
                                        fontSize: '24px',
                                        lineHeight: 1
                                    }}>
                                        📱
                                    </div>
                                    <div>
                                        <p style={{
                                            fontSize: '15px',
                                            fontWeight: 500,
                                            color: '#1d1d1f',
                                            lineHeight: 1.2
                                        }}>
                                            {device.name}
                                        </p>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl" style={{
                        background: '#f5f5f7',
                        padding: '28px 16px',
                        textAlign: 'center'
                    }}>
                        <p style={{
                            fontSize: '13px',
                            color: '#86868b',
                            fontWeight: 400
                        }}>
                            {isScanning ? 'Searching...' : 'No new devices scanned'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeviceListScreen;
