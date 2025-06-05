// src/hooks/useGoogleCalendar.js

import { useState, useEffect } from 'react';
import { 
  initializeCalendarAPI,
  getGraceEventsForDate,
  getGraceEventsForDateRange,
  isCalendarAPIReady
} from '../services/googleCalendar/calendarService';

export const useGoogleCalendar = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAPI();
  }, []);

  const initializeAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (isCalendarAPIReady()) {
        setIsInitialized(true);
        setLoading(false);
        return;
      }
      
      const success = await initializeCalendarAPI();
      
      if (success) {
        setIsInitialized(true);
        console.log('✅ Google Calendar API initialized successfully');
      } else {
        throw new Error('Failed to initialize Google Calendar API');
      }
    } catch (err) {
      console.error('❌ Google Calendar API initialization failed:', err);
      setError(err.message);
      setIsInitialized(false);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = async (date) => {
    if (!isInitialized) {
      throw new Error('Calendar API not initialized');
    }
    
    try {
      return await getGraceEventsForDate(date);
    } catch (err) {
      console.error('Error fetching events for date:', err);
      throw err;
    }
  };

  const getEventsForDateRange = async (startDate, endDate) => {
    if (!isInitialized) {
      throw new Error('Calendar API not initialized');
    }
    
    try {
      return await getGraceEventsForDateRange(startDate, endDate);
    } catch (err) {
      console.error('Error fetching events for date range:', err);
      throw err;
    }
  };

  const retry = () => {
    initializeAPI();
  };

  return {
    isInitialized,
    loading,
    error,
    getEventsForDate,
    getEventsForDateRange,
    retry
  };
};

// Higher-order component to provide calendar context
export const withGoogleCalendar = (WrappedComponent) => {
  return function WithGoogleCalendarComponent(props) {
    const calendar = useGoogleCalendar();
    
    return <WrappedComponent {...props} calendar={calendar} />;
  };
};