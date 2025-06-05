// src/components/ui/Button.jsx
import React from 'react';

const Button = ({ 
  variant = 'primary', 
  size = 'medium', 
  children, 
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#6D858E] text-white hover:bg-[#5A4E69] focus:ring-[#6D858E]',
    secondary: 'bg-[#9B97A2] text-white hover:bg-[#707070] focus:ring-[#9B97A2]',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    outline: 'border border-[#6D858E] text-[#6D858E] hover:bg-[#6D858E] hover:text-white focus:ring-[#6D858E]',
    ghost: 'text-[#6D858E] hover:bg-[#BED2D8] focus:ring-[#6D858E]',
    link: 'text-[#6D858E] hover:text-[#5A4E69] hover:underline focus:ring-[#6D858E] bg-transparent'
  };
  
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
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button 
      type={type}
      className={classes} 
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className={`animate-spin rounded-full border-b-2 border-current mr-2`} 
             style={{ width: iconSizes[size], height: iconSizes[size] }} />
      ) : Icon ? (
        <Icon size={iconSizes[size]} className="mr-2" />
      ) : null}
      {children}
    </button>
  );
};

// Specific button variants for common use cases
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;
export const SuccessButton = (props) => <Button variant="success" {...props} />;
export const OutlineButton = (props) => <Button variant="outline" {...props} />;
export const GhostButton = (props) => <Button variant="ghost" {...props} />;
export const LinkButton = (props) => <Button variant="link" {...props} />;

// Icon-only button variant
export const IconButton = ({ icon: Icon, size = 'medium', ...props }) => {
  const iconSizes = {
    small: 12,
    medium: 16,
    large: 20,
    xlarge: 24
  };
  
  const buttonSizes = {
    small: 'p-1',
    medium: 'p-2',
    large: 'p-3',
    xlarge: 'p-4'
  };
  
  return (
    <Button 
      size={size}
      className={`${buttonSizes[size]} !px-0`}
      {...props}
    >
      <Icon size={iconSizes[size]} />
    </Button>
  );
};

export default Button;