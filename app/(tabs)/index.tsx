import { useAuth } from "@/lib/auth-context"; // Add this import statement
import { Link } from "expo-router";
import { StyleSheet, Text, View, } from "react-native";
import { Button } from "react-native-paper";

export default function Index() {
  const{signOut} = useAuth();
  return (
    <View style={styles.container}> 
    
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Link href="/login" style={styles.navButton}>Login</Link>
      <Button mode="text"onPress={signOut}icon={"logout"}>{" "}Sign Out{" "}</Button>
      
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  navButton: {
    width: "50%",
    backgroundColor: "blue",
    color: "white",
    padding: 10,
    textAlign: "center",
    borderRadius: 20,
  },
});
