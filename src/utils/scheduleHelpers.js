// src/utils/scheduleHelpers.js
// Helper functions for organizing and displaying schedules

import { TIME_SLOTS } from './constants';

/**
 * Get time slots in proper order
 * @returns {Array} Time slots in correct chronological order
 */
export const getOrderedTimeSlots = () => {
  return TIME_SLOTS; // Already in correct order: 8-10, 10-12, 12:30-2:30
};

/**
 * Group schedules by time slot and coach for cleaner display
 * @param {Array} schedules - Array of schedule objects
 * @param {Array} clients - Array of client objects
 * @param {Array} coaches - Array of coach objects
 * @returns {Object} Grouped schedules by timeSlot -> coach -> clients
 */
export const groupSchedulesByTimeSlotAndCoach = (schedules, clients, coaches) => {
  const grouped = {};
  
  // Initialize with ordered time slots
  TIME_SLOTS.forEach(slot => {
    grouped[slot.id] = {};
  });
  
  // Group schedules
  schedules.forEach(schedule => {
    const timeSlot = schedule.timeSlot;
    const coachId = schedule.coachId;
    
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
 * Group schedules by coach (for coach's personal schedule view)
 * @param {Array} schedules - Array of schedule objects for a specific coach
 * @param {Array} clients - Array of client objects
 * @returns {Object} Grouped by timeSlot with client arrays
 */
export const groupCoachSchedulesByTimeSlot = (schedules, clients) => {
  const grouped = {};
  
  // Initialize with ordered time slots
  TIME_SLOTS.forEach(slot => {
    grouped[slot.id] = [];
  });
  
  // Group client schedules by time slot
  schedules.forEach(schedule => {
    const client = clients.find(c => c.id === schedule.clientId);
    if (client) {
      grouped[schedule.timeSlot].push({
        ...client,
        scheduleId: schedule.id
      });
    }
  });
  
  return grouped;
};

/**
 * Get ordered schedule for a coach's personal view
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
 * Get weekly schedule for a client with proper time ordering
 * @param {Array} weeklyScheduleData - Array of daily schedule data
 * @param {Array} coaches - Array of coach objects
 * @returns {Array} Weekly schedule with properly ordered time slots
 */
export const getOrderedWeeklySchedule = (weeklyScheduleData, coaches) => {
  return weeklyScheduleData.map(day => ({
    ...day,
    timeSlotGroups: TIME_SLOTS.map(slot => {
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
  }));
};

/**
 * Sort time slots properly for any schedule display
 * @param {Array} scheduleItems - Array of items with timeSlot property
 * @returns {Array} Sorted array in proper time order
 */
export const sortByTimeSlot = (scheduleItems) => {
  const timeSlotOrder = TIME_SLOTS.map(slot => slot.id);
  
  return scheduleItems.sort((a, b) => {
    const aIndex = timeSlotOrder.indexOf(a.timeSlot);
    const bIndex = timeSlotOrder.indexOf(b.timeSlot);
    return aIndex - bIndex;
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