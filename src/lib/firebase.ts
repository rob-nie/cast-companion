
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDTT-Z9tnu84ItZh7hoH5l9kmQJBxW5adU",
  authDomain: "castcompanion-d9241.firebaseapp.com",
  databaseURL: "https://castcompanion-d9241-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "castcompanion-d9241",
  storageBucket: "castcompanion-d9241.firebasestorage.app",
  messagingSenderId: "50980785391",
  appId: "1:50980785391:web:4ead0dca8e8ab31e239f1a",
  measurementId: "G-865XN716C7"
};

// Firebase constants for data limitation and indexing
export const QUERY_LIMIT = 5; // Reduziert auf 5 für bessere Leistung
export const SHARED_QUERY_LIMIT = 3; // Ebenfalls reduziert
export const RECENT_DATA_DAYS = 7; // Behalte 7 Tage

// Index-Namen für Firebase
export const INDEXES = {
  PROJECT_OWNER: 'project_owner_idx',
  PROJECT_MEMBER: 'project_member_idx',
  PROJECT_LAST_ACCESSED: 'project_last_accessed_idx'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

// Function to get a date object for recent data filtering
export const getRecentDateThreshold = () => {
  const date = new Date();
  date.setDate(date.getDate() - RECENT_DATA_DAYS);
  return date;
};

export default app;
