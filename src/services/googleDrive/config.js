// src/services/googleDrive/config.js
// Google Drive API Configuration

export const googleDriveConfig = {
  // Replace with your Google API Console credentials
  apiKey: process.env.REACT_APP_GOOGLE_DRIVE_API_KEY || 'YOUR_GOOGLE_DRIVE_API_KEY',
  clientId: process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID || 'YOUR_GOOGLE_DRIVE_CLIENT_ID',
  
  // Required scopes for Google Drive integration
  scopes: [
    'https://www.googleapis.com/auth/drive.file', // Manage files that the app has opened or created
    'https://www.googleapis.com/auth/drive', // Full access to Drive (needed for folder management)
  ],
  
  // Discovery document for Drive API
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  
  // Default folder structure
  mainFolderName: 'ITG Client Files',
  
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
  ]
};

/**
 * Validate Google Drive configuration
 */
export const validateGoogleDriveConfig = () => {
  const errors = [];
  
  if (!googleDriveConfig.apiKey || googleDriveConfig.apiKey === 'YOUR_GOOGLE_DRIVE_API_KEY') {
    errors.push('Google Drive API Key is not configured');
  }
  
  if (!googleDriveConfig.clientId || googleDriveConfig.clientId === 'YOUR_GOOGLE_DRIVE_CLIENT_ID') {
    errors.push('Google Drive Client ID is not configured');
  }
  
  return {
    isValid: errors.length === 0,
    errors
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

export default googleDriveConfig;