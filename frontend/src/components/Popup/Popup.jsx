/**
 * Popup Component - Universal animated popup for all features
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePopup } from '../../context/PopupContext';
import './Popup.css';

const Popup = ({ popup }) => {
  const { closePopup, popupSettings } = usePopup();
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (popup.duration > 0) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / popup.duration) * 100);
        setProgress(remaining);

        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [popup.duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => closePopup(popup.id), 300);
  };

  const getIcon = () => {
    if (popup.icon) return popup.icon;

    switch (popup.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📌';
    }
  };

  const getAnimationVariants = () => {
    const animations = {
      slide: {
        initial: { x: popupSettings.position.includes('right') ? 400 : -400, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: popupSettings.position.includes('right') ? 400 : -400, opacity: 0 }
      },
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      },
      bounce: {
        initial: { scale: 0, opacity: 0 },
        animate: { 
          scale: 1, 
          opacity: 1,
          transition: { type: 'spring', stiffness: 500, damping: 15 }
        },
        exit: { scale: 0, opacity: 0 }
      },
      scale: {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.8, opacity: 0 }
      }
    };

    return animations[popupSettings.animation] || animations.slide;
  };

  return (
    <motion.div
      className={`popup popup-${popup.type} popup-${popupSettings.size}`}
      variants={getAnimationVariants()}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      onClick={() => popup.data && console.log('Popup data:', popup.data)}
    >
      {/* Progress bar */}
      {popup.duration > 0 && (
        <div className="popup-progress">
          <motion.div
            className="popup-progress-bar"
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        </div>
      )}

      {/* Close button */}
      {popup.closeable && (
        <button className="popup-close" onClick={handleClose}>
          ×
        </button>
      )}

      <div className="popup-content">
        {/* Icon or Image */}
        <div className="popup-icon">
          {popup.image ? (
            <img src={popup.image} alt={popup.title} className="popup-image" />
          ) : (
            <span className="popup-emoji">{getIcon()}</span>
          )}
        </div>

        {/* Text content */}
        <div className="popup-text">
          {popup.title && <h4 className="popup-title">{popup.title}</h4>}
          {popup.message && <p className="popup-message">{popup.message}</p>}
        </div>
      </div>

      {/* Action button (if needed) */}
      {popup.action && (
        <div className="popup-action">
          <button 
            className="popup-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              // Handle action based on type
              if (popup.action === 'youtube' && popup.data?.url) {
                window.open(popup.data.url, '_blank');
              } else if (popup.action === 'music' && popup.data?.url) {
                window.open(popup.data.url, '_blank');
              }
            }}
          >
            View Details
          </button>
        </div>
      )}
    </motion.div>
  );
};

const PopupContainer = () => {
  const { popups, popupSettings } = usePopup();

  const getPositionClass = () => {
    return `popup-container-${popupSettings.position}`;
  };

  return (
    <div className={`popup-container ${getPositionClass()}`}>
      <AnimatePresence mode="sync">
        {popups.map((popup) => (
          <Popup key={popup.id} popup={popup} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default PopupContainer;
