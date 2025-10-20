import { DATABASE_ID, databases } from "@/lib/appwrite";
import { ID } from "react-native-appwrite";

const NOTIFICATIONS_COLLECTION_ID = "68eaf59500234a92760c"; 

interface CreateNotificationParams {
  user_id: string;
  type: 'match' | 'event' | 'message';
  title: string;
  message: string;
  related_id?: string;
  avatar_url: string;  
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const notification = await databases.createDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        ...params,
        is_read: false,
        created_at: new Date().toISOString(),
      }
    );
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Etkinlik bildirimi oluştur
export const createEventNotification = async (
  userId: string,
  eventTitle: string,
  eventId: string,
  avatarUrl: string
) => {
  return createNotification({
    user_id: userId,
    type: 'event',
    title: eventTitle,
    message: 'Etkinlik başladı!',
    related_id: eventId,
    avatar_url: avatarUrl,
  });
};

// Toplu bildirim oluştur
export const createBulkNotifications = async (
  userIds: string[],
  params: Omit<CreateNotificationParams, 'user_id'>
) => {
  try {
    const promises = userIds.map(userId =>
      createNotification({
        ...params,
        user_id: userId,
      })
    );
    await Promise.all(promises);
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    throw error;
  }
};

// Eşleşme bildirimi oluştur
export const createMatchNotification = async (
  userId: string,
  matchedUserName: string,
  matchedUserId: string,
  avatarUrl: string
) => {
  return createNotification({
    user_id: userId,
    type: 'match',
    title: matchedUserName,
    message: 'Yeni bir eşleşmen var!',
    related_id: matchedUserId,
    avatar_url: avatarUrl,
  });
};

// Mesaj bildirimi oluştur
export const createMessageNotification = async (
  userId: string,
  senderName: string,
  messageId: string,
  avatarUrl: string
) => {
  return createNotification({
    user_id: userId,
    type: 'message',
    title: senderName,
    message: 'Yeni mesajın var!',
    related_id: messageId, // Mesaj ID'si
    avatar_url: avatarUrl,
  });
}