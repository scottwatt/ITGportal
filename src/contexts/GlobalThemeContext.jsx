// src/contexts/GlobalThemeContext.jsx - Fixed version
import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase/config';

// Holiday theme definitions
export const HOLIDAY_THEMES = {
  default: {
    id: 'default',
    name: 'ITG Default',
    emoji: '🏢',
    colors: {
      primary: '#6D858E',
      secondary: '#5A4E69', 
      accent: '#BED2D8',
      text: '#292929',
      textSecondary: '#707070',
      textMuted: '#9B97A2',
      background: '#F5F5F5',
      white: '#FFFFFF'
    }
  },
  christmas: {
    id: 'christmas',
    name: 'Christmas Magic',
    emoji: '🎄',
    colors: {
      primary: '#C41E3A',
      secondary: '#228B22',
      accent: '#FFD700',
      text: '#2F4F2F',
      textSecondary: '#8B4513',
      textMuted: '#A0522D',
      background: '#F0F8FF',
      white: '#FFFFFF'
    }
  },
  halloween: {
    id: 'halloween',
    name: 'Spooky Season',
    emoji: '🎃',
    colors: {
      primary: '#FF6600',
      secondary: '#4B0082',
      accent: '#FFD700',
      text: '#2F2F2F',
      textSecondary: '#8B4513',
      textMuted: '#A0522D',
      background: '#1C1C1C',
      white: '#FFFFFF'
    }
  },
  fourthOfJuly: {
    id: 'fourthOfJuly',
    name: 'Independence Day',
    emoji: '🇺🇸',
    colors: {
      primary: '#B22234',
      secondary: '#3C3B6E',
      accent: '#FFFFFF',
      text: '#000080',
      textSecondary: '#2F4F4F',
      textMuted: '#708090',
      background: '#F8F8FF',
      white: '#FFFFFF'
    }
  },
  stPatricks: {
    id: 'stPatricks',
    name: "St. Patrick's Day",
    emoji: '🍀',
    colors: {
      primary: '#228B22',
      secondary: '#FFD700',
      accent: '#90EE90',
      text: '#006400',
      textSecondary: '#2E8B57',
      textMuted: '#8FBC8F',
      background: '#F0FFF0',
      white: '#FFFFFF'
    }
  },
  valentine: {
    id: 'valentine',
    name: "Valentine's Day",
    emoji: '💕',
    colors: {
      primary: '#DC143C',
      secondary: '#FFB6C1',
      accent: '#FFC0CB',
      text: '#8B0000',
      textSecondary: '#CD5C5C',
      textMuted: '#F08080',
      background: '#FFF0F5',
      white: '#FFFFFF'
    }
  },
  thanksgiving: {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    emoji: '🦃',
    colors: {
      primary: '#D2691E',
      secondary: '#8B4513',
      accent: '#DAA520',
      text: '#654321',
      textSecondary: '#A0522D',
      textMuted: '#CD853F',
      background: '#FDF5E6',
      white: '#FFFFFF'
    }
  }
};

// Global Theme Context
const GlobalThemeContext = createContext();

export const useGlobalTheme = () => {
  const context = useContext(GlobalThemeContext);
  if (!context) {
    throw new Error('useGlobalTheme must be used within a GlobalThemeProvider');
  }
  return context;
};

// Check if user can change theme
const canChangeTheme = (userProfile) => {
  if (!userProfile) return false;
  
  const adminRoles = [
    'admin',
    'program_admin_coordinator',
    'admin_dev_coordinator', 
    'executive_director',
    'director_org_dev',
    'director_program_dev'
  ];
  return adminRoles.includes(userProfile.role);
};

// Global Theme Provider Component
export const GlobalThemeProvider = ({ children, userProfile }) => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [loading, setLoading] = useState(true);
  const [lastChangedBy, setLastChangedBy] = useState(null);
  const [lastChangedAt, setLastChangedAt] = useState(null);
  
  // Listen to global theme changes from Firestore
  useEffect(() => {
    const themeDocRef = doc(db, 'settings', 'globalTheme');
    
    const unsubscribe = onSnapshot(themeDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setCurrentTheme(data.theme || 'default');
        setLastChangedBy(data.changedBy || null);
        setLastChangedAt(data.changedAt || null);
      } else {
        // Initialize with default theme if document doesn't exist
        setCurrentTheme('default');
      }
      setLoading(false);
    }, (error) => {
      console.error('Error listening to theme changes:', error);
      setCurrentTheme('default');
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  // Apply theme to CSS custom properties
  useEffect(() => {
    if (loading) return;
    
    const theme = HOLIDAY_THEMES[currentTheme];
    if (!theme) return;
    
    const root = document.documentElement;
    
    // Set CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Special handling for Halloween dark theme
    if (currentTheme === 'halloween') {
      root.style.setProperty('--color-background', '#2F2F2F');
      root.style.setProperty('--color-white', '#1C1C1C');
      root.style.setProperty('--color-text', '#FFFFFF');
      document.body.classList.add('halloween-dark');
    } else {
      document.body.classList.remove('halloween-dark');
    }
    
    // Add theme class to body for additional styling
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${currentTheme}`);
    
  }, [currentTheme, loading]);
  
  // Change theme globally (admin only)
  const changeGlobalTheme = async (themeId) => {
    if (!userProfile || !canChangeTheme(userProfile)) {
      console.warn('User does not have permission to change global theme');
      throw new Error('Insufficient permissions to change global theme');
    }
    
    if (!HOLIDAY_THEMES[themeId]) {
      console.warn('Invalid theme ID:', themeId);
      throw new Error('Invalid theme ID');
    }
    
    try {
      const themeDocRef = doc(db, 'settings', 'globalTheme');
      await setDoc(themeDocRef, {
        theme: themeId,
        changedBy: {
          uid: userProfile.uid,
          name: userProfile.name || userProfile.email,
          email: userProfile.email
        },
        changedAt: new Date().toISOString()
      });
      
      console.log(`Global theme changed to ${themeId} by ${userProfile.name || userProfile.email}`);
    } catch (error) {
      console.error('Error changing global theme:', error);
      throw error;
    }
  };
  
  // Reset to default theme
  const resetToDefault = async () => {
    await changeGlobalTheme('default');
  };
  
  const getCurrentTheme = () => HOLIDAY_THEMES[currentTheme] || HOLIDAY_THEMES.default;
  
  const value = {
    currentTheme,
    themes: HOLIDAY_THEMES,
    changeGlobalTheme,
    resetToDefault,
    getCurrentTheme,
    isHolidayTheme: currentTheme !== 'default',
    canChangeTheme: canChangeTheme(userProfile),
    loading,
    lastChangedBy,
    lastChangedAt
  };
  
  return (
    <GlobalThemeContext.Provider value={value}>
      {children}
    </GlobalThemeContext.Provider>
  );
};

export default GlobalThemeContext;