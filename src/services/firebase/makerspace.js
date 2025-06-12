// src/services/firebase/makerspace.js
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';

import { db } from './config';

/**
 * Add a new makerspace request
 * @param {Object} requestData - Request data
 * @returns {Promise<Object>} Created request
 */
export const addMakerspaceRequest = async (requestData) => {
  try {
    const docRef = await addDoc(collection(db, 'makerspaceRequests'), {
      ...requestData,
      status: 'pending',
      requestedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...requestData };
  } catch (error) {
    throw new Error(`Failed to add makerspace request: ${error.message}`);
  }
};

/**
 * Update a makerspace request
 * @param {string} requestId - Request ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateMakerspaceRequest = async (requestId, updates) => {
  try {
    await updateDoc(doc(db, 'makerspaceRequests', requestId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw new Error(`Failed to update makerspace request: ${error.message}`);
  }
};

/**
 * Delete a makerspace request
 * @param {string} requestId - Request ID
 * @returns {Promise<void>}
 */
export const deleteMakerspaceRequest = async (requestId) => {
  try {
    await deleteDoc(doc(db, 'makerspaceRequests', requestId));
  } catch (error) {
    throw new Error(`Failed to delete makerspace request: ${error.message}`);
  }
};

/**
 * Subscribe to makerspace requests
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToMakerspaceRequests = (callback) => {
  return onSnapshot(
    query(collection(db, 'makerspaceRequests'), orderBy('requestedAt', 'desc')),
    (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate(),
        reviewedAt: doc.data().reviewedAt?.toDate()
      }));
      callback(requests);
    },
    (error) => {
      console.error('Error in makerspace requests subscription:', error);
      callback([]);
    }
  );
};

/**
 * Get requests for a specific client
 * @param {string} clientId - Client ID
 * @returns {Promise<Array>} Client's requests
 */
export const getRequestsForClient = async (clientId) => {
  try {
    const q = query(
      collection(db, 'makerspaceRequests'),
      where('clientId', '==', clientId),
      orderBy('requestedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      requestedAt: doc.data().requestedAt?.toDate(),
      reviewedAt: doc.data().reviewedAt?.toDate()
    }));
  } catch (error) {
    throw new Error(`Failed to get requests for client: ${error.message}`);
  }
};

/**
 * Add a makerspace schedule entry
 * @param {Object} entryData - Schedule entry data
 * @returns {Promise<Object>} Created entry
 */
export const addMakerspaceScheduleEntry = async (entryData) => {
  try {
    const docRef = await addDoc(collection(db, 'makerspaceSchedule'), {
      ...entryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...entryData };
  } catch (error) {
    throw new Error(`Failed to add schedule entry: ${error.message}`);
  }
};

/**
 * Update a makerspace schedule entry
 * @param {string} entryId - Entry ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateMakerspaceScheduleEntry = async (entryId, updates) => {
  try {
    await updateDoc(doc(db, 'makerspaceSchedule', entryId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw new Error(`Failed to update schedule entry: ${error.message}`);
  }
};

/**
 * Delete a makerspace schedule entry
 * @param {string} entryId - Entry ID
 * @returns {Promise<void>}
 */
export const deleteMakerspaceScheduleEntry = async (entryId) => {
  try {
    await deleteDoc(doc(db, 'makerspaceSchedule', entryId));
  } catch (error) {
    throw new Error(`Failed to delete schedule entry: ${error.message}`);
  }
};

/**
 * Subscribe to makerspace schedule
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToMakerspaceSchedule = (callback) => {
  return onSnapshot(
    query(collection(db, 'makerspaceSchedule'), orderBy('date', 'asc')),
    (snapshot) => {
      const schedule = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      callback(schedule);
    },
    (error) => {
      console.error('Error in makerspace schedule subscription:', error);
      callback([]);
    }
  );
};

/**
 * Add a walkthrough
 * @param {Object} walkthroughData - Walkthrough data
 * @returns {Promise<Object>} Created walkthrough
 */
export const addWalkthrough = async (walkthroughData) => {
  try {
    const docRef = await addDoc(collection(db, 'walkthroughs'), {
      ...walkthroughData,
      status: 'scheduled',
      createdAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...walkthroughData };
  } catch (error) {
    throw new Error(`Failed to add walkthrough: ${error.message}`);
  }
};

/**
 * Update a walkthrough
 * @param {string} walkthroughId - Walkthrough ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateWalkthrough = async (walkthroughId, updates) => {
  try {
    await updateDoc(doc(db, 'walkthroughs', walkthroughId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw new Error(`Failed to update walkthrough: ${error.message}`);
  }
};

/**
 * Delete a walkthrough
 * @param {string} walkthroughId - Walkthrough ID
 * @returns {Promise<void>}
 */
export const deleteWalkthrough = async (walkthroughId) => {
  try {
    await deleteDoc(doc(db, 'walkthroughs', walkthroughId));
  } catch (error) {
    throw new Error(`Failed to delete walkthrough: ${error.message}`);
  }
};

/**
 * Complete a walkthrough
 * @param {string} walkthroughId - Walkthrough ID
 * @param {string} completionNotes - Completion notes
 * @returns {Promise<void>}
 */
export const completeWalkthrough = async (walkthroughId, completionNotes = '') => {
  try {
    await updateDoc(doc(db, 'walkthroughs', walkthroughId), {
      status: 'completed',
      completedAt: serverTimestamp(),
      completionNotes,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw new Error(`Failed to complete walkthrough: ${error.message}`);
  }
};

/**
 * Subscribe to walkthroughs
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToWalkthroughs = (callback) => {
  return onSnapshot(
    query(collection(db, 'walkthroughs'), orderBy('date', 'asc')),
    (snapshot) => {
      const walkthroughs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate()
      }));
      callback(walkthroughs);
    },
    (error) => {
      console.error('Error in walkthroughs subscription:', error);
      callback([]);
    }
  );
};

/**
 * Get schedule for a specific date
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<Array>} Schedule entries for the date
 */
export const getMakerspaceScheduleForDate = async (date) => {
  try {
    const q = query(
      collection(db, 'makerspaceSchedule'),
      where('date', '==', date),
      orderBy('timeSlot', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
  } catch (error) {
    throw new Error(`Failed to get schedule for date: ${error.message}`);
  }
};

/**
 * Get walkthroughs for a specific date
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<Array>} Walkthroughs for the date
 */
export const getWalkthroughsForDate = async (date) => {
  try {
    const q = query(
      collection(db, 'walkthroughs'),
      where('date', '==', date),
      orderBy('timeSlot', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      completedAt: doc.data().completedAt?.toDate()
    }));
  } catch (error) {
    throw new Error(`Failed to get walkthroughs for date: ${error.message}`);
  }
};

/**
 * Check if a time slot is available for a date
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {string} timeSlot - Time slot ID
 * @returns {Promise<boolean>} Whether the time slot is available
 */
export const isTimeSlotAvailable = async (date, timeSlot) => {
  try {
    // Check schedule
    const scheduleQuery = query(
      collection(db, 'makerspaceSchedule'),
      where('date', '==', date),
      where('timeSlot', '==', timeSlot)
    );
    
    const scheduleSnapshot = await getDocs(scheduleQuery);
    
    // Check walkthroughs
    const walkthroughQuery = query(
      collection(db, 'walkthroughs'),
      where('date', '==', date),
      where('timeSlot', '==', timeSlot)
    );
    
    const walkthroughSnapshot = await getDocs(walkthroughQuery);
    
    // Time slot is available if nothing is scheduled
    return scheduleSnapshot.empty && walkthroughSnapshot.empty;
  } catch (error) {
    throw new Error(`Failed to check time slot availability: ${error.message}`);
  }
};

/**
 * Get statistics for makerspace usage
 * @returns {Promise<Object>} Usage statistics
 */
export const getMakerspaceStatistics = async () => {
  try {
    // Get all requests
    const requestsSnapshot = await getDocs(collection(db, 'makerspaceRequests'));
    const requests = requestsSnapshot.docs.map(doc => doc.data());
    
    // Get all schedule entries
    const scheduleSnapshot = await getDocs(collection(db, 'makerspaceSchedule'));
    const schedule = scheduleSnapshot.docs.map(doc => doc.data());
    
    // Get all walkthroughs
    const walkthroughsSnapshot = await getDocs(collection(db, 'walkthroughs'));
    const walkthroughs = walkthroughsSnapshot.docs.map(doc => doc.data());
    
    const stats = {
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      approvedRequests: requests.filter(r => r.status === 'approved').length,
      declinedRequests: requests.filter(r => r.status === 'declined').length,
      totalScheduleEntries: schedule.length,
      totalWalkthroughs: walkthroughs.length,
      completedWalkthroughs: walkthroughs.filter(w => w.status === 'completed').length
    };
    
    return stats;
  } catch (error) {
    throw new Error(`Failed to get makerspace statistics: ${error.message}`);
  }
};