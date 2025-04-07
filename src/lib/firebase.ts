
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDwKTQn0lISyFuOerfOkU26PQ1ZFXIXsPA",
  authDomain: "castcompanion-ec3ee.firebaseapp.com",
  databaseURL: "https://castcompanion-ec3ee-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "castcompanion-ec3ee",
  storageBucket: "castcompanion-ec3ee.firebasestorage.app",
  messagingSenderId: "1089617600286",
  appId: "1:1089617600286:web:19f8115eb802072902330f",
  measurementId: "G-D9P1PVD2V9"
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
