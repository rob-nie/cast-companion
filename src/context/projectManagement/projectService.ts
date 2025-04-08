
import { toast } from "sonner";
import { 
  ref, 
  set, 
  push, 
  remove, 
  update, 
  get, 
  query, 
  limitToLast, 
  orderByChild, 
  equalTo,
  onValue,
  off
} from "firebase/database";
import { database, QUERY_LIMIT, INDEXES } from "@/lib/firebase";
import { Project } from "./types";
import { UserRole } from "@/types/user";

// Optimierte Zugriffsmethoden mit Fehlerbehandlung
const safeDbOperation = async (operation: () => Promise<any>, errorMsg: string) => {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMsg}:`, error);
    toast.error(errorMsg);
    return null;
  }
};

// Projekte abrufen mit Pagination
export const fetchProjects = (userId: string, callback: (projects: Project[]) => void) => {
  if (!userId) return () => {};
  
  // Effizientere Abfrage mit Index für Eigentümer
  const ownedProjectsRef = query(
    ref(database, 'projects'),
    orderByChild('ownerId'),
    equalTo(userId),
    limitToLast(QUERY_LIMIT)
  );

  const processProjects = (snapshot: any) => {
    try {
      if (!snapshot.exists()) return callback([]);
      
      const projectsData = snapshot.val();
      const projects: Project[] = Object.entries(projectsData).map(([id, data]: [string, any]) => ({
        ...data,
        id,
        createdAt: new Date(data.createdAt),
        lastAccessed: data.lastAccessed ? new Date(data.lastAccessed) : undefined,
      }));
      
      projects.sort((a, b) => {
        const dateA = a.lastAccessed || a.createdAt;
        const dateB = b.lastAccessed || b.createdAt;
        return dateB.getTime() - dateA.getTime();
      });
      
      callback(projects);
      console.log(`Geladene Projekte: ${projects.length}`);
    } catch (error) {
      console.error("Fehler beim Verarbeiten der Projektdaten:", error);
      callback([]);
    }
  };

  // Event-Listener registrieren
  onValue(ownedProjectsRef, processProjects, (error) => {
    console.error("Fehler beim Laden der Projekte:", error);
    toast.error("Projekte konnten nicht geladen werden");
    callback([]);
  });
  
  // Event-Listener für Mitgliedschaften in separater Abfrage
  const fetchSharedProjects = async () => {
    try {
      // Zuerst finden wir Projekte, bei denen der Benutzer Mitglied ist
      const memberProjectsRef = query(
        ref(database, 'projectMembers'),
        orderByChild('userId'),
        equalTo(userId),
        limitToLast(QUERY_LIMIT)
      );
      
      const memberSnapshot = await get(memberProjectsRef);
      if (!memberSnapshot.exists()) return [];
      
      const memberData = memberSnapshot.val();
      const projectIds = Object.values(memberData)
        .map((member: any) => member.projectId);
      
      // Dann laden wir die eigentlichen Projektdetails
      const sharedProjects: Project[] = [];
      
      for (const projectId of projectIds) {
        const projectRef = ref(database, `projects/${projectId}`);
        const projectSnapshot = await get(projectRef);
        
        if (projectSnapshot.exists()) {
          const data = projectSnapshot.val();
          sharedProjects.push({
            ...data,
            id: projectId,
            createdAt: new Date(data.createdAt),
            lastAccessed: data.lastAccessed ? new Date(data.lastAccessed) : undefined,
          });
        }
      }
      
      return sharedProjects;
    } catch (error) {
      console.error("Fehler beim Laden geteilter Projekte:", error);
      return [];
    }
  };
  
  // Kombinierte Projekte laden
  const loadAllProjects = async () => {
    try {
      const sharedProjects = await fetchSharedProjects();
      const ownedSnapshot = await get(ownedProjectsRef);
      let allProjects: Project[] = [...sharedProjects];
      
      if (ownedSnapshot.exists()) {
        const ownedData = ownedSnapshot.val();
        const ownedProjects = Object.entries(ownedData).map(([id, data]: [string, any]) => ({
          ...data,
          id,
          createdAt: new Date(data.createdAt),
          lastAccessed: data.lastAccessed ? new Date(data.lastAccessed) : undefined,
        }));
        allProjects = [...allProjects, ...ownedProjects];
      }
      
      allProjects.sort((a, b) => {
        const dateA = a.lastAccessed || a.createdAt;
        const dateB = b.lastAccessed || b.createdAt;
        return dateB.getTime() - dateA.getTime();
      });
      
      callback(allProjects);
    } catch (error) {
      console.error("Fehler beim Kombinieren der Projekte:", error);
    }
  };
  
  loadAllProjects();
  
  // Cleanup-Funktion zurückgeben
  return () => {
    off(ownedProjectsRef);
  };
};

// Projekt hinzufügen mit optimierter Fehlerbehandlung
export const addProjectToFirebase = async (
  project: Omit<Project, "id" | "createdAt" | "ownerId">, 
  userId: string
) => {
  if (!userId) {
    toast.error("Du musst angemeldet sein, um ein Projekt zu erstellen");
    return null;
  }

  return safeDbOperation(async () => {
    const newProjectRef = push(ref(database, 'projects'));
    
    if (!newProjectRef.key) {
      throw new Error("Projekt-ID konnte nicht generiert werden");
    }
    
    const newProject = {
      ...project,
      id: newProjectRef.key,
      createdAt: new Date().toISOString(),
      ownerId: userId,
      members: {
        [userId]: {
          role: "owner"
        }
      }
    };
    
    await set(newProjectRef, newProject);
    
    // Erstelle auch einen Eintrag in projectMembers für verbesserte Indizierung
    const memberRef = push(ref(database, 'projectMembers'));
    await set(memberRef, {
      userId,
      projectId: newProjectRef.key,
      role: "owner"
    });
    
    toast.success("Projekt erstellt");
    return { ...newProject, createdAt: new Date(newProject.createdAt) };
  }, "Fehler beim Erstellen des Projekts");
};

// Projekt aktualisieren mit optimierter Fehlerbehandlung
export const updateProjectInFirebase = async (id: string, projectUpdate: Partial<Project>, silent: boolean = false) => {
  // Prepare data for Firebase
  const updateData: Record<string, any> = { ...projectUpdate };
  
  // Convert Date objects to ISO strings for Firebase
  if (updateData.createdAt instanceof Date) {
    updateData.createdAt = updateData.createdAt.toISOString();
  }
  
  if (updateData.lastAccessed instanceof Date) {
    updateData.lastAccessed = updateData.lastAccessed.toISOString();
  }
  
  return safeDbOperation(async () => {
    const projectRef = ref(database, `projects/${id}`);
    await update(projectRef, updateData);
    
    if (!silent) {
      toast.success("Projekt aktualisiert");
    }
    return true;
  }, "Fehler beim Aktualisieren des Projekts");
};

// Projekt löschen mit optimierter Fehlerbehandlung
export const deleteProjectFromFirebase = async (id: string) => {
  return safeDbOperation(async () => {
    const projectRef = ref(database, `projects/${id}`);
    await remove(projectRef);
    
    // Zugehörige Mitgliedschaften löschen
    const membersRef = query(
      ref(database, 'projectMembers'),
      orderByChild('projectId'),
      equalTo(id)
    );
    
    const memberSnapshot = await get(membersRef);
    if (memberSnapshot.exists()) {
      const membersData = memberSnapshot.val();
      for (const key in membersData) {
        await remove(ref(database, `projectMembers/${key}`));
      }
    }
    
    // Weitere zugehörige Daten löschen
    await cleanupProjectData(id);
    toast.success("Projekt gelöscht");
    return true;
  }, "Fehler beim Löschen des Projekts");
};

// Aufräumen von Projektdaten (mit optimierter Fehlerbehandlung)
export const cleanupProjectData = async (projectId: string) => {
  try {
    // Entfernen der Notizen
    const notesRef = query(
      ref(database, 'notes'),
      orderByChild('projectId'),
      equalTo(projectId),
      limitToLast(20) // Kleinere Batch-Größe für bessere Performance
    );
    
    const noteSnapshot = await get(notesRef);
    if (noteSnapshot.exists()) {
      const notesData = noteSnapshot.val();
      const deletionPromises = Object.keys(notesData).map(key => 
        remove(ref(database, `notes/${key}`))
      );
      await Promise.allSettled(deletionPromises);
    }
    
    // Entfernen der Nachrichten
    const messagesRef = query(
      ref(database, 'messages'),
      orderByChild('projectId'),
      equalTo(projectId),
      limitToLast(20) // Kleinere Batch-Größe für bessere Performance
    );
    
    const messageSnapshot = await get(messagesRef);
    if (messageSnapshot.exists()) {
      const messagesData = messageSnapshot.val();
      const deletionPromises = Object.keys(messagesData).map(key => 
        remove(ref(database, `messages/${key}`))
      );
      await Promise.allSettled(deletionPromises);
    }
    
    // Entfernen von Stoppuhren
    await remove(ref(database, `projectStopwatches/${projectId}`));
  } catch (error) {
    console.error("Fehler beim Aufräumen der Projektdaten:", error);
  }
};

// Projektmitglieder verwalten
export const addMemberToProject = async (projectId: string, email: string, role: UserRole) => {
  return safeDbOperation(async () => {
    // Benutzer durch E-Mail finden
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      toast.error("Keine Benutzer gefunden");
      throw new Error("Keine Benutzer gefunden");
    }
    
    // Suche nach der E-Mail
    let userId = "";
    let userData = null;
    
    snapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val();
      if (user.email === email) {
        userId = childSnapshot.key || "";
        userData = user;
      }
    });
    
    if (!userId) {
      toast.error("Benutzer nicht gefunden");
      throw new Error("Benutzer nicht gefunden");
    }
    
    // Prüfen, ob Projekt existiert
    const projectRef = ref(database, `projects/${projectId}`);
    const projectSnapshot = await get(projectRef);
    
    if (!projectSnapshot.exists()) {
      toast.error("Projekt nicht gefunden");
      throw new Error("Projekt nicht gefunden");
    }
    
    // Prüfen, ob Benutzer bereits Mitglied ist
    const membersRef = query(
      ref(database, 'projectMembers'),
      orderByChild('userId'),
      equalTo(userId)
    );
    
    const memberSnapshot = await get(membersRef);
    let isAlreadyMember = false;
    
    if (memberSnapshot.exists()) {
      const membersData = memberSnapshot.val();
      for (const key in membersData) {
        const memberData = membersData[key];
        if (memberData.projectId === projectId) {
          isAlreadyMember = true;
          break;
        }
      }
    }
    
    if (isAlreadyMember) {
      toast.error("Benutzer ist bereits Mitglied dieses Projekts");
      throw new Error("Benutzer ist bereits Mitglied dieses Projekts");
    }
    
    // Mitglied zum Projekt hinzufügen
    const newMemberRef = push(ref(database, 'projectMembers'));
    await set(newMemberRef, {
      userId,
      projectId,
      role
    });
    
    // Auch im Projekt selbst speichern für schnelle Abfragen
    await update(ref(database, `projects/${projectId}/members/${userId}`), { role });
    
    toast.success(`${userData.name} wurde zum Projekt hinzugefügt`);
  }, "Fehler beim Hinzufügen des Mitglieds");
};

export const addMemberToProjectByUserId = async (projectId: string, userId: string, role: UserRole) => {
  return safeDbOperation(async () => {
    // Überprüfen, ob Benutzer existiert
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      toast.error("Benutzer nicht gefunden");
      throw new Error("Benutzer nicht gefunden");
    }
    
    const userData = userSnapshot.val();
    
    // Überprüfen, ob Projekt existiert
    const projectRef = ref(database, `projects/${projectId}`);
    const projectSnapshot = await get(projectRef);
    
    if (!projectSnapshot.exists()) {
      toast.error("Projekt nicht gefunden");
      throw new Error("Projekt nicht gefunden");
    }
    
    // Überprüfen, ob Benutzer bereits Mitglied ist
    const membersRef = query(
      ref(database, 'projectMembers'),
      orderByChild('userId'),
      equalTo(userId)
    );
    
    const memberSnapshot = await get(membersRef);
    let isAlreadyMember = false;
    
    if (memberSnapshot.exists()) {
      const membersData = memberSnapshot.val();
      for (const key in membersData) {
        const memberData = membersData[key];
        if (memberData.projectId === projectId) {
          isAlreadyMember = true;
          break;
        }
      }
    }
    
    if (isAlreadyMember) {
      toast.error("Benutzer ist bereits Mitglied dieses Projekts");
      throw new Error("Benutzer ist bereits Mitglied dieses Projekts");
    }
    
    // Mitglied zum Projekt hinzufügen
    const newMemberRef = push(ref(database, 'projectMembers'));
    await set(newMemberRef, {
      userId,
      projectId,
      role
    });
    
    // Auch im Projekt selbst speichern für schnelle Abfragen
    await update(ref(database, `projects/${projectId}/members/${userId}`), { role });
    
    toast.success(`${userData.name || "Benutzer"} wurde zum Projekt hinzugefügt`);
  }, "Fehler beim Hinzufügen des Mitglieds");
};

export const removeMemberFromProject = async (projectId: string, userId: string) => {
  return safeDbOperation(async () => {
    // Überprüfen, ob Projekt existiert
    const projectRef = ref(database, `projects/${projectId}`);
    const projectSnapshot = await get(projectRef);
    
    if (!projectSnapshot.exists()) {
      toast.error("Projekt nicht gefunden");
      throw new Error("Projekt nicht gefunden");
    }
    
    const projectData = projectSnapshot.val();
    
    // Überprüfen, ob Benutzer Mitglied ist
    if (!projectData.members || !projectData.members[userId]) {
      toast.error("Benutzer ist kein Mitglied dieses Projekts");
      throw new Error("Benutzer ist kein Mitglied dieses Projekts");
    }
    
    // Überprüfen, ob wir den Eigentümer entfernen
    if (projectData.members[userId].role === "owner") {
      toast.error("Der Projektinhaber kann nicht entfernt werden");
      throw new Error("Der Projektinhaber kann nicht entfernt werden");
    }
    
    // Aus dem Projekt entfernen
    await remove(ref(database, `projects/${projectId}/members/${userId}`));
    
    // Aus der projektMitglieder-Tabelle entfernen
    const membersRef = query(
      ref(database, 'projectMembers'),
      orderByChild('userId'),
      equalTo(userId)
    );
    
    const memberSnapshot = await get(membersRef);
    if (memberSnapshot.exists()) {
      const membersData = memberSnapshot.val();
      for (const key in membersData) {
        const memberData = membersData[key];
        if (memberData.projectId === projectId) {
          await remove(ref(database, `projectMembers/${key}`));
        }
      }
    }
    
    toast.success("Mitglied entfernt");
  }, "Fehler beim Entfernen des Mitglieds");
};

export const updateMemberRole = async (projectId: string, userId: string, role: UserRole) => {
  return safeDbOperation(async () => {
    // Überprüfen, ob Projekt existiert
    const projectRef = ref(database, `projects/${projectId}`);
    const projectSnapshot = await get(projectRef);
    
    if (!projectSnapshot.exists()) {
      toast.error("Projekt nicht gefunden");
      throw new Error("Projekt nicht gefunden");
    }
    
    const projectData = projectSnapshot.val();
    
    // Überprüfen, ob Benutzer Mitglied ist
    if (!projectData.members || !projectData.members[userId]) {
      toast.error("Benutzer ist kein Mitglied dieses Projekts");
      throw new Error("Benutzer ist kein Mitglied dieses Projekts");
    }
    
    // Rolle im Projekt aktualisieren
    await update(ref(database, `projects/${projectId}/members/${userId}`), { role });
    
    // Rolle in der projektMitglieder-Tabelle aktualisieren
    const membersRef = query(
      ref(database, 'projectMembers'),
      orderByChild('userId'),
      equalTo(userId)
    );
    
    const memberSnapshot = await get(membersRef);
    if (memberSnapshot.exists()) {
      const membersData = memberSnapshot.val();
      for (const key in membersData) {
        const memberData = membersData[key];
        if (memberData.projectId === projectId) {
          await update(ref(database, `projectMembers/${key}`), { role });
        }
      }
    }
    
    toast.success("Rolle aktualisiert");
  }, "Fehler beim Aktualisieren der Rolle");
};
