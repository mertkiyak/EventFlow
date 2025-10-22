// lib/pushNotifications.ts
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DATABASE_ID, databases, USERS_COLLECTION_ID } from './appwrite';

// Notification handler ayarları
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Push token al ve kaydet
export async function registerForPushNotificationsAsync(userId: string) {
  if (!Device.isDevice) {
    console.log('Push notifications sadece fiziksel cihazlarda çalışır');
    return null;
  }

  try {
    // Mevcut izinleri kontrol et
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // İzin yoksa iste
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification izni alınamadı');
      return null;
    }

    // Expo push token al
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'YOUR_EXPO_PROJECT_ID', // app.json'daki projectId
    });
    const token = tokenData.data;
    
    console.log('Push token alındı:', token);

    // Token'ı Appwrite'a kaydet
    await savePushToken(userId, token);

    // Android için notification channel oluştur
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Mesajlar',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#818CF8',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('events', {
        name: 'Etkinlikler',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#818CF8',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('matches', {
        name: 'Eşleşmeler',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#818CF8',
        sound: 'default',
      });
    }

    return token;
  } catch (error) {
    console.error('Push notification kayıt hatası:', error);
    return null;
  }
}

// Push token'ı Appwrite'a kaydet
async function savePushToken(userId: string, token: string) {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId,
      { pushToken: token }
    );
    console.log('Push token veritabanına kaydedildi');
  } catch (error) {
    console.error('Push token kaydetme hatası:', error);
    throw error;
  }
}

// Notification handler'ları kur
export function setupNotificationHandlers(router: any) {
  // Uygulama açıkken gelen bildirimler
  const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('📩 Bildirim alındı:', notification.request.content.title);
  });

  // Bildirime tıklandığında
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    console.log('👆 Bildirime tıklandı:', data);

    if (data.type === 'message' && data.userId) {
      // Mesaj ekranına yönlendir
      router.push({
        pathname: '/(tabs)/message',
        params: {
          selectedUserId: data.userId,
          selectedUserName: data.userName || 'Kullanıcı',
          selectedUserAvatar: data.userAvatar || '',
        }
      });
    } else if (data.type === 'event' && data.eventId) {
      // Ana sayfaya yönlendir (etkinlik modalı açılacak)
      router.push({
        pathname: '/(tabs)',
        params: {
          openEventId: data.eventId,
        }
      });
    } else if (data.type === 'match' && data.userId) {
      // Profil ekranına yönlendir
      router.push({
        pathname: '/(tabs)/profile',
        params: {
          userId: data.userId,
        }
      });
    }
  });

  // Cleanup fonksiyonu döndür
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

// Local notification gönder (test için)
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: any
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null, // Hemen gönder
  });
}