/**
 * PopupContainer - Universal popup display component
 * Renders all active popups with animations and positioning
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePopup } from '../context/PopupContext';
import './PopupContainer.css';

const PopupContainer = () => {
  const { popups, closePopup, popupSettings } = usePopup();

  // Get animation variants based on settings
  const getAnimationVariants = (position) => {
    const { animation } = popupSettings;

    const variants = {
      slide: {
        initial: { 
          x: position.includes('right') ? 300 : position.includes('left') ? -300 : 0,
          y: position.includes('top') ? -100 : position.includes('bottom') ? 100 : 0,
          opacity: 0,
          scale: 0.9
        },
        animate: { x: 0, y: 0, opacity: 1, scale: 1 },
        exit: { 
          x: position.includes('right') ? 300 : position.includes('left') ? -300 : 0,
          opacity: 0,
          scale: 0.8
        }
      },
      fade: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 }
      },
      bounce: {
        initial: { opacity: 0, y: -50, scale: 0.8 },
        animate: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20
          }
        },
        exit: { opacity: 0, y: 50, scale: 0.8 }
      },
      scale: {
        initial: { opacity: 0, scale: 0 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0 }
      }
    };

    return variants[animation] || variants.slide;
  };

  // Get popup type styling
  const getPopupTypeClass = (type) => {
    const typeClasses = {
      success: 'popup-success',
      error: 'popup-error',
      warning: 'popup-warning',
      info: 'popup-info',
      custom: 'popup-custom'
    };
    return typeClasses[type] || 'popup-info';
  };

  // Get popup size class
  const getSizeClass = () => {
    const sizeClasses = {
      small: 'popup-small',
      medium: 'popup-medium',
      large: 'popup-large'
    };
    return sizeClasses[popupSettings.size] || 'popup-medium';
  };

  // Group popups by position
  const groupedPopups = popups.reduce((acc, popup) => {
    const position = popupSettings.position;
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(popup);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(groupedPopups).map(([position, positionPopups]) => (
        <div key={position} className={`popup-container popup-position-${position}`}>
          <AnimatePresence mode="popLayout">
            {positionPopups.map((popup) => {
              const variants = getAnimationVariants(position);
              
              return (
                <motion.div
                  key={popup.id}
                  className={`popup ${getPopupTypeClass(popup.type)} ${getSizeClass()}`}
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  layout
                >
                  {/* Close button */}
                  {popup.closeable && (
                    <button
                      className="popup-close"
                      onClick={() => closePopup(popup.id)}
                      aria-label="Close popup"
                    >
                      ×
                    </button>
                  )}

                  {/* Icon or Image */}
                  {(popup.icon || popup.image) && (
                    <div className="popup-media">
                      {popup.image ? (
                        <img src={popup.image} alt={popup.title} className="popup-image" />
                      ) : (
                        <span className="popup-icon">{popup.icon}</span>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="popup-content">
                    {popup.title && (
                      <h4 className="popup-title">{popup.title}</h4>
                    )}
                    {popup.message && (
                      <p className="popup-message">{popup.message}</p>
                    )}

                    {/* Additional data display */}
                    {popup.data && typeof popup.data === 'object' && (
                      <div className="popup-data">
                        {Object.entries(popup.data).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="popup-data-item">
                            <span className="popup-data-key">{key}:</span>
                            <span className="popup-data-value">
                              {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  {popup.action && (
                    <button
                      className="popup-action-btn"
                      onClick={() => {
                        if (typeof popup.action === 'function') {
                          popup.action();
                        }
                        closePopup(popup.id);
                      }}
                    >
                      View Details
                    </button>
                  )}

                  {/* Progress bar for timed popups */}
                  {popup.duration > 0 && (
                    <motion.div
                      className="popup-progress"
                      initial={{ scaleX: 1 }}
                      animate={{ scaleX: 0 }}
                      transition={{ duration: popup.duration / 1000, ease: 'linear' }}
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ))}
    </>
  );
};

export default PopupContainer;
