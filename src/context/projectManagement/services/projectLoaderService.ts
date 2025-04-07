
import { ref, onValue, get, query, orderByChild, equalTo } from "firebase/database";
import { database, auth } from "@/lib/firebase";
import { Project } from "../types";
import { toast } from "sonner";

/**
 * Sets up a Firebase listener to load projects based on the current user's access rights
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
    const membersRef = ref(database, 'projectMembers');
    
    console.log("Setting up Firebase listener for projects path:", projectsRef.toString());
    
    // Set up listener for projects
    const unsubscribeProjects = onValue(projectsRef, async (projectsSnapshot) => {
      if (!auth.currentUser) {
        console.log("Auth state changed during project loading - user no longer authenticated");
        setProjects([]);
        return;
      }
      
      const userId = auth.currentUser.uid;
      console.log(`Loading projects for user: ${userId} (${auth.currentUser.email})`);
      
      if (projectsSnapshot.exists()) {
        console.log("Projects snapshot exists");
        const projectsData = projectsSnapshot.val();
        console.log("Raw projects data:", JSON.stringify(projectsData));
        
        let projectsList: Project[] = [];
        
        // Check if projectsData is an object or array
        if (typeof projectsData === 'object' && projectsData !== null) {
          console.log("Projects data is valid object, processing...");
          console.log("Total projects in database:", Object.keys(projectsData).length);
          
          // First add all projects owned by current user
          Object.keys(projectsData).forEach((key) => {
            const project = projectsData[key];
            console.log(`Checking project ${key}: ownerId=${project.ownerId}, title=${project.title}`);
            
            if (project.ownerId === userId) {
              console.log(`✓ Found user-owned project: ${key} - ${project.title}`);
              projectsList.push({
                ...project,
                id: key,
                createdAt: new Date(project.createdAt),
                lastAccessed: project.lastAccessed ? new Date(project.lastAccessed) : undefined,
              });
            } else {
              console.log(`✗ Project ${key} not owned by current user`);
            }
          });
          
          console.log(`Found ${projectsList.length} owned projects for user ${userId}`);
          
          // Now check for shared projects through projectMembers
          try {
            // Query projectMembers where userId matches the current user
            console.log("Checking for shared projects in projectMembers collection...");
            const userMembersQuery = query(membersRef, orderByChild('userId'), equalTo(userId));
            const membersSnapshot = await get(userMembersQuery);
            
            if (membersSnapshot.exists()) {
              console.log("User has shared projects, processing member entries...");
              console.log("Raw members data:", JSON.stringify(membersSnapshot.val()));
              
              // Process each membership entry
              membersSnapshot.forEach((childSnapshot) => {
                const member = childSnapshot.val();
                const projectId = member.projectId;
                console.log(`Found membership for project ${projectId}, role: ${member.role}`);
                
                // Only add if it's not already in the list (not owned by the user)
                if (!projectsList.some(p => p.id === projectId) && projectsData[projectId]) {
                  console.log(`✓ Adding shared project: ${projectId} - ${projectsData[projectId].title}`);
                  
                  projectsList.push({
                    ...projectsData[projectId],
                    id: projectId,
                    createdAt: new Date(projectsData[projectId].createdAt),
                    lastAccessed: projectsData[projectId].lastAccessed 
                      ? new Date(projectsData[projectId].lastAccessed) 
                      : undefined,
                  });
                } else if (!projectsData[projectId]) {
                  console.log(`✗ Shared project ${projectId} does not exist in database`);
                } else {
                  console.log(`✗ Shared project ${projectId} already in list (duplicate)`);
                }
              });
            } else {
              console.log("No shared projects found for user in projectMembers collection");
            }
          } catch (error) {
            console.error("Error loading project members:", error);
            console.log("Failed to load shared projects due to error");
          }
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
