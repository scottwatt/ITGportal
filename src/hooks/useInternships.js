// src/hooks/useInternships.js - UPDATED with better error handling and all internships support

import { useState, useEffect } from 'react';
import { 
  addInternship,
  updateInternship,
  removeInternship,
  getInternshipsForClient,
  getInternshipById,
  markInternshipDay,
  addInternshipEvaluation,
  startInternship,
  completeInternship,
  cancelInternship,
  getClientInternshipStats,
  subscribeToClientInternships,
  subscribeToInternships // ADD this import for all internships
} from '../services/firebase/internships';

export const useInternships = (clientId = null, isAuthenticated = false) => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up real-time subscription
  useEffect(() => {
    if (!isAuthenticated) {
      setInternships([]);
      setLoading(false);
      return;
    }

    let unsubscribe;

    if (clientId) {
      // Subscribe to specific client's internships
      unsubscribe = subscribeToClientInternships(clientId, (internshipsData) => {
        setInternships(internshipsData);
        setLoading(false);
        setError(null);
      });
    } else {
      // Subscribe to ALL internships (for admins/coaches)
      unsubscribe = subscribeToInternships((internshipsData) => {
        setInternships(internshipsData);
        setLoading(false);
        setError(null);
      });
    }

    return () => unsubscribe && unsubscribe();
  }, [isAuthenticated, clientId]);

  const addNewInternship = async (internshipData) => {
    try {
      setError(null);
      const result = await addInternship(internshipData);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateInternshipData = async (internshipId, updates) => {
    try {
      setError(null);
      await updateInternship(internshipId, updates);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const removeInternshipData = async (internshipId) => {
    try {
      setError(null);
      await removeInternship(internshipId);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getInternshipsForClientData = async (clientId) => {
    try {
      setError(null);
      return await getInternshipsForClient(clientId);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getInternshipByIdData = async (internshipId) => {
    try {
      setError(null);
      return await getInternshipById(internshipId);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const markInternshipDayData = async (internshipId, date, dayData) => {
    try {
      setError(null);
      await markInternshipDay(internshipId, date, dayData);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const addInternshipEvaluationData = async (internshipId, evaluationData) => {
    try {
      setError(null);
      await addInternshipEvaluation(internshipId, evaluationData);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const startInternshipData = async (internshipId, actualStartDate) => {
    try {
      setError(null);
      await startInternship(internshipId, actualStartDate);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const completeInternshipData = async (internshipId, completionDate, completionData = {}) => {
    try {
      setError(null);
      await completeInternship(internshipId, completionDate, completionData);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const cancelInternshipData = async (internshipId, reason) => {
    try {
      setError(null);
      await cancelInternship(internshipId, reason);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getClientInternshipStatsData = async (clientId) => {
    try {
      setError(null);
      return await getClientInternshipStats(clientId);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Helper functions for local state
  const getInternshipsByStatus = (status) => {
    return internships.filter(internship => internship.status === status);
  };

  const getCurrentInternship = (clientId = null) => {
    let filtered = internships.filter(internship => internship.status === 'in_progress');
    if (clientId) {
      filtered = filtered.filter(internship => internship.clientId === clientId);
    }
    return filtered[0] || null;
  };

  const getCompletedInternships = (clientId = null) => {
    let filtered = internships.filter(internship => internship.status === 'completed');
    if (clientId) {
      filtered = filtered.filter(internship => internship.clientId === clientId);
    }
    return filtered;
  };

  const getTotalCompletedDays = (clientId = null) => {
    let filtered = internships;
    if (clientId) {
      filtered = internships.filter(internship => internship.clientId === clientId);
    }
    return filtered.reduce((total, internship) => total + (internship.completedDays || 0), 0);
  };

  const getInternshipProgress = (internshipId) => {
    const internship = internships.find(i => i.id === internshipId);
    if (!internship) return 0;
    
    const completed = internship.completedDays || 0;
    const total = internship.totalBusinessDays || 30;
    return Math.round((completed / total) * 100);
  };

  // NEW: Get internships by client
  const getInternshipsForSpecificClient = (clientId) => {
    return internships.filter(internship => internship.clientId === clientId);
  };

  // NEW: Get all active internships
  const getAllActiveInternships = () => {
    return internships.filter(internship => internship.status === 'in_progress');
  };

  // NEW: Get internships needing attention
  const getInternshipsNeedingAttention = () => {
    return internships.filter(internship => {
      if (internship.status !== 'in_progress') return false;
      
      const daysCompleted = internship.completedDays || 0;
      const totalDays = internship.totalBusinessDays || 30;
      const progress = daysCompleted / totalDays;
      
      // Flag internships that are overdue or have low progress
      return progress < 0.1 || daysCompleted === 0;
    });
  };

  return {
    internships,
    loading,
    error,
    
    // Actions
    add: addNewInternship,
    update: updateInternshipData,
    remove: removeInternshipData,
    getForClient: getInternshipsForClientData,
    getById: getInternshipByIdData,
    markDay: markInternshipDayData,
    addEvaluation: addInternshipEvaluationData,
    start: startInternshipData,
    complete: completeInternshipData,
    cancel: cancelInternshipData,
    getClientStats: getClientInternshipStatsData,
    
    // Helper functions
    getByStatus: getInternshipsByStatus,
    getCurrent: getCurrentInternship,
    getCompleted: getCompletedInternships,
    getTotalDays: getTotalCompletedDays,
    getProgress: getInternshipProgress,
    getForSpecificClient: getInternshipsForSpecificClient,
    getAllActive: getAllActiveInternships,
    getNeedingAttention: getInternshipsNeedingAttention
  };
};