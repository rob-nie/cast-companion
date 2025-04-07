
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
  console.log("loadProjects called, auth.currentUser:", auth.currentUser?.uid);
  
  // Only load projects if user is authenticated
  if (!auth.currentUser) {
    console.log("No authenticated user, not loading projects");
    setProjects([]);
    return () => {};
  }
  
  try {
    const projectsRef = ref(database, 'projects');
    const membersRef = ref(database, 'projectMembers');
    
    console.log("Setting up Firebase listener for projects");
    
    // Set up listener for projects
    const unsubscribeProjects = onValue(projectsRef, async (projectsSnapshot) => {
      if (!auth.currentUser) return;
      
      const userId = auth.currentUser.uid;
      console.log("Loading projects for user:", userId);
      
      if (projectsSnapshot.exists()) {
        console.log("Projects snapshot exists");
        const projectsData = projectsSnapshot.val();
        let projectsList: Project[] = [];
        
        // Check if projectsData is an object or array
        if (typeof projectsData === 'object' && projectsData !== null) {
          // First add all projects owned by current user
          Object.keys(projectsData).forEach((key) => {
            const project = projectsData[key];
            if (project.ownerId === userId) {
              console.log("Found user-owned project:", key, project.title);
              projectsList.push({
                ...project,
                id: key,
                createdAt: new Date(project.createdAt),
                lastAccessed: project.lastAccessed ? new Date(project.lastAccessed) : undefined,
              });
            }
          });
          
          console.log(`Found ${projectsList.length} owned projects for user ${userId}`);
          
          // Now check for shared projects through projectMembers
          try {
            // Query projectMembers where userId matches the current user
            const userMembersQuery = query(membersRef, orderByChild('userId'), equalTo(userId));
            const membersSnapshot = await get(userMembersQuery);
            
            if (membersSnapshot.exists()) {
              console.log("User has shared projects");
              
              // Process each membership entry
              membersSnapshot.forEach((childSnapshot) => {
                const member = childSnapshot.val();
                const projectId = member.projectId;
                
                // Only add if it's not already in the list (not owned by the user)
                if (!projectsList.some(p => p.id === projectId) && projectsData[projectId]) {
                  console.log("Adding shared project:", projectId, projectsData[projectId].title);
                  
                  projectsList.push({
                    ...projectsData[projectId],
                    id: projectId,
                    createdAt: new Date(projectsData[projectId].createdAt),
                    lastAccessed: projectsData[projectId].lastAccessed 
                      ? new Date(projectsData[projectId].lastAccessed) 
                      : undefined,
                  });
                }
              });
            } else {
              console.log("No shared projects found for user");
            }
          } catch (error) {
            console.error("Error loading project members:", error);
          }
        }
        
        console.log("Total projects loaded:", projectsList.length);
        setProjects(projectsList);
      } else {
        console.log("No projects found in Firebase");
        setProjects([]);
      }
    }, (error) => {
      console.error("Error loading projects from Firebase:", error);
      toast.error("Fehler beim Laden der Projekte");
      setProjects([]);
    });
    
    return unsubscribeProjects;
  } catch (error) {
    console.error("Failed to set up projects listener:", error);
    return () => {};
  }
};
