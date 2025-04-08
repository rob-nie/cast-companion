
import { ref, push, update, remove, onValue, query, orderByChild, limitToLast, equalTo } from "firebase/database";
import { database, QUERY_LIMIT } from "@/lib/firebase";
import { Message, QuickPhrase } from "@/types/messenger";
import { toast } from "sonner";

export const getMessagesRef = (projectId: string) => {
  return query(
    ref(database, 'messages'),
    orderByChild('projectId'),
    equalTo(projectId),
    limitToLast(QUERY_LIMIT)
  );
};

export const getQuickPhrasesRef = (userId: string) => {
  return query(
    ref(database, 'quickPhrases'),
    orderByChild('userId'),
    equalTo(userId),
    limitToLast(QUERY_LIMIT)
  );
};

export const addMessageToFirebase = (message: Omit<Message, "id" | "timestamp" | "isRead">, currentUserId: string) => {
  try {
    const newMessage = {
      ...message,
      timestamp: new Date().toISOString(),
      isRead: message.sender === currentUserId, // Messages from current user are automatically read
    };
    
    return push(ref(database, 'messages'), newMessage)
      .catch((error) => {
        console.error("Error adding message:", error);
        toast.error("Nachricht konnte nicht gesendet werden");
        throw error;
      });
  } catch (error) {
    console.error("Error in addMessage:", error);
    toast.error("Nachricht konnte nicht gesendet werden");
    throw error;
  }
};

export const markMessageAsReadInFirebase = (id: string) => {
  try {
    const messageRef = ref(database, `messages/${id}`);
    return update(messageRef, { isRead: true })
      .catch((error) => {
        console.error("Error marking message as read:", error);
        throw error;
      });
  } catch (error) {
    console.error("Error in markAsRead:", error);
    throw error;
  }
};

export const toggleMessageImportanceInFirebase = (id: string, currentImportance: boolean) => {
  try {
    const messageRef = ref(database, `messages/${id}`);
    return update(messageRef, { isImportant: !currentImportance })
      .catch((error) => {
        console.error("Error toggling message importance:", error);
        toast.error("Wichtiger Status konnte nicht geändert werden");
        throw error;
      });
  } catch (error) {
    console.error("Error in toggleImportant:", error);
    toast.error("Wichtiger Status konnte nicht geändert werden");
    throw error;
  }
};

export const addQuickPhraseToFirebase = (content: string, userId: string) => {
  try {
    const newQuickPhrase = {
      userId,
      content,
    };
    
    return push(ref(database, 'quickPhrases'), newQuickPhrase)
      .catch((error) => {
        console.error("Error adding quick phrase:", error);
        toast.error("Quick Phrase konnte nicht hinzugefügt werden");
        throw error;
      });
  } catch (error) {
    console.error("Error in addQuickPhrase:", error);
    toast.error("Quick Phrase konnte nicht hinzugefügt werden");
    throw error;
  }
};

export const updateQuickPhraseInFirebase = (id: string, content: string) => {
  try {
    const phraseRef = ref(database, `quickPhrases/${id}`);
    return update(phraseRef, { content })
      .catch((error) => {
        console.error("Error updating quick phrase:", error);
        toast.error("Quick Phrase konnte nicht aktualisiert werden");
        throw error;
      });
  } catch (error) {
    console.error("Error in updateQuickPhrase:", error);
    toast.error("Quick Phrase konnte nicht aktualisiert werden");
    throw error;
  }
};

export const deleteQuickPhraseFromFirebase = (id: string) => {
  try {
    const phraseRef = ref(database, `quickPhrases/${id}`);
    return remove(phraseRef)
      .catch((error) => {
        console.error("Error deleting quick phrase:", error);
        toast.error("Quick Phrase konnte nicht gelöscht werden");
        throw error;
      });
  } catch (error) {
    console.error("Error in deleteQuickPhrase:", error);
    toast.error("Quick Phrase konnte nicht gelöscht werden");
    throw error;
  }
};
