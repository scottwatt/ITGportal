// src/components/shared/Navigation.jsx - Fixed dropdown and added title animations
import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Clock, 
  CalendarDays, 
  User, 
  BookOpen, 
  Settings, 
  Target, 
  Key, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  ChevronUp,
  // Additional icons from constants
  Building2,
  Users,
  Calendar,
  ClipboardList,
  UserCheck,
  Car,
  Briefcase,
  Wrench,
  Package
} from 'lucide-react';
import GlobalThemeSwitcher from '../admin/GlobalThemeSwitcher';
import { useGlobalTheme } from '../../contexts/GlobalThemeContext';
import ITGLogo from './ITGLogo.jsx';

// Complete icon mapping for navigation items
const iconMap = {
  // Legacy icons
  TrendingUp,
  Clock, 
  CalendarDays,
  User,
  BookOpen,
  Settings,
  Target,
  // Icons from constants.js
  Building2,
  Users,
  Calendar,
  ClipboardList,
  UserCheck,
  Car,
  Briefcase,
  Wrench,
  Package
};

// Safe ITGLogo component wrapper
const SafeITGLogo = () => {
  try {
    return <ITGLogo />;
  } catch (error) {
    console.warn('ITGLogo component failed to render:', error);
    return (
      <div className="flex items-center justify-center w-8 h-8 bg-white bg-opacity-20 rounded text-white font-bold text-sm">
        ITG
      </div>
    );
  }
};

// Dynamic icon component that handles string icon names
const DynamicIcon = ({ iconName, size = 16, className = '' }) => {
  const IconComponent = iconMap[iconName];
  
  if (IconComponent) {
    return <IconComponent size={size} className={className} />;
  }
  
  // Fallback to Building2 for unknown icons
  return <Building2 size={size} className={className} />;
};

// Simplified dropdown component - no portal needed
const SimpleDropdown = ({ show, onClose, children, buttonRef }) => {
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!show) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show, onClose, buttonRef]);

  if (!show) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
      style={{ zIndex: 9999 }}
    >
      {children}
    </div>
  );
};

const Navigation = ({
  userProfile,
  activeTab,
  setActiveTab,
  navigationItems = [],
  onLogout,
  onShowPasswordModal,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMediumMoreMenu, setShowMediumMoreMenu] = useState(false);
  const { getCurrentTheme, currentTheme } = useGlobalTheme();
  
  // Refs for dropdown positioning
  const moreButtonRef = useRef(null);
  const mediumMoreButtonRef = useRef(null);
  
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    setShowMoreMenu(false);
    setShowMediumMoreMenu(false);
  };

  const handlePasswordModalClick = () => {
    onShowPasswordModal();
    setIsMobileMenuOpen(false);
    setShowMoreMenu(false);
    setShowMediumMoreMenu(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsMobileMenuOpen(false);
    setShowMoreMenu(false);
    setShowMediumMoreMenu(false);
  };

  // Close dropdown when clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowMoreMenu(false);
        setShowMediumMoreMenu(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Determine if we need compact layout (for admin/full access users)
  const needsCompactLayout = navigationItems.length > 6;
  
  // Split navigation items for compact layout
  const primaryItems = needsCompactLayout ? navigationItems.slice(0, 4) : navigationItems;
  const secondaryItems = needsCompactLayout ? navigationItems.slice(4) : [];

  // Get theme-specific classes
  const themeData = getCurrentTheme();
  const getThemeClasses = () => {
    const baseClasses = "text-white p-4 transition-all duration-300";
    
    switch (currentTheme) {
      case 'christmas':
        return `${baseClasses} christmas-sparkle`;
      case 'halloween':
        return `${baseClasses} halloween-glow halloween-shadow`;
      case 'fourthOfJuly':
        return `${baseClasses} fourth-july-wave`;
      case 'stPatricks':
        return `${baseClasses}`;
      case 'valentine':
        return `${baseClasses}`;
      case 'thanksgiving':
        return `${baseClasses} thanksgiving-warm`;
      default:
        return baseClasses;
    }
  };

  // Dynamic navigation background based on theme
  const getNavStyle = () => {
    return {
      background: `linear-gradient(135deg, ${themeData.colors.primary} 0%, ${themeData.colors.secondary} 100%)`,
    };
  };

  // Get holiday-specific title suffix with animations
  const getHolidayTitle = () => {
    switch (currentTheme) {
      case 'christmas':
        return (
          <span className="inline-flex items-center">
            <span className="christmas-title-sparkle mr-1">🎄</span>
            <span className="christmas-snow-text">❄️</span>
          </span>
        );
      case 'halloween':
        return (
          <span className="inline-flex items-center">
            <span className="halloween-bob mr-1">🎃</span>
            <span className="halloween-float">👻</span>
          </span>
        );
      case 'fourthOfJuly':
        return (
          <span className="inline-flex items-center">
            <span className="fourth-july-wave-flag mr-1">🇺🇸</span>
            <span className="fourth-july-sparkle">✨</span>
          </span>
        );
      case 'stPatricks':
        return (
          <span className="inline-flex items-center">
            <span className="stpatricks-spin mr-1">🍀</span>
            <span className="stpatricks-rainbow">🌈</span>
          </span>
        );
      case 'valentine':
        return (
          <span className="inline-flex items-center">
            <span className="valentine-heartbeat mr-1">💕</span>
            <span className="valentine-float">💖</span>
          </span>
        );
      case 'thanksgiving':
        return (
          <span className="inline-flex items-center">
            <span className="thanksgiving-bob mr-1">🦃</span>
            <span className="thanksgiving-leaf-fall">🍂</span>
          </span>
        );
      default:
        return '';
    }
  };

  // Get holiday greeting
  const getHolidayGreeting = () => {
    switch (currentTheme) {
      case 'christmas':
        return 'Merry Christmas & Happy Holidays!';
      case 'halloween':
        return 'Happy Halloween! 👻';
      case 'fourthOfJuly':
        return 'Happy Independence Day!';
      case 'stPatricks':
        return 'Happy St. Patrick\'s Day!';
      case 'valentine':
        return 'Happy Valentine\'s Day!';
      case 'thanksgiving':
        return 'Happy Thanksgiving!';
      default:
        return 'Independence Through Grace';
    }
  };

  // Get button style for active/inactive states
  const getButtonStyle = (isActive) => {
    if (isActive) {
      return {
        backgroundColor: `${themeData.colors.secondary}80`, // 50% opacity
        backdropFilter: 'blur(10px)',
        borderRadius: '6px'
      };
    }
    return {};
  };

  // Helper to render navigation button
  const renderNavButton = (item, className = '', showLabel = true) => (
    <button 
      key={item.id}
      onClick={() => handleTabClick(item.id)} 
      className={`flex items-center space-x-1 px-2 py-2 rounded text-sm transition-all duration-200 hover:bg-white hover:bg-opacity-10 ${
        activeTab === item.id ? 'bg-white bg-opacity-20 backdrop-blur-sm' : ''
      } ${className}`}
      style={getButtonStyle(activeTab === item.id)}
      title={item.label}
    >
      <DynamicIcon iconName={item.icon} size={16} />
      {showLabel && <span className="hidden xl:inline">{item.label}</span>}
    </button>
  );

  return (
    <>
      {/* Seasonal Animations */}
      {currentTheme === 'christmas' && (
        <div className="christmas-snow fixed inset-0 pointer-events-none" />
      )}
      {currentTheme === 'halloween' && (
        <div className="halloween-bats fixed inset-0 pointer-events-none" />
      )}
      {currentTheme === 'valentine' && (
        <div className="valentine-hearts fixed inset-0 pointer-events-none" />
      )}
      {currentTheme === 'stPatricks' && (
        <div className="stpatricks-shamrocks fixed inset-0 pointer-events-none" />
      )}
      {currentTheme === 'thanksgiving' && (
        <div className="thanksgiving-leaves fixed inset-0 pointer-events-none" />
      )}
      {currentTheme === 'fourthOfJuly' && (
        <div className="fourth-july-fireworks fixed inset-0 pointer-events-none" />
      )}
      
      <nav className={`${getThemeClasses()} sticky top-0`} style={getNavStyle()}>
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <SafeITGLogo />
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <h1 className="text-lg font-bold">Coach Portal</h1>
                    {getHolidayTitle()}
                  </div>
                  <p className="text-xs" style={{ color: themeData.colors.accent }}>
                    {getHolidayGreeting()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2">
              {/* Primary navigation items */}
              {primaryItems.map(item => renderNavButton(item))}
              
              {/* More menu for secondary items */}
              {secondaryItems.length > 0 && (
                <div className="relative">
                  <button
                    ref={moreButtonRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMoreMenu(!showMoreMenu);
                      setShowMediumMoreMenu(false);
                    }}
                    className="flex items-center space-x-1 px-2 py-2 rounded text-sm hover:bg-white hover:bg-opacity-10 transition-all duration-200"
                  >
                    <Settings size={16} />
                    <span className="hidden xl:inline">More</span>
                    {showMoreMenu ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  
                  <SimpleDropdown 
                    show={showMoreMenu} 
                    onClose={() => setShowMoreMenu(false)}
                    buttonRef={moreButtonRef}
                  >
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3">
                      <div className="flex items-center space-x-2">
                        <Settings size={18} />
                        <span className="font-semibold">More Options</span>
                      </div>
                      <p className="text-xs text-purple-100 mt-1">Additional navigation items</p>
                    </div>
                    
                    <div className="py-1">
                      {secondaryItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleTabClick(item.id)}
                          className={`w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${
                            activeTab === item.id ? 'text-white' : ''
                          }`}
                          style={{
                            backgroundColor: activeTab === item.id ? themeData.colors.primary : undefined,
                          }}
                        >
                          <DynamicIcon iconName={item.icon} size={16} />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </SimpleDropdown>
                </div>
              )}
            </div>

            {/* Medium screens navigation (md to lg) */}
            <div className="hidden md:flex lg:hidden items-center space-x-1">
              {primaryItems.slice(0, 3).map(item => renderNavButton(item, '', false))}
              
              {/* More menu for remaining items */}
              <div className="relative">
                <button
                  ref={mediumMoreButtonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMediumMoreMenu(!showMediumMoreMenu);
                    setShowMoreMenu(false);
                  }}
                  className="flex items-center p-2 rounded hover:bg-white hover:bg-opacity-10 transition-all duration-200"
                  title="More"
                >
                  <Menu size={16} />
                </button>
                
                <SimpleDropdown 
                  show={showMediumMoreMenu} 
                  onClose={() => setShowMediumMoreMenu(false)}
                  buttonRef={mediumMoreButtonRef}
                >
                  <div className="py-1">
                    {[...primaryItems.slice(3), ...secondaryItems].map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${
                          activeTab === item.id ? 'text-white' : ''
                        }`}
                        style={{
                          backgroundColor: activeTab === item.id ? themeData.colors.primary : undefined,
                        }}
                      >
                        <DynamicIcon iconName={item.icon} size={16} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </SimpleDropdown>
              </div>
            </div>
            
            {/* User info and actions */}
            <div className="flex items-center space-x-2">
              {/* Global Theme Switcher (Admin Only) */}
              <GlobalThemeSwitcher />
              
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium">{userProfile?.name || 'User'}</div>
                <div className="text-xs capitalize" style={{ color: themeData.colors.accent }}>
                  {userProfile?.role?.replace(/_/g, ' ') || 'User'}
                </div>
              </div>
              
              <button 
                onClick={handlePasswordModalClick} 
                className="flex items-center space-x-1 hover:bg-white hover:bg-opacity-10 px-2 py-2 rounded transition-all duration-200"
                title="Change Password"
              >
                <Key size={16} />
                <span className="hidden lg:inline">Password</span>
              </button>
              
              <button 
                onClick={handleLogoutClick} 
                className="flex items-center space-x-1 hover:bg-white hover:bg-opacity-10 px-2 py-2 rounded transition-all duration-200"
                title="Logout"
              >
                <LogOut size={16} />
                <span className="hidden lg:inline">Logout</span>
              </button>
              
              <button 
                className="md:hidden p-2 hover:bg-white hover:bg-opacity-10 rounded transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 space-y-2 border-t border-white border-opacity-20 pt-4">
              {navigationItems.map(item => (
                <button 
                  key={item.id}
                  onClick={() => handleTabClick(item.id)} 
                  className={`w-full text-left flex items-center space-x-2 px-3 py-2 rounded transition-all duration-200 hover:bg-white hover:bg-opacity-10 ${
                    activeTab === item.id ? 'bg-white bg-opacity-20' : ''
                  }`}
                  style={getButtonStyle(activeTab === item.id)}
                >
                  <DynamicIcon iconName={item.icon} size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
              
              <div className="border-t border-white border-opacity-20 pt-2 mt-2">
                <div className="px-3 py-2 mb-2">
                  <div className="text-sm font-medium">{userProfile?.name || 'User'}</div>
                  <div className="text-xs capitalize" style={{ color: themeData.colors.accent }}>
                    {userProfile?.role?.replace(/_/g, ' ') || 'User'}
                  </div>
                </div>
                
                <button 
                  onClick={handlePasswordModalClick} 
                  className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded hover:bg-white hover:bg-opacity-10 transition-all duration-200"
                >
                  <Key size={18} />
                  <span>Change Password</span>
                </button>
                
                <button 
                  onClick={handleLogoutClick} 
                  className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded hover:bg-white hover:bg-opacity-10 transition-all duration-200"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navigation;