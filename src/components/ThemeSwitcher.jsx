// ThemeSwitcher.jsx - Theme switching UI component
import React, { useState } from 'react';
import { useTheme, THEMES } from '../context/ThemeContext';

const ThemeSwitcher = ({ compact = false }) => {
  const { currentTheme, setTheme, cycleTheme, themeConfigs, isDarkBase, toggleDarkBase } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const currentConfig = themeConfigs[currentTheme] || themeConfigs.dark;

  if (compact) {
    return (
      <button 
        className="theme-toggle-compact"
        onClick={cycleTheme}
        title={`Current: ${currentConfig.name} - Click to change`}
      >
        {currentConfig.icon}
      </button>
    );
  }

  return (
    <div className="theme-switcher">
      <button 
        className="theme-current-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="theme-icon">{currentConfig.icon}</span>
        <span className="theme-name">{currentConfig.name}</span>
        <span className={`theme-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="theme-dropdown">
          {Object.entries(THEMES).map(([key, value]) => {
            const config = themeConfigs[value];
            if (!config) return null;
            
            return (
              <button
                key={key}
                className={`theme-option ${currentTheme === value ? 'active' : ''}`}
                onClick={() => {
                  setTheme(value);
                  setIsOpen(false);
                }}
              >
                <span className="option-icon">{config.icon}</span>
                <span className="option-name">{config.name}</span>
                {currentTheme === value && <span className="option-check">✓</span>}
              </button>
            );
          })}
          
          {currentTheme === THEMES.DYNAMIC && (
            <div className="dynamic-settings">
              <span className="settings-label">Base Mode:</span>
              <button 
                className="dark-toggle"
                onClick={toggleDarkBase}
              >
                {isDarkBase ? '🌙 Dark' : '☀️ Light'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
