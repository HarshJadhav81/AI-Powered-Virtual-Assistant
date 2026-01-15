/**
 * Error Screen - Enhanced with Suggestions
 * Shows error message with helpful tips and retry options
 */

import React from 'react';
import { motion } from 'framer-motion';
import useDevicePairingStore from '../../../store/devicePairingStore';

const ErrorScreen = () => {
    const {
        errorMessage,
        errorReason,
        retryPairing,
        backToDeviceList,
        rescan,
        selectedDevice
    } = useDevicePairingStore();

    // Extract suggestion from error message if available
    const suggestion = errorReason || 'Make sure the device is in pairing mode and try again';

    return (
        <div style={{ padding: '0 30px 20px 30px' }}>
            {/* Error Icon */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15
                }}
                className="flex justify-center mb-6"
            >
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(255, 149, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                        <path
                            d="M22 14v12M22 30h.01"
                            stroke="#FF9500"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            </motion.div>

            {/* Error Text */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-6"
            >
                <h2 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#1d1d1f',
                    marginBottom: '8px',
                    letterSpacing: '-0.01em'
                }}>
                    Connection Failed
                </h2>

                {selectedDevice && (
                    <p style={{
                        fontSize: '14px',
                        color: '#1d1d1f',
                        marginBottom: '12px'
                    }}>
                        {selectedDevice.name}
                    </p>
                )}

                <p style={{
                    fontSize: '14px',
                    color: '#86868b',
                    marginBottom: '12px'
                }}>
                    {errorMessage || 'Unable to connect'}
                </p>

                {/* Helpful Suggestion Box */}
                <div style={{
                    background: '#f5f5f7',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginTop: '16px',
                    textAlign: 'center'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <circle cx="9" cy="9" r="8" stroke="#007aff" strokeWidth="1.5" />
                            <path d="M9 5v5M9 12h.01" stroke="#007aff" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <div>
                            <p style={{
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#007aff',
                                marginBottom: '4px'
                            }}>
                                Try this
                            </p>
                            <p style={{
                                fontSize: '13px',
                                color: '#86868b',
                                lineHeight: 1.4
                            }}>
                                {suggestion}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}
            >
                {/* Try Again Button */}
                <button
                    onClick={retryPairing}
                    className="w-full rounded-xl transition-all"
                    style={{
                        padding: '12px 16px',
                        background: '#007aff',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: 500
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#0051d5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#007aff'}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path
                                d="M2 2v4h4M16 16v-4h-4M2.5 9a7 7 0 0 1 13 0M15.5 9a7 7 0 0 1-13 0"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span>Try Again</span>
                    </div>
                </button>

                {/* Back to List Button */}
                <button
                    onClick={backToDeviceList}
                    className="w-full rounded-xl transition-all"
                    style={{
                        padding: '12px 16px',
                        background: '#f5f5f7',
                        color: '#1d1d1f',
                        border: '1px solid #e5e5ea',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: 500
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ebebed';
                        e.currentTarget.style.borderColor = '#d1d1d6';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f5f5f7';
                        e.currentTarget.style.borderColor = '#e5e5ea';
                    }}
                >
                    Back to Device List
                </button>

                {/* Scan Again Link */}
                <button
                    onClick={rescan}
                    className="w-full transition-all"
                    style={{
                        padding: '8px 16px',
                        background: 'transparent',
                        color: '#86868b',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 400
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#1d1d1f'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#86868b'}
                >
                    Scan for Devices Again
                </button>
            </motion.div>
        </div>
    );
};

export default ErrorScreen;
