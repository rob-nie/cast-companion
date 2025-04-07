
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDTT-Z9tnu84ItZh7hoH5l9kmQJBxW5adU",
  authDomain: "castcompanion-d9241.firebaseapp.com",
  projectId: "castcompanion-d9241",
  storageBucket: "castcompanion-d9241.firebasestorage.app",
  messagingSenderId: "50980785391",
  appId: "1:50980785391:web:4ead0dca8e8ab31e239f1a",
  measurementId: "G-865XN716C7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

// Helper function to check if a user is authenticated
export const isUserAuthenticated = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(!!user);
    });
  });
};

// Initialize database rules for new users
export const initializeUserDatabaseAccess = async (userId: string) => {
  try {
    // Check if rules already exist for this user
    const rulesRef = ref(database, `users/${userId}`);
    const rulesSnapshot = await get(rulesRef);
    
    if (!rulesSnapshot.exists()) {
      // Set initial data for the user
      await set(rulesRef, {
        initialized: true,
        timestamp: new Date().toISOString()
      });
      console.log("Database access initialized for user:", userId);
    }
  } catch (error) {
    console.error("Failed to initialize database access:", error);
  }
};

// Helper function to check if user has permission to access a path
export const checkPermission = async (path: string) => {
  try {
    const snapshot = await get(ref(database, path));
    return true;
  } catch (error) {
    console.error("Permission check failed:", error);
    return false;
  }
};

export default app;
