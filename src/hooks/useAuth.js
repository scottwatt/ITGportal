// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { 
  loginUser, 
  logoutUser, 
  getUserProfile, 
  subscribeToAuthState,
  changeUserPassword 
} from '../services/firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          const profile = await getUserProfile(firebaseUser);
          setUserProfile(profile);
          setError(null);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setError('Failed to load user profile');
          
          // Set basic profile as fallback
          setUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.email?.split('@')[0] || 'User',
            role: 'client'
          });
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setError(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      await loginUser(email, password);
      // User state will be updated by the auth listener
    } catch (error) {
      setError(error.message || 'Login failed. Please check your credentials.');
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await logoutUser();
      // User state will be updated by the auth listener
    } catch (error) {
      setError(error.message || 'Logout failed');
      throw error;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      const result = await changeUserPassword(user, currentPassword, newPassword);
      return result;
    } catch (error) {
      setError(error.message || 'Failed to change password');
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Helper methods for role checking
  const isRole = (role) => userProfile?.role === role;

  return {
    // State
    user,
    userProfile,
    loading,
    error,

    // Actions
    login,
    logout,
    changePassword,
    clearError,

    // Computed properties
    isAuthenticated: !!user,
    isAdmin: isRole('admin'),
    isCoach: isRole('coach'), 
    isScheduler: isRole('scheduler'),
    isClient: isRole('client'),

    // Role checking helper
    hasRole: isRole,
    
    // User info helpers
    userName: userProfile?.name || user?.email?.split('@')[0] || 'User',
    userEmail: userProfile?.email || user?.email,
    userRole: userProfile?.role || 'client'
  };
};