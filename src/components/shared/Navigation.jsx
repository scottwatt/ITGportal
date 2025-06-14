// src/components/shared/Navigation.jsx - Fixed JSX structure
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

// Dynamic icon component that handles string icon names
const DynamicIcon = ({ iconName, size = 16, className = '' }) => {
  const IconComponent = iconMap[iconName];
  
  if (IconComponent) {
    return <IconComponent size={size} className={className} />;
  }
  
  // Fallback to Building2 for unknown icons
  return <Building2 size={size} className={className} />;
};

// Portal-based dropdown component for maximum z-index
const DropdownPortal = ({ show, onClose, children, buttonRef }) => {
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    console.log('DropdownPortal useEffect called, show:', show);
    if (show && buttonRef?.current) {
      const updatePosition = () => {
        const rect = buttonRef.current.getBoundingClientRect();
        const newPosition = {
          top: rect.bottom + 8, // 8px gap
          right: window.innerWidth - rect.right
        };
        console.log('Updating dropdown position:', newPosition);
        setPosition(newPosition);
      };
      
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [show, buttonRef]);

  console.log('DropdownPortal render, show:', show, 'position:', position);

  if (!show) return null;

  console.log('Rendering dropdown portal to body');

  return createPortal(
    <>
      {/* Invisible overlay to close dropdown */}
      <div 
        className="dropdown-overlay-portal"
        onClick={() => {
          console.log('Overlay clicked, closing dropdown');
          onClose();
        }}
      />
      {/* Dropdown with maximum z-index */}
      <div 
        className="nav-dropdown-portal"
        style={{
          top: `${position.top}px`,
          right: `${position.right}px`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body
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
        return `${baseClasses}`; // Removed stpatricks-bounce
      case 'valentine':
        return `${baseClasses}`; // Removed valentine-pulse
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

  // Get holiday-specific title suffix
  const getHolidayTitle = () => {
    switch (currentTheme) {
      case 'christmas':
        return ' 🎄';
      case 'halloween':
        return ' 🎃';
      case 'fourthOfJuly':
        return ' 🇺🇸';
      case 'stPatricks':
        return ' 🍀';
      case 'valentine':
        return ' 💕';
      case 'thanksgiving':
        return ' 🦃';
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
              <h1 className="text-xl font-bold">
                ITG Coach Portal{getHolidayTitle()}
              </h1>
              <p className="text-xs" style={{ color: themeData.colors.accent }}>
                {getHolidayGreeting()}
              </p>
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
                      console.log('More button clicked, current state:', showMoreMenu);
                      setShowMoreMenu(!showMoreMenu);
                      setShowMediumMoreMenu(false);
                      console.log('Setting showMoreMenu to:', !showMoreMenu);
                    }}
                    className="flex items-center space-x-1 px-2 py-2 rounded text-sm hover:bg-white hover:bg-opacity-10 transition-all duration-200"
                  >
                    <Settings size={16} />
                    <span className="hidden xl:inline">More</span>
                    {showMoreMenu ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  
                  <DropdownPortal 
                    show={showMoreMenu} 
                    onClose={() => setShowMoreMenu(false)}
                    buttonRef={moreButtonRef}
                  >
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
                  </DropdownPortal>
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
                
                <DropdownPortal 
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
                </DropdownPortal>
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