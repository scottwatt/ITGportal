// src/components/shared/Navigation.jsx - Fixed with compact admin layout and responsive design
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

  return (
    <nav className="bg-[#6D858E] text-white p-4">
      <div className="flex justify-between items-center">
        <div className="flex-shrink-0">
          <h1 className="text-xl font-bold">ITG Coach Portal</h1>
          <p className="text-xs text-[#BED2D8]">Independence Through Grace</p>
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
                className={`flex items-center space-x-1 px-2 py-2 rounded text-sm ${
                  activeTab === item.id ? 'bg-[#5A4E69]' : 'hover:bg-[#5A4E69]'
                }`}
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
                className="flex items-center space-x-1 px-2 py-2 rounded text-sm hover:bg-[#5A4E69]"
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
                          className={`w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                            activeTab === item.id ? 'bg-[#BED2D8] text-[#292929]' : ''
                          }`}
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
                className={`flex items-center p-2 rounded ${
                  activeTab === item.id ? 'bg-[#5A4E69]' : 'hover:bg-[#5A4E69]'
                }`}
                title={item.label}
              >
                {IconComponent && <IconComponent size={16} />}
              </button>
            );
          })}
          
          {/* More menu for remaining items */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="flex items-center p-2 rounded hover:bg-[#5A4E69]"
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
                        className={`w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                          activeTab === item.id ? 'bg-[#BED2D8] text-[#292929]' : ''
                        }`}
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
          <div className="hidden md:block text-right">
            <div className="text-sm font-medium">{userProfile?.name}</div>
            <div className="text-xs text-[#BED2D8] capitalize">{userProfile?.role?.replace('_', ' ')}</div>
          </div>
          
          <button 
            onClick={handlePasswordModalClick} 
            className="flex items-center space-x-1 hover:bg-[#5A4E69] px-2 py-2 rounded"
            title="Change Password"
          >
            <Key size={16} />
            <span className="hidden lg:inline">Password</span>
          </button>
          
          <button 
            onClick={handleLogoutClick} 
            className="flex items-center space-x-1 hover:bg-[#5A4E69] px-2 py-2 rounded"
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
        <div className="md:hidden mt-4 space-y-2 border-t border-[#5A4E69] pt-4">
          {navigationItems.map(item => {
            const IconComponent = iconMap[item.icon];
            return (
              <button 
                key={item.id}
                onClick={() => handleTabClick(item.id)} 
                className={`w-full text-left flex items-center space-x-2 px-3 py-2 rounded ${
                  activeTab === item.id ? 'bg-[#5A4E69]' : 'hover:bg-[#5A4E69]'
                }`}
              >
                {IconComponent && <IconComponent size={18} />}
                <span>{item.label}</span>
              </button>
            );
          })}
          
          <div className="border-t border-[#5A4E69] pt-2 mt-2">
            <button 
              onClick={handlePasswordModalClick} 
              className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded hover:bg-[#5A4E69]"
            >
              <Key size={18} />
              <span>Change Password</span>
            </button>
            
            <button 
              onClick={handleLogoutClick} 
              className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded hover:bg-[#5A4E69]"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;