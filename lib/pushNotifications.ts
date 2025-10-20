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
    shouldShowBanner: true,  // ← EKLE
    shouldShowList: true,    // ← EKLE
  }),
});

// Push token al ve kaydet
export async function registerForPushNotificationsAsync(userId: string) {
  if (!Device.isDevice) {
    console.log('Push notifications sadece fiziksel cihazlarda çalışır');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification izni alınamadı');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);

    // Token'ı Appwrite'a kaydet
    await savePushToken(userId, token);

    // Android için notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Mesajlar',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('Push notification kayıt hatası:', error);
    return null;
  }
}

async function savePushToken(userId: string, token: string) {
  try {
    // users collection'da pushToken alanını güncelle
    await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId,
      { pushToken: token }
    );
    console.log('Push token kaydedildi');
  } catch (error) {
    console.error('Push token kaydetme hatası:', error);
  }
}

// Notification handler'ları kur
export function setupNotificationHandlers(navigation: any) {
  // Uygulama açıkken gelen bildirimler
  Notifications.addNotificationReceivedListener(notification => {
    console.log('Bildirim alındı:', notification);
  });

  // Bildirime tıklandığında
  Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;

    if (data.type === 'message') {
      // Mesaj ekranına yönlendir
      navigation.navigate('messages', {
        selectedUserId: data.senderId,
        conversationId: data.conversationId,
      });
    }
  });
}