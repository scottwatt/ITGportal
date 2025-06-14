// src/services/firebase/internships.js - FIXED: serverTimestamp issue in arrays

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  getDoc,  // Added getDoc for direct document access
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

import { db } from './config';
import { INTERNSHIP_STATUS } from '../../utils/constants';

/**
 * Add a new internship for a Bridges participant
 * @param {Object} internshipData - Internship data
 * @returns {Promise<Object>} Created internship
 */
export const addInternship = async (internshipData) => {
  try {
    console.log('🔄 Adding internship to Firestore:', internshipData);
    
    const newInternship = {
      ...internshipData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completedDays: 0,
      status: internshipData.status || INTERNSHIP_STATUS.PLANNED,
      evaluations: [],
      attendanceLog: []
    };
    
    const docRef = await addDoc(collection(db, 'internships'), newInternship);
    console.log('✅ Internship added with ID:', docRef.id);
    
    return { id: docRef.id, ...newInternship };
  } catch (error) {
    console.error('❌ Error adding internship to Firestore:', error);
    throw new Error(`Failed to add internship: ${error.message}`);
  }
};

/**
 * Update an existing internship
 * @param {string} internshipId - Internship document ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateInternship = async (internshipId, updates) => {
  try {
    console.log('🔄 Updating internship:', internshipId, updates);
    
    const internshipRef = doc(db, 'internships', internshipId);
    await updateDoc(internshipRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Internship updated successfully');
  } catch (error) {
    console.error('❌ Error updating internship:', error);
    throw new Error(`Failed to update internship: ${error.message}`);
  }
};

/**
 * Remove an internship
 * @param {string} internshipId - Internship document ID
 * @returns {Promise<void>}
 */
export const removeInternship = async (internshipId) => {
  try {
    console.log('🔄 Removing internship:', internshipId);
    
    if (!internshipId || typeof internshipId !== 'string') {
      throw new Error('Invalid internship ID provided');
    }
    
    // First verify the internship exists
    const internship = await getInternshipById(internshipId);
    if (!internship) {
      throw new Error(`Internship with ID ${internshipId} not found`);
    }
    
    // Delete the internship document
    const internshipRef = doc(db, 'internships', internshipId);
    await deleteDoc(internshipRef);
    
    console.log('✅ Internship removed successfully');
  } catch (error) {
    console.error('❌ Error removing internship:', error);
    throw new Error(`Failed to remove internship: ${error.message}`);
  }
};

/**
 * Get all internships for a specific client (fallback method)
 * @param {string} clientId - Client ID
 * @returns {Promise<Array>} Array of internships
 */
export const getInternshipsForClient = async (clientId) => {
  try {
    console.log('🔄 Getting internships for client:', clientId);
    
    // Use simple query without orderBy to avoid index issues
    const internshipsQuery = query(
      collection(db, 'internships'),
      where('clientId', '==', clientId)
    );
    const snapshot = await getDocs(internshipsQuery);
    
    const internships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort in JavaScript instead of Firestore to avoid index requirements
    internships.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA; // DESC order
    });
    
    console.log('✅ Retrieved internships for client:', internships.length);
    return internships;
  } catch (error) {
    console.error('❌ Error getting internships for client:', error);
    throw new Error(`Failed to get internships for client: ${error.message}`);
  }
};

/**
 * Get internship by ID
 * @param {string} internshipId - Internship document ID
 * @returns {Promise<Object|null>} Internship data or null
 */
export const getInternshipById = async (internshipId) => {
  try {
    console.log('🔄 Getting internship by ID:', internshipId);
    
    const internshipQuery = query(
      collection(db, 'internships'),
      where('__name__', '==', internshipId)
    );
    const snapshot = await getDocs(internshipQuery);
    
    if (snapshot.empty) {
      console.warn('⚠️ Internship not found:', internshipId);
      return null;
    }
    
    const internship = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    console.log('✅ Retrieved internship:', internship.id);
    return internship;
  } catch (error) {
    console.error('❌ Error getting internship by ID:', error);
    throw new Error(`Failed to get internship: ${error.message}`);
  }
};

/**
 * FIXED: Mark a day as completed for an internship
 * @param {string} internshipId - Internship document ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} dayData - Day completion data (hours, notes, etc.)
 * @returns {Promise<void>}
 */
export const markInternshipDay = async (internshipId, date, dayData) => {
  try {
    console.log('🔄 Marking internship day:', internshipId, date, dayData);
    
    const internship = await getInternshipById(internshipId);
    if (!internship) {
      throw new Error('Internship not found');
    }
    
    const attendanceLog = internship.attendanceLog || [];
    const existingEntryIndex = attendanceLog.findIndex(entry => entry.date === date);
    
    // FIXED: Use Firestore Timestamp instead of serverTimestamp() for array items
    const dayEntry = {
      date,
      ...dayData,
      markedAt: Timestamp.now() // Changed from serverTimestamp() to Timestamp.now()
    };
    
    if (existingEntryIndex >= 0) {
      attendanceLog[existingEntryIndex] = dayEntry;
    } else {
      attendanceLog.push(dayEntry);
    }
    
    const completedDays = attendanceLog.filter(entry => entry.completed).length;
    
    let status = internship.status;
    if (completedDays >= (internship.totalBusinessDays || 30) && status === INTERNSHIP_STATUS.IN_PROGRESS) {
      status = INTERNSHIP_STATUS.COMPLETED;
    }
    
    await updateInternship(internshipId, {
      attendanceLog,
      completedDays,
      status
    });
    
    console.log('✅ Internship day marked successfully');
  } catch (error) {
    console.error('❌ Error marking internship day:', error);
    throw new Error(`Failed to mark internship day: ${error.message}`);
  }
};

/**
 * FIXED: Add an evaluation to an internship
 * @param {string} internshipId - Internship document ID
 * @param {Object} evaluationData - Evaluation data
 * @returns {Promise<void>}
 */
export const addInternshipEvaluation = async (internshipId, evaluationData) => {
  try {
    console.log('🔄 Adding internship evaluation:', internshipId);
    
    const internship = await getInternshipById(internshipId);
    if (!internship) {
      throw new Error('Internship not found');
    }
    
    const evaluations = internship.evaluations || [];
    const newEvaluation = {
      ...evaluationData,
      id: Date.now().toString(),
      createdAt: Timestamp.now() // Changed from serverTimestamp() to Timestamp.now()
    };
    
    evaluations.push(newEvaluation);
    
    await updateInternship(internshipId, { evaluations });
    
    console.log('✅ Internship evaluation added successfully');
  } catch (error) {
    console.error('❌ Error adding internship evaluation:', error);
    throw new Error(`Failed to add evaluation: ${error.message}`);
  }
};

/**
 * Start an internship (change status from planned to in_progress)
 * @param {string} internshipId - Internship document ID
 * @param {string} actualStartDate - Actual start date
 * @returns {Promise<void>}
 */
export const startInternship = async (internshipId, actualStartDate) => {
  try {
    console.log('🔄 Starting internship:', internshipId, actualStartDate);
    
    await updateInternship(internshipId, {
      status: INTERNSHIP_STATUS.IN_PROGRESS,
      actualStartDate,
      startedAt: serverTimestamp() // This is fine since it's not in an array
    });
    
    console.log('✅ Internship started successfully');
  } catch (error) {
    console.error('❌ Error starting internship:', error);
    throw new Error(`Failed to start internship: ${error.message}`);
  }
};

/**
 * Complete an internship manually
 * @param {string} internshipId - Internship document ID
 * @param {string} completionDate - Completion date
 * @param {Object} completionData - Additional completion data
 * @returns {Promise<void>}
 */
export const completeInternship = async (internshipId, completionDate, completionData = {}) => {
  try {
    console.log('🔄 Completing internship:', internshipId, completionDate);
    
    await updateInternship(internshipId, {
      status: INTERNSHIP_STATUS.COMPLETED,
      completionDate,
      completedAt: serverTimestamp(), // This is fine since it's not in an array
      ...completionData
    });
    
    console.log('✅ Internship completed successfully');
  } catch (error) {
    console.error('❌ Error completing internship:', error);
    throw new Error(`Failed to complete internship: ${error.message}`);
  }
};

/**
 * Cancel an internship
 * @param {string} internshipId - Internship document ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<void>}
 */
export const cancelInternship = async (internshipId, reason) => {
  try {
    console.log('🔄 Cancelling internship:', internshipId, reason);
    
    await updateInternship(internshipId, {
      status: INTERNSHIP_STATUS.CANCELLED,
      cancellationReason: reason,
      cancelledAt: serverTimestamp() // This is fine since it's not in an array
    });
    
    console.log('✅ Internship cancelled successfully');
  } catch (error) {
    console.error('❌ Error cancelling internship:', error);
    throw new Error(`Failed to cancel internship: ${error.message}`);
  }
};

/**
 * Get internship statistics for a client
 * @param {string} clientId - Client ID
 * @returns {Promise<Object>} Internship statistics
 */
export const getClientInternshipStats = async (clientId) => {
  try {
    console.log('🔄 Getting internship stats for client:', clientId);
    
    const internships = await getInternshipsForClient(clientId);
    
    const stats = {
      total: internships.length,
      completed: internships.filter(i => i.status === INTERNSHIP_STATUS.COMPLETED).length,
      inProgress: internships.filter(i => i.status === INTERNSHIP_STATUS.IN_PROGRESS).length,
      planned: internships.filter(i => i.status === INTERNSHIP_STATUS.PLANNED).length,
      cancelled: internships.filter(i => i.status === INTERNSHIP_STATUS.CANCELLED).length,
      totalDaysCompleted: internships.reduce((sum, i) => sum + (i.completedDays || 0), 0),
      currentInternship: internships.find(i => i.status === INTERNSHIP_STATUS.IN_PROGRESS)
    };
    
    console.log('✅ Internship stats calculated:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error getting internship stats:', error);
    throw new Error(`Failed to get internship stats: ${error.message}`);
  }
};

/**
 * Get all internships with real-time updates (FIXED with better error handling)
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToInternships = (callback) => {
  console.log('🔄 Setting up subscription to all internships');
  
  try {
    return onSnapshot(
      collection(db, 'internships'),
      (snapshot) => {
        console.log('✅ All internships subscription update:', snapshot.docs.length, 'documents');
        
        const internshipsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort by creation date in JavaScript to avoid Firestore index requirements
        internshipsData.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA; // DESC order
        });
        
        callback(internshipsData);
      },
      (error) => {
        console.error('❌ Error in all internships subscription:', error);
        // Call callback with empty array on error to stop loading state
        callback([]);
      }
    );
  } catch (error) {
    console.error('❌ Error setting up all internships subscription:', error);
    // Return a no-op function and call callback with empty array
    callback([]);
    return () => {};
  }
};

/**
 * Get internships for a specific client with real-time updates (FIXED with fallback)
 * @param {string} clientId - Client ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToClientInternships = (clientId, callback) => {
  console.log('🔄 Setting up subscription to client internships:', clientId);
  
  try {
    // Try the orderBy query first, fall back to simple query if it fails
    let internshipsQuery;
    
    try {
      // This might fail if the compound index doesn't exist
      internshipsQuery = query(
        collection(db, 'internships'),
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc')
      );
      
      console.log('📋 Using ordered query for client internships');
    } catch (indexError) {
      console.warn('⚠️ Ordered query failed, falling back to simple query:', indexError);
      
      // Fallback to simple query without orderBy
      internshipsQuery = query(
        collection(db, 'internships'),
        where('clientId', '==', clientId)
      );
    }
    
    return onSnapshot(
      internshipsQuery,
      (snapshot) => {
        console.log('✅ Client internships subscription update:', snapshot.docs.length, 'documents for client', clientId);
        
        const internshipsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Always sort in JavaScript to ensure consistent ordering
        internshipsData.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA; // DESC order
        });
        
        callback(internshipsData);
      },
      (error) => {
        console.error('❌ Error in client internships subscription:', error);
        
        // If the error is related to missing index, try fallback
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
          console.warn('⚠️ Index error detected, attempting fallback query...');
          
          // Try simple query without orderBy as fallback
          const fallbackQuery = query(
            collection(db, 'internships'),
            where('clientId', '==', clientId)
          );
          
          return onSnapshot(
            fallbackQuery,
            (snapshot) => {
              console.log('✅ Fallback query successful:', snapshot.docs.length, 'documents');
              
              const internshipsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              
              // Sort in JavaScript
              internshipsData.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB - dateA;
              });
              
              callback(internshipsData);
            },
            (fallbackError) => {
              console.error('❌ Fallback query also failed:', fallbackError);
              callback([]);
            }
          );
        } else {
          // For other errors, just call callback with empty array
          callback([]);
        }
      }
    );
  } catch (error) {
    console.error('❌ Error setting up client internships subscription:', error);
    // Return a no-op function and call callback with empty array
    callback([]);
    return () => {};
  }
};

/**
 * Calculate business days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Array} workingDays - Array of working day names
 * @returns {number} Number of business days
 */
export const calculateBusinessDays = (startDate, endDate, workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayName = current.toLocaleDateString('en-US', { 
      timeZone: 'America/Los_Angeles',
      weekday: 'long' 
    }).toLowerCase();
    
    if (workingDays.includes(dayName)) {
      count++;
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

/**
 * Calculate estimated end date based on schedule
 * @param {Date} startDate - Start date
 * @param {number} totalBusinessDays - Total business days needed
 * @param {Array} workingDays - Array of working day names
 * @returns {Date} Estimated end date
 */
export const calculateEstimatedEndDate = (startDate, totalBusinessDays = 30, workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) => {
  let count = 0;
  const current = new Date(startDate);
  
  while (count < totalBusinessDays) {
    const dayName = current.toLocaleDateString('en-US', { 
      timeZone: 'America/Los_Angeles',
      weekday: 'long' 
    }).toLowerCase();
    
    if (workingDays.includes(dayName)) {
      count++;
    }
    
    if (count < totalBusinessDays) {
      current.setDate(current.getDate() + 1);
    }
  }
  
  return current;
};