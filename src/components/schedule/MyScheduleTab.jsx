// src/components/schedule/MyScheduleTab.jsx - FIXED: Admin and coordinator access
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Star } from 'lucide-react';
import { getPSTDate, formatDatePST, getWeekDatesStartingMonday, formatDateForInput } from '../../utils/dateUtils';
import { getOrderedCoachSchedule, getOrderedTimeSlots } from '../../utils/scheduleHelpers';
import { TIME_SLOTS, getAllTimeSlots, USER_ROLES } from '../../utils/constants'; // Added USER_ROLES

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

  // Get all time slots (core + special) for proper lookup
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
    const coreSlots = ['8-10', '10-12', '1230-230'];
    return !coreSlots.includes(timeSlotId);
  };

  // FIXED: Helper function to check if user has admin/coordinator access
  const hasAdminAccess = () => {
    if (!userProfile?.role) return false;
    
    const adminRoles = [
      USER_ROLES.ADMIN,
      USER_ROLES.SCHEDULER,
      USER_ROLES.MERCHANDISE_COORDINATOR,        // Kameron
      USER_ROLES.PROGRAM_ADMIN_COORDINATOR,      // Josh  
      USER_ROLES.ADMIN_DEV_COORDINATOR,          // Connie
      USER_ROLES.VOCATIONAL_DEV_COORDINATOR,     // Scott
      USER_ROLES.EXECUTIVE_DIRECTOR,
      USER_ROLES.DIRECTOR_ORG_DEV,
      USER_ROLES.DIRECTOR_PROGRAM_DEV
    ];
    
    return adminRoles.includes(userProfile.role);
  };
  
  // FIXED: Updated to include all coordinator roles
  const getMySchedule = () => {
    return hasAdminAccess()
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

    // FIXED: Check for admin access instead of just 'admin' role
    if (hasAdminAccess()) {
      // For admin/coordinators, show all schedules for the week
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

  // UPDATED: Get total weekly stats with role-based title
  const weeklyStats = {
    totalSessions: weeklySchedule.reduce((sum, day) => sum + day.schedules.length, 0),
    uniqueClients: [...new Set(weeklySchedule.flatMap(day => day.schedules.map(s => s.clientId)))].length,
    busiest: weeklySchedule.reduce((max, day) => 
      day.schedules.length > max.count ? { day: day.dayName, count: day.schedules.length } : max, 
      { day: '', count: 0 }
    ),
    specialSessions: weeklySchedule.reduce((sum, day) => 
      sum + day.schedules.filter(s => isSpecialTimeSlot(s.timeSlot)).length, 0
    )
  };

  // Daily View Component
  const renderDailyView = () => {
    // Separate core and special schedules
    const coreSchedules = mySchedule.filter(s => !isSpecialTimeSlot(s.timeSlot));
    const specialSchedules = mySchedule.filter(s => isSpecialTimeSlot(s.timeSlot));
    const orderedCoreSchedule = getOrderedCoachSchedule(coreSchedules, clients);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-[#292929]">
            {/* UPDATED: Show different title based on access level */}
            {hasAdminAccess() ? 'All Schedules' : 'My Schedule'} - {formatDatePST(selectedDate)}
          </h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
          />
        </div>

        {/* Admin View Enhancement */}
        {hasAdminAccess() && mySchedule.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex items-center space-x-2">
              <User className="text-blue-500" size={16} />
              <h4 className="font-semibold text-blue-700">
                Admin/Coordinator View: Showing All {mySchedule.length} Session{mySchedule.length !== 1 ? 's' : ''}
              </h4>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              You can see all coach schedules and client assignments for this date.
            </p>
          </div>
        )}

        {/* Special Schedules Alert */}
        {specialSchedules.length > 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
            <div className="flex items-center space-x-2">
              <Star className="text-orange-500" size={16} />
              <h4 className="font-semibold text-orange-700">
                {specialSchedules.length} Special Schedule{specialSchedules.length !== 1 ? 's' : ''} Today
              </h4>
            </div>
            <div className="mt-2 space-y-1">
              {specialSchedules.map(schedule => {
                const client = clients.find(c => c.id === schedule.clientId);
                const coach = coaches.find(c => c.uid === schedule.coachId || c.id === schedule.coachId);
                const timeSlotInfo = getTimeSlotInfo(schedule.timeSlot);
                return (
                  <div key={schedule.id} className="text-sm text-orange-800">
                    • {timeSlotInfo.label || timeSlotInfo.id}: {client?.name || 'Unknown Client'}
                    {/* Show coach name for admin view */}
                    {hasAdminAccess() && coach && (
                      <span className="text-orange-600"> (with {coach.name})</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Core Schedule Grid */}
        {orderedCoreSchedule.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {orderedCoreSchedule.map(timeSlot => (
              <div key={timeSlot.id} className="border rounded-lg p-4 bg-white shadow-md">
                <h4 className="font-semibold text-lg mb-2 text-[#292929]">{timeSlot.label}</h4>
                <div className="space-y-2">
                  {timeSlot.clients.length > 0 ? (
                    timeSlot.clients.map(client => {
                      // ENHANCED: For admin view, show coach information
                      const schedule = mySchedule.find(s => s.clientId === client.id && s.timeSlot === timeSlot.id);
                      const coach = coaches.find(c => c.uid === schedule?.coachId || c.id === schedule?.coachId);
                      
                      return (
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
                          {/* ENHANCED: Show coach name for admin view */}
                          {hasAdminAccess() && coach && (
                            <p className="text-xs text-[#5A4E69] mt-1 font-medium">
                              Coach: {coach.name}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[#9B97A2] italic">No sessions assigned</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : specialSchedules.length === 0 ? (
          <div className="text-center py-12 text-[#9B97A2] bg-white rounded-lg shadow-md">
            <Clock size={48} className="mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No Sessions Scheduled</h4>
            <p>
              {hasAdminAccess() 
                ? "No client sessions are scheduled for this date across all coaches."
                : "You don't have any client sessions scheduled for this date."
              }
            </p>
          </div>
        ) : (
          <div className="text-center py-6 text-[#9B97A2] bg-white rounded-lg shadow-md">
            <p>All sessions today are special schedules (shown above)</p>
          </div>
        )}
      </div>
    );
  };

  // Weekly View Component  
  const renderWeeklyView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-[#292929]">
          {/* UPDATED: Show different title based on access level */}
          {hasAdminAccess() ? 'All Schedules - Weekly Overview' : 'Weekly Schedule Overview'}
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

      {/* ENHANCED: Weekly Stats with admin context */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#6D858E]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[#707070] text-sm">
                {hasAdminAccess() ? 'Total Sessions (All)' : 'Total Sessions'}
              </p>
              <p className="text-2xl font-bold text-[#6D858E]">{weeklyStats.totalSessions}</p>
            </div>
            <Calendar className="text-[#6D858E]" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#5A4E69]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[#707070] text-sm">
                {hasAdminAccess() ? 'Unique Clients (All)' : 'Unique Clients'}
              </p>
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

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-orange-400">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[#707070] text-sm">Special Schedules</p>
              <p className="text-2xl font-bold text-orange-500">{weeklyStats.specialSessions}</p>
            </div>
            <Star className="text-orange-500" size={24} />
          </div>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-7 gap-0 bg-[#F5F5F5]">
          {weeklySchedule.map(day => {
            const specialCount = day.schedules.filter(s => isSpecialTimeSlot(s.timeSlot)).length;
            return (
              <div key={day.date} className="text-center font-semibold p-4 text-[#292929] border-r border-gray-200 last:border-r-0">
                <div className="text-sm">{day.dayName}</div>
                <div className="text-lg">{day.dayNumber}</div>
                {specialCount > 0 && (
                  <div className="flex items-center justify-center space-x-1 text-xs text-orange-600 mt-1">
                    <Star size={10} />
                    <span>{specialCount}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Time Slots - Only show core slots in grid */}
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
                        const coach = coaches.find(c => c.uid === session.coachId || c.id === session.coachId);
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
                            title={`${client?.name || 'Unknown Client'}${hasAdminAccess() && coach ? ` (${coach.name})` : ''}`}
                          >
                            {client?.name?.split(' ')[0] || 'Unknown'}
                            {/* Show coach initial for admin view */}
                            {hasAdminAccess() && coach && (
                              <span className="opacity-75"> ({coach.name.split(' ')[0]})</span>
                            )}
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
            {weeklySchedule.filter(day => day.schedules.length > 0).map(day => {
              const coreSchedules = day.schedules.filter(s => !isSpecialTimeSlot(s.timeSlot));
              const specialSchedules = day.schedules.filter(s => isSpecialTimeSlot(s.timeSlot));
              
              return (
                <div key={day.date} className="border rounded-lg p-4">
                  <h5 className="font-medium text-[#292929] mb-2">
                    {day.dayName}, {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
                      timeZone: 'America/Los_Angeles',
                      month: 'long',
                      day: 'numeric'
                    })} ({day.schedules.length} sessions)
                  </h5>
                  
                  {/* Core Sessions */}
                  {coreSchedules.length > 0 && (
                    <div className="mb-4">
                      <h6 className="text-sm font-medium text-[#292929] mb-2">Core Schedule:</h6>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {TIME_SLOTS.map(timeSlot => {
                          const sessionsForSlot = coreSchedules.filter(s => s.timeSlot === timeSlot.id);
                          if (sessionsForSlot.length === 0) return null;
                          
                          return (
                            <div key={timeSlot.id} className="bg-[#F5F5F5] p-3 rounded">
                              <div className="text-sm font-medium text-[#292929] mb-1">
                                {timeSlot.start}
                              </div>
                              <div className="space-y-1">
                                {sessionsForSlot.map(session => {
                                  const client = clients.find(c => c.id === session.clientId);
                                  const coach = coaches.find(c => c.uid === session.coachId || c.id === session.coachId);
                                  return (
                                    <div 
                                      key={session.id}
                                      className="text-sm text-[#6D858E] cursor-pointer hover:text-[#5A4E69] hover:underline"
                                      onClick={() => onClientSelect && onClientSelect(client)}
                                    >
                                      {client?.name}
                                      {/* Show coach name for admin view */}
                                      {hasAdminAccess() && coach && (
                                        <span className="text-[#707070] text-xs ml-1">({coach.name})</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Special Sessions */}
                  {specialSchedules.length > 0 && (
                    <div className="bg-orange-50 p-3 rounded border border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="text-orange-500" size={14} />
                        <h6 className="text-sm font-medium text-orange-700">
                          Special Schedules ({specialSchedules.length}):
                        </h6>
                      </div>
                      <div className="space-y-1">
                        {specialSchedules.map(session => {
                          const client = clients.find(c => c.id === session.clientId);
                          const coach = coaches.find(c => c.uid === session.coachId || c.id === session.coachId);
                          const timeSlotInfo = getTimeSlotInfo(session.timeSlot);
                          return (
                            <div 
                              key={session.id}
                              className="text-sm text-orange-800 cursor-pointer hover:text-orange-900 hover:underline"
                              onClick={() => onClientSelect && onClientSelect(client)}
                            >
                              • {timeSlotInfo.label || timeSlotInfo.id}: {client?.name}
                              {/* Show coach name for admin view */}
                              {hasAdminAccess() && coach && (
                                <span className="text-orange-600 text-xs ml-1">({coach.name})</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#292929]">
          {/* UPDATED: Show different title based on access level */}
          {hasAdminAccess() ? 'Schedule Overview' : 'My Schedule'}
        </h2>
        
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