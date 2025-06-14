// src/components/schedule/WeeklyDragDropScheduler.jsx - FIXED: Perfect alignment + No overflow

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
  
  // Copy/Paste Schedule States
  const [copiedWeekSchedule, setCopiedWeekSchedule] = useState(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [selectedTargetWeeks, setSelectedTargetWeeks] = useState([]);
  const [pastePreview, setPastePreview] = useState([]);
  const [isPasting, setIsPasting] = useState(false);
  
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

  // COPY/PASTE WEEK SCHEDULE FUNCTIONS
  const handleCopyWeekSchedule = () => {
    const weekSchedules = dailySchedules.filter(s => weekDates.includes(s.date));
    
    if (weekSchedules.length === 0) {
      alert('No schedule to copy for this week.');
      return;
    }

    // Create copy with coach and client details for preview
    const scheduleWithDetails = weekSchedules.map(schedule => {
      const coach = activeCoaches.find(c => (c.uid || c.id) === schedule.coachId);
      const client = clients.find(c => c.id === schedule.clientId);
      const timeSlotInfo = getTimeSlotInfo(schedule.timeSlot);
      
      return {
        ...schedule,
        coachName: coach?.name || 'Unknown Coach',
        clientName: client?.name || 'Unknown Client',
        timeSlotLabel: timeSlotInfo.label || 'Unknown Time'
      };
    });

    setCopiedWeekSchedule({
      sourceWeekStart: currentWeekStart,
      schedules: scheduleWithDetails,
      copiedAt: new Date().toISOString()
    });

    alert(`Copied ${weekSchedules.length} sessions from week of ${formatDatePST(weekDates[0])}!`);
  };

  const handleShowPasteModal = () => {
    if (!copiedWeekSchedule) {
      alert('No week schedule copied. Please copy a week schedule first.');
      return;
    }
    setShowPasteModal(true);
    setSelectedTargetWeeks([]);
    setPastePreview([]);
  };

  const handleTargetWeekChange = (weekStart, isChecked) => {
    if (isChecked) {
      setSelectedTargetWeeks(prev => [...prev, weekStart]);
    } else {
      setSelectedTargetWeeks(prev => prev.filter(w => w !== weekStart));
    }
  };

  // Generate paste preview when target weeks change
  useEffect(() => {
    if (selectedTargetWeeks.length > 0 && copiedWeekSchedule) {
      const preview = selectedTargetWeeks.map(targetWeekStart => {
        // Generate target week dates
        const targetWeekDates = [];
        const startDate = new Date(targetWeekStart + 'T12:00:00');
        for (let i = 0; i < 7; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          targetWeekDates.push(formatDateForInput(date));
        }

        const conflicts = [];
        const validAssignments = [];

        copiedWeekSchedule.schedules.forEach(schedule => {
          const client = clients.find(c => c.id === schedule.clientId);
          
          // Calculate target date by finding the day offset from source week
          const sourceWeekDates = [];
          const sourceStart = new Date(copiedWeekSchedule.sourceWeekStart + 'T12:00:00');
          for (let i = 0; i < 7; i++) {
            const date = new Date(sourceStart);
            date.setDate(sourceStart.getDate() + i);
            sourceWeekDates.push(formatDateForInput(date));
          }
          
          const dayIndex = sourceWeekDates.indexOf(schedule.date);
          const targetDate = targetWeekDates[dayIndex];
          
          if (!client) {
            conflicts.push({
              ...schedule,
              targetDate,
              reason: `Client no longer exists`
            });
            return;
          }
          
          // Check if client is available for this date and time slot
          const clientAvailableForDate = getClientsAvailableForDate([client], targetDate);
          if (clientAvailableForDate.length === 0) {
            conflicts.push({
              ...schedule,
              targetDate,
              reason: `${client.name} doesn't work on ${new Date(targetDate + 'T12:00:00').toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'long' })}s`
            });
            return;
          }
          
          const clientAvailableTimeSlots = client.availableTimeSlots || ['8-10', '10-12', '1230-230'];
          if (!clientAvailableTimeSlots.includes(schedule.timeSlot)) {
            conflicts.push({
              ...schedule,
              targetDate,
              reason: `${client.name} is not available for ${schedule.timeSlot} time slot`
            });
            return;
          }
          
          // Check if coach is available on target date
          const isCoachAvailable = availabilityActions.isCoachAvailable(schedule.coachId, targetDate);
          
          // Check for existing assignments (only prevent double-booking the same client)
          const existingAssignment = dailySchedules.find(s => 
            s.date === targetDate && 
            s.timeSlot === schedule.timeSlot && 
            s.clientId === schedule.clientId
          );

          if (!isCoachAvailable) {
            const status = availabilityActions.getCoachStatusForDate(schedule.coachId, targetDate);
            conflicts.push({
              ...schedule,
              targetDate,
              reason: `Coach ${schedule.coachName} is ${status} on ${formatDatePST(targetDate)}`
            });
          } else if (existingAssignment) {
            conflicts.push({
              ...schedule,
              targetDate,
              reason: `${schedule.clientName} is already scheduled at ${schedule.timeSlotLabel} on ${formatDatePST(targetDate)}`
            });
          } else {
            validAssignments.push({
              ...schedule,
              targetDate
            });
          }
        });

        return {
          weekStart: targetWeekStart,
          validAssignments,
          conflicts
        };
      });

      setPastePreview(preview);
    }
  }, [selectedTargetWeeks, copiedWeekSchedule, dailySchedules, availabilityActions, clients]);

  const handlePasteWeekSchedule = async () => {
    if (selectedTargetWeeks.length === 0) {
      alert('Please select at least one target week.');
      return;
    }

    const totalValidAssignments = pastePreview.reduce((sum, week) => sum + week.validAssignments.length, 0);
    const totalConflicts = pastePreview.reduce((sum, week) => sum + week.conflicts.length, 0);

    if (totalValidAssignments === 0) {
      alert('No valid assignments can be made to the selected weeks due to conflicts.');
      return;
    }

    const confirmMessage = `Ready to paste week schedule:
• ${totalValidAssignments} assignments will be created
• ${totalConflicts} assignments will be skipped due to conflicts

Continue?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsPasting(true);

    try {
      let successCount = 0;

      for (const weekPreview of pastePreview) {
        for (const assignment of weekPreview.validAssignments) {
          try {
            await scheduleActions.add(
              assignment.targetDate,
              assignment.timeSlot,
              assignment.coachId,
              assignment.clientId
            );
            successCount++;
          } catch (error) {
            console.error('Error creating assignment:', error);
          }
        }
      }

      alert(`Successfully pasted ${successCount} assignments! ${totalConflicts} were skipped due to conflicts.`);
      setShowPasteModal(false);
      setSelectedTargetWeeks([]);
      
    } catch (error) {
      alert(`Error pasting week schedule: ${error.message}`);
    } finally {
      setIsPasting(false);
    }
  };

  // Generate next 8 weeks for selection
  const getNextEightWeeks = () => {
    const weeks = [];
    const today = new Date();
    
    for (let i = 1; i <= 8; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + (i * 7));
      
      // Get Monday of that week
      const dayOfWeek = weekStart.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(weekStart);
      monday.setDate(weekStart.getDate() - daysToMonday);
      
      weeks.push(formatDateForInput(monday));
    }
    
    return weeks;
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
  const hasWeekSchedule = dailySchedules.some(s => weekDates.includes(s.date));

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
      {/* Copy/Paste Controls */}
      <div className="bg-[#F5F5F5] p-4 rounded-lg border-l-4 border-[#5A4E69]">
        <h4 className="font-semibold text-[#292929] mb-3">📋 Weekly Schedule Copy & Paste</h4>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopyWeekSchedule}
            disabled={!hasWeekSchedule}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              hasWeekSchedule 
                ? 'bg-[#5A4E69] text-white hover:bg-[#292929]' 
                : 'bg-[#9B97A2] text-white cursor-not-allowed'
            }`}
          >
            <Copy size={16} />
            <span>Copy This Week's Schedule</span>
          </button>
          
          <button
            onClick={handleShowPasteModal}
            disabled={!copiedWeekSchedule}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              copiedWeekSchedule 
                ? 'bg-[#6D858E] text-white hover:bg-[#5A4E69]' 
                : 'bg-[#9B97A2] text-white cursor-not-allowed'
            }`}
          >
            <Clipboard size={16} />
            <span>Paste to Other Weeks</span>
          </button>
          
          {copiedWeekSchedule && (
            <div className="text-sm text-[#707070] bg-white px-3 py-2 rounded border">
              ✅ Copied {copiedWeekSchedule.schedules.length} sessions from week of {formatDatePST(copiedWeekSchedule.sourceWeekStart)}
            </div>
          )}
          
          {!hasWeekSchedule && (
            <div className="text-sm text-[#9B97A2]">
              ℹ️ No schedule to copy for this week
            </div>
          )}
        </div>
      </div>

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

        {/* FIXED: Full-width columns that fill the entire area */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-x-auto">
          <div className="min-w-full">
            {/* FIXED: Sticky Coach Headers with time slot column */}
            <div className="sticky top-0 bg-white shadow-md border-b-4 border-[#6D858E] z-50">
              <div className="grid gap-0 border-b-2 border-gray-300" style={{ gridTemplateColumns: `120px repeat(${activeCoaches.length}, 1fr)` }}>
                {/* Time slot header column */}
                <div className="p-3 text-center bg-gradient-to-b from-gray-600 to-gray-700 text-white border-r border-gray-200">
                  <div className="font-bold text-sm">Time Slots</div>
                  <div className="text-xs text-gray-300 mt-1">Schedule</div>
                </div>
                
                {activeCoaches.map((coach, index) => {
                  // Count both core and special schedules for this coach
                  const totalSchedules = dailySchedules.filter(s => 
                    weekDates.includes(s.date) && 
                    s.coachId === (coach.uid || coach.id)
                  );
                  
                  const specialSchedules = totalSchedules.filter(s => isSpecialTimeSlot(s.timeSlot));
                  
                  return (
                    <div key={coach.uid || coach.id} 
                         className="p-3 text-center bg-gradient-to-b from-[#6D858E] to-[#5A4E69] text-white border-r border-gray-200 last:border-r-0">
                      <div className="font-bold text-sm truncate" title={coach.name}>{coach.name}</div>
                      <div className="text-xs text-[#BED2D8] mt-1">
                        <div className="truncate">{totalSchedules.length} total sessions</div>
                        {specialSchedules.length > 0 && (
                          <div className="flex items-center justify-center space-x-1 mt-1">
                            <Star size={10} />
                            <span>{specialSchedules.length} special</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FIXED: Schedule Grid with perfect alignment */}
            <div className="bg-gray-50">
              {weekDates.map((date, dateIndex) => {
                const dayName = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
                  timeZone: 'America/Los_Angeles',
                  weekday: 'long' 
                });
                const dayShort = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
                  timeZone: 'America/Los_Angeles',
                  weekday: 'short' 
                });
                const dayNumber = new Date(date + 'T12:00:00').getDate();
                const isToday = date === selectedDate;
                
                return (
                  <div key={date} className={`${dateIndex > 0 ? 'border-t-4 border-gray-400' : ''} bg-white mb-1`}>
                    {/* FIXED: Day Header with time slot column */}
                    <div className={`grid gap-0 ${isToday ? 'bg-gradient-to-r from-[#5A4E69] to-[#6D858E]' : 'bg-gradient-to-r from-gray-200 to-gray-300'} border-b-2 ${isToday ? 'border-[#292929]' : 'border-gray-400'}`} 
                         style={{ gridTemplateColumns: `120px repeat(${activeCoaches.length}, 1fr)` }}>
                      {/* Day info in time slot column */}
                      <div className={`text-center py-3 px-2 border-r border-gray-300 ${
                        isToday ? 'bg-[#292929] text-white' : 'bg-gray-400 text-white'
                      }`}>
                        <div className="font-bold text-sm">{dayShort} {dayNumber}</div>
                        <div className="text-xs mt-1 opacity-90">{dayName}</div>
                      </div>
                      
                      {activeCoaches.map((coach, index) => {
                        // Count special schedules for this coach on this day
                        const specialSchedules = dailySchedules.filter(s => 
                          s.date === date && 
                          s.coachId === (coach.uid || coach.id) && 
                          isSpecialTimeSlot(s.timeSlot)
                        );
                        
                        return (
                          <div key={`${date}-header-${coach.uid || coach.id}`} 
                               className={`text-center py-3 px-2 border-r border-gray-300 last:border-r-0 ${
                                 isToday ? 'text-white' : 'text-gray-700'
                               }`}>
                            <div className="font-bold text-sm">{dayShort} {dayNumber}</div>
                            <div className="text-xs mt-1 opacity-80">{dayName}</div>
                            {specialSchedules.length > 0 && (
                              <div className="flex items-center justify-center space-x-1 text-xs mt-1">
                                <Star size={10} className="text-orange-400" />
                                <span>{specialSchedules.length}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* FIXED: Time Slots with time slot labels on the left */}
                    {timeSlots.map((slot, slotIndex) => (
                      <div key={`${date}-${slot.id}`} 
                           className={`grid gap-0 ${slotIndex > 0 ? 'border-t-2 border-gray-300' : ''}`}
                           style={{ gridTemplateColumns: `120px repeat(${activeCoaches.length}, 1fr)` }}>
                        
                        {/* Time Slot Label Column */}
                        <div className="min-h-20 p-2 border-r border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 flex flex-col justify-center">
                          <div className="text-center">
                            <div className="font-bold text-sm text-gray-700">
                              {slot.start.replace(' PST', '')}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {slot.end.replace(' PST', '')}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 font-medium">
                              {slot.label.replace(' PST', '')}
                            </div>
                          </div>
                        </div>
                        
                        {activeCoaches.map((coach, coachIndex) => {
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
                              className={`min-h-20 border-r border-gray-300 last:border-r-0 transition-all overflow-hidden p-2 ${
                                !isAvailable 
                                  ? 'bg-red-50 cursor-not-allowed' :
                                isClickable 
                                  ? 'bg-[#BED2D8] cursor-pointer hover:shadow-md hover:bg-[#6D858E] hover:bg-opacity-20' :
                                assignments.length > 0
                                  ? 'bg-[#BED2D8]' 
                                  : 'bg-white hover:bg-gray-50'
                              }`}
                            >
                              {!isAvailable ? (
                                <div className="text-center text-red-600 py-2">
                                  <AlertTriangle size={12} className="mx-auto mb-1" />
                                  <div className="text-xs">Off</div>
                                </div>
                              ) : assignments.length > 0 ? (
                                <div className="space-y-1">
                                  {assignments.slice(0, 3).map(assignment => {
                                    const client = clients.find(c => c.id === assignment.clientId);
                                    if (!client) return null;
                                    
                                    // ULTRA MINIMAL: Only initials + program badge - NO OVERFLOW POSSIBLE
                                    const initials = getClientInitials(client.name);
                                    const programBadge = client?.program === 'limitless' ? 'L' :
                                                       client?.program === 'new-options' ? 'N' :
                                                       client?.program === 'bridges' ? 'B' : 'L';
                                    
                                    return (
                                      <div 
                                        key={assignment.id} 
                                        className="bg-white border border-[#6D858E] rounded w-full h-5 flex items-center justify-between px-1 overflow-hidden"
                                        title={`${client.name} - ${client.program === 'limitless' ? (client.businessName || 'Business') : client.program === 'new-options' ? 'Job Focus' : 'Career Development'}`}
                                      >
                                        {/* COMPLETELY FIXED: Only initials + badge */}
                                        <div className="flex items-center space-x-1">
                                          <span className="text-xs font-bold text-[#292929] w-5 text-center">
                                            {initials.substring(0, 2)}
                                          </span>
                                          <span className={`text-xs rounded font-bold w-4 h-4 flex items-center justify-center ${
                                            client?.program === 'limitless' ? 'bg-blue-500 text-white' :
                                            client?.program === 'new-options' ? 'bg-green-500 text-white' :
                                            client?.program === 'bridges' ? 'bg-purple-500 text-white' :
                                            'bg-gray-400 text-white'
                                          }`}>
                                            {programBadge}
                                          </span>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveAssignment(assignment.id);
                                          }}
                                          className="text-red-500 hover:bg-red-100 rounded w-4 h-4 flex items-center justify-center flex-shrink-0"
                                          title="Remove"
                                        >
                                          <X size={8} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                  {assignments.length > 3 && (
                                    <div className="text-xs text-center text-gray-500 w-full h-4 flex items-center justify-center">
                                      +{assignments.length - 3} more
                                    </div>
                                  )}
                                </div>
                              ) : isClickable ? (
                                <div className="text-center text-[#6D858E] py-2">
                                  <MousePointer size={12} className="mx-auto mb-1" />
                                  <div className="text-xs">Click</div>
                                </div>
                              ) : canAssign && selectedClient && !selectedClient?.availableTimeSlots?.includes(slot.id) ? (
                                <div className="text-center text-red-600 py-2">
                                  <X size={12} className="mx-auto mb-1" />
                                  <div className="text-xs">N/A</div>
                                </div>
                              ) : (
                                <div className="text-center text-gray-400 py-2">
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

      {/* Paste Week Schedule Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-[#5A4E69] text-white">
              <h3 className="text-lg font-semibold">📋 Paste Week Schedule to Other Weeks</h3>
              <button 
                onClick={() => setShowPasteModal(false)} 
                className="text-white hover:text-gray-200 text-2xl"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              {/* Source Week Schedule Display */}
              <div className="mb-6">
                <h4 className="font-semibold text-[#292929] mb-2">
                  Source Week: {formatDatePST(copiedWeekSchedule.sourceWeekStart)} ({copiedWeekSchedule.schedules.length} sessions)
                </h4>
                <div className="bg-[#F5F5F5] p-3 rounded border max-h-40 overflow-y-auto">
                  {copiedWeekSchedule.schedules.map((schedule, index) => (
                    <div key={index} className="text-sm text-[#292929]">
                      • {formatDatePST(schedule.date)} {schedule.timeSlotLabel}: {schedule.clientName} with {schedule.coachName}
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Week Selection */}
              <div className="mb-6">
                <h4 className="font-semibold text-[#292929] mb-3">Select Target Weeks:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {getNextEightWeeks().map(weekStart => {
                    const weekEnd = new Date(weekStart + 'T12:00:00');
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    
                    return (
                      <label key={weekStart} className="flex items-center space-x-2 p-3 border rounded hover:bg-[#F5F5F5] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTargetWeeks.includes(weekStart)}
                          onChange={(e) => handleTargetWeekChange(weekStart, e.target.checked)}
                          className="rounded"
                        />
                        <div className="text-sm">
                          <div className="font-medium">
                            Week of {new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', {
                              timeZone: 'America/Los_Angeles',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-[#707070]">
                            {formatDatePST(weekStart)} - {formatDatePST(formatDateForInput(weekEnd))}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Paste Preview */}
              {pastePreview.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-[#292929] mb-3">Paste Preview:</h4>
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {pastePreview.map(weekPreview => (
                      <div key={weekPreview.weekStart} className="border rounded p-3">
                        <h5 className="font-medium text-[#292929] mb-2">
                          Week of {formatDatePST(weekPreview.weekStart)}
                        </h5>
                        
                        {weekPreview.validAssignments.length > 0 && (
                          <div className="mb-2">
                            <div className="text-sm text-green-600 font-medium mb-1">
                              ✅ Will Create ({weekPreview.validAssignments.length}):
                            </div>
                            <div className="max-h-24 overflow-y-auto">
                              {weekPreview.validAssignments.map((assignment, index) => (
                                <div key={index} className="text-sm text-green-700 ml-4">
                                  • {formatDatePST(assignment.targetDate)} {assignment.timeSlotLabel}: {assignment.clientName} with {assignment.coachName}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {weekPreview.conflicts.length > 0 && (
                          <div>
                            <div className="text-sm text-red-600 font-medium mb-1">
                              ⚠️ Will Skip ({weekPreview.conflicts.length}):
                            </div>
                            <div className="max-h-24 overflow-y-auto">
                              {weekPreview.conflicts.map((conflict, index) => (
                                <div key={index} className="text-sm text-red-700 ml-4">
                                  • {formatDatePST(conflict.targetDate)} {conflict.timeSlotLabel}: {conflict.clientName} - {conflict.reason}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 p-4 border-t bg-[#F5F5F5]">
              <button
                onClick={handlePasteWeekSchedule}
                disabled={selectedTargetWeeks.length === 0 || isPasting}
                className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                  selectedTargetWeeks.length > 0 && !isPasting
                    ? 'bg-[#5A4E69] text-white hover:bg-[#292929]'
                    : 'bg-[#9B97A2] text-white cursor-not-allowed'
                }`}
              >
                {isPasting ? 'Pasting...' : `Paste to ${selectedTargetWeeks.length} Week${selectedTargetWeeks.length !== 1 ? 's' : ''}`}
              </button>
              <button
                onClick={() => setShowPasteModal(false)}
                disabled={isPasting}
                className="px-6 py-2 bg-[#9B97A2] text-white rounded hover:bg-[#707070] disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyDragDropScheduler;