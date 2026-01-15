/**
 * Minimalistic Success Screen - Compact & Clean
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import useDevicePairingStore from '../../../store/devicePairingStore';

const SuccessScreen = () => {
    const { selectedDevice, closeModal } = useDevicePairingStore();

    useEffect(() => {
        const timer = setTimeout(() => closeModal(), 3000);
        return () => clearTimeout(timer);
    }, [closeModal]);

    return (
        <div className="px-6 py-10 flex flex-col items-center justify-center min-h-[400px]">
            {/* Checkmark */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
                className="mb-6"
            >
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, #34c759 0%, #30d158 100%)'
                }}>
                    <motion.svg
                        width="40"
                        height="40"
                        viewBox="0 0 40 40"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3, delay: 0.15 }}
                    >
                        <motion.path
                            d="M12 20L17 25L28 14"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </motion.svg>

                    {/* Pulse */}
                    <motion.div
                        className="absolute w-20 h-20 rounded-full"
                        style={{ border: '2px solid #34c759' }}
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.25, opacity: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                    />
                </div>
            </motion.div>

            {/* Text */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-center"
            >
                <h2 className="text-2xl font-semibold mb-2" style={{
                    color: '#1d1d1f',
                    fontWeight: 600
                }}>
                    Connected
                </h2>
                <p className="text-base mb-1" style={{
                    color: '#1d1d1f',
                    fontWeight: 500
                }}>
                    {selectedDevice?.name || 'Device'}
                </p>
                <p className="text-sm" style={{
                    color: '#86868b'
                }}>
                    Ready to use
                </p>
            </motion.div>

            {/* Confetti */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                        background: ['#007aff', '#5856d6', '#34c759'][i % 3],
                        left: '50%',
                        top: '40%'
                    }}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{
                        scale: [0, 1, 0],
                        x: [(Math.random() - 0.5) * 120],
                        y: [(Math.random() - 0.5) * 120],
                        opacity: [0, 1, 0]
                    }}
                    transition={{ duration: 1, delay: 0.2 + i * 0.02 }}
                />
            ))}
        </div>
    );
};

export default SuccessScreen;
