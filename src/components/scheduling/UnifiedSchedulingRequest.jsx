// src/components/scheduling/UnifiedSchedulingRequest.jsx - Client-facing coordinator scheduling
import React, { useState } from 'react';
import { Clock, Calendar, Send, AlertCircle, XCircle, User, Wrench, Briefcase, ClipboardList } from 'lucide-react';
import { getPSTDate, formatDatePST } from '../../utils/dateUtils';
import { 
  COORDINATORS, 
  getAvailableCoordinators, 
  getCoordinatorById,
  MAKERSPACE_TIME_SLOTS 
} from '../../utils/constants';

const UnifiedSchedulingRequest = ({ 
  userProfile, 
  clients, 
  makerspaceActions,
  existingRequests = [],
  makerspaceSchedule = [],
  walkthroughs = []
}) => {
  // Find the current client's data
  const clientData = clients.find(c => c.email === userProfile.email) || clients[0];
  
  const [selectedCoordinator, setSelectedCoordinator] = useState('makerspace');
  const [formData, setFormData] = useState({
    coordinatorType: 'makerspace',
    date: '',
    timeSlot: '',
    purpose: '',
    description: '',
    equipment: [],
    estimatedDuration: '2',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictWarning, setConflictWarning] = useState('');

  if (!clientData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <p className="text-red-600">No client data found. Please contact your coach.</p>
      </div>
    );
  }

  // Get coordinators available to this client based on their program
  const availableCoordinators = getAvailableCoordinators(clientData.program || 'limitless');
  const currentCoordinator = getCoordinatorById(selectedCoordinator);

  // Check if a time slot is already booked
  const checkTimeSlotAvailability = (date, timeSlot, coordinatorType) => {
    if (!date || !timeSlot) return { available: true, conflicts: [] };

    const conflicts = [];

    // For makerspace coordinator, check existing makerspace bookings
    if (coordinatorType === 'makerspace') {
      // Check existing makerspace schedule
      const scheduleConflict = makerspaceSchedule.find(entry => 
        entry.date === date && entry.timeSlot === timeSlot
      );
      if (scheduleConflict) {
        conflicts.push({
          type: 'makerspace_session',
          details: `${scheduleConflict.clientName || 'Another client'} - ${scheduleConflict.purpose || 'Makerspace session'}`
        });
      }

      // Check walkthroughs
      const walkthroughConflict = walkthroughs.find(walkthrough => 
        walkthrough.date === date && walkthrough.timeSlot === timeSlot && walkthrough.status !== 'cancelled'
      );
      if (walkthroughConflict) {
        conflicts.push({
          type: 'walkthrough',
          details: `Equipment walkthrough/training for ${walkthroughConflict.clientName || 'client'}`
        });
      }
    }

    // Check other pending/approved coordinator requests for same coordinator type
    const requestConflict = existingRequests.find(request => 
      request.date === date && 
      request.timeSlot === timeSlot && 
      request.coordinatorType === coordinatorType &&
      request.clientId !== clientData?.id &&
      ['pending', 'approved'].includes(request.status)
    );
    if (requestConflict) {
      conflicts.push({
        type: 'coordinator_request',
        details: `${requestConflict.status === 'pending' ? 'Pending request' : 'Approved session'} for ${requestConflict.clientName}`
      });
    }

    return {
      available: conflicts.length === 0,
      conflicts
    };
  };

  // Update conflict warning when date/timeSlot/coordinator changes
  const updateConflictWarning = (date, timeSlot, coordinatorType) => {
    const availability = checkTimeSlotAvailability(date, timeSlot, coordinatorType);
    
    if (!availability.available) {
      const conflictMessages = availability.conflicts.map(conflict => {
        switch (conflict.type) {
          case 'makerspace_session':
            return `🔧 ${conflict.details}`;
          case 'walkthrough':
            return `👥 ${conflict.details}`;
          case 'coordinator_request':
            return `📋 ${conflict.details}`;
          default:
            return `⚠️ ${conflict.details}`;
        }
      });
      
      setConflictWarning(`This time slot is already booked:\n${conflictMessages.join('\n')}`);
    } else {
      setConflictWarning('');
    }
  };

  const handleCoordinatorChange = (coordinatorId) => {
    setSelectedCoordinator(coordinatorId);
    const coordinator = getCoordinatorById(coordinatorId);
    
    setFormData({
      ...formData,
      coordinatorType: coordinatorId,
      equipment: coordinator.id === 'makerspace' ? [] : [], // Reset equipment for non-makerspace
      purpose: '', // Reset purpose when switching
      description: ''
    });
    
    // Clear conflict warning when switching coordinators
    setConflictWarning('');
    setErrors({});
  };

  const handleDateTimeChange = (field, value) => {
    const updatedFormData = { ...formData, [field]: value };
    setFormData(updatedFormData);
    
    // Check for conflicts when both date and timeSlot are set
    if (updatedFormData.date && updatedFormData.timeSlot) {
      updateConflictWarning(updatedFormData.date, updatedFormData.timeSlot, updatedFormData.coordinatorType);
    } else {
      setConflictWarning('');
    }
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEquipmentChange = (equipmentId, isChecked) => {
    if (isChecked) {
      setFormData({
        ...formData,
        equipment: [...formData.equipment, equipmentId]
      });
    } else {
      setFormData({
        ...formData,
        equipment: formData.equipment.filter(id => id !== equipmentId)
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!selectedCoordinator) newErrors.coordinator = 'Please select a coordinator';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.timeSlot) newErrors.timeSlot = 'Time slot is required';
    if (!formData.purpose) newErrors.purpose = 'Purpose is required';
    
    // Equipment validation for makerspace only
    if (selectedCoordinator === 'makerspace' && formData.equipment.length === 0) {
      newErrors.equipment = 'At least one equipment selection is required for makerspace time';
    }
    
    // Check if date is in the past
    const today = getPSTDate();
    if (formData.date < today) {
      newErrors.date = 'Cannot request time for past dates';
    }
    
    // Check if there's already a request for this date/time from this client with this coordinator
    const existingRequest = existingRequests.find(req => 
      req.clientId === clientData.id &&
      req.coordinatorType === selectedCoordinator &&
      req.date === formData.date &&
      req.timeSlot === formData.timeSlot &&
      ['pending', 'approved'].includes(req.status)
    );
    
    if (existingRequest) {
      newErrors.timeSlot = `You already have a request for this time slot with ${currentCoordinator?.coordinatorName}`;
    }

    // Check for conflicts with other bookings
    const availability = checkTimeSlotAvailability(formData.date, formData.timeSlot, selectedCoordinator);
    if (!availability.available) {
      newErrors.timeSlot = `This time slot is already booked with ${currentCoordinator?.coordinatorName}. Please choose a different time.`;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const requestData = {
        clientId: clientData.id,
        clientName: clientData.name,
        coordinatorType: selectedCoordinator,
        coordinatorId: currentCoordinator?.role, // Store the coordinator's role
        coordinatorName: currentCoordinator?.coordinatorName,
        ...formData,
        status: 'pending',
        requestedAt: new Date(),
        reviewedAt: null,
        reviewedBy: '',
        coordinatorNotes: ''
      };
      
      await makerspaceActions.addRequest(requestData);
      
      // Reset form
      setFormData({
        coordinatorType: selectedCoordinator,
        date: '',
        timeSlot: '',
        purpose: '',
        description: '',
        equipment: [],
        estimatedDuration: '2',
        notes: ''
      });
      setConflictWarning('');
      
      alert(`Your appointment request with ${currentCoordinator?.coordinatorName} has been submitted! They will review it and get back to you soon.`);
      
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCoordinatorIcon = (coordinatorId) => {
    switch (coordinatorId) {
      case 'makerspace': return <Wrench size={20} />;
      case 'vocational': return <Briefcase size={20} />;
      case 'admin': return <ClipboardList size={20} />;
      default: return <User size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#6D858E] to-[#5A4E69] text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <Clock className="mr-3" size={28} />
          Schedule Time with ITG Coordinators
        </h2>
        <p className="text-[#BED2D8]">
          Schedule one-on-one time with our specialized coordinators for personalized support
        </p>
      </div>

      {/* Current Requests Status */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-[#292929]">Your Recent Requests</h3>
        {existingRequests.filter(req => req.clientId === clientData.id).length > 0 ? (
          <div className="space-y-3">
            {existingRequests
              .filter(req => req.clientId === clientData.id)
              .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
              .slice(0, 3)
              .map(request => {
                const coordinator = getCoordinatorById(request.coordinatorType);
                return (
                  <div key={request.id} className="flex justify-between items-center p-3 bg-[#F5F5F5] rounded">
                    <div className="flex items-center space-x-3">
                      {getCoordinatorIcon(request.coordinatorType)}
                      <div>
                        <p className="font-medium text-[#292929]">
                          {coordinator?.coordinatorName} - {formatDatePST(request.date)} at {MAKERSPACE_TIME_SLOTS.find(slot => slot.id === request.timeSlot)?.label}
                        </p>
                        <p className="text-sm text-[#707070]">{request.purpose}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'declined' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-[#9B97A2] italic">No previous requests</p>
        )}
      </div>

      {/* Request Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-6 text-[#292929]">New Request</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Coordinator Selection */}
          <div>
            <label className="block text-sm font-medium mb-3 text-[#292929]">
              Choose Coordinator
            </label>
            {errors.coordinator && <p className="text-red-500 text-xs mb-2">{errors.coordinator}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableCoordinators.map(coordinator => (
                <div
                  key={coordinator.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedCoordinator === coordinator.id
                      ? 'border-[#6D858E] bg-[#BED2D8]'
                      : 'border-gray-200 hover:border-[#9B97A2] bg-white'
                  }`}
                  onClick={() => handleCoordinatorChange(coordinator.id)}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {getCoordinatorIcon(coordinator.id)}
                    <h4 className="font-semibold text-[#292929]">{coordinator.coordinatorName}</h4>
                  </div>
                  <p className="text-sm font-medium text-[#6D858E] mb-1">{coordinator.name}</p>
                  <p className="text-xs text-[#707070]">{coordinator.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#292929]">
                <Calendar className="inline mr-2" size={16} />
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleDateTimeChange('date', e.target.value)}
                min={getPSTDate()}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E] ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-[#292929]">
                <Clock className="inline mr-2" size={16} />
                Time Slot
              </label>
              <select
                value={formData.timeSlot}
                onChange={(e) => handleDateTimeChange('timeSlot', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E] ${
                  errors.timeSlot ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select time slot...</option>
                {MAKERSPACE_TIME_SLOTS.map(slot => (
                  <option key={slot.id} value={slot.id}>
                    {slot.label}
                  </option>
                ))}
              </select>
              {errors.timeSlot && <p className="text-red-500 text-xs mt-1">{errors.timeSlot}</p>}
            </div>
          </div>

          {/* Conflict Warning */}
          {conflictWarning && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-red-800 font-medium mb-1">Time Slot Conflict</h4>
                  <p className="text-red-700 text-sm whitespace-pre-line">{conflictWarning}</p>
                  <p className="text-red-600 text-xs mt-2">
                    Please select a different date or time slot.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Purpose Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[#292929]">
              Purpose
            </label>
            <select
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E] ${
                errors.purpose ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select purpose...</option>
              {currentCoordinator?.purposes.map((purpose, index) => (
                <option key={index} value={purpose}>{purpose}</option>
              ))}
            </select>
            {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>}
          </div>

          {/* Equipment Selection - Only for Makerspace */}
          {selectedCoordinator === 'makerspace' && (
            <div>
              <label className="block text-sm font-medium mb-3 text-[#292929]">
                Equipment Needed
              </label>
              {errors.equipment && <p className="text-red-500 text-xs mb-2">{errors.equipment}</p>}
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {currentCoordinator.equipment.map(equipment => (
                  <label key={equipment.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.equipment.includes(equipment.id)}
                      onChange={(e) => handleEquipmentChange(equipment.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-[#292929]">{equipment.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[#292929]">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Please provide more details about what you'd like to work on or discuss..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
            />
          </div>

          {/* Estimated Duration */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[#292929]">
              Estimated Duration (hours)
            </label>
            <select
              value={formData.estimatedDuration}
              onChange={(e) => setFormData({...formData, estimatedDuration: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours (full time slot)</option>
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[#292929]">
              Additional Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any special requirements, questions, or details..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || conflictWarning}
              className="bg-[#6D858E] text-white px-6 py-3 rounded-md hover:bg-[#5A4E69] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send size={16} />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">📋 Request Guidelines</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Requests should be submitted at least 24 hours in advance</li>
          <li>• Coordinators will review and respond to requests within 1-2 business days</li>
          <li>• Maximum 2 hours per time slot</li>
          <li>• Please arrive on time and come prepared with specific goals</li>
          <li>• Time slots are first-come, first-served based on approval</li>
          <li>• For urgent needs, contact your coach directly</li>
        </ul>
      </div>
    </div>
  );
};

export default UnifiedSchedulingRequest;