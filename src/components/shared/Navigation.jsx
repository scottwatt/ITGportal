// src/components/shared/Navigation.jsx
import React from 'react';
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
  X 
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
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const handlePasswordModalClick = () => {
    onShowPasswordModal();
    setIsMobileMenuOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-[#6D858E] text-white p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">ITG Coach Portal</h1>
          <p className="text-xs text-[#BED2D8]">Independence Through Grace</p>
        </div>
        
        <div className="hidden md:flex space-x-6">
          {navigationItems.map(item => {
            const IconComponent = iconMap[item.icon];
            return (
              <button 
                key={item.id}
                onClick={() => handleTabClick(item.id)} 
                className={`flex items-center space-x-2 px-3 py-2 rounded ${
                  activeTab === item.id ? 'bg-[#5A4E69]' : 'hover:bg-[#5A4E69]'
                }`}
              >
                {IconComponent && <IconComponent size={18} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:block text-right">
            <div className="text-sm">{userProfile?.name}</div>
            <div className="text-xs text-[#BED2D8] capitalize">{userProfile?.role}</div>
          </div>
          
          <button 
            onClick={handlePasswordModalClick} 
            className="flex items-center space-x-1 hover:bg-[#5A4E69] px-3 py-2 rounded"
            title="Change Password"
          >
            <Key size={18} />
            <span className="hidden md:inline">Password</span>
          </button>
          
          <button 
            onClick={handleLogoutClick} 
            className="flex items-center space-x-1 hover:bg-[#5A4E69] px-3 py-2 rounded"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">Logout</span>
          </button>
          
          <button 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 space-y-2">
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
          
          <button 
            onClick={handlePasswordModalClick} 
            className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded hover:bg-[#5A4E69]"
          >
            <Key size={18} />
            <span>Change Password</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navigation;