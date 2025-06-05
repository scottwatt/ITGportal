// src/components/client/ClientScheduleView.jsx - Updated with proper time ordering
import React from 'react';
import { getWeekDatesStartingMonday } from '../../utils/dateUtils';
import { getOrderedWeeklySchedule } from '../../utils/scheduleHelpers';
import { TIME_SLOTS } from '../../utils/constants';

const ClientScheduleView = ({ userProfile, clients, schedules, coaches, timeSlots }) => {
  const clientData = clients.find(c => c.email === userProfile.email) || clients[0];
  
  if (!clientData) {
    return (
      <div className="text-center py-8">
        <p className="text-[#9B97A2]">No client data found. Please contact your coach.</p>
      </div>
    );
  }

  const getMyWeeklySchedule = () => {
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
  
  // UPDATED: Get properly ordered weekly schedule
  const orderedWeeklySchedule = getOrderedWeeklySchedule(weeklySchedule, coaches);

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
                    timeSlotGroup.sessions.map(session => (
                      <div key={session.id} className="bg-[#BED2D8] p-2 rounded text-xs">
                        <p className="font-medium text-[#292929]">{timeSlotGroup.start}</p>
                        <p className="text-[#6D858E]">{session.coach?.name || 'No Coach Assigned'}</p>
                      </div>
                    ))
                  ))
                ) : (
                  <p className="text-[#9B97A2] text-xs text-center py-2">No sessions</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* UPDATED: Session Details with proper ordering */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-[#292929]">Session Details</h3>
        <div className="space-y-4">
          {orderedWeeklySchedule.flatMap(day => 
            day.timeSlotGroups ? day.timeSlotGroups.flatMap(timeSlotGroup =>
              timeSlotGroup.sessions.map(session => {
                const timeSlotInfo = TIME_SLOTS.find(ts => ts.id === session.timeSlot);
                
                return (
                  <div key={session.id} className="border rounded-lg p-4 hover:bg-[#F5F5F5]">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg text-[#292929]">
                          {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { 
                            timeZone: 'America/Los_Angeles',
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h4>
                        <p className="text-[#6D858E]">{timeSlotInfo?.label || 'Time TBD'}</p>
                        <p className="text-[#707070]">Coach: {session.coach?.name || 'No Coach Assigned'}</p>
                      </div>
                      <div className="text-right">
                        <span className="bg-[#BED2D8] text-[#292929] px-2 py-1 rounded text-sm">
                          Scheduled
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-[#707070]">
                      <p>Focus: Continue working on your current business goals</p>
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