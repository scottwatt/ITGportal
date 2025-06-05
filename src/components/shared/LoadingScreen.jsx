// src/components/shared/LoadingScreen.jsx
import React from 'react';
import { Building2 } from 'lucide-react';

const LoadingScreen = ({ message = 'Loading ITG Coach Portal...' }) => {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
      <div className="text-center">
        <div className="bg-[#BED2D8] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Building2 className="text-[#6D858E]" size={40} />
        </div>
        
        <div className="space-y-2">
          <div className="text-xl font-semibold text-[#292929]">{message}</div>
          <div className="text-sm text-[#707070]">Independence Through Grace</div>
        </div>
        
        {/* Loading animation */}
        <div className="flex justify-center mt-6">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-[#6D858E] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[#6D858E] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-[#6D858E] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;