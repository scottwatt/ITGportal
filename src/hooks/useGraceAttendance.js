// src/hooks/useGraceAttendance.js
import { useState, useEffect } from 'react';
import { 
  markAttendance,
  markBulkAttendance,
  getAttendanceForDate,
  getClientAttendanceRange,
  getClientAttendanceSummary,
  getAllGraceAttendanceSummary,
  getMonthlyAttendanceStats,
  subscribeToGraceAttendance,
  getAttendanceStatusForClients
} from '../services/firebase/graceAttendance';

export const useGraceAttendance = (isAuthenticated) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up real-time subscription to Grace attendance
  useEffect(() => {
    if (!isAuthenticated) {
      setAttendanceRecords([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToGraceAttendance((attendanceData) => {
      setAttendanceRecords(attendanceData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const markClientAttendance = async (clientId, date, present, notes = '') => {
    try {
      setError(null);
      const result = await markAttendance(clientId, date, present, notes);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const markMultipleAttendance = async (attendanceRecords, date) => {
    try {
      setError(null);
      const result = await markBulkAttendance(attendanceRecords, date);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getAttendanceForSpecificDate = async (date) => {
    try {
      setError(null);
      return await getAttendanceForDate(date);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getClientAttendanceHistory = async (clientId, startDate, endDate) => {
    try {
      setError(null);
      return await getClientAttendanceRange(clientId, startDate, endDate);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getClientSummary = async (clientId, startDate, endDate) => {
    try {
      setError(null);
      return await getClientAttendanceSummary(clientId, startDate, endDate);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getAllClientsSummary = async (startDate, endDate) => {
    try {
      setError(null);
      return await getAllGraceAttendanceSummary(startDate, endDate);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getMonthlyStats = async (year, month) => {
    try {
      setError(null);
      return await getMonthlyAttendanceStats(year, month);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getClientsAttendanceStatus = async (clientIds, date) => {
    try {
      setError(null);
      return await getAttendanceStatusForClients(clientIds, date);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Helper functions
  const getAttendanceForClientOnDate = (clientId, date) => {
    return attendanceRecords.find(record => 
      record.clientId === clientId && record.date === date
    );
  };

  const getAttendanceRateForClient = (clientId, startDate, endDate) => {
    const clientRecords = attendanceRecords.filter(record => 
      record.clientId === clientId && 
      record.date >= startDate && 
      record.date <= endDate
    );

    if (clientRecords.length === 0) return 0;

    const presentDays = clientRecords.filter(record => record.present).length;
    return Math.round((presentDays / clientRecords.length) * 100);
  };

  const getTotalAttendanceForDate = (date) => {
    const dayRecords = attendanceRecords.filter(record => record.date === date);
    return {
      total: dayRecords.length,
      present: dayRecords.filter(record => record.present).length,
      absent: dayRecords.filter(record => !record.present).length
    };
  };

  const getRecentAttendanceForClient = (clientId, days = 7) => {
    const today = new Date();
    const startDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));
    
    return attendanceRecords
      .filter(record => {
        const recordDate = new Date(record.date + 'T12:00:00');
        return record.clientId === clientId && 
               recordDate >= startDate && 
               recordDate <= today;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  };

  const getConsecutiveAbsences = (clientId) => {
    const recentRecords = getRecentAttendanceForClient(clientId, 30);
    let consecutiveAbsences = 0;
    
    for (const record of recentRecords) {
      if (!record.present) {
        consecutiveAbsences++;
      } else {
        break;
      }
    }
    
    return consecutiveAbsences;
  };

  return {
    attendanceRecords,
    loading,
    error,
    
    // Actions
    markClientAttendance,
    markMultipleAttendance,
    getAttendanceForSpecificDate,
    getClientAttendanceHistory,
    getClientSummary,
    getAllClientsSummary,
    getMonthlyStats,
    getClientsAttendanceStatus,
    
    // Helper functions
    getAttendanceForClientOnDate,
    getAttendanceRateForClient,
    getTotalAttendanceForDate,
    getRecentAttendanceForClient,
    getConsecutiveAbsences
  };
};