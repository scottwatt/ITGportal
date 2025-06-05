// src/components/schedule/DailyTaskScheduler.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Save, Copy, Clipboard, X, Edit3, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDatePST, getPSTDate } from '../../utils/dateUtils';
import { getSchedulableClients, getClientInitials } from '../../utils/helpers';
import { TIME_BLOCKS, TASK_TYPES } from '../../utils/constants'; // Import from constants

const DailyTaskScheduler = ({ 
  clients, 
  coaches, 
  schedules, 
  userProfile,
  taskActions
}) => {
  const [selectedDate, setSelectedDate] = useState(getPSTDate());
  const [tasks, setTasks] = useState([]); // This should come from Firebase
  const [editingTask, setEditingTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTimeBlock, setSelectedTimeBlock] = useState(null);
  const [copiedTasks, setCopiedTasks] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get schedulable clients (no Grace clients)
  const schedulableClients = getSchedulableClients(clients);
  
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
  const scheduledClients = schedulableClients.filter(client => 
    getCoachForClient(client.id) !== null
  );

  // Load tasks when date changes
  useEffect(() => {
    loadTasksForDate();
  }, [selectedDate]);

  const loadTasksForDate = async () => {
    if (!taskActions) return;
    
    setLoading(true);
    try {
      // In a real implementation, you'd get tasks from the hook's state
      // For now, we'll simulate with taskActions.getTasksForDateFromState if available
      if (taskActions.getTasksForDateFromState) {
        const dateTasks = taskActions.getTasksForDateFromState(selectedDate);
        setTasks(dateTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction) => {
    const currentDate = new Date(selectedDate + 'T12:00:00');
    currentDate.setDate(currentDate.getDate() + direction);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  // Get task for specific client and time block
  const getTask = (clientId, timeBlockId) => {
    return tasks.find(task => 
      task.date === selectedDate && 
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
      priority: 'medium',
      completed: false
    });
    setShowTaskModal(true);
  };

  // Save task
  const handleSaveTask = async (taskData) => {
    setLoading(true);
    try {
      if (taskData.id) {
        // Update existing task
        await taskActions.updateTask(taskData.id, taskData);
      } else {
        // Create new task
        await taskActions.createTask(taskData);
      }
      
      // Refresh tasks
      await loadTasksForDate();
      
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
        await taskActions.deleteTask(taskId);
        await loadTasksForDate();
        setShowTaskModal(false);
        setEditingTask(null);
      } catch (error) {
        alert('Error deleting task: ' + error.message);
      }
    }
  };

  // Copy day's tasks
  const handleCopyDay = () => {
    const dayTasks = tasks.filter(task => task.date === selectedDate);
    if (dayTasks.length === 0) {
      alert('No tasks to copy for this date.');
      return;
    }
    
    setCopiedTasks({
      sourceDate: selectedDate,
      tasks: dayTasks,
      copiedAt: new Date().toISOString()
    });
    
    alert(`Copied ${dayTasks.length} tasks from ${formatDatePST(selectedDate)}!`);
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
      
      // If we're viewing the target date, refresh
      if (targetDate === selectedDate) {
        await loadTasksForDate();
      }
    } catch (error) {
      alert('Error pasting tasks: ' + error.message);
    }
  };

  // Get task type styling
  const getTaskTypeStyle = (taskType) => {
    const type = TASK_TYPES.find(t => t.id === taskType);
    return type ? type.color : 'bg-gray-100 text-gray-800 border-gray-200';
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
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={formData.priority || 'medium'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
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

      {/* Status Bar */}
      <div className="bg-[#BED2D8] p-4 rounded-lg border-l-4 border-[#6D858E]">
        <h3 className="font-semibold text-[#292929] mb-2">
          📅 {formatDatePST(selectedDate)} - {scheduledClients.length} Clients Scheduled
        </h3>
        <div className="text-sm text-[#292929]">
          Click any cell to add/edit tasks • Each cell = 30-minute time block • Color-coded by task type
        </div>
        {copiedTasks && (
          <div className="mt-2 text-sm text-[#707070]">
            ✅ {copiedTasks.tasks.length} tasks copied from {formatDatePST(copiedTasks.sourceDate)}
          </div>
        )}
      </div>

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
                    return (
                      <th key={client.id} className="border border-gray-300 p-3 text-center min-w-48">
                        <div className="space-y-1">
                          <div className="font-semibold text-[#292929]">{client.name}</div>
                          <div className="text-xs text-[#707070]">
                            Coach: {coach?.name || 'TBD'}
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
                            }`}>
                              <div className="font-medium truncate" title={task.title}>
                                {task.title}
                              </div>
                              {task.priority === 'high' && (
                                <div className="text-red-600 font-bold">!</div>
                              )}
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
          <h3 className="text-lg font-semibold text-[#292929] mb-2">No Clients Scheduled</h3>
          <p className="text-[#707070]">
            Please schedule clients first in the Daily Schedule tab before assigning tasks.
          </p>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal />
    </div>
  );
};

export default DailyTaskScheduler;