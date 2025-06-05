// src/components/grace/GraceAttendancePage.jsx 
import React, { useState, useEffect } from 'react';
import { CheckCircle, X, Users, Calendar, TrendingUp, BarChart, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDatePST, getPSTDate } from '../../utils/dateUtils';
import { getClientInitials } from '../../utils/helpers';

const GraceAttendancePage = ({ 
  clients,
  graceAttendanceActions
}) => {
  const [activeView, setActiveView] = useState('daily'); // 'daily', 'summary'
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState({});
  const [selectedDate, setSelectedDate] = useState(getPSTDate());
  const [summaryData, setSummaryData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  

  // Filter Grace clients only
  const graceClients = clients ? clients.filter(client => {
    console.log('Checking client:', client.name, 'program:', client.program);
    return client.program === 'grace';
  }) : [];

  console.log('Grace clients found:', graceClients.length, graceClients);

  // Load attendance status for the selected date
  useEffect(() => {
    if (graceClients.length > 0 && graceAttendanceActions) {
      loadAttendanceForDate();
    }
  }, [selectedDate, graceClients.length]);

  // Load summary data when view changes to summary
  useEffect(() => {
    if (activeView === 'summary' && graceAttendanceActions) {
      loadSummaryData();
    }
  }, [activeView, selectedMonth, selectedYear]);

  const loadAttendanceForDate = async () => {
    if (graceClients.length === 0 || !graceAttendanceActions) {
      console.log('Cannot load attendance - no Grace clients or actions');
      return;
    }
    
    console.log('Loading attendance for date:', selectedDate);
    setLoading(true);
    
    try {
      const clientIds = graceClients.map(client => client.id);
      console.log('Client IDs:', clientIds);
      
      const attendanceMap = await graceAttendanceActions.getClientsAttendanceStatus(clientIds, selectedDate);
      console.log('Attendance map received:', attendanceMap);
      
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
      
      console.log('Setting attendance status:', status);
      setAttendanceStatus(status);
      setNotes(notesList);
    } catch (error) {
      console.error('Error loading attendance:', error);
      alert('Error loading attendance data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSummaryData = async () => {
    if (!graceAttendanceActions) return;
    
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
    console.log('Marking attendance:', clientId, present);
    
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
      console.log('Attendance marked successfully');
    } catch (error) {
      console.error('Error marking attendance:', error);
      // Revert the change
      setAttendanceStatus(prev => ({
        ...prev,
        [clientId]: attendanceStatus[clientId]
      }));
      alert('Error marking attendance. Please try again: ' + error.message);
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
          <h3 className="text-xl font-semibold text-[#292929]">
            Grace Attendance - {formatDatePST(selectedDate)}
          </h3>
          <p className="text-sm text-[#707070]">
            {stats.marked} of {stats.total} participants marked
          </p>
        </div>
        <div className="flex space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4E69]"
          />
          {graceClients.length > 0 && (
            <button
              onClick={handleMarkAllPresent}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
            >
              <CheckCircle size={16} />
              <span>Mark All Present</span>
            </button>
          )}
        </div>
      </div>

      {/* Attendance Stats */}
      {graceClients.length > 0 && (
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
          
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#5A4E69]">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#5A4E69] text-sm font-medium">Attendance Rate</p>
                <p className="text-2xl font-bold text-[#5A4E69]">
                  {stats.marked > 0 ? Math.round((stats.present / stats.marked) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="text-[#5A4E69]" size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Attendance List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b bg-[#F5F5F5]">
          <h4 className="font-semibold text-[#292929]">Grace Participants ({graceClients.length})</h4>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-[#9B97A2]">Loading attendance...</div>
        ) : graceClients.length === 0 ? (
          <div className="p-8 text-center text-[#9B97A2]">
            <Users size={48} className="mx-auto mb-4" />
            <p className="text-lg font-medium">No Grace participants found</p>
            <p className="text-sm mt-2">
              {!clients ? 'No clients data available' : 
               clients.length === 0 ? 'No clients in system' :
               'No clients have program set to "grace"'}
            </p>
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
                      <div className="flex-shrink-0 h-10 w-10 bg-[#5A4E69] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {getClientInitials(client.name)}
                        </span>
                      </div>
                      
                      {/* Client Info */}
                      <div>
                        <h6 className="font-semibold text-[#292929]">{client.name}</h6>
                        <p className="text-sm text-[#707070]">Grace Program</p>
                        <p className="text-xs text-[#9B97A2]">ID: {client.id}</p>
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
                          className="flex-1 px-3 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-[#5A4E69]"
                        />
                        <button
                          onClick={() => handleNotesSubmit(client.id)}
                          className="px-3 py-1 bg-[#5A4E69] text-white text-sm rounded hover:bg-[#292929]"
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

  // Summary/Reports view (simplified for debugging)
  const renderSummaryView = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <p className="text-[#9B97A2]">Summary view coming soon...</p>
        <p className="text-sm text-[#707070]">Grace clients: {graceClients.length}</p>
      </div>
    </div>
  );

  // Show error state if no graceAttendanceActions
  if (!graceAttendanceActions) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-[#292929] mb-4">Grace Attendance Unavailable</h2>
          <p className="text-[#707070] mb-4">
            Grace attendance actions are not available. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5A4E69] to-[#292929] text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Grace Attendance Tracking</h2>
        <p className="text-[#BED2D8]">Enrichment program attendance management</p>
      </div>

      {/* View Tabs */}
      <div className="flex space-x-1 bg-[#F5F5F5] rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveView('daily')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'daily' 
              ? 'bg-white text-[#5A4E69] shadow-sm' 
              : 'text-[#707070] hover:text-[#292929]'
          }`}
        >
          Daily Attendance
        </button>
        <button
          onClick={() => setActiveView('summary')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'summary' 
              ? 'bg-white text-[#5A4E69] shadow-sm' 
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

export default GraceAttendancePage;