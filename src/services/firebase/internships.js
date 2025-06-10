// src/services/firebase/internships.js - Internship management for Bridges participants

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp 
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
    return { id: docRef.id, ...newInternship };
  } catch (error) {
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
    const internshipRef = doc(db, 'internships', internshipId);
    await updateDoc(internshipRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
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
    await deleteDoc(doc(db, 'internships', internshipId));
  } catch (error) {
    throw new Error(`Failed to remove internship: ${error.message}`);
  }
};

/**
 * Get all internships for a specific client
 * @param {string} clientId - Client ID
 * @returns {Promise<Array>} Array of internships
 */
export const getInternshipsForClient = async (clientId) => {
  try {
    const internshipsQuery = query(
      collection(db, 'internships'),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(internshipsQuery);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
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
    const internshipQuery = query(
      collection(db, 'internships'),
      where('__name__', '==', internshipId)
    );
    const snapshot = await getDocs(internshipQuery);
    
    if (snapshot.empty) {
      return null;
    }
    
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    throw new Error(`Failed to get internship: ${error.message}`);
  }
};

/**
 * Mark a day as completed for an internship
 * @param {string} internshipId - Internship document ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} dayData - Day completion data (hours, notes, etc.)
 * @returns {Promise<void>}
 */
export const markInternshipDay = async (internshipId, date, dayData) => {
  try {
    const internship = await getInternshipById(internshipId);
    if (!internship) {
      throw new Error('Internship not found');
    }
    
    const attendanceLog = internship.attendanceLog || [];
    const existingEntryIndex = attendanceLog.findIndex(entry => entry.date === date);
    
    const dayEntry = {
      date,
      ...dayData,
      markedAt: serverTimestamp()
    };
    
    if (existingEntryIndex >= 0) {
      // Update existing entry
      attendanceLog[existingEntryIndex] = dayEntry;
    } else {
      // Add new entry
      attendanceLog.push(dayEntry);
    }
    
    // Calculate completed days
    const completedDays = attendanceLog.filter(entry => entry.completed).length;
    
    // Update status if completed
    let status = internship.status;
    if (completedDays >= (internship.totalBusinessDays || 30) && status === INTERNSHIP_STATUS.IN_PROGRESS) {
      status = INTERNSHIP_STATUS.COMPLETED;
    }
    
    await updateInternship(internshipId, {
      attendanceLog,
      completedDays,
      status
    });
  } catch (error) {
    throw new Error(`Failed to mark internship day: ${error.message}`);
  }
};

/**
 * Add an evaluation to an internship
 * @param {string} internshipId - Internship document ID
 * @param {Object} evaluationData - Evaluation data
 * @returns {Promise<void>}
 */
export const addInternshipEvaluation = async (internshipId, evaluationData) => {
  try {
    const internship = await getInternshipById(internshipId);
    if (!internship) {
      throw new Error('Internship not found');
    }
    
    const evaluations = internship.evaluations || [];
    const newEvaluation = {
      ...evaluationData,
      id: Date.now().toString(),
      createdAt: serverTimestamp()
    };
    
    evaluations.push(newEvaluation);
    
    await updateInternship(internshipId, { evaluations });
  } catch (error) {
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
    await updateInternship(internshipId, {
      status: INTERNSHIP_STATUS.IN_PROGRESS,
      actualStartDate,
      startedAt: serverTimestamp()
    });
  } catch (error) {
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
    await updateInternship(internshipId, {
      status: INTERNSHIP_STATUS.COMPLETED,
      completionDate,
      completedAt: serverTimestamp(),
      ...completionData
    });
  } catch (error) {
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
    await updateInternship(internshipId, {
      status: INTERNSHIP_STATUS.CANCELLED,
      cancellationReason: reason,
      cancelledAt: serverTimestamp()
    });
  } catch (error) {
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
    
    return stats;
  } catch (error) {
    throw new Error(`Failed to get internship stats: ${error.message}`);
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

/**
 * Get all internships with real-time updates
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToInternships = (callback) => {
  return onSnapshot(
    collection(db, 'internships'),
    (snapshot) => {
      const internshipsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(internshipsData);
    },
    (error) => {
      console.error('Error in internships subscription:', error);
      callback([]);
    }
  );
};

/**
 * Get internships for a specific client with real-time updates
 * @param {string} clientId - Client ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToClientInternships = (clientId, callback) => {
  const internshipsQuery = query(
    collection(db, 'internships'),
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(
    internshipsQuery,
    (snapshot) => {
      const internshipsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(internshipsData);
    },
    (error) => {
      console.error('Error in client internships subscription:', error);
      callback([]);
    }
  );
};