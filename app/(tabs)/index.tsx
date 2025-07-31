import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}> 
    
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Link href="/login" style={styles.navButton}>Login</Link>
      <Button>Sign Up</Button>
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
