// src/components/shared/ITGLogo.jsx - Updated to use real image
import React from 'react';

const ITGLogo = ({ 
  size = 'md', 
  className = '',
  showTagline = true
}) => {
  // Size configurations for the actual image
  const sizeConfig = {
    sm: {
      height: 'h-8',      // 32px
      maxWidth: 'max-w-[120px]'
    },
    md: {
      height: 'h-12',     // 48px  
      maxWidth: 'max-w-[180px]'
    },
    lg: {
      height: 'h-16',     // 64px
      maxWidth: 'max-w-[240px]'
    },
    xl: {
      height: 'h-20',     // 80px
      maxWidth: 'max-w-[300px]'
    },
    xxl: {
      height: 'h-24',     // 96px
      maxWidth: 'max-w-[360px]'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {/* Actual ITG Logo Image */}
      <img
        src="/itg-logo.png"  // Update this filename to match your actual file
        alt="Independence Through Grace Logo"
        className={`${config.height} w-auto ${config.maxWidth} object-contain`}
      />
         
    </div>
  );
};

export default ITGLogo;