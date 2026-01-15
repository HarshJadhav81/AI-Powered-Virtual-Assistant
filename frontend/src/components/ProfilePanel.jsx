/**
 * Apple-Style Profile Panel
 * Matching device service styling with clean design
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ProfilePanel = ({ isOpen, onClose, userData, onLogout }) => {
    const navigate = useNavigate();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop - Dark Te al Tint */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[999998]"
                        style={{
                            background: 'rgba(7, 58, 76, 0.8)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)'
                        }}
                    />

                    {/* Main Card Container - Glassmorphic on Dark */}
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        transition={{ type: 'spring', duration: 0.45, bounce: 0 }}
                        className="fixed top-20 right-5 z-[999999] w-[380px]"
                        style={{
                            background: 'rgba(255, 255, 255, 0.12)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '20px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                    >
                        {/* Header with Close Button */}
                        <div style={{
                            padding: '16px 30px 12px 30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12">
                                    <path
                                        d="M1 1L11 11M11 1L1 11"
                                        stroke="#FFFFFF"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* User Profile Header */}
                        <div style={{ padding: '0 30px 16px 30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ position: 'relative' }}>
                                    <div className="w-16 h-16 rounded-full overflow-hidden" style={{
                                        background: 'linear-gradient(135deg, #007aff 0%, #5ac8fa 100%)',
                                        border: '2px solid #ffffff'
                                    }}>
                                        <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-white">
                                            {userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </div>
                                    </div>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-2px',
                                        right: '-2px',
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        background: '#22C55E',
                                        border: '2px solid #ffffff'
                                    }} />
                                </div>
                                <div>
                                    <p style={{
                                        fontSize: '18px',
                                        fontWeight: 600,
                                        color: '#FFFFFF',
                                        lineHeight: 1.2,
                                        marginBottom: '2px'
                                    }}>
                                        {userData.name}
                                    </p>
                                    <p style={{
                                        fontSize: '13px',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontWeight: 400,
                                        lineHeight: 1.2,
                                        marginBottom: '8px'
                                    }}>
                                        {userData.email}
                                    </p>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        background: '#007aff20',
                                        color: '#007aff'
                                    }}>
                                        Pro plan
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{
                            height: '1px',
                            background: '#e5e5ea',
                            margin: '0 30px'
                        }} />

                        {/* Menu Items */}
                        <div style={{ padding: '16px 30px 20px 30px' }}>
                            {/* Upgrade plan */}
                            <motion.button
                                className="w-full rounded-xl transition-all duration-200"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    padding: '10px 14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f5f5f7';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#1d1d1f" strokeWidth="1.5">
                                    <rect x="3" y="3" width="14" height="14" rx="2" />
                                    <path d="M6 8h8M6 11h8M6 14h5" strokeLinecap="round" />
                                </svg>
                                <span className="text-[15px] font-medium" style={{ color: '#1d1d1f' }}>
                                    Upgrade plan
                                </span>
                            </motion.button>

                            {/* Customize (Active/Highlighted) */}
                            <motion.button
                                onClick={() => { navigate('/customize'); onClose(); }}
                                className="w-full rounded-xl"
                                style={{
                                    background: '#f5f5f7',
                                    border: 'none',
                                    padding: '10px 14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginTop: '8px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#e8e8ed'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f7'}
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#1d1d1f" strokeWidth="1.5">
                                    <path d="M3 10h3l2 4 3-8 2 4h4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="text-[15px] font-medium" style={{ color: '#1d1d1f' }}>
                                    Customize
                                </span>
                            </motion.button>

                            <motion.button
                                onClick={() => { navigate('/settings'); onClose(); }}
                                className="w-full rounded-xl transition-all duration-200"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    padding: '10px 14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginTop: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f5f5f7';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#1d1d1f" strokeWidth="1.5">
                                    <circle cx="10" cy="10" r="2.5" />
                                    <path d="M10 2v2m0 12v2M3.3 3.3l1.4 1.4m11.6 11.6l1.4 1.4M2 10h2m12 0h2M3.3 16.7l1.4-1.4m11.6-11.6l1.4-1.4" strokeLinecap="round" />
                                </svg>
                                <span className="text-[15px] font-medium" style={{ color: '#1d1d1f' }}>
                                    Settings
                                </span>
                            </motion.button>

                            {/* Divider */}
                            <div style={{
                                height: '1px',
                                background: '#e5e5ea',
                                margin: '16px 0'
                            }} />

                            {/* Help */}
                            <motion.button
                                className="w-full rounded-xl transition-all duration-200"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    padding: '10px 14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f5f5f7';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#1d1d1f" strokeWidth="1.5">
                                        <circle cx="10" cy="10" r="8" />
                                        <path d="M7.5 7.5a2.5 2.5 0 0 1 5 1.5c0 1.7-2.5 2-2.5 2m0 2.5h.01" strokeLinecap="round" />
                                    </svg>
                                    <span className="text-[15px] font-medium" style={{ color: '#1d1d1f' }}>
                                        Help
                                    </span>
                                </div>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M4.5 3l3 3-3 3" stroke="#86868b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </motion.button>

                            {/* Log out */}
                            <motion.button
                                onClick={() => { onLogout(); onClose(); }}
                                className="w-full rounded-xl transition-all duration-200"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    padding: '10px 14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginTop: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#fee';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#dc2626" strokeWidth="1.5">
                                    <path d="M7 17H4.5a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 4.5 3H7M14 14l4-4-4-4M18 10H7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="text-[15px] font-medium" style={{ color: '#dc2626' }}>
                                    Log out
                                </span>
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ProfilePanel;
