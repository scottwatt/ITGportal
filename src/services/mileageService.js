// src/services/mileageService.js - UPDATED with client transportation support
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
} from 'firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'mileageRecords';

// Subscribe to real-time mileage records for a coach
export const subscribeToCoachMileage = (coachId, callback) => {
  if (!coachId) {
    console.warn('No coach ID provided for mileage subscription');
    return () => {}; // Return empty unsubscribe function
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('coachId', '==', coachId),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
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
        callback(records);
      },
      (error) => {
        console.error('Error in mileage subscription:', error);
        callback([]); // Return empty array on error
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up mileage subscription:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

// UPDATED: Add a new mileage record with client transportation support
export const addMileageRecord = async (coachId, recordData) => {
  if (!coachId) {
    throw new Error('Coach ID is required');
  }

  if (!recordData.date || !recordData.startLocation || !recordData.endLocation || !recordData.mileage || !recordData.purpose) {
    throw new Error('All required fields must be provided');
  }

  try {
    const newRecord = {
      coachId,
      date: recordData.date,
      startLocation: recordData.startLocation.trim(),
      endLocation: recordData.endLocation.trim(),
      purpose: recordData.purpose.trim(),
      mileage: parseFloat(recordData.mileage),
      // NEW: Add transported clients data
      transportedClients: recordData.transportedClients || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Validate transported clients data
    if (newRecord.transportedClients.length > 0) {
      newRecord.transportedClients = newRecord.transportedClients.map(client => ({
        clientId: client.clientId,
        clientName: client.clientName,
        mileage: parseFloat(client.mileage) // Ensure it's a number
      }));
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), newRecord);
    
    return {
      id: docRef.id,
      ...newRecord
    };
  } catch (error) {
    console.error('Error adding mileage record:', error);
    throw new Error('Failed to add mileage record');
  }
};

// UPDATED: Update an existing mileage record with client transportation support
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

    // Handle transported clients update
    if (updateData.transportedClients) {
      updateData.transportedClients = updateData.transportedClients.map(client => ({
        clientId: client.clientId,
        clientName: client.clientName,
        mileage: parseFloat(client.mileage)
      }));
    }

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

// Delete a mileage record (unchanged)
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

// Get mileage records for a specific month (unchanged)
export const getMonthlyMileageRecords = async (coachId, year, month) => {
  if (!coachId) {
    throw new Error('Coach ID is required');
  }

  try {
    // Create date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const q = query(
      collection(db, COLLECTION_NAME),
      where('coachId', '==', coachId),
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
    console.error('Error getting monthly records:', error);
    throw new Error('Failed to load monthly records');
  }
};

// UPDATED: Get yearly mileage summary with client transportation stats
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

    // Calculate monthly summaries with client transportation stats
    const monthlySummaries = {};
    let totalMiles = 0;
    let totalClientMiles = 0;
    let totalClientTransports = 0;

    records.forEach(record => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlySummaries[monthKey]) {
        monthlySummaries[monthKey] = {
          month: monthKey,
          miles: 0,
          recordCount: 0,
          clientMiles: 0,
          clientTransports: 0
        };
      }
      
      monthlySummaries[monthKey].miles += record.mileage;
      monthlySummaries[monthKey].recordCount += 1;
      
      // Add client transportation stats
      if (record.transportedClients && Array.isArray(record.transportedClients)) {
        const monthClientMiles = record.transportedClients.reduce((sum, client) => sum + client.mileage, 0);
        monthlySummaries[monthKey].clientMiles += monthClientMiles;
        monthlySummaries[monthKey].clientTransports += record.transportedClients.length;
        
        totalClientMiles += monthClientMiles;
        totalClientTransports += record.transportedClients.length;
      }
      
      totalMiles += record.mileage;
    });

    return {
      year,
      totalMiles,
      totalRecords: records.length,
      totalClientMiles: Math.round(totalClientMiles * 1000) / 1000,
      totalClientTransports,
      monthlySummaries: Object.values(monthlySummaries),
      records
    };
  } catch (error) {
    console.error('Error getting yearly summary:', error);
    throw new Error('Failed to load yearly summary');
  }
};

// NEW: Get client transportation records for a specific client
export const getClientTransportationRecords = async (clientId) => {
  if (!clientId) {
    throw new Error('Client ID is required');
  }

  try {
    // We need to get all mileage records and then filter on the client side
    // since Firestore doesn't support array-contains queries on nested objects
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const clientRecords = [];
    
    querySnapshot.forEach((doc) => {
      const record = { id: doc.id, ...doc.data() };
      
      // Check if this record transported the specified client
      if (record.transportedClients && Array.isArray(record.transportedClients)) {
        const clientTransport = record.transportedClients.find(tc => tc.clientId === clientId);
        if (clientTransport) {
          clientRecords.push({
            ...record,
            clientMileage: clientTransport.mileage
          });
        }
      }
    });

    return clientRecords;
  } catch (error) {
    console.error('Error getting client transportation records:', error);
    throw new Error('Failed to load client transportation records');
  }
};

// NEW: Get client transportation statistics for a specific client
export const getClientTransportationStats = async (clientId, startDate = null, endDate = null) => {
  if (!clientId) {
    throw new Error('Client ID is required');
  }

  try {
    const records = await getClientTransportationRecords(clientId);
    
    // Filter by date range if provided
    let filteredRecords = records;
    if (startDate && endDate) {
      filteredRecords = records.filter(record => 
        record.date >= startDate && record.date <= endDate
      );
    }

    const totalMiles = filteredRecords.reduce((sum, record) => sum + record.clientMileage, 0);
    
    return {
      clientId,
      totalMiles: Math.round(totalMiles * 1000) / 1000,
      totalTrips: filteredRecords.length,
      records: filteredRecords,
      dateRange: startDate && endDate ? { startDate, endDate } : null
    };
  } catch (error) {
    console.error('Error getting client transportation stats:', error);
    throw new Error('Failed to load client transportation statistics');
  }
};

// NEW: Get all client transportation statistics
export const getAllClientTransportationStats = async (startDate = null, endDate = null) => {
  try {
    let q;
    
    if (startDate && endDate) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME),
        orderBy('date', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const clientStats = {};
    
    querySnapshot.forEach((doc) => {
      const record = { id: doc.id, ...doc.data() };
      
      if (record.transportedClients && Array.isArray(record.transportedClients)) {
        record.transportedClients.forEach(client => {
          if (!clientStats[client.clientId]) {
            clientStats[client.clientId] = {
              clientId: client.clientId,
              clientName: client.clientName,
              totalMiles: 0,
              totalTrips: 0,
              lastTrip: null
            };
          }
          
          clientStats[client.clientId].totalMiles += client.mileage;
          clientStats[client.clientId].totalTrips += 1;
          
          // Track most recent trip
          if (!clientStats[client.clientId].lastTrip || record.date > clientStats[client.clientId].lastTrip) {
            clientStats[client.clientId].lastTrip = record.date;
          }
        });
      }
    });
    
    // Convert to array and round mileage
    const statsArray = Object.values(clientStats).map(stat => ({
      ...stat,
      totalMiles: Math.round(stat.totalMiles * 1000) / 1000
    })).sort((a, b) => b.totalMiles - a.totalMiles);

    return {
      clientStats: statsArray,
      dateRange: startDate && endDate ? { startDate, endDate } : null,
      totalClients: statsArray.length,
      totalMiles: statsArray.reduce((sum, client) => sum + client.totalMiles, 0),
      totalTrips: statsArray.reduce((sum, client) => sum + client.totalTrips, 0)
    };
  } catch (error) {
    console.error('Error getting all client transportation stats:', error);
    throw new Error('Failed to load client transportation statistics');
  }
};