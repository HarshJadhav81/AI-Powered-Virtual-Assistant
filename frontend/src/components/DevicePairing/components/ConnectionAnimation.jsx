/**
 * Connection Animation Component
 * Shows animated connection between devices during pairing
 */

import React from 'react';
import { motion } from 'framer-motion';

const ConnectionAnimation = ({ deviceIcon, color, status }) => {
    const isConnecting = status === 'connecting' || status === 'waiting_approval';

    return (
        <div className="relative w-64 h-32 flex items-center justify-center">
            {/* Device A (Phone/Computer) */}
            <motion.div
                className="absolute left-0 flex flex-col items-center"
                animate={isConnecting ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: `${color}20`, border: `2px solid ${color}40` }}
                >
                    📱
                </div>
                {isConnecting && (
                    <motion.div
                        className="mt-2 w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                )}
            </motion.div>

            {/* Connection Line */}
            <div className="absolute left-20 right-20 top-8 h-0.5 bg-gray-700 overflow-hidden">
                {isConnecting && (
                    <>
                        {/* Animated Dots Going Right */}
                        <motion.div
                            className="absolute top-0 w-full h-full flex justify-around items-center"
                            animate={{ x: ['0%', '100%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        >
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={`right-${i}`}
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </motion.div>

                        {/* Animated Dots Going Left */}
                        <motion.div
                            className="absolute top-0 w-full h-full flex justify-around items-center"
                            animate={{ x: ['100%', '0%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        >
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={`left-${i}`}
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: color, opacity: 0.6 }}
                                />
                            ))}
                        </motion.div>
                    </>
                )}

                {/* Connected Line */}
                {status === 'connected' && (
                    <motion.div
                        className="absolute top-0 left-0 h-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.5 }}
                    />
                )}
            </div>

            {/* Device B (Target Device) */}
            <motion.div
                className="absolute right-0 flex flex-col items-center"
                animate={isConnecting ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            >
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: `${color}20`, border: `2px solid ${color}40` }}
                >
                    {deviceIcon}
                </div>
                {status === 'waiting_approval' && (
                    <motion.div
                        className="mt-2"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                    >
                        <span className="text-yellow-400 text-xs">⏳</span>
                    </motion.div>
                )}
            </motion.div>

            {/* Connection Status Icon */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                {status === 'connecting' && (
                    <motion.div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${color}30` }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full" style={{ borderColor: color }} />
                    </motion.div>
                )}

                {status === 'waiting_approval' && (
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-2xl"
                    >
                        ⏳
                    </motion.div>
                )}

                {status === 'connected' && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="text-2xl"
                    >
                        ✅
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ConnectionAnimation;
