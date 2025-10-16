import { MD5 } from 'crypto-js'; // Bu paketi yüklemeniz gerekebilir: npm install crypto-js @types/crypto-js
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
  // Conversation ID'yi hash ile kısaltıyoruz (32 karakter)
  createConversationId(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort().join('_');
    // MD5 hash 32 karakter üretir, Appwrite limiti 36 karakter
    return MD5(sortedIds).toString();
  }

  async getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation> {
    const conversationId = this.createConversationId(userId1, userId2);
    
    try {
      console.log('Getting conversation:', conversationId);
      
      // Önce conversation var mı kontrol et
      try {
        const existingConversation = await databases.getDocument(
          DATABASE_ID,
          CONVERSATIONS_COLLECTION_ID,
          conversationId
        );
        console.log('Conversation found:', existingConversation.$id);
        return existingConversation as any;
      } catch (error: any) {
        // Conversation yoksa yeni oluştur (404 hatası beklenir)
        if (error.code === 404) {
          console.log('Creating new conversation...');
          const newConversation = await databases.createDocument(
            DATABASE_ID,
            CONVERSATIONS_COLLECTION_ID,
            conversationId,
            {
              participants: [userId1, userId2],
            }
          );
          console.log('New conversation created:', newConversation.$id);
          return newConversation as any;
        }
        throw error;
      }
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
      
      // Kullanıcı ID'lerini validate et
      if (!senderId || !receiverId) {
        throw new Error('Gönderen veya alıcı ID\'si eksik');
      }

      if (senderId === receiverId) {
        throw new Error('Kendinize mesaj gönderemezsiniz');
      }

      const conversationId = this.createConversationId(senderId, receiverId);
      console.log('Conversation ID:', conversationId);

      await this.getOrCreateConversation(senderId, receiverId);
      console.log('Conversation ready');

      const messageData = {
        senderId,
        receiverId,
        text: text.trim(),
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

      // Conversation'ı güncelle
      try {
        await databases.updateDocument(
          DATABASE_ID,
          CONVERSATIONS_COLLECTION_ID,
          conversationId,
          {
            lastMessage: text.substring(0, 100), // İlk 100 karakteri al
            lastMessageTime: new Date().toISOString(),
          }
        );
        console.log('Conversation updated');
      } catch (updateError) {
        console.warn('Could not update conversation lastMessage:', updateError);
        // Mesaj gönderildi, sadece lastMessage güncellenemedi
      }

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








