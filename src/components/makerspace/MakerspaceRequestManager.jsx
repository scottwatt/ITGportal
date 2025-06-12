// src/components/makerspace/MakerspaceRequestManager.jsx
import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  User, 
  Package, 
  MessageSquare,
  Filter,
  Search,
  Plus
} from 'lucide-react';
import { formatDatePST, getPSTDate } from '../../utils/dateUtils';
import { 
  MAKERSPACE_TIME_SLOTS, 
  MAKERSPACE_EQUIPMENT, 
  MAKERSPACE_REQUEST_STATUS,
  EQUIPMENT_CATEGORIES 
} from '../../utils/constants';

const MakerspaceRequestManager = ({ 
  requests = [],
  makerspaceActions,
  userProfile,
  scheduleActions
}) => {
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const [coordinatorNotes, setCoordinatorNotes] = useState('');

  // Filter and search requests
  const filteredRequests = requests.filter(request => {
    // Status filter
    if (filter !== 'all' && request.status !== filter) return false;
    
    // Search filter
    if (searchTerm && !request.clientName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !request.purpose.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Date filter
    if (selectedDate && request.date !== selectedDate) return false;
    
    return true;
  });

  const handleApproveRequest = async (request) => {
    if (!window.confirm(`Approve makerspace request for ${request.clientName}?\n\nThis will automatically schedule them for ${formatDatePST(request.date)} at ${MAKERSPACE_TIME_SLOTS.find(slot => slot.id === request.timeSlot)?.label}.`)) {
      return;
    }

    try {
      // Update the request status
      await makerspaceActions.updateRequest(request.id, {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: userProfile.name,
        coordinatorNotes: coordinatorNotes
      });

      // Create a schedule entry in the makerspace schedule
      await makerspaceActions.addScheduleEntry({
        type: 'client_work',
        clientId: request.clientId,
        clientName: request.clientName,
        date: request.date,
        timeSlot: request.timeSlot,
        purpose: request.purpose,
        equipment: request.equipment,
        estimatedDuration: request.estimatedDuration,
        notes: request.notes,
        coordinatorNotes: coordinatorNotes,
        requestId: request.id
      });

      alert(`Request approved! ${request.clientName} has been scheduled for ${formatDatePST(request.date)}.`);
      setReviewingRequest(null);
      setCoordinatorNotes('');
      
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request. Please try again.');
    }
  };

  const handleDeclineRequest = async (request) => {
    const reason = window.prompt(`Please provide a reason for declining ${request.clientName}'s request:`);
    if (!reason) return;

    try {
      await makerspaceActions.updateRequest(request.id, {
        status: 'declined',
        reviewedAt: new Date(),
        reviewedBy: userProfile.name,
        coordinatorNotes: reason
      });

      alert(`Request declined. ${request.clientName} will be notified.`);
      setReviewingRequest(null);
      setCoordinatorNotes('');
      
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Error declining request. Please try again.');
    }
  };

  const getEquipmentNames = (equipmentIds) => {
    return equipmentIds.map(id => {
      const equipment = MAKERSPACE_EQUIPMENT.find(eq => eq.id === id);
      return equipment ? equipment.label : id;
    }).join(', ');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      declined: { color: 'bg-red-100 text-red-800', label: 'Declined' },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const todayRequests = requests.filter(r => r.date === getPSTDate()).length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#6D858E] to-[#5A4E69] text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Makerspace Request Management</h2>
        <p className="text-[#BED2D8]">Review and manage client makerspace time requests</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#707070]">Pending Requests</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <Clock className="text-yellow-600" size={40} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#707070]">Approved Today</p>
              <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
            </div>
            <CheckCircle className="text-green-600" size={40} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#707070]">Today's Sessions</p>
              <p className="text-3xl font-bold text-[#6D858E]">{todayRequests}</p>
            </div>
            <Calendar className="text-[#6D858E]" size={40} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-[#9B97A2]" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-[#9B97A2]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 w-full lg:w-auto">
            <Search size={16} className="text-[#9B97A2]" />
            <input
              type="text"
              placeholder="Search by client name or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6D858E] w-full lg:w-64"
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-[#292929]">
            Requests {filter !== 'all' && `(${filter})`}
            <span className="ml-2 text-sm text-[#9B97A2]">({filteredRequests.length} total)</span>
          </h3>
        </div>
        
        {filteredRequests.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredRequests
              .sort((a, b) => {
                // Sort by date (ascending) then by request time (newest first)
                if (a.date !== b.date) {
                  return new Date(a.date) - new Date(b.date);
                }
                return new Date(b.requestedAt) - new Date(a.requestedAt);
              })
              .map(request => (
                <div key={request.id} className="p-6 hover:bg-[#F5F5F5]">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <User size={16} className="text-[#6D858E]" />
                        <span className="font-semibold text-[#292929]">{request.clientName}</span>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#707070]">
                        <div className="flex items-center space-x-2">
                          <Calendar size={14} />
                          <span>{formatDatePST(request.date)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock size={14} />
                          <span>{MAKERSPACE_TIME_SLOTS.find(slot => slot.id === request.timeSlot)?.label}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Package size={14} />
                          <span>{getEquipmentNames(request.equipment)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Duration:</span>
                          <span>{request.estimatedDuration} hour(s)</span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-[#292929] font-medium">Purpose: {request.purpose}</p>
                        {request.notes && (
                          <p className="text-sm text-[#707070] mt-1">Notes: {request.notes}</p>
                        )}
                        {request.coordinatorNotes && (
                          <p className="text-sm text-[#5A4E69] mt-1 font-medium">
                            Coordinator Notes: {request.coordinatorNotes}
                          </p>
                        )}
                      </div>
                      
                      <div className="mt-2 text-xs text-[#9B97A2]">
                        Requested: {new Date(request.requestedAt).toLocaleDateString()} at {new Date(request.requestedAt).toLocaleTimeString()}
                        {request.reviewedAt && (
                          <span className="ml-4">
                            Reviewed: {new Date(request.reviewedAt).toLocaleDateString()} by {request.reviewedBy}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setReviewingRequest(request)}
                          className="bg-[#6D858E] text-white px-4 py-2 rounded text-sm hover:bg-[#5A4E69] flex items-center space-x-1"
                        >
                          <MessageSquare size={14} />
                          <span>Review</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[#9B97A2]">
            <Clock size={48} className="mx-auto mb-4" />
            <p>No requests found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-[#292929]">
                Review Request - {reviewingRequest.clientName}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#292929] mb-1">Date</label>
                  <p className="text-[#707070]">{formatDatePST(reviewingRequest.date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#292929] mb-1">Time</label>
                  <p className="text-[#707070]">{MAKERSPACE_TIME_SLOTS.find(slot => slot.id === reviewingRequest.timeSlot)?.label}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#292929] mb-1">Purpose</label>
                <p className="text-[#707070]">{reviewingRequest.purpose}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#292929] mb-1">Equipment Needed</label>
                <p className="text-[#707070]">{getEquipmentNames(reviewingRequest.equipment)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#292929] mb-1">Duration</label>
                <p className="text-[#707070]">{reviewingRequest.estimatedDuration} hour(s)</p>
              </div>
              
              {reviewingRequest.notes && (
                <div>
                  <label className="block text-sm font-medium text-[#292929] mb-1">Client Notes</label>
                  <p className="text-[#707070]">{reviewingRequest.notes}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-[#292929] mb-2">Coordinator Notes</label>
                <textarea
                  value={coordinatorNotes}
                  onChange={(e) => setCoordinatorNotes(e.target.value)}
                  placeholder="Add any notes about this request (optional)..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setReviewingRequest(null);
                  setCoordinatorNotes('');
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeclineRequest(reviewingRequest)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center space-x-1"
              >
                <XCircle size={16} />
                <span>Decline</span>
              </button>
              <button
                onClick={() => handleApproveRequest(reviewingRequest)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center space-x-1"
              >
                <CheckCircle size={16} />
                <span>Approve & Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MakerspaceRequestManager;