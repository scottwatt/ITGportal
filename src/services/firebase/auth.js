// src/services/firebase/auth.js - UPDATED with better debugging and coach recognition
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { 
  collection, 
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

import { auth, db } from './config';

/**
 * Sign in user with email and password
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    // Handle specific auth errors with user-friendly messages
    switch (error.code) {
      case 'auth/user-not-found':
        throw new Error('No account found with this email address.');
      case 'auth/wrong-password':
        throw new Error('Incorrect password. Please try again.');
      case 'auth/invalid-email':
        throw new Error('Invalid email address format.');
      case 'auth/user-disabled':
        throw new Error('This account has been disabled. Please contact support.');
      case 'auth/too-many-requests':
        throw new Error('Too many failed login attempts. Please try again later.');
      default:
        throw new Error('Login failed. Please check your credentials and try again.');
    }
  }
};

/**
 * Sign out current user
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error('Failed to logout. Please try again.');
  }
};

/**
 * Get user profile from Firestore based on Firebase Auth user
 * FIXED: Better debugging and coach recognition
 */
export const getUserProfile = async (firebaseUser) => {
  try {
    console.log('🔍 Looking up user profile for:', firebaseUser.email, 'UID:', firebaseUser.uid);
    
    // Check if user is a coach/admin/scheduler FIRST
    console.log('🎯 Checking coaches collection...');
    const coachQuery = query(
      collection(db, 'coaches'), 
      where('uid', '==', firebaseUser.uid)
    );
    const coachSnapshot = await getDocs(coachQuery);
    
    if (!coachSnapshot.empty) {
      const coachData = coachSnapshot.docs[0].data();
      console.log('✅ Found coach profile:', {
        id: coachSnapshot.docs[0].id,
        name: coachData.name,
        email: coachData.email,
        role: coachData.role,
        coachType: coachData.coachType,
        uid: coachData.uid
      });
      
      return { 
        id: coachSnapshot.docs[0].id, 
        ...coachData,
        userType: 'staff'
      };
    }
    
    console.log('⚠️ Not found in coaches collection, checking clients...');
    
    // Check if user is a client
    const clientQuery = query(
      collection(db, 'clients'), 
      where('uid', '==', firebaseUser.uid)
    );
    const clientSnapshot = await getDocs(clientQuery);
    
    if (!clientSnapshot.empty) {
      const clientData = clientSnapshot.docs[0].data();
      console.log('✅ Found client profile:', {
        id: clientSnapshot.docs[0].id,
        name: clientData.name,
        email: clientData.email,
        program: clientData.program,
        uid: clientData.uid
      });
      
      return { 
        id: clientSnapshot.docs[0].id, 
        ...clientData,
        role: 'client',
        userType: 'client'
      };
    }
    
    // If not found in either collection, this is a problem
    console.error('❌ User not found in either coaches or clients collection!');
    console.error('Firebase User:', {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      emailVerified: firebaseUser.emailVerified
    });
    
    // Let's also check if there are ANY coaches in the database
    const allCoachesSnapshot = await getDocs(collection(db, 'coaches'));
    console.log('📊 Total coaches in database:', allCoachesSnapshot.size);
    
    // And check if there's a coach with this email (maybe UID mismatch?)
    const coachEmailQuery = query(
      collection(db, 'coaches'),
      where('email', '==', firebaseUser.email)
    );
    const coachEmailSnapshot = await getDocs(coachEmailQuery);
    
    if (!coachEmailSnapshot.empty) {
      const coachByEmail = coachEmailSnapshot.docs[0].data();
      console.error('🚨 FOUND COACH BY EMAIL BUT NOT UID!');
      console.error('Firebase Auth UID:', firebaseUser.uid);
      console.error('Coach document UID:', coachByEmail.uid);
      console.error('Email match:', coachByEmail.email);
      
      // This suggests the UID in Firestore doesn't match Firebase Auth
      // We should update the coach record with the correct UID
      console.log('🔧 Attempting to fix UID mismatch...');
      
      try {
        const coachRef = coachEmailSnapshot.docs[0].ref;
        await updateDoc(coachRef, {
          uid: firebaseUser.uid,
          updatedAt: serverTimestamp()
        });
        
        console.log('✅ Fixed UID mismatch, returning coach profile');
        return {
          id: coachEmailSnapshot.docs[0].id,
          ...coachByEmail,
          uid: firebaseUser.uid, // Use the correct UID
          userType: 'staff'
        };
      } catch (updateError) {
        console.error('❌ Failed to fix UID mismatch:', updateError);
      }
    }
    
    // Default profile if not found (shouldn't happen in production)
    console.warn('⚠️ Returning default client profile - this should not happen!');
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.email?.split('@')[0] || 'User',
      role: 'client',
      userType: 'client',
      warning: 'Profile not found in database'
    };
    
  } catch (error) {
    console.error('💥 Error fetching user profile:', error);
    
    // Return basic profile on error to prevent app crash
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.email?.split('@')[0] || 'User',
      role: 'client',
      userType: 'client',
      error: 'Failed to load complete profile'
    };
  }
};

/**
 * Change user password
 */
export const changeUserPassword = async (user, currentPassword, newPassword) => {
  try {
    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    
    if (newPassword.length > 128) {
      throw new Error('New password must be less than 128 characters long.');
    }
    
    if (currentPassword === newPassword) {
      throw new Error('New password must be different from current password.');
    }
    
    // Re-authenticate user before changing password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await updatePassword(user, newPassword);
    
    return { success: true, message: 'Password changed successfully!' };
  } catch (error) {
    // Handle specific password change errors
    switch (error.code) {
      case 'auth/wrong-password':
        throw new Error('Current password is incorrect.');
      case 'auth/weak-password':
        throw new Error('New password is too weak. Please choose a stronger password.');
      case 'auth/requires-recent-login':
        throw new Error('Please log out and log back in before changing your password.');
      case 'auth/too-many-requests':
        throw new Error('Too many password change attempts. Please try again later.');
      default:
        throw new Error(error.message || 'Failed to change password. Please try again.');
    }
  }
};

/**
 * Set up auth state listener
 */
export const subscribeToAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!auth.currentUser;
};

/**
 * Get user ID token (for API calls that require authentication)
 */
export const getUserIdToken = async (forceRefresh = false) => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  try {
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    throw new Error('Failed to get authentication token');
  }
};

/**
 * Validate if email is already in use (useful for pre-validation)
 */
export const isEmailInUse = async (email) => {
  try {
    // Check in coaches collection
    const coachQuery = query(
      collection(db, 'coaches'),
      where('email', '==', email)
    );
    const coachSnapshot = await getDocs(coachQuery);
    
    if (!coachSnapshot.empty) {
      return true;
    }
    
    // Check in clients collection
    const clientQuery = query(
      collection(db, 'clients'),
      where('email', '==', email)
    );
    const clientSnapshot = await getDocs(clientQuery);
    
    return !clientSnapshot.empty;
  } catch (error) {
    console.error('Error checking email:', error);
    return false; // Return false on error to allow form submission
  }
};