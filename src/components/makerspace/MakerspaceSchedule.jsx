// src/components/makerspace/MakerspaceSchedule.jsx
import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Package, 
  Plus, 
  Edit, 
  Trash2,
  Wrench,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getPSTDate, formatDatePST, getWeekDatesStartingMonday } from '../../utils/dateUtils';
import { MAKERSPACE_TIME_SLOTS, MAKERSPACE_EQUIPMENT } from '../../utils/constants';

const MakerspaceSchedule = ({ 
  makerspaceSchedule = [],
  walkthroughs = [],
  makerspaceActions,
  userProfile 
}) => {
  const [selectedDate, setSelectedDate] = useState(getPSTDate());
  const [viewMode, setViewMode] = useState('day'); // 'day' or 'week'
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const [newEntry, setNewEntry] = useState({
    type: 'client_work', // 'client_work', 'walkthrough', 'maintenance', 'blocked'
    date: selectedDate,
    timeSlot: '',
    clientName: '',
    purpose: '',
    equipment: [],
    notes: ''
  });

  const getDaySchedule = (date) => {
    const schedule = makerspaceSchedule.filter(entry => entry.date === date);
    const walkthroughsForDay = walkthroughs.filter(wt => wt.date === date);
    
    // Combine and organize by time slot
    const combined = [...schedule, ...walkthroughsForDay.map(wt => ({
      ...wt,
      type: 'walkthrough'
    }))];
    
    return MAKERSPACE_TIME_SLOTS.map(timeSlot => ({
      ...timeSlot,
      entries: combined.filter(entry => entry.timeSlot === timeSlot.id)
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
      if (newEntry.type === 'walkthrough') {
        await makerspaceActions.addWalkthrough(newEntry);
      } else {
        await makerspaceActions.addScheduleEntry(newEntry);
      }
      
      setShowAddModal(false);
      setNewEntry({
        type: 'client_work',
        date: selectedDate,
        timeSlot: '',
        clientName: '',
        purpose: '',
        equipment: [],
        notes: ''
      });
      
      alert('Entry added successfully!');
    } catch (error) {
      console.error('Error adding entry:', error);
      alert('Error adding entry. Please try again.');
    }
  };

  const handleDeleteEntry = async (entry) => {
    if (!window.confirm(`Delete this ${entry.type === 'walkthrough' ? 'walkthrough' : 'schedule entry'}?`)) {
      return;
    }
    
    try {
      if (entry.type === 'walkthrough') {
        await makerspaceActions.removeWalkthrough(entry.id);
      } else {
        await makerspaceActions.removeScheduleEntry(entry.id);
      }
      
      alert('Entry deleted successfully!');
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry. Please try again.');
    }
  };

  const getEntryColor = (type) => {
    const colors = {
      client_work: 'bg-green-100 border-green-300 text-green-800',
      walkthrough: 'bg-blue-100 border-blue-300 text-blue-800',
      maintenance: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      blocked: 'bg-red-100 border-red-300 text-red-800'
    };
    return colors[type] || colors.client_work;
  };

  const getEntryIcon = (type) => {
    const icons = {
      client_work: <Wrench size={14} />,
      walkthrough: <User size={14} />,
      maintenance: <Package size={14} />,
      blocked: <Clock size={14} />
    };
    return icons[type] || icons.client_work;
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
            <div className="bg-[#6D858E] text-white px-4 py-3">
              <h3 className="font-semibold flex items-center">
                <Clock size={16} className="mr-2" />
                {timeSlot.label}
              </h3>
            </div>
            
            <div className="p-4">
              {timeSlot.entries.length > 0 ? (
                <div className="space-y-3">
                  {timeSlot.entries.map(entry => (
                    <div 
                      key={entry.id} 
                      className={`border rounded-lg p-3 ${getEntryColor(entry.type)}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getEntryIcon(entry.type)}
                            <span className="font-medium">
                              {entry.type === 'walkthrough' ? `Walkthrough: ${entry.clientName}` : entry.clientName}
                            </span>
                            <span className="text-xs px-2 py-1 bg-white rounded">
                              {entry.type.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          
                          <p className="text-sm mb-1">{entry.purpose || entry.description}</p>
                          
                          {entry.equipment && entry.equipment.length > 0 && (
                            <p className="text-xs">
                              Equipment: {entry.equipment.map(id => 
                                MAKERSPACE_EQUIPMENT.find(eq => eq.id === id)?.label || id
                              ).join(', ')}
                            </p>
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
                  <Wrench size={32} className="mx-auto mb-2" />
                  <p>No sessions scheduled</p>
                  <button
                    onClick={() => {
                      setNewEntry({...newEntry, date: selectedDate, timeSlot: timeSlot.id});
                      setShowAddModal(true);
                    }}
                    className="text-[#6D858E] hover:text-[#5A4E69] text-sm mt-2"
                  >
                    + Add session
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
              
              return (
                <div key={`${day.date}-${timeSlot.id}`} className="p-2 border-l min-h-[80px]">
                  {entries.map(entry => (
                    <div 
                      key={entry.id} 
                      className={`text-xs p-2 rounded mb-1 ${getEntryColor(entry.type)}`}
                    >
                      <div className="font-medium truncate">{entry.clientName}</div>
                      <div className="truncate">{entry.purpose || entry.description}</div>
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
        <h2 className="text-2xl font-bold mb-2">Makerspace Schedule</h2>
        <p className="text-[#BED2D8]">Manage client sessions and walkthroughs</p>
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
            <span>Add Entry</span>
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
                {editingEntry ? 'Edit Entry' : 'Add New Entry'}
              </h3>
            </div>
            
            <form onSubmit={handleAddEntry} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#292929] mb-1">Type</label>
                <select
                  value={newEntry.type}
                  onChange={(e) => setNewEntry({...newEntry, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                  required
                >
                  <option value="client_work">Client Work Session</option>
                  <option value="walkthrough">Walkthrough/Training</option>
                  <option value="maintenance">Equipment Maintenance</option>
                  <option value="blocked">Time Blocked</option>
                </select>
              </div>

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
                  {newEntry.type === 'client_work' ? 'Client Name' : 'Title'}
                </label>
                <input
                  type="text"
                  value={newEntry.clientName}
                  onChange={(e) => setNewEntry({...newEntry, clientName: e.target.value})}
                  placeholder={newEntry.type === 'client_work' ? 'Client name' : 'Entry title'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#292929] mb-1">
                  {newEntry.type === 'walkthrough' ? 'Description' : 'Purpose'}
                </label>
                <input
                  type="text"
                  value={newEntry.purpose}
                  onChange={(e) => setNewEntry({...newEntry, purpose: e.target.value})}
                  placeholder="Description of work or activity"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                  required
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
                      type: 'client_work',
                      date: selectedDate,
                      timeSlot: '',
                      clientName: '',
                      purpose: '',
                      equipment: [],
                      notes: ''
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
                  {editingEntry ? 'Update' : 'Add'} Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MakerspaceSchedule;