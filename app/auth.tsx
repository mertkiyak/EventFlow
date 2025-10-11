
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";

export default function AuthScreen() {
 
  const [isSignUp, setIsSignUp] = useState(false);        // Kullanıcının giriş mi yoksa kayıt olma modunda mı olduğunu tutar
  const[email, setEmail] = useState<string>("");          // E-posta bilgisini tutar
  const[password, setPassword] = useState<string>("");    // Şifre bilgisini tutar
  const[error, setError] = useState<string | null>("");   // Hata mesajını tutar, başlangıçta boş bir string
 
  const theme = useTheme()
  const router = useRouter()

  const{signIn, signUp}= useAuth()
 
// Giriş/Kayıt işlemini kontrol eden fonksiyon
  const handleAuth =async() => {
    if(!email|| !password){
        setError("Please fill in all fields.")
        return;
    }

 // Şifre uzunluğu 6 karakterden azsa, hata mesajı göster
    if(password.length < 6){
      setError("Password must be at leat 6 characters long.");
      return;
    }
   // Hata yoksa error state'i sıfırlanır
    setError(null);

    if (isSignUp){
      const error = await signUp(email, password) 
      if(error){
        setError(error)
        return
      }
      
    }
    else{
      const error = await signIn(email, password)
      if(error){
        setError(error)
        return
      }
    }
    router.replace("/")

  };


// Ekrana geri dönen JSX yapısı
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "android" ? "padding" : "height"}
      style={ styles.container}
      
    >
      <View style={styles.content}> 
        <Text style={styles.title} variant="headlineMedium">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </Text>

        <TextInput 
          label="Email" 
          autoCapitalize="none" 
          keyboardType="email-address"
          placeholder="example@gmail.com"
          mode="outlined"
         
          style={styles.input}
          onChangeText={setEmail}
        />

        <TextInput 
          label="Password" 
          autoCapitalize="none" 
          secureTextEntry
          mode="outlined"
          style={styles.input}
          onChangeText={setPassword}
        />
        {error &&(<Text style={{color: theme.colors.error}}>{error}</Text>)}

        <Button mode="contained" style={styles.button} onPress={handleAuth}>
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>

        <Button mode="text" style={styles.switchModeButton} onPress={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

// Uygulama içinde kullanılan stil tanımlamaları
const styles = StyleSheet.create ({
  container:{
    flex:1,
    backgroundColor:"#f5f5f5",
  },
  content:{
    flex:1,
    padding:16,
    justifyContent: "center",
  },
  title:{
    textAlign: "center",
    marginBottom: 24,
  },
  input:{
    marginBottom: 16,
  },
  button:{
    marginTop: 8,
  },
  switchModeButton:{
    marginTop: 16,
  },
})

