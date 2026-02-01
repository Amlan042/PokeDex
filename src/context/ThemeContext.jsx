// ThemeContext.jsx - Theme management for dark/light mode and dynamic type theming
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { typeColors } from '../utils/typeColors';
import { loadFromStorage, saveToStorage } from '../utils/localStorage';

const ThemeContext = createContext();

// Predefined themes
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  RED_BLUE: 'red-blue',
  EMERALD: 'emerald',
  DYNAMIC: 'dynamic',
};

// Theme configurations
const themeConfigs = {
  light: {
    name: 'Light',
    icon: '☀️',
    colors: {
      '--bg-primary': '#f5f5f5',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#e8e8e8',
      '--text-primary': '#1a1a2e',
      '--text-secondary': '#4a4a6a',
      '--text-muted': '#8888a8',
      '--accent-primary': '#ff6b6b',
      '--accent-secondary': '#4ecdc4',
      '--card-bg': '#ffffff',
      '--card-border': 'rgba(0, 0, 0, 0.1)',
      '--shadow-color': 'rgba(0, 0, 0, 0.1)',
      '--header-bg': 'rgba(255, 255, 255, 0.95)',
      '--input-bg': '#ffffff',
      '--input-border': '#e0e0e0',
    },
  },
  dark: {
    name: 'Dark',
    icon: '🌙',
    colors: {
      '--bg-primary': '#0f0f1a',
      '--bg-secondary': '#1a1a2e',
      '--bg-tertiary': '#252542',
      '--text-primary': '#ffffff',
      '--text-secondary': '#b8b8d0',
      '--text-muted': '#6a6a8a',
      '--accent-primary': '#ff6b6b',
      '--accent-secondary': '#4ecdc4',
      '--card-bg': '#1a1a2e',
      '--card-border': 'rgba(255, 255, 255, 0.1)',
      '--shadow-color': 'rgba(0, 0, 0, 0.3)',
      '--header-bg': 'rgba(15, 15, 26, 0.95)',
      '--input-bg': '#252542',
      '--input-border': '#3a3a5a',
    },
  },
  'red-blue': {
    name: 'Red & Blue',
    icon: '🎮',
    colors: {
      '--bg-primary': '#1a0a1e',
      '--bg-secondary': '#2a1a3e',
      '--bg-tertiary': '#3a2a4e',
      '--text-primary': '#ffffff',
      '--text-secondary': '#d0c0e0',
      '--text-muted': '#8070a0',
      '--accent-primary': '#ff3333',
      '--accent-secondary': '#3366ff',
      '--card-bg': '#2a1a3e',
      '--card-border': 'rgba(255, 51, 51, 0.2)',
      '--shadow-color': 'rgba(51, 102, 255, 0.2)',
      '--header-bg': 'rgba(26, 10, 30, 0.95)',
      '--input-bg': '#3a2a4e',
      '--input-border': '#5a4a6e',
    },
  },
  emerald: {
    name: 'Emerald',
    icon: '💎',
    colors: {
      '--bg-primary': '#0a1a14',
      '--bg-secondary': '#0f2a1f',
      '--bg-tertiary': '#1a3a2a',
      '--text-primary': '#e0fff0',
      '--text-secondary': '#a0d0b0',
      '--text-muted': '#608070',
      '--accent-primary': '#00ff88',
      '--accent-secondary': '#00aa55',
      '--card-bg': '#0f2a1f',
      '--card-border': 'rgba(0, 255, 136, 0.2)',
      '--shadow-color': 'rgba(0, 170, 85, 0.2)',
      '--header-bg': 'rgba(10, 26, 20, 0.95)',
      '--input-bg': '#1a3a2a',
      '--input-border': '#2a4a3a',
    },
  },
  dynamic: {
    name: 'Dynamic',
    icon: '✨',
    colors: null, // Colors are set dynamically based on Pokemon type
  },
};

// Generate dynamic theme colors based on Pokemon type
const getDynamicColors = (pokemonType, isDark = true) => {
  const type = typeColors[pokemonType] || typeColors.normal;
  
  if (isDark) {
    return {
      '--bg-primary': '#0f0f1a',
      '--bg-secondary': '#1a1a2e',
      '--bg-tertiary': '#252542',
      '--text-primary': '#ffffff',
      '--text-secondary': '#b8b8d0',
      '--text-muted': '#6a6a8a',
      '--accent-primary': type.primary,
      '--accent-secondary': type.secondary,
      '--card-bg': '#1a1a2e',
      '--card-border': `${type.primary}33`,
      '--shadow-color': `${type.primary}22`,
      '--header-bg': 'rgba(15, 15, 26, 0.95)',
      '--input-bg': '#252542',
      '--input-border': type.secondary,
      '--type-glow': type.primary,
    };
  }
  
  return {
    '--bg-primary': '#f5f5f5',
    '--bg-secondary': '#ffffff',
    '--bg-tertiary': '#e8e8e8',
    '--text-primary': '#1a1a2e',
    '--text-secondary': '#4a4a6a',
    '--text-muted': '#8888a8',
    '--accent-primary': type.primary,
    '--accent-secondary': type.secondary,
    '--card-bg': '#ffffff',
    '--card-border': `${type.primary}33`,
    '--shadow-color': `${type.primary}22`,
    '--header-bg': 'rgba(255, 255, 255, 0.95)',
    '--input-bg': '#ffffff',
    '--input-border': type.light,
    '--type-glow': type.primary,
  };
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = loadFromStorage('pokemon-theme');
    return saved || THEMES.DARK;
  });
  
  const [dynamicType, setDynamicType] = useState('normal');
  const [isDarkBase, setIsDarkBase] = useState(true);

  // Apply theme colors to document
  const applyTheme = useCallback((theme, type = 'normal') => {
    const root = document.documentElement;
    
    let colors;
    if (theme === THEMES.DYNAMIC) {
      colors = getDynamicColors(type, isDarkBase);
    } else {
      colors = themeConfigs[theme]?.colors || themeConfigs.dark.colors;
    }
    
    if (colors) {
      Object.entries(colors).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });
    }
    
    // Add theme class to body
    document.body.className = `theme-${theme}`;
  }, [isDarkBase]);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(currentTheme, dynamicType);
    saveToStorage('pokemon-theme', currentTheme);
  }, [currentTheme, dynamicType, applyTheme]);

  // Change theme
  const setTheme = useCallback((theme) => {
    setCurrentTheme(theme);
  }, []);

  // Update dynamic type (for dynamic theme)
  const updateDynamicType = useCallback((type) => {
    setDynamicType(type);
    if (currentTheme === THEMES.DYNAMIC) {
      applyTheme(THEMES.DYNAMIC, type);
    }
  }, [currentTheme, applyTheme]);

  // Toggle dark/light base for dynamic theme
  const toggleDarkBase = useCallback(() => {
    setIsDarkBase(prev => !prev);
  }, []);

  // Cycle through themes
  const cycleTheme = useCallback(() => {
    const themeOrder = [THEMES.DARK, THEMES.LIGHT, THEMES.RED_BLUE, THEMES.EMERALD, THEMES.DYNAMIC];
    const currentIndex = themeOrder.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  }, [currentTheme, setTheme]);

  const value = {
    currentTheme,
    setTheme,
    cycleTheme,
    updateDynamicType,
    dynamicType,
    isDarkBase,
    toggleDarkBase,
    themes: THEMES,
    themeConfigs,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
