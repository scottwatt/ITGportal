// src/components/admin/AdminThemeSettings.jsx - Admin theme management
import React from 'react';
import { Palette, Globe, Crown, Info, AlertTriangle } from 'lucide-react';
import { useGlobalTheme } from '../../contexts/GlobalThemeContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { AlertCard } from '../ui/Card';

const AdminThemeSettings = () => {
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

  if (!canChangeTheme) {
    return (
      <AlertCard type="warning" icon={AlertTriangle} title="Access Denied">
        You don't have permission to manage global themes. Only administrators can change portal-wide themes.
      </AlertCard>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D858E]"></div>
            <span className="ml-3 text-[#707070]">Loading theme settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentThemeData = getCurrentTheme();

  const formatLastChanged = () => {
    if (!lastChangedAt || !lastChangedBy) return 'Never changed';
    
    const date = new Date(lastChangedAt);
    const timeStr = date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
    const who = lastChangedBy.name || lastChangedBy.email;
    
    return `${timeStr} by ${who}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg">
        <div className="flex items-center space-x-3">
          <Crown size={28} />
          <Globe size={28} />
          <Palette size={28} />
          <div>
            <h2 className="text-2xl font-bold">Global Theme Management</h2>
            <p className="text-purple-100 mt-1">Control the portal-wide theme for all users</p>
          </div>
        </div>
      </div>

      {/* Important Warning */}
      <AlertCard type="warning" icon={AlertTriangle} title="Global Theme Warning">
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Theme changes affect ALL portal users immediately</li>
          <li>Use holiday themes sparingly and considerately</li>
          <li>Consider accessibility and user experience</li>
          <li>Changes are logged and tracked</li>
        </ul>
      </AlertCard>

      {/* Current Theme Status */}
      <Card>
        <CardHeader divider>
          <CardTitle icon={Globe}>Current Global Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">{currentThemeData.emoji}</span>
              <div>
                <h3 className="text-xl font-semibold text-[#292929]">{currentThemeData.name}</h3>
                <p className="text-[#707070]">Active for all portal users</p>
                <p className="text-sm text-[#9B97A2] mt-1">
                  Last changed: {formatLastChanged()}
                </p>
              </div>
            </div>
            
            {/* Color Preview */}
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-2">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: currentThemeData.colors.primary }}
                  title="Primary Color"
                />
                <div 
                  className="w-6 h-6 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: currentThemeData.colors.secondary }}
                  title="Secondary Color"
                />
                <div 
                  className="w-6 h-6 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: currentThemeData.colors.accent }}
                  title="Accent Color"
                />
              </div>
              <p className="text-xs text-[#9B97A2] text-center">Theme Colors</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Themes */}
      <Card>
        <CardHeader divider>
          <CardTitle icon={Palette}>Available Themes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(themes).map((theme) => (
              <ThemePreviewCard
                key={theme.id}
                theme={theme}
                isActive={currentTheme === theme.id}
                onSelect={() => changeGlobalTheme(theme.id)}
              />
            ))}
          </div>
          
          {/* Reset Option */}
          {currentTheme !== 'default' && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={resetToDefault}
                className="flex items-center space-x-2 px-4 py-2 text-[#707070] hover:text-[#292929] hover:bg-gray-100 rounded-md transition-colors"
              >
                <Globe size={16} />
                <span>Reset to Default ITG Theme</span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme Information */}
      <Card>
        <CardHeader divider>
          <CardTitle icon={Info}>Theme System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-[#292929] mb-2">What Global Themes Affect:</h4>
              <ul className="list-disc list-inside space-y-1 text-[#707070]">
                <li>Navigation bars and headers</li>
                <li>Buttons and interactive elements</li>
                <li>Cards and content areas</li>
                <li>Holiday animations and special effects</li>
                <li>Overall color scheme and branding</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-[#292929] mb-2">Best Practices:</h4>
              <ul className="list-disc list-inside space-y-1 text-[#707070]">
                <li>Use holiday themes only during appropriate seasons</li>
                <li>Test themes before applying during business hours</li>
                <li>Consider users with visual sensitivities</li>
                <li>Return to default theme after special occasions</li>
                <li>Communicate theme changes to staff when appropriate</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Theme Preview Card Component
const ThemePreviewCard = ({ theme, isActive, onSelect }) => {
  return (
    <div 
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{theme.emoji}</span>
        {isActive && (
          <div className="flex items-center space-x-1 text-blue-600 text-sm font-medium">
            <Globe size={12} />
            <span>Active</span>
          </div>
        )}
      </div>
      
      <h4 className="font-medium text-[#292929] mb-2">{theme.name}</h4>
      
      {/* Color preview */}
      <div className="flex space-x-1 mb-3">
        <div 
          className="w-4 h-4 rounded-full border border-gray-300"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <div 
          className="w-4 h-4 rounded-full border border-gray-300"
          style={{ backgroundColor: theme.colors.secondary }}
        />
        <div 
          className="w-4 h-4 rounded-full border border-gray-300"
          style={{ backgroundColor: theme.colors.accent }}
        />
      </div>
      
      {!isActive && (
        <button className="w-full text-sm text-[#6D858E] hover:text-[#5A4E69] font-medium">
          Apply Theme
        </button>
      )}
    </div>
  );
};

export default AdminThemeSettings;