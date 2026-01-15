/**
 * Device Card Component
 * Individual device item in the list
 */

import React from 'react';
import { motion } from 'framer-motion';

const DeviceCard = ({ device, index, deviceConfig, onClick }) => {
    const getDeviceIcon = (device) => {
        // Return appropriate icon based on device type/name
        if (device.icon) return device.icon;
        if (device.name?.toLowerCase().includes('airpods')) return '🎧';
        if (device.name?.toLowerCase().includes('tv')) return '📺';
        if (device.name?.toLowerCase().includes('speaker')) return '🔊';
        if (device.name?.toLowerCase().includes('phone')) return '📱';
        if (device.name?.toLowerCase().includes('headphone')) return '🎧';
        return deviceConfig?.icon || '📱';
    };

    const getStatusBadge = () => {
        if (device.connected) {
            return (
                <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                    Connected
                </span>
            );
        }
        if (device.paired) {
            return (
                <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                    Paired
                </span>
            );
        }
        return (
            <span className="px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs font-medium">
                Available
            </span>
        );
    };

    return (
        <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={onClick}
            disabled={device.connected}
            className="w-full group relative overflow-hidden rounded-xl bg-gray-800/80 hover:bg-gray-700/80 disabled:bg-gray-800/50 disabled:cursor-not-allowed transition-all duration-200 p-4"
        >
            <div className="flex items-center gap-4">
                {/* Number Badge */}
                <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: deviceConfig?.color || '#666' }}
                >
                    {index}
                </div>

                {/* Device Icon */}
                <div className="text-3xl flex-shrink-0">
                    {getDeviceIcon(device)}
                </div>

                {/* Device Info */}
                <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium truncate">
                            {device.name || 'Unknown Device'}
                        </h3>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                        {/* Battery Level */}
                        {device.battery && (
                            <div className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" />
                                    <path d="M6 7h8v6H6z" />
                                </svg>
                                <span>{device.battery}%</span>
                            </div>
                        )}

                        {/* Signal Strength */}
                        {device.signalStrength && (
                            <div className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                </svg>
                                <span>{device.signalStrength}%</span>
                            </div>
                        )}

                        {/* Last Seen */}
                        {device.lastSeen && (
                            <span>• {device.lastSeen}</span>
                        )}

                        {/* Device Type */}
                        {device.type && (
                            <span>• {device.type}</span>
                        )}
                    </div>
                </div>

                {/* Status Badge & Arrow */}
                <div className="flex items-center gap-3">
                    {getStatusBadge()}

                    {!device.connected && (
                        <svg
                            className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    )}
                </div>
            </div>

            {/* Hover Glow Effect */}
            {!device.connected && (
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none"
                    style={{ background: deviceConfig?.gradient || 'linear-gradient(135deg, #666 0%, #999 100%)' }}
                />
            )}
        </motion.button>
    );
};

export default DeviceCard;
