// src/hooks/useInternships.js - FIXED with better error handling and fallback logic

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
  subscribeToInternships
} from '../services/firebase/internships';

export const useInternships = (clientId = null, isAuthenticated = false) => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up real-time subscription with better error handling
  useEffect(() => {
    if (!isAuthenticated) {
      setInternships([]);
      setLoading(false);
      setError(null);
      return;
    }

    console.log('🔄 Setting up internships subscription...', { clientId });
    
    let unsubscribe;
    let timeoutId;

    // Set a timeout to catch hanging subscriptions
    timeoutId = setTimeout(() => {
      console.warn('⚠️ Internships subscription timeout - falling back to empty state');
      setLoading(false);
      setError('Subscription timeout - please refresh the page');
    }, 10000); // 10 second timeout

    try {
      if (clientId) {
        // Subscribe to specific client's internships
        console.log('📋 Subscribing to client internships:', clientId);
        unsubscribe = subscribeToClientInternships(clientId, (internshipsData) => {
          console.log('✅ Client internships loaded:', internshipsData.length);
          clearTimeout(timeoutId);
          setInternships(internshipsData);
          setLoading(false);
          setError(null);
        });
      } else {
        // Subscribe to ALL internships (for admins/coaches)
        console.log('📋 Subscribing to all internships');
        unsubscribe = subscribeToInternships((internshipsData) => {
          console.log('✅ All internships loaded:', internshipsData.length);
          clearTimeout(timeoutId);
          setInternships(internshipsData);
          setLoading(false);
          setError(null);
        });
      }
    } catch (error) {
      console.error('❌ Error setting up internships subscription:', error);
      clearTimeout(timeoutId);
      setLoading(false);
      setError(error.message);
      setInternships([]);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (unsubscribe) {
        console.log('🔌 Unsubscribing from internships');
        unsubscribe();
      }
    };
  }, [isAuthenticated, clientId]);

  const addNewInternship = async (internshipData) => {
    try {
      setError(null);
      console.log('➕ Adding new internship:', internshipData);
      const result = await addInternship(internshipData);
      console.log('✅ Internship added successfully:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Error adding internship:', error);
      setError(error.message);
      throw error;
    }
  };

  const updateInternshipData = async (internshipId, updates) => {
    try {
      setError(null);
      console.log('📝 Updating internship:', internshipId, updates);
      await updateInternship(internshipId, updates);
      console.log('✅ Internship updated successfully');
    } catch (error) {
      console.error('❌ Error updating internship:', error);
      setError(error.message);
      throw error;
    }
  };

  const removeInternshipData = async (internshipId) => {
    try {
      setError(null);
      console.log('🗑️ Removing internship:', internshipId);
      await removeInternship(internshipId);
      console.log('✅ Internship removed successfully');
    } catch (error) {
      console.error('❌ Error removing internship:', error);
      setError(error.message);
      throw error;
    }
  };

  const getInternshipsForClientData = async (clientId) => {
    try {
      setError(null);
      console.log('📋 Getting internships for client:', clientId);
      const result = await getInternshipsForClient(clientId);
      console.log('✅ Client internships retrieved:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Error getting client internships:', error);
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

  const getInternshipsForSpecificClient = (clientId) => {
    return internships.filter(internship => internship.clientId === clientId);
  };

  const getAllActiveInternships = () => {
    return internships.filter(internship => internship.status === 'in_progress');
  };

  const getInternshipsNeedingAttention = () => {
    return internships.filter(internship => {
      if (internship.status !== 'in_progress') return false;
      
      const daysCompleted = internship.completedDays || 0;
      const totalDays = internship.totalBusinessDays || 30;
      const progress = daysCompleted / totalDays;
      
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