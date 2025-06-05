// src/components/ui/Card.jsx
import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = 'medium',
  shadow = 'medium',
  hover = false,
  clickable = false,
  onClick,
  ...props 
}) => {
  const baseClasses = 'bg-white rounded-lg border border-gray-200';
  
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
  
  const classes = `${baseClasses} ${paddings[padding]} ${shadows[shadow]} ${hoverClasses} ${clickableClasses} ${className}`;
  
  return (
    <div 
      className={classes} 
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Header component
export const CardHeader = ({ 
  children, 
  className = '',
  divider = false,
  ...props 
}) => {
  const baseClasses = 'pb-4';
  const dividerClasses = divider ? 'border-b border-gray-200 mb-4' : '';
  const classes = `${baseClasses} ${dividerClasses} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

// Card Title component
export const CardTitle = ({ 
  children, 
  className = '',
  size = 'medium',
  icon: Icon,
  ...props 
}) => {
  const baseClasses = 'font-semibold text-[#292929] flex items-center';
  
  const sizes = {
    small: 'text-base',
    medium: 'text-xl',
    large: 'text-2xl'
  };
  
  const classes = `${baseClasses} ${sizes[size]} ${className}`;
  
  return (
    <h3 className={classes} {...props}>
      {Icon && <Icon className="mr-2 text-[#6D858E]" size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />}
      {children}
    </h3>
  );
};

// Card Content component
export const CardContent = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

// Card Footer component
export const CardFooter = ({ 
  children, 
  className = '',
  divider = false,
  justify = 'start',
  ...props 
}) => {
  const baseClasses = 'pt-4';
  const dividerClasses = divider ? 'border-t border-gray-200 mt-4' : '';
  
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around'
  };
  
  const classes = `${baseClasses} ${dividerClasses} ${justifyClasses[justify]} flex items-center ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

// Stats Card component for dashboard metrics
export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  subtitle,
  trend,
  trendDirection,
  className = '',
  ...props 
}) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-[#9B97A2]'
  };
  
  return (
    <Card className={className} hover {...props}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#707070] text-sm">{title}</p>
          <p className="text-3xl font-bold text-[#6D858E]">{value}</p>
          {subtitle && (
            <p className="text-sm text-[#9B97A2] mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-sm mt-1 ${trendColors[trendDirection] || trendColors.neutral}`}>
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <Icon className="text-[#6D858E]" size={40} />
        )}
      </div>
    </Card>
  );
};

// Alert Card component for notifications and messages
export const AlertCard = ({ 
  type = 'info', 
  title, 
  children, 
  icon: Icon,
  dismissible = false,
  onDismiss,
  className = '',
  ...props 
}) => {
  const typeStyles = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-600'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-600'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600'
    },
    itg: {
      bg: 'bg-[#BED2D8]',
      border: 'border-[#6D858E]',
      text: 'text-[#292929]',
      icon: 'text-[#6D858E]'
    }
  };
  
  const styles = typeStyles[type];
  const classes = `${styles.bg} ${styles.border} ${styles.text} border rounded-lg p-4 ${className}`;
  
  return (
    <div className={classes} {...props}>
      <div className="flex items-start">
        {Icon && (
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${styles.icon}`} />
          </div>
        )}
        <div className={`${Icon ? 'ml-3' : ''} flex-1`}>
          {title && (
            <h4 className="font-medium mb-1">{title}</h4>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={`ml-3 text-${type === 'itg' ? '[#6D858E]' : 'current'} hover:opacity-75`}
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Card;