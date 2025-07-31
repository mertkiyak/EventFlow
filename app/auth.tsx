
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



// import { useRouter } from "expo-router"; // Gezinme için useRouter'ı içe aktarın
// import { useState } from "react";
// import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
// import { Button, Text, TextInput } from "react-native-paper";

// export default function AuthScreen() {
//   const [isSignUp, setIsSignUp] = useState(false);
//   const [email, setEmail] = useState<string>("");
//   const [password, setPassword] = useState<string>("");
//   const [error, setError] = useState<string | null>(null); // Hata durumunu null olarak başlatın
//   const router = useRouter(); // Gezinme için router'ı başlatın

//   const handleAuth = async () => {
//     // Boş alanlar için temel doğrulama
//     if (!email || !password) {
//       setError("Please fill in all fields.");
//       return;
//     }
//     setError(null); // Kimlik doğrulama denemesinden önce önceki hataları temizle

//     // Kimlik doğrulama mantığını simüle edin (gerçek API çağrıları/Firebase kimlik doğrulaması ile değiştirin)
//     try {
//       if (isSignUp) {
//         // Kayıt API çağrısını simüle et
//         console.log("Şununla kaydolmaya çalışılıyor:", email, password);
//         await new Promise(resolve => setTimeout(resolve, 1000)); // Ağ gecikmesini simüle et
//         console.log("Kayıt başarılı!");
//         // Başarılı kayıttan sonra, otomatik olarak giriş yapabilir veya yönlendirebilirsiniz
//       } else {
//         // Giriş API çağrısını simüle et
//         console.log("Şununla giriş yapmaya çalışılıyor:", email, password);
//         await new Promise(resolve => setTimeout(resolve, 1000)); // Ağ gecikmesini simüle et
//         console.log("Giriş başarılı!");
//       }
//       // Kimlik doğrulama (kayıt veya giriş) başarılı olursa,
//       // uygulamanın ana bölümüne (örn. sekmeler düzeni) gidin.
//       // Kullanıcının kimlik doğrulama ekranına geri dönmesini engellemek için `replace` kullanın.
//       router.replace("/(tabs)");
//     } catch (e) {
//       console.error("Kimlik doğrulama hatası:", e);
//       // Kullanıcı dostu bir hata mesajı sağlayın
//       setError("Kimlik doğrulama başarısız oldu. Lütfen bilgilerinizi kontrol edin.");
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === "android" ? "padding" : "height"}
//       style={styles.container}
//     >
//       <View style={styles.content}>
//         <Text style={styles.title} variant="headlineMedium">
//           {isSignUp ? "Create Account" : "Welcome Back"}
//         </Text>

//         <TextInput
//           label="Email"
//           autoCapitalize="none"
//           keyboardType="email-address"
//           placeholder="example@gmail.com"
//           mode="outlined"
//           style={styles.input}
//           onChangeText={setEmail}
//           value={email} // Bunu kontrollü bir bileşen yapın
//         />

//         <TextInput
//           label="Password"
//           autoCapitalize="none"
//           secureTextEntry // Şifre karakterlerini gizler
//           mode="outlined"
//           style={styles.input}
//           onChangeText={setPassword}
//           value={password} // Bunu kontrollü bir bileşen yapın
//         />
//         {/* Hata mesajı varsa göster */}
//         {error && <Text style={styles.errorText}>{error}</Text>}

//         <Button mode="contained" style={styles.button} onPress={handleAuth}>
//           {isSignUp ? "Sign Up" : "Sign In"}
//         </Button>

//         <Button mode="text" style={styles.switchModeButton} onPress={() => setIsSignUp(!isSignUp)}>
//           {isSignUp ? "Alredy have a account? Sign In" : "Don't have an account? Sign up"}
//         </Button>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f5f5f5",
//   },
//   content: {
//     flex: 1,
//     padding: 16,
//     justifyContent: "center",
//   },
//   title: {
//     textAlign: "center",
//     marginBottom: 24,
//   },
//   input: {
//     marginBottom: 16,
//   },
//   button: {
//     marginTop: 8,
//   },
//   switchModeButton: {
//     marginTop: 16,
//   },
//   errorText: {
//     color: "red",
//     marginBottom: 10,
//     textAlign: "center",
//   },
// });





