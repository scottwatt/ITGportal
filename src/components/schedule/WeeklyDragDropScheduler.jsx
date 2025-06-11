// src/components/schedule/WeeklyDragDropScheduler.jsx - FIXED: Multiple clients per coach + Better layout

import React, { useState, useEffect, useRef } from 'react';
import { User, Trash2, MousePointer, CheckCircle, Copy, Clipboard, Calendar, X, AlertTriangle, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { formatDatePST, getWeekDatesStartingMonday, formatDateForInput } from '../../utils/dateUtils';
import { 
  getSchedulableClients, 
  getClientInitials, 
  getProgramBadge,
  getClientsAvailableForDate,
  getClientAvailabilityForDate,
  formatWorkingDays,
  formatAvailableTimeSlots
} from '../../utils/helpers';
import { getAllTimeSlots } from '../../utils/constants'; // Import all time slots
import FlexibleSchedulingManager from './FlexibleScheduleManager';

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
  timeSlots, // This should be the core 3 slots only for main grid
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

  // Get all time slots (core + special) for lookups
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

  // Helper function to check if a time slot is a special (non-core) slot
  const isSpecialTimeSlot = (timeSlotId) => {
    return !timeSlots.some(slot => slot.id === timeSlotId);
  };

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

  // Filter out Grace coaches - only show Success coaches
  const activeCoaches = coaches.filter(c => 
    c.role === 'coach' && 
    (c.coachType || 'success') === 'success'
  );

  // Get clients with availability info for the week
  const getUnscheduledClients = () => {
    const schedulableClients = getSchedulableClients(clients);
    
    return schedulableClients.map(client => {
      // Calculate availability across the week
      let totalAvailableSlots = 0;
      let totalScheduledSlots = 0;
      let totalPossibleSlots = 0;
      
      weekDates.forEach(date => {
        const availability = getClientAvailabilityForDate(client, dailySchedules, date);
        totalAvailableSlots += availability.availableSlots;
        totalScheduledSlots += availability.scheduledSlots;
        totalPossibleSlots += availability.totalSlots;
      });
      
      return {
        ...client,
        weeklyAvailableSlots: totalAvailableSlots,
        weeklyScheduledSlots: totalScheduledSlots,
        weeklyTotalSlots: totalPossibleSlots,
        isFullyScheduled: totalAvailableSlots === 0 && totalPossibleSlots > 0
      };
    }).filter(client => client.weeklyAvailableSlots > 0);
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

    // Check if client is available for this specific time slot
    const clientAvailableTimeSlots = selectedClient.availableTimeSlots || ['8-10', '10-12', '1230-230'];
    if (!clientAvailableTimeSlots.includes(timeSlotId)) {
      alert(`${selectedClient.name} is not available for the ${timeSlotId} time slot. Their available times are: ${formatAvailableTimeSlots(clientAvailableTimeSlots)}`);
      return;
    }

    // Check if client is already scheduled at this time (prevent double-booking the same client)
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

  // Render client card with weekly availability info
  const renderClientCard = (client) => {
    const isSelected = selectedClient?.id === client.id;
    const isDisabled = client.isFullyScheduled;
    
    return (
      <div
        key={client.id}
        onClick={() => !isDisabled && handleClientClick(client)}
        className={`p-3 rounded-lg transition-all duration-200 border-2 ${
          isDisabled 
            ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60' 
            : isSelected 
              ? 'border-[#6D858E] bg-[#BED2D8] shadow-lg scale-105 cursor-pointer' 
              : 'border-[#9B97A2] bg-white hover:border-[#6D858E] hover:shadow-md cursor-pointer'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
            isDisabled 
              ? 'bg-gray-400' 
              : isSelected 
                ? 'bg-[#6D858E]' 
                : 'bg-[#9B97A2]'
          }`}>
            {isSelected ? (
              <CheckCircle className="text-white" size={20} />
            ) : (
              <span className="text-white text-sm font-medium">
                {getClientInitials(client.name)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate text-[#292929]">{client.name}</div>
            <div className="text-xs text-[#707070] truncate">
              {client.program === 'limitless' ? client.businessName : 
               client.program === 'new-options' ? 'Community Job Focus' :
               client.program === 'bridges' ? 'Career Development' :
               client.businessName || 'Program Participant'}
            </div>
            {/* Working schedule info */}
            <div className="text-xs text-[#9B97A2] mt-1">
              <div>{formatWorkingDays(client.workingDays)}</div>
              <div>{formatAvailableTimeSlots(client.availableTimeSlots)}</div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <span className={`text-xs px-2 py-1 rounded font-medium ${
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
            {/* Weekly availability status */}
            <div className="text-xs text-center">
              {isDisabled ? (
                <span className="text-red-600 font-medium">Fully Scheduled</span>
              ) : (
                <span className="text-green-600">
                  {client.weeklyAvailableSlots}/{client.weeklyTotalSlots} weekly slots
                </span>
              )}
            </div>
            {isSelected && !isDisabled && (
              <div className="text-xs text-[#6D858E] font-medium">
                Click time slot →
              </div>
            )}
          </div>
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
      <div className="bg-white rounded-lg shadow-md">
        {/* Week Navigation */}
        <div className="flex justify-between items-center p-6">
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
        <div className="mx-6 mb-6 p-4 bg-[#BED2D8] rounded-lg border-l-4 border-[#6D858E]">
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
          <div className="mt-3 text-sm text-[#292929]">
            <div className="font-medium">🔍 Core Schedule Times:</div>
            <div>• <strong>8:00 AM - 10:00 AM</strong> • <strong>10:00 AM - 12:00 PM</strong> • <strong>12:30 PM - 2:30 PM</strong></div>
          </div>
        </div>

        {/* Show Special Schedules Summary */}
        {weekDates.some(date => {
          const specialSchedules = dailySchedules.filter(s => 
            s.date === date && isSpecialTimeSlot(s.timeSlot)
          );
          return specialSchedules.length > 0;
        }) && (
          <div className="mx-6 mb-6 p-3 bg-orange-50 border-l-4 border-orange-400 rounded">
            <div className="flex items-center space-x-2">
              <Star className="text-orange-500" size={16} />
              <div className="text-sm text-orange-700">
                <div className="font-medium">Special Schedules This Week</div>
                {weekDates.map(date => {
                  const specialSchedules = dailySchedules.filter(s => 
                    s.date === date && isSpecialTimeSlot(s.timeSlot)
                  );
                  if (specialSchedules.length === 0) return null;
                  
                  const dayName = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
                    timeZone: 'America/Los_Angeles',
                    weekday: 'short' 
                  });
                  
                  return (
                    <div key={date} className="text-xs">
                      {dayName}: {specialSchedules.length} special schedule{specialSchedules.length !== 1 ? 's' : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Vertical Coach Layout with Sticky Headers */}
        <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
          <div className="min-w-[1200px]">
            {/* Sticky Coach Headers */}
            <div className="sticky top-0 bg-white z-10 border-b-2 border-[#6D858E]">
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${activeCoaches.length}, 1fr)` }}>
                {activeCoaches.map(coach => {
                  // Count both core and special schedules for this coach
                  const totalSchedules = dailySchedules.filter(s => 
                    weekDates.includes(s.date) && 
                    s.coachId === (coach.uid || coach.id)
                  );
                  
                  const specialSchedules = totalSchedules.filter(s => isSpecialTimeSlot(s.timeSlot));
                  
                  return (
                    <div key={coach.uid || coach.id} className="p-4 text-center bg-[#6D858E] text-white">
                      <div className="font-semibold text-lg">{coach.name}</div>
                      <div className="text-xs text-[#BED2D8]">
                        {totalSchedules.length} sessions this week
                        {specialSchedules.length > 0 && (
                          <div className="flex items-center justify-center space-x-1 mt-1">
                            <Star size={12} />
                            <span>{specialSchedules.length} special</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Schedule Grid - Days Horizontal, Time Slots Vertical */}
            <div className="space-y-0">
              {weekDates.map(date => {
                const dayName = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
                  timeZone: 'America/Los_Angeles',
                  weekday: 'short' 
                });
                const dayNumber = new Date(date + 'T12:00:00').getDate();
                const isToday = date === selectedDate;
                
                return (
                  <div key={date} className="border-b border-gray-200">
                    {/* Day Header */}
                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${activeCoaches.length}, 1fr)` }}>
                      {activeCoaches.map(coach => {
                        // Count special schedules for this coach on this day
                        const specialSchedules = dailySchedules.filter(s => 
                          s.date === date && 
                          s.coachId === (coach.uid || coach.id) && 
                          isSpecialTimeSlot(s.timeSlot)
                        );
                        
                        return (
                          <div key={`${date}-header-${coach.uid || coach.id}`} 
                               className={`text-center p-2 border-r border-gray-200 font-semibold ${
                                 isToday ? 'bg-[#5A4E69] text-white' : 'bg-[#F5F5F5] text-[#292929]'
                               }`}>
                            <div>{dayName} {dayNumber}</div>
                            {specialSchedules.length > 0 && (
                              <div className="flex items-center justify-center space-x-1 text-xs text-orange-600">
                                <Star size={10} />
                                <span>{specialSchedules.length}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Time Slots for this day - ONLY CORE 3 SLOTS */}
                    {timeSlots.map(slot => (
                      <div key={`${date}-${slot.id}`} className="grid gap-1" 
                           style={{ gridTemplateColumns: `repeat(${activeCoaches.length}, 1fr)` }}>
                        {activeCoaches.map(coach => {
                          const coachId = coach.uid || coach.id;
                          const isAvailable = availabilityActions.isCoachAvailable(coachId, date);
                          const assignments = dailySchedules.filter(s => 
                            s.date === date && 
                            s.timeSlot === slot.id && 
                            s.coachId === coachId
                          );
                          const canAssign = isAssigning && selectedClient && isAvailable;
                          const isClickable = canAssign && selectedClient?.availableTimeSlots?.includes(slot.id);
                          
                          return (
                            <div
                              key={`${date}-${slot.id}-${coachId}`}
                              onClick={() => isClickable && handleTimeSlotClick(coachId, slot.id, date)}
                              className={`min-h-24 p-3 border-r border-b border-gray-200 transition-all ${
                                !isAvailable 
                                  ? 'bg-red-50 cursor-not-allowed' :
                                isClickable 
                                  ? 'bg-[#BED2D8] cursor-pointer hover:shadow-md hover:bg-[#6D858E] hover:bg-opacity-20' :
                                assignments.length > 0
                                  ? 'bg-[#BED2D8]' 
                                  : 'bg-white hover:bg-gray-50'
                              }`}
                            >
                              {/* Time Slot Label (show in every empty slot) */}
                              {assignments.length === 0 && (
                                <div className="text-xs font-medium text-[#707070] mb-2 text-center">
                                  {slot.start} - {slot.end}
                                </div>
                              )}
                              
                              {!isAvailable ? (
                                <div className="text-center text-red-600">
                                  <AlertTriangle size={16} className="mx-auto mb-1" />
                                  <div className="text-xs">Unavailable</div>
                                </div>
                              ) : assignments.length > 0 ? (
                                <div className="space-y-1">
                                  {assignments.map(assignment => {
                                    const client = clients.find(c => c.id === assignment.clientId);
                                    return client ? (
                                      <div key={assignment.id} className="bg-white border border-[#6D858E] rounded p-2">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-xs text-[#292929] truncate">
                                              {client.name}
                                            </div>
                                            <div className="text-xs text-[#707070] truncate">
                                              {client.program === 'limitless' ? client.businessName :
                                               client.program === 'new-options' ? 'Community Job' :
                                               client.program === 'bridges' ? 'Career Dev' :
                                               'Program'}
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
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              ) : isClickable ? (
                                <div className="text-center text-[#6D858E]">
                                  <MousePointer size={16} className="mx-auto mb-1" />
                                  <div className="text-xs font-medium">Click to assign</div>
                                </div>
                              ) : canAssign && selectedClient && !selectedClient?.availableTimeSlots?.includes(slot.id) ? (
                                <div className="text-center text-red-600">
                                  <X size={16} className="mx-auto mb-1" />
                                  <div className="text-xs">Client not available</div>
                                </div>
                              ) : (
                                <div className="text-center text-[#9B97A2]">
                                  <User size={16} className="mx-auto mb-1" />
                                  <div className="text-xs">Available</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Available Clients */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-lg font-semibold mb-4 text-[#292929]">
          Available Clients - Click to Select
          <span className="text-sm text-[#9B97A2] ml-2">
            ({unscheduledClients.length} with weekly slots available)
          </span>
        </h4>

        {selectedClient && (
          <div className="mb-4 p-3 bg-[#6D858E] text-white rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle size={20} />
              <div>
                <div className="font-medium">{selectedClient.name} is selected</div>
                <div className="text-sm text-[#BED2D8]">
                  Available times: {formatAvailableTimeSlots(selectedClient.availableTimeSlots)} | 
                  {selectedClient.weeklyAvailableSlots} of {selectedClient.weeklyTotalSlots} weekly slots remaining
                </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unscheduledClients.map(renderClientCard)}
          </div>
        ) : (
          <div className="text-center py-12 text-[#9B97A2]">
            <User size={48} className="mx-auto mb-4" />
            <p className="text-lg font-medium">All schedulable clients have full schedules this week!</p>
          </div>
        )}
      </div>

      {/* Special Scheduling Manager for rare circumstances */}
      <FlexibleSchedulingManager
        selectedDate={selectedDate}
        clients={clients}
        coaches={coaches}
        schedules={dailySchedules}
        scheduleActions={scheduleActions}
        availabilityActions={availabilityActions}
      />
    </div>
  );
};

export default WeeklyDragDropScheduler;