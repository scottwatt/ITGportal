// src/components/client/ClientTaskView.jsx - Updated to use TIME_BLOCKS
import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Calendar, TrendingUp, Target, Star } from 'lucide-react';
import { getPSTDate, formatDatePST } from '../../utils/dateUtils';
import { TIME_BLOCKS, TASK_TYPES } from '../../utils/constants'; 
const ClientTaskView = ({ userProfile, clients, taskActions }) => {
  const [selectedDate, setSelectedDate] = useState(getPSTDate());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completedTasks, setCompletedTasks] = useState(new Set());

  // Find the current client's data
  const clientData = clients.find(c => c.email === userProfile.email) || clients[0];

  useEffect(() => {
    if (clientData) {
      loadTasksForDate();
    }
  }, [selectedDate, clientData]);

  const loadTasksForDate = async () => {
    if (!clientData || !taskActions) return;
    
    setLoading(true);
    try {
      const clientTasks = await taskActions.getTasksForClientDate(clientData.id, selectedDate);
      setTasks(clientTasks);
      
      // Set completed tasks
      const completed = new Set(clientTasks.filter(t => t.completed).map(t => t.id));
      setCompletedTasks(completed);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (taskId, completed) => {
    try {
      await taskActions.toggleCompletion(taskId, completed);
      
      // Update local state
      if (completed) {
        setCompletedTasks(prev => new Set([...prev, taskId]));
      } else {
        setCompletedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }
      
      // Reload tasks to get updated data
      await loadTasksForDate();
      
    } catch (error) {
      console.error('Error updating task completion:', error);
      alert('Error updating task. Please try again.');
    }
  };

  const navigateDate = (direction) => {
    const currentDate = new Date(selectedDate + 'T12:00:00');
    currentDate.setDate(currentDate.getDate() + direction);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const getTaskTypeStyle = (taskType) => {
    const type = TASK_TYPES.find(t => t.id === taskType);
    return type ? type.color : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, pending: total - completed, completionRate };
  };

  const stats = getTaskStats();

  if (!clientData) {
    return (
      <div className="text-center py-8">
        <p className="text-[#9B97A2]">No client data found. Please contact your coach.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6D858E] to-[#5A4E69] text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">My Daily Tasks</h2>
        <p className="text-[#BED2D8]">Stay organized and track your business progress</p>
      </div>

      {/* Date Navigation and Stats */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateDate(-1)}
            className="px-4 py-2 bg-[#9B97A2] text-white rounded hover:bg-[#707070]"
          >
            ← Previous Day
          </button>
          
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
          />
          
          <button
            onClick={() => navigateDate(1)}
            className="px-4 py-2 bg-[#9B97A2] text-white rounded hover:bg-[#707070]"
          >
            Next Day →
          </button>
        </div>

        <div className="text-right">
          <h3 className="text-xl font-semibold text-[#292929]">
            {formatDatePST(selectedDate)}
          </h3>
          <p className="text-sm text-[#707070]">
            {stats.completed} of {stats.total} tasks completed ({stats.completionRate}%)
          </p>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#6D858E]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[#707070] text-sm">Total Tasks</p>
              <p className="text-2xl font-bold text-[#6D858E]">{stats.total}</p>
            </div>
            <Target className="text-[#6D858E]" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-green-600 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-orange-600 text-sm">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="text-orange-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#5A4E69]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[#5A4E69] text-sm">Progress</p>
              <p className="text-2xl font-bold text-[#5A4E69]">{stats.completionRate}%</p>
            </div>
            <TrendingUp className="text-[#5A4E69]" size={24} />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {stats.total > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#707070]">Daily Progress</span>
            <span className="font-semibold text-[#292929]">{stats.completionRate}%</span>
          </div>
          <div className="w-full bg-[#F5F5F5] rounded-full h-4">
            <div 
              className="bg-[#6D858E] h-4 rounded-full transition-all duration-500" 
              style={{width: `${stats.completionRate}%`}}
            ></div>
          </div>
        </div>
      )}

      {/* Task Schedule */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b bg-[#F5F5F5]">
          <h3 className="text-lg font-semibold text-[#292929]">Daily Schedule</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D858E] mx-auto"></div>
            <p className="mt-2 text-[#707070]">Loading your tasks...</p>
          </div>
        ) : tasks.length > 0 ? (
          <div className="divide-y">
            {TIME_BLOCKS.map(timeBlock => {
              const blockTasks = tasks.filter(task => task.timeBlock === timeBlock.id);
              
              return (
                <div key={timeBlock.id} className="p-4 hover:bg-[#F5F5F5]">
                  <div className="flex items-start space-x-4">
                    {/* Time */}
                    <div className="w-20 flex-shrink-0">
                      <div className="text-sm font-semibold text-[#6D858E]">
                        {timeBlock.label}
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="flex-1">
                      {blockTasks.length > 0 ? (
                        <div className="space-y-3">
                          {blockTasks.map(task => {
                            const isCompleted = task.completed;
                            return (
                              <div
                                key={task.id}
                                className={`border rounded-lg p-3 transition-all duration-200 ${
                                  isCompleted ? 'bg-green-50 border-green-200' : getTaskTypeStyle(task.type)
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <button
                                        onClick={() => handleTaskComplete(task.id, !isCompleted)}
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                          isCompleted 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : 'border-[#9B97A2] hover:border-[#6D858E]'
                                        }`}
                                      >
                                        {isCompleted && <CheckCircle size={12} />}
                                      </button>
                                      <h4 className={`font-semibold ${
                                        isCompleted ? 'line-through text-green-700' : 'text-[#292929]'
                                      }`}>
                                        {task.title}
                                      </h4>
                                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                                        isCompleted ? 'bg-green-200 text-green-800' : getTaskTypeStyle(task.type)
                                      }`}>
                                        {TASK_TYPES.find(t => t.id === task.type)?.label || 'Task'}
                                      </span>
                                    </div>
                                    
                                    {task.description && (
                                      <p className={`text-sm ${
                                        isCompleted ? 'text-green-600' : 'text-[#707070]'
                                      }`}>
                                        {task.description}
                                      </p>
                                    )}
                                    
                                    {task.priority === 'high' && !isCompleted && (
                                      <div className="flex items-center space-x-1 mt-2">
                                        <Star size={14} className="text-red-500" />
                                        <span className="text-xs text-red-600 font-medium">High Priority</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[#9B97A2] text-sm italic">
                          No tasks scheduled for this time
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-[#9B97A2]">
            <Calendar size={48} className="mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Tasks Scheduled</h3>
            <p>Your coach hasn't assigned any tasks for this date yet.</p>
            <p className="text-sm mt-2">Check back later or contact your coach!</p>
          </div>
        )}
      </div>

      {/* Motivational Message */}
      {stats.total > 0 && (
        <div className="bg-[#BED2D8] p-4 rounded-lg border-l-4 border-[#6D858E]">
          <h4 className="font-semibold text-[#292929] mb-2">
            {stats.completionRate === 100 ? '🎉 Great Job!' : 
             stats.completionRate >= 75 ? '💪 Almost There!' :
             stats.completionRate >= 50 ? '🚀 Keep Going!' :
             '🌟 You Can Do It!'}
          </h4>
          <p className="text-sm text-[#292929]">
            {stats.completionRate === 100 ? 'You completed all your tasks today! Your business is growing thanks to your hard work.' :
             stats.completionRate >= 75 ? 'You\'re doing great! Just a few more tasks to complete your day.' :
             stats.completionRate >= 50 ? 'You\'re making good progress! Stay focused and keep working on your goals.' :
             'Every task you complete brings you closer to your business goals. Take it one step at a time!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientTaskView;