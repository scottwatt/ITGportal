// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC7Tfqtze215aggwIGsuLcD7--mClDnYiE",
  authDomain: "independence-through-grace.firebaseapp.com",
  projectId: "independence-through-grace",
  storageBucket: "independence-through-grace.firebasestorage.app",
  messagingSenderId: "785674716748",
  appId: "1:785674716748:web:7213e7fe51caea5217d6e9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;