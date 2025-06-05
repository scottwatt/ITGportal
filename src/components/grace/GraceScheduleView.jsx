// src/components/grace/GraceScheduleView.jsx
// Schedule view for Grace clients showing Google Calendar events

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, ExternalLink, Users } from 'lucide-react';
import { getPSTDate, formatDatePST, getDaysInMonth } from '../../utils/dateUtils';
import { USER_ROLES } from '../../utils/constants';
import { 
  getGraceEventsForDate, 
  getGraceEventsForDateRange,
  formatEventTime,
  formatEventDate,
  isCalendarAPIReady,
  initializeCalendarAPI
} from '../../services/googleCalendar/calendarService';

const GraceScheduleView = ({ userProfile, clients }) => {
  const [activeView, setActiveView] = useState('daily'); // 'daily', 'monthly'
  const [selectedDate, setSelectedDate] = useState(getPSTDate());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [monthEvents, setMonthEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // FIXED: Check if user is Grace client OR Grace coach
  const clientData = clients.find(c => c.email === userProfile.email && c.program === 'grace');
  const isGraceCoach = userProfile?.role === USER_ROLES.COACH && userProfile?.coachType === 'grace';
  const hasAccess = clientData || isGraceCoach;

  useEffect(() => {
    if (activeView === 'daily') {
      loadDailyEvents();
    } else {
      loadMonthlyEvents();
    }
  }, [selectedDate, currentMonth, activeView]);

  useEffect(() => {
    initializeAPI();
  }, []);

  const initializeAPI = async () => {
    if (!isCalendarAPIReady()) {
      setLoading(true);
      try {
        await initializeCalendarAPI();
      } catch (err) {
        setError('Failed to connect to Grace calendar');
      } finally {
        setLoading(false);
      }
    }
  };

  const loadDailyEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dailyEvents = await getGraceEventsForDate(selectedDate);
      setEvents(dailyEvents);
    } catch (err) {
      setError('Failed to load schedule for this date');
      console.error('Error loading daily events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      const events = await getGraceEventsForDateRange(startDate, endDate);
      setMonthEvents(events);
    } catch (err) {
      setError('Failed to load monthly schedule');
      console.error('Error loading monthly events:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate + 'T12:00:00');
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const getEventsForDate = (date) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return monthEvents.filter(event => event.date === dateStr);
  };

  // Daily View Component
  const renderDailyView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-[#292929]">
          Grace Schedule - {formatDatePST(selectedDate)}
        </h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 text-[#5A4E69] hover:bg-[#BED2D8] rounded"
          >
            <ChevronLeft size={20} />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4E69]"
          />
          <button
            onClick={() => navigateDate(1)}
            className="p-2 text-[#5A4E69] hover:bg-[#BED2D8] rounded"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A4E69] mx-auto"></div>
          <p className="mt-2 text-[#707070]">Loading schedule...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={loadDailyEvents}
            className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-4">
          {events.map(event => (
            <div key={event.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#5A4E69]">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-[#292929] mb-2">{event.title}</h4>
                  
                  {event.description && (
                    <p className="text-[#707070] mb-3">{event.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[#9B97A2]">
                    {!event.isAllDay && (
                      <div className="flex items-center space-x-1">
                        <Clock size={16} />
                        <span>
                          {formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
                        </span>
                      </div>
                    )}
                    
                    {event.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin size={16} />
                        <span>{event.location}</span>
                      </div>
                    )}
                    
                    {event.attendees && event.attendees.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Users size={16} />
                        <span>{event.attendees.length} participants</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {event.isAllDay && (
                    <span className="bg-[#BED2D8] text-[#292929] px-2 py-1 rounded text-sm">
                      All Day
                    </span>
                  )}
                  
                  {event.htmlLink && (
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#5A4E69] hover:text-[#292929] p-1"
                      title="View in Google Calendar"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-[#9B97A2]">
          <Calendar size={64} className="mx-auto mb-4" />
          <h4 className="text-lg font-medium mb-2">No Activities Scheduled</h4>
          <p>There are no Grace activities scheduled for this date.</p>
        </div>
      )}
    </div>
  );

  // Monthly View Component
  const renderMonthlyView = () => {
    const days = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-[#292929]">
            Grace Monthly Schedule - {monthName}
          </h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 text-[#5A4E69] hover:bg-[#BED2D8] rounded"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 text-[#5A4E69] hover:bg-[#BED2D8] rounded"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A4E69] mx-auto"></div>
            <p className="mt-2 text-[#707070]">Loading monthly schedule...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={loadMonthlyEvents}
              className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-0 bg-[#F5F5F5]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold p-4 text-[#292929] border-r border-gray-200 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="h-24 border-r border-b border-gray-200"></div>;
                }

                const dayEvents = getEventsForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                const isSelected = day.toISOString().split('T')[0] === selectedDate;

                return (
                  <div
                    key={index}
                    className={`h-24 border-r border-b border-gray-200 p-1 cursor-pointer transition-colors ${
                      isToday ? 'bg-[#BED2D8]' : 
                      isSelected ? 'bg-[#F5F5F5]' : 
                      'hover:bg-[#F5F5F5]'
                    }`}
                    onClick={() => {
                      setSelectedDate(day.toISOString().split('T')[0]);
                      setActiveView('daily');
                    }}
                  >
                    <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-[#5A4E69]' : 'text-[#292929]'}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div key={event.id} className="text-xs bg-[#5A4E69] text-white px-1 py-0.5 rounded truncate">
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-[#9B97A2]">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // FIXED: Updated access check to include Grace coaches
  if (!hasAccess) {
    return (
      <div className="text-center py-8">
        <div className="bg-[#F5F5F5] p-6 rounded-lg max-w-md mx-auto">
          <Users size={48} className="mx-auto mb-4 text-[#9B97A2]" />
          <h3 className="text-lg font-semibold text-[#292929] mb-2">Grace Schedule Access</h3>
          <p className="text-[#707070]">Only Grace program participants and Grace coaches can view this schedule.</p>
          <div className="mt-4 text-sm text-[#9B97A2]">
            <p>Current user role: {userProfile?.role}</p>
            <p>Coach type: {userProfile?.coachType}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5A4E69] to-[#292929] text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Grace Program Schedule</h2>
        <p className="text-[#BED2D8]">
          {isGraceCoach ? 'Manage Grace enrichment activities and events' : 'Your enrichment activities and community events'}
        </p>
      </div>

      {/* View Tabs */}
      <div className="flex space-x-1 bg-[#F5F5F5] rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveView('daily')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'daily' 
              ? 'bg-white text-[#5A4E69] shadow-sm' 
              : 'text-[#707070] hover:text-[#292929]'
          }`}
        >
          Daily View
        </button>
        <button
          onClick={() => setActiveView('monthly')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'monthly' 
              ? 'bg-white text-[#5A4E69] shadow-sm' 
              : 'text-[#707070] hover:text-[#292929]'
          }`}
        >
          Monthly View
        </button>
      </div>

      {/* Content based on active view */}
      {activeView === 'daily' ? renderDailyView() : renderMonthlyView()}
    </div>
  );
};

export default GraceScheduleView;