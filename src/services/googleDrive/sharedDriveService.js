// src/services/googleDrive/sharedDriveService.js
// FIXED: COOP-compatible version using redirect-based OAuth instead of popup

class GoogleDriveService {
  constructor() {
    this.isReady = false;
    this.isSignedIn = false;
    this.authInstance = null;
    this.lastError = null;
    this.initPromise = null;
    
    // COOP Fix: Use redirect instead of popup
    this.useRedirectFlow = true;
  }

  /**
   * Initialize Google API and check for existing authentication
   */
  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  async _doInitialize() {
    try {
      console.log('🔧 Initializing Google Drive API...');

      // Load Google API
      if (!window.gapi) {
        await this._loadGoogleAPI();
      }

      // Initialize gapi
      await new Promise((resolve) => {
        window.gapi.load('auth2:client:drive', resolve);
      });

      // Get config from environment
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const apiKey = process.env.REACT_APP_GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

      if (!clientId || !apiKey) {
        throw new Error('Google API credentials not configured. Please set REACT_APP_GOOGLE_CLIENT_ID and REACT_APP_GOOGLE_API_KEY');
      }

      // Initialize auth2
      this.authInstance = await window.gapi.auth2.init({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file'
      });

      // Initialize client
      await window.gapi.client.init({
        apiKey: apiKey,
        clientId: clientId,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: 'https://www.googleapis.com/auth/drive.file'
      });

      // Check current sign-in status
      this.isSignedIn = this.authInstance.isSignedIn.get();
      this.isReady = true;

      if (this.isSignedIn) {
        console.log('✅ Already authenticated with Google Drive');
      } else {
        console.log('🔑 Google Drive ready - authentication required');
      }

      return true;
    } catch (error) {
      console.error('❌ Google Drive initialization failed:', error);
      this.lastError = error.message;
      this.isReady = false;
      return false;
    }
  }

  /**
   * Load Google API script
   */
  _loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve(window.gapi);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve(window.gapi);
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  /**
   * FIXED: Authenticate using redirect flow to avoid COOP issues
   */
  async authenticate(userInitiated = false) {
    try {
      if (!userInitiated) {
        throw new Error('Authentication requires user interaction');
      }

      if (!this.isReady) {
        console.log('🔧 Service not ready, initializing...');
        const success = await this.initialize();
        if (!success) {
          throw new Error('Failed to initialize Google Drive service');
        }
      }

      if (this.isSignedIn) {
        console.log('✅ Already signed in');
        return true;
      }

      console.log('🔑 Starting redirect-based authentication...');

      // COOP FIX: Use redirect flow instead of popup
      try {
        // First try the newer grantOfflineAccess method (works better with COOP)
        const response = await this.authInstance.grantOfflineAccess({
          scope: 'https://www.googleapis.com/auth/drive.file',
          prompt: 'consent'
        });
        
        if (response.code) {
          // Exchange code for tokens (this would typically be done on your backend)
          console.log('✅ Received authorization code');
          
          // For client-side, we can use the regular signIn after grantOfflineAccess
          const user = await this.authInstance.signIn({
            prompt: 'none' // Don't prompt again since we just got consent
          });
          
          this.isSignedIn = true;
          console.log('✅ Authentication successful');
          return true;
        }
      } catch (grantError) {
        console.log('⚠️ grantOfflineAccess failed, trying direct signIn...', grantError);
        
        // Fallback: Try direct signIn with redirect option
        const signInOptions = {
          scope: 'https://www.googleapis.com/auth/drive.file',
          prompt: 'select_account'
        };

        // COOP FIX: Force redirect flow by setting ux_mode
        if (this.useRedirectFlow) {
          signInOptions.ux_mode = 'redirect';
          signInOptions.redirect_uri = window.location.origin + window.location.pathname;
        }

        const user = await this.authInstance.signIn(signInOptions);
        this.isSignedIn = user.isSignedIn();
        
        if (this.isSignedIn) {
          console.log('✅ Authentication successful');
          return true;
        } else {
          throw new Error('Sign-in was not completed');
        }
      }
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      this.lastError = error.message;
      this.isSignedIn = false;
      
      // Provide user-friendly error message
      if (error.error === 'popup_blocked_by_browser') {
        throw new Error('Please allow popups for this site and try again');
      } else if (error.error === 'access_denied') {
        throw new Error('Google sign-in was cancelled. Please try again and grant the required permissions.');
      } else if (error.message.includes('Cross-Origin-Opener-Policy')) {
        throw new Error('Browser security settings are blocking authentication. Please try refreshing the page.');
      } else {
        throw new Error(`Authentication failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Alternative COOP-compatible authentication method
   */
  async authenticateWithRedirect() {
    try {
      if (!this.isReady) {
        await this.initialize();
      }

      // Redirect to Google OAuth
      const redirectUrl = this.authInstance.grantOfflineAccess({
        scope: 'https://www.googleapis.com/auth/drive.file',
        redirect_uri: window.location.href,
        access_type: 'online',
        prompt: 'select_account'
      });

      // This will redirect the page
      window.location.href = redirectUrl;
      
    } catch (error) {
      console.error('❌ Redirect authentication failed:', error);
      throw new Error(`Redirect authentication failed: ${error.message}`);
    }
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated() {
    return this.isReady && this.isSignedIn && this.authInstance?.isSignedIn.get();
  }

  /**
   * Get current user info
   */
  getCurrentUser() {
    if (!this.isAuthenticated()) return null;
    
    try {
      const user = this.authInstance.currentUser.get();
      const profile = user.getBasicProfile();
      return {
        email: profile.getEmail(),
        name: profile.getName(),
        picture: profile.getImageUrl()
      };
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }

  /**
   * Create or get client folder in shared drive
   */
  async createClientFolder(clientId, clientName) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const folderName = `${clientName} (${clientId})`;
      
      // Search for existing folder
      const searchResponse = await window.gapi.client.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        spaces: 'drive'
      });

      if (searchResponse.result.files.length > 0) {
        const folderId = searchResponse.result.files[0].id;
        console.log(`📁 Found existing folder: ${folderName} (${folderId})`);
        return folderId;
      }

      // Create new folder
      const createResponse = await window.gapi.client.drive.files.create({
        resource: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        }
      });

      const folderId = createResponse.result.id;
      console.log(`📁 Created folder: ${folderName} (${folderId})`);
      return folderId;
    } catch (error) {
      console.error('Failed to create client folder:', error);
      throw new Error(`Failed to create client folder: ${error.message}`);
    }
  }

  /**
   * List files in client folder
   */
  async listClientFiles(clientId, clientName) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const folderId = await this.createClientFolder(clientId, clientName);
      
      const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id,name,size,createdTime,mimeType,webViewLink,webContentLink)',
        orderBy: 'createdTime desc'
      });

      const files = response.result.files.map(file => ({
        id: file.id,
        name: file.name,
        size: this._formatFileSize(file.size),
        uploadDate: new Date(file.createdTime).toLocaleDateString(),
        type: file.mimeType,
        viewLink: file.webViewLink,
        downloadLink: file.webContentLink
      }));

      return files;
    } catch (error) {
      console.error('Failed to list client files:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Upload file to client folder
   */
  async uploadFileToClient(clientId, clientName, file, onProgress) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const folderId = await this.createClientFolder(clientId, clientName);
      
      // Create form data for upload
      const metadata = {
        name: file.name,
        parents: [folderId]
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
      form.append('file', file);

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log(`✅ File uploaded: ${file.name} (${response.id})`);
            resolve({
              id: response.id,
              name: response.name,
              size: this._formatFileSize(file.size),
              uploadDate: new Date().toLocaleDateString()
            });
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed due to network error'));
        });

        const accessToken = this.authInstance.currentUser.get().getAuthResponse().access_token;
        xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.send(form);
      });
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from client folder
   */
  async deleteClientFile(fileId) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      await window.gapi.client.drive.files.delete({
        fileId: fileId
      });

      console.log(`✅ File deleted: ${fileId}`);
      return true;
    } catch (error) {
      console.error('File deletion failed:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Share client folder with client email
   */
  async shareClientFolder(clientId, clientName, clientEmail) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const folderId = await this.createClientFolder(clientId, clientName);
      
      // Share folder with client
      await window.gapi.client.drive.permissions.create({
        fileId: folderId,
        resource: {
          role: 'reader',
          type: 'user',
          emailAddress: clientEmail
        },
        sendNotificationEmail: true
      });

      console.log(`✅ Folder shared with ${clientEmail}`);
      return folderId;
    } catch (error) {
      console.error('Folder sharing failed:', error);
      throw new Error(`Sharing failed: ${error.message}`);
    }
  }

  /**
   * Sign out from Google Drive
   */
  async signOut() {
    try {
      if (this.authInstance) {
        await this.authInstance.signOut();
        this.isSignedIn = false;
        console.log('✅ Signed out from Google Drive');
      }
    } catch (error) {
      console.error('Sign out failed:', error);
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isReady: this.isReady,
      isSignedIn: this.isSignedIn,
      lastError: this.lastError
    };
  }

  /**
   * Get last error
   */
  getLastError() {
    return this.lastError;
  }

  /**
   * Format file size for display
   */
  _formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Check if service is available
   */
  get isAvailable() {
    return this.isReady;
  }
}

// Export singleton instance
export const sharedDriveService = new GoogleDriveService();