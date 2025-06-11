// src/components/schedule/FlexibleScheduleManager.jsx - UPDATED: Uses special time slots only

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Plus, 
  User, 
  CheckCircle,
  X,
  Star,
  MapPin
} from 'lucide-react';
import { formatDatePST, getPSTDate } from '../../utils/dateUtils';
import { getSchedulableClients, getClientInitials } from '../../utils/helpers';
import { SPECIAL_TIME_SLOTS, getAllTimeSlots } from '../../utils/constants';

const FlexibleSchedulingManager = ({ 
  selectedDate,
  clients = [],
  coaches = [],
  schedules = [],
  scheduleActions,
  availabilityActions
}) => {
  const [showSpecialScheduling, setShowSpecialScheduling] = useState(false);
  const [specialDate, setSpecialDate] = useState(selectedDate);
  const [selectedSpecialClient, setSelectedSpecialClient] = useState(null);
  const [specialTimeSlot, setSpecialTimeSlot] = useState('');
  const [selectedCoach, setSelectedCoach] = useState('');
  const [specialReason, setSpecialReason] = useState('');
  const [specialType, setSpecialType] = useState(''); // 'weekend', 'early', 'off-day'

  // Reset form when modal closes
  useEffect(() => {
    if (!showSpecialScheduling) {
      setSelectedSpecialClient(null);
      setSpecialTimeSlot('');
      setSelectedCoach('');
      setSpecialReason('');
      setSpecialType('');
    }
  }, [showSpecialScheduling]);

  // Get all schedulable clients (not just those normally available for this date)
  const getAllSchedulableClients = () => {
    return getSchedulableClients(clients);
  };

  // Get clients who normally wouldn't work on this date
  const getOffDayClients = () => {
    const dateObj = new Date(specialDate + 'T12:00:00');
    const dayName = dateObj.toLocaleDateString('en-US', { 
      timeZone: 'America/Los_Angeles',
      weekday: 'long' 
    }).toLowerCase();
    
    return getAllSchedulableClients().filter(client => {
      const workingDays = client.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      return !workingDays.includes(dayName);
    });
  };

  // Get clients available for special time slots
  const getClientsForSpecialTime = () => {
    if (specialType === 'off-day') {
      return getOffDayClients();
    }
    
    // For early or weekend slots, return all schedulable clients
    return getAllSchedulableClients().filter(client => {
      // Check if they're not already fully scheduled for their normal slots
      const clientSchedules = schedules.filter(s => 
        s.clientId === client.id && s.date === specialDate
      );
      const maxSlots = client.availableTimeSlots?.length || 3;
      return clientSchedules.length < maxSlots;
    });
  };

  // Get available coaches for special scheduling (Success coaches only)
  const getAvailableCoachesForSpecial = () => {
    return coaches.filter(coach => {
      // Filter out Grace coaches for special scheduling
      if ((coach.coachType || 'success') === 'grace') return false;
      
      // Check if coach is available (not marked unavailable)
      const isAvailable = availabilityActions.isCoachAvailable(coach.uid || coach.id, specialDate);
      return isAvailable;
    });
  };

  // Get special time slots based on type
  const getSpecialTimeSlots = () => {
    switch (specialType) {
      case 'early':
        return SPECIAL_TIME_SLOTS.filter(slot => slot.type === 'early');
      case 'weekend':
        return SPECIAL_TIME_SLOTS.filter(slot => slot.type === 'weekend' || slot.type === 'custom');
      case 'off-day':
        return getAllTimeSlots(); // All slots (core + special) available for off-day scheduling
      default:
        return SPECIAL_TIME_SLOTS;
    }
  };

  // Determine special scheduling type based on date and time
  const determineSpecialType = (date, timeSlot) => {
    const dateObj = new Date(date + 'T12:00:00');
    const dayName = dateObj.toLocaleDateString('en-US', { 
      timeZone: 'America/Los_Angeles',
      weekday: 'long' 
    }).toLowerCase();
    
    const isWeekend = dayName === 'saturday' || dayName === 'sunday';
    const specialSlot = SPECIAL_TIME_SLOTS.find(slot => slot.id === timeSlot);
    
    if (isWeekend || (specialSlot && specialSlot.type === 'weekend')) return 'weekend';
    if (specialSlot && specialSlot.type === 'early') return 'early';
    if (specialSlot && specialSlot.type === 'extended') return 'extended';
    return 'off-day';
  };

  // Handle special scheduling submission
  const handleSpecialScheduling = async () => {
    if (!selectedSpecialClient || !specialTimeSlot || !selectedCoach || !specialReason.trim()) {
      alert('Please fill in all required fields including the reason for special scheduling.');
      return;
    }

    try {
      // Add the schedule
      await scheduleActions.add(specialDate, specialTimeSlot, selectedCoach, selectedSpecialClient.id);
      
      // Log the special scheduling reason (you might want to store this in a special field)
      console.log('Special scheduling created:', {
        client: selectedSpecialClient.name,
        date: specialDate,
        timeSlot: specialTimeSlot,
        type: specialType,
        reason: specialReason
      });
      
      const allTimeSlots = getAllTimeSlots();
      const timeSlotInfo = allTimeSlots.find(s => s.id === specialTimeSlot);
      
      alert(`Special scheduling created successfully!\n\nClient: ${selectedSpecialClient.name}\nDate: ${formatDatePST(specialDate)}\nTime: ${timeSlotInfo?.label || specialTimeSlot}\nType: ${specialType}\nReason: ${specialReason}`);
      
      setShowSpecialScheduling(false);
    } catch (error) {
      alert(`Error creating special schedule: ${error.message}`);
    }
  };

  // Check if date/time combination requires special scheduling
  const isSpecialSchedulingNeeded = (date, clientId, timeSlot) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return false;

    const dateObj = new Date(date + 'T12:00:00');
    const dayName = dateObj.toLocaleDateString('en-US', { 
      timeZone: 'America/Los_Angeles',
      weekday: 'long' 
    }).toLowerCase();
    
    const workingDays = client.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const availableTimeSlots = client.availableTimeSlots || ['8-10', '10-12', '1230-230'];
    
    const isOffDay = !workingDays.includes(dayName);
    const isOffTime = !availableTimeSlots.includes(timeSlot);
    const isSpecialSlot = SPECIAL_TIME_SLOTS.some(slot => slot.id === timeSlot);
    
    return isOffDay || isOffTime || isSpecialSlot;
  };

  // Get existing special schedules for display
  const getSpecialSchedules = () => {
    return schedules.filter(schedule => {
      const client = clients.find(c => c.id === schedule.clientId);
      return isSpecialSchedulingNeeded(schedule.date, schedule.clientId, schedule.timeSlot);
    });
  };

  const specialSchedules = getSpecialSchedules();
  const availableClients = getClientsForSpecialTime();
  const availableCoaches = getAvailableCoachesForSpecial();
  const specialTimeSlots = getSpecialTimeSlots();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#292929] flex items-center">
            <Star className="mr-2 text-orange-500" size={20} />
            Special Scheduling Manager
          </h3>
          <p className="text-sm text-[#707070] mt-1">
            Handle weekend events, early hours, late hours, and off-day scheduling
          </p>
        </div>
        
        <button
          onClick={() => setShowSpecialScheduling(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Special Schedule</span>
        </button>
      </div>

      {/* Existing Special Schedules */}
      {specialSchedules.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-[#292929] mb-2">Current Special Schedules:</h4>
          <div className="space-y-2">
            {specialSchedules.map(schedule => {
              const client = clients.find(c => c.id === schedule.clientId);
              const coach = coaches.find(c => (c.uid || c.id) === schedule.coachId);
              const allTimeSlots = getAllTimeSlots();
              const timeSlot = allTimeSlots.find(s => s.id === schedule.timeSlot);
              const type = determineSpecialType(schedule.date, schedule.timeSlot);
              
              return (
                <div key={schedule.id} className="bg-orange-50 border border-orange-200 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-[#292929]">
                        {client?.name} with {coach?.name}
                      </div>
                      <div className="text-sm text-[#707070]">
                        {formatDatePST(schedule.date)} • {timeSlot?.label || schedule.timeSlot}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                        type === 'weekend' ? 'bg-purple-100 text-purple-800' :
                        type === 'early' ? 'bg-blue-100 text-blue-800' :
                        type === 'extended' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {type === 'weekend' ? '🎪 Weekend Event' :
                         type === 'early' ? '🌅 Early Hour' :
                         type === 'extended' ? '⏰ Extended Hour' :
                         '📅 Off Day'}
                      </span>
                    </div>
                    <button
                      onClick={() => scheduleActions.remove(schedule.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remove special schedule"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Special Scheduling Modal */}
      {showSpecialScheduling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-orange-500 text-white">
              <h3 className="text-lg font-semibold">Create Special Schedule</h3>
              <button 
                onClick={() => setShowSpecialScheduling(false)} 
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-4 space-y-4">
              {/* Special Schedule Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Special Schedule Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setSpecialType('weekend')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      specialType === 'weekend' 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🎪</div>
                      <div className="font-medium">Weekend Event</div>
                      <div className="text-xs">Saturday/Sunday</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSpecialType('early')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      specialType === 'early' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🌅</div>
                      <div className="font-medium">Early Hours</div>
                      <div className="text-xs">Before 8:00 AM</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSpecialType('off-day')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      specialType === 'off-day' 
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700' 
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">📅</div>
                      <div className="font-medium">Off Day</div>
                      <div className="text-xs">Non-working day</div>
                    </div>
                  </button>
                </div>
              </div>

              {specialType && (
                <>
                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Date *</label>
                    <input
                      type="date"
                      value={specialDate}
                      onChange={(e) => setSpecialDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Time Slot Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Time Slot *</label>
                    <select
                      value={specialTimeSlot}
                      onChange={(e) => setSpecialTimeSlot(e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Time Slot</option>
                      {specialTimeSlots.map(slot => (
                        <option key={slot.id} value={slot.id}>{slot.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Client Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Client *</label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2">
                      {availableClients.length > 0 ? (
                        <div className="space-y-2">
                          {availableClients.map(client => (
                            <div
                              key={client.id}
                              onClick={() => setSelectedSpecialClient(client)}
                              className={`p-2 rounded cursor-pointer border-2 transition-colors ${
                                selectedSpecialClient?.id === client.id
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-200 hover:border-orange-300'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  selectedSpecialClient?.id === client.id ? 'bg-orange-500' : 'bg-[#9B97A2]'
                                }`}>
                                  {selectedSpecialClient?.id === client.id ? (
                                    <CheckCircle className="text-white" size={16} />
                                  ) : (
                                    <span className="text-white text-xs font-medium">
                                      {getClientInitials(client.name)}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-[#292929]">{client.name}</div>
                                  <div className="text-xs text-[#707070]">
                                    {client.program === 'limitless' ? client.businessName :
                                     client.program === 'new-options' ? 'Community Job' :
                                     client.program === 'bridges' ? 'Career Development' :
                                     'Program Participant'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-[#9B97A2]">
                          <AlertTriangle size={24} className="mx-auto mb-2" />
                          <p>No clients available for this special schedule type</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Coach Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Coach *</label>
                    <select
                      value={selectedCoach}
                      onChange={(e) => setSelectedCoach(e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Coach</option>
                      {availableCoaches.map(coach => (
                        <option key={coach.uid || coach.id} value={coach.uid || coach.id}>
                          {coach.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reason for Special Scheduling */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Reason for Special Scheduling *</label>
                    <textarea
                      value={specialReason}
                      onChange={(e) => setSpecialReason(e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                      rows="3"
                      placeholder={
                        specialType === 'weekend' ? 'e.g., Special weekend community event, volunteer opportunity' :
                        specialType === 'early' ? 'e.g., Early morning work requirement, special appointment' :
                        'e.g., Making up missed session, special project deadline'
                      }
                    />
                  </div>

                  {/* Warning/Info based on type */}
                  <div className={`p-3 rounded border-l-4 ${
                    specialType === 'weekend' ? 'bg-purple-50 border-purple-400 text-purple-700' :
                    specialType === 'early' ? 'bg-blue-50 border-blue-400 text-blue-700' :
                    'bg-yellow-50 border-yellow-400 text-yellow-700'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <AlertTriangle size={16} className="mt-0.5" />
                      <div className="text-sm">
                        {specialType === 'weekend' && 'This client will be scheduled for a weekend event or special activity.'}
                        {specialType === 'early' && 'This client will be scheduled before their normal working hours.'}
                        {specialType === 'off-day' && 'This client will be scheduled on a day they normally don\'t work.'}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex space-x-3 p-6 border-t bg-[#F5F5F5]">
              <button
                onClick={handleSpecialScheduling}
                disabled={!selectedSpecialClient || !specialTimeSlot || !selectedCoach || !specialReason.trim()}
                className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                  selectedSpecialClient && specialTimeSlot && selectedCoach && specialReason.trim()
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-[#9B97A2] text-white cursor-not-allowed'
                }`}
              >
                Create Special Schedule
              </button>
              <button
                onClick={() => setShowSpecialScheduling(false)}
                className="px-6 py-2 bg-[#9B97A2] text-white rounded hover:bg-[#707070]"
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

export default FlexibleSchedulingManager;