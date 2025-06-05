// src/utils/dateUtils.js

/**
 * Get current date in Pacific timezone (handles PST/PDT automatically)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getPSTDate = () => {
  // Use the proper Pacific timezone identifier
  const now = new Date();
  
  // This automatically handles PST/PDT transitions
  const pacificTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  
  // Format as YYYY-MM-DD
  const year = pacificTime.getFullYear();
  const month = String(pacificTime.getMonth() + 1).padStart(2, '0');
  const day = String(pacificTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Get current Pacific time with hours and minutes
 * @returns {Date} Date object in Pacific timezone
 */
export const getPacificTime = () => {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
};

/**
 * Format date string for display in Pacific timezone
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
export const formatDatePST = (dateString) => {
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('en-US', { 
    timeZone: 'America/Los_Angeles',
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

/**
 * Get week dates starting from Monday for current week in Pacific timezone
 * @returns {Array<Date>} Array of 7 dates starting from Monday
 */
export const getWeekDatesStartingMonday = () => {
  const pacificNow = getPacificTime();
  
  const currentDay = pacificNow.getDay();
  let daysSinceMonday;
  
  if (currentDay === 0) {
    daysSinceMonday = 6; // Sunday = 6 days since Monday
  } else {
    daysSinceMonday = currentDay - 1; // Monday = 0 days since Monday
  }
  
  const monday = new Date(pacificNow.getFullYear(), pacificNow.getMonth(), pacificNow.getDate() - daysSinceMonday);
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    weekDates.push(date);
  }
  
  return weekDates;
};

/**
 * Get days in month with proper calendar grid
 * @param {Date} date - Date object for the month
 * @returns {Array} Array of dates and null values for calendar grid
 */
export const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }
  
  return days;
};

/**
 * Check if date is today in Pacific timezone
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  const todayPacific = getPSTDate();
  const checkDate = typeof date === 'string' ? date : formatDateForInput(date);
  return checkDate === todayPacific;
};

/**
 * Get schedule for a date range
 * @param {Array} schedules - All schedules
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array} Filtered schedules
 */
export const getSchedulesInDateRange = (schedules, startDate, endDate) => {
  return schedules.filter(schedule => 
    schedule.date >= startDate && schedule.date <= endDate
  );
};

/**
 * Get weekly schedule for a client starting from a specific date
 * @param {Array} schedules - All schedules
 * @param {string} clientId - Client ID
 * @param {Date|string} startDate - Start date (defaults to Monday of current week)
 * @returns {Array} Weekly schedule data
 */
export const getWeeklyScheduleForClient = (schedules, clientId, startDate = null) => {
  const weekDates = startDate ? 
    getWeekDatesFromDate(startDate) : 
    getWeekDatesStartingMonday();
  
  return weekDates.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const sessions = schedules.filter(s => 
      s.date === dateStr && s.clientId === clientId
    );
    
    return {
      date: dateStr,
      dayName: date.toLocaleDateString('en-US', { 
        timeZone: 'America/Los_Angeles',
        weekday: 'long' 
      }),
      dayNumber: date.getDate(),
      sessions
    };
  });
};

/**
 * Get week dates starting from a specific date
 * @param {Date|string} startDate - Starting date
 * @returns {Array<Date>} Array of 7 dates
 */
export const getWeekDatesFromDate = (startDate) => {
  const date = typeof startDate === 'string' ? new Date(startDate + 'T12:00:00') : startDate;
  const weekDates = [];
  
  for (let i = 0; i < 7; i++) {
    const weekDate = new Date(date);
    weekDate.setDate(date.getDate() + i);
    weekDates.push(weekDate);
  }
  
  return weekDates;
};

/**
 * Format date for input[type="date"] value
 * @param {Date} date - Date object
 * @returns {string} Date in YYYY-MM-DD format
 */
export const formatDateForInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get current month name and year in Pacific timezone
 * @param {Date} date - Date object (defaults to current Pacific date)
 * @returns {string} Formatted month and year
 */
export const getMonthYearString = (date = null) => {
  const targetDate = date || getPacificTime();
  return targetDate.toLocaleString('en-US', { 
    timeZone: 'America/Los_Angeles',
    month: 'long', 
    year: 'numeric' 
  });
};

/**
 * Convert a date string to Pacific timezone for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Date formatted for Pacific timezone
 */
export const toPacificDateString = (dateString) => {
  const date = new Date(dateString + 'T12:00:00');
  const pacificDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  return formatDateForInput(pacificDate);
};

/**
 * Debug function to check current timezone info
 * @returns {Object} Timezone debugging info
 */
export const getTimezoneDebugInfo = () => {
  const now = new Date();
  const pacificTime = getPacificTime();
  const pstDate = getPSTDate();
  
  return {
    utcTime: now.toISOString(),
    pacificTime: pacificTime.toString(),
    pacificDateString: pstDate,
    utcOffset: now.getTimezoneOffset(),
    pacificOffset: pacificTime.getTimezoneOffset(),
    isDST: pacificTime.getTimezoneOffset() < -420, // Less than -7 hours means DST
    currentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
};