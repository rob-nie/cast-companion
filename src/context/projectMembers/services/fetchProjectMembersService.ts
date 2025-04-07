
import { 
  ref, 
  query,
  orderByChild,
  equalTo,
  onValue,
  get 
} from "firebase/database";
import { database } from "@/lib/firebase";
import { ProjectMember } from "@/types/user";

export const fetchProjectMembers = async (projectId: string, 
  setMembers: (projectId: string, members: ProjectMember[]) => void) => {
  try {
    console.log(`Fetching members for project: ${projectId}`);
    const membersRef = ref(database, 'projectMembers');
    const membersQuery = query(membersRef, orderByChild('projectId'), equalTo(projectId));
    
    // Use onValue to get real-time updates for project members
    const unsubscribe = onValue(membersQuery, async (snapshot) => {
      console.log(`Members snapshot received for project: ${projectId}, exists: ${snapshot.exists()}`);
      
      if (!snapshot.exists()) {
        setMembers(projectId, []);
        return;
      }
      
      const members: ProjectMember[] = [];
      const membersData = snapshot.val();
      
      for (const key in membersData) {
        const member = membersData[key];
        
        // Log the member data for debugging
        console.log(`Processing member: ${JSON.stringify(member)}`);
        
        // Get user details
        try {
          const userRef = ref(database, `users/${member.userId}`);
          const userSnapshot = await get(userRef);
          
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            members.push({
              userId: member.userId,
              projectId: member.projectId,
              role: member.role,
              name: userData.name || "Unknown User",
              email: userData.email || "",
              avatar: userData.avatar
            });
          } else {
            console.log(`User data not found for user ${member.userId}, adding with limited info`);
            // Add the member even without full user data
            members.push({
              userId: member.userId,
              projectId: member.projectId,
              role: member.role,
              name: "Unknown User",
              email: "",
            });
          }
        } catch (error) {
          console.error(`Error fetching user data for ${member.userId}:`, error);
        }
      }
      
      console.log(`Setting ${members.length} members for project ${projectId}`);
      setMembers(projectId, members);
    }, (error) => {
      console.error(`Error getting project members for ${projectId}:`, error);
      setMembers(projectId, []);
    });
    
    // Return the unsubscribe function in case it's needed
    return unsubscribe;
  } catch (error) {
    console.error(`Error setting up members listener for project ${projectId}:`, error);
    setMembers(projectId, []);
    return () => {};
  }
};
