
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

// Firebase constants for data limitation
export const QUERY_LIMIT = 20; // Reduced from 50 to 20 to prevent payload size issues
export const RECENT_DATA_DAYS = 14; // Reduced from 30 to 14 days

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

export default app;
