// src/hooks/useInternships.js - Hook for managing internship data

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
  subscribeToClientInternships
} from '../services/firebase/internships';

export const useInternships = (clientId = null, isAuthenticated = false) => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up real-time subscription for client internships
  useEffect(() => {
    if (!isAuthenticated || !clientId) {
      setInternships([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToClientInternships(clientId, (internshipsData) => {
      setInternships(internshipsData);
      setLoading(false);
    });

    return () => unsubscribe();
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

  const getCurrentInternship = () => {
    return internships.find(internship => internship.status === 'in_progress');
  };

  const getCompletedInternships = () => {
    return internships.filter(internship => internship.status === 'completed');
  };

  const getTotalCompletedDays = () => {
    return internships.reduce((total, internship) => total + (internship.completedDays || 0), 0);
  };

  const getInternshipProgress = (internshipId) => {
    const internship = internships.find(i => i.id === internshipId);
    if (!internship) return 0;
    
    const completed = internship.completedDays || 0;
    const total = internship.totalBusinessDays || 30;
    return Math.round((completed / total) * 100);
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
    getProgress: getInternshipProgress
  };
};