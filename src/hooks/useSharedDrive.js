// src/hooks/useSharedDrive.js
import { useState, useEffect, useCallback } from 'react';
import { sharedDriveService } from '../services/googleDrive/sharedDriveService';

export const useSharedDrive = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  // Initialize on mount
  useEffect(() => {
    initializeSharedDrive();
  }, []);

  /**
   * Initialize Google Workspace Shared Drive
   */
  const initializeSharedDrive = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🏢 Initializing Google Workspace Shared Drive...');
      
      const success = await sharedDriveService.initialize();
      
      setIsAvailable(success);
      setIsInitialized(true);
      
      if (success) {
        console.log('✅ Google Workspace Shared Drive ready');
        
        // Check if already authenticated
        if (window.gapi && window.gapi.auth2) {
          const authInstance = window.gapi.auth2.getAuthInstance();
          if (authInstance && authInstance.isSignedIn.get()) {
            const user = authInstance.currentUser.get();
            const profile = user.getBasicProfile();
            setCurrentUser({
              email: profile.getEmail(),
              name: profile.getName(),
              picture: profile.getImageUrl()
            });
            setIsAuthenticated(true);
            console.log(`✅ Already authenticated as: ${profile.getEmail()}`);
          }
        }
      } else {
        console.log('❌ Google Workspace Shared Drive not available');
      }
    } catch (err) {
      console.error('🚨 Shared Drive initialization failed:', err);
      setError(`Shared Drive unavailable: ${err.message}`);
      setIsAvailable(false);
      setIsInitialized(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Authenticate with Google Workspace
   */
  const authenticate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isAvailable) {
        throw new Error('Google Workspace Shared Drive is not available. Please check your configuration.');
      }

      console.log('👤 Starting Google Workspace authentication...');
      await sharedDriveService.authenticate();
      
      // Get user info
      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = authInstance.currentUser.get();
      const profile = user.getBasicProfile();
      
      setCurrentUser({
        email: profile.getEmail(),
        name: profile.getName(),
        picture: profile.getImageUrl()
      });
      setIsAuthenticated(true);
      
      console.log(`✅ Authenticated as: ${profile.getEmail()}`);
      return true;
    } catch (err) {
      console.error('❌ Authentication failed:', err);
      setError(`Authentication failed: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAvailable]);

  /**
   * List files in client folder
   */
  const listClientFiles = useCallback(async (clientId, clientName) => {
    try {
      setLoading(true);
      setError(null);

      if (!isAvailable) {
        console.log('Shared Drive not available - returning empty file list');
        return [];
      }

      if (!isAuthenticated) {
        const authSuccess = await authenticate();
        if (!authSuccess) {
          return [];
        }
      }

      const files = await sharedDriveService.listClientFiles(clientId, clientName);
      console.log(`📁 Found ${files.length} files for ${clientName}`);
      return files;
    } catch (err) {
      console.error('Failed to list client files:', err);
      setError(`Failed to list files: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAvailable, isAuthenticated, authenticate]);

  /**
   * Upload file to client folder
   */
  const uploadFileToClient = useCallback(async (clientId, clientName, file) => {
    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);

      if (!isAvailable) {
        throw new Error('Google Workspace Shared Drive is not available');
      }

      // File validation
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        throw new Error('File size exceeds 100MB limit');
      }

      if (!isAuthenticated) {
        const authSuccess = await authenticate();
        if (!authSuccess) {
          throw new Error('Authentication required');
        }
      }

      console.log(`📤 Uploading ${file.name} to ${clientName}'s folder...`);
      
      const result = await sharedDriveService.uploadFileToClient(
        clientId, 
        clientName, 
        file, 
        (progress) => setUploadProgress(progress)
      );

      setUploadProgress(100);
      console.log(`✅ Upload completed: ${file.name}`);
      return result;
    } catch (err) {
      console.error('Upload failed:', err);
      setError(`Upload failed: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  }, [isAvailable, isAuthenticated, authenticate]);

  /**
   * Upload multiple files
   */
  const uploadMultipleFiles = useCallback(async (clientId, clientName, files) => {
    if (!isAvailable) {
      return { 
        results: [], 
        errors: files.map(f => ({ file: f.name, error: 'Shared Drive not available' }))
      };
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await uploadFileToClient(clientId, clientName, files[i]);
        results.push(result);
      } catch (err) {
        errors.push({ file: files[i].name, error: err.message });
      }
    }

    return { results, errors };
  }, [uploadFileToClient, isAvailable]);

  /**
   * Delete file from client folder
   */
  const deleteClientFile = useCallback(async (fileId, fileName) => {
    try {
      setLoading(true);
      setError(null);

      if (!isAvailable) {
        throw new Error('Google Workspace Shared Drive is not available');
      }

      if (!isAuthenticated) {
        const authSuccess = await authenticate();
        if (!authSuccess) {
          throw new Error('Authentication required');
        }
      }

      console.log(`🗑️ Deleting ${fileName}...`);
      const success = await sharedDriveService.deleteClientFile(fileId);
      
      if (success) {
        console.log(`✅ Deleted ${fileName}`);
      }
      
      return success;
    } catch (err) {
      console.error('Delete failed:', err);
      setError(`Delete failed: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAvailable, isAuthenticated, authenticate]);

  /**
   * Get file download/view URLs
   */
  const getFileUrls = useCallback(async (fileId) => {
    try {
      if (!isAvailable) {
        throw new Error('Google Workspace Shared Drive is not available');
      }

      if (!isAuthenticated) {
        const authSuccess = await authenticate();
        if (!authSuccess) {
          throw new Error('Authentication required');
        }
      }

      // For shared drives, we can use the webViewLink and webContentLink directly
      // These are already provided in the file list
      return {
        viewLink: `https://drive.google.com/file/d/${fileId}/view`,
        downloadLink: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
      };
    } catch (err) {
      console.error('Failed to get file URLs:', err);
      setError(`Failed to get file links: ${err.message}`);
      return null;
    }
  }, [isAvailable, isAuthenticated, authenticate]);

  /**
   * Share client folder with client
   */
  const shareClientFolder = useCallback(async (clientId, clientName, clientEmail) => {
    try {
      setLoading(true);
      setError(null);

      if (!isAvailable) {
        console.log('Shared Drive not available - cannot share folder');
        return null;
      }

      if (!isAuthenticated) {
        const authSuccess = await authenticate();
        if (!authSuccess) {
          throw new Error('Authentication required');
        }
      }

      console.log(`🤝 Sharing ${clientName}'s folder with ${clientEmail}...`);
      const folderId = await sharedDriveService.shareClientFolder(clientId, clientName, clientEmail);
      
      if (folderId) {
        console.log(`✅ Folder shared with ${clientEmail}`);
      }
      
      return folderId;
    } catch (err) {
      console.error('Folder sharing failed:', err);
      setError(`Folder sharing failed: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAvailable, isAuthenticated, authenticate]);

  /**
   * Sign out from Google Workspace
   */
  const signOut = useCallback(async () => {
    try {
      await sharedDriveService.signOut();
      setIsAuthenticated(false);
      setCurrentUser(null);
      console.log('✅ Signed out from Google Workspace');
    } catch (err) {
      console.error('Sign out failed:', err);
      setError(`Sign out failed: ${err.message}`);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Retry initialization
   */
  const retry = useCallback(async () => {
    setError(null);
    await initializeSharedDrive();
  }, []);

  /**
   * File validation utilities
   */
  const isFileTypeAllowed = useCallback((mimeType) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv',
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
      'text/plain', 'text/html', 'text/css', 'application/javascript',
      'application/json', 'application/xml'
    ];
    return allowedTypes.includes(mimeType);
  }, []);

  const isFileSizeValid = useCallback((fileSize) => {
    return fileSize <= 100 * 1024 * 1024; // 100MB limit
  }, []);

  return {
    // State
    isInitialized,
    isAuthenticated,
    isAvailable,
    loading,
    error,
    uploadProgress,
    currentUser,

    // Actions
    authenticate,
    listClientFiles,
    uploadFileToClient,
    uploadMultipleFiles,
    deleteClientFile,
    getFileUrls,
    shareClientFolder,
    signOut,
    clearError,
    retry,

    // Utilities
    isFileTypeAllowed,
    isFileSizeValid,
    formatFileSize: sharedDriveService.formatFileSize.bind(sharedDriveService)
  };
};