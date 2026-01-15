/**
 * Scanning Animation Component
 * Renders different scanning animations based on device type
 */

import React from 'react';
import { motion } from 'framer-motion';

const ScanningAnimation = ({ deviceType, animationType, color }) => {
    // Render radar pulse animation (for Bluetooth, Mobile)
    if (animationType === 'radar-pulse') {
        return (
            <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Rotating Sweep Line */}
                <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                    <div
                        className="absolute top-0 left-1/2 w-0.5 h-1/2 origin-bottom"
                        style={{
                            background: `linear-gradient(to top, ${color}, transparent)`,
                            filter: 'blur(1px)'
                        }}
                    />
                </motion.div>

                {/* Expanding Circles */}
                {[0, 0.7, 1.4].map((delay, index) => (
                    <motion.div
                        key={index}
                        className="absolute inset-0 rounded-full border-2"
                        style={{ borderColor: `${color}40` }}
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{
                            duration: 2,
                            delay,
                            repeat: Infinity,
                            ease: 'easeOut'
                        }}
                    />
                ))}

                {/* Center Icon */}
                <motion.div
                    className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${color}30` }}
                    animate={{
                        scale: [1, 1.1, 1],
                        boxShadow: [
                            `0 0 20px ${color}40`,
                            `0 0 30px ${color}60`,
                            `0 0 20px ${color}40`
                        ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: color }}
                    />
                </motion.div>
            </div>
        );
    }

    // Render network waves animation (for Android TV, Smart Home)
    if (animationType === 'network-waves') {
        return (
            <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Horizontal Waves */}
                {[0, 0.3, 0.6, 0.9].map((delay, index) => (
                    <motion.div
                        key={index}
                        className="absolute left-0 right-0 h-1 rounded-full"
                        style={{
                            top: `${20 + index * 20}%`,
                            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                            filter: 'blur(2px)'
                        }}
                        initial={{ scaleX: 0, opacity: 0.8 }}
                        animate={{ scaleX: [0, 1, 0], opacity: [0.8, 1, 0.8] }}
                        transition={{
                            duration: 2,
                            delay,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                    />
                ))}

                {/* Network Nodes */}
                {[...Array(6)].map((_, index) => (
                    <motion.div
                        key={`node-${index}`}
                        className="absolute w-3 h-3 rounded-full"
                        style={{
                            backgroundColor: color,
                            left: `${15 + (index % 3) * 35}%`,
                            top: `${25 + Math.floor(index / 3) * 40}%`,
                            boxShadow: `0 0 10px ${color}`
                        }}
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.6, 1, 0.6]
                        }}
                        transition={{
                            duration: 1.5,
                            delay: index * 0.2,
                            repeat: Infinity
                        }}
                    />
                ))}

                {/* Center Device Icon */}
                <div
                    className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}20`, border: `2px solid ${color}40` }}
                >
                    <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-3xl"
                    >
                        📡
                    </motion.div>
                </div>
            </div>
        );
    }

    // Render broadcast waves (for Chromecast)
    if (animationType === 'broadcast-waves') {
        return (
            <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Radiating Arcs */}
                {[0, 0.4, 0.8].map((delay, index) => (
                    <motion.div
                        key={index}
                        className="absolute"
                        style={{
                            width: `${60 + index * 40}px`,
                            height: `${60 + index * 40}px`,
                            border: `3px solid ${color}`,
                            borderRadius: '50%',
                            borderColor: 'transparent',
                            borderTopColor: color,
                            borderRightColor: color,
                            borderStyle: 'solid'
                        }}
                        initial={{ rotate: 0, opacity: 0.8, scale: 0.5 }}
                        animate={{
                            rotate: [0, 180, 360],
                            opacity: [0.8, 0.4, 0],
                            scale: [0.5, 1, 1.5]
                        }}
                        transition={{
                            duration: 3,
                            delay,
                            repeat: Infinity,
                            ease: 'easeOut'
                        }}
                    />
                ))}

                {/* Center Broadcast Icon */}
                <motion.div
                    className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                        backgroundColor: `${color}30`,
                        border: `2px solid ${color}`
                    }}
                    animate={{
                        boxShadow: [
                            `0 0 15px ${color}60`,
                            `0 0 25px ${color}80`,
                            `0 0 15px ${color}60`
                        ]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <svg
                        className="w-8 h-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke={color}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                        />
                    </svg>
                </motion.div>
            </div>
        );
    }

    return null;
};

export default ScanningAnimation;
