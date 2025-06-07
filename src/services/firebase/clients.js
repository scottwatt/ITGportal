// src/services/firebase/clients.js - Updated with dailyTaskCoachId support
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

import { db, storage } from './config';
import { getDefaultPassword, getFileTypeFromExtension, formatFileSize, cleanFormData } from '../../utils/helpers';
import { createUserWithRestAPI, sendPasswordResetWithRestAPI } from './authRest';

/**
 * Add a new client with Firebase Auth account using REST API
 * ENHANCED: Support for dailyTaskCoachId and simplified Grace participant fields
 * @param {Object} clientData - Client data
 * @returns {Promise<Object>} Result with success flag and temp password
 */
export const addNewClient = async (clientData) => {
  try {
    console.log('Creating client account for:', clientData.email);
    
    const tempPassword = getDefaultPassword('client'); // ITGclient123
    
    // Create Firebase Auth account using REST API (doesn't affect current session)
    console.log('Creating Firebase Auth account with REST API...');
    const authUser = await createUserWithRestAPI(clientData.email, tempPassword, clientData.name);
    const uid = authUser.uid;
    
    console.log('Firebase Auth account created with UID:', uid);
    
    // Clean and prepare client data
    const cleanedData = cleanFormData(clientData);
    
    // ENHANCED: Prepare client data based on program type
    let newClient;
    
    if (cleanedData.program === 'grace') {
      // SIMPLIFIED: Grace participants only need basic info + goals
      newClient = {
        name: cleanedData.name,
        email: cleanedData.email,
        phone: cleanedData.phone || '',
        program: 'grace',
        currentGoals: cleanedData.currentGoals || '',
        uid: uid,
        role: 'client',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'Active',
        progress: 0,
        tempPassword: tempPassword,
        authAccountCreated: true
      };
    } else {
      // FULL: All other programs get complete business information
      newClient = {
        ...cleanedData,
        uid: uid,
        role: 'client',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'Active',
        progress: 0,
        files: [],
        tempPassword: tempPassword,
        authAccountCreated: true,
        // ENHANCED: Support for daily task coach assignment
        dailyTaskCoachId: cleanedData.dailyTaskCoachId || ''
      };
    }
    
    console.log('Adding client to Firestore...');
    const docRef = await addDoc(collection(db, 'clients'), newClient);
    console.log('Client added to Firestore with ID:', docRef.id);
    
    return { 
      success: true, 
      tempPassword,
      clientId: docRef.id,
      uid: uid,
      message: `Client account created successfully for ${clientData.name}!

✅ Firebase Auth Account Created
📧 Email: ${clientData.email}
🔑 Password: ${tempPassword}
🆔 UID: ${uid}
${newClient.dailyTaskCoachId ? `👤 Daily Task Coach: Assigned` : ''}

The client can now log in with these credentials.`
    };
    
  } catch (error) {
    console.error('Error creating client account:', error);
    throw new Error(`Failed to create client account: ${error.message}`);
  }
};

/**
 * Create login account for existing client using REST API
 * @param {Object} client - Existing client object
 * @returns {Promise<Object>} Result with success flag and temp password
 */
export const createClientLoginAccount = async (client) => {
  try {
    console.log('Creating login account for existing client:', client.email);
    
    // Check if client already has a UID (auth account)
    if (client.uid) {
      throw new Error('This client already has a login account.');
    }
    
    const tempPassword = getDefaultPassword('client'); // ITGclient123
    
    // Create Firebase Auth account using REST API
    console.log('Creating Firebase Auth account with REST API...');
    const authUser = await createUserWithRestAPI(client.email, tempPassword, client.name);
    const uid = authUser.uid;
    
    console.log('Firebase Auth account created with UID:', uid);
    
    // Update client document with auth info
    console.log('Updating client document with UID...');
    await updateDoc(doc(db, 'clients', client.id), {
      uid: uid,
      role: 'client',
      tempPassword: tempPassword,
      authAccountCreated: true,
      updatedAt: serverTimestamp()
    });
    
    console.log('Client document updated successfully');
    
    return { 
      success: true, 
      tempPassword,
      uid: uid,
      message: `Login account created for ${client.name}!

✅ Firebase Auth Account Created  
📧 Email: ${client.email}
🔑 Password: ${tempPassword}
🆔 UID: ${uid}

The client can now log in with these credentials.` 
    };
    
  } catch (error) {
    console.error('Error creating login account:', error);
    throw new Error(`Failed to create login account: ${error.message}`);
  }
};

/**
 * Reset password for existing client
 * @param {Object} client - Client object
 * @returns {Promise<Object>} Result with success status
 */
export const resetClientPassword = async (client) => {
  try {
    console.log('Resetting password for client:', client.email);
    
    if (!client.uid) {
      throw new Error('This client does not have a login account. Create one first.');
    }
    
    // Send password reset email using REST API
    await sendPasswordResetWithRestAPI(client.email);
    
    // Update client document to indicate password reset was sent
    await updateDoc(doc(db, 'clients', client.id), {
      passwordResetSentAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      message: `Password reset email sent to ${client.email}!

📧 Check email for reset instructions
⏰ Reset link valid for 1 hour
🔑 Client can set new password via email link

If no email is received, check spam folder or contact IT support.`
    };
    
  } catch (error) {
    console.error('Error resetting client password:', error);
    throw new Error(`Failed to reset password: ${error.message}`);
  }
};

/**
 * ENHANCED: Update client information with support for all fields including dailyTaskCoachId
 * @param {string} clientId - Client document ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateClient = async (clientId, updates) => {
  try {
    const cleanedUpdates = cleanFormData(updates);
    const clientRef = doc(db, 'clients', clientId);
    
    // ENHANCED: Handle program-specific field validation
    let finalUpdates = { ...cleanedUpdates };
    
    if (updates.program === 'grace') {
      // For Grace participants, only keep essential fields
      const graceFields = {
        name: finalUpdates.name,
        email: finalUpdates.email,
        phone: finalUpdates.phone,
        program: 'grace',
        currentGoals: finalUpdates.currentGoals,
        progress: finalUpdates.progress,
        notes: finalUpdates.notes,
        updatedAt: serverTimestamp()
      };
      
      // Remove business-specific fields for Grace clients
      finalUpdates = graceFields;
    } else {
      // For other programs, include dailyTaskCoachId and all business fields
      finalUpdates = {
        ...finalUpdates,
        updatedAt: serverTimestamp()
      };
    }
    
    await updateDoc(clientRef, finalUpdates);
  } catch (error) {
    throw new Error(`Failed to update client: ${error.message}`);
  }
};

/**
 * Update client progress and notes
 * @param {string} clientId - Client document ID
 * @param {Object} progressData - Progress and notes data
 * @returns {Promise<void>}
 */
export const updateClientProgress = async (clientId, progressData) => {
  try {
    const updates = {
      ...progressData,
      lastSession: new Date().toISOString().split('T')[0],
      updatedAt: serverTimestamp()
    };
    
    if (progressData.progress !== undefined) {
      updates.progress = Math.max(0, Math.min(100, parseInt(progressData.progress)));
    }
    
    await updateDoc(doc(db, 'clients', clientId), updates);
  } catch (error) {
    throw new Error(`Failed to update client progress: ${error.message}`);
  }
};

/**
 * ENHANCED: Remove a client and all associated data including task assignments
 * @param {string} clientId - Client document ID
 * @param {Array} schedules - All schedules (to remove client's schedules)
 * @returns {Promise<void>}
 */
export const removeClient = async (clientId, schedules) => {
  try {
    // Get client data to access files for cleanup
    const clientDoc = await getDocs(query(
      collection(db, 'clients'),
      where('__name__', '==', clientId)
    ));
    
    if (!clientDoc.empty) {
      const clientData = clientDoc.docs[0].data();
      
      // Delete client files from storage
      if (clientData.files && clientData.files.length > 0) {
        for (const file of clientData.files) {
          if (file.storageRef) {
            try {
              const fileRef = ref(storage, file.storageRef);
              await deleteObject(fileRef);
            } catch (fileError) {
              console.warn(`Failed to delete file ${file.name}:`, fileError);
            }
          }
        }
      }
    }
    
    // Remove all scheduled sessions for this client
    const clientSchedules = schedules.filter(s => s.clientId === clientId);
    for (const schedule of clientSchedules) {
      await deleteDoc(doc(db, 'schedules', schedule.id));
    }
    
    // ENHANCED: Remove all tasks for this client
    try {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('clientId', '==', clientId)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      
      for (const taskDoc of tasksSnapshot.docs) {
        await deleteDoc(doc(db, 'tasks', taskDoc.id));
      }
    } catch (taskError) {
      console.warn('Error removing client tasks:', taskError);
    }
    
    // Remove the client document
    await deleteDoc(doc(db, 'clients', clientId));
  } catch (error) {
    throw new Error(`Failed to remove client: ${error.message}`);
  }
};

/**
 * Upload files to Firebase Storage and add to client record
 * @param {string} clientId - Client document ID
 * @param {FileList|Array} files - Files to upload
 * @param {Object} userProfile - Current user profile for tracking uploads
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Array>} Array of uploaded file metadata
 */
export const uploadFilesToClient = async (clientId, files, userProfile, onProgress = null) => {
  if (!files || files.length === 0) {
    throw new Error('No files provided for upload');
  }
  
  const uploadedFiles = [];
  const totalFiles = files.length;
  
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Update progress
      if (onProgress) {
        onProgress(Math.round((i / totalFiles) * 90));
      }
      
      // Create unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const fileRef = ref(storage, `client-files/${clientId}/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Determine file type
      const fileType = getFileTypeFromExtension(file.name);
      
      // Create file metadata
      const fileMetadata = {
        id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: fileType,
        size: formatFileSize(file.size),
        downloadURL,
        storageRef: snapshot.ref.fullPath,
        description: '',
        originalSize: file.size,
        uploadDate: new Date().toISOString().split('T')[0],
        uploadedBy: userProfile?.name || 'Unknown User',
        uploadedAt: serverTimestamp()
      };
      
      uploadedFiles.push(fileMetadata);
    }
    
    // Update progress to 100%
    if (onProgress) {
      onProgress(100);
    }
    
    // Add files to client record
    await addFilesToClient(clientId, uploadedFiles);
    
    return uploadedFiles;
  } catch (error) {
    throw new Error(`Failed to upload files: ${error.message}`);
  }
};

/**
 * Add file metadata to client record
 * @param {string} clientId - Client document ID
 * @param {Object|Array} fileData - File data or array of file data
 * @returns {Promise<void>}
 */
export const addFilesToClient = async (clientId, fileData) => {
  try {
    // Get current client data
    const clientQuery = query(
      collection(db, 'clients'),
      where('__name__', '==', clientId)
    );
    const clientSnapshot = await getDocs(clientQuery);
    
    if (clientSnapshot.empty) {
      throw new Error('Client not found');
    }
    
    const currentFiles = clientSnapshot.docs[0].data().files || [];
    const newFiles = Array.isArray(fileData) ? fileData : [fileData];
    const updatedFiles = [...currentFiles, ...newFiles];
    
    const clientRef = doc(db, 'clients', clientId);
    await updateDoc(clientRef, {
      files: updatedFiles,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw new Error(`Failed to add files to client record: ${error.message}`);
  }
};

/**
 * Remove file from client record and storage
 * @param {string} clientId - Client document ID
 * @param {string} fileId - File ID to remove
 * @param {Array} currentFiles - Current files array
 * @returns {Promise<void>}
 */
export const removeFileFromClient = async (clientId, fileId, currentFiles) => {
  try {
    const fileToRemove = currentFiles?.find(f => f.id === fileId);
    
    // Delete file from Firebase Storage if it exists
    if (fileToRemove && fileToRemove.storageRef) {
      try {
        const fileRef = ref(storage, fileToRemove.storageRef);
        await deleteObject(fileRef);
      } catch (storageError) {
        console.warn('Storage deletion failed:', storageError);
        // Continue with removing from database even if storage deletion fails
      }
    }
    
    // Update client record
    const updatedFiles = (currentFiles || []).filter(f => f.id !== fileId);
    const clientRef = doc(db, 'clients', clientId);
    
    await updateDoc(clientRef, {
      files: updatedFiles,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw new Error(`Failed to remove file: ${error.message}`);
  }
};

/**
 * Get client by ID
 * @param {string} clientId - Client document ID
 * @returns {Promise<Object|null>} Client data or null if not found
 */
export const getClientById = async (clientId) => {
  try {
    const clientQuery = query(
      collection(db, 'clients'),
      where('__name__', '==', clientId)
    );
    const snapshot = await getDocs(clientQuery);
    
    if (snapshot.empty) {
      return null;
    }
    
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    throw new Error(`Failed to get client: ${error.message}`);
  }
};

/**
 * Get clients by program
 * @param {string} program - Program ID
 * @returns {Promise<Array>} Array of clients in the program
 */
export const getClientsByProgram = async (program) => {
  try {
    const clientsQuery = query(
      collection(db, 'clients'),
      where('program', '==', program)
    );
    const snapshot = await getDocs(clientsQuery);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Failed to get clients by program: ${error.message}`);
  }
};

/**
 * ENHANCED: Get clients assigned to a specific coach for daily tasks
 * @param {string} coachId - Coach ID (UID)
 * @returns {Promise<Array>} Array of clients assigned to the coach
 */
export const getClientsByTaskCoach = async (coachId) => {
  try {
    const clientsQuery = query(
      collection(db, 'clients'),
      where('dailyTaskCoachId', '==', coachId)
    );
    const snapshot = await getDocs(clientsQuery);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Failed to get clients by task coach: ${error.message}`);
  }
};

/**
 * ENHANCED: Assign or remove daily task coach for a client
 * @param {string} clientId - Client document ID
 * @param {string} coachId - Coach ID (UID) or empty string to remove assignment
 * @returns {Promise<void>}
 */
export const assignDailyTaskCoach = async (clientId, coachId) => {
  try {
    const clientRef = doc(db, 'clients', clientId);
    await updateDoc(clientRef, {
      dailyTaskCoachId: coachId || '',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw new Error(`Failed to assign daily task coach: ${error.message}`);
  }
};

/**
 * Set up real-time listener for clients
 * ENHANCED: Includes dailyTaskCoachId field
 * @param {Function} callback - Callback function to handle clients data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToClients = (callback) => {
  return onSnapshot(
    collection(db, 'clients'), 
    (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(clientsData);
    },
    (error) => {
      console.error('Error in clients subscription:', error);
      callback([]); // Return empty array on error to prevent app crash
    }
  );
};