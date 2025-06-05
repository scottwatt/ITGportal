// src/components/schedule/MonthlyScheduleView.jsx - Updated with proper grouping and ordering
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { formatDatePST, getDaysInMonth } from '../../utils/dateUtils';
import { getOrderedGroupedSchedule } from '../../utils/scheduleHelpers';

const MonthlyScheduleView = ({ 
  schedules, 
  clients, 
  coaches, 
  timeSlots, 
  scheduleActions 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const getSchedulesForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.date === dateStr);
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#6D858E] to-[#5A4E69] text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Monthly Schedule Overview</h2>
        <p className="text-[#BED2D8]">Complete schedule view for all coaches and clients</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-[#292929]">{monthName}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="px-4 py-2 bg-[#9B97A2] text-white rounded hover:bg-[#707070]"
            >
              Previous
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="px-4 py-2 bg-[#9B97A2] text-white rounded hover:bg-[#707070]"
            >
              Next
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold p-2 bg-[#F5F5F5] rounded text-[#292929]">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="h-24"></div>;
            }

            const daySchedules = getSchedulesForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

            return (
              <div
                key={index}
                className={`h-24 border rounded p-1 cursor-pointer transition-colors ${
                  isToday ? 'border-[#6D858E] bg-[#BED2D8]' : 
                  isSelected ? 'border-[#5A4E69] bg-[#F5F5F5]' : 
                  'border-[#9B97A2] hover:bg-[#F5F5F5]'
                }`}
                onClick={() => setSelectedDate(day)}
              >
                <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-[#6D858E]' : 'text-[#292929]'}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {daySchedules.slice(0, 2).map(schedule => {
                    const client = clients.find(c => c.id === schedule.clientId);
                    const coach = coaches.find(c => c.uid === schedule.coachId || c.id === schedule.coachId);
                    return (
                      <div key={schedule.id} className="text-xs bg-[#6D858E] text-white px-1 py-0.5 rounded truncate">
                        {client?.name.split(' ')[0]} / {coach?.name.split(' ')[1] || 'Coach'}
                      </div>
                    );
                  })}
                  {daySchedules.length > 2 && (
                    <div className="text-xs text-[#9B97A2]">+{daySchedules.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* UPDATED: Selected Date Details with proper grouping */}
      {selectedDate && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-[#292929]">
            Schedule for {formatDatePST(selectedDate.toISOString().split('T')[0])}
          </h3>
          
          {/* Get ordered and grouped schedule for the selected date */}
          {(() => {
            const selectedDateSchedules = getSchedulesForDate(selectedDate);
            const orderedSchedule = getOrderedGroupedSchedule(selectedDateSchedules, clients, coaches);
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {orderedSchedule.map(timeSlot => (
                  <div key={timeSlot.id} className="border rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-2 text-[#292929]">{timeSlot.label}</h4>
                    <div className="space-y-3">
                      {timeSlot.coachGroups.length > 0 ? (
                        timeSlot.coachGroups.map((coachGroup, index) => (
                          <div key={`${timeSlot.id}-${coachGroup.coach?.uid || coachGroup.coach?.id || index}`} 
                               className="bg-[#BED2D8] p-3 rounded">
                            {/* Coach Header */}
                            <p className="font-medium text-[#292929] mb-2">
                              {coachGroup.coach?.name || 'Unknown Coach'}
                            </p>
                            
                            {/* Clients for this coach */}
                            <div className="space-y-2">
                              {coachGroup.clients.map(client => (
                                <div key={client.id} className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="text-[#6D858E] font-medium">{client.name}</p>
                                    <p className="text-xs text-[#707070]">
                                      {client.program === 'limitless' ? client.businessName :
                                       client.program === 'new-options' ? 'Community Job' :
                                       client.program === 'bridges' ? 'Career Dev' :
                                       client.businessName}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
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
                                    <button
                                      onClick={() => scheduleActions.remove(client.scheduleId)}
                                      className="text-red-500 hover:text-red-700 p-1"
                                      title="Remove assignment"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[#9B97A2] italic">No sessions scheduled</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default MonthlyScheduleView;