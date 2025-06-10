// src/components/admin/EnhancedCoachAvailabilityManager.jsx - UPDATED with editing capabilities
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, User, AlertTriangle, CheckCircle, X, Plus, ChevronLeft, ChevronRight, Edit, Save } from 'lucide-react';
import { formatDatePST, getPSTDate, formatDateForInput } from '../../utils/dateUtils';
import { generateDateRange } from '../../services/firebase/coachAvailability';

const EnhancedCoachAvailabilityManager = ({ 
  coaches,
  availabilityActions,
  scheduleActions,
  schedules,
  selectedDate 
}) => {
  const [activeView, setActiveView] = useState('daily'); // 'daily', 'yearly', 'periods'
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [yearlyData, setYearlyData] = useState({});
  const [editingPeriod, setEditingPeriod] = useState(null); // For editing entire periods
  const [editingRecord, setEditingRecord] = useState(null); // For editing individual day records (daily view)
  const [timeOffPeriods, setTimeOffPeriods] = useState([]); // All time-off periods
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

  // NEW: Load all time-off periods
  useEffect(() => {
    loadTimeOffPeriods();
  }, [coaches, availabilityActions]);

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

  // NEW: Load all time-off periods for all coaches
  const loadTimeOffPeriods = async () => {
    try {
      const allPeriods = [];
      const today = getPSTDate();
      
      for (const coach of coaches) {
        const coachId = coach.uid || coach.id;
        
        // Get periods from 30 days ago to 180 days in the future
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 180);
        
        const periods = await getCoachTimeOffPeriods(coachId, startDate, endDate);
        allPeriods.push(...periods.map(period => ({
          ...period,
          coach,
          coachId,
          isPast: period.endDate < today,
          isCurrent: period.startDate <= today && period.endDate >= today,
          isFuture: period.startDate > today
        })));
      }
      
      // Sort by start date
      allPeriods.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      setTimeOffPeriods(allPeriods);
      
    } catch (error) {
      console.error('Error loading time-off periods:', error);
    }
  };

  // NEW: Get time-off periods for a coach by grouping consecutive days
  const getCoachTimeOffPeriods = async (coachId, startDate, endDate) => {
    const periods = [];
    const dates = generateDateRange(
      formatDateForInput(startDate), 
      formatDateForInput(endDate)
    );
    
    let currentPeriod = null;
    
    for (const date of dates) {
      const status = availabilityActions.getCoachStatusForDate(coachId, date);
      const reason = availabilityActions.getCoachReasonForDate(coachId, date);
      
      if (status !== 'available') {
        if (!currentPeriod || currentPeriod.status !== status || currentPeriod.reason !== reason) {
          // Start new period
          if (currentPeriod) {
            periods.push(currentPeriod);
          }
          currentPeriod = {
            id: `${coachId}-${date}-${status}`,
            startDate: date,
            endDate: date,
            status,
            reason: reason || '',
            totalDays: 1
          };
        } else {
          // Extend current period
          currentPeriod.endDate = date;
          currentPeriod.totalDays++;
        }
      } else {
        // Available day - end current period if exists
        if (currentPeriod) {
          periods.push(currentPeriod);
          currentPeriod = null;
        }
      }
    }
    
    // Add final period if exists
    if (currentPeriod) {
      periods.push(currentPeriod);
    }
    
    return periods;
  };

  // Get all availability records for the selected date (for daily view)
  const getAvailabilityRecordsForDate = (date) => {
    return coaches.map(coach => {
      const coachId = coach.uid || coach.id;
      const status = availabilityActions.getCoachStatusForDate(coachId, date);
      const reason = availabilityActions.getCoachReasonForDate(coachId, date);
      
      return {
        coachId,
        coach,
        date,
        status,
        reason,
        hasRecord: status !== 'available'
      };
    }).filter(record => record.hasRecord);
  };

  // Edit functions for daily view individual records
  const handleStartEdit = (record) => {
    setEditingRecord({
      ...record,
      originalDate: record.date,
      originalStatus: record.status,
      originalReason: record.reason
    });
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    try {
      const { coachId, date, status, reason, originalDate } = editingRecord;
      
      if (date !== originalDate) {
        await availabilityActions.removeCoachAvailability(coachId, originalDate);
        if (status !== 'available') {
          await availabilityActions.setCoachAvailability(coachId, date, status, reason);
        }
      } else {
        if (status === 'available') {
          await availabilityActions.removeCoachAvailability(coachId, date);
        } else {
          await availabilityActions.setCoachAvailability(coachId, date, status, reason);
        }
      }
      
      setEditingRecord(null);
      alert('Availability record updated successfully!');
      
    } catch (error) {
      console.error('Error updating availability:', error);
      alert(`Error updating availability: ${error.message}`);
    }
  };

  const handleDeleteRecord = async (coachId, date, coachName) => {
    if (window.confirm(`Remove time off for ${coachName} on ${formatDatePST(date)}? They will be set back to available.`)) {
      try {
        await availabilityActions.removeCoachAvailability(coachId, date);
        alert(`${coachName} is now available on ${formatDatePST(date)}`);
      } catch (error) {
        alert(`Error removing availability: ${error.message}`);
      }
    }
  };
  const handleStartEditPeriod = (period) => {
    setEditingPeriod({
      ...period,
      originalStartDate: period.startDate,
      originalEndDate: period.endDate,
      originalStatus: period.status,
      originalReason: period.reason
    });
  };

  // NEW: Cancel editing period
  const handleCancelEditPeriod = () => {
    setEditingPeriod(null);
  };

  // NEW: Save edited period
  const handleSaveEditPeriod = async () => {
    if (!editingPeriod) return;

    try {
      const { 
        coachId, 
        startDate, 
        endDate, 
        status, 
        reason, 
        originalStartDate, 
        originalEndDate 
      } = editingPeriod;
      
      // Remove the original period dates
      const originalDates = generateDateRange(originalStartDate, originalEndDate);
      for (const date of originalDates) {
        await availabilityActions.removeCoachAvailability(coachId, date);
      }
      
      // Set new period if not marking as available
      if (status !== 'available') {
        const newDates = generateDateRange(startDate, endDate);
        
        if (availabilityActions.setCoachAvailabilityBulk) {
          await availabilityActions.setCoachAvailabilityBulk(coachId, newDates, status, reason);
        } else {
          for (const date of newDates) {
            await availabilityActions.setCoachAvailability(coachId, date, status, reason);
          }
        }
      }
      
      setEditingPeriod(null);
      loadTimeOffPeriods(); // Reload periods
      alert('Time-off period updated successfully!');
      
    } catch (error) {
      console.error('Error updating period:', error);
      alert(`Error updating period: ${error.message}`);
    }
  };

  // NEW: Delete entire period
  const handleDeletePeriod = async (period) => {
    const { coach, startDate, endDate, status } = period;
    const statusDisplay = getStatusDisplay(status);
    const dateRange = startDate === endDate ? 
      formatDatePST(startDate) : 
      `${formatDatePST(startDate)} to ${formatDatePST(endDate)}`;
    
    if (window.confirm(`Remove ${statusDisplay.label.toLowerCase()} for ${coach.name} from ${dateRange}? They will be set back to available for all these dates.`)) {
      try {
        const dates = generateDateRange(startDate, endDate);
        for (const date of dates) {
          await availabilityActions.removeCoachAvailability(period.coachId, date);
        }
        loadTimeOffPeriods(); // Reload periods
        alert(`${coach.name} is now available from ${dateRange}`);
      } catch (error) {
        alert(`Error removing time-off period: ${error.message}`);
      }
    }
  };

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
          for (const [date, scheduleList] of Object.entries(affectedSchedulesByDate)) {
            for (const schedule of scheduleList) {
              await scheduleActions.remove(schedule.id);
            }
          }
        }
      }
      
      // Set availability for all dates
      if (availabilityActions.setCoachAvailabilityBulk) {
        await availabilityActions.setCoachAvailabilityBulk(
          newAvailability.coachId,
          dates,
          newAvailability.status,
          newAvailability.reason
        );
      } else {
        // Fallback to individual calls
        for (const date of dates) {
          await availabilityActions.setCoachAvailability(
            newAvailability.coachId,
            date,
            newAvailability.status,
            newAvailability.reason
          );
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
      
      // Reload data based on current view
      if (activeView === 'yearly') {
        loadYearlyData();
      } else if (activeView === 'periods') {
        loadTimeOffPeriods();
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

  // NEW: Render periods view
  const renderPeriodsView = () => {
    const currentPeriods = timeOffPeriods.filter(p => p.isCurrent);
    const futurePeriods = timeOffPeriods.filter(p => p.isFuture);
    const pastPeriods = timeOffPeriods.filter(p => p.isPast).slice(-10); // Show last 10 past periods
    
    return (
      <div className="space-y-6">
        {/* Current/Active Periods */}
        {currentPeriods.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
            <h5 className="text-lg font-semibold mb-4 text-orange-600 flex items-center">
              <AlertTriangle className="mr-2" size={20} />
              Currently Off ({currentPeriods.length})
            </h5>
            <div className="space-y-3">
              {currentPeriods.map(period => renderPeriodCard(period, true))}
            </div>
          </div>
        )}

        {/* Future Periods */}
        {futurePeriods.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h5 className="text-lg font-semibold mb-4 text-blue-600 flex items-center">
              <Calendar className="mr-2" size={20} />
              Upcoming Time Off ({futurePeriods.length})
            </h5>
            <div className="space-y-3">
              {futurePeriods.map(period => renderPeriodCard(period, false))}
            </div>
          </div>
        )}

        {/* Past Periods (Recent) */}
        {pastPeriods.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-400">
            <h5 className="text-lg font-semibold mb-4 text-gray-600 flex items-center">
              <CheckCircle className="mr-2" size={20} />
              Recent Past Time Off (Last 10)
            </h5>
            <div className="space-y-3">
              {pastPeriods.map(period => renderPeriodCard(period, false, true))}
            </div>
          </div>
        )}

        {timeOffPeriods.length === 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Calendar size={48} className="mx-auto mb-4 text-[#9B97A2]" />
            <h3 className="text-lg font-semibold text-[#292929] mb-2">No Time-Off Periods Found</h3>
            <p className="text-[#707070]">No scheduled time off in the next 6 months.</p>
          </div>
        )}
      </div>
    );
  };

  // NEW: Render individual period card
  const renderPeriodCard = (period, isCurrent = false, isPast = false) => {
    const statusDisplay = getStatusDisplay(period.status);
    const Icon = statusDisplay.icon;
    const isEditing = editingPeriod?.id === period.id;
    const dateRange = period.startDate === period.endDate ? 
      formatDatePST(period.startDate) : 
      `${formatDatePST(period.startDate)} to ${formatDatePST(period.endDate)}`;
    
    return (
      <div key={period.id} className={`p-4 border rounded-lg ${
        isCurrent ? 'border-orange-200 bg-orange-50' :
        isPast ? 'border-gray-200 bg-gray-50' :
        'border-blue-200 bg-blue-50'
      }`}>
        {isEditing ? (
          // Edit Mode
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h6 className="font-semibold text-[#292929]">{period.coach.name}</h6>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveEditPeriod}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
                >
                  <Save size={14} />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={handleCancelEditPeriod}
                  className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 flex items-center space-x-1"
                >
                  <X size={14} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={editingPeriod.startDate}
                  onChange={(e) => setEditingPeriod({...editingPeriod, startDate: e.target.value})}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={editingPeriod.endDate}
                  onChange={(e) => setEditingPeriod({...editingPeriod, endDate: e.target.value})}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editingPeriod.status}
                  onChange={(e) => setEditingPeriod({...editingPeriod, status: e.target.value})}
                  className="w-full px-2 py-1 border rounded text-sm"
                >
                  <option value="available">Available</option>
                  {statusOptions.filter(opt => opt.value !== 'available').map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <input
                  type="text"
                  value={editingPeriod.reason}
                  onChange={(e) => setEditingPeriod({...editingPeriod, reason: e.target.value})}
                  className="w-full px-2 py-1 border rounded text-sm"
                  placeholder="Optional reason..."
                />
              </div>
            </div>
            
            {/* Preview of changes */}
            <div className="bg-white p-3 rounded border">
              <p className="text-sm text-[#292929]">
                <strong>Preview:</strong> {editingPeriod.status === 'available' ? 
                  'Will be set as available (removes time off)' :
                  `${getStatusDisplay(editingPeriod.status).label} from ${
                    editingPeriod.startDate === editingPeriod.endDate ? 
                    formatDatePST(editingPeriod.startDate) :
                    `${formatDatePST(editingPeriod.startDate)} to ${formatDatePST(editingPeriod.endDate)}`
                  }`
                }
              </p>
              <p className="text-xs text-[#707070]">
                Duration: {generateDateRange(editingPeriod.startDate, editingPeriod.endDate).length} day(s)
              </p>
            </div>
          </div>
        ) : (
          // View Mode
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h6 className="font-semibold text-[#292929]">{period.coach.name}</h6>
                <div className="flex items-center space-x-2">
                  <Icon size={16} className={statusDisplay.color} />
                  <span className={`text-sm font-medium ${statusDisplay.color}`}>
                    {statusDisplay.label}
                  </span>
                </div>
                {isCurrent && (
                  <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full font-medium">
                    CURRENT
                  </span>
                )}
              </div>
              
              <div className="text-sm text-[#707070] space-y-1">
                <div><strong>Dates:</strong> {dateRange}</div>
                <div><strong>Duration:</strong> {period.totalDays} day{period.totalDays !== 1 ? 's' : ''}</div>
                {period.reason && <div><strong>Reason:</strong> {period.reason}</div>}
              </div>
            </div>
            
            {!isPast && (
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleStartEditPeriod(period)}
                  className="bg-[#6D858E] text-white px-3 py-1 rounded text-sm hover:bg-[#5A4E69] flex items-center space-x-1"
                >
                  <Edit size={14} />
                  <span>Edit Period</span>
                </button>
                <button
                  onClick={() => handleDeletePeriod(period)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center space-x-1"
                >
                  <X size={14} />
                  <span>Remove</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
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
          <button
            onClick={() => setActiveView('periods')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'periods' 
                ? 'bg-white text-[#6D858E] shadow-sm' 
                : 'text-[#707070] hover:text-[#292929]'
            }`}
          >
            Time-Off Periods
          </button>
        </div>
        
        {activeView === 'daily' && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-[#707070]">
              {formatDatePST(selectedDate)}
            </span>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-[#6D858E] text-white px-4 py-2 rounded-md hover:bg-[#5A4E69] flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Set Time Off</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content based on active view */}
      {activeView === 'yearly' && renderYearlyView()}
      
      {activeView === 'periods' && renderPeriodsView()}
      
      {activeView === 'daily' && (
        <div>
          {/* Add/Edit Availability Form */}
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

          {/* NEW: Current Time Off Records with Edit Capabilities */}
          {getAvailabilityRecordsForDate(selectedDate).length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-4 text-[#292929] flex items-center">
                <Calendar className="mr-2" size={20} />
                Time Off Records for {formatDatePST(selectedDate)}
              </h4>
              <div className="space-y-3">
                {getAvailabilityRecordsForDate(selectedDate).map(record => {
                  const statusDisplay = getStatusDisplay(record.status);
                  const Icon = statusDisplay.icon;
                  const isEditing = editingRecord?.coachId === record.coachId && editingRecord?.originalDate === record.date;
                  
                  return (
                    <div key={`${record.coachId}-${record.date}`} className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                      {isEditing ? (
                        // Edit Mode
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h5 className="font-semibold text-[#292929]">{record.coach.name}</h5>
                            <div className="flex space-x-2">
                              <button
                                onClick={handleSaveEdit}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
                              >
                                <Save size={14} />
                                <span>Save</span>
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 flex items-center space-x-1"
                              >
                                <X size={14} />
                                <span>Cancel</span>
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">Date</label>
                              <input
                                type="date"
                                value={editingRecord.date}
                                onChange={(e) => setEditingRecord({...editingRecord, date: e.target.value})}
                                className="w-full px-2 py-1 border rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Status</label>
                              <select
                                value={editingRecord.status}
                                onChange={(e) => setEditingRecord({...editingRecord, status: e.target.value})}
                                className="w-full px-2 py-1 border rounded text-sm"
                              >
                                <option value="available">Available</option>
                                {statusOptions.filter(opt => opt.value !== 'available').map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Reason</label>
                              <input
                                type="text"
                                value={editingRecord.reason}
                                onChange={(e) => setEditingRecord({...editingRecord, reason: e.target.value})}
                                className="w-full px-2 py-1 border rounded text-sm"
                                placeholder="Optional reason..."
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-semibold text-[#292929]">{record.coach.name}</h5>
                            <div className="flex items-center space-x-2 mt-1">
                              <Icon size={16} className={statusDisplay.color} />
                              <span className={`text-sm font-medium ${statusDisplay.color}`}>
                                {statusDisplay.label}
                              </span>
                            </div>
                            {record.reason && (
                              <p className="text-sm text-[#707070] mt-1">{record.reason}</p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleStartEdit(record)}
                              className="bg-[#6D858E] text-white px-3 py-1 rounded text-sm hover:bg-[#5A4E69] flex items-center space-x-1"
                            >
                              <Edit size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record.coachId, record.date, record.coach.name)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center space-x-1"
                            >
                              <X size={14} />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
        </div>
      )}
    </div>
  );
};

export default EnhancedCoachAvailabilityManager;