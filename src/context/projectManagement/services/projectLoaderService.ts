
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
    const unsubPromise = authStatePromise.then((userId) => {
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
        // We need to wait for the promise to resolve to get the actual unsubscribe function
        unsubPromise.then(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        }).catch(err => {
            console.error("Error in cleanup function:", err);
        });
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

        // Create direct query for own projects - this will be updated in real-time
        const ownProjectsQuery = query(
            ref(database, 'projects'), 
            orderByChild('ownerId'), 
            equalTo(userId)
        );

        // Set up listener for own projects
        console.log("Setting up Firebase listener for own projects");
        const unsubscribe = onValue(ownProjectsQuery, async (ownProjectsSnapshot) => {
            console.log("Projects snapshot received");
            const ownProjects: Project[] = [];

            // Extract own projects
            if (ownProjectsSnapshot.exists()) {
                console.log("Own projects snapshot exists");
                const projectsData = ownProjectsSnapshot.val();
                for (const key in projectsData) {
                    if (projectsData.hasOwnProperty(key)) {
                        const projectData = projectsData[key];
                        ownProjects.push({
                            ...projectData,
                            id: key,
                            createdAt: new Date(projectData.createdAt),
                            lastAccessed: projectData.lastAccessed ? new Date(projectData.lastAccessed) : undefined,
                        });
                    }
                }
                console.log(`Found ${ownProjects.length} own projects`);
            } else {
                console.log("No own projects found");
            }

            // Also get projects shared with this user
            const sharedProjects = await fetchSharedProjects(userId);
            console.log(`Found ${sharedProjects.length} shared projects`);

            // Combine own and shared projects
            const allProjects = [...ownProjects, ...sharedProjects];
            console.log(`Setting total of ${allProjects.length} projects (${ownProjects.length} own + ${sharedProjects.length} shared)`);
            
            setProjects(allProjects);
        }, (error) => {
            console.error("Error loading projects:", error);
            toast.error("Fehler beim Laden der Projekte");
            setProjects([]); // Clear projects on error to prevent stale data
        });

        return unsubscribe;

    } catch (error) {
        console.error("Failed to set up projects listener:", error);
        toast.error("Fehler beim Einrichten des Projekt-Listeners");
        setProjects([]);
        return () => { };
    }
};

/**
 * Fetches projects shared with the user
 */
const fetchSharedProjects = async (userId: string): Promise<Project[]> => {
    try {
        const membersRef = ref(database, 'projectMembers');
        const userMembershipsQuery = query(
            membersRef,
            orderByChild('userId'),
            equalTo(userId)
        );
        
        const membershipsSnapshot = await get(userMembershipsQuery);
        const sharedProjects: Project[] = [];
        
        if (membershipsSnapshot.exists()) {
            const memberships = membershipsSnapshot.val();
            const projectIds = new Set<string>();
            
            // Extract unique project IDs
            for (const key in memberships) {
                if (memberships.hasOwnProperty(key)) {
                    const membership = memberships[key];
                    if (membership.projectId) {
                        projectIds.add(membership.projectId);
                    }
                }
            }
            
            // Fetch each project
            for (const projectId of projectIds) {
                const projectRef = ref(database, `projects/${projectId}`);
                const projectSnapshot = await get(projectRef);
                
                if (projectSnapshot.exists()) {
                    const projectData = projectSnapshot.val();
                    sharedProjects.push({
                        ...projectData,
                        id: projectId,
                        createdAt: new Date(projectData.createdAt),
                        lastAccessed: projectData.lastAccessed ? new Date(projectData.lastAccessed) : undefined,
                    });
                }
            }
        }
        
        return sharedProjects;
    } catch (error) {
        console.error("Error fetching shared projects:", error);
        return [];
    }
};
