// src/services/firebase/schedules.js
import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

import { db } from './config';

/**
 * Add a new schedule assignment
 */
export const addScheduleAssignment = async (date, timeSlot, coachId, clientId) => {
  try {
    const newSchedule = {
      date: date,
      timeSlot: timeSlot,
      coachId: coachId,
      clientId: clientId,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'schedules'), newSchedule);
    return { id: docRef.id, ...newSchedule };
  } catch (error) {
    throw error;
  }
};

/**
 * Remove a schedule assignment
 */
export const removeScheduleAssignment = async (scheduleId) => {
  try {
    await deleteDoc(doc(db, 'schedules', scheduleId));
  } catch (error) {
    throw error;
  }
};

/**
 * Set up real-time listener for schedules
 */
export const subscribeToSchedules = (callback) => {
  return onSnapshot(collection(db, 'schedules'), (snapshot) => {
    const schedulesData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(schedulesData);
  });
};