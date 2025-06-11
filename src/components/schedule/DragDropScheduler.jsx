// src/components/schedule/DragDropScheduler.jsx - FIXED: Horizontal layout + Multiple clients per coach

import React, { useState, useEffect, useRef } from 'react';
import { User, Trash2, MousePointer, CheckCircle, Copy, Clipboard, Calendar, X, AlertTriangle, Star } from 'lucide-react';
import { formatDatePST } from '../../utils/dateUtils';
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
import { AlertCard } from '../ui/Card';
import FlexibleSchedulingManager from './FlexibleScheduleManager';

const DragDropScheduler = ({ 
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
  timeSlots, // Core 3 slots only for main scheduling
  scheduleActions,
  availabilityActions 
}) => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Copy/Paste Schedule States
  const [copiedSchedule, setCopiedSchedule] = useState(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [selectedTargetDates, setSelectedTargetDates] = useState([]);
  const [pastePreview, setPastePreview] = useState([]);
  const [isPasting, setIsPasting] = useState(false);

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

  // FILTER OUT GRACE COACHES - only show Success coaches in main interface
  const activeCoaches = coaches.filter(c => 
    c.role === 'coach' && 
    (c.coachType || 'success') === 'success'
  );

  // Get clients based on individual schedules for selected date
  const getClientsForSelectedDate = () => {
    return getClientsAvailableForDate(clients, selectedDate);
  };

  // Get unscheduled and partially scheduled clients (with availability info)
  const getUnscheduledClients = () => {
    const availableClients = getClientsForSelectedDate();
    
    return availableClients.map(client => {
      const availability = getClientAvailabilityForDate(client, dailySchedules, selectedDate);
      return {
        ...client,
        ...availability
      };
    }).filter(client => client.availableSlots > 0); // Only clients with available slots
  };

  // Get fully scheduled clients (for greying out)
  const getFullyScheduledClients = () => {
    const availableClients = getClientsForSelectedDate();
    
    return availableClients.map(client => {
      const availability = getClientAvailabilityForDate(client, dailySchedules, selectedDate);
      return {
        ...client,
        ...availability
      };
    }).filter(client => client.isFullyScheduled);
  };

  const handleClientClick = (client) => {
    // Don't allow selection of fully scheduled clients
    if (client.isFullyScheduled) {
      return;
    }
    
    if (selectedClient?.id === client.id) {
      // Deselect if clicking the same client
      setSelectedClient(null);
      setIsAssigning(false);
    } else {
      // Select new client
      setSelectedClient(client);
      setIsAssigning(true);
    }
  };

  const handleTimeSlotClick = async (coachId, timeSlotId) => {
    if (!selectedClient || !isAssigning) return;

    // Check if coach is available on this date
    if (!availabilityActions.isCoachAvailable(coachId, selectedDate)) {
      const status = availabilityActions.getCoachStatusForDate(coachId, selectedDate);
      const reason = availabilityActions.getCoachReasonForDate(coachId, selectedDate);
      alert(`This coach is not available on ${selectedDate}. Status: ${status}${reason ? ` (${reason})` : ''}`);
      return;
    }

    // Check if client is available for this specific time slot
    const clientAvailableTimeSlots = selectedClient.availableTimeSlots || ['8-10', '10-12', '1230-230'];
    if (!clientAvailableTimeSlots.includes(timeSlotId)) {
      alert(`${selectedClient.name} is not available for the ${timeSlotId} time slot. Their available times are: ${formatAvailableTimeSlots(clientAvailableTimeSlots)}`);
      return;
    }

    // Check if client is already scheduled at this time
    const existingSchedule = dailySchedules.find(s => 
      s.date === selectedDate && 
      s.timeSlot === timeSlotId && 
      s.clientId === selectedClient.id
    );

    if (existingSchedule) {
      alert('This client is already scheduled for this time slot!');
      return;
    }

    try {
      await scheduleActions.add(selectedDate, timeSlotId, coachId, selectedClient.id);
      
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

  // COPY SCHEDULE FUNCTIONS
  const handleCopySchedule = () => {
    const todaySchedules = dailySchedules.filter(s => s.date === selectedDate);
    
    if (todaySchedules.length === 0) {
      alert('No schedule to copy for this date.');
      return;
    }

    // Create copy with coach and client details for preview
    const scheduleWithDetails = todaySchedules.map(schedule => {
      const coach = activeCoaches.find(c => (c.uid || c.id) === schedule.coachId);
      const client = clients.find(c => c.id === schedule.clientId);
      const timeSlotInfo = getTimeSlotInfo(schedule.timeSlot); // Use helper function
      
      return {
        ...schedule,
        coachName: coach?.name || 'Unknown Coach',
        clientName: client?.name || 'Unknown Client',
        timeSlotLabel: timeSlotInfo.label || 'Unknown Time'
      };
    });

    setCopiedSchedule({
      sourceDate: selectedDate,
      schedules: scheduleWithDetails,
      copiedAt: new Date().toISOString()
    });

    alert(`Copied ${todaySchedules.length} sessions from ${formatDatePST(selectedDate)}!`);
  };

  const handleShowPasteModal = () => {
    if (!copiedSchedule) {
      alert('No schedule copied. Please copy a schedule first.');
      return;
    }
    setShowPasteModal(true);
    setSelectedTargetDates([]);
    setPastePreview([]);
  };

  const handleTargetDateChange = (date, isChecked) => {
    if (isChecked) {
      setSelectedTargetDates(prev => [...prev, date]);
    } else {
      setSelectedTargetDates(prev => prev.filter(d => d !== date));
    }
  };

  // Generate paste preview when target dates change
  useEffect(() => {
    if (selectedTargetDates.length > 0 && copiedSchedule) {
      const preview = selectedTargetDates.map(targetDate => {
        const conflicts = [];
        const warnings = [];
        const validAssignments = [];

        copiedSchedule.schedules.forEach(schedule => {
          const client = clients.find(c => c.id === schedule.clientId);
          
          // Check if client is available for this date and time slot
          if (!client) {
            conflicts.push({
              ...schedule,
              reason: `Client no longer exists`
            });
            return;
          }
          
          const clientAvailableForDate = getClientsAvailableForDate([client], targetDate);
          if (clientAvailableForDate.length === 0) {
            conflicts.push({
              ...schedule,
              reason: `${client.name} doesn't work on ${new Date(targetDate + 'T12:00:00').toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'long' })}s`
            });
            return;
          }
          
          const clientAvailableTimeSlots = client.availableTimeSlots || ['8-10', '10-12', '1230-230'];
          if (!clientAvailableTimeSlots.includes(schedule.timeSlot)) {
            conflicts.push({
              ...schedule,
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
              reason: `Coach ${schedule.coachName} is ${status} on this date`
            });
          } else if (existingAssignment) {
            conflicts.push({
              ...schedule,
              reason: `${schedule.clientName} is already scheduled at ${schedule.timeSlotLabel} on this date`
            });
          } else {
            validAssignments.push(schedule);
          }
        });

        return {
          date: targetDate,
          validAssignments,
          conflicts,
          warnings
        };
      });

      setPastePreview(preview);
    }
  }, [selectedTargetDates, copiedSchedule, dailySchedules, availabilityActions, clients]);

  const handlePasteSchedule = async () => {
    if (selectedTargetDates.length === 0) {
      alert('Please select at least one target date.');
      return;
    }

    const totalValidAssignments = pastePreview.reduce((sum, day) => sum + day.validAssignments.length, 0);
    const totalConflicts = pastePreview.reduce((sum, day) => sum + day.conflicts.length, 0);

    if (totalValidAssignments === 0) {
      alert('No valid assignments can be made to the selected dates due to conflicts.');
      return;
    }

    const confirmMessage = `Ready to paste schedule:
• ${totalValidAssignments} assignments will be created
• ${totalConflicts} assignments will be skipped due to conflicts

Continue?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsPasting(true);

    try {
      let successCount = 0;

      for (const dayPreview of pastePreview) {
        for (const assignment of dayPreview.validAssignments) {
          try {
            await scheduleActions.add(
              dayPreview.date,
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
      setSelectedTargetDates([]);
      
    } catch (error) {
      alert(`Error pasting schedule: ${error.message}`);
    } finally {
      setIsPasting(false);
    }
  };

  // Generate next 14 days for date selection
  const getNextTwoWeeks = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  // Render client card with detailed time slot availability
  const renderClientCard = (client, isFullyScheduled = false) => {
    const isSelected = selectedClient?.id === client.id;
    const isDisabled = isFullyScheduled;
    
    // Get detailed time slot information for this client on the selected date
    const clientAvailableTimeSlots = client.availableTimeSlots || ['8-10', '10-12', '1230-230'];
    const scheduledTimeSlots = dailySchedules
      .filter(s => s.date === selectedDate && s.clientId === client.id)
      .map(s => s.timeSlot);
    
    const availableTimeSlots = clientAvailableTimeSlots.filter(slot => !scheduledTimeSlots.includes(slot));
    
    // Time slot display info - using helper function for flexible lookup
    const getTimeSlotLabel = (slotId) => {
      const slotInfo = getTimeSlotInfo(slotId);
      return slotInfo.label || slotId;
    };
    
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
        <div className="flex items-start space-x-3">
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
            
            {/* Detailed Time Slot Availability */}
            <div className="text-xs mt-2">
              {/* Working Days Info */}
              <div className="text-[#9B97A2] mb-1">
                Works: {formatWorkingDays(client.workingDays)}
              </div>
              
              {/* Time Slot Breakdown */}
              <div className="space-y-1">
                <div className="text-[#707070] font-medium">Today's Schedule:</div>
                
                {/* Available Time Slots */}
                {availableTimeSlots.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-green-700 font-medium">Available:</span>
                    {availableTimeSlots.map(slot => (
                      <span 
                        key={slot}
                        className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded border"
                      >
                        {getTimeSlotLabel(slot)}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Scheduled Time Slots */}
                {scheduledTimeSlots.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-blue-700 font-medium">Scheduled:</span>
                    {scheduledTimeSlots.map(slot => {
                      const schedule = dailySchedules.find(s => 
                        s.date === selectedDate && 
                        s.clientId === client.id && 
                        s.timeSlot === slot
                      );
                      const coach = activeCoaches.find(c => (c.uid || c.id) === schedule?.coachId);
                      const isSpecial = isSpecialTimeSlot(slot);
                      
                      return (
                        <span 
                          key={slot}
                          className={`text-xs px-1 py-0.5 rounded border ${
                            isSpecial 
                              ? 'bg-orange-100 text-orange-800 border-orange-300' 
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}
                          title={`${coach?.name || 'Unknown Coach'}${isSpecial ? ' (Special Schedule)' : ''}`}
                        >
                          {isSpecial && <Star size={8} className="inline mr-1" />}
                          {getTimeSlotLabel(slot)}
                        </span>
                      );
                    })}
                  </div>
                )}
                
                {/* Unavailable Time Slots (client doesn't work these hours) */}
                {timeSlots.some(slot => !clientAvailableTimeSlots.includes(slot.id)) && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-gray-600 font-medium">Not Available:</span>
                    {timeSlots
                      .filter(slot => !clientAvailableTimeSlots.includes(slot.id))
                      .map(slot => (
                        <span 
                          key={slot.id}
                          className="text-xs bg-gray-100 text-gray-600 px-1 py-0.5 rounded border"
                        >
                          {slot.label}
                        </span>
                      ))}
                  </div>
                )}
              </div>
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
            
            {/* Summary Status */}
            <div className="text-xs text-center">
              {isFullyScheduled ? (
                <span className="text-red-600 font-medium">Fully Scheduled</span>
              ) : availableTimeSlots.length === 0 ? (
                <span className="text-yellow-600 font-medium">No Available Slots</span>
              ) : (
                <span className="text-green-600 font-medium">
                  {availableTimeSlots.length} slot{availableTimeSlots.length !== 1 ? 's' : ''} open
                </span>
              )}
            </div>
            
            {isSelected && !isDisabled && (
              <div className="text-xs text-[#6D858E] font-medium">
                Click time slot ↑
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const unscheduledClients = getUnscheduledClients();
  const fullyScheduledClients = getFullyScheduledClients();
  const displayDate = formatDatePST(selectedDate);
  const todaySchedules = dailySchedules.filter(s => s.date === selectedDate);
  const hasScheduleToday = todaySchedules.length > 0;

  if (activeCoaches.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center py-12">
          <User size={48} className="mx-auto mb-4 text-[#9B97A2]" />
          <h3 className="text-lg font-semibold text-[#292929] mb-2">No Available Coaches</h3>
          <p className="text-[#707070]">All Success coaches are unavailable for this date.</p>
          <p className="text-sm text-[#9B97A2] mt-2">
            Check the Coach Availability tab to manage coach schedules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Copy/Paste Controls */}
      <div className="bg-[#F5F5F5] p-4 rounded-lg border-l-4 border-[#5A4E69]">
        <h4 className="font-semibold text-[#292929] mb-3">📋 Schedule Copy & Paste</h4>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopySchedule}
            disabled={!hasScheduleToday}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              hasScheduleToday 
                ? 'bg-[#5A4E69] text-white hover:bg-[#292929]' 
                : 'bg-[#9B97A2] text-white cursor-not-allowed'
            }`}
          >
            <Copy size={16} />
            <span>Copy Today's Schedule</span>
          </button>
          
          <button
            onClick={handleShowPasteModal}
            disabled={!copiedSchedule}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              copiedSchedule 
                ? 'bg-[#6D858E] text-white hover:bg-[#5A4E69]' 
                : 'bg-[#9B97A2] text-white cursor-not-allowed'
            }`}
          >
            <Clipboard size={16} />
            <span>Paste to Other Days</span>
          </button>
          
          {copiedSchedule && (
            <div className="text-sm text-[#707070] bg-white px-3 py-2 rounded border">
              ✅ Copied {copiedSchedule.schedules.length} sessions from {formatDatePST(copiedSchedule.sourceDate)}
            </div>
          )}
          
          {!hasScheduleToday && (
            <div className="text-sm text-[#9B97A2]">
              ℹ️ No schedule to copy for today
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-6 text-[#292929]">
          Smart Scheduler for {displayDate}
          {isAssigning && selectedClient && (
            <span className="ml-4 text-sm text-[#6D858E] bg-[#BED2D8] px-3 py-1 rounded-full">
              Assigning: {selectedClient.name} - Click a time slot above
            </span>
          )}
        </h3>
        
        {/* Instructions */}
        <div className="mb-6 p-4 bg-[#BED2D8] rounded-lg border-l-4 border-[#6D858E]">
          <h4 className="font-semibold text-[#292929] mb-2">How to Schedule:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#292929]">
            <div>
              <div className="font-medium mb-1">Step 1: Click a client below</div>
              <div>The client card will turn blue and get a checkmark</div>
            </div>
            <div>
              <div className="font-medium mb-1">Step 2: Click a time slot above</div>
              <div>The client will be instantly assigned to that coach and time</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-[#292929]">
            <div className="font-medium">🔍 Core Schedule Times:</div>
            <div>• <strong>8:00 AM - 10:00 AM</strong> • <strong>10:00 AM - 12:00 PM</strong> • <strong>12:30 PM - 2:30 PM</strong></div>
            <div className="mt-1 text-xs">For special scheduling (early hours, weekends, etc.), use the Special Scheduling section below.</div>
          </div>
        </div>

        {/* Schedule Grid - UPDATED: Horizontal Layout like Weekly View */}
        <div className="mb-8 overflow-hidden">
          {/* Sticky Coach Headers */}
          <div className="sticky top-0 bg-white z-10 border-b-2 border-[#6D858E] mb-4">
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${activeCoaches.length}, minmax(200px, 1fr))` }}>
              {activeCoaches.map(coach => {
                // Count both core and special schedules for this coach
                const allAssignments = dailySchedules.filter(s => 
                  s.date === selectedDate && 
                  s.coachId === (coach.uid || coach.id)
                );
                
                const specialAssignments = allAssignments.filter(s => isSpecialTimeSlot(s.timeSlot));
                const isAvailable = availabilityActions.isCoachAvailable(coach.uid || coach.id, selectedDate);
                const status = availabilityActions.getCoachStatusForDate(coach.uid || coach.id, selectedDate);
                const reason = availabilityActions.getCoachReasonForDate(coach.uid || coach.id, selectedDate);
                
                return (
                  <div key={coach.uid || coach.id} className={`p-4 text-center text-white ${
                    isAvailable ? 'bg-[#6D858E]' : 'bg-red-500'
                  }`}>
                    <div className="font-semibold text-lg">{coach.name}</div>
                    <div className="text-xs text-[#BED2D8]">
                      {isAvailable ? (
                        <>
                          {allAssignments.length} sessions today
                          {specialAssignments.length > 0 && (
                            <div className="flex items-center justify-center space-x-1 mt-1">
                              <Star size={12} />
                              <span>{specialAssignments.length} special</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {status}{reason ? ` - ${reason}` : ''}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Show Special Schedules Summary */}
          {dailySchedules.some(s => s.date === selectedDate && isSpecialTimeSlot(s.timeSlot)) && (
            <div className="mb-6 p-3 bg-orange-50 border-l-4 border-orange-400 rounded">
              <div className="flex items-center space-x-2">
                <Star className="text-orange-500" size={16} />
                <div className="text-sm text-orange-700">
                  <div className="font-medium">Special Schedules Today</div>
                  {activeCoaches.map(coach => {
                    const specialSchedules = dailySchedules.filter(s => 
                      s.date === selectedDate && 
                      s.coachId === (coach.uid || coach.id) && 
                      isSpecialTimeSlot(s.timeSlot)
                    );
                    if (specialSchedules.length === 0) return null;
                    
                    return (
                      <div key={coach.uid || coach.id} className="text-xs">
                        {coach.name}: {specialSchedules.length} special schedule{specialSchedules.length !== 1 ? 's' : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Time Slots Grid - Horizontal Layout */}
          <div className="space-y-0">
            {timeSlots.map(slot => (
              <div key={slot.id} className="border-b border-gray-200">
                {/* Time Slot Header */}
                <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: `repeat(${activeCoaches.length}, minmax(200px, 1fr))` }}>
                  {activeCoaches.map(coach => (
                    <div key={`${slot.id}-header-${coach.uid || coach.id}`} 
                         className="text-center p-2 border-r border-gray-200 font-semibold bg-[#F5F5F5] text-[#292929]">
                      <div>{slot.start} - {slot.end}</div>
                    </div>
                  ))}
                </div>
                
                {/* Coach Slots for this Time */}
                <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: `repeat(${activeCoaches.length}, minmax(200px, 1fr))` }}>
                  {activeCoaches.map(coach => {
                    const coachId = coach.uid || coach.id;
                    const isAvailable = availabilityActions.isCoachAvailable(coachId, selectedDate);
                    const assignments = dailySchedules.filter(s => 
                      s.date === selectedDate && 
                      s.timeSlot === slot.id && 
                      s.coachId === coachId
                    );
                    const canAssign = isAssigning && selectedClient && isAvailable;
                    const isClickable = canAssign && selectedClient?.availableTimeSlots?.includes(slot.id);
                    
                    return (
                      <div
                        key={`${slot.id}-${coachId}`}
                        onClick={() => isClickable && handleTimeSlotClick(coachId, slot.id)}
                        className={`min-h-32 min-w-0 p-3 border-r border-b border-gray-200 transition-all ${
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
                          <div className="text-center text-red-600">
                            <AlertTriangle size={16} className="mx-auto mb-1" />
                            <div className="text-xs">Unavailable</div>
                          </div>
                        ) : assignments.length > 0 ? (
                          <div className="space-y-2">
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
                                      <span className={`text-xs px-1 py-0.5 rounded font-medium ${
                                        client?.program === 'limitless' ? 'bg-[#BED2D8] text-[#292929]' :
                                        client?.program === 'new-options' ? 'bg-[#BED2D8] text-[#292929]' :
                                        client?.program === 'bridges' ? 'bg-[#BED2D8] text-[#292929]' :
                                        'bg-[#F5F5F5] text-[#292929]'
                                      }`}>
                                        {client?.program === 'limitless' ? 'L' :
                                         client?.program === 'new-options' ? 'NO' :
                                         client?.program === 'bridges' ? 'B' :
                                         'L'}
                                      </span>
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
              </div>
            ))}
          </div>
        </div>

        {/* Available Clients */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-semibold mb-4 text-[#292929]">
            Clients Available for {displayDate}
            <span className="text-sm text-[#9B97A2] ml-2">
              ({unscheduledClients.length} with slots available, {fullyScheduledClients.length} fully scheduled)
            </span>
          </h4>

          {selectedClient && (
            <div className="mb-4 p-3 bg-[#6D858E] text-white rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle size={20} />
                <div>
                  <div className="font-medium">{selectedClient.name} is selected</div>
                  <div className="text-sm text-[#BED2D8]">
                    Available for: {formatAvailableTimeSlots(selectedClient.availableTimeSlots)} | 
                    {selectedClient.availableSlots} of {selectedClient.totalSlots} slots remaining
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

          {/* Clients with Available Slots */}
          {unscheduledClients.length > 0 && (
            <div className="mb-6">
              <h5 className="font-medium text-[#292929] mb-3">Available for Scheduling:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unscheduledClients.map(client => renderClientCard(client, false))}
              </div>
            </div>
          )}

          {/* Fully Scheduled Clients (Greyed Out) */}
          {fullyScheduledClients.length > 0 && (
            <div className="mb-6">
              <h5 className="font-medium text-[#707070] mb-3">Fully Scheduled (All Available Slots Filled):</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fullyScheduledClients.map(client => renderClientCard(client, true))}
              </div>
            </div>
          )}

          {/* No clients available message */}
          {unscheduledClients.length === 0 && fullyScheduledClients.length === 0 && (
            <div className="text-center py-12 text-[#9B97A2]">
              <User size={48} className="mx-auto mb-4" />
              <p className="text-lg font-medium">No clients work on {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'long' })}s!</p>
              <p className="text-sm mt-2">Check individual client schedules in the Admin Panel to see their working days.</p>
            </div>
          )}
        </div>
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

      {/* Paste Schedule Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-[#5A4E69] text-white">
              <h3 className="text-lg font-semibold">📋 Paste Schedule to Other Days</h3>
              <button 
                onClick={() => setShowPasteModal(false)} 
                className="text-white hover:text-gray-200 text-2xl"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              {/* Source Schedule Display */}
              <div className="mb-6">
                <h4 className="font-semibold text-[#292929] mb-2">
                  Source: {formatDatePST(copiedSchedule.sourceDate)} ({copiedSchedule.schedules.length} sessions)
                </h4>
                <div className="bg-[#F5F5F5] p-3 rounded border">
                  {copiedSchedule.schedules.map((schedule, index) => (
                    <div key={index} className="text-sm text-[#292929]">
                      • {schedule.timeSlotLabel}: {schedule.clientName} with {schedule.coachName}
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Date Selection */}
              <div className="mb-6">
                <h4 className="font-semibold text-[#292929] mb-3">Select Target Dates:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                  {getNextTwoWeeks().map(date => (
                    <label key={date} className="flex items-center space-x-2 p-2 border rounded hover:bg-[#F5F5F5] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTargetDates.includes(date)}
                        onChange={(e) => handleTargetDateChange(date, e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                          timeZone: 'America/Los_Angeles',
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Paste Preview */}
              {pastePreview.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-[#292929] mb-3">Paste Preview:</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {pastePreview.map(dayPreview => (
                      <div key={dayPreview.date} className="border rounded p-3">
                        <h5 className="font-medium text-[#292929] mb-2">
                          {formatDatePST(dayPreview.date)}
                        </h5>
                        
                        {dayPreview.validAssignments.length > 0 && (
                          <div className="mb-2">
                            <div className="text-sm text-green-600 font-medium mb-1">
                              ✅ Will Create ({dayPreview.validAssignments.length}):
                            </div>
                            {dayPreview.validAssignments.map((assignment, index) => (
                              <div key={index} className="text-sm text-green-700 ml-4">
                                • {assignment.timeSlotLabel}: {assignment.clientName} with {assignment.coachName}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {dayPreview.conflicts.length > 0 && (
                          <div>
                            <div className="text-sm text-red-600 font-medium mb-1">
                              ⚠️ Will Skip ({dayPreview.conflicts.length}):
                            </div>
                            {dayPreview.conflicts.map((conflict, index) => (
                              <div key={index} className="text-sm text-red-700 ml-4">
                                • {conflict.timeSlotLabel}: {conflict.clientName} - {conflict.reason}
                              </div>
                            ))}
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
                onClick={handlePasteSchedule}
                disabled={selectedTargetDates.length === 0 || isPasting}
                className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                  selectedTargetDates.length > 0 && !isPasting
                    ? 'bg-[#5A4E69] text-white hover:bg-[#292929]'
                    : 'bg-[#9B97A2] text-white cursor-not-allowed'
                }`}
              >
                {isPasting ? 'Pasting...' : `Paste to ${selectedTargetDates.length} Days`}
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

export default DragDropScheduler;