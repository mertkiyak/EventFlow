import { COLLECTION_ID, DATABASE_ID, databases } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ID } from "react-native-appwrite";
import { Button, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";

const FREQUENCY = ["daily", "weekly", "monthly"];
type Frequency = typeof FREQUENCY[number];
export default function AddEventScreen() {
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [frequency, setFrequency] = useState<Frequency>("daily");
    const[error, setError] = useState<string>("");
    const{user} = useAuth()
    const router = useRouter();
    const theme = useTheme();
    
    const handleSubmit = async () => {
        if (!user) return;
        try{
        await databases.createDocument(DATABASE_ID, COLLECTION_ID,
            ID.unique(), 
            {
            title,
            description,
            frequency,
            streak_count: 0,
            last_completed: new Date().toISOString(),
            created_at: new Date().toISOString(),
            user_id: user.$id,
            }
        );
        router.back();
    }   catch(error){  
        if(error instanceof Error){
            setError(error.message)
            return;
            
        }
        
    
        setError("There was an error creating the event.");    
    }
    };

   
    return (
        <View style={styles.container}>
            <TextInput label="Event Name"  mode="outlined" onChangeText={setTitle} style={styles.input} />
            <TextInput label="Description"  mode="outlined" onChangeText={setDescription} style={styles.input} />
            <View style={styles.frequencyContainer}>
                <SegmentedButtons 
                value={frequency}
                onValueChange={(value)=> {setFrequency(value as Frequency)}} 
                buttons={[
                    {value:"Daily", label:"Daily"},
                    {value:"Weekly", label:"Weekly"},
                    {value:"Monthly", label:"Monthly"},
                    ]} 
                    style={styles.segmentedButtons}
                />
            </View>  
            <View>
                <Button mode="contained" 
                onPress={handleSubmit} disabled={!title || !description} 
                style={styles.button}
                >
                Create Event
                </Button>
                {error &&(<Text style={{color: theme.colors.error}}>{error}</Text>)}
            </View>
        </View>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',

    },
    input: {
        marginBottom: 16,
    },
    frequencyContainer: {
        marginBottom: 16,
    },
    segmentedButtons: {
        marginVertical: 8,
    },
    button: {
        marginTop: 16,
        backgroundColor: 'blue',
        color: 'white',
    }        
  
  });
 