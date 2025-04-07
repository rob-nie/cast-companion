
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDwKTQn0lISyFuOerfOkU26PQ1ZFXIXsPA",
  authDomain: "castcompanion-ec3ee.firebaseapp.com",
  databaseURL: "https://castcompanion-ec3ee-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "castcompanion-ec3ee",
  storageBucket: "castcompanion-ec3ee.firebasestorage.app",
  messagingSenderId: "1089617600286",
  appId: "1:1089617600286:web:91392968a83cad6e02330f",
  measurementId: "G-2CJYFF3YX5"
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
    const rulesRef = ref(database, `rules/${userId}`);
    const rulesSnapshot = await get(rulesRef);
    
    if (!rulesSnapshot.exists()) {
      // Set initial rules for the user
      await set(rulesRef, {
        initialized: true,
        timestamp: new Date().toISOString()
      });
      console.log("Database access initialized for user:", userId);
    }
  } catch (error) {
    console.error("Failed to initialize database access:", error);
    // Continue anyway, rules might already be set at the Firebase console level
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
