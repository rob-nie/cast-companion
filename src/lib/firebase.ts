
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

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

export default app;
