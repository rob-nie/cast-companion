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
        return () => { };
    }

    try {
        const userId = auth.currentUser.uid;
        console.log(`Loading projects for user: ${userId}`);

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
