/**
 * Progress Steps Component
 * Shows step-by-step pairing progress
 */

import React from 'react';
import { motion } from 'framer-motion';

const ProgressSteps = ({ steps, currentStep, color }) => {
    return (
        <div className="space-y-3">
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isPending = index > currentStep;

                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3"
                    >
                        {/* Step Icon */}
                        <div className="flex-shrink-0">
                            {isCompleted && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: color }}
                                >
                                    <svg
                                        className="w-5 h-5 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </motion.div>
                            )}

                            {isCurrent && (
                                <motion.div
                                    className="w-8 h-8 rounded-full flex items-center justify-center relative"
                                    style={{ backgroundColor: `${color}30`, border: `2px solid ${color}` }}
                                >
                                    <motion.div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: color }}
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            opacity: [1, 0.8, 1]
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity
                                        }}
                                    />

                                    {/* Spinning Ring */}
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-transparent"
                                        style={{ borderTopColor: color, borderRightColor: color }}
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: 'linear'
                                        }}
                                    />
                                </motion.div>
                            )}

                            {isPending && (
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: '#374151' }}
                                >
                                    <div className="w-2 h-2 rounded-full bg-gray-600" />
                                </div>
                            )}
                        </div>

                        {/* Step Text */}
                        <div className="flex-1">
                            <p
                                className={`text-sm font-medium transition-colors duration-200 ${isCompleted || isCurrent ? 'text-white' : 'text-gray-500'
                                    }`}
                            >
                                {step}
                            </p>
                        </div>

                        {/* Step Number */}
                        <div className="flex-shrink-0">
                            <span className="text-xs text-gray-600 font-medium">
                                Step {index + 1}
                            </span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default ProgressSteps;
