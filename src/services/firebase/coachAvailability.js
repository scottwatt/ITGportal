// src/services/firebase/coachAvailability.js 
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  deleteDoc, 
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

import { db } from './config';

/**
 * Set coach availability for a specific date
 * @param {string} coachId - Coach ID (uid or document id)
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} status - 'available', 'off', 'sick', 'vacation'
 * @param {string} reason - Optional reason for time off
 * @returns {Promise<Object>} Created/updated availability record
 */
export const setCoachAvailability = async (coachId, date, status, reason = '') => {
  try {
    // Check if availability record already exists for this coach and date
    const existingQuery = query(
      collection(db, 'coach-availability'),
      where('coachId', '==', coachId),
      where('date', '==', date)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    const availabilityData = {
      coachId,
      date,
      status,
      reason: reason.trim(),
      updatedAt: serverTimestamp()
    };
    
    if (!existingSnapshot.empty) {
      // Update existing record
      const docId = existingSnapshot.docs[0].id;
      await updateDoc(doc(db, 'coach-availability', docId), availabilityData);
      return { id: docId, ...availabilityData };
    } else {
      // Create new record
      availabilityData.createdAt = serverTimestamp();
      const docRef = await addDoc(collection(db, 'coach-availability'), availabilityData);
      return { id: docRef.id, ...availabilityData };
    }
  } catch (error) {
    throw new Error(`Failed to set coach availability: ${error.message}`);
  }
};

/**
 * Remove coach availability for a specific date
 * @param {string} coachId - Coach ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<void>}
 */
export const removeCoachAvailability = async (coachId, date) => {
  try {
    const existingQuery = query(
      collection(db, 'coach-availability'),
      where('coachId', '==', coachId),
      where('date', '==', date)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      await deleteDoc(doc(db, 'coach-availability', existingSnapshot.docs[0].id));
    }
  } catch (error) {
    throw new Error(`Failed to remove coach availability: ${error.message}`);
  }
};

/**
 * Get coach availability for a specific date
 * @param {string} coachId - Coach ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object|null>} Availability record or null
 */
export const getCoachAvailability = async (coachId, date) => {
  try {
    const availabilityQuery = query(
      collection(db, 'coach-availability'),
      where('coachId', '==', coachId),
      where('date', '==', date)
    );
    const snapshot = await getDocs(availabilityQuery);
    
    if (snapshot.empty) {
      return null;
    }
    
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    throw new Error(`Failed to get coach availability: ${error.message}`);
  }
};

/**
 * Get availability records for a date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of availability records
 */
export const getAvailabilityForDateRange = async (startDate, endDate) => {
  try {
    const availabilityQuery = query(
      collection(db, 'coach-availability'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const snapshot = await getDocs(availabilityQuery);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Failed to get availability for date range: ${error.message}`);
  }
};

/**
 * Get all availability records for a specific coach
 * @param {string} coachId - Coach ID
 * @returns {Promise<Array>} Array of availability records
 */
export const getCoachAvailabilityRecords = async (coachId) => {
  try {
    const availabilityQuery = query(
      collection(db, 'coach-availability'),
      where('coachId', '==', coachId)
    );
    const snapshot = await getDocs(availabilityQuery);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Failed to get coach availability records: ${error.message}`);
  }
};

/**
 * Set up real-time listener for coach availability
 * @param {Function} callback - Callback function to handle availability data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCoachAvailability = (callback) => {
  return onSnapshot(
    collection(db, 'coach-availability'),
    (snapshot) => {
      const availabilityData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(availabilityData);
    },
    (error) => {
      console.error('Error in coach availability subscription:', error);
      callback([]); // Return empty array on error
    }
  );
};

/**
 * Get available coaches for a specific date
 * @param {Array} allCoaches - All coaches
 * @param {Array} availabilityRecords - All availability records
 * @param {string} date - Date to check
 * @returns {Array} Available coaches
 */
export const getAvailableCoachesForDate = (allCoaches, availabilityRecords, date) => {
  return allCoaches.filter(coach => {
    const coachId = coach.uid || coach.id;
    const unavailableRecord = availabilityRecords.find(record => 
      record.coachId === coachId && 
      record.date === date && 
      record.status !== 'available'
    );
    return !unavailableRecord;
  });
};

/**
 * Unassign clients from a coach when they become unavailable
 * @param {string} coachId - Coach ID
 * @param {string} date - Date
 * @param {Array} schedules - All schedules
 * @param {Function} removeScheduleAssignment - Function to remove schedule
 * @returns {Promise<Array>} Array of affected clients
 */
export const unassignClientsFromUnavailableCoach = async (coachId, date, schedules, removeScheduleAssignment) => {
  try {
    const affectedSchedules = schedules.filter(schedule => 
      schedule.coachId === coachId && schedule.date === date
    );
    
    const affectedClients = [];
    
    for (const schedule of affectedSchedules) {
      await removeScheduleAssignment(schedule.id);
      affectedClients.push(schedule.clientId);
    }
    
    return affectedClients;
  } catch (error) {
    throw new Error(`Failed to unassign clients: ${error.message}`);
  }
};


/**
 * Set coach availability for multiple dates (bulk operation)
 * @param {string} coachId - Coach ID (uid or document id)
 * @param {Array} dates - Array of dates in YYYY-MM-DD format
 * @param {string} status - 'available', 'off', 'sick', 'vacation'
 * @param {string} reason - Optional reason for time off
 * @returns {Promise<Array>} Array of created/updated availability records
 */
export const setCoachAvailabilityBulk = async (coachId, dates, status, reason = '') => {
  try {
    console.log('Setting bulk availability:', { coachId, dates, status, reason }); // DEBUG
    
    const results = [];
    
    // Process dates one by one to ensure proper error handling and real-time updates
    for (const date of dates) {
      try {
        const result = await setCoachAvailability(coachId, date, status, reason);
        results.push(result);
        console.log('Successfully set availability for date:', date, result); // DEBUG
      } catch (dateError) {
        console.error('Error setting availability for date:', date, dateError);
        throw new Error(`Failed to set availability for ${date}: ${dateError.message}`);
      }
    }
    
    console.log('Bulk availability set successfully:', results); // DEBUG
    return results;
  } catch (error) {
    console.error('Error in setCoachAvailabilityBulk:', error);
    throw new Error(`Failed to set bulk coach availability: ${error.message}`);
  }
};

/**
 * Remove coach availability for multiple dates (bulk operation)
 * @param {string} coachId - Coach ID
 * @param {Array} dates - Array of dates in YYYY-MM-DD format
 * @returns {Promise<void>}
 */
export const removeCoachAvailabilityBulk = async (coachId, dates) => {
  try {
    const batch = writeBatch(db);
    
    for (const date of dates) {
      const existingQuery = query(
        collection(db, 'coach-availability'),
        where('coachId', '==', coachId),
        where('date', '==', date)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        const docRef = doc(db, 'coach-availability', existingSnapshot.docs[0].id);
        batch.delete(docRef);
      }
    }
    
    await batch.commit();
  } catch (error) {
    throw new Error(`Failed to remove bulk coach availability: ${error.message}`);
  }
};

/**
 * Get yearly time-off summary for a coach
 * @param {string} coachId - Coach ID
 * @param {number} year - Year (e.g., 2024)
 * @returns {Promise<Object>} Summary of time off usage
 */
export const getYearlyTimeOffSummary = async (coachId, year) => {
  try {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const availabilityQuery = query(
      collection(db, 'coach-availability'),
      where('coachId', '==', coachId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const snapshot = await getDocs(availabilityQuery);
    
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const summary = {
      totalDays: records.length,
      byStatus: {},
      byMonth: {},
      periods: []
    };
    
    // Group by status
    records.forEach(record => {
      summary.byStatus[record.status] = (summary.byStatus[record.status] || 0) + 1;
    });
    
    // Group by month
    records.forEach(record => {
      const month = record.date.substring(0, 7); // YYYY-MM
      if (!summary.byMonth[month]) {
        summary.byMonth[month] = {};
      }
      summary.byMonth[month][record.status] = (summary.byMonth[month][record.status] || 0) + 1;
    });
    
    // Group consecutive days into periods
    const sortedRecords = records.sort((a, b) => a.date.localeCompare(b.date));
    let currentPeriod = null;
    
    sortedRecords.forEach(record => {
      if (!currentPeriod || 
          currentPeriod.status !== record.status || 
          currentPeriod.reason !== record.reason ||
          getDaysDifference(currentPeriod.endDate, record.date) > 1) {
        // Start new period
        currentPeriod = {
          startDate: record.date,
          endDate: record.date,
          status: record.status,
          reason: record.reason,
          days: 1
        };
        summary.periods.push(currentPeriod);
      } else {
        // Extend current period
        currentPeriod.endDate = record.date;
        currentPeriod.days++;
      }
    });
    
    return summary;
  } catch (error) {
    throw new Error(`Failed to get yearly time-off summary: ${error.message}`);
  }
};

/**
 * Get all coaches' time-off summary for a year
 * @param {number} year - Year (e.g., 2024)
 * @returns {Promise<Object>} Summary for all coaches
 */
export const getAllCoachesTimeOffSummary = async (year) => {
  try {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const availabilityQuery = query(
      collection(db, 'coach-availability'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const snapshot = await getDocs(availabilityQuery);
    
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const coachSummaries = {};
    
    records.forEach(record => {
      if (!coachSummaries[record.coachId]) {
        coachSummaries[record.coachId] = {
          totalDays: 0,
          byStatus: {}
        };
      }
      
      coachSummaries[record.coachId].totalDays++;
      coachSummaries[record.coachId].byStatus[record.status] = 
        (coachSummaries[record.coachId].byStatus[record.status] || 0) + 1;
    });
    
    return coachSummaries;
  } catch (error) {
    throw new Error(`Failed to get all coaches time-off summary: ${error.message}`);
  }
};

/**
 * Generate date range array
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array} Array of date strings
 */
export const generateDateRange = (startDate, endDate) => {
  const dates = [];
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

/**
 * Helper function to get days difference between two dates
 * @param {string} date1 - First date (YYYY-MM-DD)
 * @param {string} date2 - Second date (YYYY-MM-DD)
 * @returns {number} Days difference
 */
const getDaysDifference = (date1, date2) => {
  const d1 = new Date(date1 + 'T12:00:00');
  const d2 = new Date(date2 + 'T12:00:00');
  return Math.abs((d2 - d1) / (1000 * 60 * 60 * 24));
};