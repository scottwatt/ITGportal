// src/services/firebase/tasks.js
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  deleteDoc, 
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

import { db } from './config';

/**
 * Create a new task
 * @param {Object} taskData - Task data
 * @returns {Promise<Object>} Created task
 */
export const createTask = async (taskData) => {
  try {
    const newTask = {
      ...taskData,
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'tasks'), newTask);
    return { id: docRef.id, ...newTask };
  } catch (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }
};

/**
 * Update an existing task
 * @param {string} taskId - Task document ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateTask = async (taskId, updates) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }
};

/**
 * Delete a task
 * @param {string} taskId - Task document ID
 * @returns {Promise<void>}
 */
export const deleteTask = async (taskId) => {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    throw new Error(`Failed to delete task: ${error.message}`);
  }
};

/**
 * Get tasks for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of tasks for the date
 */
export const getTasksForDate = async (date) => {
  try {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('date', '==', date)
    );
    const snapshot = await getDocs(tasksQuery);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Failed to get tasks for date: ${error.message}`);
  }
};

/**
 * Get tasks for a specific client and date
 * @param {string} clientId - Client ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of tasks for the client and date
 */
export const getTasksForClientAndDate = async (clientId, date) => {
  try {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('clientId', '==', clientId),
      where('date', '==', date)
    );
    const snapshot = await getDocs(tasksQuery);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Failed to get tasks for client and date: ${error.message}`);
  }
};

/**
 * Get tasks for a specific client within a date range
 * @param {string} clientId - Client ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of tasks for the client in date range
 */
export const getTasksForClientInRange = async (clientId, startDate, endDate) => {
  try {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('clientId', '==', clientId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const snapshot = await getDocs(tasksQuery);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Failed to get tasks for client in range: ${error.message}`);
  }
};

/**
 * Copy tasks from one date to another for the same clients
 * @param {string} sourceDate - Source date (YYYY-MM-DD)
 * @param {string} targetDate - Target date (YYYY-MM-DD)
 * @param {Array} clientIds - Optional array of client IDs to filter
 * @returns {Promise<Array>} Array of created tasks
 */
export const copyTasksToDate = async (sourceDate, targetDate, clientIds = null) => {
  try {
    let tasksQuery = query(
      collection(db, 'tasks'),
      where('date', '==', sourceDate)
    );
    
    const sourceSnapshot = await getDocs(tasksQuery);
    const sourceTasks = sourceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter by client IDs if provided
    const tasksToCopy = clientIds ? 
      sourceTasks.filter(task => clientIds.includes(task.clientId)) : 
      sourceTasks;
    
    // Check for existing tasks on target date to avoid duplicates
    const targetTasksQuery = query(
      collection(db, 'tasks'),
      where('date', '==', targetDate)
    );
    const targetSnapshot = await getDocs(targetTasksQuery);
    const existingTasks = targetSnapshot.docs.map(doc => doc.data());
    
    const newTasks = [];
    
    for (const task of tasksToopy) {
      // Check if task already exists (same client, timeBlock, date)
      const exists = existingTasks.some(existing => 
        existing.clientId === task.clientId && 
        existing.timeBlock === task.timeBlock
      );
      
      if (!exists) {
        const newTask = {
          ...task,
          date: targetDate,
          completed: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Remove the old ID since this is a new document
        delete newTask.id;
        
        const docRef = await addDoc(collection(db, 'tasks'), newTask);
        newTasks.push({ id: docRef.id, ...newTask });
      }
    }
    
    return newTasks;
  } catch (error) {
    throw new Error(`Failed to copy tasks: ${error.message}`);
  }
};

/**
 * Mark task as completed/incomplete
 * @param {string} taskId - Task document ID
 * @param {boolean} completed - Completion status
 * @returns {Promise<void>}
 */
export const toggleTaskCompletion = async (taskId, completed) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      completed,
      completedAt: completed ? serverTimestamp() : null,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw new Error(`Failed to toggle task completion: ${error.message}`);
  }
};

/**
 * Set up real-time listener for tasks
 * @param {Function} callback - Callback function to handle tasks data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToTasks = (callback) => {
  return onSnapshot(
    collection(db, 'tasks'),
    (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(tasksData);
    },
    (error) => {
      console.error('Error in tasks subscription:', error);
      callback([]); // Return empty array on error
    }
  );
};

/**
 * Get task completion statistics for a client
 * @param {string} clientId - Client ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Task statistics
 */
export const getTaskStatistics = async (clientId, startDate, endDate) => {
  try {
    const tasks = await getTasksForClientInRange(clientId, startDate, endDate);
    
    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.completed).length,
      incompleteTasks: tasks.filter(t => !t.completed).length,
      completionRate: 0,
      tasksByType: {},
      tasksByPriority: {}
    };
    
    if (stats.totalTasks > 0) {
      stats.completionRate = Math.round((stats.completedTasks / stats.totalTasks) * 100);
    }
    
    // Group by type
    tasks.forEach(task => {
      stats.tasksByType[task.type] = (stats.tasksByType[task.type] || 0) + 1;
    });
    
    // Group by priority
    tasks.forEach(task => {
      stats.tasksByPriority[task.priority] = (stats.tasksByPriority[task.priority] || 0) + 1;
    });
    
    return stats;
  } catch (error) {
    throw new Error(`Failed to get task statistics: ${error.message}`);
  }
};