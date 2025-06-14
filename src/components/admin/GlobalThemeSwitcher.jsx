// src/components/admin/GlobalThemeSwitcher.jsx - Fixed version
import React, { useState } from 'react';
import { Palette, ChevronDown, ChevronUp, Crown, RotateCcw, Globe, Clock, User } from 'lucide-react';
import { useGlobalTheme } from '../../contexts/GlobalThemeContext';

const GlobalThemeSwitcher = () => {
  const { 
    currentTheme, 
    themes, 
    changeGlobalTheme, 
    resetToDefault, 
    getCurrentTheme, 
    canChangeTheme,
    loading,
    lastChangedBy,
    lastChangedAt
  } = useGlobalTheme();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState(null);
  
  // Only show to users who can change themes
  if (!canChangeTheme || loading) return null;
  
  const currentThemeData = getCurrentTheme();
  
  const handleThemeChange = async (themeId) => {
    setIsChanging(true);
    setError(null);
    try {
      await changeGlobalTheme(themeId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change theme:', error);
      setError(error.message || 'Failed to change theme');
    } finally {
      setIsChanging(false);
    }
  };
  
  const handleReset = async () => {
    setIsChanging(true);
    setError(null);
    try {
      await resetToDefault();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to reset theme:', error);
      setError(error.message || 'Failed to reset theme');
    } finally {
      setIsChanging(false);
    }
  };
  
  const formatLastChanged = () => {
    if (!lastChangedAt || !lastChangedBy) return null;
    
    const date = new Date(lastChangedAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    let timeAgo;
    if (diffMins < 1) timeAgo = 'just now';
    else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
    else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
    else if (diffDays < 7) timeAgo = `${diffDays}d ago`;
    else timeAgo = date.toLocaleDateString();
    
    return {
      who: lastChangedBy.name || lastChangedBy.email,
      when: timeAgo
    };
  };
  
  const lastChanged = formatLastChanged();
  
  return (
    <div className="relative">
      {/* Global Theme Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className="flex items-center space-x-2 px-3 py-2 rounded-md bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 text-white border border-white border-opacity-30 disabled:opacity-50"
        title="Change Global Theme (Affects All Users)"
      >
        <div className="flex items-center space-x-1">
          <Crown size={16} />
          <Globe size={16} />
          <Palette size={16} />
        </div>
        <span className="text-sm hidden lg:inline">
          {currentThemeData.emoji} {currentThemeData.name}
        </span>
        <span className="lg:hidden text-lg">{currentThemeData.emoji}</span>
        {isChanging ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />
        )}
      </button>
      
      {/* Theme Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3">
            <div className="flex items-center space-x-2">
              <Crown size={18} />
              <Globe size={18} />
              <span className="font-semibold">Global Theme Control</span>
            </div>
            <p className="text-xs text-purple-100 mt-1">Changes theme for ALL users portal-wide</p>
            
            {/* Last Changed Info */}
            {lastChanged && (
              <div className="mt-2 p-2 bg-black bg-opacity-20 rounded text-xs">
                <div className="flex items-center space-x-1 text-purple-100">
                  <Clock size={12} />
                  <span>Last changed {lastChanged.when}</span>
                </div>
                <div className="flex items-center space-x-1 text-purple-200">
                  <User size={12} />
                  <span>by {lastChanged.who}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border-b border-red-200">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">⚠️</span>
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}
          
          <div className="max-h-80 overflow-y-auto">
            {Object.values(themes).map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                disabled={isChanging}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentTheme === theme.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{theme.emoji}</span>
                    <div>
                      <div className="font-medium text-gray-900">{theme.name}</div>
                      {currentTheme === theme.id && (
                        <div className="text-xs text-blue-600 font-medium flex items-center space-x-1">
                          <Globe size={10} />
                          <span>Currently Active (All Users)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Color Preview */}
                  <div className="flex space-x-1">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: theme.colors.primary }}
                      title="Primary Color"
                    />
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: theme.colors.secondary }}
                      title="Secondary Color"
                    />
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: theme.colors.accent }}
                      title="Accent Color"
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Reset Option */}
          {currentTheme !== 'default' && (
            <div className="border-t border-gray-200 p-3 bg-gray-50">
              <button
                onClick={handleReset}
                disabled={isChanging}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              >
                <RotateCcw size={14} />
                <span>Reset Everyone to Default ITG Theme</span>
              </button>
            </div>
          )}
          
          {/* Important Warning */}
          <div className="p-3 bg-red-50 border-t border-red-200">
            <div className="flex items-start space-x-2">
              <span className="text-red-600">⚠️</span>
              <div className="text-xs text-red-800">
                <p className="font-medium mb-1">Global Theme Warning:</p>
                <ul className="list-disc list-inside space-y-0.5 text-red-700">
                  <li>Changes affect ALL portal users</li>
                  <li>Theme applies immediately</li>
                  <li>Use for special occasions only</li>
                  <li>Consider user experience</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Theme Info */}
          <div className="p-3 bg-blue-50 border-t border-blue-200">
            <div className="flex items-start space-x-2">
              <Globe className="text-blue-600 mt-0.5" size={14} />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Global theme includes:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                  <li>Navigation & headers</li>
                  <li>Buttons & interactive elements</li>
                  <li>Cards & content areas</li>
                  <li>Holiday animations & effects</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default GlobalThemeSwitcher;