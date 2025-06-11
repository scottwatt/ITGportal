// src/components/client/ClientScheduleView.jsx - FIXED: Handles special time slots
import React, { useState, useEffect } from 'react';
import { Star, Clock } from 'lucide-react';
import { getWeekDatesStartingMonday } from '../../utils/dateUtils';
import { getOrderedWeeklySchedule } from '../../utils/scheduleHelpers';
import { TIME_SLOTS, TIME_BLOCKS, getAllTimeSlots } from '../../utils/constants'; // Added getAllTimeSlots

const ClientScheduleView = ({ userProfile, clients, schedules, coaches, timeSlots, taskActions, tasks }) => {
  const [weeklyTasks, setWeeklyTasks] = useState({});
  const [loadingTasks, setLoadingTasks] = useState(false);

  const clientData = clients.find(c => c.email === userProfile.email) || clients[0];

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

  // Function to map 2-hour time slots to 30-minute task blocks
  const getTaskBlocksForTimeSlot = (timeSlotId) => {
    const blockMappings = {
      '8-10': ['800', '830', '900', '930'],
      '10-12': ['1000', '1030', '1100', '1130'], 
      '1230-230': ['1230', '1300', '1330', '1400'],
      // Add alternative formats in case the data uses different IDs
      'morning': ['800', '830', '900', '930'],
      'midmorning': ['1000', '1030', '1100', '1130'],
      'afternoon': ['1230', '1300', '1330', '1400'],
      // Special time slots - map to appropriate blocks
      '6-8': ['600', '630', '700', '730'],
      '7-9': ['700', '730', '800', '830'],
      '1400-1600': ['1400', '1430', '1500', '1530'],
      '1500-1700': ['1500', '1530', '1600', '1630']
    };
    
    return blockMappings[timeSlotId] || [];
  };

  const getMyWeeklySchedule = () => {
    if (!clientData) return [];
    
    const weekDates = getWeekDatesStartingMonday();
    
    return weekDates.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      
      const sessions = schedules.filter(s => 
        s.date === dateStr && s.clientId === clientData.id
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

  const weeklySchedule = getMyWeeklySchedule();
  const orderedWeeklySchedule = getOrderedWeeklySchedule(weeklySchedule, coaches);

  // Load tasks for the week - MOVED BEFORE EARLY RETURN
  useEffect(() => {
    const loadWeeklyTasks = async () => {
      if (!taskActions || !clientData) {
        return;
      }
      
      setLoadingTasks(true);
      try {
        const tasksData = {};
        
        for (const day of weeklySchedule) {
          if (day.sessions.length > 0) {
            const dayTasks = await taskActions.getTasksForClientDate(clientData.id, day.date);
            tasksData[day.date] = dayTasks;
          }
        }
        
        setWeeklyTasks(tasksData);
      } catch (error) {
        console.error('Error loading weekly tasks:', error);
      } finally {
        setLoadingTasks(false);
      }
    };

    loadWeeklyTasks();
  }, [weeklySchedule.length, clientData?.id, taskActions]);

  // Early return AFTER all hooks
  if (!clientData) {
    return (
      <div className="text-center py-8">
        <p className="text-[#9B97A2]">No client data found. Please contact your coach.</p>
      </div>
    );
  }

  // Get tasks for specific date and time blocks
  const getTasksForTimeSlot = (date, timeSlotId) => {
    // Try to get tasks from loaded weekly tasks first
    let dayTasks = weeklyTasks[date] || [];
    
    // If no tasks in weekly tasks, try to get from global tasks prop
    if (dayTasks.length === 0 && tasks && clientData) {
      dayTasks = tasks.filter(task => 
        task.date === date && task.clientId === clientData.id
      );
    }
    
    const timeBlocks = getTaskBlocksForTimeSlot(timeSlotId);
    
    return timeBlocks.map(blockId => {
      const task = dayTasks.find(t => t.timeBlock === blockId);
      
      return {
        blockId,
        task: task || null
      };
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#292929]">My Weekly Schedule</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-[#292929]">Your Coaching Sessions</h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {orderedWeeklySchedule.map((day, index) => (
            <div key={day.date} className="border rounded-lg p-3">
              <h4 className="font-semibold text-center mb-2 text-[#292929]">
                {day.dayName}
                <br />
                <span className="text-sm text-[#707070]">{day.dayNumber}</span>
              </h4>
              <div className="space-y-2">
                {day.timeSlotGroups && day.timeSlotGroups.length > 0 ? (
                  day.timeSlotGroups.map(timeSlotGroup => (
                    timeSlotGroup.sessions.map(session => {
                      const timeSlotInfo = getTimeSlotInfo(session.timeSlot);
                      const isSpecial = isSpecialTimeSlot(session.timeSlot);
                      
                      return (
                        <div 
                          key={session.id} 
                          className={`p-2 rounded text-xs ${
                            isSpecial 
                              ? 'bg-orange-100 border border-orange-300 text-orange-800' 
                              : 'bg-[#BED2D8] text-[#292929]'
                          }`}
                        >
                          <div className="flex items-center space-x-1 mb-1">
                            {isSpecial && <Star size={10} />}
                            <p className="font-medium">
                              {timeSlotInfo.label || timeSlotGroup.start}
                            </p>
                          </div>
                          <p className={isSpecial ? 'text-orange-700' : 'text-[#6D858E]'}>
                            {session.coach?.name || 'No Coach Assigned'}
                          </p>
                          {isSpecial && (
                            <p className="text-xs text-orange-600 mt-1">Special Schedule</p>
                          )}
                        </div>
                      );
                    })
                  ))
                ) : (
                  <p className="text-[#9B97A2] text-xs text-center py-2">No sessions</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Session Details with task breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-[#292929]">Session Details</h3>
        {loadingTasks && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6D858E] mx-auto"></div>
            <p className="text-sm text-[#707070] mt-2">Loading your tasks...</p>
          </div>
        )}
        
        <div className="space-y-4">
          {orderedWeeklySchedule.flatMap(day => 
            day.timeSlotGroups ? day.timeSlotGroups.flatMap(timeSlotGroup =>
              timeSlotGroup.sessions.map(session => {
                const timeSlotInfo = getTimeSlotInfo(session.timeSlot); // Use helper function
                const isSpecial = isSpecialTimeSlot(session.timeSlot);
                const taskBlocks = getTasksForTimeSlot(day.date, session.timeSlot);
                
                return (
                  <div 
                    key={session.id} 
                    className={`border rounded-lg p-4 hover:bg-[#F5F5F5] ${
                      isSpecial ? 'border-orange-300 bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg text-[#292929]">
                          {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { 
                            timeZone: 'America/Los_Angeles',
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {isSpecial && <Star className="text-orange-500" size={16} />}
                          <Clock className="text-[#6D858E]" size={16} />
                          <p className="text-[#6D858E]">
                            {timeSlotInfo?.label || timeSlotInfo?.start + ' - ' + timeSlotInfo?.end || 'Time TBD'}
                          </p>
                          {isSpecial && (
                            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                              Special Schedule
                            </span>
                          )}
                        </div>
                        <p className="text-[#707070]">Coach: {session.coach?.name || 'No Coach Assigned'}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-sm ${
                          isSpecial 
                            ? 'bg-orange-200 text-orange-800' 
                            : 'bg-[#BED2D8] text-[#292929]'
                        }`}>
                          Scheduled
                        </span>
                      </div>
                    </div>
                    
                    {/* Task breakdown for the session */}
                    <div className="bg-[#F5F5F5] p-4 rounded-lg">
                      <h5 className="font-medium text-[#292929] mb-3">Your Tasks for This Session:</h5>
                      
                      {taskBlocks.some(({ task }) => task) ? (
                        <div className="space-y-2">
                          {taskBlocks
                            .filter(({ task }) => task) // Only show blocks with actual tasks
                            .map(({ blockId, task }) => (
                            <div 
                              key={blockId} 
                              className="flex items-center justify-between p-3 bg-white rounded border border-[#6D858E] shadow-sm"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-[#292929]">• {task.title}</p>
                                {task.description && (
                                  <p className="text-xs text-[#707070] mt-1">{task.description}</p>
                                )}
                              </div>
                              <span className={`text-xs px-2 py-1 rounded ml-3 ${
                                task.completed 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {task.completed ? 'Done' : 'Pending'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-[#9B97A2]">
                          <p className="text-sm">No specific tasks scheduled for this session</p>
                          <p className="text-xs mt-1">Work with your coach on your current business goals</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : []
          )}
          
          {/* Show message if no sessions */}
          {orderedWeeklySchedule.every(day => !day.timeSlotGroups || day.timeSlotGroups.length === 0) && (
            <div className="text-center py-8 text-[#9B97A2]">
              <p className="text-lg font-medium">No sessions scheduled this week</p>
              <p className="text-sm">Contact your coach to schedule sessions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientScheduleView;