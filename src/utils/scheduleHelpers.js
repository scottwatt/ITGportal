// src/utils/scheduleHelpers.js - FIXED: Handles special time slots gracefully
// Helper functions for organizing and displaying schedules

import { TIME_SLOTS, getAllTimeSlots } from './constants';

// Get all time slots (core + special) for comprehensive processing
const allTimeSlots = getAllTimeSlots();

// Helper function to get time slot info (handles both core and special)
const getTimeSlotInfo = (timeSlotId) => {
  return allTimeSlots.find(slot => slot.id === timeSlotId) || {
    id: timeSlotId,
    label: timeSlotId,
    start: 'Unknown',
    end: 'Time',
    type: 'unknown'
  };
};

// Helper function to check if a time slot is special
const isSpecialTimeSlot = (timeSlotId) => {
  return !TIME_SLOTS.some(slot => slot.id === timeSlotId);
};

/**
 * Get time slots in proper order
 * @returns {Array} Time slots in correct chronological order
 */
export const getOrderedTimeSlots = () => {
  return TIME_SLOTS; // Core slots for main scheduling interface
};

/**
 * FIXED: Group schedules by time slot and coach for cleaner display
 * @param {Array} schedules - Array of schedule objects
 * @param {Array} clients - Array of client objects
 * @param {Array} coaches - Array of coach objects
 * @returns {Object} Grouped schedules by timeSlot -> coach -> clients
 */
export const groupSchedulesByTimeSlotAndCoach = (schedules, clients, coaches) => {
  const grouped = {};
  
  // Initialize with ordered time slots (core only for main interface)
  TIME_SLOTS.forEach(slot => {
    grouped[slot.id] = {};
  });
  
  // Group schedules
  schedules.forEach(schedule => {
    const timeSlot = schedule.timeSlot;
    const coachId = schedule.coachId;
    
    // FIXED: Initialize time slot if it doesn't exist (handles special slots)
    if (!grouped[timeSlot]) {
      grouped[timeSlot] = {};
    }
    
    if (!grouped[timeSlot][coachId]) {
      const coach = coaches.find(c => c.uid === coachId || c.id === coachId);
      grouped[timeSlot][coachId] = {
        coach: coach,
        clients: []
      };
    }
    
    const client = clients.find(c => c.id === schedule.clientId);
    if (client) {
      grouped[timeSlot][coachId].clients.push({
        ...client,
        scheduleId: schedule.id
      });
    }
  });
  
  return grouped;
};

/**
 * Get properly ordered and grouped schedule for display
 * @param {Array} schedules - Array of schedule objects
 * @param {Array} clients - Array of client objects  
 * @param {Array} coaches - Array of coach objects
 * @returns {Array} Array of time slot objects with grouped coach/client data
 */
export const getOrderedGroupedSchedule = (schedules, clients, coaches) => {
  const grouped = groupSchedulesByTimeSlotAndCoach(schedules, clients, coaches);
  
  return TIME_SLOTS.map(slot => ({
    ...slot,
    coachGroups: Object.values(grouped[slot.id] || {}).filter(group => group.clients.length > 0)
  }));
};

/**
 * FIXED: Group schedules by coach (for coach's personal schedule view)
 * @param {Array} schedules - Array of schedule objects for a specific coach
 * @param {Array} clients - Array of client objects
 * @returns {Object} Grouped by timeSlot with client arrays
 */
export const groupCoachSchedulesByTimeSlot = (schedules, clients) => {
  const grouped = {};
  
  // Initialize with ordered time slots (core only)
  TIME_SLOTS.forEach(slot => {
    grouped[slot.id] = [];
  });
  
  // Group client schedules by time slot
  schedules.forEach(schedule => {
    const timeSlotId = schedule.timeSlot;
    
    // FIXED: Initialize time slot if it doesn't exist (handles special slots)
    if (!grouped[timeSlotId]) {
      grouped[timeSlotId] = [];
    }
    
    const client = clients.find(c => c.id === schedule.clientId);
    if (client) {
      grouped[timeSlotId].push({
        ...client,
        scheduleId: schedule.id
      });
    }
  });
  
  return grouped;
};

/**
 * FIXED: Get ordered schedule for a coach's personal view
 * @param {Array} schedules - Array of schedule objects for a specific coach
 * @param {Array} clients - Array of client objects
 * @returns {Array} Array of time slot objects with client data
 */
export const getOrderedCoachSchedule = (schedules, clients) => {
  const grouped = groupCoachSchedulesByTimeSlot(schedules, clients);
  
  return TIME_SLOTS.map(slot => ({
    ...slot,
    clients: grouped[slot.id] || []
  }));
};

/**
 * FIXED: Get weekly schedule for a client with proper time ordering
 * @param {Array} weeklyScheduleData - Array of daily schedule data
 * @param {Array} coaches - Array of coach objects
 * @returns {Array} Weekly schedule with properly ordered time slots
 */
export const getOrderedWeeklySchedule = (weeklyScheduleData, coaches) => {
  return weeklyScheduleData.map(day => {
    // Get unique time slots from this day's sessions
    const dayTimeSlots = [...new Set(day.sessions.map(s => s.timeSlot))];
    
    // Separate core and special time slots
    const coreSlots = TIME_SLOTS.filter(slot => dayTimeSlots.includes(slot.id));
    const specialSlots = dayTimeSlots
      .filter(slotId => isSpecialTimeSlot(slotId))
      .map(slotId => getTimeSlotInfo(slotId));
    
    // Combine core and special slots in order
    const allDaySlots = [...coreSlots, ...specialSlots];
    
    return {
      ...day,
      timeSlotGroups: allDaySlots.map(slot => {
        const sessionsForSlot = day.sessions.filter(s => s.timeSlot === slot.id);
        return {
          ...slot,
          sessions: sessionsForSlot.map(session => {
            const coach = coaches.find(c => c.uid === session.coachId || c.id === session.coachId);
            return {
              ...session,
              coach
            };
          })
        };
      }).filter(group => group.sessions.length > 0)
    };
  });
};

/**
 * Sort time slots properly for any schedule display
 * @param {Array} scheduleItems - Array of items with timeSlot property
 * @returns {Array} Sorted array in proper time order
 */
export const sortByTimeSlot = (scheduleItems) => {
  return scheduleItems.sort((a, b) => {
    const timeSlotA = getTimeSlotInfo(a.timeSlot);
    const timeSlotB = getTimeSlotInfo(b.timeSlot);
    
    // Use start time for sorting, fall back to label or id
    const timeA = timeSlotA.start || timeSlotA.label || timeSlotA.id;
    const timeB = timeSlotB.start || timeSlotB.label || timeSlotB.id;
    
    return timeA.localeCompare(timeB);
  });
};

/**
 * Format client display for schedule views
 * @param {Object} client - Client object
 * @param {boolean} showProgram - Whether to show program badge
 * @returns {Object} Formatted client display data
 */
export const formatClientForSchedule = (client, showProgram = true) => {
  const programBadge = {
    'limitless': 'L',
    'new-options': 'NO', 
    'bridges': 'B',
    'grace': 'G'
  };
  
  const businessDisplay = client.program === 'limitless' ? client.businessName :
                         client.program === 'new-options' ? 'Community Job' :
                         client.program === 'bridges' ? 'Career Dev' :
                         client.program === 'grace' ? 'Grace' :
                         client.businessName;
  
  return {
    ...client,
    displayBusiness: businessDisplay,
    programBadge: showProgram ? (programBadge[client.program || 'limitless'] || 'L') : null
  };
};

// Export helper functions for external use
export { 
  getTimeSlotInfo, 
  isSpecialTimeSlot
};