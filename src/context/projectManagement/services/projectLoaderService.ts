
import { ref, onValue, get } from "firebase/database";
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
    const unsubscribeProjects = onValue(projectsRef, (projectsSnapshot) => {
      if (!auth.currentUser) return;
      
      const userId = auth.currentUser.uid;
      console.log("Loading projects for user:", userId);
      
      if (projectsSnapshot.exists()) {
        const projectsData = projectsSnapshot.val();
        let projectsList: Project[] = [];
        
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
        
        // Now also check for shared projects through projectMembers
        onValue(membersRef, (membersSnapshot) => {
          if (membersSnapshot.exists()) {
            const membersData = membersSnapshot.val();
            const sharedProjectIds = new Set<string>();
            
            // Find all projects shared with this user
            Object.keys(membersData).forEach((key) => {
              const member = membersData[key];
              if (member.userId === userId && member.role !== 'owner') {
                sharedProjectIds.add(member.projectId);
                console.log("User has shared access to project:", member.projectId);
              }
            });
            
            // Add shared projects to the list if not already included
            Object.keys(projectsData).forEach((key) => {
              if (sharedProjectIds.has(key) && !projectsList.some(p => p.id === key)) {
                const project = projectsData[key];
                console.log("Adding shared project:", key, project.title);
                projectsList.push({
                  ...project,
                  id: key,
                  createdAt: new Date(project.createdAt),
                  lastAccessed: project.lastAccessed ? new Date(project.lastAccessed) : undefined,
                });
              }
            });
            
            console.log("Total projects loaded:", projectsList.length);
            setProjects(projectsList);
          } else {
            console.log("No project members found, setting only user-owned projects:", projectsList.length);
            setProjects(projectsList);
          }
        }, (error) => {
          console.error("Error loading project members:", error);
          // If we can't load members, just use the owned projects
          setProjects(projectsList);
        });
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
