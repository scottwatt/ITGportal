// src/services/googleCalendar/calendarService.js
// Google Calendar integration for Grace program

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

// You'll need to set these in your environment or config
const CALENDAR_ID = process.env.REACT_APP_GRACE_CALENDAR_ID || 'your-grace-calendar-id@gmail.com';
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_CALENDAR_API_KEY || 'your-api-key';

/**
 * Initialize Google Calendar API
 * This should be called once when the app loads
 */
export const initializeCalendarAPI = async () => {
  try {
    // Load Google API script if not already loaded
    if (!window.gapi) {
      await loadGoogleAPIScript();
    }
    
    // Initialize the API
    await new Promise((resolve) => {
      window.gapi.load('client', resolve);
    });
    
    await window.gapi.client.init({
      apiKey: GOOGLE_API_KEY,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
    });
    
    console.log('Google Calendar API initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Google Calendar API:', error);
    return false;
  }
};

/**
 * Load Google API script dynamically
 */
const loadGoogleAPIScript = () => {
  return new Promise((resolve, reject) => {
    if (window.gapi) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

/**
 * Get Grace events for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of calendar events
 */
export const getGraceEventsForDate = async (date) => {
  try {
    if (!window.gapi || !window.gapi.client) {
      console.warn('Google Calendar API not initialized');
      return [];
    }
    
    // Convert date to start and end of day in Pacific timezone
    const startDateTime = new Date(date + 'T00:00:00-07:00').toISOString();
    const endDateTime = new Date(date + 'T23:59:59-07:00').toISOString();
    
    const response = await window.gapi.client.calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: startDateTime,
      timeMax: endDateTime,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    const events = response.result.items || [];
    
    // Transform events to our format
    return events.map(event => ({
      id: event.id,
      title: event.summary || 'Grace Activity',
      description: event.description || '',
      startTime: event.start.dateTime || event.start.date,
      endTime: event.end.dateTime || event.end.date,
      location: event.location || '',
      isAllDay: !event.start.dateTime,
      attendees: event.attendees || [],
      status: event.status || 'confirmed',
      created: event.created,
      updated: event.updated,
      htmlLink: event.htmlLink
    }));
  } catch (error) {
    console.error('Error fetching Grace events for date:', error);
    return [];
  }
};

/**
 * Get Grace events for a date range (for monthly view)
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of calendar events
 */
export const getGraceEventsForDateRange = async (startDate, endDate) => {
  try {
    if (!window.gapi || !window.gapi.client) {
      console.warn('Google Calendar API not initialized');
      return [];
    }
    
    const startDateTime = new Date(startDate + 'T00:00:00-07:00').toISOString();
    const endDateTime = new Date(endDate + 'T23:59:59-07:00').toISOString();
    
    const response = await window.gapi.client.calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: startDateTime,
      timeMax: endDateTime,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250 // Adjust as needed
    });
    
    const events = response.result.items || [];
    
    return events.map(event => ({
      id: event.id,
      title: event.summary || 'Grace Activity',
      description: event.description || '',
      startTime: event.start.dateTime || event.start.date,
      endTime: event.end.dateTime || event.end.date,
      date: event.start.dateTime ? 
        event.start.dateTime.split('T')[0] : 
        event.start.date,
      location: event.location || '',
      isAllDay: !event.start.dateTime,
      attendees: event.attendees || [],
      status: event.status || 'confirmed',
      created: event.created,
      updated: event.updated,
      htmlLink: event.htmlLink
    }));
  } catch (error) {
    console.error('Error fetching Grace events for date range:', error);
    return [];
  }
};

/**
 * Get Grace events for current week
 * @returns {Promise<Array>} Array of calendar events
 */
export const getGraceEventsForCurrentWeek = async () => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Saturday
  
  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = endOfWeek.toISOString().split('T')[0];
  
  return await getGraceEventsForDateRange(startDate, endDate);
};

/**
 * Format time for display
 * @param {string} dateTimeString - ISO datetime string
 * @returns {string} Formatted time
 */
export const formatEventTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format date for display
 * @param {string} dateTimeString - ISO datetime string
 * @returns {string} Formatted date
 */
export const formatEventDate = (dateTimeString) => {
  if (!dateTimeString) return '';
  
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Check if calendar API is available
 * @returns {boolean} True if API is ready
 */
export const isCalendarAPIReady = () => {
  return !!(window.gapi && window.gapi.client && window.gapi.client.calendar);
};

/**
 * Get calendar info/settings
 * @returns {Promise<Object>} Calendar information
 */
export const getGraceCalendarInfo = async () => {
  try {
    if (!isCalendarAPIReady()) {
      throw new Error('Calendar API not ready');
    }
    
    const response = await window.gapi.client.calendar.calendars.get({
      calendarId: CALENDAR_ID
    });
    
    return {
      id: response.result.id,
      summary: response.result.summary,
      description: response.result.description,
      timeZone: response.result.timeZone,
      location: response.result.location
    };
  } catch (error) {
    console.error('Error getting calendar info:', error);
    return null;
  }
};