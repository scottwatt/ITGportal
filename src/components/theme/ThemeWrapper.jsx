// src/components/theme/ThemeWrapper.jsx - Wrapper to apply themes to content
import React from 'react';
import { useGlobalTheme } from '../../contexts/GlobalThemeContext';

const ThemeWrapper = ({ children, className = '' }) => {
  const { currentTheme } = useGlobalTheme();

  return (
    <div 
      data-theme={currentTheme}
      className={`theme-bg-primary min-h-screen transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
};

// Content wrapper for individual pages/cards
export const ThemeCard = ({ children, className = '' }) => {
  const { currentTheme } = useGlobalTheme();

  return (
    <div 
      data-theme={currentTheme}
      className={`theme-card rounded-lg shadow-md p-6 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
};

// Header wrapper for page titles
export const ThemeHeader = ({ children, className = '' }) => {
  const { currentTheme } = useGlobalTheme();

  return (
    <div 
      data-theme={currentTheme}
      className={`theme-card rounded-lg p-6 mb-6 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
};

// Button wrapper for theme-aware buttons
export const ThemeButton = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  onClick,
  disabled = false,
  type = 'button',
  ...props 
}) => {
  const { currentTheme } = useGlobalTheme();

  const getButtonClasses = () => {
    const baseClasses = 'px-4 py-2 rounded font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
    
    if (variant === 'primary') {
      return `${baseClasses} theme-button-primary hover:shadow-lg`;
    } else if (variant === 'secondary') {
      return `${baseClasses} theme-button-secondary hover:shadow-lg`;
    } else {
      return `${baseClasses} bg-gray-200 text-gray-800 hover:bg-gray-300`;
    }
  };

  return (
    <button
      data-theme={currentTheme}
      className={`${getButtonClasses()} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
};

export default ThemeWrapper;