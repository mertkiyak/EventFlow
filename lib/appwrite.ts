import { Account, Client, Databases, Storage } from "react-native-appwrite";



export const client = new Client()
.setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
.setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
.setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM!);

export const account = new Account(client)
export const databases = new Databases(client)

export const DATABASE_ID = process.env.EXPO_PUBLIC_DB_ID!  // Database ID
export const COLLECTION_ID = process.env.EXPO_PUBLIC_DB_COLLECTION_ID!  // Collection ID;
export const COMPLETIONS_COLLECTION_ID = process.env.EXPO_PUBLIC_DB_COMPLETIONS_COLLECTION_ID! 
export interface RealTimeEventResponse {
  events: string[];
  payload: any;
}

export const BUCKET_ID = "68e3150d000f8d7abf62"; // Appwrite'tan alacaksınız
export const storage = new Storage(client);

// lib/appwrite.ts
export const PROJECT_ID = "687fa279001603a29450"; // Appwrite console'dan alın