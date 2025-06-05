// src/services/firebase/graceAttendance.js
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
 * Mark attendance for a Grace participant
 * @param {string} clientId - Client ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {boolean} present - Whether client was present
 * @param {string} notes - Optional notes about attendance
 * @returns {Promise<Object>} Created/updated attendance record
 */
export const markAttendance = async (clientId, date, present, notes = '') => {
  try {
    // Check if attendance record already exists for this client and date
    const existingQuery = query(
      collection(db, 'grace-attendance'),
      where('clientId', '==', clientId),
      where('date', '==', date)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    const attendanceData = {
      clientId,
      date,
      present,
      notes: notes.trim(),
      updatedAt: serverTimestamp()
    };
    
    if (!existingSnapshot.empty) {
      // Update existing record
      const docId = existingSnapshot.docs[0].id;
      await updateDoc(doc(db, 'grace-attendance', docId), attendanceData);
      return { id: docId, ...attendanceData };
    } else {
      // Create new record
      attendanceData.createdAt = serverTimestamp();
      const docRef = await addDoc(collection(db, 'grace-attendance'), attendanceData);
      return { id: docRef.id, ...attendanceData };
    }
  } catch (error) {
    throw new Error(`Failed to mark attendance: ${error.message}`);
  }
};

/**
 * Mark attendance for multiple clients on the same date (bulk operation)
 * @param {Array} attendanceRecords - Array of {clientId, present, notes} objects
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of created/updated attendance records
 */
export const markBulkAttendance = async (attendanceRecords, date) => {
  try {
    const batch = writeBatch(db);
    const results = [];
    
    for (const record of attendanceRecords) {
      // Check if attendance record already exists
      const existingQuery = query(
        collection(db, 'grace-attendance'),
        where('clientId', '==', record.clientId),
        where('date', '==', date)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      const attendanceData = {
        clientId: record.clientId,
        date,
        present: record.present,
        notes: (record.notes || '').trim(),
        updatedAt: serverTimestamp()
      };
      
      if (!existingSnapshot.empty) {
        // Update existing record
        const docId = existingSnapshot.docs[0].id;
        const docRef = doc(db, 'grace-attendance', docId);
        batch.update(docRef, attendanceData);
        results.push({ id: docId, ...attendanceData });
      } else {
        // Create new record
        attendanceData.createdAt = serverTimestamp();
        const docRef = doc(collection(db, 'grace-attendance'));
        batch.set(docRef, attendanceData);
        results.push({ id: docRef.id, ...attendanceData });
      }
    }
    
    await batch.commit();
    return results;
  } catch (error) {
    throw new Error(`Failed to mark bulk attendance: ${error.message}`);
  }
};

/**
 * Get attendance for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of attendance records for the date
 */
export const getAttendanceForDate = async (date) => {
  try {
    const attendanceQuery = query(
      collection(db, 'grace-attendance'),
      where('date', '==', date)
    );
    const snapshot = await getDocs(attendanceQuery);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Failed to get attendance for date: ${error.message}`);
  }
};

/**
 * Get attendance for a client within a date range
 * @param {string} clientId - Client ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of attendance records
 */
export const getClientAttendanceRange = async (clientId, startDate, endDate) => {
  try {
    const attendanceQuery = query(
      collection(db, 'grace-attendance'),
      where('clientId', '==', clientId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const snapshot = await getDocs(attendanceQuery);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Failed to get client attendance range: ${error.message}`);
  }
};

/**
 * Get attendance summary for a client
 * @param {string} clientId - Client ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Attendance summary
 */
export const getClientAttendanceSummary = async (clientId, startDate, endDate) => {
  try {
    const records = await getClientAttendanceRange(clientId, startDate, endDate);
    
    const summary = {
      totalDays: records.length,
      presentDays: records.filter(r => r.present).length,
      absentDays: records.filter(r => !r.present).length,
      attendanceRate: 0,
      consecutiveAbsences: 0,
      longestStreak: 0
    };
    
    if (summary.totalDays > 0) {
      summary.attendanceRate = Math.round((summary.presentDays / summary.totalDays) * 100);
    }
    
    // Calculate consecutive absences and longest streak
    const sortedRecords = records.sort((a, b) => b.date.localeCompare(a.date));
    let currentStreak = 0;
    let longestStreak = 0;
    let consecutiveAbsences = 0;
    
    for (let i = 0; i < sortedRecords.length; i++) {
      const record = sortedRecords[i];
      
      if (record.present) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
        if (i === 0) consecutiveAbsences = 0; // Reset if most recent day was present
      } else {
        currentStreak = 0;
        if (i === consecutiveAbsences) {
          consecutiveAbsences++;
        }
      }
    }
    
    summary.longestStreak = longestStreak;
    summary.consecutiveAbsences = consecutiveAbsences;
    
    return summary;
  } catch (error) {
    throw new Error(`Failed to get client attendance summary: ${error.message}`);
  }
};

/**
 * Get attendance summary for all Grace clients within a date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Summary for all clients
 */
export const getAllGraceAttendanceSummary = async (startDate, endDate) => {
  try {
    const attendanceQuery = query(
      collection(db, 'grace-attendance'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const snapshot = await getDocs(attendanceQuery);
    
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const clientSummaries = {};
    
    records.forEach(record => {
      if (!clientSummaries[record.clientId]) {
        clientSummaries[record.clientId] = {
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          attendanceRate: 0
        };
      }
      
      const summary = clientSummaries[record.clientId];
      summary.totalDays++;
      
      if (record.present) {
        summary.presentDays++;
      } else {
        summary.absentDays++;
      }
      
      summary.attendanceRate = Math.round((summary.presentDays / summary.totalDays) * 100);
    });
    
    return clientSummaries;
  } catch (error) {
    throw new Error(`Failed to get all Grace attendance summary: ${error.message}`);
  }
};

/**
 * Get monthly attendance statistics
 * @param {number} year - Year (e.g., 2024)
 * @param {number} month - Month (1-12)
 * @returns {Promise<Object>} Monthly statistics
 */
export const getMonthlyAttendanceStats = async (year, month) => {
  try {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    const attendanceQuery = query(
      collection(db, 'grace-attendance'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const snapshot = await getDocs(attendanceQuery);
    
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const stats = {
      totalRecords: records.length,
      presentCount: records.filter(r => r.present).length,
      absentCount: records.filter(r => !r.present).length,
      dailyStats: {},
      clientStats: {}
    };
    
    // Group by date
    records.forEach(record => {
      if (!stats.dailyStats[record.date]) {
        stats.dailyStats[record.date] = {
          present: 0,
          absent: 0,
          total: 0
        };
      }
      
      stats.dailyStats[record.date].total++;
      
      if (record.present) {
        stats.dailyStats[record.date].present++;
      } else {
        stats.dailyStats[record.date].absent++;
      }
    });
    
    // Group by client
    records.forEach(record => {
      if (!stats.clientStats[record.clientId]) {
        stats.clientStats[record.clientId] = {
          present: 0,
          absent: 0,
          total: 0,
          attendanceRate: 0
        };
      }
      
      const clientStat = stats.clientStats[record.clientId];
      clientStat.total++;
      
      if (record.present) {
        clientStat.present++;
      } else {
        clientStat.absent++;
      }
      
      clientStat.attendanceRate = Math.round((clientStat.present / clientStat.total) * 100);
    });
    
    return stats;
  } catch (error) {
    throw new Error(`Failed to get monthly attendance stats: ${error.message}`);
  }
};

/**
 * Set up real-time listener for Grace attendance
 * @param {Function} callback - Callback function to handle attendance data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToGraceAttendance = (callback) => {
  return onSnapshot(
    collection(db, 'grace-attendance'),
    (snapshot) => {
      const attendanceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(attendanceData);
    },
    (error) => {
      console.error('Error in Grace attendance subscription:', error);
      callback([]); // Return empty array on error
    }
  );
};

/**
 * Get attendance status for multiple clients on a specific date
 * @param {Array} clientIds - Array of client IDs
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Object with clientId as key and attendance record as value
 */
export const getAttendanceStatusForClients = async (clientIds, date) => {
  try {
    const attendanceQuery = query(
      collection(db, 'grace-attendance'),
      where('date', '==', date)
    );
    const snapshot = await getDocs(attendanceQuery);
    
    const attendanceMap = {};
    
    // Initialize all clients as not marked
    clientIds.forEach(clientId => {
      attendanceMap[clientId] = null;
    });
    
    // Fill in actual attendance records
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (clientIds.includes(data.clientId)) {
        attendanceMap[data.clientId] = { id: doc.id, ...data };
      }
    });
    
    return attendanceMap;
  } catch (error) {
    throw new Error(`Failed to get attendance status for clients: ${error.message}`);
  }
};