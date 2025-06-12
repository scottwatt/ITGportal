// src/components/makerspace/MakerspaceRequestForm.jsx
import React, { useState } from 'react';
import { Wrench, Clock, Calendar, Package, Send, AlertCircle } from 'lucide-react';
import { getPSTDate, formatDatePST } from '../../utils/dateUtils';
import { MAKERSPACE_TIME_SLOTS, MAKERSPACE_EQUIPMENT, EQUIPMENT_CATEGORIES } from '../../utils/constants';

const MakerspaceRequestForm = ({ 
  userProfile, 
  clients, 
  makerspaceActions,
  existingRequests = [] 
}) => {
  // Find the current client's data
  const clientData = clients.find(c => c.email === userProfile.email) || clients[0];
  
  const [formData, setFormData] = useState({
    date: '',
    timeSlot: '',
    purpose: '',
    equipment: [],
    estimatedDuration: '2',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.timeSlot) newErrors.timeSlot = 'Time slot is required';
    if (!formData.purpose) newErrors.purpose = 'Purpose is required';
    if (formData.equipment.length === 0) newErrors.equipment = 'At least one equipment selection is required';
    
    // Check if date is in the past
    const today = getPSTDate();
    if (formData.date < today) {
      newErrors.date = 'Cannot request time for past dates';
    }
    
    // Check if there's already a request for this date/time
    const existingRequest = existingRequests.find(req => 
      req.clientId === clientData.id &&
      req.date === formData.date &&
      req.timeSlot === formData.timeSlot &&
      ['pending', 'approved'].includes(req.status)
    );
    
    if (existingRequest) {
      newErrors.timeSlot = 'You already have a request for this time slot';
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
        date: '',
        timeSlot: '',
        purpose: '',
        equipment: [],
        estimatedDuration: '2',
        notes: ''
      });
      
      alert('Your makerspace time request has been submitted! Kameron will review it and get back to you soon.');
      
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting request. Please try again.');
    } finally {
      setIsSubmitting(false);
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

  if (!clientData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <p className="text-red-600">No client data found. Please contact your coach.</p>
      </div>
    );
  }

  // Only allow Limitless clients to request makerspace time
  if (clientData.program !== 'limitless') {
    return (
      <div className="text-center py-8">
        <Wrench className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Makerspace Access</h3>
        <p className="text-gray-600">
          Makerspace time requests are currently available for Limitless program participants only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#6D858E] to-[#5A4E69] text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <Wrench className="mr-3" size={28} />
          Request Makerspace Time
        </h2>
        <p className="text-[#BED2D8]">
          Schedule time to work on your business in the ITG Makerspace
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
              .map(request => (
                <div key={request.id} className="flex justify-between items-center p-3 bg-[#F5F5F5] rounded">
                  <div>
                    <p className="font-medium text-[#292929]">
                      {formatDatePST(request.date)} - {MAKERSPACE_TIME_SLOTS.find(slot => slot.id === request.timeSlot)?.label}
                    </p>
                    <p className="text-sm text-[#707070]">{request.purpose}</p>
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
              ))}
          </div>
        ) : (
          <p className="text-[#9B97A2] italic">No previous requests</p>
        )}
      </div>

      {/* Request Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-6 text-[#292929]">New Request</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
                onChange={(e) => setFormData({...formData, date: e.target.value})}
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
                onChange={(e) => setFormData({...formData, timeSlot: e.target.value})}
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

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[#292929]">
              Purpose/Project
            </label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              placeholder="e.g., Design and print custom mugs, Create embroidered shirts"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E] ${
                errors.purpose ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>}
          </div>

          {/* Equipment Needed */}
          <div>
            <label className="block text-sm font-medium mb-3 text-[#292929]">
              <Package className="inline mr-2" size={16} />
              Equipment Needed
            </label>
            {errors.equipment && <p className="text-red-500 text-xs mb-2">{errors.equipment}</p>}
            
            {EQUIPMENT_CATEGORIES.map(category => {
              const categoryEquipment = MAKERSPACE_EQUIPMENT.filter(eq => eq.category === category.id);
              
              return (
                <div key={category.id} className="mb-4">
                  <h4 className={`text-sm font-medium mb-2 px-2 py-1 rounded ${category.color}`}>
                    {category.label}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-4">
                    {categoryEquipment.map(equipment => (
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
              );
            })}
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
              disabled={isSubmitting}
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
          <li>• Kameron will review and respond to requests within 1-2 business days</li>
          <li>• Maximum 2 hours per time slot</li>
          <li>• All equipment use requires prior safety training</li>
          <li>• Please clean up your workspace when finished</li>
        </ul>
      </div>
    </div>
  );
};

export default MakerspaceRequestForm;