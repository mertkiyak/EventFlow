// lib/notifications.ts
import { DATABASE_ID, databases } from "@/lib/appwrite";
import { ID } from "react-native-appwrite";

// Doğru collection ID'yi kullan
export const NOTIFICATIONS_COLLECTION_ID = "68eaf59500234a92760c"; 

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
    console.log('Creating notification:', params);
    
    const notification = await databases.createDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        ...params,
        is_read: false,
        // created_at yerine Appwrite'ın otomatik $createdAt kullanılıyor
      }
    );
    
    console.log('Notification created successfully:', notification.$id);
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
  avatarUrl: string = 'https://ui-avatars.com/api/?name=Event&background=random'
) => {
  return createNotification({
    user_id: userId,
    type: 'event',
    title: 'Etkinlik Hatırlatması',
    message: `${eventTitle} etkinliği başlıyor!`,
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
    console.log('Creating bulk notifications for', userIds.length, 'users');
    
    const promises = userIds.map(userId =>
      createNotification({
        ...params,
        user_id: userId,
      })
    );
    
    await Promise.all(promises);
    console.log('Bulk notifications created successfully');
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
  avatarUrl: string = 'https://ui-avatars.com/api/?name=Match&background=random'
) => {
  return createNotification({
    user_id: userId,
    type: 'match',
    title: 'Yeni Eşleşme! 🎉',
    message: `${matchedUserName} ile eşleştiniz!`,
    related_id: matchedUserId,
    avatar_url: avatarUrl,
  });
};

// Mesaj bildirimi oluştur
export const createMessageNotification = async (
  userId: string,
  senderName: string,
  conversationId: string,
  avatarUrl: string = 'https://ui-avatars.com/api/?name=User&background=random'
) => {
  return createNotification({
    user_id: userId,
    type: 'message',
    title: senderName,
    message: 'Yeni mesajın var! 💬',
    related_id: conversationId,
    avatar_url: avatarUrl,
  });
};