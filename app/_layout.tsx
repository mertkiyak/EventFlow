import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Stack, useRouter, useSegments } from "expo-router";
import { ReactNode, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

// RouteGuard bileşeni: sadece yetkili kullanıcıların belirli sayfaları görmesini sağlar
function RouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const{user, isLoadingUser} = useAuth();
  const segments = useSegments();

  
  useEffect(() => {
    const inAuthGroup = segments[0] ==="auth"
    if (!user  && !inAuthGroup && !isLoadingUser) {  
      router.replace("/auth");
    }else if (user && inAuthGroup && !isLoadingUser){
      router.replace("/");
    }
  },[user, segments]);  // Bağımlılıklar: isAuth ya da router değişirse yeniden çalışır

    // Her durumda children bileşenlerini render eder
  return <>{children}</>;
}
 
// RootLayout bileşeni: tüm uygulama yapısının ana layout'u
export default function RootLayout() {
  return (  // RouteGuard bileşeni ile içerik sarılıyor, böylece sadece yetkili kullanıcılar erişebilir
    <GestureHandlerRootView style={{ flex: 1 }}>      
    <AuthProvider>
      <PaperProvider>
      <SafeAreaProvider>
      <RouteGuard> 
         <Stack>
                {/* AUTH SCREEN - HEADER GİZLİ */}
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                
                {/* TABS SCREEN - HEADER GİZLİ */}
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
      </RouteGuard>
      </SafeAreaProvider>
      </PaperProvider>
    </AuthProvider> 
    </GestureHandlerRootView>

  );
}




