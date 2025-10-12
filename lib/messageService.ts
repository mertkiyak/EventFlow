import type { Models } from 'react-native-appwrite';
import { client, CONVERSATIONS_COLLECTION_ID, DATABASE_ID, databases, ID, MESSAGES_COLLECTION_ID, Query } from './appwrite';

export interface Message {
  $id: string;
  senderId: string;
  receiverId: string;
  text: string;
  conversationId: string;
  $createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  $id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  $updatedAt: string;
}

class MessageService {
  createConversationId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }

  async getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation> {
    const conversationId = this.createConversationId(userId1, userId2);
    
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CONVERSATIONS_COLLECTION_ID,
        [Query.equal('$id', conversationId)]
      );

      if (response.documents.length > 0) {
        return response.documents[0] as any;
      }

      const newConversation = await databases.createDocument(
        DATABASE_ID,
        CONVERSATIONS_COLLECTION_ID,
        conversationId,
        {
          participants: [userId1, userId2],
        }
      );

      return newConversation as any;
    } catch (error: any) {
      console.error('Error in getOrCreateConversation:', error);
      throw new Error(`Konuşma oluşturulamadı: ${error.message || 'Bilinmeyen hata'}`);
    }
  }

  async sendMessage(
    senderId: string,
    receiverId: string,
    text: string
  ): Promise<Message> {
    try {
      console.log('Sending message:', { senderId, receiverId, text });
      
      const conversationId = this.createConversationId(senderId, receiverId);
      console.log('Conversation ID:', conversationId);

      await this.getOrCreateConversation(senderId, receiverId);
      console.log('Conversation ready');

      const messageData = {
        senderId,
        receiverId,
        text,
        conversationId,
        isRead: false,
      };
      
      console.log('Creating message document:', messageData);
      
      const message = await databases.createDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        ID.unique(),
        messageData
      );

      console.log('Message created:', message.$id);

      await databases.updateDocument(
        DATABASE_ID,
        CONVERSATIONS_COLLECTION_ID,
        conversationId,
        {
          lastMessage: text,
          lastMessageTime: new Date().toISOString(),
        }
      );

      console.log('Conversation updated');

      return message as any;
    } catch (error: any) {
      console.error('Error sending message:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
      });
      
      if (error.code === 404) {
        throw new Error('Veritabanı veya koleksiyon bulunamadı');
      } else if (error.code === 401) {
        throw new Error('Yetkilendirme hatası. Lütfen giriş yapın');
      } else if (error.code === 400) {
        throw new Error('Geçersiz veri. Lütfen tekrar deneyin');
      } else {
        throw new Error(`Mesaj gönderilemedi: ${error.message || 'Bilinmeyen hata'}`);
      }
    }
  }

  async getMessages(userId1: string, userId2: string, limit: number = 50): Promise<Message[]> {
    try {
      const conversationId = this.createConversationId(userId1, userId2);
      console.log('Fetching messages for conversation:', conversationId);

      const response = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('conversationId', conversationId),
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
        ]
      );

      console.log('Messages fetched:', response.documents.length);
      return response.documents.reverse() as any;
    } catch (error: any) {
      console.error('Error getting messages:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
      });
      return [];
    }
  }

  // YENİ: Gönderen ID'ye göre mesajları getir
  async getMessagesBySender(senderId: string): Promise<Message[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('senderId', senderId),
          Query.orderDesc('$createdAt'),
          Query.limit(500),
        ]
      );

      return response.documents as any;
    } catch (error: any) {
      console.error('Error getting messages by sender:', error);
      return [];
    }
  }

  // YENİ: Alıcı ID'ye göre mesajları getir
  async getMessagesByReceiver(receiverId: string): Promise<Message[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('receiverId', receiverId),
          Query.orderDesc('$createdAt'),
          Query.limit(500),
        ]
      );

      return response.documents as any;
    } catch (error: any) {
      console.error('Error getting messages by receiver:', error);
      return [];
    }
  }

  async markMessagesAsRead(userId: string, otherUserId: string): Promise<void> {
    try {
      const conversationId = this.createConversationId(userId, otherUserId);

      const response = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('conversationId', conversationId),
          Query.equal('receiverId', userId),
          Query.equal('isRead', false),
        ]
      );

      for (const message of response.documents) {
        await databases.updateDocument(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          message.$id,
          { isRead: true }
        );
      }
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
    }
  }

  subscribeToMessages(
    conversationId: string,
    callback: (message: Message) => void
  ) {
    const channel = `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`;
    
    console.log('Subscribing to channel:', channel);
    
    return client.subscribe(channel, (response: any) => {
      if (
        response.events.includes(`databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents.*.create`)
      ) {
        const payload = response.payload as Models.Document;
        
        if (payload.conversationId === conversationId) {
          console.log('New message received:', payload.$id);
          callback(payload as any);
        }
      }
    });
  }

  // YENİ: Okunmamış mesaj sayısını getir
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('receiverId', userId),
          Query.equal('isRead', false),
        ]
      );

      return response.total;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // YENİ: Mesaj sil
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        messageId
      );
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // YENİ: Konuşmayı sil
  async deleteConversation(userId1: string, userId2: string): Promise<void> {
    try {
      const messages = await this.getMessages(userId1, userId2);
      
      const deletePromises = messages.map((message) =>
        this.deleteMessage(message.$id)
      );

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
}

export default new MessageService();