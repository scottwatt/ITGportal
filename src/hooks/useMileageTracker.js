// src/hooks/useMileageTracker.js - Updated to work with new mileage service - FIXED RE-RENDERS
import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Use refs to prevent stale closures and unnecessary re-subscriptions
  const unsubscribeRef = useRef(null);
  const coachIdRef = useRef(coachId);
  const isAuthenticatedRef = useRef(isAuthenticated);

  // Update refs when props change
  useEffect(() => {
    coachIdRef.current = coachId;
    isAuthenticatedRef.current = isAuthenticated;
  }, [coachId, isAuthenticated]);

  // Subscribe to real-time mileage records - OPTIMIZED
  useEffect(() => {
    // Clean up previous subscription first
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!isAuthenticated || !coachId) {
      setRecords([]);
      setLoading(false);
      setError(null);
      return;
    }

    console.log('🔥 Setting up mileage subscription for coach:', coachId);
    setLoading(true);
    setError(null);

    try {
      const unsubscribeFn = subscribeToCoachMileage(coachId, (newRecords) => {
        console.log('📨 Received mileage records update:', newRecords.length, 'records');
        
        // Only update state if component is still mounted and coach hasn't changed
        if (coachIdRef.current === coachId && isAuthenticatedRef.current) {
          setRecords(newRecords);
          setLoading(false);
        }
      });

      unsubscribeRef.current = unsubscribeFn;

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (coachIdRef.current === coachId && isAuthenticatedRef.current) {
          setLoading(false);
        }
      }, 5000);

      return () => {
        clearTimeout(timeoutId);
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    } catch (err) {
      console.error('❌ Error setting up mileage subscription:', err);
      setError('Failed to load mileage records');
      setLoading(false);
    }
  }, [coachId, isAuthenticated]); // Only depend on essential props

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  // Add a new mileage record - MEMOIZED
  const addRecord = useCallback(async (recordData) => {
    if (!coachIdRef.current) {
      throw new Error('Coach ID is required');
    }

    try {
      console.log('🚀 Adding mileage record for coach:', coachIdRef.current);
      
      setError(null);
      const newRecord = await addMileageRecord(coachIdRef.current, recordData);
      console.log('✅ Successfully added record:', newRecord);
      return newRecord;
    } catch (err) {
      console.error('❌ Error adding mileage record:', err);
      setError('Failed to add mileage record: ' + err.message);
      throw err;
    }
  }, []); // No dependencies - uses refs

  // Update an existing mileage record - MEMOIZED
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

  // Delete a mileage record - MEMOIZED
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

  // Get monthly mileage records - MEMOIZED
  const getMonthlyRecords = useCallback(async (year, month) => {
    if (!coachIdRef.current) {
      throw new Error('Coach ID is required');
    }

    try {
      setError(null);
      console.log('📅 Getting monthly mileage records:', { coachId: coachIdRef.current, year, month });
      const monthlyRecords = await getMonthlyMileageRecords(coachIdRef.current, year, month);
      
      // IMPORTANT: Update the local state with the results
      console.log('🔄 Updating records state with:', monthlyRecords.length, 'records');
      setRecords(monthlyRecords);
      
      return monthlyRecords;
    } catch (err) {
      console.error('Error getting monthly records:', err);
      setError('Failed to load monthly records');
      throw err;
    }
  }, []); // No dependencies - uses refs

  // Helper functions for working with local state - MEMOIZED
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

  // Clear error state - MEMOIZED
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