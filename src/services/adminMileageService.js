// src/services/adminMileageService.js - Service for admin mileage overview
import { 
  collection, 
  getDocs,
  query, 
  where, 
  orderBy
} from 'firebase/firestore';
import { db } from './firebase/config';

const COLLECTION_NAME = 'mileageRecords';

/**
 * Get all mileage records for all coaches (admin only)
 * @returns {Promise<Array>} Array of all mileage records with coach info
 */
export const getAllCoachMileageRecords = async () => {
  try {
    // Get all mileage records
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const allRecords = [];
    
    querySnapshot.forEach((doc) => {
      allRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return allRecords;
  } catch (error) {
    console.error('❌ Error getting all coach mileage records:', error);
    throw new Error('Failed to load mileage records');
  }
};

/**
 * Get mileage records for a specific date range (admin only)
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of mileage records in date range
 */
export const getMileageRecordsInDateRange = async (startDate, endDate) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const records = [];
    
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return records;
  } catch (error) {
    console.error('❌ Error getting mileage records for date range:', error);
    throw new Error('Failed to load mileage records for date range');
  }
};

/**
 * Get mileage records for a specific month across all coaches (admin only)
 * @param {number} year - Year (e.g., 2024)
 * @param {number} month - Month (1-12)
 * @returns {Promise<Array>} Array of mileage records for the month
 */
export const getAllCoachMileageForMonth = async (year, month) => {
  try {
    // Create date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const q = query(
      collection(db, COLLECTION_NAME),
      where('date', '>=', startDate),
      where('date', '<', endDate),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const records = [];
    
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return records;
  } catch (error) {
    console.error('❌ Error getting monthly mileage for all coaches:', error);
    throw new Error('Failed to load monthly mileage records');
  }
};

/**
 * Get mileage summary by coach for a specific period
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Summary object grouped by coach
 */
export const getMileageSummaryByCoach = async (startDate, endDate) => {
  try {
    const records = await getMileageRecordsInDateRange(startDate, endDate);
    
    const summaryByCoach = {};
    
    records.forEach(record => {
      if (!summaryByCoach[record.coachId]) {
        summaryByCoach[record.coachId] = {
          coachId: record.coachId,
          totalMiles: 0,
          totalRecords: 0,
          records: []
        };
      }
      
      summaryByCoach[record.coachId].totalMiles += record.mileage;
      summaryByCoach[record.coachId].totalRecords += 1;
      summaryByCoach[record.coachId].records.push(record);
    });
    
    return summaryByCoach;
  } catch (error) {
    console.error('❌ Error getting mileage summary by coach:', error);
    throw new Error('Failed to generate mileage summary');
  }
};


export { 
  getAllCoachMileageRecords, 
  getMileageRecordsInDateRange,
  getAllCoachMileageForMonth,
  getAllClientTransportationStats,
  getClientTransportationStats
} from './mileageService';