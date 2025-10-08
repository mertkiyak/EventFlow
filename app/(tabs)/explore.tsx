import { StyleSheet, Text, View } from "react-native";

export default function ExploreScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Explore</Text>
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111714', // Arka plan siyah
  },
  text: {
    color: '#ffffff', // Metin beyaz
    fontSize: 18,
  },
});