// src/components/schedule/WeeklyDragDropScheduler.jsx - Weekly view with drag and drop
import React, { useState, useEffect, useRef } from 'react';
import { User, Trash2, MousePointer, CheckCircle, Copy, Clipboard, Calendar, X, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDatePST, getWeekDatesStartingMonday, formatDateForInput } from '../../utils/dateUtils';
import { getSchedulableClients, getClientInitials, getProgramBadge } from '../../utils/helpers';

const WeeklyDragDropScheduler = ({ 
  selectedDate,
  handleDragStart, 
  handleDragOver, 
  handleDragLeave, 
  handleDrop, 
  handleRemoveAssignment,
  dragOverSlot,
  draggedClient,
  dailySchedules,
  clients,
  coaches,
  timeSlots,
  scheduleActions,
  availabilityActions 
}) => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Get the Monday of the week containing selectedDate
    const date = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = date.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(date);
    monday.setDate(date.getDate() - daysToMonday);
    return formatDateForInput(monday);
  });

  // Get week dates starting from current Monday
  const getWeekDates = () => {
    const weekDates = [];
    const startDate = new Date(currentWeekStart + 'T12:00:00');
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      weekDates.push(formatDateForInput(date));
    }
    
    return weekDates;
  };

  const weekDates = getWeekDates();

  // Navigate to previous/next week
  const navigateWeek = (direction) => {
    const currentStart = new Date(currentWeekStart + 'T12:00:00');
    currentStart.setDate(currentStart.getDate() + (direction * 7));
    setCurrentWeekStart(formatDateForInput(currentStart));
  };

  // Filter out Grace coaches
  const activeCoaches = coaches.filter(c => 
    c.role === 'coach' && 
    (c.coachType || 'success') === 'success'
  );

  const getUnscheduledClients = () => {
    const schedulableClients = getSchedulableClients(clients);
    return schedulableClients.filter(client => {
      // Check if client has fewer sessions than possible across the week
      const clientSessions = dailySchedules.filter(s => 
        weekDates.includes(s.date) && s.clientId === client.id
      );
      const maxPossibleSessions = weekDates.length * timeSlots.length;
      return clientSessions.length < maxPossibleSessions;
    });
  };

  const handleClientClick = (client) => {
    if (selectedClient?.id === client.id) {
      setSelectedClient(null);
      setIsAssigning(false);
    } else {
      setSelectedClient(client);
      setIsAssigning(true);
    }
  };

  const handleTimeSlotClick = async (coachId, timeSlotId, date) => {
    if (!selectedClient || !isAssigning) return;

    // Check if coach is available on this date
    if (!availabilityActions.isCoachAvailable(coachId, date)) {
      const status = availabilityActions.getCoachStatusForDate(coachId, date);
      const reason = availabilityActions.getCoachReasonForDate(coachId, date);
      alert(`This coach is not available on ${date}. Status: ${status}${reason ? ` (${reason})` : ''}`);
      return;
    }

    // Check if client is already scheduled at this time
    const existingSchedule = dailySchedules.find(s => 
      s.date === date && 
      s.timeSlot === timeSlotId && 
      s.clientId === selectedClient.id
    );

    if (existingSchedule) {
      alert('This client is already scheduled for this time slot!');
      return;
    }

    try {
      await scheduleActions.add(date, timeSlotId, coachId, selectedClient.id);
      
      // Reset selection
      setSelectedClient(null);
      setIsAssigning(false);
      
      alert('Client scheduled successfully!');
      
    } catch (error) {
      alert(`Error scheduling client: ${error.message || 'Please try again.'}`);
      setSelectedClient(null);
      setIsAssigning(false);
    }
  };

  const renderClientCard = (client) => {
    const isSelected = selectedClient?.id === client.id;
    
    return (
      <div
        key={client.id}
        onClick={() => handleClientClick(client)}
        className={`p-2 rounded cursor-pointer transition-all duration-200 border ${
          isSelected 
            ? 'border-[#6D858E] bg-[#BED2D8] shadow-lg scale-105' 
            : 'border-[#9B97A2] bg-white hover:border-[#6D858E] hover:shadow-md'
        }`}
      >
        <div className="flex items-center space-x-2">
          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
            isSelected ? 'bg-[#6D858E]' : 'bg-[#9B97A2]'
          }`}>
            {isSelected ? (
              <CheckCircle className="text-white" size={16} />
            ) : (
              <span className="text-white text-xs font-medium">
                {getClientInitials(client.name)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-xs truncate text-[#292929]">{client.name}</div>
            <div className="text-xs text-[#707070] truncate">
              {client.program === 'limitless' ? client.businessName : 
               client.program === 'new-options' ? 'Community Job' :
               client.program === 'bridges' ? 'Career Dev' :
               'Program Participant'}
            </div>
          </div>
          <span className={`text-xs px-1 rounded font-medium ${
            client.program === 'limitless' ? 'bg-[#BED2D8] text-[#292929]' :
            client.program === 'new-options' ? 'bg-[#BED2D8] text-[#292929]' :
            client.program === 'bridges' ? 'bg-[#BED2D8] text-[#292929]' :
            'bg-[#F5F5F5] text-[#292929]'
          }`}>
            {client.program === 'limitless' ? 'L' :
             client.program === 'new-options' ? 'NO' :
             client.program === 'bridges' ? 'B' :
             'L'}
          </span>
        </div>
      </div>
    );
  };

  const renderDayColumn = (date) => {
    const dayName = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
      timeZone: 'America/Los_Angeles',
      weekday: 'short' 
    });
    const dayNumber = new Date(date + 'T12:00:00').getDate();
    const isToday = date === selectedDate;
    
    return (
      <div key={date} className="flex-1 min-w-0">
        {/* Day Header */}
        <div className={`text-center p-2 rounded-t-lg ${
          isToday ? 'bg-[#5A4E69] text-white' : 'bg-[#9B97A2] text-white'
        }`}>
          <div className="font-semibold text-sm">{dayName}</div>
          <div className="text-xs">{dayNumber}</div>
        </div>
        
        {/* Time Slots for this day */}
        <div className="space-y-2 p-2 border-l border-r border-b rounded-b-lg">
          {timeSlots.map(slot => {
            const daySchedules = dailySchedules.filter(s => s.date === date && s.timeSlot === slot.id);
            
            return (
              <div key={`${date}-${slot.id}`} className="space-y-1">
                {/* Time slot header */}
                <div className="text-xs font-medium text-[#707070] text-center py-1 bg-[#F5F5F5] rounded">
                  {slot.start} - {slot.end}
                </div>
                
                {/* Coach slots */}
                {activeCoaches.map(coach => {
                  const coachId = coach.uid || coach.id;
                  const isAvailable = availabilityActions.isCoachAvailable(coachId, date);
                  const assignment = daySchedules.find(s => s.coachId === coachId);
                  const canAssign = isAssigning && selectedClient && isAvailable;
                  const isClickable = canAssign && !assignment;
                  
                  return (
                    <div
                      key={`${date}-${slot.id}-${coachId}`}
                      onClick={() => isClickable && handleTimeSlotClick(coachId, slot.id, date)}
                      className={`min-h-16 p-2 border rounded text-xs transition-all ${
                        !isAvailable 
                          ? 'border-red-300 bg-red-50 cursor-not-allowed' :
                        isClickable 
                          ? 'border-[#6D858E] bg-[#BED2D8] cursor-pointer hover:shadow-md' :
                        assignment
                          ? 'border-[#6D858E] bg-[#BED2D8]' 
                          : 'border-[#9B97A2] bg-[#F5F5F5]'
                      }`}
                    >
                      {!isAvailable ? (
                        <div className="text-center text-red-600">
                          <AlertTriangle size={12} className="mx-auto mb-1" />
                          <div className="text-xs">Unavailable</div>
                        </div>
                      ) : assignment ? (
                        <div className="space-y-1">
                          <div className="font-medium text-[#292929] text-xs">
                            {coach.name.split(' ')[0]}
                          </div>
                          {(() => {
                            const client = clients.find(c => c.id === assignment.clientId);
                            return client ? (
                              <div className="bg-white border border-[#6D858E] rounded p-1">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-xs text-[#292929] truncate">
                                      {client.name}
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveAssignment(assignment.id);
                                    }}
                                    className="ml-1 p-0.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                                    title="Remove assignment"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      ) : isClickable ? (
                        <div className="text-center text-[#6D858E]">
                          <div className="font-medium text-xs">{coach.name.split(' ')[0]}</div>
                          <MousePointer size={12} className="mx-auto my-1" />
                          <div className="text-xs">Click to assign</div>
                        </div>
                      ) : (
                        <div className="text-center text-[#9B97A2]">
                          <div className="font-medium text-xs">{coach.name.split(' ')[0]}</div>
                          <User size={12} className="mx-auto my-1" />
                          <div className="text-xs">Available</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const unscheduledClients = getUnscheduledClients();

  if (activeCoaches.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center py-12">
          <User size={48} className="mx-auto mb-4 text-[#9B97A2]" />
          <h3 className="text-lg font-semibold text-[#292929] mb-2">No Available Coaches</h3>
          <p className="text-[#707070]">All Success coaches are unavailable for this week.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        {/* Week Navigation */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#292929]">
            Weekly Scheduler
            {isAssigning && selectedClient && (
              <span className="ml-4 text-sm text-[#6D858E] bg-[#BED2D8] px-3 py-1 rounded-full">
                Assigning: {selectedClient.name} - Click any available slot
              </span>
            )}
          </h3>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 text-[#6D858E] hover:bg-[#BED2D8] rounded"
              title="Previous week"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="text-center">
              <div className="font-semibold text-[#292929]">
                {formatDatePST(weekDates[0])} - {formatDatePST(weekDates[6])}
              </div>
              <div className="text-sm text-[#707070]">
                Week of {new Date(weekDates[0] + 'T12:00:00').toLocaleDateString('en-US', { 
                  timeZone: 'America/Los_Angeles',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
            
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 text-[#6D858E] hover:bg-[#BED2D8] rounded"
              title="Next week"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="mb-6 p-4 bg-[#BED2D8] rounded-lg border-l-4 border-[#6D858E]">
          <h4 className="font-semibold text-[#292929] mb-2">How to Schedule:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#292929]">
            <div>
              <div className="font-medium mb-1">Step 1: Click a client below</div>
              <div>The client card will turn blue with a checkmark</div>
            </div>
            <div>
              <div className="font-medium mb-1">Step 2: Click any available slot in the week</div>
              <div>The client will be instantly assigned to that coach, day, and time</div>
            </div>
          </div>
        </div>

        {/* Weekly Schedule Grid */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-1 min-w-[1000px]">
            {weekDates.map(renderDayColumn)}
          </div>
        </div>

        {/* Available Clients */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-semibold mb-4 text-[#292929]">
            Available Clients - Click to Select
            <span className="text-sm text-[#9B97A2] ml-2">
              ({unscheduledClients.length} available)
            </span>
          </h4>

          {selectedClient && (
            <div className="mb-4 p-3 bg-[#6D858E] text-white rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle size={20} />
                <div>
                  <div className="font-medium">{selectedClient.name} is selected</div>
                  <div className="text-sm text-[#BED2D8]">Click any available time slot in the week above to assign</div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedClient(null);
                    setIsAssigning(false);
                  }}
                  className="ml-auto text-[#BED2D8] hover:text-white"
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          )}
          
          {unscheduledClients.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {unscheduledClients.map(renderClientCard)}
            </div>
          ) : (
            <div className="text-center py-12 text-[#9B97A2]">
              <User size={48} className="mx-auto mb-4" />
              <p className="text-lg font-medium">All schedulable clients have sessions this week!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyDragDropScheduler;