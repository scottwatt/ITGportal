// src/services/googleDrive/sharedDriveService.js
// ROBUST: Better error handling, CORS fix, proper auth instance management

import { googleDriveConfig, validateGoogleDriveConfig } from './config';

class GoogleDriveService {
  constructor() {
    this.isInitialized = false;
    this.accessToken = null;
    this.sharedDriveId = null;
    this.mainFolderId = null;
    this.isAvailable = false;
    this.useSharedDrive = false;
    this.authInstance = null;
    this.lastError = null;
  }

  /**
   * Initialize Google Drive API with robust error handling
   */
  async initialize() {
    if (this.isInitialized) return this.isAvailable;

    try {
      console.log('🔧 Starting robust Google Drive initialization...');
      
      // Validate configuration
      const validation = validateGoogleDriveConfig();
      if (!validation.hasCredentials) {
        this.lastError = 'Google Drive client ID not configured.';
        console.warn('⚠️', this.lastError);
        this.isInitialized = true;
        this.isAvailable = false;
        return false;
      }
      
      // Verify OAuth client configuration
      await this.verifyOAuthConfig();
      
      // Ensure Google API is loaded
      await this.ensureGoogleAPILoaded();
      
      // Setup auth with better error handling
      await this.setupAuthRobust();
      
      this.isInitialized = true;
      this.isAvailable = true;
      this.useSharedDrive = googleDriveConfig.useSharedDrive;
      
      console.log('✅ Google Drive initialization successful');
      return true;

    } catch (error) {
      console.error('❌ Google Drive initialization failed:', this.getErrorDetails(error));
      this.lastError = `Initialization failed: ${this.getErrorMessage(error)}`;
      this.isAvailable = false;
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Verify OAuth client configuration
   */
  async verifyOAuthConfig() {
    console.log('🔍 Verifying OAuth configuration...');
    
    const clientId = googleDriveConfig.clientId;
    const currentOrigin = window.location.origin;
    
    console.log('Client ID:', clientId.substring(0, 20) + '...');
    console.log('Current origin:', currentOrigin);
    
    // Basic format check
    if (!clientId.includes('.apps.googleusercontent.com')) {
      throw new Error('Invalid OAuth client ID format');
    }
    
    console.log('✅ OAuth client ID format looks correct');
    console.log('⚠️ Make sure these are configured in Google Cloud Console:');
    console.log(`   - Authorized JavaScript origins: ${currentOrigin}`);
    console.log(`   - OAuth consent screen has Google Drive scopes`);
  }

  /**
   * Get detailed error information
   */
  getErrorDetails(error) {
    return {
      message: error.message,
      type: typeof error,
      constructor: error.constructor.name,
      details: error.details,
      error: error.error,
      result: error.result,
      stack: error.stack
    };
  }

  /**
   * Get human-readable error message
   */
  getErrorMessage(error) {
    if (typeof error === 'string') return error;
    if (error.details) return error.details;
    if (error.error) return error.error;
    if (error.message) return error.message;
    if (error.result && error.result.error) {
      return error.result.error.message || JSON.stringify(error.result.error);
    }
    return 'Unknown error occurred';
  }

  /**
   * Ensure Google API is loaded
   */
  async ensureGoogleAPILoaded() {
    if (typeof window.gapi === 'undefined') {
      console.log('📦 Loading Google API...');
      await this.loadGoogleAPIScript();
    }
    
    // Wait for gapi to be ready with timeout
    await this.waitForGapi();
    
    // Load required libraries
    if (!window.gapi.client || !window.gapi.auth2) {
      console.log('📚 Loading GAPI libraries...');
      await this.loadGapiLibraries();
    }
  }

  /**
   * Wait for GAPI to be ready
   */
  waitForGapi() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for GAPI to be ready'));
      }, 10000);
      
      const checkGapi = () => {
        if (window.gapi && window.gapi.load) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkGapi, 100);
        }
      };
      checkGapi();
    });
  }

  loadGoogleAPIScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.head.appendChild(script);
    });
  }

  loadGapiLibraries() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout loading GAPI libraries'));
      }, 15000);
      
      window.gapi.load('client:auth2', {
        callback: () => {
          clearTimeout(timeout);
          resolve();
        },
        onerror: (error) => {
          clearTimeout(timeout);
          reject(new Error(`Failed to load GAPI libraries: ${JSON.stringify(error)}`));
        }
      });
    });
  }

  /**
   * Setup auth with robust error handling
   */
  async setupAuthRobust() {
    try {
      console.log('🔐 Setting up Google Auth...');
      
      // Check for existing auth instance
      this.authInstance = window.gapi.auth2.getAuthInstance();
      
      if (this.authInstance) {
        console.log('✅ Using existing Google Auth instance');
        
        // Verify it has the right client ID
        const currentClientId = this.authInstance.currentUser.get().getId();
        console.log('Existing auth client ID:', currentClientId ? 'Present' : 'None');
      } else {
        console.log('🔐 Creating new Google Auth instance...');
        
        // Initialize client first
        if (!window.gapi.client.getToken) {
          await window.gapi.client.init({});
        }
        
        // Initialize auth2 with detailed error handling
        try {
          this.authInstance = await window.gapi.auth2.init({
            client_id: googleDriveConfig.clientId,
            scope: googleDriveConfig.scopes.join(' '),
            fetch_basic_profile: true,
            ux_mode: 'popup' // Use popup instead of redirect to avoid CORS issues
          });
          console.log('✅ New Google Auth instance created');
        } catch (authError) {
          console.error('❌ Auth2 init failed:', this.getErrorDetails(authError));
          
          // Try fallback approach
          console.log('🔄 Trying fallback auth approach...');
          this.authInstance = window.gapi.auth2.getAuthInstance();
          if (!this.authInstance) {
            throw new Error(`Auth initialization failed: ${this.getErrorMessage(authError)}`);
          }
        }
      }
      
      // Load Drive API
      await this.loadDriveAPI();
      
    } catch (error) {
      console.error('❌ Auth setup failed:', this.getErrorDetails(error));
      throw new Error(`Auth initialization failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Load Drive API with error handling
   */
  async loadDriveAPI() {
    try {
      if (!window.gapi.client.drive) {
        console.log('📁 Loading Drive API...');
        await window.gapi.client.load('drive', 'v3');
        console.log('✅ Google Drive API loaded');
      } else {
        console.log('✅ Drive API already available');
      }
    } catch (error) {
      console.error('❌ Failed to load Drive API:', this.getErrorDetails(error));
      throw new Error(`Drive API load failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Authenticate with detailed error handling
   */
  async authenticate() {
    try {
      if (!this.isAvailable) {
        const success = await this.initialize();
        if (!success) {
          throw new Error(this.lastError || 'Google Drive not available');
        }
      }

      if (!this.authInstance) {
        throw new Error('Auth instance not available after initialization');
      }

      console.log('🔐 Starting authentication...');
      
      const currentUser = this.authInstance.currentUser.get();
      
      if (!currentUser.isSignedIn()) {
        console.log('👤 User not signed in, prompting...');
        
        try {
          // Use signIn with specific options to handle CORS issues
          await this.authInstance.signIn({
            scope: googleDriveConfig.scopes.join(' '),
            ux_mode: 'popup'
          });
          console.log('✅ Sign in successful');
        } catch (signInError) {
          console.error('❌ Sign in failed:', this.getErrorDetails(signInError));
          
          // Check for specific error types
          if (this.getErrorMessage(signInError).includes('popup')) {
            throw new Error('Sign-in popup was blocked. Please allow popups for this site and try again.');
          } else if (this.getErrorMessage(signInError).includes('CORS')) {
            throw new Error('CORS error during sign-in. Please check OAuth client configuration.');
          } else {
            throw new Error(`Sign-in failed: ${this.getErrorMessage(signInError)}`);
          }
        }
      } else {
        console.log('✅ User already signed in');
        
        // Verify scopes
        const grantedScopes = currentUser.getGrantedScopes();
        const hasRequiredScopes = googleDriveConfig.scopes.every(scope => 
          grantedScopes.includes(scope)
        );
        
        if (!hasRequiredScopes) {
          console.log('🔄 Re-authenticating for Drive permissions...');
          await this.authInstance.signIn({
            scope: googleDriveConfig.scopes.join(' ')
          });
        }
      }

      const user = this.authInstance.currentUser.get();
      const profile = user.getBasicProfile();
      const email = profile.getEmail();
      
      console.log(`✅ Authenticated as: ${email}`);
      this.accessToken = user.getAuthResponse().access_token;
      
      // Test Drive API access
      await this.testDriveAccess();
      
      // Set up folder structure
      await this.setupFolderStructure();
      
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', this.getErrorDetails(error));
      this.lastError = this.getErrorMessage(error);
      throw new Error(this.lastError);
    }
  }

  /**
   * Test Drive API access
   */
  async testDriveAccess() {
    try {
      console.log('🧪 Testing Drive API access...');
      
      const response = await window.gapi.client.drive.about.get({
        fields: 'user'
      });
      
      if (response.result && response.result.user) {
        console.log('✅ Drive API access confirmed');
        console.log('Drive user:', response.result.user.displayName);
      } else {
        console.warn('⚠️ Unexpected Drive API response');
      }
    } catch (error) {
      console.error('❌ Drive API test failed:', this.getErrorDetails(error));
      throw new Error(`Drive API test failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Setup folder structure
   */
  async setupFolderStructure() {
    if (this.useSharedDrive) {
      try {
        await this.setupSharedDrive();
      } catch (sharedDriveError) {
        console.warn('⚠️ Shared Drive setup failed, falling back to regular folders:', sharedDriveError);
        this.useSharedDrive = false;
        await this.setupRegularDrive();
      }
    } else {
      await this.setupRegularDrive();
    }
  }

  /**
   * Set up Shared Drive
   */
  async setupSharedDrive() {
    console.log('🔍 Looking for Shared Drive...');
    
    const response = await window.gapi.client.drive.drives.list({
      pageSize: 100
    });

    const drives = response.result.drives || [];
    console.log(`📊 Found ${drives.length} shared drives`);
    
    const itgDrive = drives.find(drive => 
      drive.name === googleDriveConfig.mainFolderName || 
      drive.name.includes('ITG Client') ||
      drive.name.includes('Client Files')
    );

    if (itgDrive) {
      this.sharedDriveId = itgDrive.id;
      console.log(`✅ Found shared drive: ${itgDrive.name} (${itgDrive.id})`);
    } else {
      console.log('Available shared drives:', drives.map(d => d.name));
      throw new Error('ITG Client Files shared drive not found');
    }
  }

  /**
   * Set up regular Drive folder
   */
  async setupRegularDrive() {
    console.log('📁 Setting up regular Drive folder...');
    
    const response = await window.gapi.client.drive.files.list({
      q: `name='${googleDriveConfig.mainFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });

    if (response.result.files.length > 0) {
      this.mainFolderId = response.result.files[0].id;
      console.log(`✅ Found main folder: ${this.mainFolderId}`);
    } else {
      console.log(`📁 Creating main folder: ${googleDriveConfig.mainFolderName}`);
      const createResponse = await window.gapi.client.drive.files.create({
        resource: {
          name: googleDriveConfig.mainFolderName,
          mimeType: 'application/vnd.google-apps.folder'
        }
      });
      
      this.mainFolderId = createResponse.result.id;
      console.log(`✅ Created main folder: ${this.mainFolderId}`);
    }
  }

  // Rest of the methods remain the same but with better error handling...
  async getClientFolder(clientId, clientName) {
    try {
      await this.ensureAuthenticated();
      
      const folderName = `${clientName} (${clientId})`;
      const parentId = this.useSharedDrive ? this.sharedDriveId : this.mainFolderId;
      
      if (!parentId) {
        throw new Error('Parent folder not available');
      }

      const searchParams = {
        q: `name='${folderName}' and parents in '${parentId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)'
      };
      
      if (this.useSharedDrive) {
        searchParams.driveId = this.sharedDriveId;
        searchParams.includeItemsFromAllDrives = true;
        searchParams.supportsAllDrives = true;
      }

      const response = await window.gapi.client.drive.files.list(searchParams);

      if (response.result.files.length > 0) {
        const folderId = response.result.files[0].id;
        console.log(`✅ Found existing client folder: ${folderId}`);
        return folderId;
      } else {
        console.log(`📁 Creating client folder: ${folderName}`);
        
        const createParams = {
          resource: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId]
          }
        };
        
        if (this.useSharedDrive) {
          createParams.supportsAllDrives = true;
        }
        
        const createResponse = await window.gapi.client.drive.files.create(createParams);
        return createResponse.result.id;
      }
    } catch (error) {
      console.error('Failed to get/create client folder:', error);
      throw error;
    }
  }

  async listClientFiles(clientId, clientName) {
    try {
      await this.ensureAuthenticated();
      
      const folderId = await this.getClientFolder(clientId, clientName);
      
      const listParams = {
        q: `parents in '${folderId}' and trashed=false`,
        fields: 'files(id, name, size, mimeType, createdTime, modifiedTime, webViewLink, webContentLink, owners)',
        orderBy: 'modifiedTime desc'
      };
      
      if (this.useSharedDrive) {
        listParams.driveId = this.sharedDriveId;
        listParams.includeItemsFromAllDrives = true;
        listParams.supportsAllDrives = true;
      }

      const response = await window.gapi.client.drive.files.list(listParams);

      return response.result.files.map(file => ({
        id: file.id,
        name: file.name,
        size: this.formatFileSize(file.size),
        mimeType: file.mimeType,
        type: this.getFileTypeFromMime(file.mimeType),
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        downloadLink: file.webContentLink,
        uploadDate: new Date(file.createdTime).toLocaleDateString(),
        uploadedBy: file.owners?.[0]?.displayName || 'Unknown'
      }));
    } catch (error) {
      console.error('Failed to list client files:', error);
      throw error;
    }
  }

  async uploadFileToClient(clientId, clientName, file, onProgress = null) {
    try {
      await this.ensureAuthenticated();
      
      const folderId = await this.getClientFolder(clientId, clientName);
      
      const metadata = {
        name: file.name,
        parents: [folderId]
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
      form.append('file', file);

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (onProgress && e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log(`✅ Uploaded ${file.name}`);
            resolve({
              id: response.id,
              name: response.name,
              success: true
            });
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed - network error'));
        });

        let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        if (this.useSharedDrive) {
          uploadUrl += '&supportsAllDrives=true';
        }

        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${this.accessToken}`);
        xhr.send(form);
      });
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }

  async deleteClientFile(fileId) {
    try {
      await this.ensureAuthenticated();
      
      await window.gapi.client.drive.files.delete({
        fileId: fileId,
        supportsAllDrives: this.useSharedDrive
      });
      
      console.log(`✅ Deleted file ${fileId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  async shareClientFolder(clientId, clientName, clientEmail) {
    try {
      await this.ensureAuthenticated();
      
      const folderId = await this.getClientFolder(clientId, clientName);
      
      await window.gapi.client.drive.permissions.create({
        fileId: folderId,
        supportsAllDrives: this.useSharedDrive,
        resource: {
          role: 'reader',
          type: 'user',
          emailAddress: clientEmail
        },
        sendNotificationEmail: true,
        emailMessage: `You now have access to your ITG client folder.`
      });
      
      console.log(`✅ Shared folder with client: ${clientEmail}`);
      return folderId;
    } catch (error) {
      console.error('Failed to share client folder:', error);
      return null;
    }
  }

  async ensureAuthenticated() {
    if (!this.accessToken || !this.authInstance?.isSignedIn?.get()) {
      await this.authenticate();
    }
  }

  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  getFileTypeFromMime(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'spreadsheet';
    if (mimeType.includes('pdf')) return 'document';
    if (mimeType.includes('word')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
    if (mimeType.includes('video/')) return 'video';
    return 'document';
  }

  async signOut() {
    try {
      if (this.authInstance) {
        await this.authInstance.signOut();
      }
      this.accessToken = null;
      console.log('✅ Signed out from Google Drive');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }

  getLastError() {
    return this.lastError;
  }
}

export const sharedDriveService = new GoogleDriveService();
export default sharedDriveService;