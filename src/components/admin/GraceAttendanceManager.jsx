// src/components/admin/GraceAttendanceManager.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, X, Users, Calendar, TrendingUp, BarChart, AlertTriangle } from 'lucide-react';
import { formatDatePST, getPSTDate } from '../../utils/dateUtils';
import { getClientInitials } from '../../utils/helpers';

const GraceAttendanceManager = ({ 
  clients,
  graceAttendanceActions,
  selectedDate 
}) => {
  const [activeView, setActiveView] = useState('daily'); // 'daily', 'summary', 'reports'
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState({});
  const [summaryData, setSummaryData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Filter Grace clients only
  const graceClients = clients.filter(client => client.program === 'grace');

  // Load attendance status for the selected date
  useEffect(() => {
    loadAttendanceForDate();
  }, [selectedDate, graceClients]);

  // Load summary data when view changes to summary
  useEffect(() => {
    if (activeView === 'summary') {
      loadSummaryData();
    }
  }, [activeView, selectedMonth, selectedYear]);

  const loadAttendanceForDate = async () => {
    if (graceClients.length === 0) return;
    
    setLoading(true);
    try {
      const clientIds = graceClients.map(client => client.id);
      const attendanceMap = await graceAttendanceActions.getClientsAttendanceStatus(clientIds, selectedDate);
      
      // Convert to our state format
      const status = {};
      const notesList = {};
      
      Object.entries(attendanceMap).forEach(([clientId, record]) => {
        if (record) {
          status[clientId] = record.present;
          notesList[clientId] = record.notes || '';
        } else {
          status[clientId] = null; // Not marked yet
          notesList[clientId] = '';
        }
      });
      
      setAttendanceStatus(status);
      setNotes(notesList);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummaryData = async () => {
    try {
      const startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
      const endDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-31`;
      
      const summary = await graceAttendanceActions.getAllClientsSummary(startDate, endDate);
      setSummaryData(summary);
    } catch (error) {
      console.error('Error loading summary data:', error);
    }
  };

  const handleAttendanceChange = async (clientId, present) => {
    setAttendanceStatus(prev => ({
      ...prev,
      [clientId]: present
    }));
    
    try {
      await graceAttendanceActions.markClientAttendance(
        clientId, 
        selectedDate, 
        present, 
        notes[clientId] || ''
      );
    } catch (error) {
      console.error('Error marking attendance:', error);
      // Revert the change
      setAttendanceStatus(prev => ({
        ...prev,
        [clientId]: attendanceStatus[clientId]
      }));
      alert('Error marking attendance. Please try again.');
    }
  };

  const handleNotesChange = (clientId, noteText) => {
    setNotes(prev => ({
      ...prev,
      [clientId]: noteText
    }));
  };

  const handleNotesSubmit = async (clientId) => {
    if (attendanceStatus[clientId] === null) {
      alert('Please mark attendance first before adding notes.');
      return;
    }
    
    try {
      await graceAttendanceActions.markClientAttendance(
        clientId, 
        selectedDate, 
        attendanceStatus[clientId], 
        notes[clientId] || ''
      );
      alert('Notes saved successfully!');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Error saving notes. Please try again.');
    }
  };

  const handleMarkAllPresent = async () => {
    if (window.confirm('Mark all Grace participants as present for today?')) {
      const attendanceRecords = graceClients.map(client => ({
        clientId: client.id,
        present: true,
        notes: notes[client.id] || ''
      }));
      
      try {
        await graceAttendanceActions.markMultipleAttendance(attendanceRecords, selectedDate);
        await loadAttendanceForDate(); // Refresh
        alert('All participants marked as present!');
      } catch (error) {
        console.error('Error marking all present:', error);
        alert('Error marking attendance. Please try again.');
      }
    }
  };

  const getAttendanceStats = () => {
    const marked = Object.values(attendanceStatus).filter(status => status !== null).length;
    const present = Object.values(attendanceStatus).filter(status => status === true).length;
    const absent = Object.values(attendanceStatus).filter(status => status === false).length;
    const unmarked = graceClients.length - marked;
    
    return { marked, present, absent, unmarked, total: graceClients.length };
  };

  const stats = getAttendanceStats();

  // Daily attendance view
  const renderDailyView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-lg font-semibold text-[#292929]">
            Grace Attendance - {formatDatePST(selectedDate)}
          </h4>
          <p className="text-sm text-[#707070]">
            {stats.marked} of {stats.total} participants marked
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleMarkAllPresent}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
          >
            <CheckCircle size={16} />
            <span>Mark All Present</span>
          </button>
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-green-600 text-sm font-medium">Present</p>
              <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-red-600 text-sm font-medium">Absent</p>
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            </div>
            <X className="text-red-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Unmarked</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.unmarked}</p>
            </div>
            <AlertTriangle className="text-yellow-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#6D858E]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[#6D858E] text-sm font-medium">Attendance Rate</p>
              <p className="text-2xl font-bold text-[#6D858E]">
                {stats.marked > 0 ? Math.round((stats.present / stats.marked) * 100) : 0}%
              </p>
            </div>
            <TrendingUp className="text-[#6D858E]" size={24} />
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b bg-[#F5F5F5]">
          <h5 className="font-semibold text-[#292929]">Grace Participants ({graceClients.length})</h5>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-[#9B97A2]">Loading attendance...</div>
        ) : graceClients.length === 0 ? (
          <div className="p-8 text-center text-[#9B97A2]">
            <Users size={48} className="mx-auto mb-4" />
            <p>No Grace participants found</p>
          </div>
        ) : (
          <div className="divide-y">
            {graceClients.map(client => {
              const status = attendanceStatus[client.id];
              const clientNotes = notes[client.id] || '';
              
              return (
                <div key={client.id} className="p-4 hover:bg-[#F5F5F5]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Client Avatar */}
                      <div className="flex-shrink-0 h-10 w-10 bg-[#6D858E] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {getClientInitials(client.name)}
                        </span>
                      </div>
                      
                      {/* Client Info */}
                      <div>
                        <h6 className="font-semibold text-[#292929]">{client.name}</h6>
                        <p className="text-sm text-[#707070]">Grace Program</p>
                      </div>
                    </div>
                    
                    {/* Attendance Buttons */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleAttendanceChange(client.id, true)}
                        className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                          status === true 
                            ? 'bg-green-600 text-white' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        <CheckCircle size={16} />
                        <span>Present</span>
                      </button>
                      
                      <button
                        onClick={() => handleAttendanceChange(client.id, false)}
                        className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                          status === false 
                            ? 'bg-red-600 text-white' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        <X size={16} />
                        <span>Absent</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Notes Section */}
                  {status !== null && (
                    <div className="mt-3 pl-14">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Add notes (optional)..."
                          value={clientNotes}
                          onChange={(e) => handleNotesChange(client.id, e.target.value)}
                          className="flex-1 px-3 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                        />
                        <button
                          onClick={() => handleNotesSubmit(client.id)}
                          className="px-3 py-1 bg-[#6D858E] text-white text-sm rounded hover:bg-[#5A4E69]"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Summary/Reports view
  const renderSummaryView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold text-[#292929]">Grace Attendance Summary</h4>
        <div className="flex items-center space-x-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
          >
            {Array.from({length: 12}, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
          >
            {Array.from({length: 5}, (_, i) => (
              <option key={2022 + i} value={2022 + i}>
                {2022 + i}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {graceClients.map(client => {
          const clientSummary = summaryData[client.id] || {
            totalDays: 0,
            presentDays: 0,
            absentDays: 0,
            attendanceRate: 0
          };
          
          return (
            <div key={client.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 h-12 w-12 bg-[#6D858E] rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {getClientInitials(client.name)}
                  </span>
                </div>
                <div>
                  <h6 className="font-semibold text-[#292929]">{client.name}</h6>
                  <p className="text-sm text-[#707070]">Grace Program</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[#707070]">Attendance Rate:</span>
                  <span className={`font-semibold ${
                    clientSummary.attendanceRate >= 90 ? 'text-green-600' :
                    clientSummary.attendanceRate >= 75 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {clientSummary.attendanceRate}%
                  </span>
                </div>
                
                <div className="w-full bg-[#F5F5F5] rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      clientSummary.attendanceRate >= 90 ? 'bg-green-500' :
                      clientSummary.attendanceRate >= 75 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{width: `${clientSummary.attendanceRate}%`}}
                  ></div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="text-[#707070]">Total</p>
                    <p className="font-semibold text-[#292929]">{clientSummary.totalDays}</p>
                  </div>
                  <div>
                    <p className="text-green-600">Present</p>
                    <p className="font-semibold text-green-600">{clientSummary.presentDays}</p>
                  </div>
                  <div>
                    <p className="text-red-600">Absent</p>
                    <p className="font-semibold text-red-600">{clientSummary.absentDays}</p>
                  </div>
                </div>
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
      <div className="flex space-x-1 bg-[#F5F5F5] rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveView('daily')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'daily' 
              ? 'bg-white text-[#6D858E] shadow-sm' 
              : 'text-[#707070] hover:text-[#292929]'
          }`}
        >
          Daily Attendance
        </button>
        <button
          onClick={() => setActiveView('summary')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'summary' 
              ? 'bg-white text-[#6D858E] shadow-sm' 
              : 'text-[#707070] hover:text-[#292929]'
          }`}
        >
          Monthly Summary
        </button>
      </div>

      {/* Content based on active view */}
      {activeView === 'daily' ? renderDailyView() : renderSummaryView()}
    </div>
  );
};

export default GraceAttendanceManager;