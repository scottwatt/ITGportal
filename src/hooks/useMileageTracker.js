// src/hooks/useMileageTracker.js - Updated to work with new mileage service
import { useState, useEffect, useCallback } from 'react';
import { 
  subscribeToCoachMileage,
  addMileageRecord, 
  updateMileageRecord, 
  deleteMileageRecord,
  getMonthlyMileageRecords,
  getYearlyMileageSummary
} from '../services/mileageService';

export const useMileageTracker = (coachId, isAuthenticated) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unsubscribe, setUnsubscribe] = useState(null);

  // Subscribe to real-time mileage records
  useEffect(() => {
    if (!isAuthenticated || !coachId) {
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const unsubscribeFn = subscribeToCoachMileage(coachId, (newRecords) => {
        setRecords(newRecords);
        setLoading(false);
      });

      setUnsubscribe(unsubscribeFn);

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 5000);

      return () => {
        clearTimeout(timeoutId);
        if (unsubscribeFn) {
          unsubscribeFn();
        }
      };
    } catch (err) {
      console.error('❌ Error setting up mileage subscription:', err);
      setError('Failed to load mileage records');
      setLoading(false);
    }
  }, [coachId, isAuthenticated]);

  // Add a new mileage record
  const addRecord = useCallback(async (recordData) => {
    if (!coachId) {
      throw new Error('Coach ID is required');
    }

    try {
      console.log('🚀 Adding mileage record for coach:', coachId);
      console.log('📝 Record data:', recordData);
      
      setError(null);
      const newRecord = await addMileageRecord(coachId, recordData);
      console.log('✅ Successfully added record:', newRecord);
      return newRecord;
    } catch (err) {
      console.error('❌ Error adding mileage record:', err);
      console.error('❌ Coach ID:', coachId);
      console.error('❌ Record data:', recordData);
      setError('Failed to add mileage record: ' + err.message);
      throw err;
    }
  }, [coachId]);

  // Update an existing mileage record
  const updateRecord = useCallback(async (recordId, updates) => {
    try {
      setError(null);
      const updatedRecord = await updateMileageRecord(recordId, updates);
      return updatedRecord;
    } catch (err) {
      console.error('Error updating mileage record:', err);
      setError('Failed to update mileage record');
      throw err;
    }
  }, []);

  // Delete a mileage record
  const deleteRecord = useCallback(async (recordId) => {
    try {
      setError(null);
      await deleteMileageRecord(recordId);
    } catch (err) {
      console.error('Error deleting mileage record:', err);
      setError('Failed to delete mileage record');
      throw err;
    }
  }, []);

  // Get monthly mileage records
  const getMonthlyRecords = useCallback(async (year, month) => {
    if (!coachId) {
      throw new Error('Coach ID is required');
    }

    try {
      setError(null);
      console.log('📅 Getting monthly mileage records and updating state:', { coachId, year, month });
      const monthlyRecords = await getMonthlyMileageRecords(coachId, year, month);
      
      // IMPORTANT: Update the local state with the results
      console.log('🔄 Updating records state with:', monthlyRecords.length, 'records');
      setRecords(monthlyRecords);
      
      return monthlyRecords;
    } catch (err) {
      console.error('Error getting monthly records:', err);
      setError('Failed to load monthly records');
      throw err;
    }
  }, [coachId]);

  // Helper functions for working with local state
  const getRecordsForDate = useCallback((date) => {
    return records.filter(record => record.date === date);
  }, [records]);

  const getRecordsForMonth = useCallback((year, month) => {
    return records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getFullYear() === year && recordDate.getMonth() + 1 === month;
    });
  }, [records]);

  const getCurrentMonthTotals = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const monthRecords = getRecordsForMonth(currentYear, currentMonth);
    
    return {
      miles: monthRecords.reduce((total, record) => total + record.mileage, 0),
      recordCount: monthRecords.length
    };
  }, [getRecordsForMonth]);

  const getMonthlyTotals = useCallback((year, month) => {
    const monthRecords = getRecordsForMonth(year, month);
    
    return {
      miles: monthRecords.reduce((total, record) => total + record.mileage, 0),
      recordCount: monthRecords.length
    };
  }, [getRecordsForMonth]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    records,
    loading,
    error,

    // Actions
    addRecord,
    updateRecord,
    deleteRecord,
    getMonthlyRecords,

    // Helper functions
    getRecordsForDate,
    getRecordsForMonth,
    getCurrentMonthTotals,
    getMonthlyTotals,
    clearError
  };
};