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

export interface EventCompletion extends Models.Document {  
  event_id: string;
  user_id: string;
  completed_at: string;
}