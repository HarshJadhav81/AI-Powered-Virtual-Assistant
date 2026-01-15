/**
 * Enhanced Pairing Screen - Clean Minimal Style
 */

import React from 'react';
import { motion } from 'framer-motion';
import useDevicePairingStore from '../../../store/devicePairingStore';

const PairingScreen = () => {
    const { selectedDevice, pairingProgress } = useDevicePairingStore();

    const steps = [
        { label: 'Connecting', value: 25 },
        { label: 'Authenticating', value: 50 },
        { label: 'Configuring', value: 75 },
        { label: 'Complete', value: 100 }
    ];

    const currentStep = steps.findIndex(s => s.value > (pairingProgress || 0)) || 0;

    return (
        <div style={{ padding: '0 30px 20px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
            {/* Device Icon with Pulse Animation */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 text-center"
            >
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 16px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 20px rgba(0, 122, 255, 0.3)'
                    }}
                >
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                        <path
                            d="M18 6c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM18 30c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM6 18c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3-3 1.34-3 3zM24 18c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3-3 1.34-3 3z"
                            fill="white"
                            opacity="0.9"
                        />
                        <circle cx="18" cy="18" r="4" fill="white" />
                    </svg>
                </motion.div>

                <p style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1d1d1f',
                    marginBottom: '4px'
                }}>
                    {selectedDevice?.name || 'Device'}
                </p>
                <p style={{
                    fontSize: '13px',
                    color: '#86868b'
                }}>
                    Bluetooth Device
                </p>
            </motion.div>

            {/* Progress Bar */}
            <div style={{ width: '100%', maxWidth: '280px', marginBottom: '20px' }}>
                <div style={{
                    height: '4px',
                    borderRadius: '2px',
                    background: '#f5f5f7',
                    overflow: 'hidden'
                }}>
                    <motion.div
                        style={{
                            height: '100%',
                            borderRadius: '2px',
                            background: 'linear-gradient(90deg, #007aff 0%, #5856d6 100%)'
                        }}
                        initial={{ width: '0%' }}
                        animate={{ width: `${pairingProgress || 0}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>

                {/* Progress Percentage */}
                <motion.p
                    key={pairingProgress}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        textAlign: 'center',
                        fontSize: '12px',
                        color: '#86868b',
                        marginTop: '8px'
                    }}
                >
                    {pairingProgress || 0}%
                </motion.p>
            </div>

            {/* Status Message */}
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ textAlign: 'center' }}
            >
                <p style={{
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#1d1d1f',
                    marginBottom: '6px'
                }}>
                    {steps[currentStep]?.label || 'Connecting'}
                </p>

                {/* Animated Dots */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#007aff'
                            }}
                            animate={{
                                opacity: [0.3, 1, 0.3],
                                scale: [1, 1.3, 1]
                            }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>
            </motion.div>

            {/* Helpful Tip */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                style={{
                    marginTop: '32px',
                    padding: '12px 16px',
                    background: '#f5f5f7',
                    borderRadius: '12px',
                    maxWidth: '280px',
                    width: '100%'
                }}
            >
                <p style={{
                    fontSize: '12px',
                    color: '#86868b',
                    textAlign: 'center',
                    lineHeight: 1.4
                }}>
                    Keep the device nearby during setup
                </p>
            </motion.div>
        </div>
    );
};

export default PairingScreen;
