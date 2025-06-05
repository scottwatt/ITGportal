// src/components/grace/GraceClientDashboard.jsx
// Special dashboard for Grace program clients AND coaches

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, TrendingUp, Star } from 'lucide-react';
import { getPSTDate, formatDatePST } from '../../utils/dateUtils';
import { USER_ROLES } from '../../utils/constants';
import { 
  getGraceEventsForDate, 
  getGraceEventsForCurrentWeek,
  formatEventTime,
  formatEventDate,
  isCalendarAPIReady,
  initializeCalendarAPI
} from '../../services/googleCalendar/calendarService';

const GraceClientDashboard = ({ userProfile, clients, graceAttendanceActions }) => {
  const [todaysEvents, setTodaysEvents] = useState([]);
  const [weekEvents, setWeekEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({});
  
  const today = getPSTDate();
  
  // FIXED: Determine if this is a Grace coach or Grace client
  const isGraceCoach = userProfile?.role === USER_ROLES.COACH && userProfile?.coachType === 'grace';
  const isGraceClient = userProfile?.role === USER_ROLES.CLIENT;
  
  // FIXED: Find the current Grace client's data (only if this is a client)
  const clientData = isGraceClient ? 
    clients.find(c => c.email === userProfile.email && c.program === 'grace') : 
    null;
  
  // Get all Grace clients (for coach view or if client data not found)
  const graceClients = clients.filter(c => c.program === 'grace');
  
  useEffect(() => {
    initializeGraceData();
  }, []);

  const initializeGraceData = async () => {
    setLoading(true);
    
    try {
      // Initialize Google Calendar API if needed
      if (!isCalendarAPIReady()) {
        console.log('Initializing Google Calendar API...');
        const initialized = await initializeCalendarAPI();
        if (!initialized) {
          throw new Error('Failed to initialize Google Calendar API');
        }
      }
      
      // Load today's events and weekly events
      await Promise.all([
        loadTodaysEvents(),
        loadWeekEvents(),
        loadAttendanceStats()
      ]);
      
    } catch (err) {
      console.error('Error initializing Grace dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysEvents = async () => {
    try {
      const events = await getGraceEventsForDate(today);
      setTodaysEvents(events);
      console.log('Loaded today\'s Grace events:', events);
    } catch (err) {
      console.error('Error loading today\'s events:', err);
    }
  };

  const loadWeekEvents = async () => {
    try {
      const events = await getGraceEventsForCurrentWeek();
      setWeekEvents(events);
      console.log('Loaded week\'s Grace events:', events);
    } catch (err) {
      console.error('Error loading week events:', err);
    }
  };

  const loadAttendanceStats = async () => {
    // Only load client-specific stats if this is a client
    if (!isGraceClient || !clientData || !graceAttendanceActions) return;
    
    try {
      // Get last 30 days of attendance for this specific client
      const endDate = today;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const summary = await graceAttendanceActions.getClientSummary(clientData.id, startDateStr, endDate);
      setAttendanceStats(summary);
    } catch (err) {
      console.error('Error loading attendance stats:', err);
    }
  };

  // FIXED: Show appropriate message if no access
  if (!isGraceCoach && !clientData && isGraceClient) {
    return (
      <div className="text-center py-8">
        <div className="bg-[#F5F5F5] p-6 rounded-lg max-w-md mx-auto">
          <Users size={48} className="mx-auto mb-4 text-[#9B97A2]" />
          <h3 className="text-lg font-semibold text-[#292929] mb-2">Welcome to Grace Program</h3>
          <p className="text-[#707070]">Your Grace program profile is being set up. Please contact your coach if you need assistance.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5A4E69] mx-auto"></div>
          <p className="mt-4 text-[#707070]">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Schedule</h3>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={initializeGraceData}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // FIXED: Get the appropriate display name
  const displayName = isGraceCoach ? 
    (userProfile?.name || 'Coach') : 
    (clientData?.name || userProfile?.name || 'Participant');

  return (
    <div className="space-y-6">
      {/* FIXED: Header with appropriate welcome message */}
      {!isGraceCoach && (
        <div className="bg-gradient-to-r from-[#5A4E69] to-[#292929] text-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">Welcome to Grace Program, {displayName}!</h2>
          <p className="text-[#BED2D8]">Your enrichment activities and community engagement</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#707070]">Today's Activities</p>
              <p className="text-3xl font-bold text-[#5A4E69]">{todaysEvents.length}</p>
            </div>
            <Calendar className="text-[#5A4E69]" size={40} />
          </div>
          <p className="text-sm text-[#9B97A2] mt-2">
            {formatDatePST(today)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#707070]">This Week</p>
              <p className="text-3xl font-bold text-[#5A4E69]">{weekEvents.length}</p>
            </div>
            <Clock className="text-[#5A4E69]" size={40} />
          </div>
          <p className="text-sm text-[#9B97A2] mt-2">
            Total activities scheduled
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#707070]">
                {isGraceCoach ? 'Grace Participants' : 'Attendance Rate'}
              </p>
              <p className="text-3xl font-bold text-[#5A4E69]">
                {isGraceCoach ? graceClients.length : (attendanceStats.attendanceRate || 0) + '%'}
              </p>
            </div>
            {isGraceCoach ? (
              <Users className="text-[#5A4E69]" size={40} />
            ) : (
              <TrendingUp className="text-[#5A4E69]" size={40} />
            )}
          </div>
          <p className="text-sm text-[#9B97A2] mt-2">
            {isGraceCoach ? 'Active in program' : 'Last 30 days'}
          </p>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
          <Calendar className="mr-2 text-[#5A4E69]" size={20} />
          Today's Schedule - {formatDatePST(today)}
        </h3>
        
        {todaysEvents.length > 0 ? (
          <div className="space-y-4">
            {todaysEvents.map(event => (
              <div key={event.id} className="bg-[#F5F5F5] p-4 rounded-lg border-l-4 border-[#5A4E69]">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#292929] text-lg">{event.title}</h4>
                    {event.description && (
                      <p className="text-[#707070] mt-1">{event.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-sm text-[#9B97A2]">
                      {!event.isAllDay && (
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>
                            {formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
                          </span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin size={14} />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {event.isAllDay && (
                    <span className="bg-[#BED2D8] text-[#292929] px-2 py-1 rounded text-sm">
                      All Day
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#9B97A2]">
            <Calendar size={48} className="mx-auto mb-2 text-[#9B97A2]" />
            <p className="text-lg font-medium">No activities scheduled for today</p>
            <p className="text-sm">Check your weekly schedule for upcoming activities</p>
          </div>
        )}
      </div>

      {/* FIXED: Show different sections based on user type */}
      {isGraceClient && attendanceStats.totalDays > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
            <Star className="mr-2 text-[#5A4E69]" size={20} />
            Your Progress
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#BED2D8] p-4 rounded-lg">
              <h4 className="font-semibold text-[#292929] mb-2">Attendance Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Days:</span>
                  <span className="font-medium">{attendanceStats.totalDays}</span>
                </div>
                <div className="flex justify-between">
                  <span>Present:</span>
                  <span className="font-medium text-green-600">{attendanceStats.presentDays}</span>
                </div>
                <div className="flex justify-between">
                  <span>Attendance Rate:</span>
                  <span className="font-medium text-[#5A4E69]">{attendanceStats.attendanceRate}%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-[#BED2D8] p-4 rounded-lg">
              <h4 className="font-semibold text-[#292929] mb-2">Keep It Up!</h4>
              <p className="text-sm text-[#707070]">
                {attendanceStats.attendanceRate >= 90 
                  ? "Excellent attendance! You're doing great in the Grace program." 
                  : attendanceStats.attendanceRate >= 75
                  ? "Good attendance! Keep participating in activities."
                  : "We'd love to see you more often! Check your schedule for upcoming activities."
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FIXED: Show Grace participants overview for coaches */}
      {isGraceCoach && graceClients.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
            <Users className="mr-2 text-[#5A4E69]" size={20} />
            Grace Participants Overview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {graceClients.slice(0, 6).map(client => (
              <div key={client.id} className="bg-[#BED2D8] p-3 rounded-lg">
                <h4 className="font-semibold text-[#292929]">{client.name}</h4>
                <p className="text-sm text-[#707070]">Grace Participant</p>
              </div>
            ))}
            {graceClients.length > 6 && (
              <div className="bg-[#F5F5F5] p-3 rounded-lg flex items-center justify-center">
                <span className="text-[#707070]">+{graceClients.length - 6} more</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-[#292929]">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-[#5A4E69] text-white p-4 rounded-lg hover:bg-[#292929] transition-colors">
            <Calendar className="mx-auto mb-2" size={24} />
            <span className="block text-sm">View Full Schedule</span>
          </button>
          <button className="bg-[#5A4E69] text-white p-4 rounded-lg hover:bg-[#292929] transition-colors">
            <Users className="mx-auto mb-2" size={24} />
            <span className="block text-sm">
              {isGraceCoach ? 'Manage Participants' : 'Community Activities'}
            </span>
          </button>
          <button className="bg-[#5A4E69] text-white p-4 rounded-lg hover:bg-[#292929] transition-colors">
            <Star className="mx-auto mb-2" size={24} />
            <span className="block text-sm">
              {isGraceCoach ? 'Attendance Reports' : 'My Achievements'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GraceClientDashboard