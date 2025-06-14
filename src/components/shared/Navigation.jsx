// src/components/shared/Navigation.jsx - Updated with Global Holiday Theme Support
import React, { useState } from 'react';
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
  ChevronUp
} from 'lucide-react';
import GlobalThemeSwitcher from '../admin/GlobalThemeSwitcher';
import { useGlobalTheme } from '../../contexts/GlobalThemeContext';

// Icon mapping for navigation items
const iconMap = {
  TrendingUp,
  Clock, 
  CalendarDays,
  User,
  BookOpen,
  Settings,
  Target
};

const Navigation = ({
  userProfile,
  activeTab,
  setActiveTab,
  navigationItems,
  onLogout,
  onShowPasswordModal,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { getCurrentTheme, currentTheme } = useGlobalTheme();
  
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    setShowMoreMenu(false);
  };

  const handlePasswordModalClick = () => {
    onShowPasswordModal();
    setIsMobileMenuOpen(false);
    setShowMoreMenu(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsMobileMenuOpen(false);
    setShowMoreMenu(false);
  };

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
        return `${baseClasses} stpatricks-bounce`;
      case 'valentine':
        return `${baseClasses} valentine-pulse`;
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

  return (
    <>
      {/* Christmas Snow Effect */}
      {currentTheme === 'christmas' && (
        <div className="christmas-snow" />
      )}
      
      <nav className={getThemeClasses()} style={getNavStyle()}>
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
            {primaryItems.map(item => {
              const IconComponent = iconMap[item.icon];
              return (
                <button 
                  key={item.id}
                  onClick={() => handleTabClick(item.id)} 
                  className={`flex items-center space-x-1 px-2 py-2 rounded text-sm transition-all duration-200 ${
                    activeTab === item.id 
                      ? 'bg-white bg-opacity-20 backdrop-blur-sm' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                  style={{
                    backgroundColor: activeTab === item.id ? themeData.colors.secondary : undefined,
                  }}
                >
                  {IconComponent && <IconComponent size={16} />}
                  <span className="hidden xl:inline">{item.label}</span>
                </button>
              );
            })}
            
            {/* More menu for secondary items */}
            {secondaryItems.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="flex items-center space-x-1 px-2 py-2 rounded text-sm hover:bg-white hover:bg-opacity-10 transition-all duration-200"
                >
                  <Settings size={16} />
                  <span className="hidden xl:inline">More</span>
                  {showMoreMenu ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                
                {showMoreMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border">
                    <div className="py-1">
                      {secondaryItems.map(item => {
                        const IconComponent = iconMap[item.icon];
                        return (
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
                            {IconComponent && <IconComponent size={16} />}
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Medium screens navigation (md to lg) */}
          <div className="hidden md:flex lg:hidden items-center space-x-1">
            {primaryItems.slice(0, 3).map(item => {
              const IconComponent = iconMap[item.icon];
              return (
                <button 
                  key={item.id}
                  onClick={() => handleTabClick(item.id)} 
                  className={`flex items-center p-2 rounded transition-all duration-200 ${
                    activeTab === item.id 
                      ? 'bg-white bg-opacity-20' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                  title={item.label}
                  style={{
                    backgroundColor: activeTab === item.id ? themeData.colors.secondary : undefined,
                  }}
                >
                  {IconComponent && <IconComponent size={16} />}
                </button>
              );
            })}
            
            {/* More menu for remaining items */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="flex items-center p-2 rounded hover:bg-white hover:bg-opacity-10 transition-all duration-200"
                title="More"
              >
                <Menu size={16} />
              </button>
              
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border">
                  <div className="py-1">
                    {[...primaryItems.slice(3), ...secondaryItems].map(item => {
                      const IconComponent = iconMap[item.icon];
                      return (
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
                          {IconComponent && <IconComponent size={16} />}
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* User info and actions */}
          <div className="flex items-center space-x-2">
            {/* Global Theme Switcher (Admin Only) */}
            <GlobalThemeSwitcher />
            
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium">{userProfile?.name}</div>
              <div className="text-xs capitalize" style={{ color: themeData.colors.accent }}>
                {userProfile?.role?.replace('_', ' ')}
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
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 space-y-2 border-t border-white border-opacity-20 pt-4">
            {navigationItems.map(item => {
              const IconComponent = iconMap[item.icon];
              return (
                <button 
                  key={item.id}
                  onClick={() => handleTabClick(item.id)} 
                  className={`w-full text-left flex items-center space-x-2 px-3 py-2 rounded transition-all duration-200 ${
                    activeTab === item.id 
                      ? 'bg-white bg-opacity-20' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                  style={{
                    backgroundColor: activeTab === item.id ? themeData.colors.secondary : undefined,
                  }}
                >
                  {IconComponent && <IconComponent size={18} />}
                  <span>{item.label}</span>
                </button>
              );
            })}
            
            <div className="border-t border-white border-opacity-20 pt-2 mt-2">
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
      </nav>
    </>
  );
};

export default Navigation;