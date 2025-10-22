// lib/messageService.ts
import { Conversation, Message, UserProfile } from '@/types/database.type';
import { MD5 } from 'crypto-js';
import type { Models } from 'react-native-appwrite';
import {
  client,
  CONVERSATIONS_COLLECTION_ID,
  DATABASE_ID,
  databases,
  ID,
  MESSAGES_COLLECTION_ID,
  Query,
  USERS_COLLECTION_ID,
} from './appwrite';

export type { Conversation, Message, UserProfile };

class MessageService {
  createConversationId(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort().join('_');
    return MD5(sortedIds).toString();
  }

  async getOrCreateConversation(
    userId1: string,
    userId2: string,
    type: 'dm' | 'group' = 'dm'
  ): Promise<Conversation> {
    const conversationId = this.createConversationId(userId1, userId2);

    try {
      const existing = await databases.getDocument(
        DATABASE_ID,
        CONVERSATIONS_COLLECTION_ID,
        conversationId
      );
      return existing as any;
    } catch (error: any) {
      if (error.code === 404) {
        const conversationData: any = {
          participants: [userId1, userId2],
          lastMessage: '',
          lastMessageTime: new Date().toISOString(),
          type,
          lastMessageSenderId: '',
        };

        try {
          const newConversation = await databases.createDocument(
            DATABASE_ID,
            CONVERSATIONS_COLLECTION_ID,
            conversationId,
            conversationData
          );
          console.log('Conversation created successfully:', conversationId);
          return newConversation as any;
        } catch (createError) {
          console.error('Error creating conversation:', createError);
          throw createError;
        }
      }
      throw error;
    }
  }

  async sendMessage(
    senderId: string,
    receiverId: string,
    text: string,
    attachments?: string[],
    replyToMessageId?: string
  ): Promise<Message> {
    // Validation - daha detaylı kontrol
    if (!senderId || !receiverId) {
      throw new Error('Gönderici veya alıcı ID\'si eksik');
    }

    if (senderId === receiverId) {
      throw new Error('Kendinize mesaj gönderemezsiniz');
    }

    if (!text || !text.trim()) {
      throw new Error('Mesaj boş olamaz');
    }

    console.log('Sending message from:', senderId, 'to:', receiverId);

    const conversationId = this.createConversationId(senderId, receiverId);
    
    // Conversation'ı önce oluştur
    try {
      await this.getOrCreateConversation(senderId, receiverId);
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Konuşma oluşturulamadı');
    }

    const messageData: any = {
      senderId,
      receiverId,
      text: text.trim(),
      conversationId,
      isRead: false,
      status: 'sent',
    };

    if (attachments && attachments.length > 0) {
      messageData.attachments = attachments;
    }
    if (replyToMessageId) {
      messageData.replyToMessageId = replyToMessageId;
    }

    try {
      const message = await databases.createDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        ID.unique(),
        messageData
      );

      console.log('Message sent successfully:', message.$id);

      // Conversation güncelle (async, hata vermesi mesaj gönderimini etkilemez)
      this.updateConversation(conversationId, text, senderId).catch(err => 
        console.warn('Could not update conversation:', err)
      );

      return message as any;
    } catch (error: any) {
      console.error('Send message error:', error);
      throw new Error(`Mesaj gönderilemedi: ${error.message || 'Bilinmeyen hata'}`);
    }
  }

  private async updateConversation(
    conversationId: string,
    lastMessage: string,
    senderId: string
  ): Promise<void> {
    try {
      const updateData: any = {
        lastMessage: lastMessage.substring(0, 100),
        lastMessageTime: new Date().toISOString(),
        lastMessageSenderId: senderId,
      };

      await databases.updateDocument(
        DATABASE_ID,
        CONVERSATIONS_COLLECTION_ID,
        conversationId,
        updateData
      );
    } catch (error) {
      console.warn('Could not update conversation:', error);
    }
  }

  async getMessages(
    userId1: string,
    userId2: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    const conversationId = this.createConversationId(userId1, userId2);

    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('conversationId', conversationId),
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
          Query.offset(offset),
        ]
      );

      return response.documents.reverse() as any;
    } catch (error) {
      console.error('Get messages error:', error);
      return [];
    }
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CONVERSATIONS_COLLECTION_ID,
        [
          Query.search('participants', userId),
          Query.orderDesc('lastMessageTime'),
          Query.limit(100),
        ]
      );

      return response.documents as any;
    } catch (error) {
      console.error('Get conversations error:', error);
      return [];
    }
  }

  async markMessagesAsRead(userId: string, otherUserId: string): Promise<void> {
    const conversationId = this.createConversationId(userId, otherUserId);

    try {
      const unreadMessages = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('conversationId', conversationId),
          Query.equal('receiverId', userId),
          Query.equal('isRead', false),
        ]
      );

      const updatePromises = unreadMessages.documents.map(message =>
        databases.updateDocument(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          message.$id,
          { 
            isRead: true,
            status: 'read',
          }
        )
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Mark as read error:', error);
    }
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
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  async getConversationUnreadCount(
    userId: string,
    otherUserId: string
  ): Promise<number> {
    const conversationId = this.createConversationId(userId, otherUserId);

    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('conversationId', conversationId),
          Query.equal('receiverId', userId),
          Query.equal('isRead', false),
        ]
      );

      return response.total;
    } catch (error) {
      console.error('Get conversation unread count error:', error);
      return 0;
    }
  }

  subscribeToMessages(
    conversationId: string,
    callback: (message: Message) => void
  ) {
    const channel = `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`;

    return client.subscribe(channel, (response: any) => {
      const createEvent = `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents.*.create`;

      if (response.events.includes(createEvent)) {
        const payload = response.payload as Models.Document;

        if (payload.conversationId === conversationId) {
          callback(payload as any);
        }
      }
    });
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const user = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        userId
      );
      return user as any;
    } catch (error: any) {
      console.error('Get user profile error:', error);
      // Profil bulunamazsa null dön, hata fırlatma
      if (error.code === 404) {
        return null;
      }
      return null;
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
      console.error('Delete message error:', error);
      throw error;
    }
  }

  async deleteConversation(userId1: string, userId2: string): Promise<void> {
    const conversationId = this.createConversationId(userId1, userId2);

    try {
      const messages = await this.getMessages(userId1, userId2, 1000);
      const deletePromises = messages.map(msg => this.deleteMessage(msg.$id));
      await Promise.all(deletePromises);

      await databases.deleteDocument(
        DATABASE_ID,
        CONVERSATIONS_COLLECTION_ID,
        conversationId
      );
    } catch (error) {
      console.error('Delete conversation error:', error);
      throw error;
    }
  }
}

export default new MessageService();