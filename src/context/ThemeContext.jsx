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
      '--bg-primary': '#f0f4f8',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#e2e8f0',
      '--text-primary': '#1a202c',
      '--text-secondary': '#4a5568',
      '--text-muted': '#718096',
      '--accent-primary': '#e53e3e',
      '--accent-secondary': '#38b2ac',
      '--card-bg': '#ffffff',
      '--card-border': 'rgba(0, 0, 0, 0.12)',
      '--shadow-color': 'rgba(0, 0, 0, 0.15)',
      '--header-bg': 'rgba(255, 255, 255, 0.98)',
      '--input-bg': '#ffffff',
      '--input-border': '#cbd5e0',
      '--type-glow': '#e53e3e',
      '--gradient-start': '#667eea',
      '--gradient-end': '#764ba2',
    },
  },
  dark: {
    name: 'Dark',
    icon: '🌙',
    colors: {
      '--bg-primary': '#0a0a12',
      '--bg-secondary': '#12121f',
      '--bg-tertiary': '#1a1a2e',
      '--text-primary': '#ffffff',
      '--text-secondary': '#a0aec0',
      '--text-muted': '#5a6078',
      '--accent-primary': '#ff6b6b',
      '--accent-secondary': '#4ecdc4',
      '--card-bg': '#12121f',
      '--card-border': 'rgba(255, 255, 255, 0.08)',
      '--shadow-color': 'rgba(0, 0, 0, 0.5)',
      '--header-bg': 'rgba(10, 10, 18, 0.95)',
      '--input-bg': '#1a1a2e',
      '--input-border': '#2d2d4a',
      '--type-glow': '#ff6b6b',
      '--gradient-start': '#667eea',
      '--gradient-end': '#764ba2',
    },
  },
  'red-blue': {
    name: 'Red & Blue',
    icon: '🎮',
    colors: {
      '--bg-primary': '#0d0518',
      '--bg-secondary': '#1a0a2e',
      '--bg-tertiary': '#2a1445',
      '--text-primary': '#ffffff',
      '--text-secondary': '#e0d0f0',
      '--text-muted': '#9080b0',
      '--accent-primary': '#ff2222',
      '--accent-secondary': '#2266ff',
      '--card-bg': '#1a0a2e',
      '--card-border': 'rgba(255, 34, 34, 0.35)',
      '--shadow-color': 'rgba(34, 102, 255, 0.35)',
      '--header-bg': 'rgba(13, 5, 24, 0.98)',
      '--input-bg': '#2a1445',
      '--input-border': '#4a2a6a',
      '--type-glow': '#ff2222',
      '--gradient-start': '#ff2222',
      '--gradient-end': '#2266ff',
    },
  },
  emerald: {
    name: 'Emerald',
    icon: '💎',
    colors: {
      '--bg-primary': '#021a0f',
      '--bg-secondary': '#042d1a',
      '--bg-tertiary': '#064025',
      '--text-primary': '#d0ffe0',
      '--text-secondary': '#80d0a0',
      '--text-muted': '#408060',
      '--accent-primary': '#00ff7f',
      '--accent-secondary': '#00cc66',
      '--card-bg': '#042d1a',
      '--card-border': 'rgba(0, 255, 127, 0.35)',
      '--shadow-color': 'rgba(0, 204, 102, 0.35)',
      '--header-bg': 'rgba(2, 26, 15, 0.98)',
      '--input-bg': '#064025',
      '--input-border': '#0a5a35',
      '--type-glow': '#00ff7f',
      '--gradient-start': '#00ff7f',
      '--gradient-end': '#00cc66',
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
