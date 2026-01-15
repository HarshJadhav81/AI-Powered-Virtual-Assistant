/**
 * Apple-Style Bluetooth Quick Access Button
 * Floating button for easy Bluetooth device pairing
 */

import React from 'react';
import { motion } from 'framer-motion';
import useDevicePairingStore from '../store/devicePairingStore';

const BluetoothButton = () => {
    const { openModal, selectDeviceType, setCurrentScreen } = useDevicePairingStore();

    const handleClick = () => {
        // Same flow as voice assistant
        selectDeviceType('bluetooth');  // Correct function name
        setCurrentScreen('scanning');    // Go to scanning screen
        openModal();                     // Open modal
        // Auto-scan will trigger via DevicePairingModal useEffect
    };

    return (
        <motion.button
            onClick={handleClick}
            className="fixed bottom-6 right-6 z-[999997]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20
            }}
            style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
                border: 'none',
                boxShadow: `
                    0 10px 30px rgba(0, 122, 255, 0.3),
                    0 4px 12px rgba(0, 0, 0, 0.1),
                    0 0 0 1px rgba(255, 255, 255, 0.1) inset
                `,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            {/* Bluetooth Icon */}
            <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11" />
            </svg>

            {/* Pulse ring on hover */}
            <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    border: '2px solid rgba(0, 122, 255, 0.5)'
                }}
                initial={{ scale: 1, opacity: 0 }}
                whileHover={{
                    scale: 1.4,
                    opacity: [0, 0.6, 0],
                    transition: { duration: 1, repeat: Infinity }
                }}
            />

            {/* Tooltip */}
            <motion.div
                className="absolute right-full mr-3 px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none"
                style={{
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    backdropFilter: 'blur(10px)'
                }}
                initial={{ opacity: 0, x: 10 }}
                whileHover={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
            >
                Connect Bluetooth
            </motion.div>
        </motion.button>
    );
};

export default BluetoothButton;
