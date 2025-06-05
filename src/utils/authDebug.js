// src/utils/authDebug.js
// Utility functions to debug and fix authentication issues

import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../services/firebase/config';

/**
 * Debug authentication issues - call this from browser console
 */
export const debugAuthIssues = async () => {
  console.log('🔍 Starting authentication debug...');
  
  try {
    // Get all coaches
    const coachesSnapshot = await getDocs(collection(db, 'coaches'));
    const coaches = coachesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Get all clients  
    const clientsSnapshot = await getDocs(collection(db, 'clients'));
    const clients = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log('📊 Database Statistics:');
    console.log(`- Coaches: ${coaches.length}`);
    console.log(`- Clients: ${clients.length}`);
    
    // Check for coaches without UIDs
    const coachesWithoutUID = coaches.filter(coach => !coach.uid);
    if (coachesWithoutUID.length > 0) {
      console.warn(`⚠️ Found ${coachesWithoutUID.length} coaches without UID:`);
      coachesWithoutUID.forEach(coach => {
        console.warn(`  - ${coach.name} (${coach.email})`);
      });
    }
    
    // Check for clients without UIDs
    const clientsWithoutUID = clients.filter(client => !client.uid);
    if (clientsWithoutUID.length > 0) {
      console.warn(`⚠️ Found ${clientsWithoutUID.length} clients without UID:`);
      clientsWithoutUID.forEach(client => {
        console.warn(`  - ${client.name} (${client.email})`);
      });
    }
    
    // Check for duplicate emails
    const allEmails = [...coaches.map(c => c.email), ...clients.map(c => c.email)];
    const duplicateEmails = allEmails.filter((email, index) => allEmails.indexOf(email) !== index);
    if (duplicateEmails.length > 0) {
      console.warn(`⚠️ Found duplicate emails:`, [...new Set(duplicateEmails)]);
    }
    
    // Check Grace coaches specifically
    const graceCoaches = coaches.filter(coach => coach.coachType === 'grace');
    console.log(`👥 Grace Coaches: ${graceCoaches.length}`);
    graceCoaches.forEach(coach => {
      console.log(`  - ${coach.name} (${coach.email}) - UID: ${coach.uid ? '✅' : '❌'}`);
    });
    
    return {
      coaches,
      clients,
      coachesWithoutUID,
      clientsWithoutUID,
      duplicateEmails,
      graceCoaches
    };
    
  } catch (error) {
    console.error('💥 Error during debug:', error);
    return null;
  }
};

/**
 * Fix specific user authentication by email
 */
export const fixUserAuth = async (email, newUID) => {
  console.log(`🔧 Attempting to fix auth for ${email} with UID ${newUID}`);
  
  try {
    // Check coaches first
    const coachQuery = query(collection(db, 'coaches'), where('email', '==', email));
    const coachSnapshot = await getDocs(coachQuery);
    
    if (!coachSnapshot.empty) {
      const coachDoc = coachSnapshot.docs[0];
      await updateDoc(doc(db, 'coaches', coachDoc.id), {
        uid: newUID,
        updatedAt: new Date()
      });
      console.log(`✅ Updated coach ${email} with UID ${newUID}`);
      return { type: 'coach', success: true };
    }
    
    // Check clients
    const clientQuery = query(collection(db, 'clients'), where('email', '==', email));
    const clientSnapshot = await getDocs(clientQuery);
    
    if (!clientSnapshot.empty) {
      const clientDoc = clientSnapshot.docs[0];
      await updateDoc(doc(db, 'clients', clientDoc.id), {
        uid: newUID,
        updatedAt: new Date()
      });
      console.log(`✅ Updated client ${email} with UID ${newUID}`);
      return { type: 'client', success: true };
    }
    
    console.warn(`⚠️ No user found with email ${email}`);
    return { success: false, error: 'User not found' };
    
  } catch (error) {
    console.error(`💥 Error fixing auth for ${email}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Quick fix for April Steward specifically
 */
export const fixAprilAuth = async () => {
  console.log('🔧 Quick fix for April Steward authentication...');
  
  try {
    const aprilQuery = query(
      collection(db, 'coaches'), 
      where('email', '==', 'April@itsgrace.org')
    );
    const aprilSnapshot = await getDocs(aprilQuery);
    
    if (!aprilSnapshot.empty) {
      const aprilData = aprilSnapshot.docs[0].data();
      console.log('Found April\'s coach record:', {
        name: aprilData.name,
        email: aprilData.email,
        role: aprilData.role,
        coachType: aprilData.coachType,
        uid: aprilData.uid
      });
      
      // Verify she has the correct role and coachType
      await updateDoc(doc(db, 'coaches', aprilSnapshot.docs[0].id), {
        role: 'coach',
        coachType: 'grace',
        updatedAt: new Date()
      });
      
      console.log('✅ April\'s coach record has been verified and updated');
      return { success: true };
    } else {
      console.error('❌ April not found in coaches collection');
      return { success: false, error: 'April not found' };
    }
    
  } catch (error) {
    console.error('💥 Error fixing April\'s auth:', error);
    return { success: false, error: error.message };
  }
};

// Make functions available in browser console for debugging
if (typeof window !== 'undefined') {
  window.debugAuth = {
    debug: debugAuthIssues,
    fixUser: fixUserAuth,
    fixApril: fixAprilAuth
  };
  
  console.log('🛠️ Auth debug utilities loaded! Use:');
  console.log('  window.debugAuth.debug() - Check for auth issues');
  console.log('  window.debugAuth.fixUser(email, uid) - Fix specific user');
  console.log('  window.debugAuth.fixApril() - Quick fix for April');
}