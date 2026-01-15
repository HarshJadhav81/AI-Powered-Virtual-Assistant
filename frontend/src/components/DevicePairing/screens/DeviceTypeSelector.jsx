/**
 * Device Type Selector Screen - Enhanced Clean Style
 * Allows user to select which type of device to scan for
 */

import React from 'react';
import { motion } from 'framer-motion';
import useDevicePairingStore from '../../../store/devicePairingStore';
import { getAllDeviceTypes } from '../../../config/deviceTypeConfig';

const DeviceTypeSelector = () => {
    const { selectDeviceType } = useDevicePairingStore();
    const deviceTypes = getAllDeviceTypes();

    const handleDeviceTypeClick = (deviceType) => {
        selectDeviceType(deviceType.id);
    };

    return (
        <div style={{ padding: '0 30px 20px 30px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#1d1d1f',
                    marginBottom: '6px',
                    letterSpacing: '-0.01em'
                }}>
                    Select Device Type
                </h2>
                <p style={{
                    fontSize: '14px',
                    color: '#86868b'
                }}>
                    Choose what you want to connect
                </p>
            </div>

            {/* Device Type Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {deviceTypes.map((deviceType, index) => (
                    <motion.button
                        key={deviceType.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        onClick={() => handleDeviceTypeClick(deviceType)}
                        className="w-full rounded-xl transition-all"
                        style={{
                            background: '#f5f5f7',
                            border: '1px solid #e5e5ea',
                            padding: '14px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ebebed';
                            e.currentTarget.style.borderColor = '#d1d1d6';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f5f5f7';
                            e.currentTarget.style.borderColor = '#e5e5ea';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        {/* Device Icon with Gradient Background */}
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: deviceType.gradient || 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            flexShrink: 0,
                            boxShadow: `0 4px 12px ${deviceType.color}30`
                        }}>
                            {deviceType.icon}
                        </div>

                        {/* Device Name */}
                        <div style={{ flex: 1, textAlign: 'left' }}>
                            <h3 style={{
                                fontSize: '16px',
                                fontWeight: 500,
                                color: '#1d1d1f',
                                marginBottom: '2px'
                            }}>
                                {deviceType.name}
                            </h3>
                            <p style={{
                                fontSize: '13px',
                                color: '#86868b'
                            }}>
                                {deviceType.description || 'Tap to scan'}
                            </p>
                        </div>

                        {/* Arrow Icon */}
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            style={{ flexShrink: 0 }}
                        >
                            <path
                                d="M7 4l6 6-6 6"
                                stroke="#86868b"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </motion.button>
                ))}
            </div>

            {/* Helpful Tip */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                    marginTop: '24px',
                    padding: '12px 16px',
                    background: '#f5f5f7',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}
            >
                <p style={{
                    fontSize: '12px',
                    color: '#86868b',
                    lineHeight: 1.4
                }}>
                    Make sure your device is in pairing mode
                </p>
            </motion.div>
        </div>
    );
};

export default DeviceTypeSelector;
