// src/components/admin/AdminPanel.jsx - UPDATED with complete internship management tab

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  UserPlus, 
  Plus, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  X,
  Clock,
  Car,
  Users,
  Assignment,
  Eye,
  Grid,
  Briefcase  // ADD Briefcase icon for internships
} from 'lucide-react';
import DragDropScheduler from '../schedule/DragDropScheduler';
import WeeklyDragDropScheduler from '../schedule/WeeklyDragDropScheduler';
import EnhancedCoachAvailabilityManager from './EnhancedCoachAvailabilityManager';
import CalendarConfiguration from './CalendarConfiguration';
import AdminMileageOverview from './AdminMileageOverview';
import InternshipManagementPanel from './InternshipManagementPanel'; // ADD internship panel
import { getPSTDate, formatDatePST } from '../../utils/dateUtils';
import { generateTempPassword, cleanFormData, formatWorkingDays, formatAvailableTimeSlots } from '../../utils/helpers';
import { isCalendarAPIReady } from '../../services/googleCalendar/calendarService';

const PasswordInfoSection = () => (
  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
    <h4 className="font-semibold text-blue-800 mb-2">🔑 Default Password Information</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
      <div className="bg-blue-100 p-3 rounded">
        <strong>Client Accounts:</strong>
        <br />Password: <code className="bg-blue-200 px-1 rounded">ITGclient123</code>
        <br />Used for all client program participants
      </div>
      <div className="bg-blue-100 p-3 rounded">
        <strong>Staff Accounts:</strong>
        <br />Password: <code className="bg-blue-200 px-1 rounded">ITGemployee123</code>
        <br />Used for coaches, admins, and schedulers
      </div>
    </div>
    <p className="text-xs text-blue-600 mt-2">
      ⚠️ Remember to ask new users to change their password on first login for security.
    </p>
  </div>
);

const AdminPanel = ({ 
  clients, 
  coaches, 
  schedules, 
  timeSlots,
  businessTypes,
  equipmentOptions,
  programs,
  coachTypes,
  clientActions,
  coachActions,
  scheduleActions,
  availabilityActions,
  // ADD internship props
  internships = [],
  internshipActions,
  userProfile
}) => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [scheduleView, setScheduleView] = useState('day');
  const [clientFilter, setClientFilter] = useState('all');
  const [editingClient, setEditingClient] = useState(null);
  const [editingCoach, setEditingCoach] = useState(null);
  const [showTaskAssignments, setShowTaskAssignments] = useState(false);
  
  // DRAG STATE
  const [draggedClient, setDraggedClient] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  
  const [selectedDate, setSelectedDateState] = useState(() => {
    const pstDate = getPSTDate();
    return pstDate;
  });
  
  const setSelectedDate = useCallback((newDate) => {
    setSelectedDateState(newDate);
  }, []);
  
  const [newClient, setNewClient] = useState({
    name: '', email: '', phone: '', jobGoal: '', businessName: '', 
    equipment: '', strengths: '', challenges: '', coachingApproach: '', 
    businessDescription: '', currentGoals: '', program: 'limitless',
    dailyTaskCoachId: '',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    availableTimeSlots: ['8-10', '10-12', '1230-230']
  });
 
  const [newCoach, setNewCoach] = useState({
    name: '', 
    email: '', 
    role: 'coach', 
    coachType: 'success',
    phone: '',
    notes: ''
  });

  const [isDragActive, setIsDragActive] = useState(false);
  const dragDateRef = useRef(null);
  const selectedDateRef = useRef(selectedDate);
  
  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  // ENHANCED: Updated drag and drop handlers to check coach availability
  const handleDragStart = useCallback((e, client, dateForScheduling) => {
    const dragDate = dateForScheduling || selectedDate;
    
    setIsDragActive(true);
    setDraggedClient(client);
    dragDateRef.current = dragDate;
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('scheduleDate', dragDate);
  }, [selectedDate, isDragActive]);

  const handleDragOver = useCallback((e, coachId, timeSlot) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(`${coachId}-${timeSlot}`);
  }, []);

  const handleDragLeave = useCallback((e) => {
    setDragOverSlot(null);
  }, []);

  const handleResetCoachPassword = async (coach) => {
    if (window.confirm(`Send password reset email to ${coach.email}?\n\nThis will allow them to set a new password via email.`)) {
      try {
        await coachActions.resetPassword(coach);
      } catch (error) {
        alert(`Error sending password reset: ${error.message}`);
      }
    }
  };

  const handleResetClientPassword = async (client) => {
    if (window.confirm(`Send password reset email to ${client.email}?\n\nThis will allow them to set a new password via email.`)) {
      try {
        await clientActions.resetPassword(client);
      } catch (error) {
        alert(`Error sending password reset: ${error.message}`);
      }
    }
  };

  const handleDrop = useCallback(async (e, coachId, timeSlot, explicitDate) => {
    e.preventDefault();
    setDragOverSlot(null);
    setIsDragActive(false);
    
    const scheduleDate = explicitDate || e.dataTransfer.getData('scheduleDate') || selectedDateRef.current;
    
    if (!draggedClient) return;

    if (!scheduleDate) {
      alert('Please select a date first');
      return;
    }

    if (!coachId) {
      alert('Invalid coach selection');
      return;
    }

    // Check if coach is available on this date
    if (!availabilityActions.isCoachAvailable(coachId, scheduleDate)) {
      const status = availabilityActions.getCoachStatusForDate(coachId, scheduleDate);
      const reason = availabilityActions.getCoachReasonForDate(coachId, scheduleDate);
      alert(`This coach is not available on ${scheduleDate}. Status: ${status}${reason ? ` (${reason})` : ''}`);
      setDraggedClient(null);
      return;
    }

    // Check if this client is already scheduled at this time
    const existingSchedule = schedules.find(s => 
      s.date === scheduleDate && 
      s.timeSlot === timeSlot && 
      s.clientId === draggedClient.id
    );

    if (existingSchedule) {
      alert('This client is already scheduled for this time slot!');
      setDraggedClient(null);
      return;
    }

    try {
      await scheduleActions.add(scheduleDate, timeSlot, coachId, draggedClient.id);
      setDraggedClient(null);
      alert('Client scheduled successfully!');
    } catch (error) {
      alert(`Error scheduling client: ${error.message || 'Please try again.'}`);
      setDraggedClient(null);
    }
  }, [draggedClient, schedules, scheduleActions, availabilityActions, selectedDateRef]);

  const handleRemoveAssignment = useCallback((scheduleId) => {
    scheduleActions.remove(scheduleId);
  }, [scheduleActions]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    
    if (isDragActive) {
      return;
    }
    
    setSelectedDate(newDate);
    setDraggedClient(null);
    setDragOverSlot(null);
  };

  // Effect to handle cleanup when drag ends unexpectedly
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      if (isDragActive) {
        setIsDragActive(false);
        setDraggedClient(null);
        setDragOverSlot(null);
      }
    };

    document.addEventListener('dragend', handleGlobalDragEnd);
    return () => document.removeEventListener('dragend', handleGlobalDragEnd);
  }, [isDragActive]);

  // Get available coaches for scheduling (filters out unavailable coaches)
  const getAvailableCoachesForScheduling = () => {
    const successCoaches = coaches.filter(c => 
      c.role === 'coach' && 
      (c.coachType || 'success') === 'success'
    );
    
    return successCoaches.filter(coach => 
      availabilityActions.isCoachAvailable(coach.uid || coach.id, selectedDate)
    );
  };

  // Task coach assignment functions
  const handleAssignTaskCoach = async (clientId, coachId) => {
    try {
      await clientActions.update(clientId, { dailyTaskCoachId: coachId });
      alert('Task coach assigned successfully!');
    } catch (error) {
      alert('Error assigning task coach. Please try again.');
    }
  };

  const getAssignedClients = (coachId) => {
    return clients.filter(client => client.dailyTaskCoachId === coachId);
  };

  const getSuccessCoaches = () => {
    return coaches.filter(c => 
      c.role === 'coach' && 
      (c.coachType || 'success') === 'success'
    );
  };

  // Working days and time slots change handlers
  const handleWorkingDaysChange = (day, isChecked) => {
    const currentWorkingDays = newClient.workingDays || [];
    if (isChecked) {
      setNewClient({
        ...newClient,
        workingDays: [...currentWorkingDays, day]
      });
    } else {
      setNewClient({
        ...newClient,
        workingDays: currentWorkingDays.filter(d => d !== day)
      });
    }
  };

  const handleTimeSlotChange = (timeSlot, isChecked) => {
    const currentTimeSlots = newClient.availableTimeSlots || [];
    if (isChecked) {
      setNewClient({
        ...newClient,
        availableTimeSlots: [...currentTimeSlots, timeSlot]
      });
    } else {
      setNewClient({
        ...newClient,
        availableTimeSlots: currentTimeSlots.filter(ts => ts !== timeSlot)
      });
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      const result = await clientActions.add(newClient);
      setNewClient({ 
        name: '', email: '', phone: '', jobGoal: '', businessName: '', 
        equipment: '', strengths: '', challenges: '', coachingApproach: '', 
        businessDescription: '', currentGoals: '', program: 'limitless',
        dailyTaskCoachId: '',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        availableTimeSlots: ['8-10', '10-12', '1230-230']
      });
      
      alert(`Client added successfully!\n\nLogin credentials for ${newClient.name}:\nEmail: ${newClient.email}\nPassword: ITGclient123\n\nThis is the standard password for all clients. Please share these credentials with the client and ask them to change their password on first login.`);
    } catch (error) {
      alert('Error adding client. Please try again.');
    }
  };

  const handleAddCoach = async (e) => {
    e.preventDefault();
    try {
      const result = await coachActions.add(newCoach);
      setNewCoach({ name: '', email: '', uid: '', role: 'coach', coachType: 'success' });
      
      alert(`Coach added successfully!\n\nLogin credentials for ${newCoach.name}:\nEmail: ${newCoach.email}\nPassword: ITGemployee123\n\nThis is the standard password for all staff members. Please share these credentials and ask them to change their password on first login.`);
    } catch (error) {
      alert('Error adding coach. Please try again.');
    }
  };

  // Handle client deletion
  const handleDeleteClient = async (clientId, clientName) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${clientName}?\n\nThis will also remove:\n• All scheduled sessions\n• All files and notes\n• Login access\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await clientActions.remove(clientId, schedules);
      alert(`${clientName} has been successfully removed from the system.`);
    } catch (error) {
      alert('Error deleting client. Please try again.');
    }
  };

  // Handle coach deletion
  const handleDeleteCoach = async (coachId, coachName) => {
    if (!window.confirm(`Are you sure you want to remove ${coachName} from the coaching staff?\n\nThis will remove:\n• Their access to the system\n• Future scheduled sessions\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await coachActions.remove(coachId, schedules);
      alert(`${coachName} has been successfully removed from the coaching staff.`);
    } catch (error) {
      alert('Error deleting coach. Please try again.');
    }
  };

  const handleEditClient = (client) => {
    console.log('Setting editingClient to:', client);
    setEditingClient({...client});
  };

  const handleEditCoach = (coach) => {
    console.log('Setting editingCoach to:', coach);
    setEditingCoach({...coach});
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    try {
      const { id, createdAt, updatedAt, ...cleanData } = editingClient;
      const updateData = cleanFormData(cleanData);
      
      await clientActions.update(editingClient.id, updateData);
      setEditingClient(null);
      alert(`${editingClient.name} has been updated successfully!`);
    } catch (error) {
      console.error('Error updating client:', error);
      alert(`Error updating client: ${error.message}. Please try again.`);
    }
  };

  const handleUpdateCoach = async (e) => {
    e.preventDefault();
    try {
      const { id, createdAt, updatedAt, ...cleanData } = editingCoach;
      const updateData = cleanFormData(cleanData);
      
      await coachActions.update(editingCoach.id, updateData);
      setEditingCoach(null);
      alert(`${editingCoach.name} has been updated successfully!`);
    } catch (error) {
      console.error('Error updating coach:', error);
      alert(`Error updating coach: ${error.message}. Please try again.`);
    }
  };

  // Filter clients based on selected program
  const filteredClients = clientFilter === 'all' 
    ? clients 
    : clients.filter(client => (client.program || 'limitless') === clientFilter);

  // Get Grace clients count for display
  const graceClients = clients.filter(client => client.program === 'grace');

  // Get Bridges clients count for internship display
  const bridgesClients = clients.filter(client => client.program === 'bridges');

  // UPDATED: Tabs array with Internship Management
  const tabs = [
    { id: 'schedule', label: 'Daily Schedule', icon: Calendar },
    { id: 'availability', label: 'Coach Availability', icon: Clock },
    { id: 'clients', label: 'Clients', icon: User },
    { id: 'staff', label: 'Staff', icon: UserPlus },
    { id: 'task-assignments', label: 'Task Assignments', icon: Users },
    { id: 'internships', label: 'Internship Management', icon: Briefcase }, // ADD internship tab
    { id: 'mileage-overview', label: 'Mileage Overview', icon: Car }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#292929]">ITG Admin Panel</h2>

      <PasswordInfoSection />
      
      {/* Summary Cards with internships */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-[#6D858E]">{clients.length}</p>
            <p className="text-[#292929]">Total Clients</p>
            <div className="mt-2 text-sm text-[#9B97A2]">
              <div>Limitless: {clients.filter(c => (c.program || 'limitless') === 'limitless').length}</div>
              <div>New Options: {clients.filter(c => c.program === 'new-options').length}</div>
              <div>Bridges: {bridgesClients.length}</div>
              <div>Grace: {graceClients.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-[#6D858E]">{coaches.length}</p>
            <p className="text-[#292929]">Total Staff</p>
            <div className="mt-2 text-sm text-[#9B97A2]">
              <div>Available Today: {availabilityActions.getAvailableCoaches(coaches.filter(c => c.role === 'coach'), selectedDate).length}</div>
              <div>Unavailable Today: {availabilityActions.getUnavailableCoachesForDate(selectedDate).length}</div>
              <div>Success Coaches: {coaches.filter(c => (c.coachType || 'success') === 'success').length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-[#5A4E69]">
              {schedules.filter(s => s.date === selectedDate).length}
            </p>
            <p className="text-[#292929]">Sessions on {formatDatePST(selectedDate)}</p>
            <div className="mt-2 text-sm text-[#9B97A2]">
              <div>Schedulable Clients: {clients.filter(c => ['limitless', 'new-options', 'bridges'].includes(c.program || 'limitless')).length}</div>
              <div>Available Coaches: {getAvailableCoachesForScheduling().length}</div>
            </div>

            {isDragActive && (
              <div className="mt-2 text-xs bg-[#BED2D8] text-[#292929] px-2 py-1 rounded">
                🔒 Date locked during drag operation
              </div>
            )}
          </div>
        </div>

        {/* Bridges Participants Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-[#5A4E69]">
              {bridgesClients.length}
            </p>
            <p className="text-[#292929]">Bridges Participants</p>
            <div className="mt-2 text-sm text-[#9B97A2]">
              <div>Career Development</div>
              <div>& Internship Program</div>
              <div>See Internships tab</div>
              <div>for management</div>
            </div>
          </div>
        </div>

        {/* Internships Overview Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-[#5A4E69]">
              {internships.filter(i => i.status === 'in_progress').length}
            </p>
            <p className="text-[#292929]">Active Internships</p>
            <div className="mt-2 text-sm text-[#9B97A2]">
              <div>Total: {internships.length}</div>
              <div>Completed: {internships.filter(i => i.status === 'completed').length}</div>
              <div>Planned: {internships.filter(i => i.status === 'planned').length}</div>
            </div>
          </div>
        </div>

        {/* Grace Calendar Status Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-[#5A4E69]">
              {isCalendarAPIReady() ? '✅' : '❌'}
            </p>
            <p className="text-[#292929]">Grace Calendar</p>
            <div className="mt-2 text-sm text-[#9B97A2]">
              <div>{isCalendarAPIReady() ? 'Connected' : 'Not Connected'}</div>
              <div>Google Calendar API</div>
              <div>for Grace program</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-[#F5F5F5]">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-[#6D858E] text-[#6D858E]'
                    : 'border-transparent text-[#9B97A2] hover:text-[#707070] hover:border-[#9B97A2]'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Daily Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <h3 className="text-xl font-semibold text-[#292929]">Schedule Management</h3>
                  
                  <div className="flex space-x-1 bg-[#F5F5F5] rounded-lg p-1">
                    <button
                      onClick={() => setScheduleView('day')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                        scheduleView === 'day' 
                          ? 'bg-white text-[#6D858E] shadow-sm' 
                          : 'text-[#707070] hover:text-[#292929]'
                      }`}
                    >
                      <Eye size={16} />
                      <span>Day View</span>
                    </button>
                    <button
                      onClick={() => setScheduleView('week')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                        scheduleView === 'week' 
                          ? 'bg-white text-[#6D858E] shadow-sm' 
                          : 'text-[#707070] hover:text-[#292929]'
                      }`}
                    >
                      <Grid size={16} />
                      <span>Week View</span>
                    </button>
                  </div>
                </div>
                
                {scheduleView === 'day' && (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    disabled={isDragActive}
                    className={`px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6D858E] ${
                      isDragActive ? 'bg-[#F5F5F5] cursor-not-allowed' : ''
                    }`}
                    title={isDragActive ? 'Date locked during drag operation' : 'Select date'}
                  />
                )}
              </div>
              
              {scheduleView === 'day' ? (
                <DragDropScheduler 
                  selectedDate={selectedDate}
                  handleDragStart={handleDragStart}
                  handleDragOver={handleDragOver}
                  handleDragLeave={handleDragLeave}
                  handleDrop={handleDrop}
                  handleRemoveAssignment={handleRemoveAssignment}
                  dragOverSlot={dragOverSlot}
                  draggedClient={draggedClient}
                  dailySchedules={schedules}
                  clients={clients}
                  coaches={getAvailableCoachesForScheduling()}
                  timeSlots={timeSlots}
                  scheduleActions={scheduleActions}
                  availabilityActions={availabilityActions}
                />
              ) : (
                <WeeklyDragDropScheduler 
                  selectedDate={selectedDate}
                  handleDragStart={handleDragStart}
                  handleDragOver={handleDragOver}
                  handleDragLeave={handleDragLeave}
                  handleDrop={handleDrop}
                  handleRemoveAssignment={handleRemoveAssignment}
                  dragOverSlot={dragOverSlot}
                  draggedClient={draggedClient}
                  dailySchedules={schedules}
                  clients={clients}
                  coaches={coaches}
                  timeSlots={timeSlots}
                  scheduleActions={scheduleActions}
                  availabilityActions={availabilityActions}
                />
              )}
            </div>
          )}

          {/* Coach Availability Tab */}
          {activeTab === 'availability' && (
            <EnhancedCoachAvailabilityManager
              coaches={coaches.filter(c => c.role === 'coach')}
              availabilityActions={availabilityActions}
              scheduleActions={scheduleActions}
              schedules={schedules}
              selectedDate={selectedDate}
            />
          )}

          {/* Task Assignments Tab */}
          {activeTab === 'task-assignments' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#5A4E69] to-[#292929] text-white p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Daily Task Coach Assignments</h3>
                <p className="text-[#BED2D8]">Assign coaches to manage daily tasks for specific clients</p>
              </div>

              <div className="space-y-6">
                {getSuccessCoaches().map(coach => {
                  const assignedClients = getAssignedClients(coach.uid || coach.id);
                  const schedulableClientsForAssignment = clients.filter(c => 
                    ['limitless', 'new-options', 'bridges'].includes(c.program || 'limitless')
                  );
                  
                  return (
                    <div key={coach.id} className="bg-white p-6 rounded-lg shadow-md border">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-[#292929]">
                          {coach.name} - Daily Task Management
                        </h4>
                        <span className="bg-[#BED2D8] text-[#292929] px-3 py-1 rounded text-sm">
                          {assignedClients.length} Assigned Clients
                        </span>
                      </div>

                      {assignedClients.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-[#292929] mb-2">Currently Assigned Clients:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {assignedClients.map(client => (
                              <div key={client.id} className="bg-[#BED2D8] p-3 rounded flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-[#292929]">{client.name}</p>
                                  <p className="text-sm text-[#707070]">
                                    {client.program === 'limitless' ? client.businessName :
                                     client.program === 'new-options' ? 'Community Job' :
                                     client.program === 'bridges' ? 'Career Dev' :
                                     'Other'}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleAssignTaskCoach(client.id, '')}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                  title="Remove assignment"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h5 className="font-medium text-[#292929] mb-2">Available Clients to Assign:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {schedulableClientsForAssignment
                            .filter(client => client.dailyTaskCoachId !== (coach.uid || coach.id))
                            .map(client => (
                              <div key={client.id} className="bg-[#F5F5F5] p-3 rounded flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-[#292929]">{client.name}</p>
                                  <p className="text-sm text-[#707070]">
                                    {client.program === 'limitless' ? client.businessName :
                                     client.program === 'new-options' ? 'Community Job' :
                                     client.program === 'bridges' ? 'Career Dev' :
                                     'Other'}
                                  </p>
                                  {client.dailyTaskCoachId && (
                                    <p className="text-xs text-[#9B97A2]">
                                      Currently: {coaches.find(c => (c.uid || c.id) === client.dailyTaskCoachId)?.name || 'Unknown'}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleAssignTaskCoach(client.id, coach.uid || coach.id)}
                                  className="bg-[#6D858E] text-white px-3 py-1 rounded text-sm hover:bg-[#5A4E69]"
                                >
                                  Assign
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Unassigned Clients</h4>
                <div className="space-y-2">
                  {clients
                    .filter(c => 
                      ['limitless', 'new-options', 'bridges'].includes(c.program || 'limitless') && 
                      !c.dailyTaskCoachId
                    )
                    .map(client => (
                      <div key={client.id} className="flex justify-between items-center bg-white p-2 rounded">
                        <span className="text-[#292929]">{client.name}</span>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignTaskCoach(client.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="">Assign to coach...</option>
                          {getSuccessCoaches().map(coach => (
                            <option key={coach.id} value={coach.uid || coach.id}>
                              {coach.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* NEW: Internship Management Tab */}
          {activeTab === 'internships' && (
            <InternshipManagementPanel
              clients={clients}
              internships={internships}
              userProfile={userProfile}
              internshipActions={internshipActions}
              canEdit={true}
            />
          )}

          {/* Mileage Overview Tab */}
          {activeTab === 'mileage-overview' && (
            <AdminMileageOverview 
              coaches={coaches}
            />
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-xl font-semibold text-[#292929]">Client Management</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center space-x-2">
                    <Filter size={16} className="text-[#9B97A2]" />
                    <select
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                    >
                      <option value="all">All Programs</option>
                      <option value="limitless">Limitless</option>
                      <option value="new-options">New Options</option>
                      <option value="bridges">Bridges</option>
                      <option value="grace">Grace</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Add Client Form */}
              <div className="bg-[#F5F5F5] p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-4 text-[#292929]">Add New Client</h4>
                <form onSubmit={handleAddClient} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={newClient.name}
                      onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                    />
                    <select
                      value={newClient.program}
                      onChange={(e) => setNewClient({...newClient, program: e.target.value})}
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                      required
                    >
                      <option value="">Select Program</option>
                      {programs.map(program => (
                        <option key={program.id} value={program.id}>{program.name} - {program.description}</option>
                      ))}
                    </select>
                  </div>

                  {/* CONDITIONAL FIELDS: Show different fields based on program */}
                  {newClient.program === 'grace' ? (
                    // SIMPLIFIED: Grace participants only need goals
                    <div>
                      <textarea
                        placeholder="Goals and interests for Grace enrichment program"
                        value={newClient.currentGoals}
                        onChange={(e) => setNewClient({...newClient, currentGoals: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                        rows="3"
                      />
                    </div>
                  ) : (
                    // FULL FIELDS: All other programs get full business information + schedules
                    <>
                      {/* Task Coach Assignment for non-Grace clients */}
                      <div>
                        <select
                          value={newClient.dailyTaskCoachId}
                          onChange={(e) => setNewClient({...newClient, dailyTaskCoachId: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                        >
                          <option value="">Select Daily Task Coach (Optional)</option>
                          {getSuccessCoaches().map(coach => (
                            <option key={coach.id} value={coach.uid || coach.id}>
                              {coach.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Working Days Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-[#292929]">Working Days:</label>
                        <div className="grid grid-cols-7 gap-2">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                            <label key={day} className="flex items-center space-x-1 text-sm">
                              <input
                                type="checkbox"
                                checked={newClient.workingDays?.includes(day) || false}
                                onChange={(e) => handleWorkingDaysChange(day, e.target.checked)}
                                className="rounded"
                              />
                              <span className="capitalize">{day.slice(0, 3)}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Available Time Slots Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-[#292929]">Available Time Slots:</label>
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlots.map(slot => (
                            <label key={slot.id} className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={newClient.availableTimeSlots?.includes(slot.id) || false}
                                onChange={(e) => handleTimeSlotChange(slot.id, e.target.checked)}
                                className="rounded"
                              />
                              <span>{slot.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Show business fields only for Limitless program */}
                      {newClient.program === 'limitless' && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="Business Name"
                              value={newClient.businessName}
                              onChange={(e) => setNewClient({...newClient, businessName: e.target.value})}
                              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                            />
                            <select
                              value={newClient.jobGoal}
                              onChange={(e) => setNewClient({...newClient, jobGoal: e.target.value})}
                              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                            >
                              <option value="">Select Business Type</option>
                              {businessTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                          <select
                            value={newClient.equipment}
                            onChange={(e) => setNewClient({...newClient, equipment: e.target.value})}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                          >
                            <option value="">Equipment Used</option>
                            {equipmentOptions.map(equipment => (
                              <option key={equipment} value={equipment}>{equipment}</option>
                            ))}
                          </select>
                        </>
                      )}
                      
                      {/* Show job fields for New Options */}
                      {newClient.program === 'new-options' && (
                        <input
                          type="text"
                          placeholder="Job Interest/Field"
                          value={newClient.jobGoal}
                          onChange={(e) => setNewClient({...newClient, jobGoal: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                          title="What type of community job are they interested in?"
                        />
                      )}
                      
                      {/* Show skill development fields for Bridges */}
                      {newClient.program === 'bridges' && (
                        <input
                          type="text"
                          placeholder="Career Goals/Skills"
                          value={newClient.jobGoal}
                          onChange={(e) => setNewClient({...newClient, jobGoal: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                          title="What career skills or internship goals are they working toward?"
                        />
                      )}
                      
                      <div>
                        <textarea
                          placeholder={
                            newClient.program === 'limitless' ? 'Business Description' :
                            newClient.program === 'new-options' ? 'Job interests and community work goals' :
                            newClient.program === 'bridges' ? 'Career development and internship goals' :
                            'Program description and goals'
                          }
                          value={newClient.businessDescription}
                          onChange={(e) => setNewClient({...newClient, businessDescription: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                          rows="2"
                        />
                      </div>
                      <div>
                        <textarea
                          placeholder="Current Goals (what they should work on)"
                          value={newClient.currentGoals}
                          onChange={(e) => setNewClient({...newClient, currentGoals: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                          rows="2"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <textarea
                          placeholder="Strengths (e.g., Creative with designs, works independently, good with people)"
                          value={newClient.strengths}
                          onChange={(e) => setNewClient({...newClient, strengths: e.target.value})}
                          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                          rows="2"
                        />
                        <textarea
                          placeholder="Challenges (e.g., Easily distracted, needs redirection, social anxiety)"
                          value={newClient.challenges}
                          onChange={(e) => setNewClient({...newClient, challenges: e.target.value})}
                          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                          rows="2"
                        />
                      </div>
                      <div>
                        <textarea
                          placeholder="Coaching Approach (e.g., Regular check-ins, monitor progress, provide clear expectations)"
                          value={newClient.coachingApproach}
                          onChange={(e) => setNewClient({...newClient, coachingApproach: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                          rows="3"
                        />
                      </div>
                    </>
                  )}
                  
                  <div>
                    <button
                      type="submit"
                      className="bg-[#6D858E] text-white px-6 py-2 rounded-md hover:bg-[#5A4E69] flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Add Client</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Current Clients with Schedule Info */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-[#292929]">
                  Current Clients 
                  <span className="text-sm text-[#9B97A2] ml-2">
                    ({filteredClients.length} {clientFilter === 'all' ? 'total' : `in ${clientFilter}`})
                  </span>
                </h4>
                <div className="space-y-4">
                  {filteredClients.map(client => {
                    const taskCoach = coaches.find(c => (c.uid || c.id) === client.dailyTaskCoachId);
                    
                    return (
                      <div key={client.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-[#F5F5F5]">
                        <div>
                          <h4 className="font-semibold text-[#292929]">{client.name}</h4>
                          <p className="text-sm text-[#707070]">{client.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                              client.program === 'limitless' ? 'bg-[#BED2D8] text-[#292929]' :
                              client.program === 'new-options' ? 'bg-[#BED2D8] text-[#292929]' :
                              client.program === 'bridges' ? 'bg-[#BED2D8] text-[#292929]' :
                              client.program === 'grace' ? 'bg-[#F5F5F5] text-[#292929]' :
                              'bg-[#BED2D8] text-[#292929]'
                            }`}>
                              {client.program === 'limitless' ? 'Limitless' :
                               client.program === 'new-options' ? 'New Options' :
                               client.program === 'bridges' ? 'Bridges' :
                               client.program === 'grace' ? 'Grace' :
                               'Limitless'}
                            </span>
                            <p className="text-xs text-[#9B97A2]">{client.businessName || client.jobGoal}</p>
                          </div>
                          {/* Show task coach assignment */}
                          {client.program !== 'grace' && (
                            <p className="text-xs text-[#6D858E] mt-1">
                              Task Coach: {taskCoach ? taskCoach.name : 'Not assigned'}
                            </p>
                          )}
                          {/* Show working schedule */}
                          {client.program !== 'grace' && (
                            <div className="text-xs text-[#9B97A2] mt-1">
                              <div>Works: {formatWorkingDays(client.workingDays)}</div>
                              <div>Times: {formatAvailableTimeSlots(client.availableTimeSlots)}</div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            {client.uid ? (
                              <div>
                                <span className="bg-[#BED2D8] text-[#292929] px-2 py-1 rounded text-sm">
                                  ✓ Can Log In
                                </span>
                                {client.tempPassword && (
                                  <p className="text-xs text-[#9B97A2] mt-1">
                                    Temp Password: <code className="bg-[#F5F5F5] px-1 rounded">{client.tempPassword}</code>
                                  </p>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => clientActions.createLogin(client)}
                                className="bg-[#6D858E] text-white px-3 py-1 rounded text-sm hover:bg-[#5A4E69]"
                              >
                                Create Login Account
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => handleEditClient(client)}
                            className="bg-[#6D858E] text-white px-3 py-1 rounded text-sm hover:bg-[#5A4E69] flex items-center space-x-1"
                            title="Edit client"
                          >
                            <Edit3 size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.id, client.name)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center space-x-1"
                            title="Delete client permanently"
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {filteredClients.length === 0 && (
                  <div className="text-center py-8 text-[#9B97A2]">
                    <p>No clients found for the selected filter!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Staff Tab */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-xl font-semibold text-[#292929]">Staff Management</h3>
              </div>

              {/* Add Coach Form */}
              <div className="bg-[#F5F5F5] p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-4 text-[#292929]">Add New Staff Member</h4>
                <form onSubmit={handleAddCoach} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newCoach.name}
                    onChange={(e) => setNewCoach({...newCoach, name: e.target.value})}
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newCoach.email}
                    onChange={(e) => setNewCoach({...newCoach, email: e.target.value})}
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                    required
                  />
                  
                  <select
                      value={newCoach.role}
                      onChange={(e) => setNewCoach({...newCoach, role: e.target.value})}
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                      required
                    >
                      <option value="coach">Coach</option>
                      <option value="scheduler">Scheduler</option>
                      <option value="admin">Admin</option>
                      <option value="merchandise_coordinator">Merchandise Coordinator</option>
                      <option value="program_admin_coordinator">Program Admin Coordinator</option>
                      <option value="admin_dev_coordinator">Admin Development Coordinator</option>
                      <option value="vocational_dev_coordinator">Vocational Development Coordinator</option>
                      <option value="executive_director">Executive Director</option>
                      <option value="director_org_dev">Director of Organizational Development</option>
                      <option value="director_program_dev">Director of Program Development</option>
                    </select>
                  
                  <select
                    value={newCoach.coachType}
                    onChange={(e) => setNewCoach({...newCoach, coachType: e.target.value})}
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                    required
                  >
                    {coachTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} - {type.programs.map(p => programs.find(prog => prog.id === p)?.name).join(', ')}
                      </option>
                    ))}
                  </select>
                  
                  <div className="md:col-span-2">
                    <input
                      type="tel"
                      placeholder="Phone Number (optional)"
                      value={newCoach.phone || ''}
                      onChange={(e) => setNewCoach({...newCoach, phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <textarea
                      placeholder="Notes (optional)"
                      value={newCoach.notes || ''}
                      onChange={(e) => setNewCoach({...newCoach, notes: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                      rows="2"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4">
                      <p className="text-sm text-blue-700">
                        <strong>🔑 Login Account:</strong> A Firebase Authentication account will be automatically created with email: <code className="bg-blue-100 px-1 rounded">{newCoach.email || '[email]'}</code> and password: <code className="bg-blue-100 px-1 rounded">ITGemployee123</code>
                      </p>
                    </div>
                    
                    <button
                      type="submit"
                      className="bg-[#6D858E] text-white px-6 py-2 rounded-md hover:bg-[#5A4E69] flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Add Staff Member</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Current Staff */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-[#292929]">Current Staff Members</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coaches.map(coach => (
                    <div key={coach.id} className="p-4 border rounded-lg hover:bg-[#F5F5F5]">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-[#292929]">{coach.name}</h4>
                          <p className="text-sm text-[#707070]">{coach.email}</p>
                          <p className="text-xs text-[#9B97A2] capitalize">{coach.role}</p>
                          <span className={`text-xs px-2 py-1 rounded font-medium mt-1 inline-block ${
                            coach.coachType === 'success' ? 'bg-[#BED2D8] text-[#292929]' : 'bg-[#F5F5F5] text-[#292929]'
                          }`}>
                            {coach.coachType === 'success' ? 'Success Coach' : 'Grace Coach'}
                          </span>
                          <p className="text-xs text-[#6D858E] mt-1">
                            Today's Sessions: {schedules.filter(s => (s.coachId === coach.uid || s.coachId === coach.id) && s.date === selectedDate).length}
                          </p>
                          
                          {/* LOGIN STATUS SECTION */}
                          <div className="mt-2">
                            {coach.uid ? (
                              <div>
                                <span className="bg-[#BED2D8] text-[#292929] px-2 py-1 rounded text-xs">
                                  ✓ Can Log In
                                </span>
                                <p className="text-xs text-[#9B97A2] mt-1">
                                  Default Password: <code className="bg-[#F5F5F5] px-1 rounded">ITGemployee123</code>
                                </p>
                              </div>
                            ) : (
                              <button
                                onClick={() => coachActions.createLogin(coach)}
                                className="bg-[#6D858E] text-white px-2 py-1 rounded text-xs hover:bg-[#5A4E69]"
                              >
                                Create Login Account
                              </button>
                            )}
                          </div>
                          
                          {/* Show availability status */}
                          {coach.role === 'coach' && (
                            <p className={`text-xs mt-1 font-medium ${
                              availabilityActions.isCoachAvailable(coach.uid || coach.id, selectedDate) 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {availabilityActions.isCoachAvailable(coach.uid || coach.id, selectedDate) 
                                ? 'Available Today' 
                                : `${availabilityActions.getCoachStatusForDate(coach.uid || coach.id, selectedDate)} Today`}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleEditCoach(coach)}
                            className="bg-[#6D858E] text-white px-2 py-1 rounded text-xs hover:bg-[#5A4E69] flex items-center space-x-1"
                            title="Edit staff member"
                          >
                            <Edit3 size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCoach(coach.id, coach.name)}
                            className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 flex items-center space-x-1"
                            title="Remove from staff"
                          >
                            <Trash2 size={12} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client Edit Modal - ENHANCED with individual schedules */}
      {editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-[#6D858E] text-white">
              <h3 className="text-lg font-semibold">Edit Client: {editingClient.name}</h3>
              <button 
                onClick={() => setEditingClient(null)} 
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto h-[calc(90vh-140px)] p-6">
              <form onSubmit={handleUpdateClient} className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={editingClient.name || ''}
                      onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={editingClient.email || ''}
                      onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editingClient.phone || ''}
                      onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Program</label>
                    <select
                      value={editingClient.program || 'limitless'}
                      onChange={(e) => setEditingClient({...editingClient, program: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    >
                      {programs.map(program => (
                        <option key={program.id} value={program.id}>{program.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* CONDITIONAL FIELDS: Show different fields based on program */}
                {editingClient.program === 'grace' ? (
                  // Grace participants: simplified fields
                  <div>
                    <label className="block text-sm font-medium mb-1">Goals & Interests</label>
                    <textarea
                      value={editingClient.currentGoals || ''}
                      onChange={(e) => setEditingClient({...editingClient, currentGoals: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      rows="4"
                      placeholder="Goals and interests for Grace enrichment program"
                    />
                  </div>
                ) : (
                  // All other programs: full fields
                  <>
                    {/* Task Coach Assignment */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Daily Task Coach</label>
                      <select
                        value={editingClient.dailyTaskCoachId || ''}
                        onChange={(e) => setEditingClient({...editingClient, dailyTaskCoachId: e.target.value})}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">No task coach assigned</option>
                        {getSuccessCoaches().map(coach => (
                          <option key={coach.id} value={coach.uid || coach.id}>
                            {coach.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Working Days Editor */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Working Days</label>
                      <div className="grid grid-cols-7 gap-2">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                          <label key={day} className="flex items-center space-x-1 text-sm">
                            <input
                              type="checkbox"
                              checked={editingClient.workingDays?.includes(day) || false}
                              onChange={(e) => {
                                const currentDays = editingClient.workingDays || [];
                                if (e.target.checked) {
                                  setEditingClient({...editingClient, workingDays: [...currentDays, day]});
                                } else {
                                  setEditingClient({...editingClient, workingDays: currentDays.filter(d => d !== day)});
                                }
                              }}
                              className="rounded"
                            />
                            <span className="capitalize">{day.slice(0, 3)}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Available Time Slots Editor */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Available Time Slots</label>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map(slot => (
                          <label key={slot.id} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editingClient.availableTimeSlots?.includes(slot.id) || false}
                              onChange={(e) => {
                                const currentSlots = editingClient.availableTimeSlots || [];
                                if (e.target.checked) {
                                  setEditingClient({...editingClient, availableTimeSlots: [...currentSlots, slot.id]});
                                } else {
                                  setEditingClient({...editingClient, availableTimeSlots: currentSlots.filter(s => s !== slot.id)});
                                }
                              }}
                              className="rounded"
                            />
                            <span>{slot.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Business Information for Limitless */}
                    {editingClient.program === 'limitless' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Business Name</label>
                            <input
                              type="text"
                              value={editingClient.businessName || ''}
                              onChange={(e) => setEditingClient({...editingClient, businessName: e.target.value})}
                              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Business Type</label>
                            <select
                              value={editingClient.jobGoal || ''}
                              onChange={(e) => setEditingClient({...editingClient, jobGoal: e.target.value})}
                              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Business Type</option>
                              {businessTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Equipment</label>
                          <select
                            value={editingClient.equipment || ''}
                            onChange={(e) => setEditingClient({...editingClient, equipment: e.target.value})}
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Equipment</option>
                            {equipmentOptions.map(equipment => (
                              <option key={equipment} value={equipment}>{equipment}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {/* Job fields for other programs */}
                    {(editingClient.program === 'new-options' || editingClient.program === 'bridges') && (
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          {editingClient.program === 'new-options' ? 'Job Interest/Field' : 'Career Goals/Skills'}
                        </label>
                        <input
                          type="text"
                          value={editingClient.jobGoal || ''}
                          onChange={(e) => setEditingClient({...editingClient, jobGoal: e.target.value})}
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Program Description */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {editingClient.program === 'limitless' ? 'Business Description' :
                         editingClient.program === 'new-options' ? 'Job Interests & Goals' :
                         editingClient.program === 'bridges' ? 'Career Development Goals' :
                         'Program Description'}
                      </label>
                      <textarea
                        value={editingClient.businessDescription || ''}
                        onChange={(e) => setEditingClient({...editingClient, businessDescription: e.target.value})}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                    </div>

                    {/* Current Goals */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Current Goals</label>
                      <textarea
                        value={editingClient.currentGoals || ''}
                        onChange={(e) => setEditingClient({...editingClient, currentGoals: e.target.value})}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                    </div>

                    {/* Strengths and Challenges */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Strengths</label>
                        <textarea
                          value={editingClient.strengths || ''}
                          onChange={(e) => setEditingClient({...editingClient, strengths: e.target.value})}
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                          rows="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Challenges</label>
                        <textarea
                          value={editingClient.challenges || ''}
                          onChange={(e) => setEditingClient({...editingClient, challenges: e.target.value})}
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                          rows="3"
                        />
                      </div>
                    </div>

                    {/* Coaching Approach */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Coaching Approach</label>
                      <textarea
                        value={editingClient.coachingApproach || ''}
                        onChange={(e) => setEditingClient({...editingClient, coachingApproach: e.target.value})}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                    </div>

                    {/* Progress */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Progress (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editingClient.progress || 0}
                        onChange={(e) => setEditingClient({...editingClient, progress: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium mb-1">General Notes</label>
                      <textarea
                        value={editingClient.notes || ''}
                        onChange={(e) => setEditingClient({...editingClient, notes: e.target.value})}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                    </div>

                    {/* Session Notes */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Session Notes</label>
                      <textarea
                        value={editingClient.sessionNotes || ''}
                        onChange={(e) => setEditingClient({...editingClient, sessionNotes: e.target.value})}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                    </div>
                  </>
                )}

                {/* Password Management Section */}
                {editingClient.uid && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">🔐 Password Management</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-blue-700">
                        This client has a login account with UID: <code className="bg-blue-100 px-1 rounded">{editingClient.uid}</code>
                      </p>
                      <button
                        type="button"
                        onClick={() => handleResetClientPassword(editingClient)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                      >
                        Send Password Reset Email
                      </button>
                      <p className="text-xs text-blue-600">
                        This will send a password reset email to {editingClient.email}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                  >
                    Update Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingClient(null)}
                    className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Coach Edit Modal */}
      {editingCoach && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-[#6D858E] text-white">
              <h3 className="text-lg font-semibold">Edit Coach: {editingCoach.name}</h3>
              <button 
                onClick={() => setEditingCoach(null)} 
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto h-[calc(90vh-140px)] p-6">
              <form onSubmit={handleUpdateCoach} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={editingCoach.name || ''}
                      onChange={(e) => setEditingCoach({...editingCoach, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={editingCoach.email || ''}
                      onChange={(e) => setEditingCoach({...editingCoach, email: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Firebase UID</label>
                    <input
                      type="text"
                      value={editingCoach.uid || ''}
                      onChange={(e) => setEditingCoach({...editingCoach, uid: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Firebase UID..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select
                      value={editingCoach.role || 'coach'}
                      onChange={(e) => setEditingCoach({...editingCoach, role: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="coach">Coach</option>
                      <option value="admin">Admin</option>
                      <option value="scheduler">Scheduler</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Coach Type</label>
                  <select
                    value={editingCoach.coachType || 'success'}
                    onChange={(e) => setEditingCoach({...editingCoach, coachType: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="success">Success Coach</option>
                    <option value="grace">Grace Coach</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingCoach.phone || ''}
                    onChange={(e) => setEditingCoach({...editingCoach, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={editingCoach.notes || ''}
                    onChange={(e) => setEditingCoach({...editingCoach, notes: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Password Management Section */}
                {editingCoach.uid && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">🔐 Password Management</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-yellow-700">
                        This coach has a login account with UID: <code className="bg-yellow-100 px-1 rounded">{editingCoach.uid}</code>
                      </p>
                      <button
                        type="button"
                        onClick={() => handleResetCoachPassword(editingCoach)}
                        className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-sm"
                      >
                        Send Password Reset Email
                      </button>
                      <p className="text-xs text-yellow-600">
                        This will send a password reset email to {editingCoach.email}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                  >
                    Update Coach
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCoach(null)}
                    className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;