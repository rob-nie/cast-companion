
import { ref, onValue, get, query, orderByChild, equalTo } from "firebase/database";
import { database, auth } from "@/lib/firebase";
import { Project } from "../types";
import { toast } from "sonner";

/**
 * Sets up a Firebase listener to load projects based on the current user's access rights
 * Now loads all projects for all users
 */
export const loadProjects = (
  setProjects: (projects: Project[]) => void
) => {
  console.log("===== PROJECT LOADER START =====");
  console.log("loadProjects called with auth state:", 
    auth.currentUser ? `User: ${auth.currentUser.email} (${auth.currentUser.uid})` : "No authenticated user");
  
  // Only load projects if user is authenticated
  if (!auth.currentUser) {
    console.log("No authenticated user, not loading projects");
    setProjects([]);
    console.log("Projects state set to empty array due to no authentication");
    console.log("===== PROJECT LOADER END =====");
    return () => {};
  }
  
  try {
    const projectsRef = ref(database, 'projects');
    
    console.log("Setting up Firebase listener for projects path:", projectsRef.toString());
    
    // Set up listener for all projects
    const unsubscribeProjects = onValue(projectsRef, async (projectsSnapshot) => {
      if (!auth.currentUser) {
        console.log("Auth state changed during project loading - user no longer authenticated");
        setProjects([]);
        return;
      }
      
      console.log(`Loading all projects for all users`);
      
      if (projectsSnapshot.exists()) {
        console.log("Projects snapshot exists");
        const projectsData = projectsSnapshot.val();
        console.log("Raw projects data:", JSON.stringify(projectsData));
        
        let projectsList: Project[] = [];
        
        // Check if projectsData is an object or array
        if (typeof projectsData === 'object' && projectsData !== null) {
          console.log("Projects data is valid object, processing...");
          console.log("Total projects in database:", Object.keys(projectsData).length);
          
          // Add all projects
          Object.keys(projectsData).forEach((key) => {
            const project = projectsData[key];
            console.log(`Processing project ${key}: ownerId=${project.ownerId}, title=${project.title}`);
            
            projectsList.push({
              ...project,
              id: key,
              createdAt: new Date(project.createdAt),
              lastAccessed: project.lastAccessed ? new Date(project.lastAccessed) : undefined,
            });
          });
          
          console.log(`Loaded ${projectsList.length} total projects`);
        } else {
          console.log("Projects data is not a valid object:", projectsData);
        }
        
        console.log("Final projects list:", projectsList);
        console.log(`Setting ${projectsList.length} projects in state`);
        setProjects(projectsList);
      } else {
        console.log("No projects found in Firebase (snapshot doesn't exist)");
        setProjects([]);
      }
      
      console.log("===== PROJECT LOADER END =====");
    }, (error) => {
      console.error("Error loading projects from Firebase:", error);
      console.log("Error details:", JSON.stringify(error));
      toast.error("Fehler beim Laden der Projekte");
      setProjects([]);
      console.log("===== PROJECT LOADER ERROR END =====");
    });
    
    console.log("Firebase projects listener successfully set up");
    return unsubscribeProjects;
  } catch (error) {
    console.error("Failed to set up projects listener:", error);
    console.log("Error details:", JSON.stringify(error));
    console.log("===== PROJECT LOADER SETUP ERROR END =====");
    return () => {};
  }
};
