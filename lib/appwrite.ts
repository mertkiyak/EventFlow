import { Account, Client, Databases, ID, Query, Storage } from "react-native-appwrite";



export const client = new Client()
.setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
.setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
.setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM!);

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client);

export const DATABASE_ID = process.env.EXPO_PUBLIC_DB_ID!  // Database ID
export const COLLECTION_ID = process.env.EXPO_PUBLIC_DB_COLLECTION_ID!  // Collection ID;
export const COMPLETIONS_COLLECTION_ID = process.env.EXPO_PUBLIC_DB_COMPLETIONS_COLLECTION_ID! 
export interface RealTimeEventResponse {
  events: string[];
  payload: any;
}

export const BUCKET_ID = "68e3150d000f8d7abf62"; // Appwrite'tan alacaksınız


// lib/appwrite.ts
export const PROJECT_ID = "687fa279001603a29450"; // Appwrite console'dan alın



export const MESSAGES_COLLECTION_ID = '68e85ad500181492effc'; // Mesajlar koleksiyonu ID'si
export const CONVERSATIONS_COLLECTION_ID = '68e85bb7002adccc2ca7'; // Konuşmalar koleksiyonu ID'si
export const USERS_COLLECTION_ID = '68e85c200010d15a4770'; // Kullanıcılar koleksiyonu ID'si

export { ID, Query };

  export type { Models } from 'react-native-appwrite';
