/**
 * PopupSettings Component - Customize popup appearance and behavior
 */

import React, { useState } from 'react';
import { usePopup } from '../../context/PopupContext';
import './PopupSettings.css';

const PopupSettings = ({ isOpen, onClose }) => {
  const { popupSettings, updateSettings, showSuccess } = usePopup();
  const [settings, setSettings] = useState(popupSettings);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateSettings(settings);
    showSuccess('Popup settings saved successfully');
    onClose();
  };

  const handleReset = () => {
    const defaultSettings = {
      position: 'top-right',
      size: 'medium',
      animation: 'slide',
      duration: 5000,
      soundEnabled: true,
      maxPopups: 3
    };
    setSettings(defaultSettings);
  };

  const testPopup = () => {
    // Temporarily apply settings for test
    updateSettings(settings);
    showSuccess('This is a test popup!', { test: true });
  };

  if (!isOpen) return null;

  return (
    <div className="popup-settings-overlay" onClick={onClose}>
      <div className="popup-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="popup-settings-header">
          <h2>Popup Settings</h2>
          <button className="popup-settings-close" onClick={onClose}>×</button>
        </div>

        <div className="popup-settings-content">
          {/* Position */}
          <div className="setting-group">
            <label>Position</label>
            <select 
              value={settings.position} 
              onChange={(e) => handleChange('position', e.target.value)}
            >
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="center">Center</option>
            </select>
          </div>

          {/* Size */}
          <div className="setting-group">
            <label>Size</label>
            <select 
              value={settings.size} 
              onChange={(e) => handleChange('size', e.target.value)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          {/* Animation */}
          <div className="setting-group">
            <label>Animation</label>
            <select 
              value={settings.animation} 
              onChange={(e) => handleChange('animation', e.target.value)}
            >
              <option value="slide">Slide</option>
              <option value="fade">Fade</option>
              <option value="bounce">Bounce</option>
              <option value="scale">Scale</option>
            </select>
          </div>

          {/* Duration */}
          <div className="setting-group">
            <label>Duration (seconds)</label>
            <input
              type="range"
              min="2"
              max="10"
              step="1"
              value={settings.duration / 1000}
              onChange={(e) => handleChange('duration', e.target.value * 1000)}
            />
            <span className="setting-value">{settings.duration / 1000}s</span>
          </div>

          {/* Max Popups */}
          <div className="setting-group">
            <label>Max Visible Popups</label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={settings.maxPopups}
              onChange={(e) => handleChange('maxPopups', parseInt(e.target.value))}
            />
            <span className="setting-value">{settings.maxPopups}</span>
          </div>

          {/* Sound */}
          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => handleChange('soundEnabled', e.target.checked)}
              />
              Enable notification sounds
            </label>
          </div>

          {/* Test button */}
          <div className="setting-group">
            <button className="test-popup-btn" onClick={testPopup}>
              Test Popup
            </button>
          </div>
        </div>

        <div className="popup-settings-footer">
          <button className="reset-btn" onClick={handleReset}>
            Reset to Default
          </button>
          <div className="action-buttons">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="save-btn" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupSettings;
