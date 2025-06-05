// src/components/admin/EnhancedCoachAvailabilityManager.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, User, AlertTriangle, CheckCircle, X, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDatePST, getPSTDate } from '../../utils/dateUtils';
import { generateDateRange } from '../../services/firebase/coachAvailability';

const EnhancedCoachAvailabilityManager = ({ 
  coaches,
  availabilityActions,
  scheduleActions,
  schedules,
  selectedDate 
}) => {
  const [activeView, setActiveView] = useState('daily'); // 'daily', 'yearly', 'bulk'
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [yearlyData, setYearlyData] = useState({});
  const [newAvailability, setNewAvailability] = useState({
    coachId: '',
    startDate: selectedDate || getPSTDate(),
    endDate: selectedDate || getPSTDate(),
    status: 'off',
    reason: ''
  });

  const statusOptions = [
    { value: 'available', label: 'Available', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle },
    { value: 'off', label: 'Day Off', color: 'text-red-600', bgColor: 'bg-red-50', icon: X },
    { value: 'sick', label: 'Sick Day', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: AlertTriangle },
    { value: 'vacation', label: 'Vacation', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Calendar }
  ];

  const getStatusDisplay = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option || statusOptions[0];
  };

  // Load yearly data when year changes
  useEffect(() => {
    loadYearlyData();
  }, [currentYear]);

  const loadYearlyData = async () => {
    try {
      const data = {};
      for (const coach of coaches) {
        const summary = await availabilityActions.getYearlyTimeOffSummary?.(coach.uid || coach.id, currentYear);
        if (summary) {
          data[coach.uid || coach.id] = summary;
        }
      }
      setYearlyData(data);
    } catch (error) {
      console.error('Error loading yearly data:', error);
    }
  };

  // Extract from EnhancedCoachAvailabilityManager.jsx
// Debug version of handleSetAvailability function

const handleSetAvailability = async (e) => {
  e.preventDefault();
  
  if (!newAvailability.coachId || !newAvailability.startDate || !newAvailability.endDate) {
    alert('Please select a coach, start date, and end date');
    return;
  }

  const startDate = new Date(newAvailability.startDate + 'T12:00:00');
  const endDate = new Date(newAvailability.endDate + 'T12:00:00');
  
  if (startDate > endDate) {
    alert('End date must be after start date');
    return;
  }

  try {
    const coach = coaches.find(c => (c.uid || c.id) === newAvailability.coachId);
    const dates = generateDateRange(newAvailability.startDate, newAvailability.endDate);
    
    console.log('Setting availability for:', {
      coach: coach?.name,
      coachId: newAvailability.coachId,
      dates,
      status: newAvailability.status,
      reason: newAvailability.reason
    });
    
    // Count affected schedules across all dates
    let totalAffectedSchedules = 0;
    const affectedSchedulesByDate = {};
    
    if (newAvailability.status !== 'available') {
      for (const date of dates) {
        const affectedSchedules = schedules.filter(s => 
          s.coachId === newAvailability.coachId && s.date === date
        );
        if (affectedSchedules.length > 0) {
          affectedSchedulesByDate[date] = affectedSchedules;
          totalAffectedSchedules += affectedSchedules.length;
        }
      }
      
      if (totalAffectedSchedules > 0) {
        const dateRange = dates.length === 1 ? 
          formatDatePST(dates[0]) : 
          `${formatDatePST(dates[0])} to ${formatDatePST(dates[dates.length - 1])}`;
          
        const confirmMessage = `${coach?.name} has ${totalAffectedSchedules} client(s) scheduled from ${dateRange}.\n\nSetting them as ${newAvailability.status} will unassign these clients. Continue?`;
        
        if (!window.confirm(confirmMessage)) {
          return;
        }
        
        // Unassign clients for all affected dates
        console.log('Unassigning clients from affected schedules...');
        for (const [date, scheduleList] of Object.entries(affectedSchedulesByDate)) {
          for (const schedule of scheduleList) {
            await scheduleActions.remove(schedule.id);
            console.log('Removed schedule:', schedule.id, 'for date:', date);
          }
        }
      }
    }
    
    // Set availability for all dates
    console.log('Setting availability...');
    console.log('availabilityActions.setCoachAvailabilityBulk exists:', !!availabilityActions.setCoachAvailabilityBulk);
    
    if (availabilityActions.setCoachAvailabilityBulk) {
      console.log('Using bulk availability function');
      const result = await availabilityActions.setCoachAvailabilityBulk(
        newAvailability.coachId,
        dates,
        newAvailability.status,
        newAvailability.reason
      );
      console.log('Bulk availability result:', result);
    } else {
      console.log('Using individual availability calls as fallback');
      // Fallback to individual calls
      for (const date of dates) {
        console.log('Setting availability for date:', date);
        const result = await availabilityActions.setCoachAvailability(
          newAvailability.coachId,
          date,
          newAvailability.status,
          newAvailability.reason
        );
        console.log('Individual availability result for', date, ':', result);
      }
    }
    
    // Reset form
    setNewAvailability({
      coachId: '',
      startDate: selectedDate || getPSTDate(),
      endDate: selectedDate || getPSTDate(),
      status: 'off',
      reason: ''
    });
    setShowAddForm(false);
    
    const statusLabel = getStatusDisplay(newAvailability.status).label;
    const dateRange = dates.length === 1 ? 
      formatDatePST(dates[0]) : 
      `${formatDatePST(dates[0])} to ${formatDatePST(dates[dates.length - 1])}`;
    
    alert(`${coach?.name} set as ${statusLabel} from ${dateRange}`);
    
    // Reload yearly data if we're in yearly view
    if (activeView === 'yearly') {
      console.log('Reloading yearly data...');
      loadYearlyData();
    }
    
    // Debug: Check if the availability records have been updated
    console.log('Current availability records:', availabilityActions);
    
    // Force a check of the coach's availability for one of the dates
    if (dates.length > 0) {
      const testDate = dates[0];
      const isAvailable = availabilityActions.isCoachAvailable(newAvailability.coachId, testDate);
      const status = availabilityActions.getCoachStatusForDate(newAvailability.coachId, testDate);
      const reason = availabilityActions.getCoachReasonForDate(newAvailability.coachId, testDate);
      
      console.log('Availability check after setting:', {
        date: testDate,
        coachId: newAvailability.coachId,
        isAvailable,
        status,
        reason
      });
    }
    
  } catch (error) {
    console.error('Error setting availability:', error);
    alert(`Error setting availability: ${error.message}`);
  }
};

  const handleRemoveAvailability = async (coachId, date) => {
    const coach = coaches.find(c => (c.uid || c.id) === coachId);
    
    if (window.confirm(`Remove availability setting for ${coach?.name} on ${formatDatePST(date)}? They will be set back to available.`)) {
      try {
        await availabilityActions.removeCoachAvailability(coachId, date);
        alert(`${coach?.name} is now available on ${formatDatePST(date)}`);
      } catch (error) {
        alert(`Error removing availability: ${error.message}`);
      }
    }
  };

  // Get coaches with their availability for the selected date
  const coachesWithAvailability = coaches.map(coach => {
    const coachId = coach.uid || coach.id;
    const status = availabilityActions.getCoachStatusForDate(coachId, selectedDate);
    const reason = availabilityActions.getCoachReasonForDate(coachId, selectedDate);
    
    return {
      ...coach,
      availabilityStatus: status,
      availabilityReason: reason,
      isAvailable: status === 'available'
    };
  });

  const availableCoaches = coachesWithAvailability.filter(c => c.isAvailable);
  const unavailableCoaches = coachesWithAvailability.filter(c => !c.isAvailable);

  // Yearly view component
  const renderYearlyView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold text-[#292929]">Yearly Time-Off Summary</h4>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentYear(currentYear - 1)}
            className="p-2 text-[#6D858E] hover:bg-[#BED2D8] rounded"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-lg font-semibold text-[#292929] min-w-[80px] text-center">
            {currentYear}
          </span>
          <button
            onClick={() => setCurrentYear(currentYear + 1)}
            className="p-2 text-[#6D858E] hover:bg-[#BED2D8] rounded"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coaches.map(coach => {
          const coachId = coach.uid || coach.id;
          const summary = yearlyData[coachId] || { totalDays: 0, byStatus: {}, periods: [] };
          
          return (
            <div key={coach.id} className="bg-white p-6 rounded-lg shadow-md border">
              <h5 className="font-semibold text-lg text-[#292929] mb-4">{coach.name}</h5>
              <p className="text-sm text-[#707070] mb-4 capitalize">{coach.role} - {coach.coachType || 'success'} coach</p>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[#707070]">Total Days Off:</span>
                  <span className="font-semibold text-[#292929]">{summary.totalDays}</span>
                </div>
                
                {Object.entries(summary.byStatus || {}).map(([status, count]) => {
                  const statusDisplay = getStatusDisplay(status);
                  return (
                    <div key={status} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <statusDisplay.icon size={16} className={statusDisplay.color} />
                        <span className="text-sm text-[#707070]">{statusDisplay.label}:</span>
                      </div>
                      <span className="font-semibold text-[#292929]">{count}</span>
                    </div>
                  );
                })}
                
                {summary.periods && summary.periods.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-sm font-medium text-[#292929] mb-2">Recent Periods:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {summary.periods.slice(-3).map((period, index) => {
                        const statusDisplay = getStatusDisplay(period.status);
                        return (
                          <div key={index} className="text-xs text-[#707070]">
                            <span className={statusDisplay.color}>{statusDisplay.label}</span>
                            {period.startDate === period.endDate ? (
                              <span> on {formatDatePST(period.startDate)}</span>
                            ) : (
                              <span> from {formatDatePST(period.startDate)} to {formatDatePST(period.endDate)}</span>
                            )}
                            {period.reason && <span> - {period.reason}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* View Tabs */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-1 bg-[#F5F5F5] rounded-lg p-1">
          <button
            onClick={() => setActiveView('daily')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'daily' 
                ? 'bg-white text-[#6D858E] shadow-sm' 
                : 'text-[#707070] hover:text-[#292929]'
            }`}
          >
            Daily View
          </button>
          <button
            onClick={() => setActiveView('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'yearly' 
                ? 'bg-white text-[#6D858E] shadow-sm' 
                : 'text-[#707070] hover:text-[#292929]'
            }`}
          >
            Yearly Summary
          </button>
        </div>
        
        {activeView === 'daily' && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-[#707070]">
              {formatDatePST(selectedDate)}
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#6D858E] text-white px-4 py-2 rounded-md hover:bg-[#5A4E69] flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Set Time Off</span>
            </button>
          </div>
        )}
      </div>

      {/* Content based on active view */}
      {activeView === 'yearly' ? renderYearlyView() : (
        <>
          {/* Enhanced Add/Edit Availability Form */}
          {showAddForm && (
            <div className="bg-[#F5F5F5] p-6 rounded-lg border">
              <h4 className="font-semibold mb-4 text-[#292929]">Set Coach Time Off</h4>
              <form onSubmit={handleSetAvailability} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#292929]">Coach</label>
                    <select
                      value={newAvailability.coachId}
                      onChange={(e) => setNewAvailability({...newAvailability, coachId: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                      required
                    >
                      <option value="">Select Coach</option>
                      {coaches.map(coach => (
                        <option key={coach.id} value={coach.uid || coach.id}>
                          {coach.name} - {coach.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#292929]">Status</label>
                    <select
                      value={newAvailability.status}
                      onChange={(e) => setNewAvailability({...newAvailability, status: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                      required
                    >
                      {statusOptions.filter(opt => opt.value !== 'available').map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#292929]">Start Date</label>
                    <input
                      type="date"
                      value={newAvailability.startDate}
                      onChange={(e) => setNewAvailability({...newAvailability, startDate: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#292929]">End Date</label>
                    <input
                      type="date"
                      value={newAvailability.endDate}
                      onChange={(e) => setNewAvailability({...newAvailability, endDate: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#292929]">
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={newAvailability.reason}
                    onChange={(e) => setNewAvailability({...newAvailability, reason: e.target.value})}
                    placeholder="e.g., Family vacation, Doctor appointment..."
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                  />
                </div>
                
                {/* Date range preview */}
                {newAvailability.startDate && newAvailability.endDate && (
                  <div className="bg-[#BED2D8] p-3 rounded-md">
                    <p className="text-sm text-[#292929]">
                      <strong>Date Range:</strong> {
                        newAvailability.startDate === newAvailability.endDate 
                          ? formatDatePST(newAvailability.startDate)
                          : `${formatDatePST(newAvailability.startDate)} to ${formatDatePST(newAvailability.endDate)}`
                      }
                    </p>
                    <p className="text-sm text-[#707070]">
                      Total days: {generateDateRange(newAvailability.startDate, newAvailability.endDate).length}
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-[#6D858E] text-white px-6 py-2 rounded-md hover:bg-[#5A4E69]"
                  >
                    Set Time Off
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-[#9B97A2] text-white px-6 py-2 rounded-md hover:bg-[#707070]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Daily availability view (existing content) */}
          {/* Available Coaches */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="text-lg font-semibold mb-4 text-green-600 flex items-center">
              <CheckCircle className="mr-2" size={20} />
              Available Coaches ({availableCoaches.length})
            </h4>
            {availableCoaches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableCoaches.map(coach => (
                  <div key={coach.id} className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-semibold text-[#292929]">{coach.name}</h5>
                        <p className="text-sm text-[#707070] capitalize">{coach.role}</p>
                        <p className="text-sm text-[#6D858E]">{coach.coachType === 'success' ? 'Success Coach' : 'Grace Coach'}</p>
                      </div>
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#9B97A2] italic">No coaches available on this date</p>
            )}
          </div>

          {/* Unavailable Coaches */}
          {unavailableCoaches.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-4 text-red-600 flex items-center">
                <X className="mr-2" size={20} />
                Unavailable Coaches ({unavailableCoaches.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unavailableCoaches.map(coach => {
                  const statusDisplay = getStatusDisplay(coach.availabilityStatus);
                  const Icon = statusDisplay.icon;
                  
                  return (
                    <div key={coach.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-semibold text-[#292929]">{coach.name}</h5>
                          <p className="text-sm text-[#707070] capitalize">{coach.role}</p>
                        </div>
                        <Icon size={20} className={statusDisplay.color} />
                      </div>
                      <div className="space-y-1">
                        <p className={`text-sm font-medium ${statusDisplay.color}`}>
                          {statusDisplay.label}
                        </p>
                        {coach.availabilityReason && (
                          <p className="text-sm text-[#707070]">{coach.availabilityReason}</p>
                        )}
                        <button
                          onClick={() => handleRemoveAvailability(coach.uid || coach.id, selectedDate)}
                          className="text-xs text-[#6D858E] hover:text-[#5A4E69] underline"
                        >
                          Set as Available
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-[#BED2D8] p-4 rounded-lg border-l-4 border-[#6D858E]">
            <h4 className="font-semibold text-[#292929] mb-2">Availability Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-[#707070]">Total Coaches:</span>
                <p className="font-semibold text-[#292929]">{coaches.length}</p>
              </div>
              <div>
                <span className="text-green-600">Available:</span>
                <p className="font-semibold text-green-600">{availableCoaches.length}</p>
              </div>
              <div>
                <span className="text-red-600">Unavailable:</span>
                <p className="font-semibold text-red-600">{unavailableCoaches.length}</p>
              </div>
              <div>
                <span className="text-[#707070]">Success Coaches Available:</span>
                <p className="font-semibold text-[#6D858E]">
                  {availableCoaches.filter(c => (c.coachType || 'success') === 'success').length}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EnhancedCoachAvailabilityManager;