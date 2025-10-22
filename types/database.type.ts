import { Models } from "react-native-appwrite";


export interface Events  extends Models.Document {
  user_id: string;
  title: string;
  description: string;
  streak_count: number;
  frequency: string;
  last_completed: string;
  created_at: string;
image_url: string;
}

export interface Message {
  $id: string;
  senderId: string;
  receiverId: string;
  text: string;
  conversationId: string;
  $createdAt: string;
  isRead: boolean;
  status?: 'sent' | 'delivered' | 'read';
  replyToMessageId?: string;
  attachments?: string[];
}

export interface Conversation {
  $id: string;
  type?: 'dm' | 'group';
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageSenderId?: string;
  $createdAt: string;
  $updatedAt: string;
}



export interface UserProfile {
  $id: string;
  username: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  interests: string[];
  avatar_url: string;
  followers: number;
  following: number;
  $createdAt: string;
  $updatedAt: string;
  email: string;
  
}
