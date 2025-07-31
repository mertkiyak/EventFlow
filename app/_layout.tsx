import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Stack, useRouter, useSegments } from "expo-router";
import { ReactNode, useEffect } from "react";

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
  return (// RouteGuard bileşeni ile içerik sarılıyor, böylece sadece yetkili kullanıcılar erişebilir
    <AuthProvider>
      <RouteGuard> 
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </RouteGuard>
    </AuthProvider> 

  );
}



// export default function RootLayout() {
//   return (
//     <Stack>
//       <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//       <Stack.Screen name="auth" options={{ headerShown: false }} />
//     </Stack>
//   );
// }

