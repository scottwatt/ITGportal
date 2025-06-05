// src/hooks/useSchedules.js
import { useState, useEffect } from 'react';
import { 
  addScheduleAssignment as addAssignment,
  removeScheduleAssignment as removeAssignment,
  subscribeToSchedules
} from '../services/firebase/schedules';

export const useSchedules = (isAuthenticated) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up real-time subscription to schedules
  useEffect(() => {
    if (!isAuthenticated) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToSchedules((schedulesData) => {
      setSchedules(schedulesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const addScheduleAssignment = async (date, timeSlot, coachId, clientId) => {
    try {
      setError(null);
      const result = await addAssignment(date, timeSlot, coachId, clientId);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const removeScheduleAssignment = async (scheduleId) => {
    try {
      setError(null);
      await removeAssignment(scheduleId);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Helper functions for getting schedules
  const getSchedulesForDate = (date) => {
    return schedules.filter(schedule => schedule.date === date);
  };

  const getSchedulesForCoach = (coachId, date = null) => {
    let filtered = schedules.filter(schedule => 
      schedule.coachId === coachId
    );
    
    if (date) {
      filtered = filtered.filter(schedule => schedule.date === date);
    }
    
    return filtered;
  };

  const getSchedulesForClient = (clientId, date = null) => {
    let filtered = schedules.filter(schedule => 
      schedule.clientId === clientId
    );
    
    if (date) {
      filtered = filtered.filter(schedule => schedule.date === date);
    }
    
    return filtered;
  };

  const getSchedulesForTimeSlot = (date, timeSlot) => {
    return schedules.filter(schedule => 
      schedule.date === date && schedule.timeSlot === timeSlot
    );
  };

  const getTodaysScheduleForCoach = (coachId, today) => {
    return getSchedulesForCoach(coachId, today);
  };

  const getTodaysScheduleForClient = (clientId, today) => {
    return getSchedulesForClient(clientId, today);
  };

  const getWeeklyScheduleForClient = (clientId, weekDates) => {
    return weekDates.map(date => {
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      return {
        date: dateStr,
        sessions: getSchedulesForClient(clientId, dateStr)
      };
    });
  };

  const getCoachWorkload = (coachId, dateRange = null) => {
    let coachSchedules = getSchedulesForCoach(coachId);
    
    if (dateRange) {
      const { startDate, endDate } = dateRange;
      coachSchedules = coachSchedules.filter(schedule => 
        schedule.date >= startDate && schedule.date <= endDate
      );
    }
    
    return {
      totalSessions: coachSchedules.length,
      uniqueClients: [...new Set(coachSchedules.map(s => s.clientId))].length,
      schedulesByDate: coachSchedules.reduce((acc, schedule) => {
        acc[schedule.date] = (acc[schedule.date] || 0) + 1;
        return acc;
      }, {})
    };
  };

  const getClientAttendance = (clientId, dateRange = null) => {
    let clientSchedules = getSchedulesForClient(clientId);
    
    if (dateRange) {
      const { startDate, endDate } = dateRange;
      clientSchedules = clientSchedules.filter(schedule => 
        schedule.date >= startDate && schedule.date <= endDate
      );
    }
    
    return {
      totalSessions: clientSchedules.length,
      uniqueCoaches: [...new Set(clientSchedules.map(s => s.coachId))].length,
      schedulesByDate: clientSchedules.reduce((acc, schedule) => {
        acc[schedule.date] = (acc[schedule.date] || 0) + 1;
        return acc;
      }, {})
    };
  };

  return {
    schedules,
    loading,
    error,
    addScheduleAssignment,
    removeScheduleAssignment,
    getSchedulesForDate,
    getSchedulesForCoach,
    getSchedulesForClient,
    getSchedulesForTimeSlot,
    getTodaysScheduleForCoach,
    getTodaysScheduleForClient,
    getWeeklyScheduleForClient,
    getCoachWorkload,
    getClientAttendance
  };
};