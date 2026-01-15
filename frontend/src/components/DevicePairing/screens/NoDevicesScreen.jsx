/**
 * No Devices Screen
 * Shows when no devices are found during scan
 */

import React from 'react';
import { motion } from 'framer-motion';
import useDevicePairingStore from '../../../store/devicePairingStore';
import { getDeviceConfig } from '../../../config/deviceTypeConfig';

const NoDevicesScreen = () => {
    const {
        selectedDeviceType,
        rescan,
        closeModal
    } = useDevicePairingStore();

    const deviceConfig = getDeviceConfig(selectedDeviceType);

    if (!deviceConfig) {
        return null;
    }

    return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
            {/* Empty Icon */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: 'spring',
                    stiffness: 150,
                    damping: 12
                }}
                className="mb-6"
            >
                <div className="text-6xl opacity-50 grayscale">
                    {deviceConfig.icon}
                </div>
            </motion.div>

            {/* Message */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-8"
            >
                <h2 className="text-2xl font-bold text-white mb-3">
                    No Devices Found
                </h2>
                <p className="text-gray-400 mb-4">
                    {deviceConfig.errorMessages.not_found}
                </p>

                {/* Suggestions */}
                <div className="text-left bg-gray-800/50 rounded-xl p-4 max-w-sm mx-auto">
                    <p className="text-sm text-gray-400 mb-2 font-medium">Try these steps:</p>
                    <ul className="space-y-2 text-sm text-gray-500">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>Move closer to the device</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>Make sure the device is turned on</span>
                        </li>
                        {selectedDeviceType === 'bluetooth' && (
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">•</span>
                                <span>Enable pairing mode on device</span>
                            </li>
                        )}
                        {selectedDeviceType === 'android-tv' && (
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">•</span>
                                <span>Check if on same Wi-Fi network</span>
                            </li>
                        )}
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>Wait a few seconds and try again</span>
                        </li>
                    </ul>
                </div>
            </motion.div>

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-sm space-y-3"
            >
                {/* Try Again Button */}
                <button
                    onClick={rescan}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    Scan Again
                </button>

                {/* Cancel Button */}
                <button
                    onClick={closeModal}
                    className="w-full py-3 text-gray-400 hover:text-white transition-colors duration-200"
                >
                    Cancel
                </button>
            </motion.div>
        </div>
    );
};

export default NoDevicesScreen;
