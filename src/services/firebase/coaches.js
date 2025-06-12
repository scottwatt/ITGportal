// src/services/firebase/coaches.js - FIXED with better data validation and notes handling

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
 * FIXED: Better data validation and notes handling
 * @param {Object} coachData - Coach data
 * @returns {Promise<Object>} Result with success flag and temp password
 */
export const addNewCoach = async (coachData) => {
  try {
    console.log('Creating coach account for:', coachData.email);
    
    // FIXED: Validate and clean coach data first
    const cleanCoachData = validateAndCleanCoachData(coachData);
    
    const tempPassword = getDefaultPassword('coach'); // ITGemployee123
    let uid = cleanCoachData.uid; // In case UID is manually provided
    
    // Create Firebase Auth account if UID not provided
    if (!uid) {
      console.log('Creating Firebase Auth account with REST API...');
      const authUser = await createUserWithRestAPI(cleanCoachData.email, tempPassword, cleanCoachData.name);
      uid = authUser.uid;
      
      console.log('Firebase Auth account created with UID:', uid);
    }
    
    // FIXED: Properly structure the coach document
    const newCoach = {
      // Core required fields
      name: cleanCoachData.name,
      email: cleanCoachData.email,
      uid: uid,
      role: cleanCoachData.role || 'coach',
      
      // FIXED: Handle coachType properly for new roles
      coachType: getCoachTypeForRole(cleanCoachData.role, cleanCoachData.coachType),
      
      // Optional fields - only include if they have values
      ...(cleanCoachData.phone && { phone: cleanCoachData.phone }),
      ...(cleanCoachData.notes && { notes: cleanCoachData.notes.trim() }),
      
      // System fields
      tempPassword: tempPassword,
      authAccountCreated: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    console.log('Adding coach to Firestore with data:', newCoach);
    const docRef = await addDoc(collection(db, 'coaches'), newCoach);
    console.log('Coach added to Firestore with ID:', docRef.id);
    
    return { 
      id: docRef.id, 
      ...newCoach,
      success: true,
      tempPassword,
      uid: uid,
      message: `Coach account created successfully for ${cleanCoachData.name}!

✅ Firebase Auth Account Created
📧 Email: ${cleanCoachData.email}
🔑 Password: ${tempPassword}
🆔 UID: ${uid}
👤 Role: ${cleanCoachData.role}

The coach can now log in with these credentials.`
    };
    
  } catch (error) {
    console.error('Error creating coach account:', error);
    throw new Error(`Failed to create coach account: ${error.message}`);
  }
};

/**
 * FIXED: Validate and clean coach data to prevent login issues
 * @param {Object} coachData - Raw coach data from form
 * @returns {Object} Cleaned and validated coach data
 */
const validateAndCleanCoachData = (coachData) => {
  if (!coachData) {
    throw new Error('Coach data is required');
  }
  
  // Required fields validation
  if (!coachData.name || !coachData.name.trim()) {
    throw new Error('Coach name is required');
  }
  
  if (!coachData.email || !coachData.email.trim()) {
    throw new Error('Coach email is required');
  }
  
  if (!coachData.role || !coachData.role.trim()) {
    throw new Error('Coach role is required');
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(coachData.email.trim())) {
    throw new Error('Invalid email format');
  }
  
  // FIXED: Validate role is one of the allowed roles
  const allowedRoles = [
    'admin',
    'coach', 
    'scheduler',
    'merchandise_coordinator',
    'program_admin_coordinator',
    'admin_dev_coordinator',
    'vocational_dev_coordinator',
    'executive_director',
    'director_org_dev',
    'director_program_dev'
  ];
  
  if (!allowedRoles.includes(coachData.role.trim())) {
    throw new Error(`Invalid role: ${coachData.role}. Must be one of: ${allowedRoles.join(', ')}`);
  }
  
  return {
    name: coachData.name.trim(),
    email: coachData.email.trim().toLowerCase(),
    role: coachData.role.trim(),
    coachType: coachData.coachType ? coachData.coachType.trim() : null,
    phone: coachData.phone ? coachData.phone.trim() : null,
    notes: coachData.notes ? coachData.notes.trim() : null,
    uid: coachData.uid ? coachData.uid.trim() : null
  };
};

/**
 * FIXED: Get appropriate coach type based on role
 * @param {string} role - User role
 * @param {string} providedCoachType - Explicitly provided coach type
 * @returns {string} Appropriate coach type
 */
const getCoachTypeForRole = (role, providedCoachType) => {
  // If coach type is explicitly provided, use it
  if (providedCoachType) {
    return providedCoachType;
  }
  
  // Default coach types based on role
  switch (role) {
    case 'coach':
      return 'success'; // Default for regular coaches
    case 'merchandise_coordinator':
      return 'success'; // Merchandise coordinator works with business clients
    case 'program_admin_coordinator':
    case 'admin_dev_coordinator':
    case 'vocational_dev_coordinator':
    case 'executive_director':
    case 'director_org_dev':
    case 'director_program_dev':
      return 'success'; // Leadership roles default to success coach type
    case 'admin':
    case 'scheduler':
      return 'success'; // Admin roles default to success
    default:
      return 'success'; // Default fallback
  }
};

/**
 * Create login account for existing coach using REST API
 * FIXED: Better error handling and data validation
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
    
    // FIXED: Update coach document with auth info and ensure proper data structure
    console.log('Updating coach document with UID...');
    const updateData = {
      uid: uid,
      tempPassword: tempPassword,
      authAccountCreated: true,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'coaches', coach.id), updateData);
    
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
 * FIXED: Better data validation and notes handling
 * @param {string} coachId - Coach document ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateCoach = async (coachId, updates) => {
  try {
    // FIXED: Clean and validate updates
    const cleanUpdates = cleanCoachUpdates(updates);
    
    const coachRef = doc(db, 'coaches', coachId);
    await updateDoc(coachRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw new Error(`Failed to update coach: ${error.message}`);
  }
};

/**
 * FIXED: Clean coach update data
 * @param {Object} updates - Raw updates
 * @returns {Object} Cleaned updates
 */
const cleanCoachUpdates = (updates) => {
  const cleaned = {};
  
  // Only include valid fields
  const allowedFields = ['name', 'email', 'role', 'coachType', 'phone', 'notes', 'uid'];
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed || key === 'notes') { // Allow empty notes
          cleaned[key] = trimmed;
        }
      } else if (value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    }
  }
  
  // Validate email if being updated
  if (cleaned.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleaned.email)) {
      throw new Error('Invalid email format');
    }
    cleaned.email = cleaned.email.toLowerCase();
  }
  
  return cleaned;
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
 * FIXED: Better error handling and filtering
 * @param {Function} callback - Callback function to handle coaches data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCoaches = (callback) => {
  return onSnapshot(
    collection(db, 'coaches'), 
    (snapshot) => {
      try {
        const coachesData = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return { 
              id: doc.id, 
              ...data,
              // FIXED: Ensure role is always present
              role: data.role || 'coach',
              // FIXED: Ensure coachType is set appropriately
              coachType: data.coachType || getCoachTypeForRole(data.role || 'coach')
            };
          })
          .filter(user => {
            // Include all staff roles
            const staffRoles = [
              'coach', 
              'admin', 
              'scheduler',
              'merchandise_coordinator',
              'program_admin_coordinator',
              'admin_dev_coordinator',
              'vocational_dev_coordinator',
              'executive_director',
              'director_org_dev',
              'director_program_dev'
            ];
            return staffRoles.includes(user.role);
          });
        
        console.log('Coaches loaded:', coachesData.length, 'coaches');
        callback(coachesData);
      } catch (error) {
        console.error('Error processing coaches data:', error);
        callback([]); // Return empty array on error
      }
    },
    (error) => {
      console.error('Error in coaches subscription:', error);
      callback([]); // Return empty array on error
    }
  );
};