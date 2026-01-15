/**
 * Voice Prompt Component
 * Shows voice instructions at the bottom of modal
 */

import React from 'react';
import { motion } from 'framer-motion';
import useDevicePairingStore from '../../../store/devicePairingStore';
import { getDeviceConfig } from '../../../config/deviceTypeConfig';

const VoicePrompt = ({ screen }) => {
    const { selectedDeviceType, foundDevices } = useDevicePairingStore();
    const deviceConfig = getDeviceConfig(selectedDeviceType);

    const getVoiceInstructions = () => {
        switch (screen) {
            case 'device-type-selector':
                return 'Say the device type or number';

            case 'scanning':
                return 'Say "cancel" to stop scanning';

            case 'device-list':
                return deviceConfig?.voiceInstructions?.deviceList || 'Say device number to connect';

            case 'pairing':
                return 'Connection in progress...';

            case 'error':
            case 'no-devices':
                return 'Say "try again" to retry or "cancel" to close';

            default:
                return 'Say "cancel" to close';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent pt-6 pb-4 px-6"
        >
            <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700">
                {/* Microphone Icon with pulse */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                    className="flex-shrink-0"
                >
                    <svg
                        className="w-5 h-5 text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                            clipRule="evenodd"
                        />
                    </svg>
                </motion.div>

                {/* Instructions Text */}
                <p className="text-sm text-gray-300 font-medium">
                    🎤 {getVoiceInstructions()}
                </p>

                {/* Listening Indicator */}
                <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1 bg-blue-400 rounded-full"
                            animate={{
                                height: ['4px', '12px', '4px']
                            }}
                            transition={{
                                duration: 1,
                                delay: i * 0.2,
                                repeat: Infinity,
                                ease: 'easeInOut'
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default VoicePrompt;
