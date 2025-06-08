// src/services/googleDrive/sharedDriveService.js
// Optimized for Google Workspace Shared Drives

import { googleDriveConfig } from './config';

class SharedDriveService {
  constructor() {
    this.isInitialized = false;
    this.accessToken = null;
    this.sharedDriveId = null; // ITG Client Files shared drive ID
    this.isAvailable = false;
  }

  /**
   * Initialize Google Drive API for Shared Drives
   */
  async initialize() {
    if (this.isInitialized) return this.isAvailable;

    try {
      console.log('🏢 Initializing Google Workspace Shared Drive...');
      
      await this.loadGoogleAPI();
      await this.loadGapiLibraries();
      
      await window.gapi.client.init({
        apiKey: googleDriveConfig.apiKey,
        clientId: googleDriveConfig.clientId,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: googleDriveConfig.scopes.join(' ')
      });

      this.isInitialized = true;
      this.isAvailable = true;
      console.log('✅ Google Workspace Shared Drive initialized');
      return true;

    } catch (error) {
      console.error('❌ Shared Drive initialization failed:', error);
      this.isAvailable = false;
      return false;
    }
  }

  async loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  async loadGapiLibraries() {
    return new Promise((resolve, reject) => {
      window.gapi.load('client:auth2', {
        callback: resolve,
        onerror: () => reject(new Error('Failed to load GAPI libraries'))
      });
    });
  }

  /**
   * Authenticate with Google Workspace account
   */
  async authenticate() {
    try {
      if (!this.isInitialized) {
        const success = await this.initialize();
        if (!success) throw new Error('Initialization failed');
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance) throw new Error('Auth instance not available');

      // Check if user is signed in
      if (!authInstance.isSignedIn.get()) {
        console.log('👤 Prompting user to sign in with Google Workspace account...');
        await authInstance.signIn();
      }

      const user = authInstance.currentUser.get();
      const profile = user.getBasicProfile();
      const email = profile.getEmail();
      
      console.log(`✅ Authenticated as: ${email}`);
      
      // Verify it's a company email (optional - you can customize this)
      // if (!email.endsWith('@yourcompany.com')) {
      //   console.warn('⚠️ User is not using company Google Workspace account');
      //   // You can choose to continue or require company account
      // }

      this.accessToken = user.getAuthResponse().access_token;
      
      // Find the ITG Client Files shared drive
      await this.findSharedDrive();
      
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Find the "ITG Client Files" shared drive
   */
  async findSharedDrive() {
    try {
      console.log('🔍 Looking for ITG Client Files shared drive...');
      
      const response = await window.gapi.client.drive.drives.list({
        pageSize: 100
      });

      const drives = response.result.drives || [];
      const itgDrive = drives.find(drive => 
        drive.name === 'ITG Client Files' || 
        drive.name.includes('ITG Client') ||
        drive.name.includes('Client Files')
      );

      if (itgDrive) {
        this.sharedDriveId = itgDrive.id;
        console.log(`✅ Found shared drive: ${itgDrive.name} (${itgDrive.id})`);
      } else {
        console.warn('⚠️ ITG Client Files shared drive not found');
        console.log('Available shared drives:', drives.map(d => d.name));
        
        // Optionally create the shared drive (requires admin permissions)
        // await this.createSharedDrive();
      }
    } catch (error) {
      console.error('Failed to find shared drive:', error);
      throw error;
    }
  }

  /**
   * Get or create client folder in shared drive
   */
  async getClientFolder(clientId, clientName) {
    try {
      if (!this.sharedDriveId) {
        throw new Error('Shared drive not available');
      }

      const folderName = `${clientName} (${clientId})`;
      console.log(`📁 Getting folder for client: ${folderName}`);
      
      // Search for existing client folder in shared drive
      const response = await window.gapi.client.drive.files.list({
        q: `name='${folderName}' and parents in '${this.sharedDriveId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        driveId: this.sharedDriveId,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        fields: 'files(id, name)'
      });

      if (response.result.files.length > 0) {
        const folderId = response.result.files[0].id;
        console.log(`✅ Found existing folder: ${folderId}`);
        return folderId;
      } else {
        // Create client folder in shared drive
        console.log(`📁 Creating new folder: ${folderName}`);
        const createResponse = await window.gapi.client.drive.files.create({
          resource: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [this.sharedDriveId]
          },
          supportsAllDrives: true
        });
        
        const folderId = createResponse.result.id;
        console.log(`✅ Created folder: ${folderId}`);
        return folderId;
      }
    } catch (error) {
      console.error('Failed to get/create client folder:', error);
      throw error;
    }
  }

  /**
   * List files in client folder
   */
  async listClientFiles(clientId, clientName) {
    try {
      await this.ensureAuthenticated();
      
      const folderId = await this.getClientFolder(clientId, clientName);
      
      const response = await window.gapi.client.drive.files.list({
        q: `parents in '${folderId}' and trashed=false`,
        driveId: this.sharedDriveId,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        fields: 'files(id, name, size, mimeType, createdTime, modifiedTime, webViewLink, webContentLink, owners)',
        orderBy: 'modifiedTime desc'
      });

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

  /**
   * Upload file to client folder in shared drive
   */
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
            console.log(`✅ Uploaded ${file.name} to shared drive`);
            resolve({
              id: response.id,
              name: response.name,
              success: true
            });
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        // Use supportsAllDrives parameter for shared drives
        xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true');
        xhr.setRequestHeader('Authorization', `Bearer ${this.accessToken}`);
        xhr.send(form);
      });
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }

  /**
   * Delete file from shared drive
   */
  async deleteClientFile(fileId) {
    try {
      await this.ensureAuthenticated();
      
      await window.gapi.client.drive.files.delete({
        fileId: fileId,
        supportsAllDrives: true
      });
      
      console.log(`✅ Deleted file ${fileId} from shared drive`);
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  /**
   * Share client folder with client (outside organization)
   */
  async shareClientFolder(clientId, clientName, clientEmail) {
    try {
      await this.ensureAuthenticated();
      
      const folderId = await this.getClientFolder(clientId, clientName);
      
      // Give client view access to their folder
      await window.gapi.client.drive.permissions.create({
        fileId: folderId,
        supportsAllDrives: true,
        resource: {
          role: 'reader', // Read-only for clients
          type: 'user',
          emailAddress: clientEmail
        },
        sendNotificationEmail: true,
        emailMessage: `You now have access to your ITG client folder. You can view your files here.`
      });
      
      console.log(`✅ Shared folder with client: ${clientEmail}`);
      return folderId;
    } catch (error) {
      console.error('Failed to share client folder:', error);
      throw error;
    }
  }

  async ensureAuthenticated() {
    if (!this.accessToken) {
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
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      this.accessToken = null;
      console.log('✅ Signed out from Google Workspace');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }
}

export const sharedDriveService = new SharedDriveService();
export default sharedDriveService;