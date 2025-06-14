// src/components/schedule/DailyTaskScheduler.jsx - FIXED to allow all coordinators to see all tasks
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Save, Copy, Clipboard, X, Edit3, Trash2, ChevronLeft, ChevronRight, Users, AlertCircle } from 'lucide-react';
import { formatDatePST, getPSTDate } from '../../utils/dateUtils';
import { getSchedulableClients, getClientInitials } from '../../utils/helpers';
import { TIME_BLOCKS, TASK_TYPES, USER_ROLES } from '../../utils/constants';

const DailyTaskScheduler = ({ 
  clients, 
  coaches, 
  schedules, 
  userProfile,
  taskActions,
  tasks // Get tasks directly from props instead of loading them
}) => {
  const [selectedDate, setSelectedDate] = useState(getPSTDate());
  const [editingTask, setEditingTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTimeBlock, setSelectedTimeBlock] = useState(null);
  const [copiedTasks, setCopiedTasks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optimisticTasks, setOptimisticTasks] = useState([]); // For immediate UI updates

  // Get schedulable clients (no Grace clients)
  const schedulableClients = getSchedulableClients(clients);
  
  // FIXED: Enhanced client filtering to include ALL coordinator roles
  const getClientsForTaskScheduling = () => {
    // FIXED: Define all roles that should have full access to all clients
    const fullAccessRoles = [
      USER_ROLES.ADMIN,
      USER_ROLES.SCHEDULER,
      // NEW COORDINATOR ROLES - All should see all clients
      USER_ROLES.MERCHANDISE_COORDINATOR,        // Kameron
      USER_ROLES.PROGRAM_ADMIN_COORDINATOR,      // Josh  
      USER_ROLES.ADMIN_DEV_COORDINATOR,          // Connie
      USER_ROLES.VOCATIONAL_DEV_COORDINATOR,     // Scott
      USER_ROLES.EXECUTIVE_DIRECTOR,
      USER_ROLES.DIRECTOR_ORG_DEV,
      USER_ROLES.DIRECTOR_PROGRAM_DEV
    ];

    // FIXED: Check if user has full access (admin, scheduler, or any coordinator role)
    if (fullAccessRoles.includes(userProfile?.role)) {
      console.log(`✅ User ${userProfile.name} (${userProfile.role}) has full access - showing all ${schedulableClients.length} clients`);
      return schedulableClients;
    } else if (userProfile?.role === USER_ROLES.COACH) {
      // Regular coaches can only see clients assigned to them for daily tasks
      const assignedClients = schedulableClients.filter(client => 
        client.dailyTaskCoachId === userProfile.uid
      );
      console.log(`👤 Coach ${userProfile.name} assigned to ${assignedClients.length} clients`);
      return assignedClients;
    }
    
    console.warn(`⚠️ User ${userProfile?.name} (${userProfile?.role}) has no access to task scheduling`);
    return [];
  };

  const availableClients = getClientsForTaskScheduling();
  
  // Get coaches assigned to clients for the day
  const getCoachForClient = (clientId) => {
    const clientSchedule = schedules.find(s => 
      s.date === selectedDate && s.clientId === clientId
    );
    if (clientSchedule) {
      return coaches.find(c => (c.uid || c.id) === clientSchedule.coachId);
    }
    return null;
  };

  // Only show clients who are scheduled for the day
  const scheduledClients = availableClients.filter(client => 
    getCoachForClient(client.id) !== null
  );

  // FIXED: Get tasks for the current date - allow full access users to see ALL tasks
  const getTasksForCurrentDate = () => {
    // Get real tasks from Firebase for the selected date
    const realTasks = tasks.filter(task => task.date === selectedDate);
    
    // Get optimistic tasks for the selected date
    const optimisticForDate = optimisticTasks.filter(task => task.date === selectedDate);
    
    // Combine them, preferring real tasks over optimistic ones
    const combinedTasks = [...realTasks];
    
    // Add optimistic tasks that don't have real counterparts yet
    optimisticForDate.forEach(optimisticTask => {
      const hasRealTask = realTasks.some(realTask => 
        realTask.clientId === optimisticTask.clientId && 
        realTask.timeBlock === optimisticTask.timeBlock &&
        Math.abs(new Date(realTask.createdAt?.seconds * 1000 || realTask.createdAt) - new Date(optimisticTask.createdAt)) < 5000
      );
      
      if (!hasRealTask) {
        combinedTasks.push(optimisticTask);
      }
    });
    
    // FIXED: Define full access roles again (same as above)
    const fullAccessRoles = [
      USER_ROLES.ADMIN,
      USER_ROLES.SCHEDULER,
      USER_ROLES.MERCHANDISE_COORDINATOR,
      USER_ROLES.PROGRAM_ADMIN_COORDINATOR,
      USER_ROLES.ADMIN_DEV_COORDINATOR,
      USER_ROLES.VOCATIONAL_DEV_COORDINATOR,
      USER_ROLES.EXECUTIVE_DIRECTOR,
      USER_ROLES.DIRECTOR_ORG_DEV,
      USER_ROLES.DIRECTOR_PROGRAM_DEV
    ];

    // FIXED: Full access users can see ALL tasks, not just assigned ones
    if (fullAccessRoles.includes(userProfile?.role)) {
      console.log(`✅ Showing all ${combinedTasks.length} tasks for full access user`);
      return combinedTasks;
    } else if (userProfile?.role === USER_ROLES.COACH) {
      // Regular coaches only see tasks for their assigned clients
      const filteredTasks = combinedTasks.filter(task => {
        const client = clients.find(c => c.id === task.clientId);
        return client && client.dailyTaskCoachId === userProfile.uid;
      });
      console.log(`👤 Showing ${filteredTasks.length} tasks for coach's assigned clients`);
      return filteredTasks;
    }
    
    return combinedTasks; // Fallback to show all tasks
  };

  // Clean up optimistic tasks when real tasks arrive
  useEffect(() => {
    const currentDateTasks = tasks.filter(task => task.date === selectedDate);
    
    // Remove optimistic tasks that now have real counterparts
    setOptimisticTasks(prev => prev.filter(optimisticTask => {
      if (optimisticTask.date !== selectedDate) return true;
      
      const hasRealTask = currentDateTasks.some(realTask => 
        realTask.clientId === optimisticTask.clientId && 
        realTask.timeBlock === optimisticTask.timeBlock &&
        Math.abs(new Date(realTask.createdAt?.seconds * 1000 || realTask.createdAt) - new Date(optimisticTask.createdAt)) < 5000
      );
      
      return !hasRealTask;
    }));
  }, [tasks, selectedDate]);

  const navigateDate = (direction) => {
    const currentDate = new Date(selectedDate + 'T12:00:00');
    currentDate.setDate(currentDate.getDate() + direction);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  // Get task for specific client and time block
  const getTask = (clientId, timeBlockId) => {
    const currentTasks = getTasksForCurrentDate();
    return currentTasks.find(task => 
      task.clientId === clientId && 
      task.timeBlock === timeBlockId
    );
  };

  // Handle task creation/editing
  const handleCellClick = (clientId, timeBlockId) => {
    const existingTask = getTask(clientId, timeBlockId);
    const client = schedulableClients.find(c => c.id === clientId);
    const timeBlock = TIME_BLOCKS.find(tb => tb.id === timeBlockId);
    
    setSelectedClient(client);
    setSelectedTimeBlock(timeBlock);
    setEditingTask(existingTask || {
      clientId,
      timeBlock: timeBlockId,
      date: selectedDate,
      title: '',
      description: '',
      type: 'business-work',
      completed: false
    });
    setShowTaskModal(true);
  };

  // Save task with immediate UI feedback
  const handleSaveTask = async (taskData) => {
    setLoading(true);
    
    try {
      if (taskData.id) {
        // Update existing task
        await taskActions.updateTask(taskData.id, taskData);
      } else {
        // Create optimistic task immediately for instant UI feedback
        const optimisticTask = {
          id: `optimistic-${Date.now()}`, // Temporary ID
          ...taskData,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOptimistic: true
        };
        
        // Add to optimistic tasks for immediate UI update
        setOptimisticTasks(prev => [...prev, optimisticTask]);
        
        // Create real task in Firebase (async)
        taskActions.createTask(taskData).catch(error => {
          // Remove optimistic task if creation fails
          setOptimisticTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
          alert('Error saving task: ' + error.message);
        });
      }
      
      // Close modal immediately
      setShowTaskModal(false);
      setEditingTask(null);
      
    } catch (error) {
      alert('Error saving task: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        // If it's an optimistic task, just remove it locally
        if (taskId.startsWith('optimistic-')) {
          setOptimisticTasks(prev => prev.filter(t => t.id !== taskId));
          setShowTaskModal(false);
          setEditingTask(null);
          return;
        }
        
        await taskActions.deleteTask(taskId);
        setShowTaskModal(false);
        setEditingTask(null);
      } catch (error) {
        alert('Error deleting task: ' + error.message);
      }
    }
  };

  // Copy day's tasks
  const handleCopyDay = () => {
    const currentDateTasks = getTasksForCurrentDate();
    if (currentDateTasks.length === 0) {
      alert('No tasks to copy for this date.');
      return;
    }
    
    setCopiedTasks({
      sourceDate: selectedDate,
      tasks: currentDateTasks,
      copiedAt: new Date().toISOString()
    });
    
    alert(`Copied ${currentDateTasks.length} tasks from ${formatDatePST(selectedDate)}!`);
  };

  // Paste tasks to another day
  const handlePasteDay = async () => {
    if (!copiedTasks) {
      alert('No tasks copied. Please copy a day first.');
      return;
    }

    const targetDate = prompt('Enter target date (YYYY-MM-DD):');
    if (!targetDate) return;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(targetDate)) {
      alert('Invalid date format. Please use YYYY-MM-DD');
      return;
    }

    try {
      const result = await taskActions.copyTasks(copiedTasks.sourceDate, targetDate);
      alert(`Successfully pasted ${result.length} tasks!`);
    } catch (error) {
      alert('Error pasting tasks: ' + error.message);
    }
  };

  // Get task type styling
  const getTaskTypeStyle = (taskType) => {
    const type = TASK_TYPES.find(t => t.id === taskType);
    return type ? type.color : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // FIXED: Check if user has full access for UI messaging
  const hasFullAccess = () => {
    const fullAccessRoles = [
      USER_ROLES.ADMIN,
      USER_ROLES.SCHEDULER,
      USER_ROLES.MERCHANDISE_COORDINATOR,
      USER_ROLES.PROGRAM_ADMIN_COORDINATOR,
      USER_ROLES.ADMIN_DEV_COORDINATOR,
      USER_ROLES.VOCATIONAL_DEV_COORDINATOR,
      USER_ROLES.EXECUTIVE_DIRECTOR,
      USER_ROLES.DIRECTOR_ORG_DEV,
      USER_ROLES.DIRECTOR_PROGRAM_DEV
    ];
    return fullAccessRoles.includes(userProfile?.role);
  };

  // Task Modal Component
  const TaskModal = () => {
    const [formData, setFormData] = useState(editingTask || {});

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.title.trim()) {
        alert('Please enter a task title.');
        return;
      }
      handleSaveTask(formData);
    };

    if (!showTaskModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center p-4 border-b bg-[#6D858E] text-white">
            <h3 className="text-lg font-semibold">
              {editingTask?.id ? 'Edit Task' : 'New Task'}
            </h3>
            <button onClick={() => setShowTaskModal(false)}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Client</label>
              <div className="text-[#6D858E] font-medium">{selectedClient?.name}</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <div className="text-[#292929]">{selectedTimeBlock?.label}</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Task Title *</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                placeholder="e.g., Work on mug designs, Practice embroidery..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Task Type</label>
              <select
                value={formData.type || 'business-work'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
              >
                {TASK_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                rows="3"
                placeholder="Additional details, instructions, or notes..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="completed"
                checked={formData.completed || false}
                onChange={(e) => setFormData({ ...formData, completed: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="completed" className="text-sm">Mark as completed</label>
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#6D858E] text-white py-2 px-4 rounded hover:bg-[#5A4E69] disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Task'}
              </button>
              
              {editingTask?.id && (
                <button
                  type="button"
                  onClick={() => handleDeleteTask(editingTask.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 bg-[#9B97A2] text-white rounded hover:bg-[#707070]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const currentDateTasks = getTasksForCurrentDate();

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#292929]">Daily Task Scheduler</h2>
        
        <div className="flex items-center space-x-4">
          {/* Copy/Paste Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyDay}
              className="flex items-center space-x-2 px-3 py-2 bg-[#5A4E69] text-white rounded hover:bg-[#292929] text-sm"
            >
              <Copy size={16} />
              <span>Copy Day</span>
            </button>
            
            <button
              onClick={handlePasteDay}
              disabled={!copiedTasks}
              className={`flex items-center space-x-2 px-3 py-2 rounded text-sm ${
                copiedTasks 
                  ? 'bg-[#6D858E] text-white hover:bg-[#5A4E69]' 
                  : 'bg-[#9B97A2] text-white cursor-not-allowed'
              }`}
            >
              <Clipboard size={16} />
              <span>Paste Day</span>
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 text-[#6D858E] hover:bg-[#BED2D8] rounded"
            >
              <ChevronLeft size={20} />
            </button>
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
            />
            
            <button
              onClick={() => navigateDate(1)}
              className="p-2 text-[#6D858E] hover:bg-[#BED2D8] rounded"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* FIXED: Status Bar with better messaging for coordinators */}
      <div className="bg-[#BED2D8] p-4 rounded-lg border-l-4 border-[#6D858E]">
        <h3 className="font-semibold text-[#292929] mb-2">
          📅 {formatDatePST(selectedDate)} - {scheduledClients.length} Clients Scheduled
        </h3>
        <div className="text-sm text-[#292929]">
          Click any cell to add/edit tasks • Each cell = 30-minute time block • Color-coded by task type
        </div>
        {hasFullAccess() ? (
          <div className="mt-2 text-sm text-[#707070]">
            👑 <strong>Full Access:</strong> Viewing tasks for all {availableClients.length} clients ({userProfile?.role?.replace(/_/g, ' ')})
          </div>
        ) : userProfile?.role === USER_ROLES.COACH ? (
          <div className="mt-2 text-sm text-[#707070]">
            👤 Showing tasks for clients assigned to you ({availableClients.length} total assigned)
          </div>
        ) : null}
        {copiedTasks && (
          <div className="mt-2 text-sm text-[#707070]">
            ✅ {copiedTasks.tasks.length} tasks copied from {formatDatePST(copiedTasks.sourceDate)}
          </div>
        )}
      </div>

      {/* FIXED: Assignment Status - only show for regular coaches */}
      {userProfile?.role === USER_ROLES.COACH && availableClients.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-yellow-600" size={20} />
            <h4 className="font-semibold text-yellow-800">No Clients Assigned</h4>
          </div>
          <p className="text-sm text-yellow-700 mt-2">
            You don't have any clients assigned for daily task management. Please contact an administrator 
            to assign clients to you in the Task Assignments tab.
          </p>
        </div>
      )}

      {/* Task Legend */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h4 className="font-semibold text-[#292929] mb-3">Task Types:</h4>
        <div className="flex flex-wrap gap-2">
          {TASK_TYPES.map(type => (
            <span key={type.id} className={`px-3 py-1 rounded text-xs font-medium border ${type.color}`}>
              {type.label}
            </span>
          ))}
        </div>
      </div>

      {/* Schedule Grid */}
      {scheduledClients.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Header Row - Client Names */}
              <thead>
                <tr className="bg-[#F5F5F5]">
                  <th className="sticky left-0 bg-[#F5F5F5] border border-gray-300 p-3 text-left font-semibold text-[#292929] min-w-24">
                    Time
                  </th>
                  {scheduledClients.map(client => {
                    const coach = getCoachForClient(client.id);
                    const taskCoach = coaches.find(c => (c.uid || c.id) === client.dailyTaskCoachId);
                    return (
                      <th key={client.id} className="border border-gray-300 p-3 text-center min-w-48">
                        <div className="space-y-1">
                          <div className="font-semibold text-[#292929]">{client.name}</div>
                          <div className="text-xs text-[#707070]">
                            Session Coach: {coach?.name || 'TBD'}
                          </div>
                          <div className="text-xs text-[#6D858E]">
                            Task Coach: {taskCoach?.name || 'Not assigned'}
                          </div>
                          <div className="flex items-center justify-center space-x-1">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              client.program === 'limitless' ? 'bg-[#BED2D8]' :
                              client.program === 'new-options' ? 'bg-[#BED2D8]' :
                              client.program === 'bridges' ? 'bg-[#BED2D8]' :
                              'bg-[#F5F5F5]'
                            }`}>
                              <span className="text-xs font-bold text-[#292929]">
                                {client.program === 'limitless' ? 'L' :
                                 client.program === 'new-options' ? 'NO' :
                                 client.program === 'bridges' ? 'B' :
                                 'L'}
                              </span>
                            </div>
                            <span className="text-xs text-[#9B97A2]">
                              {client.program === 'limitless' ? client.businessName :
                               client.program === 'new-options' ? 'Community Job' :
                               client.program === 'bridges' ? 'Career Dev' :
                               client.businessName}
                            </span>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Time Block Rows */}
              <tbody>
                {TIME_BLOCKS.map(timeBlock => (
                  <tr key={timeBlock.id} className="hover:bg-[#F5F5F5]">
                    {/* Time Column */}
                    <td className="sticky left-0 bg-white border border-gray-300 p-3 font-medium text-[#292929] text-center">
                      {timeBlock.label}
                    </td>
                    
                    {/* Client Task Cells */}
                    {scheduledClients.map(client => {
                      const task = getTask(client.id, timeBlock.id);
                      return (
                        <td 
                          key={`${client.id}-${timeBlock.id}`}
                          className="border border-gray-300 p-1 cursor-pointer hover:bg-[#BED2D8] transition-colors"
                          onClick={() => handleCellClick(client.id, timeBlock.id)}
                        >
                          {task ? (
                            <div className={`p-2 rounded text-xs border ${getTaskTypeStyle(task.type)} ${
                              task.completed ? 'opacity-60 line-through' : ''
                            } ${
                              task.isOptimistic ? 'animate-pulse border-dashed' : ''
                            }`}>
                              <div className="font-medium truncate" title={task.title}>
                                {task.title}
                                {task.isOptimistic && <span className="ml-1 text-blue-500">⏳</span>}
                              </div>
                            </div>
                          ) : (
                            <div className="h-12 flex items-center justify-center text-[#9B97A2] hover:text-[#6D858E]">
                              <Plus size={16} />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Calendar size={48} className="mx-auto mb-4 text-[#9B97A2]" />
          <h3 className="text-lg font-semibold text-[#292929] mb-2">
            {availableClients.length === 0 ? 'No Assigned Clients' : 'No Clients Scheduled'}
          </h3>
          <p className="text-[#707070]">
            {availableClients.length === 0 
              ? hasFullAccess() 
                ? 'No clients are available for task scheduling. Please check that clients are properly set up in the system.'
                : 'You don\'t have any clients assigned for daily task management. Contact an administrator to assign clients to you.'
              : 'Please schedule your assigned clients first in the Daily Schedule tab before assigning tasks.'
            }
          </p>
          {userProfile?.role === USER_ROLES.COACH && availableClients.length > 0 && (
            <div className="mt-4 text-sm text-[#9B97A2]">
              You have {availableClients.length} assigned client(s) but none are scheduled for today.
            </div>
          )}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal />
    </div>
  );
};

export default DailyTaskScheduler;