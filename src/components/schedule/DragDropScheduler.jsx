// src/components/schedule/DragDropScheduler.jsx - Enhanced with copy/paste schedule + Individual Client Schedules
import React, { useState, useEffect, useRef } from 'react';
import { User, Trash2, MousePointer, CheckCircle, Copy, Clipboard, Calendar, X, AlertTriangle } from 'lucide-react';
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
import { AlertCard } from '../ui/Card';

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
  timeSlots,
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

  // FILTER OUT GRACE COACHES
  const activeCoaches = coaches.filter(c => 
    c.role === 'coach' && 
    (c.coachType || 'success') === 'success'
  );

  // UPDATED: Get clients based on individual schedules for selected date
  const getClientsForSelectedDate = () => {
    return getClientsAvailableForDate(clients, selectedDate);
  };

  // UPDATED: Get unscheduled and partially scheduled clients (with availability info)
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

  // NEW: Get fully scheduled clients (for greying out)
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

    // NEW: Check if client is available for this specific time slot
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
      const timeSlot = timeSlots.find(ts => ts.id === schedule.timeSlot);
      
      return {
        ...schedule,
        coachName: coach?.name || 'Unknown Coach',
        clientName: client?.name || 'Unknown Client',
        timeSlotLabel: timeSlot?.label || 'Unknown Time'
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
          
          // NEW: Check if client is available for this date and time slot
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
          
          // Check for existing assignments
          const existingAssignment = dailySchedules.find(s => 
            s.date === targetDate && 
            s.timeSlot === schedule.timeSlot && 
            s.coachId === schedule.coachId
          );

          if (!isCoachAvailable) {
            const status = availabilityActions.getCoachStatusForDate(schedule.coachId, targetDate);
            conflicts.push({
              ...schedule,
              reason: `Coach ${schedule.coachName} is ${status} on this date`
            });
          } else if (existingAssignment) {
            const existingClient = clients.find(c => c.id === existingAssignment.clientId);
            conflicts.push({
              ...schedule,
              reason: `${schedule.coachName} already has ${existingClient?.name} at ${schedule.timeSlotLabel}`
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

  // UPDATED: Render client card with availability info and greyed out state
  const renderClientCard = (client, isFullyScheduled = false) => {
    const isSelected = selectedClient?.id === client.id;
    const isDisabled = isFullyScheduled;
    
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
            {/* Show working schedule info */}
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
            {/* Show availability status */}
            <div className="text-xs text-center">
              {isFullyScheduled ? (
                <span className="text-red-600 font-medium">Fully Scheduled</span>
              ) : (
                <span className="text-green-600">{client.availableSlots}/{client.totalSlots} available today</span>
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
  const renderCoachColumn = (coach) => {
    const isAvailable = availabilityActions.isCoachAvailable(coach.uid || coach.id, selectedDate);
    const status = availabilityActions.getCoachStatusForDate(coach.uid || coach.id, selectedDate);
    const reason = availabilityActions.getCoachReasonForDate(coach.uid || coach.id, selectedDate);

    return (
      <div key={coach.uid || coach.id} className="flex-shrink-0 space-y-3">
        {/* Coach Header with Availability Status */}
        <div className={`h-16 w-80 flex items-center justify-center rounded-lg px-4 shadow-md ${
          isAvailable ? 'bg-[#6D858E]' : 'bg-red-500'
        }`}>
          <div className="text-center">
            <div className="font-semibold text-white text-lg">{coach.name}</div>
            <div className="text-xs text-[#BED2D8]">
              {isAvailable ? (
                `${dailySchedules.filter(s => 
                  s.date === selectedDate && 
                  s.coachId === (coach.uid || coach.id)
                ).length} sessions today`
              ) : (
                `${status}${reason ? ` - ${reason}` : ''}`
              )}
            </div>
          </div>
        </div>
        
        {/* Time Slots - Only show if coach is available */}
        {isAvailable ? (
          timeSlots.map(slot => {
            const assignments = dailySchedules.filter(s => 
              s.date === selectedDate && 
              s.timeSlot === slot.id && 
              s.coachId === (coach.uid || coach.id)
            );
            
            const canAssign = isAssigning && selectedClient && !selectedClient.isFullyScheduled;
            const isClickable = canAssign && selectedClient?.availableTimeSlots?.includes(slot.id);
            
            return (
              <div
                key={slot.id}
                onClick={() => isClickable && handleTimeSlotClick(coach.uid || coach.id, slot.id)}
                className={`min-h-32 w-80 border-2 rounded-lg p-4 transition-all duration-200 ${
                  isClickable 
                    ? 'border-[#6D858E] bg-[#BED2D8] cursor-pointer hover:shadow-lg hover:scale-105' 
                    : assignments.length > 0
                      ? 'border-[#6D858E] bg-[#BED2D8]' 
                      : 'border-[#9B97A2] bg-[#F5F5F5]'
                }`}
              >
                {/* Time Slot Header */}
                <div className="text-center mb-3 pb-2 border-b border-gray-300">
                  <div className="font-semibold text-sm text-[#292929]">{slot.start} - {slot.end}</div>
                  {isClickable && (
                    <div className="text-xs text-[#6D858E] font-medium mt-1">
                      Click to assign {selectedClient.name}
                    </div>
                  )}
                  {canAssign && !isClickable && selectedClient && (
                    <div className="text-xs text-red-600 font-medium mt-1">
                      {selectedClient.name} not available for this time
                    </div>
                  )}
                </div>

                {/* Assigned Clients */}
                {assignments.length > 0 ? (
                  <div className="space-y-2">
                    {assignments.map(assignment => {
                      const client = clients.find(c => c.id === assignment.clientId);
                      return (
                        <div key={assignment.id} className="bg-white border border-[#6D858E] rounded-lg p-3 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <div className="font-semibold text-sm text-[#292929] truncate">{client?.name}</div>
                                <span className={`text-xs px-2 py-1 rounded font-medium ${
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
                              <div className="text-xs text-[#707070] truncate mt-1">
                                {client?.program === 'limitless' ? client?.businessName :
                                 client?.program === 'new-options' ? 'Community Job Focus' :
                                 client?.program === 'bridges' ? 'Career Development' :
                                 client?.businessName || 'Program Participant'}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAssignment(assignment.id);
                              }}
                              className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                              title="Remove assignment"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-20 flex items-center justify-center text-[#9B97A2] text-sm">
                    {isClickable ? (
                      <div className="text-center text-[#6D858E] font-medium">
                        <MousePointer size={20} className="mx-auto mb-1" />
                        Click to assign here
                      </div>
                    ) : (
                      <div className="text-center">
                        <User size={20} className="mx-auto mb-1" />
                        No assignments
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // Show unavailable message for unavailable coaches
          <div className="w-80 p-4 bg-red-100 border-2 border-red-300 rounded-lg">
            <div className="text-center text-red-700">
              <AlertCard size={24} className="mx-auto mb-2" />
              <p className="font-medium">Coach Unavailable</p>
              <p className="text-sm">{status}</p>
              {reason && <p className="text-xs mt-1">{reason}</p>}
            </div>
          </div>
        )}
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
            <div className="font-medium">🔍 Smart Features:</div>
            <div>• Only shows clients available for the selected day</div>
            <div>• Prevents scheduling conflicts with individual client schedules</div>
            <div>• Greys out fully scheduled clients instead of hiding them</div>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="mb-8">
          <div className="flex gap-6 overflow-x-auto pb-4">
            {activeCoaches.map(renderCoachColumn)}
          </div>
          
          {activeCoaches.length > 1 && (
            <div className="text-center text-[#9B97A2] text-sm mt-2">
              ← Scroll horizontally to see all coaches →
            </div>
          )}
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