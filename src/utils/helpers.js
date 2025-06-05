// src/utils/helpers.js - Updated password generation functions
import { PASSWORD_CHARS, FILE_TYPE_MAPPINGS, FILE_ICONS } from './constants';

/**
 * Generate a temporary password for new users
 * @param {string} userType - 'client' or 'coach' (default: 'client')
 * @param {number} length - Password length (default: 8, ignored when using fixed passwords)
 * @returns {string} Generated password
 */
export const generateTempPassword = (userType = 'client', length = 8) => {
  // Use fixed passwords based on user type
  if (userType === 'coach') {
    return 'ITGemployee123';
  } else if (userType === 'client') {
    return 'ITGclient123';
  }
  
  // Fallback to random password generation (shouldn't be used with current setup)
  let password = '';
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARS.charAt(Math.floor(Math.random() * PASSWORD_CHARS.length));
  }
  return password;
};

/**
 * Get default password for user type
 * @param {string} userType - 'client' or 'coach'
 * @returns {string} Default password
 */
export const getDefaultPassword = (userType) => {
  return userType === 'coach' ? 'ITGemployee123' : 'ITGclient123';
};

// Rest of your existing helper functions remain the same...

/**
 * Get file icon based on file type
 * @param {string} fileType - File type
 * @returns {string} File icon emoji
 */
export const getFileIcon = (fileType) => {
  return FILE_ICONS[fileType] || FILE_ICONS.default;
};

/**
 * Determine file type from file extension
 * @param {string} fileName - File name with extension
 * @returns {string} File type category
 */
export const getFileTypeFromExtension = (fileName) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  for (const [type, extensions] of Object.entries(FILE_TYPE_MAPPINGS)) {
    if (extensions.includes(extension)) {
      return type;
    }
  }
  
  return 'document';
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
  return Math.round(bytes / 1048576 * 10) / 10 + ' MB';
};

/**
 * Get program display name
 * @param {string} programId - Program ID
 * @param {Array} programs - Programs array
 * @returns {string} Program display name
 */
export const getProgramDisplayName = (programId, programs) => {
  const program = programs.find(p => p.id === programId);
  return program ? program.name : 'Unknown Program';
};

/**
 * Get program badge text
 * @param {string} programId - Program ID
 * @returns {string} Badge text
 */
export const getProgramBadge = (programId) => {
  const badges = {
    'limitless': 'L',
    'new-options': 'NO',
    'bridges': 'B',
    'grace': 'G'
  };
  return badges[programId] || 'U';
};

/**
 * Get business description placeholder based on program
 * @param {string} programId - Program ID
 * @returns {string} Placeholder text
 */
export const getBusinessDescriptionPlaceholder = (programId) => {
  switch (programId) {
    case 'limitless':
      return 'Business Description';
    case 'new-options':
      return 'Job interests and community work goals';
    case 'bridges':
      return 'Career development and internship goals';
    case 'grace':
      return 'Enrichment program goals';
    default:
      return 'Program description and goals';
  }
};

/**
 * Get job goal placeholder based on program
 * @param {string} programId - Program ID
 * @returns {string} Placeholder text
 */
export const getJobGoalPlaceholder = (programId) => {
  switch (programId) {
    case 'limitless':
      return 'Business Type';
    case 'new-options':
      return 'Job Interest/Field';
    case 'bridges':
      return 'Career Goals/Skills';
    case 'grace':
      return 'Enrichment Activities';
    default:
      return 'Goals';
  }
};

/**
 * Filter schedulable clients (excludes Grace program)
 * @param {Array} clients - All clients
 * @returns {Array} Schedulable clients
 */
export const getSchedulableClients = (clients) => {
  return clients.filter(client => {
    const program = client.program || 'limitless';
    return ['limitless', 'new-options', 'bridges'].includes(program);
  });
};

/**
 * Get client initials for avatar
 * @param {string} name - Client name
 * @returns {string} Initials (max 2 characters)
 */
export const getClientInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

/**
 * Get coach type display name
 * @param {string} coachType - Coach type ID
 * @param {Array} coachTypes - Coach types array
 * @returns {string} Coach type display name
 */
export const getCoachTypeDisplayName = (coachType, coachTypes) => {
  const type = coachTypes.find(t => t.id === coachType);
  return type ? type.name : 'Unknown Coach Type';
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password must be less than 128 characters' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Clean form data by removing empty strings and trimming values
 * @param {Object} data - Form data
 * @returns {Object} Cleaned data
 */
export const cleanFormData = (data) => {
  const cleaned = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        cleaned[key] = trimmed;
      }
    } else if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const safeAsync = (asyncFn) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      console.error('Async operation failed:', error);
      throw error;
    }
  };
};

/**
 * Get error message from various error types
 * @param {Error|string|Object} error - Error object
 * @returns {string} Error message
 */
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.code) return `Error: ${error.code}`;
  return 'An unexpected error occurred';
};