// src/hooks/useAppState.js - UPDATED with complete internship integration
import { useState, useMemo } from 'react';
import { useClients } from './useClients';
import { useCoaches } from './useCoaches';
import { useSchedules } from './useSchedules';
import { useCoachAvailability } from './useCoachAvailability';
import { useGraceAttendance } from './useGraceAttendance';
import { useTasks } from './useTasks';
import { useMileageTracker } from './useMileageTracker';
import { useInternships } from './useInternships'; // ADD internships hook
import { useAuth } from './useAuth';

export const useAppState = (isAuthenticated) => {
  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Get current user for mileage tracking
  const { user } = useAuth();

  // Data hooks - these handle their own loading and error states
  const clientsHook = useClients(isAuthenticated);
  const coachesHook = useCoaches(isAuthenticated);
  const schedulesHook = useSchedules(isAuthenticated);
  const coachAvailabilityHook = useCoachAvailability(isAuthenticated);
  const graceAttendanceHook = useGraceAttendance(isAuthenticated); 
  const tasksHook = useTasks(isAuthenticated);
  
  // ADD: Internships hook for all internships (admins/coaches need to see all)
  const internshipsHook = useInternships(null, isAuthenticated); // null = get all internships
  
  // FIXED: Memoize coach lookup to prevent re-renders
  const currentCoachId = useMemo(() => {
    if (!isAuthenticated || !user?.uid || !Array.isArray(coachesHook.coaches)) {
      return null;
    }
    
    const coach = coachesHook.coaches.find(c => c.uid === user.uid);
    return coach ? coach.uid : null;
  }, [isAuthenticated, user?.uid, coachesHook.coaches]);

  // Mileage tracking hook - use memoized coach ID
  const mileageHook = useMileageTracker(currentCoachId, isAuthenticated);

  // Navigation handlers
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setActiveTab('clients');
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Enhanced client actions with error handling
  const clientActions = {
    add: async (clientData) => {
      try {
        const result = await clientsHook.addNewClient(clientData);
        return result;
      } catch (error) {
        console.error('Error adding client:', error);
        throw error;
      }
    },
    
    update: async (clientId, updates) => {
      try {
        await clientsHook.updateClientProgress(clientId, updates);
      } catch (error) {
        console.error('Error updating client:', error);
        throw error;
      }
    },
    
    updateProgress: async (clientId, progressData) => {
      try {
        await clientsHook.updateClientProgress(clientId, progressData);
      } catch (error) {
        console.error('Error updating client progress:', error);
        throw error;
      }
    },

    resetPassword: async (client) => {
      try {
        const result = await clientsHook.resetClientPassword(client);
        alert(`Password reset initiated for ${client.name}!\n\n${result.message}`);
        return result;
      } catch (error) {
        console.error('Error resetting client password:', error);
        throw error;
      }
    },
    
    remove: async (clientId, schedules) => {
      try {
        await clientsHook.removeClient(clientId, schedules);
      } catch (error) {
        console.error('Error removing client:', error);
        throw error;
      }
    },
    
    createLogin: async (client) => {
      try {
        const result = await clientsHook.createClientLoginAccount(client);
        return result;
      } catch (error) {
        console.error('Error creating client login:', error);
        throw error;
      }
    },
    
    addFile: async (clientId, fileData) => {
      try {
        const newFile = {
          id: Date.now().toString(),
          ...fileData,
          uploadDate: new Date().toISOString().split('T')[0],
          uploadedBy: 'Current User',
          uploadedAt: new Date()
        };
        
        const client = clientsHook.getClientById(clientId);
        if (!client) {
          throw new Error('Client not found');
        }
        
        const updatedFiles = [...(client.files || []), newFile];
        await clientsHook.updateClientProgress(clientId, {
          files: updatedFiles
        });
        
        return newFile;
      } catch (error) {
        console.error('Error adding file:', error);
        throw error;
      }
    },
    
    removeFile: async (clientId, fileId) => {
      try {
        const client = clientsHook.getClientById(clientId);
        if (!client) {
          throw new Error('Client not found');
        }
        
        const updatedFiles = (client.files || []).filter(f => f.id !== fileId);
        await clientsHook.updateClientProgress(clientId, {
          files: updatedFiles
        });
      } catch (error) {
        console.error('Error removing file:', error);
        throw error;
      }
    },
    
    // Helper methods
    getById: clientsHook.getClientById,
    getByProgram: clientsHook.getClientsByProgram,
    getSchedulable: clientsHook.getSchedulableClients
  };

  // coach actions
  const coachActions = {
    add: async (coachData) => {
      try {
        const result = await coachesHook.addNewCoach(coachData);
        return result;
      } catch (error) {
        console.error('Error adding coach:', error);
        throw error;
      }
    },
    
    update: async (coachId, updates) => {
      try {
        await coachesHook.updateCoach(coachId, updates);
      } catch (error) {
        console.error('Error updating coach:', error);
        throw error;
      }
    },
    
    remove: async (coachId, schedules) => {
      try {
        await coachesHook.removeCoach(coachId, schedules);
      } catch (error) {
        console.error('Error removing coach:', error);
        throw error;
      }
    },
    
    createLogin: async (coach) => {
      try {
        const result = await coachesHook.createCoachLoginAccount(coach);
        alert(`Login account created for ${coach.name}!\n\n${result.message}`);
        return result;
      } catch (error) {
        console.error('Error creating coach login:', error);
        throw error;
      }
    },
    
    resetPassword: async (coach) => {
      try {
        const result = await coachesHook.resetCoachPassword(coach);
        alert(`Password reset initiated for ${coach.name}!\n\n${result.message}`);
        return result;
      } catch (error) {
        console.error('Error resetting coach password:', error);
        throw error;
      }
    },
    
    // Helper methods (existing ones)
    getById: coachesHook.getCoachById,
    getByType: coachesHook.getCoachesByType,
    getActive: coachesHook.getActiveCoaches,
    getAdmins: coachesHook.getAdminUsers,
    getSchedulers: coachesHook.getSchedulers
  };

  // Enhanced schedule actions
  const scheduleActions = {
    add: async (date, timeSlot, coachId, clientId) => {
      try {
        const result = await schedulesHook.addScheduleAssignment(date, timeSlot, coachId, clientId);
        return result;
      } catch (error) {
        console.error('Error adding schedule:', error);
        throw error;
      }
    },
    
    remove: async (scheduleId) => {
      try {
        await schedulesHook.removeScheduleAssignment(scheduleId);
      } catch (error) {
        console.error('Error removing schedule:', error);
        throw error;
      }
    },
    
    // Helper methods for getting schedules
    getForDate: schedulesHook.getSchedulesForDate,
    getForCoach: schedulesHook.getSchedulesForCoach,
    getForClient: schedulesHook.getSchedulesForClient,
    getForTimeSlot: schedulesHook.getSchedulesForTimeSlot,
    getTodaysScheduleForCoach: schedulesHook.getTodaysScheduleForCoach,
    getTodaysScheduleForClient: schedulesHook.getTodaysScheduleForClient,
    getWeeklyScheduleForClient: schedulesHook.getWeeklyScheduleForClient,
    getCoachWorkload: schedulesHook.getCoachWorkload,
    getClientAttendance: schedulesHook.getClientAttendance
  };

  // Coach availability actions
  const availabilityActions = {
    setCoachAvailability: async (coachId, date, status, reason = '') => {
      try {
        const result = await coachAvailabilityHook.setCoachAvailability(coachId, date, status, reason);
        return result;
      } catch (error) {
        console.error('Error setting coach availability:', error);
        throw error;
      }
    },
    
    setCoachAvailabilityBulk: async (coachId, dates, status, reason = '') => {
      try {
        const result = await coachAvailabilityHook.setCoachAvailabilityBulk(coachId, dates, status, reason);
        return result;
      } catch (error) {
        console.error('Error setting bulk coach availability:', error);
        throw error;
      }
    },
    
    removeCoachAvailability: async (coachId, date) => {
      try {
        await coachAvailabilityHook.removeCoachAvailability(coachId, date);
      } catch (error) {
        console.error('Error removing coach availability:', error);
        throw error;
      }
    },
    
    getYearlyTimeOffSummary: async (coachId, year) => {
      try {
        return await coachAvailabilityHook.getYearlyTimeOffSummary(coachId, year);
      } catch (error) {
        console.error('Error getting yearly summary:', error);
        throw error;
      }
    },
    
    unassignClientsFromCoach: async (coachId, date, schedules, removeScheduleAssignment) => {
      try {
        return await coachAvailabilityHook.unassignClientsFromCoach(coachId, date, schedules, removeScheduleAssignment);
      } catch (error) {
        console.error('Error unassigning clients:', error);
        throw error;
      }
    },
    
    // Helper methods
    getAvailableCoaches: coachAvailabilityHook.getAvailableCoaches,
    isCoachAvailable: coachAvailabilityHook.isCoachAvailable,
    getCoachStatusForDate: coachAvailabilityHook.getCoachStatusForDate,
    getCoachReasonForDate: coachAvailabilityHook.getCoachReasonForDate,
    getUnavailableCoachesForDate: coachAvailabilityHook.getUnavailableCoachesForDate
  };

  // Grace attendance actions
  const graceAttendanceActions = {
    markClientAttendance: async (clientId, date, present, notes = '') => {
      try {
        const result = await graceAttendanceHook.markClientAttendance(clientId, date, present, notes);
        return result;
      } catch (error) {
        console.error('Error marking attendance:', error);
        throw error;
      }
    },
    
    markMultipleAttendance: async (attendanceRecords, date) => {
      try {
        const result = await graceAttendanceHook.markMultipleAttendance(attendanceRecords, date);
        return result;
      } catch (error) {
        console.error('Error marking multiple attendance:', error);
        throw error;
      }
    },
    
    getAttendanceForSpecificDate: async (date) => {
      try {
        return await graceAttendanceHook.getAttendanceForSpecificDate(date);
      } catch (error) {
        console.error('Error getting attendance for date:', error);
        throw error;
      }
    },
    
    getClientAttendanceHistory: async (clientId, startDate, endDate) => {
      try {
        return await graceAttendanceHook.getClientAttendanceHistory(clientId, startDate, endDate);
      } catch (error) {
        console.error('Error getting client attendance history:', error);
        throw error;
      }
    },
    
    getClientSummary: async (clientId, startDate, endDate) => {
      try {
        return await graceAttendanceHook.getClientSummary(clientId, startDate, endDate);
      } catch (error) {
        console.error('Error getting client summary:', error);
        throw error;
      }
    },
    
    getAllClientsSummary: async (startDate, endDate) => {
      try {
        return await graceAttendanceHook.getAllClientsSummary(startDate, endDate);
      } catch (error) {
        console.error('Error getting all clients summary:', error);
        throw error;
      }
    },
    
    getMonthlyStats: async (year, month) => {
      try {
        return await graceAttendanceHook.getMonthlyStats(year, month);
      } catch (error) {
        console.error('Error getting monthly stats:', error);
        throw error;
      }
    },
    
    getClientsAttendanceStatus: async (clientIds, date) => {
      try {
        return await graceAttendanceHook.getClientsAttendanceStatus(clientIds, date);
      } catch (error) {
        console.error('Error getting clients attendance status:', error);
        throw error;
      }
    },
    
    // Helper methods
    getAttendanceForClientOnDate: graceAttendanceHook.getAttendanceForClientOnDate,
    getAttendanceRateForClient: graceAttendanceHook.getAttendanceRateForClient,
    getTotalAttendanceForDate: graceAttendanceHook.getTotalAttendanceForDate,
    getRecentAttendanceForClient: graceAttendanceHook.getRecentAttendanceForClient,
    getConsecutiveAbsences: graceAttendanceHook.getConsecutiveAbsences
  };

  // Task actions
  const taskActions = {
    createTask: async (taskData) => {
      try {
        const result = await tasksHook.createTask(taskData);
        return result;
      } catch (error) {
        console.error('Error creating task:', error);
        throw error;
      }
    },
    
    updateTask: async (taskId, updates) => {
      try {
        await tasksHook.updateTask(taskId, updates);
      } catch (error) {
        console.error('Error updating task:', error);
        throw error;
      }
    },
    
    deleteTask: async (taskId) => {
      try {
        await tasksHook.deleteTask(taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
      }
    },
    
    getTasksForSpecificDate: async (date) => {
      try {
        return await tasksHook.getTasksForSpecificDate(date);
      } catch (error) {
        console.error('Error getting tasks for date:', error);
        throw error;
      }
    },
    
    getTasksForClientDate: async (clientId, date) => {
      try {
        return await tasksHook.getTasksForClientDate(clientId, date);
      } catch (error) {
        console.error('Error getting tasks for client and date:', error);
        throw error;
      }
    },
    
    getTasksForClientRange: async (clientId, startDate, endDate) => {
      try {
        return await tasksHook.getTasksForClientRange(clientId, startDate, endDate);
      } catch (error) {
        console.error('Error getting tasks for client range:', error);
        throw error;
      }
    },
    
    copyTasks: async (sourceDate, targetDate, clientIds = null) => {
      try {
        return await tasksHook.copyTasks(sourceDate, targetDate, clientIds);
      } catch (error) {
        console.error('Error copying tasks:', error);
        throw error;
      }
    },
    
    toggleCompletion: async (taskId, completed) => {
      try {
        await tasksHook.toggleCompletion(taskId, completed);
      } catch (error) {
        console.error('Error toggling task completion:', error);
        throw error;
      }
    },
    
    getClientTaskStatistics: async (clientId, startDate, endDate) => {
      try {
        return await tasksHook.getClientTaskStatistics(clientId, startDate, endDate);
      } catch (error) {
        console.error('Error getting task statistics:', error);
        throw error;
      }
    },
    
    // Helper methods for local state
    getTasksForDateFromState: tasksHook.getTasksForDateFromState,
    getTasksForClientAndDateFromState: tasksHook.getTasksForClientAndDateFromState,
    getTaskForClientAndTimeBlock: tasksHook.getTaskForClientAndTimeBlock,
    getTasksByType: tasksHook.getTasksByType,
    getCompletedTasksForDate: tasksHook.getCompletedTasksForDate,
    getIncompleteTasksForDate: tasksHook.getIncompleteTasksForDate,
    getTaskCompletionRate: tasksHook.getTaskCompletionRate
  };

  // NEW: Complete internship actions
  const internshipActions = useMemo(() => {
  console.log('🔍 Creating internshipActions...', {
    hasInternshipsHook: !!internshipsHook,
    internshipsHookKeys: internshipsHook ? Object.keys(internshipsHook) : 'none',
    hasAddFunction: !!internshipsHook?.add,
    loading: internshipsHook?.loading,
    error: internshipsHook?.error,
    internshipsLength: internshipsHook?.internships?.length || 0
  });

  // FIXED: Always return an object, even if hook is not ready
  if (!internshipsHook) {
    console.warn('⚠️ internshipsHook not available yet, returning placeholder actions');
    return {
      add: async () => { throw new Error('Internship system not ready'); },
      update: async () => { throw new Error('Internship system not ready'); },
      remove: async () => { throw new Error('Internship system not ready'); },
      start: async () => { throw new Error('Internship system not ready'); },
      complete: async () => { throw new Error('Internship system not ready'); },
      getForClient: async () => { throw new Error('Internship system not ready'); },
      getClientStats: async () => { throw new Error('Internship system not ready'); }
    };
  }

  // FIXED: Check for individual functions instead of just .add
  if (!internshipsHook.add || !internshipsHook.update || !internshipsHook.remove) {
    console.warn('❌ internshipsHook missing required functions:', {
      hasAdd: !!internshipsHook.add,
      hasUpdate: !!internshipsHook.update,
      hasRemove: !!internshipsHook.remove
    });
    
    // Return placeholder actions that show helpful error messages
    return {
      add: async () => { 
        alert('Internship management is still loading. Please wait a moment and try again.');
        throw new Error('Internship hook not ready'); 
      },
      update: async () => { 
        alert('Internship management is still loading. Please wait a moment and try again.');
        throw new Error('Internship hook not ready'); 
      },
      remove: async () => { 
        alert('Internship management is still loading. Please wait a moment and try again.');
        throw new Error('Internship hook not ready'); 
      },
      start: async () => { 
        alert('Internship management is still loading. Please wait a moment and try again.');
        throw new Error('Internship hook not ready'); 
      },
      complete: async () => { 
        alert('Internship management is still loading. Please wait a moment and try again.');
        throw new Error('Internship hook not ready'); 
      },
      getForClient: async () => { 
        throw new Error('Internship hook not ready'); 
      },
      getClientStats: async () => { 
        throw new Error('Internship hook not ready'); 
      }
    };
  }

  const actions = {
    add: async (internshipData) => {
      try {
        console.log('➕ Adding internship via actions:', internshipData);
        const result = await internshipsHook.add(internshipData);
        console.log('✅ Internship added successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Error adding internship:', error);
        throw error;
      }
    },
    
    update: async (internshipId, updates) => {
      try {
        console.log('📝 Updating internship via actions:', internshipId, updates);
        await internshipsHook.update(internshipId, updates);
        console.log('✅ Internship updated successfully');
      } catch (error) {
        console.error('❌ Error updating internship:', error);
        throw error;
      }
    },
    
    remove: async (internshipId) => {
      try {
        console.log('🗑️ Removing internship via actions:', internshipId);
        await internshipsHook.remove(internshipId);
        console.log('✅ Internship removed successfully');
      } catch (error) {
        console.error('❌ Error removing internship:', error);
        throw error;
      }
    },
    
    start: async (internshipId, actualStartDate) => {
      try {
        console.log('🚀 Starting internship via actions:', internshipId, actualStartDate);
        await internshipsHook.start(internshipId, actualStartDate);
        console.log('✅ Internship started successfully');
      } catch (error) {
        console.error('❌ Error starting internship:', error);
        throw error;
      }
    },
    
    complete: async (internshipId, completionDate, completionData = {}) => {
      try {
        console.log('🎯 Completing internship via actions:', internshipId, completionDate);
        await internshipsHook.complete(internshipId, completionDate, completionData);
        console.log('✅ Internship completed successfully');
      } catch (error) {
        console.error('❌ Error completing internship:', error);
        throw error;
      }
    },
    
    cancel: async (internshipId, reason) => {
      try {
        console.log('❌ Cancelling internship via actions:', internshipId, reason);
        await internshipsHook.cancel(internshipId, reason);
        console.log('✅ Internship cancelled successfully');
      } catch (error) {
        console.error('❌ Error cancelling internship:', error);
        throw error;
      }
    },
    
    markDay: async (internshipId, date, dayData) => {
      try {
        console.log('📅 Marking internship day via actions:', internshipId, date);
        await internshipsHook.markDay(internshipId, date, dayData);
        console.log('✅ Internship day marked successfully');
      } catch (error) {
        console.error('❌ Error marking internship day:', error);
        throw error;
      }
    },
    
    addEvaluation: async (internshipId, evaluationData) => {
      try {
        console.log('📝 Adding evaluation via actions:', internshipId);
        await internshipsHook.addEvaluation(internshipId, evaluationData);
        console.log('✅ Evaluation added successfully');
      } catch (error) {
        console.error('❌ Error adding evaluation:', error);
        throw error;
      }
    },
    
    getForClient: async (clientId) => {
      try {
        console.log('📋 Getting internships for client via actions:', clientId);
        const result = await internshipsHook.getForClient(clientId);
        console.log('✅ Client internships retrieved:', result.length);
        return result;
      } catch (error) {
        console.error('❌ Error getting client internships:', error);
        throw error;
      }
    },
    
    getClientStats: async (clientId) => {
      try {
        console.log('📊 Getting client stats via actions:', clientId);
        const result = await internshipsHook.getClientStats(clientId);
        console.log('✅ Client stats retrieved:', result);
        return result;
      } catch (error) {
        console.error('❌ Error getting client stats:', error);
        throw error;
      }
    },
    
    // Helper methods from hook
    getByStatus: internshipsHook.getByStatus,
    getCurrent: internshipsHook.getCurrent,
    getCompleted: internshipsHook.getCompleted,
    getTotalDays: internshipsHook.getTotalDays,
    getProgress: internshipsHook.getProgress
  };

  console.log('✅ internshipActions created successfully with functions:', Object.keys(actions));
  return actions;
}, [internshipsHook]);

  // FIXED: Memoize mileage actions to prevent re-creation on every render
  const mileageActions = useMemo(() => {
    if (!mileageHook.addRecord) {
      return null;
    }

    return {
      addRecord: async (recordData) => {
        try {
          const result = await mileageHook.addRecord(recordData);
          return result;
        } catch (error) {
          console.error('Error adding mileage record:', error);
          throw error;
        }
      },
      
      updateRecord: async (recordId, updates) => {
        try {
          await mileageHook.updateRecord(recordId, updates);
        } catch (error) {
          console.error('Error updating mileage record:', error);
          throw error;
        }
      },
      
      deleteRecord: async (recordId) => {
        try {
          await mileageHook.deleteRecord(recordId);
        } catch (error) {
          console.error('Error deleting mileage record:', error);
          throw error;
        }
      },
      
      getMonthlyRecords: async (year, month) => {
        try {
          return await mileageHook.getMonthlyRecords(year, month);
        } catch (error) {
          console.error('Error getting monthly mileage:', error);
          throw error;
        }
      },
      
      // Helper methods
      getRecordsForDate: mileageHook.getRecordsForDate,
      getRecordsForMonth: mileageHook.getRecordsForMonth,
      getCurrentMonthTotals: mileageHook.getCurrentMonthTotals,
      getMonthlyTotals: mileageHook.getMonthlyTotals,
      clearError: mileageHook.clearError
    };
  }, [mileageHook]);

  // Loading state - true if any critical data is still loading
  const loading = clientsHook.loading || coachesHook.loading || schedulesHook.loading || 
                  coachAvailabilityHook.loading || graceAttendanceHook.loading || 
                  tasksHook.loading || internshipsHook.loading;

  // Error state - collect all errors
  const errors = [
    clientsHook.error,
    coachesHook.error,
    schedulesHook.error,
    coachAvailabilityHook.error,
    graceAttendanceHook.error,
    tasksHook.error,
    mileageHook.error,
    internshipsHook.error
  ].filter(Boolean);

  // FIXED: Always ensure arrays are returned, even during loading/error states
  const safeClients = Array.isArray(clientsHook.clients) ? clientsHook.clients : [];
  const safeCoaches = Array.isArray(coachesHook.coaches) ? coachesHook.coaches : [];
  const safeSchedules = Array.isArray(schedulesHook.schedules) ? schedulesHook.schedules : [];
  const safeAvailabilityRecords = Array.isArray(coachAvailabilityHook.availabilityRecords) ? coachAvailabilityHook.availabilityRecords : [];
  const safeAttendanceRecords = Array.isArray(graceAttendanceHook.attendanceRecords) ? graceAttendanceHook.attendanceRecords : [];
  const safeTasks = Array.isArray(tasksHook.tasks) ? tasksHook.tasks : [];
  const safeMileageRecords = Array.isArray(mileageHook.records) ? mileageHook.records : [];
  const safeInternships = Array.isArray(internshipsHook.internships) ? internshipsHook.internships : [];

  return {
    // UI State
    activeTab,
    selectedClient,
    isMobileMenuOpen,
    showPasswordModal,
    loading,
    errors,
    hasData: !loading && errors.length === 0,

    // Data - ALWAYS return arrays, never undefined
    clients: safeClients,
    coaches: safeCoaches,
    schedules: safeSchedules,
    availabilityRecords: safeAvailabilityRecords,
    attendanceRecords: safeAttendanceRecords,
    tasks: safeTasks,
    mileageRecords: safeMileageRecords,
    internships: safeInternships, // ADD internships to state

    // UI Actions
    setActiveTab: handleTabChange,
    setSelectedClient: handleClientSelect,
    setIsMobileMenuOpen: toggleMobileMenu,
    setShowPasswordModal,
    handleBackToClients,

    // Data Actions
    clientActions,
    coachActions,
    scheduleActions,
    availabilityActions,
    graceAttendanceActions,
    taskActions,
    mileageActions,
    internshipActions, // ADD internship actions

    // Utility functions
    utils: {
      // Get all clients for a specific program
      getClientsByProgram: (program) => {
        return clientActions.getByProgram(program);
      },
      
      // Get Grace clients
      getGraceClients: () => {
        return safeClients.filter(client => client?.program === 'grace');
      },
      
      // NEW: Get Bridges clients (for internship management)
      getBridgesClients: () => {
        return safeClients.filter(client => client?.program === 'bridges');
      },
      
      // NEW: Get internships for client
      getInternshipsForClient: (clientId) => {
        return safeInternships.filter(internship => internship?.clientId === clientId);
      },
      
      // Get schedule statistics
      getScheduleStats: (date) => {
        const daySchedules = scheduleActions.getForDate(date);
        return {
          totalSessions: daySchedules.length,
          uniqueClients: [...new Set(daySchedules.map(s => s.clientId))].length,
          uniqueCoaches: [...new Set(daySchedules.map(s => s.coachId))].length,
          sessionsByTimeSlot: daySchedules.reduce((acc, schedule) => {
            acc[schedule.timeSlot] = (acc[schedule.timeSlot] || 0) + 1;
            return acc;
          }, {})
        };
      },
      
      // Get Grace attendance statistics for a date
      getGraceAttendanceStats: (date) => {
        const graceClients = safeClients.filter(client => client?.program === 'grace');
        const attendanceData = graceAttendanceHook.getTotalAttendanceForDate(date);
        
        return {
          totalGraceClients: graceClients.length,
          ...attendanceData,
          attendanceRate: attendanceData.total > 0 ? Math.round((attendanceData.present / attendanceData.total) * 100) : 0
        };
      },
      
      // NEW: Get internship statistics
      getInternshipStats: () => {
        const bridges = safeClients.filter(client => client?.program === 'bridges');
        const totalInternships = safeInternships.length;
        const activeInternships = safeInternships.filter(i => i.status === 'in_progress').length;
        const completedInternships = safeInternships.filter(i => i.status === 'completed').length;
        
        return {
          totalBridgesClients: bridges.length,
          totalInternships,
          activeInternships,
          completedInternships,
          completionRate: totalInternships > 0 ? Math.round((completedInternships / totalInternships) * 100) : 0
        };
      },
      
      // FIXED: Get mileage statistics with null check
      getMileageStats: () => {
        if (!mileageActions) {
          return { miles: 0, recordCount: 0, hasRecords: false, totalRecords: 0 };
        }
        
        const currentMonthTotals = mileageActions.getCurrentMonthTotals();
        return {
          ...currentMonthTotals,
          hasRecords: safeMileageRecords.length > 0,
          totalRecords: safeMileageRecords.length
        };
      },
      
      // Check if client has sessions on date
      isClientScheduled: (clientId, date) => {
        return scheduleActions.getForClient(clientId, date).length > 0;
      },
      
      // Check if coach has sessions on date
      isCoachScheduled: (coachId, date) => {
        return scheduleActions.getForCoach(coachId, date).length > 0;
      },
      
      // Get available coaches for a time slot (considering availability)
      getAvailableCoaches: (date, timeSlot) => {
        const allCoaches = safeCoaches;
        const availableCoaches = availabilityActions.getAvailableCoaches(allCoaches, date);
        
        const scheduledCoaches = scheduleActions.getForTimeSlot(date, timeSlot)
          .map(s => s.coachId);
          
        return availableCoaches.filter(coach => 
          !scheduledCoaches.includes(coach.uid || coach.id)
        );
      }
    }
  };
};