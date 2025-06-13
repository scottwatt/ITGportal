// src/components/scheduling/CoordinatorScheduleManager.jsx - Generic coordinator request manager
import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  User, 
  Filter,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  MessageSquare,
  Wrench,
  Briefcase,
  ClipboardList
} from 'lucide-react';
import { formatDatePST, getPSTDate } from '../../utils/dateUtils';
import { 
  MAKERSPACE_TIME_SLOTS, 
  MAKERSPACE_EQUIPMENT,
  getCoordinatorById,
  COORDINATORS
} from '../../utils/constants';

const CoordinatorScheduleManager = ({ 
  requests = [],
  makerspaceActions,
  userProfile,
  coordinatorType, // 'makerspace', 'vocational', 'admin'
  title,
  scheduleActions
}) => {
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const [coordinatorNotes, setCoordinatorNotes] = useState('');
  const [editingRequest, setEditingRequest] = useState(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    timeSlot: '',
    purpose: '',
    description: '',
    equipment: [],
    estimatedDuration: '',
    notes: '',
    status: ''
  });

  // Get coordinator info
  const coordinator = getCoordinatorById(coordinatorType);

  // Filter requests for this coordinator type only
  const coordinatorRequests = requests.filter(req => req.coordinatorType === coordinatorType);

  // Further filter based on UI filters
  const filteredRequests = coordinatorRequests.filter(request => {
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

  // Handle approve request
  const handleApproveRequest = async (request) => {
    if (!window.confirm(`Approve ${coordinator?.name.toLowerCase()} request for ${request.clientName}?\n\nThis will automatically schedule them for ${formatDatePST(request.date)} at ${MAKERSPACE_TIME_SLOTS.find(slot => slot.id === request.timeSlot)?.label}.`)) {
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

      // Create a schedule entry - for makerspace use existing system, for others we'll need new collections
      if (coordinatorType === 'makerspace') {
        await makerspaceActions.addScheduleEntry({
          type: 'client_work',
          clientId: request.clientId,
          clientName: request.clientName,
          date: request.date,
          timeSlot: request.timeSlot,
          purpose: request.purpose,
          description: request.description,
          equipment: request.equipment,
          estimatedDuration: request.estimatedDuration,
          notes: request.notes,
          coordinatorNotes: coordinatorNotes,
          requestId: request.id,
          coordinatorType: coordinatorType
        });
      } else {
        // For vocational and admin coordinators, create schedule entry in their respective collections
        await makerspaceActions.addScheduleEntry({
          type: 'coordinator_meeting',
          coordinatorType: coordinatorType,
          clientId: request.clientId,
          clientName: request.clientName,
          date: request.date,
          timeSlot: request.timeSlot,
          purpose: request.purpose,
          description: request.description,
          estimatedDuration: request.estimatedDuration,
          notes: request.notes,
          coordinatorNotes: coordinatorNotes,
          requestId: request.id
        });
      }

      alert(`Request approved! ${request.clientName} has been scheduled for ${formatDatePST(request.date)}.`);
      setReviewingRequest(null);
      setCoordinatorNotes('');
      
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request. Please try again.');
    }
  };

  // Handle decline request
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

  // Handle edit request
  const handleEditRequest = (request) => {
    if (request.reviewedAt && request.status !== 'pending') {
      const confirmed = window.confirm(
        `⚠️ WARNING: This request has already been ${request.status.toUpperCase()}\n\nEditing it may affect the client's schedule or create conflicts.\n\nDo you want to continue?`
      );
      if (!confirmed) return;
    }

    setEditingRequest(request);
    setEditFormData({
      date: request.date,
      timeSlot: request.timeSlot,
      purpose: request.purpose,
      description: request.description || '',
      equipment: [...(request.equipment || [])],
      estimatedDuration: request.estimatedDuration || '2',
      notes: request.notes || '',
      status: request.status
    });
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingRequest) return;

    if (!editFormData.date || !editFormData.timeSlot || !editFormData.purpose) {
      alert('Please fill in all required fields (Date, Time Slot, Purpose)');
      return;
    }

    try {
      const updateData = {
        ...editFormData,
        updatedAt: new Date(),
        editedBy: userProfile.name,
        editedAt: new Date()
      };

      await makerspaceActions.updateRequest(editingRequest.id, updateData);

      alert(`✅ Request updated successfully for ${editingRequest.clientName}!`);
      setEditingRequest(null);
      resetEditForm();
      
    } catch (error) {
      console.error('Error updating request:', error);
      alert('❌ Error updating request. Please try again.');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingRequest(null);
    resetEditForm();
  };

  // Reset edit form data
  const resetEditForm = () => {
    setEditFormData({
      date: '',
      timeSlot: '',
      purpose: '',
      description: '',
      equipment: [],
      estimatedDuration: '',
      notes: '',
      status: ''
    });
  };

  // Handle delete request
  const handleDeleteRequest = async (request) => {
    let confirmMessage = `🗑️ DELETE REQUEST\n\nClient: ${request.clientName}\nDate: ${formatDatePST(request.date)}\nTime: ${MAKERSPACE_TIME_SLOTS.find(slot => slot.id === request.timeSlot)?.label}\nPurpose: ${request.purpose}`;

    if (request.reviewedAt && request.status !== 'pending') {
      confirmMessage += `\n\n⚠️ CRITICAL WARNING:\nThis request was ${request.status.toUpperCase()} on ${new Date(request.reviewedAt).toLocaleDateString()}\n\nDeleting this may:\n• Cancel the client's scheduled session\n• Create confusion for the client\n• Affect schedule`;
    }

    confirmMessage += `\n\n❌ This action CANNOT be undone.\n\nType "DELETE" to confirm:`;

    const userInput = window.prompt(confirmMessage);
    if (userInput !== 'DELETE') {
      alert('Deletion cancelled. Request was NOT deleted.');
      return;
    }

    try {
      await makerspaceActions.deleteRequest(request.id);
      alert(`✅ Request deleted successfully for ${request.clientName}!`);
      
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('❌ Error deleting request. Please try again.');
    }
  };

  // Handle equipment change in edit form
  const handleEquipmentChange = (equipmentId, isChecked) => {
    if (isChecked) {
      setEditFormData({
        ...editFormData,
        equipment: [...editFormData.equipment, equipmentId]
      });
    } else {
      setEditFormData({
        ...editFormData,
        equipment: editFormData.equipment.filter(id => id !== equipmentId)
      });
    }
  };

  // Get equipment names from IDs (for makerspace)
  const getEquipmentNames = (equipmentIds) => {
    if (!equipmentIds || equipmentIds.length === 0) return 'None specified';
    if (coordinatorType !== 'makerspace') return 'N/A';
    return equipmentIds.map(id => {
      const equipment = MAKERSPACE_EQUIPMENT.find(eq => eq.id === id);
      return equipment ? equipment.label : id;
    }).join(', ');
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Pending Review', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Approved', icon: CheckCircle },
      declined: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Declined', icon: XCircle },
      completed: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Completed', icon: CheckCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Cancelled', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-1 ${config.color}`}>
        <IconComponent size={14} />
        <span>{config.label}</span>
      </span>
    );
  };

  // Get coordinator icon
  const getCoordinatorIcon = () => {
    switch (coordinatorType) {
      case 'makerspace': return <Wrench size={24} />;
      case 'vocational': return <Briefcase size={24} />;
      case 'admin': return <ClipboardList size={24} />;
      default: return <User size={24} />;
    }
  };

  // Calculate statistics
  const stats = {
    totalRequests: coordinatorRequests.length,
    pendingRequests: coordinatorRequests.filter(r => r.status === 'pending').length,
    approvedRequests: coordinatorRequests.filter(r => r.status === 'approved').length,
    declinedRequests: coordinatorRequests.filter(r => r.status === 'declined').length,
    todayRequests: coordinatorRequests.filter(r => r.date === getPSTDate()).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6D858E] to-[#5A4E69] text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          {getCoordinatorIcon()}
          <span className="ml-3">{title || `${coordinator?.name} Request Management`}</span>
        </h2>
        <p className="text-[#BED2D8]">Review, edit, and manage client appointment requests</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#707070]">Total Requests</p>
              <p className="text-2xl font-bold text-[#292929]">{stats.totalRequests}</p>
            </div>
            <MessageSquare className="text-[#6D858E]" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#707070]">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
            </div>
            <Clock className="text-yellow-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#707070]">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approvedRequests}</p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#707070]">Declined</p>
              <p className="text-2xl font-bold text-red-600">{stats.declinedRequests}</p>
            </div>
            <XCircle className="text-red-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#707070]">Today's Sessions</p>
              <p className="text-2xl font-bold text-[#6D858E]">{stats.todayRequests}</p>
            </div>
            <Calendar className="text-[#6D858E]" size={24} />
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
                <option value="cancelled">Cancelled</option>
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
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Clear
                </button>
              )}
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
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-[#292929]">
            Requests {filter !== 'all' && `(${filter})`}
            <span className="ml-2 text-sm text-[#9B97A2]">({filteredRequests.length} shown)</span>
          </h3>
        </div>
        
        {filteredRequests.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredRequests
              .sort((a, b) => {
                if (a.date !== b.date) {
                  return new Date(a.date) - new Date(b.date);
                }
                return new Date(b.requestedAt) - new Date(a.requestedAt);
              })
              .map(request => (
                <div key={request.id} className="p-6 hover:bg-[#F5F5F5] transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      {/* Header with client name and status */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <User size={16} className="text-[#6D858E]" />
                          <span className="font-semibold text-[#292929] text-lg">{request.clientName}</span>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      {/* Request details grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-[#707070] mb-3">
                        <div className="flex items-center space-x-2">
                          <Calendar size={14} />
                          <span className="font-medium">{formatDatePST(request.date)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock size={14} />
                          <span>{MAKERSPACE_TIME_SLOTS.find(slot => slot.id === request.timeSlot)?.label}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock size={14} />
                          <span>{request.estimatedDuration || '2'} hour(s)</span>
                        </div>
                      </div>
                      
                      {/* Purpose and details */}
                      <div className="mb-3">
                        <p className="text-[#292929] font-medium mb-1">Purpose: {request.purpose}</p>
                        {request.description && (
                          <p className="text-sm text-[#707070] mb-1">Description: {request.description}</p>
                        )}
                        {coordinatorType === 'makerspace' && (
                          <p className="text-sm text-[#707070]">Equipment: {getEquipmentNames(request.equipment)}</p>
                        )}
                        {request.notes && (
                          <p className="text-sm text-[#707070] mt-1">Client Notes: {request.notes}</p>
                        )}
                        {request.coordinatorNotes && (
                          <p className="text-sm text-[#5A4E69] mt-1 font-medium">
                            Coordinator Notes: {request.coordinatorNotes}
                          </p>
                        )}
                      </div>
                      
                      {/* Timestamps */}
                      <div className="text-xs text-[#9B97A2] space-y-1">
                        <div>
                          📅 Requested: {new Date(request.requestedAt).toLocaleDateString()} at {new Date(request.requestedAt).toLocaleTimeString()}
                        </div>
                        {request.reviewedAt && (
                          <div>
                            ✅ Reviewed: {new Date(request.reviewedAt).toLocaleDateString()} by {request.reviewedBy}
                          </div>
                        )}
                        {request.editedAt && (
                          <div className="text-blue-600 font-medium">
                            ✏️ Last Edited: {new Date(request.editedAt).toLocaleDateString()} by {request.editedBy}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {/* Review button for pending requests */}
                      {request.status === 'pending' && (
                        <button
                          onClick={() => setReviewingRequest(request)}
                          className="bg-[#6D858E] text-white px-4 py-2 rounded text-sm hover:bg-[#5A4E69] flex items-center space-x-1 transition-colors"
                        >
                          <MessageSquare size={14} />
                          <span>Review</span>
                        </button>
                      )}
                      
                      {/* Edit button */}
                      <button
                        onClick={() => handleEditRequest(request)}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center space-x-1 transition-colors"
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteRequest(request)}
                        className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 flex items-center space-x-1 transition-colors"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[#9B97A2]">
            <Clock size={48} className="mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No requests found</p>
            <p>No requests match your current filters.</p>
          </div>
        )}
      </div>

      {/* Review Modal - Same as before but with coordinator-specific messaging */}
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
              
              {reviewingRequest.description && (
                <div>
                  <label className="block text-sm font-medium text-[#292929] mb-1">Description</label>
                  <p className="text-[#707070]">{reviewingRequest.description}</p>
                </div>
              )}
              
              {coordinatorType === 'makerspace' && (
                <div>
                  <label className="block text-sm font-medium text-[#292929] mb-1">Equipment Needed</label>
                  <p className="text-[#707070]">{getEquipmentNames(reviewingRequest.equipment)}</p>
                </div>
              )}
              
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
                  placeholder="Add any notes about this appointment (optional)..."
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

      {/* Edit Modal - Similar structure but coordinator-specific fields */}
      {editingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-[#292929]">
                    Edit Request - {editingRequest.clientName}
                  </h3>
                  {editingRequest.reviewedAt && editingRequest.status !== 'pending' && (
                    <div className="flex items-center space-x-2 mt-2">
                      <AlertTriangle className="text-amber-500" size={16} />
                      <span className="text-sm text-amber-600 font-medium">
                        ⚠️ This request has been {editingRequest.status} - edit carefully
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#292929] mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#292929] mb-2">
                    Time Slot <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editFormData.timeSlot}
                    onChange={(e) => setEditFormData({...editFormData, timeSlot: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                    required
                  >
                    <option value="">Select time slot...</option>
                    {MAKERSPACE_TIME_SLOTS.map(slot => (
                      <option key={slot.id} value={slot.id}>{slot.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-[#292929] mb-2">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.purpose}
                  onChange={(e) => setEditFormData({...editFormData, purpose: e.target.value})}
                  placeholder="Purpose of the appointment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#292929] mb-2">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  placeholder="Additional details about the appointment"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                />
              </div>

              {/* Equipment - Only for makerspace */}
              {coordinatorType === 'makerspace' && (
                <div>
                  <label className="block text-sm font-medium text-[#292929] mb-3">Equipment Needed</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {MAKERSPACE_EQUIPMENT.map(equipment => (
                      <label key={equipment.id} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editFormData.equipment.includes(equipment.id)}
                          onChange={(e) => handleEquipmentChange(equipment.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-[#292929]">{equipment.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Duration and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#292929] mb-2">Duration (hours)</label>
                  <select
                    value={editFormData.estimatedDuration}
                    onChange={(e) => setEditFormData({...editFormData, estimatedDuration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                  >
                    <option value="1">1 hour</option>
                    <option value="2">2 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#292929] mb-2">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="declined">Declined</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[#292929] mb-2">Client Notes</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                  placeholder="Client's additional notes or requirements..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCancelEdit}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 flex items-center space-x-1"
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-[#6D858E] text-white px-6 py-2 rounded hover:bg-[#5A4E69] flex items-center space-x-1"
              >
                <Save size={16} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorScheduleManager;