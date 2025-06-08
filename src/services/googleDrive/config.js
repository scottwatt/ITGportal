// src/services/googleDrive/config.js
// CORRECTED: Google Drive API requires OAuth2, not API keys

export const googleDriveConfig = {
  // Only Client ID is needed for Google Drive API
  clientId: process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID,
  
  // API Key is NOT used for Google Drive API (OAuth2 only)
  // Keeping this for compatibility but it won't be used
  apiKey: process.env.REACT_APP_GOOGLE_DRIVE_API_KEY,
  
  // Required scopes for Google Drive integration
  scopes: [
    'https://www.googleapis.com/auth/drive.file', // Manage files that the app has opened or created
    'https://www.googleapis.com/auth/drive', // Full access to Drive (needed for folder management)
  ],
  
  // Discovery document for Drive API
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  
  // Folder structure configuration
  mainFolderName: 'ITG Client Files',
  useSharedDrive: process.env.REACT_APP_USE_SHARED_DRIVE !== 'false',
  
  // File upload settings
  maxFileSize: 100 * 1024 * 1024, // 100MB limit
  allowedFileTypes: [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Documents
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Spreadsheets
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv',
    // Archives
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    // Text files
    'text/plain', 'text/html', 'text/css', 'application/javascript',
    // Other common types
    'application/json', 'application/xml'
  ],
  
  // Debugging options
  debug: process.env.NODE_ENV === 'development'
};

/**
 * Validate Google Drive configuration
 */
export const validateGoogleDriveConfig = () => {
  const errors = [];
  const warnings = [];
  
  if (!googleDriveConfig.clientId) {
    errors.push('REACT_APP_GOOGLE_DRIVE_CLIENT_ID environment variable is not set');
  }
  
  // Check if running on localhost without HTTPS (for development)
  if (window.location.protocol === 'http:' && !window.location.hostname.includes('localhost')) {
    warnings.push('Google Drive API requires HTTPS in production');
  }
  
  // Check if credentials look like placeholders
  if (googleDriveConfig.clientId && googleDriveConfig.clientId.includes('YOUR_')) {
    errors.push('Google Drive Client ID appears to be a placeholder');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasCredentials: !!googleDriveConfig.clientId
  };
};

/**
 * Check if file type is allowed
 */
export const isFileTypeAllowed = (mimeType) => {
  return googleDriveConfig.allowedFileTypes.includes(mimeType);
};

/**
 * Check if file size is within limits
 */
export const isFileSizeValid = (fileSize) => {
  return fileSize <= googleDriveConfig.maxFileSize;
};

/**
 * Log configuration status (for debugging)
 */
export const logConfigStatus = () => {
  if (!googleDriveConfig.debug) return;
  
  const validation = validateGoogleDriveConfig();
  
  console.group('🔧 Google Drive Configuration Status');
  console.log('Client ID:', googleDriveConfig.clientId ? '✅ Set' : '❌ Missing');
  console.log('Use Shared Drive:', googleDriveConfig.useSharedDrive ? '✅ Yes' : '⚠️ No (regular folders)');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Protocol:', window.location.protocol);
  console.log('Hostname:', window.location.hostname);
  
  console.log('⚠️ NOTE: Google Drive API uses OAuth2 only (no API key needed)');
  
  if (validation.errors.length > 0) {
    console.group('❌ Configuration Errors:');
    validation.errors.forEach(error => console.error('-', error));
    console.groupEnd();
  }
  
  if (validation.warnings.length > 0) {
    console.group('⚠️ Configuration Warnings:');
    validation.warnings.forEach(warning => console.warn('-', warning));
    console.groupEnd();
  }
  
  console.groupEnd();
};

export default googleDriveConfig;