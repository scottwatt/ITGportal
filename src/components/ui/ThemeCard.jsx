// src/components/ui/ThemeCard.jsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeCard = ({ 
  children, 
  className = '', 
  padding = 'medium',
  shadow = 'medium',
  hover = false,
  clickable = false,
  onClick,
  variant = 'default',
  ...props 
}) => {
  const { getCurrentTheme, currentTheme } = useTheme();
  const themeData = getCurrentTheme();
  
  const baseClasses = 'rounded-lg border transition-all duration-300';
  
  const paddings = {
    none: '',
    small: 'p-3',
    medium: 'p-6',
    large: 'p-8'
  };
  
  const shadows = {
    none: '',
    small: 'shadow-sm',
    medium: 'shadow-md',
    large: 'shadow-lg',
    xlarge: 'shadow-xl'
  };
  
  const hoverClasses = hover ? 'hover:shadow-lg transition-shadow duration-200' : '';
  const clickableClasses = clickable || onClick ? 'cursor-pointer' : '';
  
  // Theme-specific styling
  const getThemeClasses = () => {
    switch (currentTheme) {
      case 'christmas':
        return 'christmas-sparkle border-red-200';
      case 'halloween':
        return 'halloween-glow border-orange-300';
      case 'fourthOfJuly':
        return 'border-blue-200';
      case 'stPatricks':
        return 'stpatricks-bounce border-green-200';
      case 'valentine':
        return 'valentine-pulse border-pink-200';
      case 'thanksgiving':
        return 'thanksgiving-warm border-yellow-200';
      default:
        return 'border-gray-200';
    }
  };
  
  const getCardStyle = () => {
    const style = {
      backgroundColor: themeData.colors.white,
      borderColor: themeData.colors.accent,
    };
    
    // Special styling for variants
    if (variant === 'primary') {
      style.background = `linear-gradient(135deg, ${themeData.colors.primary}15 0%, ${themeData.colors.accent}25 100%)`;
    } else if (variant === 'secondary') {
      style.background = `linear-gradient(135deg, ${themeData.colors.secondary}15 0%, ${themeData.colors.accent}25 100%)`;
    }
    
    return style;
  };
  
  const classes = `${baseClasses} ${paddings[padding]} ${shadows[shadow]} ${hoverClasses} ${clickableClasses} ${getThemeClasses()} ${className}`;
  
  return (
    <div 
      className={classes} 
      style={getCardStyle()}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

// Theme-aware Stats Card
export const ThemeStatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  subtitle,
  trend,
  trendDirection,
  className = '',
  ...props 
}) => {
  const { getCurrentTheme } = useTheme();
  const themeData = getCurrentTheme();
  
  const trendColors = {
    up: '#22C55E',
    down: '#EF4444',
    neutral: themeData.colors.textMuted
  };
  
  return (
    <ThemeCard className={className} hover {...props}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: themeData.colors.textSecondary }}>
            {title}
          </p>
          <p className="text-3xl font-bold" style={{ color: themeData.colors.primary }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: themeData.colors.textMuted }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className="text-sm mt-1" style={{ color: trendColors[trendDirection] || trendColors.neutral }}>
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <Icon size={40} style={{ color: themeData.colors.primary }} />
        )}
      </div>
    </ThemeCard>
  );
};

// Theme-aware Button
export const ThemeButton = ({ 
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const { getCurrentTheme, currentTheme } = useTheme();
  const themeData = getCurrentTheme();
  
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizes = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base',
    xlarge: 'px-8 py-4 text-lg'
  };
  
  const iconSizes = {
    small: 12,
    medium: 16,
    large: 20,
    xlarge: 24
  };
  
  const getButtonStyle = () => {
    const style = {
      transition: 'all 0.3s ease',
    };
    
    switch (variant) {
      case 'primary':
        style.backgroundColor = themeData.colors.primary;
        style.color = 'white';
        if (!disabled) {
          style[':hover'] = { backgroundColor: themeData.colors.secondary };
        }
        break;
      case 'secondary':
        style.backgroundColor = themeData.colors.secondary;
        style.color = 'white';
        break;
      case 'outline':
        style.borderColor = themeData.colors.primary;
        style.color = themeData.colors.primary;
        style.border = `2px solid ${themeData.colors.primary}`;
        style.backgroundColor = 'transparent';
        break;
      default:
        style.backgroundColor = themeData.colors.primary;
        style.color = 'white';
    }
    
    return style;
  };
  
  // Add theme-specific effects
  const getThemeEffectClasses = () => {
    switch (currentTheme) {
      case 'christmas':
        return 'christmas-sparkle';
      case 'halloween':
        return 'halloween-glow';
      case 'stPatricks':
        return 'stpatricks-bounce';
      case 'valentine':
        return 'valentine-pulse';
      default:
        return '';
    }
  };
  
  const classes = `${baseClasses} ${sizes[size]} ${getThemeEffectClasses()} ${className}`;
  
  return (
    <button 
      className={classes}
      style={getButtonStyle()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div 
          className="animate-spin rounded-full border-b-2 border-current mr-2" 
          style={{ width: iconSizes[size], height: iconSizes[size] }} 
        />
      ) : Icon ? (
        <Icon size={iconSizes[size]} className="mr-2" />
      ) : null}
      {children}
    </button>
  );
};

// Theme-aware Alert
export const ThemeAlert = ({ 
  type = 'info', 
  title, 
  children, 
  icon: Icon,
  className = '',
  ...props 
}) => {
  const { getCurrentTheme } = useTheme();
  const themeData = getCurrentTheme();
  
  const typeStyles = {
    info: {
      bg: `${themeData.colors.primary}15`,
      border: themeData.colors.primary,
      text: themeData.colors.text,
      icon: themeData.colors.primary
    },
    success: {
      bg: '#22C55E15',
      border: '#22C55E',
      text: themeData.colors.text,
      icon: '#22C55E'
    },
    warning: {
      bg: '#F59E0B15',
      border: '#F59E0B',
      text: themeData.colors.text,
      icon: '#F59E0B'
    },
    error: {
      bg: '#EF444415',
      border: '#EF4444',
      text: themeData.colors.text,
      icon: '#EF4444'
    }
  };
  
  const styles = typeStyles[type];
  
  return (
    <div 
      className={`border rounded-lg p-4 transition-all duration-300 ${className}`}
      style={{
        backgroundColor: styles.bg,
        borderColor: styles.border,
        color: styles.text
      }}
      {...props}
    >
      <div className="flex items-start">
        {Icon && (
          <div className="flex-shrink-0">
            <Icon className="h-5 w-5" style={{ color: styles.icon }} />
          </div>
        )}
        <div className={`${Icon ? 'ml-3' : ''} flex-1`}>
          {title && (
            <h4 className="font-medium mb-1" style={{ color: styles.text }}>
              {title}
            </h4>
          )}
          <div className="text-sm" style={{ color: styles.text }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCard;