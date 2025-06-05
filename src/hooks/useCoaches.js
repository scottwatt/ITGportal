// src/hooks/useCoaches.js
import { useState, useEffect } from 'react';
import { 
  addNewCoach as addCoach,
  removeCoach as deleteCoach,
  updateCoach as editCoach,
  createCoachLoginAccount as createLogin,
  resetCoachPassword as resetPassword,
  subscribeToCoaches
} from '../services/firebase/coaches';

export const useCoaches = (isAuthenticated) => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up real-time subscription to coaches
  useEffect(() => {
    if (!isAuthenticated) {
      setCoaches([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToCoaches((coachesData) => {
      setCoaches(coachesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const addNewCoach = async (coachData) => {
    try {
      setError(null);
      const result = await addCoach(coachData);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateCoach = async (coachId, updates) => {
    try {
      setError(null);
      await editCoach(coachId, updates);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const resetCoachPassword = async (coach) => {
  try {
    setError(null);
    const result = await resetPassword(coach);
    return result;
  } catch (error) {
    setError(error.message);
    throw error;
  }
};

  const removeCoach = async (coachId, schedules) => {
    try {
      setError(null);
      await deleteCoach(coachId, schedules);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getCoachById = (id) => {
    return coaches.find(coach => coach.id === id || coach.uid === id);
  };

  const getCoachesByType = (coachType) => {
    return coaches.filter(coach => (coach.coachType || 'success') === coachType);
  };

  const getActiveCoaches = () => {
    return coaches.filter(coach => coach.role === 'coach');
  };

  const getAdminUsers = () => {
    return coaches.filter(coach => coach.role === 'admin');
  };

  const getSchedulers = () => {
    return coaches.filter(coach => coach.role === 'scheduler');
  };

  const createCoachLoginAccount = async (coach) => {
  try {
    setError(null);
    const result = await createLogin(coach);
    return result;
  } catch (error) {
    setError(error.message);
    throw error;
  }
};

  return {
    coaches,
    loading,
    error,
    addNewCoach,
    updateCoach,
    removeCoach,
    resetCoachPassword,
    createCoachLoginAccount,
    getCoachById,
    getCoachesByType,
    getActiveCoaches,
    getAdminUsers,
    getSchedulers
  };
};