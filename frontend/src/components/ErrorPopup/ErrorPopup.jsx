/**
 * Enhanced Error Popup Component
 * User-friendly error messages with retry functionality
 */

import React from 'react';
import './ErrorPopup.css';

const ErrorPopup = ({ error, onRetry, onDismiss }) => {
    if (!error) return null;

    const errorMessages = {
        'network': {
            title: 'Connection Lost',
            message: 'Unable to connect to the server. Please check your internet connection.',
            icon: '🌐',
            recoverable: true
        },
        'timeout': {
            title: 'Request Timeout',
            message: 'The request took too long. Please try again.',
            icon: '⏱️',
            recoverable: true
        },
        'auth': {
            title: 'Session Expired',
            message: 'Your session has expired. Please log in again.',
            icon: '🔒',
            recoverable: false
        },
        'validation': {
            title: 'Invalid Input',
            message: 'Please check your command and try again.',
            icon: '⚠️',
            recoverable: true
        },
        'server': {
            title: 'Server Error',
            message: 'Something went wrong on our end. Our team has been notified.',
            icon: '🔧',
            recoverable: true
        },
        'default': {
            title: 'Oops!',
            message: 'Something went wrong. Please try again.',
            icon: '❌',
            recoverable: true
        }
    };

    const errorInfo = errorMessages[error.type] || errorMessages.default;

    return (
        <div className="error-popup-overlay" onClick={onDismiss}>
            <div className="error-popup" onClick={(e) => e.stopPropagation()}>
                <div className="error-icon">{errorInfo.icon}</div>
                <h3 className="error-title">{errorInfo.title}</h3>
                <p className="error-message">{error.message || errorInfo.message}</p>

                <div className="error-actions">
                    {errorInfo.recoverable && onRetry && (
                        <button className="error-btn error-btn-primary" onClick={onRetry}>
                            Retry
                        </button>
                    )}
                    <button className="error-btn error-btn-secondary" onClick={onDismiss}>
                        {errorInfo.recoverable ? 'Cancel' : 'Close'}
                    </button>
                </div>

                {error.details && (
                    <details className="error-details">
                        <summary>Technical Details</summary>
                        <pre>{JSON.stringify(error.details, null, 2)}</pre>
                    </details>
                )}
            </div>
        </div>
    );
};

export default ErrorPopup;
