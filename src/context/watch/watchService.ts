
import { ref, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { ProjectStopwatch } from "./types";

export const updateStopwatchInFirebase = async (projectId: string, stopwatch: ProjectStopwatch): Promise<void> => {
  console.log("Updating stopwatch in Firebase for project:", projectId, stopwatch);
  try {
    const stopwatchRef = ref(database, `projectStopwatches/${projectId}`);
    await set(stopwatchRef, stopwatch);
    console.log("Stopwatch updated successfully in Firebase");
  } catch (error) {
    console.error("Error updating stopwatch in Firebase:", error);
  }
};
