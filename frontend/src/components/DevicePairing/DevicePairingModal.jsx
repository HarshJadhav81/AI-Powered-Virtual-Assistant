/**
 * Apple.com-Style Device Pairing Modal – STRUCTURALLY FIXED
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useDevicePairingStore from '../../store/devicePairingStore';
import useVoiceDeviceControl from '../../hooks/useVoiceDeviceControl';

// Screens
import DeviceTypeSelector from './screens/DeviceTypeSelector';
import ScanningScreen from './screens/ScanningScreen';
import DeviceListScreen from './screens/DeviceListScreen';
import PairingScreen from './screens/PairingScreen';
import SuccessScreen from './screens/SuccessScreen';
import ErrorScreen from './screens/ErrorScreen';
import NoDevicesScreen from './screens/NoDevicesScreen';
import OSPairingGuideScreen from './screens/OSPairingGuideScreen';

const DevicePairingModal = () => {
    const {
        isModalOpen,
        currentScreen,
        closeModal,
        selectedDeviceType,
        selectedDevice
    } = useDevicePairingStore();

    const { scanForDevices, pairWithDevice } = useVoiceDeviceControl();

    const handleScanClick = () => {
        if (selectedDeviceType) {
            scanForDevices(selectedDeviceType);
        }
    };

    useEffect(() => {
        if (selectedDeviceType === 'bluetooth' && currentScreen === 'scanning') {
            handleScanClick();
        }
    }, [selectedDeviceType, currentScreen]);

    useEffect(() => {
        if (selectedDevice && selectedDeviceType && currentScreen === 'pairing') {
            pairWithDevice(selectedDevice, selectedDeviceType);
        }
    }, [selectedDevice, selectedDeviceType, currentScreen]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isModalOpen) closeModal();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isModalOpen, closeModal]);

    const renderScreen = () => {
        switch (currentScreen) {
            case 'device-type-selector': return <DeviceTypeSelector />;
            case 'scanning': return <ScanningScreen onScanClick={handleScanClick} />;
            case 'device-list': return <DeviceListScreen />;
            case 'pairing': return <PairingScreen />;
            case 'success': return <SuccessScreen />;
            case 'error': return <ErrorScreen />;
            case 'no-devices': return <NoDevicesScreen />;
            case 'os-pairing-guide': return <OSPairingGuideScreen />;
            default: return <DeviceTypeSelector />;
        }
    };

    return (
        <AnimatePresence mode="wait">
            {isModalOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999998] flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <div
                        onClick={closeModal}
                        className="absolute inset-0"
                        style={{
                            background: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)'
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        transition={{ type: 'spring', duration: 0.45, bounce: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative z-[999999] w-full max-w-[420px] overflow-hidden"
                        style={{
                            background: '#ffffff',
                            borderRadius: '16px',
                            boxShadow: '0 20px 40px -12px rgba(0,0,0,0.2)',
                        }}
                    >
                        {/* HEADER (CRITICAL FIX) */}
                        <div className="flex items-center justify-between px-4 pt-4 pb-2">
                            <div className="w-8" />

                            <button
                                onClick={closeModal}
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                style={{
                                    background: '#f5f5f7',
                                    margin: '8px 8px 8px 8px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#e8e8ed'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f7'}
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12">
                                    <path
                                        d="M1 1L11 11M11 1L1 11"
                                        stroke="#1d1d1f"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className="px-4 pb-0 ">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentScreen}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    {renderScreen()}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DevicePairingModal;
