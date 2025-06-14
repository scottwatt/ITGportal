// src/utils/helpers.js - Updated with flexible scheduling support and internship helpers

import { PASSWORD_CHARS, FILE_TYPE_MAPPINGS, FILE_ICONS, MILEAGE_FORMATS, TIME_SLOTS, DEFAULT_TIME_SLOTS_BY_PROGRAM, DEFAULT_WORKING_DAYS_BY_PROGRAM, ALL_WORKING_DAYS } from './constants';

/**
 * Generate a temporary password for new users
 * @param {string} userType - 'client' or 'coach' (default: 'client')
 * @param {number} length - Password length (default: 8, ignored when using fixed passwords)
 * @returns {string} Generated password
 */
export const generateTempPassword = (userType = 'client', length = 8) => {
  // Use fixed passwords based on user type
  if (userType === 'coach') {
    return 'ITGemployee123';
  } else if (userType === 'client') {
    return 'ITGclient123';
  }
  
  // Fallback to random password generation (shouldn't be used with current setup)
  let password = '';
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARS.charAt(Math.floor(Math.random() * PASSWORD_CHARS.length));
  }
  return password;
};

/**
 * Get default password for user type
 * @param {string} userType - 'client' or 'coach'
 * @returns {string} Default password
 */
export const getDefaultPassword = (userType) => {
  return userType === 'coach' ? 'ITGemployee123' : 'ITGclient123';
};

/**
 * Get file icon based on file type
 * @param {string} fileType - File type
 * @returns {string} File icon emoji
 */
export const getFileIcon = (fileType) => {
  return FILE_ICONS[fileType] || FILE_ICONS.default;
};

/**
 * Determine file type from file extension
 * @param {string} fileName - File name with extension
 * @returns {string} File type category
 */
export const getFileTypeFromExtension = (fileName) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  for (const [type, extensions] of Object.entries(FILE_TYPE_MAPPINGS)) {
    if (extensions.includes(extension)) {
      return type;
    }
  }
  
  return 'document';
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
  return Math.round(bytes / 1048576 * 10) / 10 + ' MB';
};

/**
 * Get program display name
 * @param {string} programId - Program ID
 * @param {Array} programs - Programs array
 * @returns {string} Program display name
 */
export const getProgramDisplayName = (programId, programs = []) => {
  const program = programs.find(p => p.id === programId);
  return program ? program.name : 'Unknown Program';
};

/**
 * Get program badge text
 * @param {string} programId - Program ID
 * @returns {string} Badge text
 */
export const getProgramBadge = (programId) => {
  const badges = {
    'limitless': 'L',
    'new-options': 'NO',
    'bridges': 'B',
    'grace': 'G'
  };
  return badges[programId] || 'U';
};

/**
 * Get business description placeholder based on program
 * @param {string} programId - Program ID
 * @returns {string} Placeholder text
 */
export const getBusinessDescriptionPlaceholder = (programId) => {
  switch (programId) {
    case 'limitless':
      return 'Business Description';
    case 'new-options':
      return 'Job interests and community work goals';
    case 'bridges':
      return 'Career development and internship goals';
    case 'grace':
      return 'Enrichment program goals';
    default:
      return 'Program description and goals';
  }
};

/**
 * Get job goal placeholder based on program
 * @param {string} programId - Program ID
 * @returns {string} Placeholder text
 */
export const getJobGoalPlaceholder = (programId) => {
  switch (programId) {
    case 'limitless':
      return 'Business Type';
    case 'new-options':
      return 'Job Interest/Field';
    case 'bridges':
      return 'Career Goals/Skills';
    case 'grace':
      return 'Enrichment Activities';
    default:
      return 'Goals';
  }
};

/**
 * UPDATED: Filter schedulable clients (excludes Grace program)
 * FIXED: Add defensive programming to prevent filter errors
 * @param {Array} clients - All clients (can be undefined)
 * @returns {Array} Schedulable clients
 */
export const getSchedulableClients = (clients = []) => {
  // Return empty array if clients is not an array
  if (!Array.isArray(clients)) {
    console.warn('getSchedulableClients: clients is not an array, returning empty array');
    return [];
  }
  
  return clients.filter(client => {
    const program = client?.program || 'limitless';
    return ['limitless', 'new-options', 'bridges'].includes(program);
  });
};

/**
 * NEW: Get available time slots for a program type
 * @param {string} program - Program ID
 * @returns {Array} Available time slots for the program
 */
export const getAvailableTimeSlotsForProgram = (program) => {
  const defaultSlots = DEFAULT_TIME_SLOTS_BY_PROGRAM[program] || DEFAULT_TIME_SLOTS_BY_PROGRAM.limitless;
  return TIME_SLOTS.filter(slot => defaultSlots.includes(slot.id));
};

/**
 * NEW: Get working days for a program type
 * @param {string} program - Program ID
 * @returns {Array} Default working days for the program
 */
export const getWorkingDaysForProgram = (program) => {
  return DEFAULT_WORKING_DAYS_BY_PROGRAM[program] || DEFAULT_WORKING_DAYS_BY_PROGRAM.limitless;
};

/**
 * UPDATED: Get clients available for scheduling on a specific date
 * Now supports flexible time slots and weekend work for events
 * @param {Array} clients - All clients (can be undefined)
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Array} Clients available to work on the specified date
 */
export const getClientsAvailableForDate = (clients = [], date) => {
  // Return empty array if clients is not an array
  if (!Array.isArray(clients)) {
    console.warn('getClientsAvailableForDate: clients is not an array, returning empty array');
    return [];
  }
  
  if (!date) {
    console.warn('getClientsAvailableForDate: date is required');
    return [];
  }
  
  // Get day name from date
  const dateObj = new Date(date + 'T12:00:00');
  const dayName = dateObj.toLocaleDateString('en-US', { 
    timeZone: 'America/Los_Angeles',
    weekday: 'long' 
  }).toLowerCase();
  
  return getSchedulableClients(clients).filter(client => {
    // Check if client works on this day
    const workingDays = client.workingDays || getWorkingDaysForProgram(client.program || 'limitless');
    return workingDays.includes(dayName);
  });
};

/**
 * UPDATED: Get clients available for a specific time slot on a date
 * Now supports flexible time slots including early hours and weekend events
 * @param {Array} clients - All clients
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {string} timeSlot - Time slot ID (flexible based on available slots)
 * @returns {Array} Clients available for the specific time slot
 */
export const getClientsAvailableForTimeSlot = (clients = [], date, timeSlot) => {
  if (!Array.isArray(clients)) {
    console.warn('getClientsAvailableForTimeSlot: clients is not an array, returning empty array');
    return [];
  }
  
  if (!date || !timeSlot) {
    console.warn('getClientsAvailableForTimeSlot: date and timeSlot are required');
    return [];
  }
  
  return getClientsAvailableForDate(clients, date).filter(client => {
    // Check if client is available for this time slot
    const availableTimeSlots = client.availableTimeSlots || getAvailableTimeSlotsForProgram(client.program || 'limitless').map(slot => slot.id);
    return availableTimeSlots.includes(timeSlot);
  });
};

/**
 * NEW: Check if client has available slots remaining on a date
 * @param {Object} client - Client object
 * @param {Array} schedules - All schedules
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Object} Availability information
 */
export const getClientAvailabilityForDate = (client, schedules = [], date) => {
  if (!client || !date) {
    return { availableSlots: 0, totalSlots: 0, scheduledSlots: 0, isFullyScheduled: false };
  }
  
  // Grace clients don't use individual scheduling
  if (client.program === 'grace') {
    return { availableSlots: 0, totalSlots: 0, scheduledSlots: 0, isFullyScheduled: false };
  }
  
  // Check if client works on this day
  const dateObj = new Date(date + 'T12:00:00');
  const dayName = dateObj.toLocaleDateString('en-US', { 
    timeZone: 'America/Los_Angeles',
    weekday: 'long' 
  }).toLowerCase();
  
  const workingDays = client.workingDays || getWorkingDaysForProgram(client.program || 'limitless');
  if (!workingDays.includes(dayName)) {
    return { availableSlots: 0, totalSlots: 0, scheduledSlots: 0, isFullyScheduled: false };
  }
  
  // Get client's available time slots - use flexible slots based on their program
  const availableTimeSlots = client.availableTimeSlots || getAvailableTimeSlotsForProgram(client.program || 'limitless').map(slot => slot.id);
  const totalSlots = availableTimeSlots.length;
  
  // Count how many of their available slots are already scheduled
  if (!Array.isArray(schedules)) {
    schedules = [];
  }
  
  const clientSchedules = schedules.filter(s => 
    s.clientId === client.id && 
    s.date === date &&
    availableTimeSlots.includes(s.timeSlot)
  );
  const scheduledSlots = clientSchedules.length;
  const availableSlots = totalSlots - scheduledSlots;
  
  return {
    availableSlots,
    totalSlots,
    scheduledSlots,
    isFullyScheduled: availableSlots === 0 && totalSlots > 0
  };
};

/**
 * UPDATED: Get unscheduled clients for a specific date (respects individual schedules)
 * @param {Array} clients - All clients
 * @param {Array} schedules - All schedules 
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Array} Clients with available slots on the date
 */
export const getUnscheduledClientsForDate = (clients = [], schedules = [], date) => {
  const availableClients = getClientsAvailableForDate(clients, date);
  
  return availableClients.map(client => {
    const availability = getClientAvailabilityForDate(client, schedules, date);
    return {
      ...client,
      ...availability
    };
  }).filter(client => client.availableSlots > 0); // Only return clients with available slots
};

/**
 * NEW: Get fully scheduled clients for a date (for greying out)
 * @param {Array} clients - All clients
 * @param {Array} schedules - All schedules
 * @param {string} date - Date string (YYYY-MM-DD)  
 * @returns {Array} Clients that are fully scheduled for their available slots
 */
export const getFullyScheduledClientsForDate = (clients = [], schedules = [], date) => {
  const availableClients = getClientsAvailableForDate(clients, date);
  
  return availableClients.map(client => {
    const availability = getClientAvailabilityForDate(client, schedules, date);
    return {
      ...client,
      ...availability
    };
  }).filter(client => client.isFullyScheduled);
};

/**
 * UPDATED: Get working days display string for client (supports weekends)
 * @param {Array} workingDays - Array of day names
 * @returns {string} Formatted working days string
 */
export const formatWorkingDays = (workingDays = []) => {
  if (!Array.isArray(workingDays) || workingDays.length === 0) {
    return 'No working days set';
  }
  
  const dayAbbreviations = {
    'monday': 'Mon',
    'tuesday': 'Tue', 
    'wednesday': 'Wed',
    'thursday': 'Thu',
    'friday': 'Fri',
    'saturday': 'Sat',
    'sunday': 'Sun'
  };
  
  return workingDays.map(day => dayAbbreviations[day] || day).join(', ');
};

/**
 * UPDATED: Get time slots display string for client (supports flexible slots)
 * @param {Array} availableTimeSlots - Array of time slot IDs
 * @returns {string} Formatted time slots string
 */
export const formatAvailableTimeSlots = (availableTimeSlots = []) => {
  if (!Array.isArray(availableTimeSlots) || availableTimeSlots.length === 0) {
    return 'No time slots set';
  }
  
  const timeSlotLabels = {};
  TIME_SLOTS.forEach(slot => {
    timeSlotLabels[slot.id] = slot.label.replace(' PST', '');
  });
  
  return availableTimeSlots.map(slot => timeSlotLabels[slot] || slot).join(', ');
};

/**
 * NEW: Check if a time slot is an early morning slot (before 8 AM)
 * @param {string} timeSlotId - Time slot ID
 * @returns {boolean} True if it's an early morning slot
 */
export const isEarlyMorningSlot = (timeSlotId) => {
  return timeSlotId === '7-9' || timeSlotId.startsWith('7');
};

/**
 * NEW: Check if a time slot is a weekend/event slot
 * @param {string} timeSlotId - Time slot ID
 * @returns {boolean} True if it's a weekend/event slot
 */
export const isWeekendEventSlot = (timeSlotId) => {
  return timeSlotId.includes('weekend') || timeSlotId === 'custom';
};

/**
 * NEW: Get time slot category for styling/grouping
 * @param {string} timeSlotId - Time slot ID
 * @returns {string} Category: 'early', 'regular', 'weekend', 'custom'
 */
export const getTimeSlotCategory = (timeSlotId) => {
  if (isEarlyMorningSlot(timeSlotId)) return 'early';
  if (isWeekendEventSlot(timeSlotId)) return 'weekend';
  if (timeSlotId === 'custom') return 'custom';
  return 'regular';
};

/**
 * Get client initials for avatar
 * @param {string} name - Client name
 * @returns {string} Initials (max 2 characters)
 */
export const getClientInitials = (name = '') => {
  if (!name || typeof name !== 'string') return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

/**
 * Get coach type display name
 * @param {string} coachType - Coach type ID
 * @param {Array} coachTypes - Coach types array
 * @returns {string} Coach type display name
 */
export const getCoachTypeDisplayName = (coachType, coachTypes = []) => {
  const type = coachTypes.find(t => t.id === coachType);
  return type ? type.name : 'Unknown Coach Type';
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password must be less than 128 characters' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Clean form data by removing empty strings and trimming values
 * @param {Object} data - Form data
 * @returns {Object} Cleaned data
 */
export const cleanFormData = (data = {}) => {
  const cleaned = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        cleaned[key] = trimmed;
      }
    } else if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const safeAsync = (asyncFn) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      console.error('Async operation failed:', error);
      throw error;
    }
  };
};

/**
 * Get error message from various error types
 * @param {Error|string|Object} error - Error object
 * @returns {string} Error message
 */
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.code) return `Error: ${error.code}`;
  return 'An unexpected error occurred';
};

/**
 * ADDED: Safe array filter helper to prevent undefined errors
 * @param {Array} array - Array to filter (can be undefined)
 * @param {Function} predicate - Filter predicate function
 * @returns {Array} Filtered array or empty array
 */
export const safeFilter = (array = [], predicate) => {
  if (!Array.isArray(array)) {
    console.warn('safeFilter: First argument is not an array, returning empty array');
    return [];
  }
  
  if (typeof predicate !== 'function') {
    console.warn('safeFilter: Predicate is not a function, returning original array');
    return array;
  }
  
  return array.filter(predicate);
};

/**
 * ADDED: Safe array find helper
 * @param {Array} array - Array to search (can be undefined)
 * @param {Function} predicate - Find predicate function
 * @returns {*} Found item or undefined
 */
export const safeFind = (array = [], predicate) => {
  if (!Array.isArray(array)) {
    console.warn('safeFind: First argument is not an array, returning undefined');
    return undefined;
  }
  
  if (typeof predicate !== 'function') {
    console.warn('safeFind: Predicate is not a function, returning undefined');
    return undefined;
  }
  
  return array.find(predicate);
};

// MILEAGE PRECISION HELPERS

/**
 * Format mileage for display with exact precision
 * @param {number} mileage - Mileage value
 * @param {number} precision - Decimal places (defaults to 3 for exact billing)
 * @returns {string} Formatted mileage string
 */
export const formatMileageForDisplay = (mileage, precision = MILEAGE_FORMATS.DISPLAY) => {
  if (typeof mileage !== 'number' || isNaN(mileage)) {
    return '0.000';
  }
  return mileage.toFixed(precision);
};

/**
 * Format mileage for payment calculations (always exact precision)
 * @param {number} mileage - Mileage value
 * @returns {string} Formatted mileage for billing
 */
export const formatMileageForPayment = (mileage) => {
  return formatMileageForDisplay(mileage, MILEAGE_FORMATS.PAYMENT);
};

/**
 * Parse mileage string to exact number with proper precision
 * @param {string|number} mileageInput - Mileage input value
 * @returns {number} Parsed mileage with exact precision
 */
export const parseMileageToExact = (mileageInput) => {
  let parsed;
  
  if (typeof mileageInput === 'string') {
    parsed = parseFloat(mileageInput);
  } else if (typeof mileageInput === 'number') {
    parsed = mileageInput;
  } else {
    return 0;
  }
  
  if (isNaN(parsed)) {
    return 0;
  }
  
  // Round to 3 decimal places to prevent floating point precision issues
  return Math.round(parsed * 1000) / 1000;
};

/**
 * Calculate total mileage with exact precision
 * @param {Array} mileageRecords - Array of mileage records
 * @returns {number} Total mileage with exact precision
 */
export const calculateTotalMileage = (mileageRecords = []) => {
  if (!Array.isArray(mileageRecords)) {
    return 0;
  }
  
  const total = mileageRecords.reduce((sum, record) => {
    const mileage = parseMileageToExact(record?.mileage || 0);
    return sum + mileage;
  }, 0);
  
  // Round to 3 decimal places for payment accuracy
  return Math.round(total * 1000) / 1000;
};

/**
 * Calculate monthly mileage totals with exact precision
 * @param {Array} mileageRecords - Array of mileage records
 * @param {number} year - Year to filter by
 * @param {number} month - Month to filter by (1-12)
 * @returns {Object} Monthly totals with exact precision
 */
export const calculateMonthlyMileageTotals = (mileageRecords = [], year, month) => {
  if (!Array.isArray(mileageRecords)) {
    return { miles: 0, recordCount: 0 };
  }
  
  const monthlyRecords = mileageRecords.filter(record => {
    if (!record?.date) return false;
    
    const recordDate = new Date(record.date);
    return recordDate.getFullYear() === year && recordDate.getMonth() + 1 === month;
  });
  
  const totalMiles = calculateTotalMileage(monthlyRecords);
  
  return {
    miles: totalMiles,
    recordCount: monthlyRecords.length
  };
};

/**
 * Get current month mileage for a specific coach
 * @param {Array} mileageRecords - Array of mileage records
 * @param {string} coachId - Coach ID to filter by
 * @returns {Object} Current month totals
 */
export const getCurrentMonthMileageForCoach = (mileageRecords = [], coachId) => {
  if (!Array.isArray(mileageRecords) || !coachId) {
    return { miles: 0, recordCount: 0 };
  }
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const coachRecords = mileageRecords.filter(record => 
    record?.coachId === coachId
  );
  
  return calculateMonthlyMileageTotals(coachRecords, currentYear, currentMonth);
};

/**
 * Validate mileage input with exact precision rules
 * @param {string|number} mileageInput - Mileage input to validate
 * @returns {Object} Validation result
 */
export const validateMileageInput = (mileageInput) => {
  const parsed = parseMileageToExact(mileageInput);
  
  if (parsed <= 0) {
    return { isValid: false, message: 'Mileage must be greater than 0' };
  }
  
  if (parsed < 0.001) {
    return { isValid: false, message: 'Mileage must be at least 0.001 miles for billing accuracy' };
  }
  
  if (parsed > 1000) {
    return { isValid: false, message: 'Mileage seems unusually high (over 1000 miles)' };
  }
  
  return { isValid: true, message: '', value: parsed };
};

/**
 * Format mileage for CSV export with exact precision
 * @param {number} mileage - Mileage value
 * @returns {string} CSV-formatted mileage
 */
export const formatMileageForCSV = (mileage) => {
  return formatMileageForPayment(mileage);
};

/**
 * Convert Google Maps distance to exact miles
 * @param {number} metersDistance - Distance in meters from Google Maps
 * @returns {number} Distance in miles with exact precision
 */
export const convertMetersToExactMiles = (metersDistance) => {
  if (typeof metersDistance !== 'number' || isNaN(metersDistance)) {
    return 0;
  }
  
  // Convert meters to miles with exact precision (no rounding during calculation)
  const miles = metersDistance * 0.000621371;
  
  // Return with 3 decimal places for billing accuracy
  return parseMileageToExact(miles);
};

// NEW: INTERNSHIP HELPERS

/**
 * Calculate business days for internship scheduling
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Array} workingDays - Array of working day names
 * @returns {number} Number of business days
 */
export const calculateInternshipBusinessDays = (startDate, endDate, workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayName = current.toLocaleDateString('en-US', { 
      timeZone: 'America/Los_Angeles',
      weekday: 'long' 
    }).toLowerCase();
    
    if (workingDays.includes(dayName)) {
      count++;
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

/**
 * Calculate estimated internship completion date
 * @param {Date} startDate - Start date
 * @param {number} totalBusinessDays - Total business days needed
 * @param {Array} workingDays - Array of working day names
 * @returns {Date} Estimated completion date
 */
export const calculateInternshipEndDate = (startDate, totalBusinessDays = 30, workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) => {
  let count = 0;
  const current = new Date(startDate);
  
  while (count < totalBusinessDays) {
    const dayName = current.toLocaleDateString('en-US', { 
      timeZone: 'America/Los_Angeles',
      weekday: 'long' 
    }).toLowerCase();
    
    if (workingDays.includes(dayName)) {
      count++;
    }
    
    if (count < totalBusinessDays) {
      current.setDate(current.getDate() + 1);
    }
  }
  
  return current;
};

/**
 * Format internship status for display
 * @param {string} status - Internship status
 * @returns {Object} Status display information
 */
export const formatInternshipStatus = (status) => {
  const statusMap = {
    'planned': { label: 'Planned', color: 'bg-blue-100 text-blue-800', icon: '📋' },
    'in_progress': { label: 'In Progress', color: 'bg-green-100 text-green-800', icon: '🏃' },
    'completed': { label: 'Completed', color: 'bg-purple-100 text-purple-800', icon: '✅' },
    'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: '❌' }
  };
  
  return statusMap[status] || { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: '❓' };
};

/**
 * Get next internship number for a client
 * @param {Array} existingInternships - Client's existing internships
 * @returns {number} Next internship number
 */
export const getNextInternshipNumber = (existingInternships = []) => {
  if (!Array.isArray(existingInternships)) return 1;
  return existingInternships.length + 1;
};

/**
 * Check if client has completed required internships (3 for Bridges)
 * @param {Array} internships - Client's internships
 * @returns {Object} Completion status information
 */
export const checkInternshipRequirements = (internships = []) => {
  if (!Array.isArray(internships)) {
    return { completed: 0, required: 3, isComplete: false, remaining: 3 };
  }
  
  const completed = internships.filter(i => i.status === 'completed').length;
  const required = 3; // Bridges program requires 3 internships
  const remaining = Math.max(0, required - completed);
  
  return {
    completed,
    required,
    isComplete: completed >= required,
    remaining,
    totalDays: internships.reduce((sum, i) => sum + (i.completedDays || 0), 0)
  };
};