// src/hooks/useTasks.js
import { useState, useEffect } from 'react';
import { 
  createTask as createTaskService,
  updateTask as updateTaskService,
  deleteTask as deleteTaskService,
  getTasksForDate,
  getTasksForClientAndDate,
  getTasksForClientInRange,
  copyTasksToDate,
  toggleTaskCompletion,
  subscribeToTasks,
  getTaskStatistics
} from '../services/firebase/tasks';

export const useTasks = (isAuthenticated) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up real-time subscription to tasks
  useEffect(() => {
    if (!isAuthenticated) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToTasks((tasksData) => {
      setTasks(tasksData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const createTask = async (taskData) => {
    try {
      setError(null);
      const result = await createTaskService(taskData);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      setError(null);
      await updateTaskService(taskId, updates);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      setError(null);
      await deleteTaskService(taskId);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getTasksForSpecificDate = async (date) => {
    try {
      setError(null);
      return await getTasksForDate(date);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getTasksForClientDate = async (clientId, date) => {
    try {
      setError(null);
      return await getTasksForClientAndDate(clientId, date);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getTasksForClientRange = async (clientId, startDate, endDate) => {
    try {
      setError(null);
      return await getTasksForClientInRange(clientId, startDate, endDate);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const copyTasks = async (sourceDate, targetDate, clientIds = null) => {
    try {
      setError(null);
      return await copyTasksToDate(sourceDate, targetDate, clientIds);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const toggleCompletion = async (taskId, completed) => {
    try {
      setError(null);
      await toggleTaskCompletion(taskId, completed);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getClientTaskStatistics = async (clientId, startDate, endDate) => {
    try {
      setError(null);
      return await getTaskStatistics(clientId, startDate, endDate);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Helper functions for getting tasks from local state
  const getTasksForDateFromState = (date) => {
    return tasks.filter(task => task.date === date);
  };

  const getTasksForClientAndDateFromState = (clientId, date) => {
    return tasks.filter(task => 
      task.clientId === clientId && task.date === date
    );
  };

  const getTaskForClientAndTimeBlock = (clientId, date, timeBlock) => {
    return tasks.find(task => 
      task.clientId === clientId && 
      task.date === date && 
      task.timeBlock === timeBlock
    );
  };

  const getTasksByType = (taskType) => {
    return tasks.filter(task => task.type === taskType);
  };

  const getCompletedTasksForDate = (date) => {
    return tasks.filter(task => task.date === date && task.completed);
  };

  const getIncompleteTasksForDate = (date) => {
    return tasks.filter(task => task.date === date && !task.completed);
  };

  const getTaskCompletionRate = (clientId, date) => {
    const clientTasks = getTasksForClientAndDateFromState(clientId, date);
    if (clientTasks.length === 0) return 0;
    
    const completedTasks = clientTasks.filter(task => task.completed);
    return Math.round((completedTasks.length / clientTasks.length) * 100);
  };

  return {
    tasks,
    loading,
    error,
    
    // Actions
    createTask,
    updateTask,
    deleteTask,
    getTasksForSpecificDate,
    getTasksForClientDate,
    getTasksForClientRange,
    copyTasks,
    toggleCompletion,
    getClientTaskStatistics,
    
    // Helper functions for local state
    getTasksForDateFromState,
    getTasksForClientAndDateFromState,
    getTaskForClientAndTimeBlock,
    getTasksByType,
    getCompletedTasksForDate,
    getIncompleteTasksForDate,
    getTaskCompletionRate
  };
};