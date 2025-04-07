
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
    const membersRef = ref(database, 'projectMembers');
    const membersQuery = query(membersRef, orderByChild('projectId'), equalTo(projectId));
    
    onValue(membersQuery, async (snapshot) => {
      if (!snapshot.exists()) {
        setMembers(projectId, []);
        return;
      }
      
      const members: ProjectMember[] = [];
      const membersData = snapshot.val();
      
      for (const key in membersData) {
        const member = membersData[key];
        
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
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      
      setMembers(projectId, members);
    });
  } catch (error) {
    console.error("Error getting project members:", error);
    setMembers(projectId, []);
  }
};
