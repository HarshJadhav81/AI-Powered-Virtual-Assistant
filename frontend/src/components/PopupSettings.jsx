/**
 * PopupSettings Component
 * Allows users to customize popup behavior and appearance
 */

import React from 'react';
import { usePopup } from '../context/PopupContext';
import './PopupSettings.css';

const PopupSettings = () => {
  const { popupSettings, updateSettings, showSuccess } = usePopup();

  const handleSettingChange = (key, value) => {
    updateSettings({ [key]: value });
  };

  const testPopup = () => {
    showSuccess('This is a test popup!', { 
      timestamp: new Date().toLocaleTimeString(),
      setting: `${popupSettings.position} - ${popupSettings.animation}`
    });
  };

  return (
    <div className="popup-settings">
      <h3 className="settings-title">🎨 Popup Customization</h3>
      <p className="settings-description">
        Customize how popups appear when your AI assistant performs actions
      </p>

      <div className="settings-grid">
        {/* Position Setting */}
        <div className="setting-item">
          <label className="setting-label">
            <span className="label-icon">📍</span>
            Position
          </label>
          <select
            className="setting-select"
            value={popupSettings.position}
            onChange={(e) => handleSettingChange('position', e.target.value)}
          >
            <option value="top-right">Top Right</option>
            <option value="top-left">Top Left</option>
            <option value="top-center">Top Center</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-center">Bottom Center</option>
            <option value="center">Center</option>
          </select>
        </div>

        {/* Size Setting */}
        <div className="setting-item">
          <label className="setting-label">
            <span className="label-icon">📏</span>
            Size
          </label>
          <select
            className="setting-select"
            value={popupSettings.size}
            onChange={(e) => handleSettingChange('size', e.target.value)}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        {/* Animation Setting */}
        <div className="setting-item">
          <label className="setting-label">
            <span className="label-icon">✨</span>
            Animation
          </label>
          <select
            className="setting-select"
            value={popupSettings.animation}
            onChange={(e) => handleSettingChange('animation', e.target.value)}
          >
            <option value="slide">Slide</option>
            <option value="fade">Fade</option>
            <option value="bounce">Bounce</option>
            <option value="scale">Scale</option>
          </select>
        </div>

        {/* Duration Setting */}
        <div className="setting-item">
          <label className="setting-label">
            <span className="label-icon">⏱️</span>
            Duration (seconds)
          </label>
          <input
            type="range"
            className="setting-range"
            min="2"
            max="10"
            step="1"
            value={popupSettings.duration / 1000}
            onChange={(e) => handleSettingChange('duration', parseInt(e.target.value) * 1000)}
          />
          <span className="range-value">{popupSettings.duration / 1000}s</span>
        </div>

        {/* Max Popups Setting */}
        <div className="setting-item">
          <label className="setting-label">
            <span className="label-icon">📊</span>
            Max Visible Popups
          </label>
          <input
            type="range"
            className="setting-range"
            min="1"
            max="5"
            step="1"
            value={popupSettings.maxPopups}
            onChange={(e) => handleSettingChange('maxPopups', parseInt(e.target.value))}
          />
          <span className="range-value">{popupSettings.maxPopups}</span>
        </div>

        {/* Sound Setting */}
        <div className="setting-item setting-item-checkbox">
          <label className="setting-label">
            <span className="label-icon">🔔</span>
            Sound Notifications
          </label>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={popupSettings.soundEnabled}
              onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Test Button */}
      <button className="test-popup-btn" onClick={testPopup}>
        <span className="btn-icon">🧪</span>
        Test Popup
      </button>

      {/* Preview Info */}
      <div className="settings-preview">
        <h4>Current Settings:</h4>
        <ul>
          <li><strong>Position:</strong> {popupSettings.position}</li>
          <li><strong>Size:</strong> {popupSettings.size}</li>
          <li><strong>Animation:</strong> {popupSettings.animation}</li>
          <li><strong>Duration:</strong> {popupSettings.duration / 1000} seconds</li>
          <li><strong>Max Popups:</strong> {popupSettings.maxPopups}</li>
          <li><strong>Sound:</strong> {popupSettings.soundEnabled ? 'Enabled' : 'Disabled'}</li>
        </ul>
      </div>
    </div>
  );
};

export default PopupSettings;
