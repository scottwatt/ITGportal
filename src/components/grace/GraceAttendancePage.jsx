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

// src/components/grace/GraceAttendancePage.jsx 
import React, { useState, useEffect } from 'react';
import { CheckCircle, X, Users, Calendar, TrendingUp, BarChart, AlertTriangle, ChevronLeft, ChevronRight, Award, Target, Clock } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart as RechartsBarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';
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

  // Summary/Reports view with advanced analytics
  const renderSummaryView = () => {
    const graceClients = clients ? clients.filter(client => client.program === 'grace') : [];
    
    // Generate mock data for demonstration - in real app this would come from summaryData
    const generateAnalyticsData = () => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = selectedMonth - 1;
      
      // Daily attendance trend for the month
      const dailyTrend = [];
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      
      for (let day = 1; day <= Math.min(daysInMonth, 30); day++) {
        const attendanceRate = 75 + Math.random() * 20; // 75-95% attendance
        dailyTrend.push({
          day: day,
          date: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
          attendance: Math.round(attendanceRate),
          present: Math.round((graceClients.length * attendanceRate) / 100),
          absent: graceClients.length - Math.round((graceClients.length * attendanceRate) / 100)
        });
      }
      
      // Weekly comparison
      const weeklyData = [
        { week: 'Week 1', attendance: 85, target: 90 },
        { week: 'Week 2', attendance: 92, target: 90 },
        { week: 'Week 3', attendance: 78, target: 90 },
        { week: 'Week 4', attendance: 88, target: 90 }
      ];
      
      // Client performance distribution
      const performanceData = [
        { range: '90-100%', count: Math.round(graceClients.length * 0.4), color: '#22c55e' },
        { range: '80-89%', count: Math.round(graceClients.length * 0.3), color: '#eab308' },
        { range: '70-79%', count: Math.round(graceClients.length * 0.2), color: '#f97316' },
        { range: 'Below 70%', count: Math.round(graceClients.length * 0.1), color: '#ef4444' }
      ];
      
      // Individual client data for detailed view
      const clientPerformance = graceClients.map((client, index) => {
        const attendance = 70 + Math.random() * 30; // 70-100%
        const totalDays = 20;
        const presentDays = Math.round((totalDays * attendance) / 100);
        
        return {
          id: client.id,
          name: client.name,
          attendance: Math.round(attendance),
          totalDays,
          presentDays,
          absentDays: totalDays - presentDays,
          streak: Math.floor(Math.random() * 10), // Current streak
          longestStreak: Math.floor(Math.random() * 15) + 5
        };
      }).sort((a, b) => b.attendance - a.attendance);
      
      return {
        dailyTrend,
        weeklyData,
        performanceData,
        clientPerformance,
        monthlyStats: {
          totalDays: daysInMonth,
          avgAttendance: 85.2,
          bestDay: dailyTrend.reduce((max, day) => day.attendance > max.attendance ? day : max, dailyTrend[0]),
          totalSessions: graceClients.length * 20,
          completionRate: 92.5
        }
      };
    };
    
    const analytics = generateAnalyticsData();
    const COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444'];
    
    return (
      <div className="space-y-8">
        {/* Header with Key Metrics */}
        <div className="bg-gradient-to-r from-[#5A4E69] to-[#292929] text-white p-8 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold mb-2">Grace Attendance Analytics</h3>
              <p className="text-[#BED2D8]">
                {new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })} Performance Overview
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-white text-[#292929] px-4 py-2 rounded border"
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
                className="bg-white text-[#292929] px-4 py-2 rounded border"
              >
                {Array.from({length: 5}, (_, i) => (
                  <option key={2022 + i} value={2022 + i}>
                    {2022 + i}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-semibold uppercase tracking-wide">Average Attendance</p>
                <p className="text-3xl font-bold text-green-600">{analytics.monthlyStats.avgAttendance}%</p>
                <p className="text-xs text-gray-500 mt-1">+2.3% from last month</p>
              </div>
              <TrendingUp className="text-green-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide">Total Participants</p>
                <p className="text-3xl font-bold text-blue-600">{graceClients.length}</p>
                <p className="text-xs text-gray-500 mt-1">Active in program</p>
              </div>
              <Users className="text-blue-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-semibold uppercase tracking-wide">Best Day</p>
                <p className="text-3xl font-bold text-purple-600">{analytics.monthlyStats.bestDay?.attendance || 0}%</p>
                <p className="text-xs text-gray-500 mt-1">Day {analytics.monthlyStats.bestDay?.day}</p>
              </div>
              <Award className="text-purple-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-semibold uppercase tracking-wide">Program Completion</p>
                <p className="text-3xl font-bold text-orange-600">{analytics.monthlyStats.completionRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Target: 90%</p>
              </div>
              <Target className="text-orange-500" size={32} />
            </div>
          </div>
        </div>

        {/* Charts Row 1: Daily Trend and Weekly Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Attendance Trend */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-lg font-semibold mb-4 text-[#292929]">Daily Attendance Trend</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.dailyTrend}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5A4E69" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#5A4E69" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={(value) => `Day ${value}`}
                />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [
                    `${value}%`, 
                    name === 'attendance' ? 'Attendance Rate' : name
                  ]}
                  labelFormatter={(value) => `Day ${value}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="attendance" 
                  stroke="#5A4E69" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAttendance)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Performance vs Target */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-lg font-semibold mb-4 text-[#292929]">Weekly Performance vs Target</h4>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={analytics.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [
                    `${value}%`, 
                    name === 'attendance' ? 'Actual' : 'Target'
                  ]}
                />
                <Legend />
                <Bar dataKey="attendance" fill="#5A4E69" name="Actual Attendance" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="#BED2D8" name="Target" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2: Performance Distribution and Individual Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Attendance Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-lg font-semibold mb-4 text-[#292929]">Attendance Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.performanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  dataKey="count"
                  startAngle={90}
                  endAngle={450}
                >
                  {analytics.performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} participants`, 
                    props.payload.range
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => `${entry.payload.range}: ${entry.payload.count}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Individual Client Performance Rankings */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-lg font-semibold mb-4 text-[#292929]">Individual Performance Rankings</h4>
            <div className="max-h-64 overflow-y-auto">
              <div className="space-y-3">
                {analytics.clientPerformance.slice(0, 8).map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-600' : 'bg-[#5A4E69]'
                      }`}>
                        {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-[#292929]">{client.name}</p>
                        <p className="text-xs text-gray-500">
                          {client.presentDays}/{client.totalDays} days • Streak: {client.streak}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        client.attendance >= 90 ? 'text-green-600' :
                        client.attendance >= 80 ? 'text-yellow-600' :
                        client.attendance >= 70 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {client.attendance}%
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            client.attendance >= 90 ? 'bg-green-500' :
                            client.attendance >= 80 ? 'bg-yellow-500' :
                            client.attendance >= 70 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${client.attendance}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {analytics.clientPerformance.length > 8 && (
              <div className="mt-4 text-center">
                <button className="text-[#5A4E69] hover:text-[#292929] text-sm font-medium">
                  View All {analytics.clientPerformance.length} Participants →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Insights and Recommendations */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h4 className="text-lg font-semibold mb-4 text-[#292929] flex items-center">
            <AlertTriangle className="mr-2 text-[#5A4E69]" size={20} />
            Insights & Recommendations
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h5 className="font-semibold text-green-800 mb-2">✅ Strengths</h5>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Overall attendance above 85%</li>
                <li>• Strong week 2 performance (92%)</li>
                <li>• {analytics.performanceData[0].count} participants with excellent attendance</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h5 className="font-semibold text-yellow-800 mb-2">⚠️ Areas for Improvement</h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Week 3 showed a dip to 78%</li>
                <li>• {analytics.performanceData[3].count} participants below 70%</li>
                <li>• Mid-month attendance pattern needs attention</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h5 className="font-semibold text-blue-800 mb-2">💡 Action Items</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Follow up with low-attendance participants</li>
                <li>• Implement mid-month engagement activities</li>
                <li>• Recognize top performers publicly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
        <p className="text-[#BED2D8]">Enrichment program attendance management & analytics</p>
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
          Analytics Dashboard
        </button>
      </div>

      {/* Content based on active view */}
      {activeView === 'daily' ? renderDailyView() : renderSummaryView()}
    </div>
  );
};

export default GraceAttendancePage;