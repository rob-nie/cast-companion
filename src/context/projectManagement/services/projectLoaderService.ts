
import { ref, onValue, get, query, orderByChild, equalTo } from "firebase/database";
import { database, auth } from "@/lib/firebase";
import { Project } from "../types";
import { toast } from "sonner";
import { onAuthStateChanged } from "firebase/auth";

/**
 * Sets up a Firebase listener to load projects based on the current user's access rights
 * Only loads projects owned by the current user or shared with them
 * Enhanced with auth state synchronization
 */
export const loadProjects = (
    setProjects: (projects: Project[]) => void
) => {
    console.log("===== PROJECT LOADER START =====");
    console.log("loadProjects called with auth state:",
        auth.currentUser ? `User: ${auth.currentUser.email} (${auth.currentUser.uid})` : "No authenticated user");
    
    // Create a promise to track when auth state is fully initialized
    let authStatePromise: Promise<string | null> = new Promise((resolve) => {
        // Use onAuthStateChanged to ensure we have the final auth state
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("Auth state changed in project loader:", user ? `User: ${user.email}` : "No user");
            unsubscribe(); // We only need this once
            resolve(user ? user.uid : null);
        });
    });
    
    // Initially set to empty to prevent showing stale data
    setProjects([]);
    
    // Setup listener only after auth state is confirmed
    authStatePromise.then((userId) => {
        if (!userId) {
            console.log("No authenticated user after auth state check, not loading projects");
            setProjects([]);
            console.log("Projects state set to empty array due to no authentication");
            console.log("===== PROJECT LOADER END =====");
            return () => { };
        }
        
        console.log("Auth state confirmed, user ID:", userId);
        return setupProjectsListener(userId, setProjects);
    }).catch(error => {
        console.error("Error in auth state handling:", error);
        setProjects([]);
        return () => { };
    });
    
    // Return cleanup function
    return () => {
        console.log("Project loader cleanup called");
        // Actual listener cleanup will be handled by the promise resolution
    };
};

/**
 * Sets up the actual Firebase listeners for projects after auth state is confirmed
 */
const setupProjectsListener = (
    userId: string,
    setProjects: (projects: Project[]) => void
) => {
    try {
        console.log(`Setting up projects listeners for user: ${userId}`);

        const projectsRef = ref(database, 'projects');
        const membersRef = ref(database, 'projectMembers');

        // Helper function to fetch project details by ID
        const fetchProjectDetails = async (projectId: string): Promise<Project | null> => {
            const projectRef = ref(database, `projects/${projectId}`);
            const snapshot = await get(projectRef);
            if (snapshot.exists()) {
                const projectData = snapshot.val();
                return {
                    ...projectData,
                    id: projectId,
                    createdAt: new Date(projectData.createdAt),
                    lastAccessed: projectData.lastAccessed ? new Date(projectData.lastAccessed) : undefined,
                };
            }
            return null;
        };

        // Set up listener for project memberships
        const userMembershipsQuery = query(
            membersRef,
            orderByChild('userId'),
            equalTo(userId)
        );

        console.log("Setting up Firebase listener for project memberships");

        const unsubscribe = onValue(userMembershipsQuery, async (membershipsSnapshot) => {
            console.log("Project memberships snapshot received");
            const projectIds: string[] = [];
            const sharedProjects: Project[] = [];

            // 1. Collect shared project IDs from projectMembers
            if (membershipsSnapshot.exists()) {
                const memberships = membershipsSnapshot.val();
                for (const key in memberships) {
                    if (memberships.hasOwnProperty(key)) { // prevent prototype pollution
                        const membership = memberships[key];
                        if (membership.projectId) { // defensive check
                            projectIds.push(membership.projectId);
                        }
                    }
                }
                console.log(`Found ${projectIds.length} shared project memberships`);

                // 2. Fetch details for each shared project
                for (const projectId of projectIds) {
                    const project = await fetchProjectDetails(projectId);
                    if (project) {
                        sharedProjects.push(project);
                    }
                }
                console.log(`Fetched ${sharedProjects.length} shared projects`);
            } else {
                console.log("No shared project memberships found for user");
            }

            // 3. Fetch own projects.
            const ownProjectsQuery = query(projectsRef, orderByChild('ownerId'), equalTo(userId));
            const ownProjectsSnapshot = await get(ownProjectsQuery); // Use get() to get them only once.
            const ownProjects: Project[] = [];

            if (ownProjectsSnapshot.exists()) {
                const ownProjectsData = ownProjectsSnapshot.val();
                for (const key in ownProjectsData) {
                    if (ownProjectsData.hasOwnProperty(key)) { // prevent prototype pollution
                         const projectData = ownProjectsData[key];
                        ownProjects.push({
                            ...projectData,
                            id: key,
                            createdAt: new Date(projectData.createdAt),
                            lastAccessed: projectData.lastAccessed ? new Date(projectData.lastAccessed) : undefined,
                        });
                    }
                }
                console.log(`Fetched ${ownProjects.length} own projects`);
            } else {
                console.log("No own projects found");
            }

            // 4. Combine and set.  Use a map to avoid duplicates.
            const allProjectsMap = new Map<string, Project>();
            ownProjects.forEach(project => allProjectsMap.set(project.id, project));
            sharedProjects.forEach(project => allProjectsMap.set(project.id, project));
            const combinedProjects = Array.from(allProjectsMap.values());

            console.log(`Setting ${combinedProjects.length} total projects (own + shared)`);
            setProjects(combinedProjects);
            console.log("===== PROJECT LOADER END =====");

        }, (error) => {
            console.error("Error loading projects:", error);
            toast.error("Fehler beim Laden der Projekte");
            setProjects([]); // Clear projects on error to prevent stale data
            console.log("===== PROJECT LOADER ERROR END =====");
        });

        return () => {
          console.log("Cleaning up projects listener");
          unsubscribe();
        };

    } catch (error) {
        console.error("Failed to set up projects listener:", error);
        toast.error("Fehler beim Einrichten des Projekt-Listeners");
        setProjects([]);
        console.log("===== PROJECT LOADER SETUP ERROR END =====");
        return () => { };
    }
};
