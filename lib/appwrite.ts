import { Account, Client, Databases, ID, Query, Storage } from "react-native-appwrite";

// ========================================
// APPWRITE CLIENT CONFIGURATION
// ========================================
export const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
  .setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM!);

// ========================================
// APPWRITE SERVICES
// ========================================
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// ========================================
// DATABASE & PROJECT IDS
// ========================================
export const DATABASE_ID = process.env.EXPO_PUBLIC_DB_ID!;
export const PROJECT_ID = "687fa279001603a29450";

// ========================================
// COLLECTION IDS
// ========================================
// Event Collections
export const COLLECTION_ID = process.env.EXPO_PUBLIC_DB_COLLECTION_ID!;
export const COMPLETIONS_COLLECTION_ID = process.env.EXPO_PUBLIC_DB_COMPLETIONS_COLLECTION_ID!;

// Messaging Collections
export const MESSAGES_COLLECTION_ID = '68e85ad500181492effc';
export const CONVERSATIONS_COLLECTION_ID = '68e85bb7002adccc2ca7';
export const USERS_COLLECTION_ID = '68e85c200010d15a4770';

// Notifications Collection
export const NOTIFICATIONS_COLLECTION_ID = "68eaf59500234a92760c";

// ========================================
// STORAGE BUCKET IDS
// ========================================
export const BUCKET_ID = "68e3150d000f8d7abf62";
export const MESSAGE_ATTACHMENTS_BUCKET = "message_attachments"; // Dosya ekleri için (opsiyonel)

// ========================================
// TYPESCRIPT INTERFACES
// ========================================
export interface RealTimeEventResponse {
  events: string[];
  payload: any;
}

// ========================================
// EXPORTS
// ========================================
export type { Models } from 'react-native-appwrite';
export { ID, Query };


export const PARTICIPANTS_COLLECTION_ID = '68fcff760027118990fd'; 