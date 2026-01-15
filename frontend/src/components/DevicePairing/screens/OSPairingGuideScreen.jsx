/**
 * OS Pairing Guide Screen
 * Shows step-by-step instructions for pairing in system Bluetooth settings
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import useDevicePairingStore from '../../../store/devicePairingStore';
import osBluetoothHelper from '../../../services/osBluetoothHelper';

const OSPairingGuideScreen = () => {
    const { selectedDevice, closeModal } = useDevicePairingStore();

    const deviceName = selectedDevice?.name || 'your device';
    const guidance = osBluetoothHelper.getVoiceGuidance(deviceName);
    const instructions = osBluetoothHelper.getPairingInstructions(deviceName);

    // Try to open Bluetooth settings automatically
    const handleOpenSettings = () => {
        const result = osBluetoothHelper.openBluetoothSettings();
        if (result.success) {
            console.log('[OS-PAIRING] Opening Bluetooth settings');
        } else {
            console.log('[OS-PAIRING] Cannot open settings automatically');
        }
    };

    useEffect(() => {
        // Auto-attempt to open settings after 2 seconds
        const timer = setTimeout(() => {
            handleOpenSettings();
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
            >
                <motion.div
                    className="text-6xl mb-4"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    ⚙️
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">
                    System Pairing Required
                </h2>
                <p className="text-gray-400 text-sm max-w-md">
                    {deviceName} needs to be paired in your system Bluetooth settings for audio to work
                </p>
            </motion.div>

            {/* Instructions */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-md bg-gray-800/50 rounded-2xl p-6 mb-6"
            >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    How to Pair:
                </h3>

                <div className="space-y-3">
                    {instructions.steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="flex gap-3"
                        >
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold">
                                {index + 1}
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">{step}</p>
                        </motion.div>
                    ))}
                </div>

                {instructions.shortcut && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20"
                    >
                        <p className="text-blue-400 text-xs">
                            💡 <span className="font-semibold">Quick tip:</span> {instructions.shortcut}
                        </p>
                    </motion.div>
                )}
            </motion.div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full max-w-md">
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleOpenSettings}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Open Bluetooth Settings
                    </div>
                </motion.button>

                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={closeModal}
                    className="w-full px-6 py-3 bg-gray-700/50 text-gray-300 font-medium rounded-xl hover:bg-gray-700 transition-all"
                >
                    I'll Do It Later
                </motion.button>
            </div>

            {/* Helper Text */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 text-gray-500 text-xs text-center max-w-sm"
            >
                Once paired in system settings, {deviceName} will work automatically for audio.
                You can then use voice commands to control playback!
            </motion.p>
        </div>
    );
};

export default OSPairingGuideScreen;
