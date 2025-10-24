import { AuthProvider, useAuth } from "@/lib/auth-context";
// Push notification import'larını yoruma alın
// import { 
//   registerForPushNotificationsAsync, 
//   setupNotificationHandlers 
// } from '@/lib/pushNotifications';
import { Stack, useRouter, useSegments } from "expo-router";
import { ReactNode, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

// RouteGuard bileşeni: sadece yetkili kullanıcıların belirli sayfaları görmesini sağlar
function RouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoadingUser } = useAuth();
  const segments = useSegments();

  // Route guard logic
  useEffect(() => {
    const inAuthGroup = segments[0] === "auth";
    if (!user && !inAuthGroup && !isLoadingUser) {
      router.replace("/auth");
    } else if (user && inAuthGroup && !isLoadingUser) {
      router.replace("/");
    }
  }, [user, segments]);

  // Push Notification Setup - YORUMA ALINMIŞ
  // Development build olmadan çalışmaz, Expo Go için devre dışı
  /*
  useEffect(() => {
    if (!user) return;

    let cleanupHandlers: (() => void) | undefined;

    const setupNotifications = async () => {
      try {
        console.log('🔔 Push notifications kuruluyor...');
        
        const token = await registerForPushNotificationsAsync(user.$id);
        
        if (token) {
          console.log('✅ Push notifications başarıyla kuruldu');
        } else {
          console.log('⚠️ Push token alınamadı (emulator veya izin yok)');
        }

        cleanupHandlers = setupNotificationHandlers(router);
        console.log('✅ Notification handlers kuruldu');
      } catch (error) {
        console.error('❌ Notification setup hatası:', error);
      }
    };

    setupNotifications();

    return () => {
      if (cleanupHandlers) {
        console.log('🧹 Notification handlers temizleniyor...');
        cleanupHandlers();
      }
    };
  }, [user, router]);
  */

  return <>{children}</>;
}

// RootLayout bileşeni: tüm uygulama yapısının ana layout'u
export default function RootLayout() {
  return (
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

                {/* EVENT DETAIL SCREEN - HEADER GİZLİ, EDGE TO EDGE */}
                <Stack.Screen 
                  name="event-detail" 
                  options={{ 
                    headerShown: false,
                    presentation: 'card',
                    animation: 'slide_from_right',
                  }} 
                />
              </Stack>
            </RouteGuard>
          </SafeAreaProvider>
        </PaperProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}