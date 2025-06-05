// src/services/firebase/authRest.js
// Firebase Auth REST API for creating users without affecting current session

const FIREBASE_API_KEY = process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyC7Tfqtze215aggwIGsuLcD7--mClDnYiE';
const FIREBASE_AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
const FIREBASE_RESET_URL = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`;

/**
 * Create a new user account using Firebase Auth REST API
 * This doesn't affect the current admin session
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name (optional)
 * @returns {Promise<Object>} Created user info
 */
export const createUserWithRestAPI = async (email, password, displayName = '') => {
  try {
    console.log('Creating user with REST API:', email);
    
    const response = await fetch(FIREBASE_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        displayName: displayName,
        returnSecureToken: true
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Handle Firebase Auth errors
      const errorCode = data.error?.message || 'UNKNOWN_ERROR';
      console.error('Firebase Auth REST API error:', errorCode, data);
      
      switch (errorCode) {
        case 'EMAIL_EXISTS':
          throw new Error(`An account with email ${email} already exists.`);
        case 'INVALID_EMAIL':
          throw new Error('Invalid email address format.');
        case 'WEAK_PASSWORD':
          throw new Error('Password is too weak. Please use a stronger password.');
        case 'MISSING_PASSWORD':
          throw new Error('Password is required.');
        default:
          throw new Error(`Failed to create account: ${errorCode}`);
      }
    }
    
    console.log('User created successfully:', data.localId);
    
    return {
      uid: data.localId,
      email: data.email,
      idToken: data.idToken,
      refreshToken: data.refreshToken
    };
    
  } catch (error) {
    console.error('Error creating user with REST API:', error);
    throw error;
  }
};

/**
 * Send password reset email using Firebase Auth REST API
 * @param {string} email - User email
 * @returns {Promise<boolean>} Success status
 */
export const sendPasswordResetWithRestAPI = async (email) => {
  try {
    console.log('Sending password reset email:', email);
    
    const response = await fetch(FIREBASE_RESET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email: email
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      const errorCode = data.error?.message || 'UNKNOWN_ERROR';
      console.error('Password reset error:', errorCode, data);
      
      switch (errorCode) {
        case 'EMAIL_NOT_FOUND':
          throw new Error('No account found with this email address.');
        case 'INVALID_EMAIL':
          throw new Error('Invalid email address format.');
        default:
          throw new Error(`Failed to send password reset: ${errorCode}`);
      }
    }
    
    console.log('Password reset email sent successfully');
    return true;
    
  } catch (error) {
    console.error('Error sending password reset:', error);
    throw error;
  }
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long.' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password must be less than 128 characters long.' };
  }
  
  return { isValid: true, message: 'Password is valid.' };
};