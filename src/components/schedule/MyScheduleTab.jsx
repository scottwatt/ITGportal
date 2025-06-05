// src/components/schedule/MyScheduleTab.jsx - Updated with weekly overview
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User } from 'lucide-react';
import { getPSTDate, formatDatePST, getWeekDatesStartingMonday, formatDateForInput } from '../../utils/dateUtils';
import { getOrderedCoachSchedule, getOrderedTimeSlots } from '../../utils/scheduleHelpers';
import { TIME_SLOTS } from '../../utils/constants';

const MyScheduleTab = ({ 
  user,
  userProfile,
  clients,
  coaches,
  schedules,
  timeSlots,
  onClientSelect,
  scheduleActions 
}) => {
  const [activeView, setActiveView] = useState('daily'); // 'daily', 'weekly'
  const [selectedDate, setSelectedDate] = useState(getPSTDate());
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Initialize with current date in Pacific timezone
    const today = new Date();
    return new Date(today.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  });
  
  const getMySchedule = () => {
    return userProfile?.role === 'admin' 
      ? schedules.filter(s => s.date === selectedDate)
      : scheduleActions.getTodaysScheduleForCoach(user.uid, selectedDate);
  };

  const getWeeklySchedule = () => {
    // Get week dates based on currentWeek state for navigation
    const getWeekDatesFromCurrentWeek = () => {
      const startOfWeek = new Date(currentWeek);
      const currentDay = startOfWeek.getDay();
      let daysSinceMonday;
      
      if (currentDay === 0) {
        daysSinceMonday = 6; // Sunday = 6 days since Monday
      } else {
        daysSinceMonday = currentDay - 1; // Monday = 0 days since Monday
      }
      
      const monday = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() - daysSinceMonday);
      
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
        weekDates.push(date);
      }
      
      return weekDates;
    };

    const weekDates = getWeekDatesFromCurrentWeek();

    if (userProfile?.role === 'admin') {
      // For admin, show all schedules for the week
      return weekDates.map(date => {
        const dateStr = formatDateForInput(date);
        const daySchedules = schedules.filter(s => s.date === dateStr);
        return {
          date: dateStr,
          dayName: date.toLocaleDateString('en-US', { 
            timeZone: 'America/Los_Angeles',
            weekday: 'long' 
          }),
          dayNumber: date.getDate(),
          schedules: daySchedules
        };
      });
    } else {
      // For coaches, show only their schedules
      return weekDates.map(date => {
        const dateStr = formatDateForInput(date);
        const daySchedules = scheduleActions.getTodaysScheduleForCoach(user.uid, dateStr);
        return {
          date: dateStr,
          dayName: date.toLocaleDateString('en-US', { 
            timeZone: 'America/Los_Angeles',
            weekday: 'long' 
          }),
          dayNumber: date.getDate(),
          schedules: daySchedules
        };
      });
    }
  };

  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  const mySchedule = getMySchedule();
  const weeklySchedule = getWeeklySchedule();
  
  // Get properly ordered and grouped schedule for daily view
  const orderedSchedule = getOrderedCoachSchedule(mySchedule, clients);

  // Get total weekly stats
  const weeklyStats = {
    totalSessions: weeklySchedule.reduce((sum, day) => sum + day.schedules.length, 0),
    uniqueClients: [...new Set(weeklySchedule.flatMap(day => day.schedules.map(s => s.clientId)))].length,
    busiest: weeklySchedule.reduce((max, day) => 
      day.schedules.length > max.count ? { day: day.dayName, count: day.schedules.length } : max, 
      { day: '', count: 0 }
    )
  };

  // Daily View Component
  const renderDailyView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-[#292929]">
          Daily Schedule - {formatDatePST(selectedDate)}
        </h3>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
        />
      </div>
      
      {orderedSchedule.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {orderedSchedule.map(timeSlot => (
            <div key={timeSlot.id} className="border rounded-lg p-4 bg-white shadow-md">
              <h4 className="font-semibold text-lg mb-2 text-[#292929]">{timeSlot.label}</h4>
              <div className="space-y-2">
                {timeSlot.clients.length > 0 ? (
                  timeSlot.clients.map(client => (
                    <div key={client.id} className="bg-[#BED2D8] p-3 rounded text-sm">
                      <p 
                        className="text-[#6D858E] cursor-pointer hover:text-[#5A4E69] hover:underline font-medium"
                        onClick={() => onClientSelect && onClientSelect(client)}
                        title="Click to view client details"
                      >
                        {client.name}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <p 
                          className="text-xs text-[#707070] cursor-pointer hover:text-[#292929] hover:underline"
                          onClick={() => onClientSelect && onClientSelect(client)}
                          title="Click to view client details"
                        >
                          {client.program === 'limitless' ? client.businessName :
                           client.program === 'new-options' ? 'Community Job' :
                           client.program === 'bridges' ? 'Career Dev' :
                           client.businessName}
                        </p>
                        <span className={`text-xs px-1 rounded ${
                          client.program === 'limitless' ? 'bg-white text-[#6D858E]' :
                          client.program === 'new-options' ? 'bg-white text-[#6D858E]' :
                          client.program === 'bridges' ? 'bg-white text-[#5A4E69]' :
                          'bg-white text-[#9B97A2]'
                        }`}>
                          {client.program === 'limitless' ? 'L' :
                           client.program === 'new-options' ? 'NO' :
                           client.program === 'bridges' ? 'B' :
                           'L'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[#9B97A2] italic">No sessions assigned</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-[#9B97A2] bg-white rounded-lg shadow-md">
          <Clock size={48} className="mx-auto mb-4" />
          <h4 className="text-lg font-medium mb-2">No Sessions Scheduled</h4>
          <p>You don't have any client sessions scheduled for this date.</p>
        </div>
      )}
    </div>
  );

  // Weekly View Component
  const renderWeeklyView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-[#292929]">
          Weekly Schedule Overview
        </h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 text-[#6D858E] hover:bg-[#BED2D8] rounded transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-[#292929] min-w-[120px] text-center">
            Week of {formatDatePST(formatDateForInput(weeklySchedule[0] ? new Date(weeklySchedule[0].date + 'T12:00:00') : new Date()))}
          </span>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 text-[#6D858E] hover:bg-[#BED2D8] rounded transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#6D858E]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[#707070] text-sm">Total Sessions</p>
              <p className="text-2xl font-bold text-[#6D858E]">{weeklyStats.totalSessions}</p>
            </div>
            <Calendar className="text-[#6D858E]" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#5A4E69]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[#707070] text-sm">Unique Clients</p>
              <p className="text-2xl font-bold text-[#5A4E69]">{weeklyStats.uniqueClients}</p>
            </div>
            <User className="text-[#5A4E69]" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#9B97A2]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[#707070] text-sm">Busiest Day</p>
              <p className="text-lg font-bold text-[#9B97A2]">
                {weeklyStats.busiest.count > 0 ? weeklyStats.busiest.day : 'None'}
              </p>
              <p className="text-xs text-[#9B97A2]">
                {weeklyStats.busiest.count > 0 ? `${weeklyStats.busiest.count} sessions` : 'No sessions'}
              </p>
            </div>
            <Clock className="text-[#9B97A2]" size={24} />
          </div>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-7 gap-0 bg-[#F5F5F5]">
          {weeklySchedule.map(day => (
            <div key={day.date} className="text-center font-semibold p-4 text-[#292929] border-r border-gray-200 last:border-r-0">
              <div className="text-sm">{day.dayName}</div>
              <div className="text-lg">{day.dayNumber}</div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        {TIME_SLOTS.map(timeSlot => (
          <div key={timeSlot.id} className="border-b border-gray-200 last:border-b-0">
            <div className="grid grid-cols-7 gap-0">
              {weeklySchedule.map(day => {
                const sessionsForSlot = day.schedules.filter(s => s.timeSlot === timeSlot.id);
                const isToday = day.date === getPSTDate();
                
                return (
                  <div 
                    key={`${day.date}-${timeSlot.id}`} 
                    className={`min-h-24 border-r border-gray-200 last:border-r-0 p-2 ${
                      isToday ? 'bg-[#BED2D8]' : 'hover:bg-[#F5F5F5]'
                    }`}
                    onClick={() => {
                      setSelectedDate(day.date);
                      setActiveView('daily');
                    }}
                    style={{ cursor: 'pointer' }}
                    title={`View details for ${day.dayName}`}
                  >
                    {/* Time slot label only on first column */}
                    {day === weeklySchedule[0] && (
                      <div className="text-xs text-[#707070] font-medium mb-1">
                        {timeSlot.start}
                      </div>
                    )}
                    
                    {/* Client sessions */}
                    <div className="space-y-1">
                      {sessionsForSlot.slice(0, 2).map(session => {
                        const client = clients.find(c => c.id === session.clientId);
                        return (
                          <div 
                            key={session.id} 
                            className="text-xs bg-[#6D858E] text-white px-1 py-0.5 rounded truncate"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onClientSelect && client) {
                                onClientSelect(client);
                              }
                            }}
                            title={client?.name || 'Unknown Client'}
                          >
                            {client?.name?.split(' ')[0] || 'Unknown'}
                          </div>
                        );
                      })}
                      {sessionsForSlot.length > 2 && (
                        <div className="text-xs text-[#9B97A2]">+{sessionsForSlot.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Session Details */}
      {weeklyStats.totalSessions > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold mb-4 text-[#292929]">This Week's Sessions</h4>
          <div className="space-y-4">
            {weeklySchedule.filter(day => day.schedules.length > 0).map(day => (
              <div key={day.date} className="border rounded-lg p-4">
                <h5 className="font-medium text-[#292929] mb-2">
                  {day.dayName}, {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
                    timeZone: 'America/Los_Angeles',
                    month: 'long',
                    day: 'numeric'
                  })} ({day.schedules.length} sessions)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {TIME_SLOTS.map(timeSlot => {
                    const sessionsForSlot = day.schedules.filter(s => s.timeSlot === timeSlot.id);
                    if (sessionsForSlot.length === 0) return null;
                    
                    return (
                      <div key={timeSlot.id} className="bg-[#F5F5F5] p-3 rounded">
                        <div className="text-sm font-medium text-[#292929] mb-1">
                          {timeSlot.start}
                        </div>
                        <div className="space-y-1">
                          {sessionsForSlot.map(session => {
                            const client = clients.find(c => c.id === session.clientId);
                            return (
                              <div 
                                key={session.id}
                                className="text-sm text-[#6D858E] cursor-pointer hover:text-[#5A4E69] hover:underline"
                                onClick={() => onClientSelect && onClientSelect(client)}
                              >
                                {client?.name}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#292929]">My Schedule</h2>
        
        {/* View Toggle */}
        <div className="flex space-x-1 bg-[#F5F5F5] rounded-lg p-1">
          <button
            onClick={() => setActiveView('daily')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'daily' 
                ? 'bg-white text-[#6D858E] shadow-sm' 
                : 'text-[#707070] hover:text-[#292929]'
            }`}
          >
            Daily View
          </button>
          <button
            onClick={() => setActiveView('weekly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'weekly' 
                ? 'bg-white text-[#6D858E] shadow-sm' 
                : 'text-[#707070] hover:text-[#292929]'
            }`}
          >
            Weekly Overview
          </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {activeView === 'daily' ? renderDailyView() : renderWeeklyView()}
      </div>
    </div>
  );
};

export default MyScheduleTab;