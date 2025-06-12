// src/hooks/useMakerspace.js
import { useState, useEffect } from 'react';
import { 
  subscribeToMakerspaceRequests,
  addMakerspaceRequest,
  updateMakerspaceRequest,
  deleteMakerspaceRequest,
  subscribeToMakerspaceSchedule,
  addMakerspaceScheduleEntry,
  updateMakerspaceScheduleEntry,
  deleteMakerspaceScheduleEntry,
  subscribeToWalkthroughs,
  addWalkthrough,
  updateWalkthrough,
  deleteWalkthrough,
  completeWalkthrough
} from '../services/firebase/makerspace';

export const useMakerspaceRequests = (isAuthenticated) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up real-time subscription to makerspace requests
  useEffect(() => {
    if (!isAuthenticated) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToMakerspaceRequests((requestsData) => {
      setRequests(requestsData);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const addRequest = async (requestData) => {
    try {
      setError(null);
      const result = await addMakerspaceRequest(requestData);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateRequest = async (requestId, updates) => {
    try {
      setError(null);
      await updateMakerspaceRequest(requestId, updates);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const deleteRequest = async (requestId) => {
    try {
      setError(null);
      await deleteMakerspaceRequest(requestId);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getRequestsForClient = (clientId) => {
    return requests.filter(request => request.clientId === clientId);
  };

  const getPendingRequests = () => {
    return requests.filter(request => request.status === 'pending');
  };

  const getRequestsForDate = (date) => {
    return requests.filter(request => request.date === date);
  };

  return {
    requests,
    loading,
    error,
    addRequest,
    updateRequest,
    deleteRequest,
    getRequestsForClient,
    getPendingRequests,
    getRequestsForDate
  };
};

export const useMakerspaceSchedule = (isAuthenticated) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up real-time subscription to makerspace schedule
  useEffect(() => {
    if (!isAuthenticated) {
      setSchedule([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToMakerspaceSchedule((scheduleData) => {
      setSchedule(scheduleData);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const addScheduleEntry = async (entryData) => {
    try {
      setError(null);
      const result = await addMakerspaceScheduleEntry(entryData);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateScheduleEntry = async (entryId, updates) => {
    try {
      setError(null);
      await updateMakerspaceScheduleEntry(entryId, updates);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const removeScheduleEntry = async (entryId) => {
    try {
      setError(null);
      await deleteMakerspaceScheduleEntry(entryId);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getScheduleForDate = (date) => {
    return schedule.filter(entry => entry.date === date);
  };

  const getScheduleForClient = (clientId) => {
    return schedule.filter(entry => entry.clientId === clientId);
  };

  const getScheduleForTimeSlot = (date, timeSlot) => {
    return schedule.filter(entry => entry.date === date && entry.timeSlot === timeSlot);
  };

  return {
    schedule,
    loading,
    error,
    addScheduleEntry,
    updateScheduleEntry,
    removeScheduleEntry,
    getScheduleForDate,
    getScheduleForClient,
    getScheduleForTimeSlot
  };
};

export const useWalkthroughs = (isAuthenticated) => {
  const [walkthroughs, setWalkthroughs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up real-time subscription to walkthroughs
  useEffect(() => {
    if (!isAuthenticated) {
      setWalkthroughs([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToWalkthroughs((walkthroughData) => {
      setWalkthroughs(walkthroughData);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const addWalkthroughEntry = async (walkthroughData) => {
    try {
      setError(null);
      const result = await addWalkthrough(walkthroughData);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateWalkthroughEntry = async (walkthroughId, updates) => {
    try {
      setError(null);
      await updateWalkthrough(walkthroughId, updates);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const removeWalkthrough = async (walkthroughId) => {
    try {
      setError(null);
      await deleteWalkthrough(walkthroughId);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const completeWalkthroughEntry = async (walkthroughId, completionNotes = '') => {
    try {
      setError(null);
      await completeWalkthrough(walkthroughId, completionNotes);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getWalkthroughsForDate = (date) => {
    return walkthroughs.filter(walkthrough => walkthrough.date === date);
  };

  const getUpcomingWalkthroughs = () => {
    const today = new Date().toISOString().split('T')[0];
    return walkthroughs
      .filter(walkthrough => 
        walkthrough.date >= today && walkthrough.status === 'scheduled'
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  return {
    walkthroughs,
    loading,
    error,
    addWalkthroughEntry,
    updateWalkthroughEntry,
    removeWalkthrough,
    completeWalkthroughEntry,
    getWalkthroughsForDate,
    getUpcomingWalkthroughs
  };
};

// Combined makerspace hook that manages all makerspace functionality
export const useMakerspace = (isAuthenticated) => {
  const requestsHook = useMakerspaceRequests(isAuthenticated);
  const scheduleHook = useMakerspaceSchedule(isAuthenticated);
  const walkthroughsHook = useWalkthroughs(isAuthenticated);

  const loading = requestsHook.loading || scheduleHook.loading || walkthroughsHook.loading;
  const errors = [requestsHook.error, scheduleHook.error, walkthroughsHook.error].filter(Boolean);

  // Combined actions object
  const makerspaceActions = {
    // Request actions
    addRequest: requestsHook.addRequest,
    updateRequest: requestsHook.updateRequest,
    deleteRequest: requestsHook.deleteRequest,
    getRequestsForClient: requestsHook.getRequestsForClient,
    getPendingRequests: requestsHook.getPendingRequests,
    getRequestsForDate: requestsHook.getRequestsForDate,

    // Schedule actions
    addScheduleEntry: scheduleHook.addScheduleEntry,
    updateScheduleEntry: scheduleHook.updateScheduleEntry,
    removeScheduleEntry: scheduleHook.removeScheduleEntry,
    getScheduleForDate: scheduleHook.getScheduleForDate,
    getScheduleForClient: scheduleHook.getScheduleForClient,
    getScheduleForTimeSlot: scheduleHook.getScheduleForTimeSlot,

    // Walkthrough actions
    addWalkthrough: walkthroughsHook.addWalkthroughEntry,
    updateWalkthrough: walkthroughsHook.updateWalkthroughEntry,
    removeWalkthrough: walkthroughsHook.removeWalkthrough,
    completeWalkthrough: walkthroughsHook.completeWalkthroughEntry,
    getWalkthroughsForDate: walkthroughsHook.getWalkthroughsForDate,
    getUpcomingWalkthroughs: walkthroughsHook.getUpcomingWalkthroughs,

    // Combined helper functions
    getAllScheduleForDate: (date) => {
      const schedule = scheduleHook.getScheduleForDate(date);
      const walkthroughs = walkthroughsHook.getWalkthroughsForDate(date);
      return [...schedule, ...walkthroughs.map(wt => ({ ...wt, type: 'walkthrough' }))];
    },

    getStatistics: () => {
      const totalRequests = requestsHook.requests.length;
      const pendingRequests = requestsHook.getPendingRequests().length;
      const approvedRequests = requestsHook.requests.filter(r => r.status === 'approved').length;
      const upcomingWalkthroughs = walkthroughsHook.getUpcomingWalkthroughs().length;
      
      return {
        totalRequests,
        pendingRequests,
        approvedRequests,
        upcomingWalkthroughs,
        totalScheduleEntries: scheduleHook.schedule.length,
        totalWalkthroughs: walkthroughsHook.walkthroughs.length
      };
    }
  };

  return {
    // Data
    requests: requestsHook.requests,
    schedule: scheduleHook.schedule,
    walkthroughs: walkthroughsHook.walkthroughs,
    
    // State
    loading,
    errors,
    error: errors.length > 0 ? errors.join(', ') : null,
    
    // Actions
    makerspaceActions
  };
};