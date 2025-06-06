// src/services/mileageService.js - Firebase service for mileage tracking
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase/config';

const COLLECTION_NAME = 'mileageRecords';

// Subscribe to real-time mileage records for a coach
export const subscribeToCoachMileage = (coachId, callback) => {
  if (!coachId) {
    console.warn('No coach ID provided for mileage subscription');
    return () => {}; // Return empty unsubscribe function
  }

  try {
    // Simple query - only filter by coachId to avoid index requirement
    const q = query(
      collection(db, COLLECTION_NAME),
      where('coachId', '==', coachId)
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const records = [];
        querySnapshot.forEach((doc) => {
          records.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Sort by date in JavaScript
        const sortedRecords = records.sort((a, b) => b.date.localeCompare(a.date));
        callback(sortedRecords);
      },
      (error) => {
        console.error('❌ Error in mileage subscription:', error);
        callback([]); // Return empty array on error
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up mileage subscription:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

// Add a new mileage record
export const addMileageRecord = async (coachId, recordData) => {
  if (!coachId) {
    throw new Error('Coach ID is required');
  }

  if (!recordData.date || !recordData.startLocation || !recordData.endLocation || !recordData.mileage || !recordData.purpose) {
    throw new Error('All required fields must be provided');
  }

  try {
    console.log('➕ Adding mileage record for coach:', coachId);
    console.log('📝 Record data:', recordData);
    
    const newRecord = {
      coachId,
      date: recordData.date,
      startLocation: recordData.startLocation.trim(),
      endLocation: recordData.endLocation.trim(),
      purpose: recordData.purpose.trim(),
      mileage: parseFloat(recordData.mileage),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('📤 Sending to Firestore:', newRecord);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newRecord);
    
    console.log('✅ Successfully added mileage record with ID:', docRef.id);
    
    return {
      id: docRef.id,
      ...newRecord
    };
  } catch (error) {
    console.error('❌ Error adding mileage record:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    throw new Error(`Failed to add mileage record: ${error.message}`);
  }
};

// Update an existing mileage record
export const updateMileageRecord = async (recordId, updates) => {
  if (!recordId) {
    throw new Error('Record ID is required');
  }

  try {
    const recordRef = doc(db, COLLECTION_NAME, recordId);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(recordRef, updateData);
    
    return {
      id: recordId,
      ...updateData
    };
  } catch (error) {
    console.error('Error updating mileage record:', error);
    throw new Error('Failed to update mileage record');
  }
};

// Delete a mileage record
export const deleteMileageRecord = async (recordId) => {
  if (!recordId) {
    throw new Error('Record ID is required');
  }

  try {
    const recordRef = doc(db, COLLECTION_NAME, recordId);
    await deleteDoc(recordRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting mileage record:', error);
    throw new Error('Failed to delete mileage record');
  }
};

// Get mileage records for a specific month
export const getMonthlyMileageRecords = async (coachId, year, month) => {
  if (!coachId) {
    throw new Error('Coach ID is required');
  }

  try {
    // Simplified query - only filter by coachId to avoid composite index requirement
    const q = query(
      collection(db, COLLECTION_NAME),
      where('coachId', '==', coachId)
    );

    const querySnapshot = await getDocs(q);
    const allRecords = [];
    
    querySnapshot.forEach((doc) => {
      allRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Filter by month/year in JavaScript instead of Firestore
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const monthlyRecords = allRecords.filter(record => {
      return record.date >= startDate && record.date < endDate;
    });

    return monthlyRecords.sort((a, b) => b.date.localeCompare(a.date));

  } catch (error) {
    console.error('❌ Error getting monthly records:', error);
    throw new Error('Failed to load monthly records');
  }
};

// Get yearly mileage summary
export const getYearlyMileageSummary = async (coachId, year) => {
  if (!coachId) {
    throw new Error('Coach ID is required');
  }

  try {
    const startDate = `${year}-01-01`;
    const endDate = `${year + 1}-01-01`;

    const q = query(
      collection(db, COLLECTION_NAME),
      where('coachId', '==', coachId),
      where('date', '>=', startDate),
      where('date', '<', endDate),
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const records = [];
    
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Calculate monthly summaries
    const monthlySummaries = {};
    let totalMiles = 0;

    records.forEach(record => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlySummaries[monthKey]) {
        monthlySummaries[monthKey] = {
          month: monthKey,
          miles: 0,
          recordCount: 0
        };
      }
      
      monthlySummaries[monthKey].miles += record.mileage;
      monthlySummaries[monthKey].recordCount += 1;
      
      totalMiles += record.mileage;
    });

    return {
      year,
      totalMiles,
      totalRecords: records.length,
      monthlySummaries: Object.values(monthlySummaries),
      records
    };
  } catch (error) {
    console.error('Error getting yearly summary:', error);
    throw new Error('Failed to load yearly summary');
  }
};