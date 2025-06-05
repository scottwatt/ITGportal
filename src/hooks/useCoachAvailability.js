// src/hooks/useCoachAvailability.js - FIXED VERSION
import { useState, useEffect } from 'react';
import { 
  setCoachAvailability as setAvailability,
  setCoachAvailabilityBulk as setBulkAvailability,  // ADD THIS IMPORT
  removeCoachAvailability as removeAvailability,
  getCoachAvailability,
  getAvailabilityForDateRange,
  getCoachAvailabilityRecords,
  subscribeToCoachAvailability,
  getAvailableCoachesForDate,
  unassignClientsFromUnavailableCoach,
  getYearlyTimeOffSummary as getYearlySummary  // ADD THIS IMPORT TOO
} from '../services/firebase/coachAvailability';

export const useCoachAvailability = (isAuthenticated) => {
  const [availabilityRecords, setAvailabilityRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up real-time subscription to coach availability
  useEffect(() => {
    if (!isAuthenticated) {
      setAvailabilityRecords([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToCoachAvailability((availabilityData) => {
      setAvailabilityRecords(availabilityData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const setCoachAvailability = async (coachId, date, status, reason = '') => {
    try {
      setError(null);
      const result = await setAvailability(coachId, date, status, reason);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // ADD THIS MISSING FUNCTION
  const setCoachAvailabilityBulk = async (coachId, dates, status, reason = '') => {
    try {
      setError(null);
      const result = await setBulkAvailability(coachId, dates, status, reason);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const removeCoachAvailability = async (coachId, date) => {
    try {
      setError(null);
      await removeAvailability(coachId, date);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getCoachAvailabilityForDate = async (coachId, date) => {
    try {
      setError(null);
      return await getCoachAvailability(coachId, date);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getAvailabilityRecordsForDateRange = async (startDate, endDate) => {
    try {
      setError(null);
      return await getAvailabilityForDateRange(startDate, endDate);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getCoachAvailabilityHistory = async (coachId) => {
    try {
      setError(null);
      return await getCoachAvailabilityRecords(coachId);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // ADD THIS MISSING FUNCTION
  const getYearlyTimeOffSummary = async (coachId, year) => {
    try {
      setError(null);
      return await getYearlySummary(coachId, year);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getAvailableCoaches = (allCoaches, date) => {
    return getAvailableCoachesForDate(allCoaches, availabilityRecords, date);
  };

  const unassignClientsFromCoach = async (coachId, date, schedules, removeScheduleAssignment) => {
    try {
      setError(null);
      return await unassignClientsFromUnavailableCoach(coachId, date, schedules, removeScheduleAssignment);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Helper functions
  const isCoachAvailable = (coachId, date) => {
    const record = availabilityRecords.find(r => 
      r.coachId === coachId && r.date === date
    );
    return !record || record.status === 'available';
  };

  const getCoachStatusForDate = (coachId, date) => {
    const record = availabilityRecords.find(r => 
      r.coachId === coachId && r.date === date
    );
    return record ? record.status : 'available';
  };

  const getCoachReasonForDate = (coachId, date) => {
    const record = availabilityRecords.find(r => 
      r.coachId === coachId && r.date === date
    );
    return record ? record.reason : '';
  };

  const getUnavailableCoachesForDate = (date) => {
    return availabilityRecords
      .filter(record => record.date === date && record.status !== 'available')
      .map(record => record.coachId);
  };

  return {
    availabilityRecords,
    loading,
    error,
    
    // Actions
    setCoachAvailability,
    setCoachAvailabilityBulk,  // ADD THIS TO RETURN STATEMENT
    removeCoachAvailability,
    getCoachAvailabilityForDate,
    getAvailabilityRecordsForDateRange,
    getCoachAvailabilityHistory,
    getYearlyTimeOffSummary,   // ADD THIS TO RETURN STATEMENT
    unassignClientsFromCoach,
    
    // Helper functions
    getAvailableCoaches,
    isCoachAvailable,
    getCoachStatusForDate,
    getCoachReasonForDate,
    getUnavailableCoachesForDate
  };
};