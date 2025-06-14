// src/components/auth/LoginScreen.jsx - With Fun Background
import React, { useState } from 'react';
import ITGLogo from '../shared/ITGLogo.jsx'

const LoginScreen = ({ onLogin, error: authError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Use auth error if provided, otherwise use local error
  const displayError = authError || error;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Fun Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-90"
          style={{
            background: 'linear-gradient(45deg, #6D858E, #5A4E69, #BED2D8, #6D858E)',
            backgroundSize: '400% 400%',
            animation: 'gradientShift 15s ease infinite'
          }}
        ></div>
        <style jsx>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </div>

      {/* Login Modal - Exactly the same as before */}
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          {/* Logo section */}
          <div className="flex justify-center mb-6">
            <ITGLogo size="xxl" showTagline={false} />
          </div>
          <h1 className="text-2xl font-bold text-[#292929] mb-2">Coach Portal</h1>
          <p className="text-sm text-[#9B97A2]">Supporting Adult Entrepreneurs with Disabilities</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {displayError}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-[#292929] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-[#9B97A2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#292929] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[#9B97A2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6D858E] text-white py-2 px-4 rounded-md hover:bg-[#5A4E69] focus:outline-none focus:ring-2 focus:ring-[#6D858E] focus:ring-offset-2 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In to ITG Portal'}
          </button>
        </form>
        
        <div className="mt-6 p-4 bg-[#F5F5F5] rounded-md">
          <p className="text-sm text-[#707070] mb-2">For ITG Staff & Clients</p>
          <p className="text-xs text-[#9B97A2]">Contact admin for account setup</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;