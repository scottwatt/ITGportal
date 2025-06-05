// src/services/firebase/coaches.js

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

import { db } from './config';
import { getDefaultPassword } from '../../utils/helpers';
import { createUserWithRestAPI, sendPasswordResetWithRestAPI } from './authRest';

/**
 * Add a new coach with Firebase Auth account using REST API
 * @param {Object} coachData - Coach data
 * @returns {Promise<Object>} Result with success flag and temp password
 */
export const addNewCoach = async (coachData) => {
  try {
    console.log('Creating coach account for:', coachData.email);
    
    const tempPassword = getDefaultPassword('coach'); // ITGemployee123
    let uid = coachData.uid; // In case UID is manually provided
    
    // Create Firebase Auth account if UID not provided
    if (!uid) {
      console.log('Creating Firebase Auth account with REST API...');
      const authUser = await createUserWithRestAPI(coachData.email, tempPassword, coachData.name);
      uid = authUser.uid;
      
      console.log('Firebase Auth account created with UID:', uid);
    }
    
    const newCoach = {
      ...coachData,
      uid: uid,
      role: coachData.role || 'coach',
      coachType: coachData.coachType || 'success',
      tempPassword: tempPassword,
      authAccountCreated: true, // Flag to show auth account exists
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    console.log('Adding coach to Firestore...');
    const docRef = await addDoc(collection(db, 'coaches'), newCoach);
    console.log('Coach added to Firestore with ID:', docRef.id);
    
    return { 
      id: docRef.id, 
      ...newCoach,
      success: true,
      tempPassword,
      uid: uid,
      message: `Coach account created successfully for ${coachData.name}!

✅ Firebase Auth Account Created
📧 Email: ${coachData.email}
🔑 Password: ${tempPassword}
🆔 UID: ${uid}

The coach can now log in with these credentials.`
    };
    
  } catch (error) {
    console.error('Error creating coach account:', error);
    throw new Error(`Failed to create coach account: ${error.message}`);
  }
};

/**
 * Create login account for existing coach using REST API
 * @param {Object} coach - Existing coach object
 * @returns {Promise<Object>} Result with success flag and temp password
 */
export const createCoachLoginAccount = async (coach) => {
  try {
    console.log('Creating login account for existing coach:', coach.email);
    
    // Check if coach already has a UID (auth account)
    if (coach.uid) {
      throw new Error('This coach already has a login account.');
    }
    
    const tempPassword = getDefaultPassword('coach'); // ITGemployee123
    
    // Create Firebase Auth account using REST API
    console.log('Creating Firebase Auth account with REST API...');
    const authUser = await createUserWithRestAPI(coach.email, tempPassword, coach.name);
    const uid = authUser.uid;
    
    console.log('Firebase Auth account created with UID:', uid);
    
    // Update coach document with auth info
    console.log('Updating coach document with UID...');
    await updateDoc(doc(db, 'coaches', coach.id), {
      uid: uid,
      tempPassword: tempPassword,
      authAccountCreated: true,
      updatedAt: serverTimestamp()
    });
    
    console.log('Coach document updated successfully');
    
    return { 
      success: true, 
      tempPassword,
      uid: uid,
      message: `Login account created for ${coach.name}!

✅ Firebase Auth Account Created
📧 Email: ${coach.email}
🔑 Password: ${tempPassword}
🆔 UID: ${uid}

The coach can now log in with these credentials.` 
    };
    
  } catch (error) {
    console.error('Error creating login account:', error);
    throw new Error(`Failed to create login account: ${error.message}`);
  }
};

/**
 * Reset password for existing coach
 * @param {Object} coach - Coach object
 * @returns {Promise<Object>} Result with success status
 */
export const resetCoachPassword = async (coach) => {
  try {
    console.log('Resetting password for coach:', coach.email);
    
    if (!coach.uid) {
      throw new Error('This coach does not have a login account. Create one first.');
    }
    
    // Send password reset email using REST API
    await sendPasswordResetWithRestAPI(coach.email);
    
    // Update coach document to indicate password reset was sent
    await updateDoc(doc(db, 'coaches', coach.id), {
      passwordResetSentAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      message: `Password reset email sent to ${coach.email}!

📧 Check email for reset instructions
⏰ Reset link valid for 1 hour
🔑 Coach can set new password via email link

If no email is received, check spam folder or contact IT support.`
    };
    
  } catch (error) {
    console.error('Error resetting coach password:', error);
    throw new Error(`Failed to reset password: ${error.message}`);
  }
};

/**
 * Update an existing coach
 * @param {string} coachId - Coach document ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateCoach = async (coachId, updates) => {
  try {
    const coachRef = doc(db, 'coaches', coachId);
    await updateDoc(coachRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw new Error(`Failed to update coach: ${error.message}`);
  }
};

/**
 * Remove a coach and all associated schedules
 * @param {string} coachId - Coach document ID
 * @param {Array} schedules - All schedules (to remove coach's schedules)
 * @returns {Promise<void>}
 */
export const removeCoach = async (coachId, schedules) => {
  try {
    // Remove all scheduled sessions for this coach
    const coachSchedules = schedules.filter(s => s.coachId === coachId);
    for (const schedule of coachSchedules) {
      await deleteDoc(doc(db, 'schedules', schedule.id));
    }
    
    // Remove the coach document
    await deleteDoc(doc(db, 'coaches', coachId));
  } catch (error) {
    throw new Error(`Failed to remove coach: ${error.message}`);
  }
};

/**
 * Set up real-time listener for coaches
 * @param {Function} callback - Callback function to handle coaches data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCoaches = (callback) => {
  return onSnapshot(
    collection(db, 'coaches'), 
    (snapshot) => {
      const coachesData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.role === 'coach' || user.role === 'admin' || user.role === 'scheduler');
      callback(coachesData);
    },
    (error) => {
      console.error('Error in coaches subscription:', error);
      callback([]); // Return empty array on error
    }
  );
};