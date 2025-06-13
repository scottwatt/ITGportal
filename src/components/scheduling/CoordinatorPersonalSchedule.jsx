import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Edit, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  ClipboardList
} from 'lucide-react';
import { getPSTDate, formatDatePST, getWeekDatesStartingMonday } from '../../utils/dateUtils';
import { MAKERSPACE_TIME_SLOTS, getCoordinatorById } from '../../utils/constants';

const CoordinatorPersonalSchedule = ({ 
  coordinatorType, // 'vocational' or 'admin'
  userProfile,
  makerspaceSchedule = [], // All schedule entries
  makerspaceActions,
  requests = [] // Pending requests for this coordinator
}) => {
  const [selectedDate, setSelectedDate] = useState(getPSTDate());
  const [viewMode, setViewMode] = useState('day');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const [newEntry, setNewEntry] = useState({
    coordinatorType: coordinatorType,
    date: selectedDate,
    timeSlot: '',
    clientName: '',
    purpose: '',
    description: '',
    notes: '',
    type: 'coordinator_appointment'
  });

  const coordinator = getCoordinatorById(coordinatorType);

  // Filter appointments and requests for this coordinator type
  const coordinatorAppointments = makerspaceSchedule.filter(entry => 
    entry.coordinatorType === coordinatorType
  );

  const pendingRequests = requests.filter(req => 
    req.coordinatorType === coordinatorType && req.status === 'pending'
  );

  const getDaySchedule = (date) => {
    const appointments = coordinatorAppointments.filter(entry => entry.date === date);
    
    return MAKERSPACE_TIME_SLOTS.map(timeSlot => ({
      ...timeSlot,
      entries: appointments.filter(entry => entry.timeSlot === timeSlot.id),
      hasPendingRequest: pendingRequests.some(req => req.date === date && req.timeSlot === timeSlot.id)
    }));
  };

  const getWeekSchedule = () => {
    const weekDates = getWeekDatesStartingMonday();
    return weekDates.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      return {
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { 
          timeZone: 'America/Los_Angeles',
          weekday: 'short' 
        }),
        dayNumber: date.getDate(),
        schedule: getDaySchedule(dateStr)
      };
    });
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    
    try {
      await makerspaceActions.addScheduleEntry({
        ...newEntry,
        coordinatorName: coordinator?.coordinatorName,
        createdBy: userProfile.name
      });
      
      setShowAddModal(false);
      setNewEntry({
        coordinatorType: coordinatorType,
        date: selectedDate,
        timeSlot: '',
        clientName: '',
        purpose: '',
        description: '',
        notes: '',
        type: 'coordinator_appointment'
      });
      
      alert('Appointment added successfully!');
    } catch (error) {
      console.error('Error adding appointment:', error);
      alert('Error adding appointment. Please try again.');
    }
  };

  const handleDeleteEntry = async (entry) => {
    if (!window.confirm(`Delete this appointment with ${entry.clientName}?`)) {
      return;
    }
    
    try {
      await makerspaceActions.removeScheduleEntry(entry.id);
      alert('Appointment deleted successfully!');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Error deleting appointment. Please try again.');
    }
  };

  const getCoordinatorIcon = () => {
    switch (coordinatorType) {
      case 'vocational': return <Briefcase size={14} />;
      case 'admin': return <ClipboardList size={14} />;
      default: return <User size={14} />;
    }
  };

  const getEntryColor = () => {
    switch (coordinatorType) {
      case 'vocational': return 'bg-green-100 border-green-300 text-green-800';
      case 'admin': return 'bg-purple-100 border-purple-300 text-purple-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const navigateDate = (direction) => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    
    if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + direction);
    } else {
      newDate.setDate(currentDate.getDate() + (direction * 7));
    }
    
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const renderDayView = () => {
    const daySchedule = getDaySchedule(selectedDate);
    
    return (
      <div className="space-y-4">
        {daySchedule.map(timeSlot => (
          <div key={timeSlot.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className={`${timeSlot.hasPendingRequest ? 'bg-yellow-500' : 'bg-[#6D858E]'} text-white px-4 py-3 flex justify-between items-center`}>
              <h3 className="font-semibold flex items-center">
                <Clock size={16} className="mr-2" />
                {timeSlot.label}
              </h3>
              {timeSlot.hasPendingRequest && (
                <span className="text-xs bg-white text-yellow-800 px-2 py-1 rounded">
                  Pending Request
                </span>
              )}
            </div>
            
            <div className="p-4">
              {timeSlot.entries.length > 0 ? (
                <div className="space-y-3">
                  {timeSlot.entries.map(entry => (
                    <div 
                      key={entry.id} 
                      className={`border rounded-lg p-3 ${getEntryColor()}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getCoordinatorIcon()}
                            <span className="font-medium">{entry.clientName}</span>
                            <span className="text-xs px-2 py-1 bg-white rounded">
                              {entry.type === 'coordinator_appointment' ? 'MEETING' : 'APPOINTMENT'}
                            </span>
                          </div>
                          
                          <p className="text-sm mb-1">{entry.purpose}</p>
                          
                          {entry.description && (
                            <p className="text-xs mb-1">Description: {entry.description}</p>
                          )}
                          
                          {entry.notes && (
                            <p className="text-xs mt-1 italic">Notes: {entry.notes}</p>
                          )}
                        </div>
                        
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => setEditingEntry(entry)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#9B97A2]">
                  {getCoordinatorIcon()}
                  <p className="mt-2">No appointments scheduled</p>
                  <button
                    onClick={() => {
                      setNewEntry({...newEntry, date: selectedDate, timeSlot: timeSlot.id});
                      setShowAddModal(true);
                    }}
                    className="text-[#6D858E] hover:text-[#5A4E69] text-sm mt-2"
                  >
                    + Add appointment
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekSchedule = getWeekSchedule();
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-8 border-b">
          <div className="p-4 font-semibold text-[#292929] bg-[#F5F5F5]">Time</div>
          {weekSchedule.map(day => (
            <div key={day.date} className="p-4 text-center bg-[#F5F5F5] border-l">
              <div className="font-semibold text-[#292929]">{day.dayName}</div>
              <div className="text-sm text-[#707070]">{day.dayNumber}</div>
            </div>
          ))}
        </div>
        
        {MAKERSPACE_TIME_SLOTS.map(timeSlot => (
          <div key={timeSlot.id} className="grid grid-cols-8 border-b last:border-b-0">
            <div className="p-4 border-r bg-[#F5F5F5] font-medium text-[#292929]">
              {timeSlot.label.split(' - ')[0]}
            </div>
            {weekSchedule.map(day => {
              const daySlot = day.schedule.find(s => s.id === timeSlot.id);
              const entries = daySlot?.entries || [];
              const hasPendingRequest = daySlot?.hasPendingRequest || false;
              
              return (
                <div key={`${day.date}-${timeSlot.id}`} className={`p-2 border-l min-h-[80px] ${hasPendingRequest ? 'bg-yellow-50' : ''}`}>
                  {hasPendingRequest && (
                    <div className="text-xs bg-yellow-200 text-yellow-800 p-1 rounded mb-1">
                      Pending
                    </div>
                  )}
                  {entries.map(entry => (
                    <div 
                      key={entry.id} 
                      className={`text-xs p-2 rounded mb-1 ${getEntryColor()}`}
                    >
                      <div className="font-medium truncate">{entry.clientName}</div>
                      <div className="truncate">{entry.purpose}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#6D858E] to-[#5A4E69] text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          {getCoordinatorIcon()}
          <span className="ml-3">{coordinator?.coordinatorName}'s Schedule</span>
        </h2>
        <p className="text-[#BED2D8]">{coordinator?.description}</p>
        {pendingRequests.length > 0 && (
          <div className="mt-3 bg-yellow-600 text-white px-3 py-2 rounded">
            ⚠️ {pendingRequests.length} pending request{pendingRequests.length > 1 ? 's' : ''} need your review
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex space-x-1 bg-[#F5F5F5] rounded-lg p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'day' 
                    ? 'bg-white text-[#6D858E] shadow-sm' 
                    : 'text-[#707070] hover:text-[#292929]'
                }`}
              >
                Day View
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'week' 
                    ? 'bg-white text-[#6D858E] shadow-sm' 
                    : 'text-[#707070] hover:text-[#292929]'
                }`}
              >
                Week View
              </button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 hover:bg-[#F5F5F5] rounded"
              >
                <ChevronLeft size={20} />
              </button>
              
              {viewMode === 'day' ? (
                <div className="font-semibold text-[#292929] min-w-[200px] text-center">
                  {formatDatePST(selectedDate)}
                </div>
              ) : (
                <div className="font-semibold text-[#292929] min-w-[200px] text-center">
                  Week of {formatDatePST(getWeekDatesStartingMonday()[0].toISOString().split('T')[0])}
                </div>
              )}
              
              <button
                onClick={() => navigateDate(1)}
                className="p-2 hover:bg-[#F5F5F5] rounded"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Date Picker */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
            />
          </div>

          {/* Add Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#6D858E] text-white px-4 py-2 rounded-md hover:bg-[#5A4E69] flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Block Time</span>
          </button>
        </div>
      </div>

      {/* Schedule Display */}
      {viewMode === 'day' ? renderDayView() : renderWeekView()}

      {/* Add/Edit Modal */}
      {(showAddModal || editingEntry) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-[#292929]">
                {editingEntry ? 'Edit Appointment' : 'Block Time Slot'}
              </h3>
            </div>
            
            <form onSubmit={handleAddEntry} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#292929] mb-1">Date</label>
                  <input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#292929] mb-1">Time Slot</label>
                  <select
                    value={newEntry.timeSlot}
                    onChange={(e) => setNewEntry({...newEntry, timeSlot: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                    required
                  >
                    <option value="">Select time...</option>
                    {MAKERSPACE_TIME_SLOTS.map(slot => (
                      <option key={slot.id} value={slot.id}>{slot.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#292929] mb-1">
                  Title/Client Name
                </label>
                <input
                  type="text"
                  value={newEntry.clientName}
                  onChange={(e) => setNewEntry({...newEntry, clientName: e.target.value})}
                  placeholder="Meeting title or client name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#292929] mb-1">Purpose</label>
                <input
                  type="text"
                  value={newEntry.purpose}
                  onChange={(e) => setNewEntry({...newEntry, purpose: e.target.value})}
                  placeholder="Purpose of meeting/appointment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#292929] mb-1">Description (Optional)</label>
                <textarea
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                  placeholder="Additional details"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#292929] mb-1">Notes (Optional)</label>
                <textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEntry(null);
                    setNewEntry({
                      coordinatorType: coordinatorType,
                      date: selectedDate,
                      timeSlot: '',
                      clientName: '',
                      purpose: '',
                      description: '',
                      notes: '',
                      type: 'coordinator_appointment'
                    });
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#6D858E] text-white px-4 py-2 rounded hover:bg-[#5A4E69]"
                >
                  {editingEntry ? 'Update' : 'Block'} Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorPersonalSchedule;