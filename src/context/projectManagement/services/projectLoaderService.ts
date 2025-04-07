
import { ref, onValue, get, query, orderByChild, equalTo } from "firebase/database";
import { database, auth } from "@/lib/firebase";
import { Project } from "../types";
import { toast } from "sonner";

/**
 * Sets up a Firebase listener to load projects based on the current user's access rights
 * Only loads projects owned by the current user or shared with them
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
  
  const userId = auth.currentUser.uid;
  console.log(`Loading projects for user: ${userId}`);
  
  // Create a map to store all projects (both owned and shared)
  const allProjects = new Map<string, Project>();
  let ownProjectsLoaded = false;
  let sharedProjectsLoaded = false;
  
  try {
    // 1. Set up listener for user's own projects
    console.log("Setting up Firebase listener for own projects");
    const ownProjectsRef = ref(database, 'projects');
    const ownProjectsQuery = query(ownProjectsRef, orderByChild('ownerId'), equalTo(userId));
    
    const unsubscribeOwnProjects = onValue(ownProjectsQuery, (ownProjectsSnapshot) => {
      console.log("Own projects snapshot received");
      
      if (ownProjectsSnapshot.exists()) {
        console.log("Own projects snapshot exists");
        const projectsData = ownProjectsSnapshot.val();
        console.log(`Found ${Object.keys(projectsData).length} own projects`);
        
        // Process own projects and add to the map
        Object.keys(projectsData).forEach((key) => {
          const project = projectsData[key];
          console.log(`Processing own project ${key}: title=${project.title}, ownerId=${project.ownerId}, userId=${userId}, match=${project.ownerId === userId}`);
          
          allProjects.set(key, {
            ...project,
            id: key,
            createdAt: new Date(project.createdAt),
            lastAccessed: project.lastAccessed ? new Date(project.lastAccessed) : undefined,
          });
        });
      } else {
        console.log("No own projects found for user");
      }
      
      ownProjectsLoaded = true;
      updateProjectsList(allProjects, ownProjectsLoaded, sharedProjectsLoaded);
    }, (error) => {
      console.error("Error loading own projects:", error);
      ownProjectsLoaded = true;
      updateProjectsList(allProjects, ownProjectsLoaded, sharedProjectsLoaded);
    });
    
    // 2. Set up listener for shared projects using projectMembers collection
    console.log("Setting up Firebase listener for project memberships");
    const membersRef = ref(database, 'projectMembers');
    const userMembershipsQuery = query(
      membersRef, 
      orderByChild('userId'), 
      equalTo(userId)
    );
    
    const unsubscribeSharedProjects = onValue(userMembershipsQuery, async (membershipsSnapshot) => {
      console.log("Project memberships snapshot received");
      
      if (membershipsSnapshot.exists()) {
        console.log("Membership snapshot exists");
        const memberships = membershipsSnapshot.val();
        const sharedProjectIds = Object.values(memberships)
          .map((member: any) => member.projectId)
          .filter(Boolean);
        
        console.log(`Found ${sharedProjectIds.length} shared project memberships`);
        
        // Fetch each shared project's details
        for (const projectId of sharedProjectIds) {
          try {
            const projectRef = ref(database, `projects/${projectId}`);
            const projectSnapshot = await get(projectRef);
            
            if (projectSnapshot.exists()) {
              const projectData = projectSnapshot.val();
              console.log(`Processing shared project ${projectId}: title=${projectData.title}`);
              
              // Only add if not already in the map (to avoid duplicates with own projects)
              if (!allProjects.has(projectId)) {
                allProjects.set(projectId, {
                  ...projectData,
                  id: projectId,
                  createdAt: new Date(projectData.createdAt),
                  lastAccessed: projectData.lastAccessed ? new Date(projectData.lastAccessed) : undefined,
                });
              }
            } else {
              console.log(`Shared project ${projectId} does not exist`);
            }
          } catch (error) {
            console.error(`Error fetching shared project ${projectId}:`, error);
          }
        }
      } else {
        console.log("No shared project memberships found for user");
      }
      
      sharedProjectsLoaded = true;
      updateProjectsList(allProjects, ownProjectsLoaded, sharedProjectsLoaded);
    }, (error) => {
      console.error("Error loading shared projects:", error);
      sharedProjectsLoaded = true;
      updateProjectsList(allProjects, ownProjectsLoaded, sharedProjectsLoaded);
    });
    
    // Helper function to update projects state when both own and shared projects are loaded
    function updateProjectsList(
      projectsMap: Map<string, Project>, 
      ownLoaded: boolean, 
      sharedLoaded: boolean
    ) {
      if (ownLoaded && sharedLoaded) {
        const projectsList = Array.from(projectsMap.values());
        console.log(`Setting ${projectsList.length} total projects (own + shared) in state`);
        
        // Debug output to see what's being set
        if (projectsList.length > 0) {
          console.log("Projects being set:", projectsList.map(p => ({
            id: p.id,
            title: p.title,
            ownerId: p.ownerId,
            isOwned: p.ownerId === userId
          })));
        } else {
          console.log("No projects to set in state");
        }
        
        // Prioritize displaying projects where user is owner
        projectsList.sort((a, b) => {
          const aIsOwned = a.ownerId === userId;
          const bIsOwned = b.ownerId === userId;
          
          if (aIsOwned && !bIsOwned) return -1;
          if (!aIsOwned && bIsOwned) return 1;
          
          return 0;
        });
        
        setProjects(projectsList);
        console.log("===== PROJECT LOADER END =====");
      }
    }
    
    console.log("Firebase projects listeners successfully set up");
    
    // Return cleanup function that unsubscribes from both listeners
    return () => {
      console.log("Cleaning up projects listeners");
      unsubscribeOwnProjects();
      unsubscribeSharedProjects();
    };
  } catch (error) {
    console.error("Failed to set up projects listeners:", error);
    setProjects([]);
    console.log("===== PROJECT LOADER SETUP ERROR END =====");
    return () => {};
  }
};
