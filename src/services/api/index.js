// src/services/api/index.js - Complete updated version with Grace attendance
import * as authService from '../firebase/auth';
import * as clientsService from '../firebase/clients';
import * as coachesService from '../firebase/coaches';
import * as schedulesService from '../firebase/schedules';
import * as coachAvailabilityService from '../firebase/coachAvailability';
import * as graceAttendanceService from '../firebase/graceAttendance'; // NEW IMPORT

// Re-export all services with consistent naming
export const api = {
  // Authentication
  auth: {
    login: authService.loginUser,
    logout: authService.logoutUser,
    getCurrentUser: authService.getCurrentUser,
    getUserProfile: authService.getUserProfile,
    changePassword: authService.changeUserPassword,
    isAuthenticated: authService.isAuthenticated,
    subscribeToAuthState: authService.subscribeToAuthState,
    isEmailInUse: authService.isEmailInUse
  },

  // Clients
  clients: {
    getAll: clientsService.subscribeToClients,
    getById: clientsService.getClientById,
    getByProgram: clientsService.getClientsByProgram,
    add: clientsService.addNewClient,
    update: clientsService.updateClient,
    updateProgress: clientsService.updateClientProgress,
    remove: clientsService.removeClient,
    createLoginAccount: clientsService.createClientLoginAccount,
    uploadFiles: clientsService.uploadFilesToClient,
    addFiles: clientsService.addFilesToClient,
    removeFile: clientsService.removeFileFromClient
  },

  // Coaches
  coaches: {
    getAll: coachesService.subscribeToCoaches,
    add: coachesService.addNewCoach,
    update: coachesService.updateCoach,
    remove: coachesService.removeCoach
  },

  // Schedules
  schedules: {
    getAll: schedulesService.subscribeToSchedules,
    add: schedulesService.addScheduleAssignment,
    remove: schedulesService.removeScheduleAssignment
  },

  // Coach Availability
  availability: {
    getAll: coachAvailabilityService.subscribeToCoachAvailability,
    set: coachAvailabilityService.setCoachAvailability,
    setBulk: coachAvailabilityService.setCoachAvailabilityBulk,
    remove: coachAvailabilityService.removeCoachAvailability,
    removeBulk: coachAvailabilityService.removeCoachAvailabilityBulk,
    getForCoach: coachAvailabilityService.getCoachAvailabilityRecords,
    getForDate: coachAvailabilityService.getCoachAvailability,
    getForDateRange: coachAvailabilityService.getAvailabilityForDateRange,
    getYearlySummary: coachAvailabilityService.getYearlyTimeOffSummary,
    getAllCoachesSummary: coachAvailabilityService.getAllCoachesTimeOffSummary,
    getAvailableCoaches: coachAvailabilityService.getAvailableCoachesForDate,
    unassignClients: coachAvailabilityService.unassignClientsFromUnavailableCoach,
    generateDateRange: coachAvailabilityService.generateDateRange
  },

  // NEW: Grace Attendance
  graceAttendance: {
    getAll: graceAttendanceService.subscribeToGraceAttendance,
    mark: graceAttendanceService.markAttendance,
    markBulk: graceAttendanceService.markBulkAttendance,
    getForDate: graceAttendanceService.getAttendanceForDate,
    getClientRange: graceAttendanceService.getClientAttendanceRange,
    getClientSummary: graceAttendanceService.getClientAttendanceSummary,
    getAllSummary: graceAttendanceService.getAllGraceAttendanceSummary,
    getMonthlyStats: graceAttendanceService.getMonthlyAttendanceStats,
    getClientsStatus: graceAttendanceService.getAttendanceStatusForClients
  }
};

// Convenience functions for common operations
export const authAPI = api.auth;
export const clientsAPI = api.clients;
export const coachesAPI = api.coaches;
export const schedulesAPI = api.schedules;
export const availabilityAPI = api.availability;
export const graceAttendanceAPI = api.graceAttendance; // NEW EXPORT

// Default export
export default api;