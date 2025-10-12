import {
  client,
  COLLECTION_ID,
  DATABASE_ID,
  databases,
  RealTimeEventResponse,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useState } from "react";
import { FlatList, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Badge, Button, IconButton, Modal, Portal, Text } from "react-native-paper";
import { Events } from "../../types/database.type";

// Bildirim Tipi
interface Notification {
  $id: string;
  user_id: string;
  type: 'match' | 'event' | 'message';
  title: string;
  message: string;
  related_id?: string;
  avatar_url: string;
  is_read: boolean;
  $createdAt: string;
}

// Notifications koleksiyon ID'nizi buraya ekleyin
const NOTIFICATIONS_COLLECTION_ID = "YOUR_NOTIFICATIONS_COLLECTION_ID";

export default function Index() {
  const { signOut, user } = useAuth();
  const [myEvents, setMyEvents] = useState<Events[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<Events[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Events[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Events | null>(null);
  
  // Bildirimler State'leri
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      // Events real-time subscription
      const eventsChannel = `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`;
      const eventSubscription = client.subscribe(
        eventsChannel,
        (response: RealTimeEventResponse) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            ) ||
            response.events.includes(
              "databases.*.collections.*.documents.*.update"
            ) ||
            response.events.includes(
              "databases.*.collections.*.documents.*.delete"
            )
          ) {
            fetchAllEvents();
          }
        }
      );

      // Notifications real-time subscription
      const notificationsChannel = `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents`;
      const notificationSubscription = client.subscribe(
        notificationsChannel,
        (response: RealTimeEventResponse) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            ) ||
            response.events.includes(
              "databases.*.collections.*.documents.*.update"
            )
          ) {
            fetchNotifications();
          }
        }
      );

      fetchAllEvents();
      fetchNotifications();
      
      return () => {
        eventSubscription();
        notificationSubscription();
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        [
          Query.equal("user_id", user.$id),
          Query.orderDesc("$createdAt"),
          Query.limit(50)
        ]
      );
      
      const notifs = response.documents as unknown as Notification[];
      setNotifications(notifs);
      
      // Okunmamış bildirim sayısını hesapla
      const unread = notifs.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        notificationId,
        { is_read: true }
      );
      
      // Local state'i güncelle
      setNotifications(prev => 
        prev.map(n => 
          n.$id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      await Promise.all(
        unreadNotifications.map(n =>
          databases.updateDocument(
            DATABASE_ID,
            NOTIFICATIONS_COLLECTION_ID,
            n.$id,
            { is_read: true }
          )
        )
      );
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Bildirimi okundu olarak işaretle
    if (!notification.is_read) {
      await markAsRead(notification.$id);
    }

    // Bildirim tipine göre işlem yap
    switch (notification.type) {
      case 'event':
        // Etkinlik detayını aç
        if (notification.related_id) {
          try {
            const event = await databases.getDocument(
              DATABASE_ID,
              COLLECTION_ID,
              notification.related_id
            );
            setSelectedEvent(event as Events);
            setIsNotificationsVisible(false);
            setIsModalVisible(true);
          } catch (error) {
            console.error("Error fetching event:", error);
          }
        }
        break;
      case 'message':
        // Mesaj ekranına yönlendir
        console.log("Navigate to messages:", notification.related_id);
        break;
      case 'match':
        // Eşleşme detayına git
        console.log("Navigate to match:", notification.related_id);
        break;
    }
  };

  const formatNotificationTime = (dateString: string): string => {
    const now = new Date();
    const notifDate = new Date(dateString);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins}d önce`;
    if (diffHours < 24) return `${diffHours}s önce`;
    if (diffDays < 7) return `${diffDays}g önce`;
    
    return notifDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const fetchAllEvents = async () => {
    if (!user) return;
    
    try {
      const myEventsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("user_id", user.$id), Query.orderDesc("created_at")]
      );
      setMyEvents(myEventsResponse.documents as Events[]);

      const now = new Date().toISOString();
      const upcomingResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal("user_id", user.$id),
          Query.greaterThanEqual("event_date", now),
          Query.orderAsc("event_date"),
          Query.limit(10)
        ]
      );
      setUpcomingEvents(upcomingResponse.documents as Events[]);

      const recommendedResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.notEqual("user_id", user.$id),
          Query.orderDesc("created_at"),
          Query.limit(10)
        ]
      );
      setRecommendedEvents(recommendedResponse.documents as Events[]);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleJoinEvent = (eventId: string) => {
    console.log("Joining event:", eventId);
    handleCloseModal();
  };
  
  const handleCardPress = (event: Events, isMyEvent: boolean = false) => {
    setSelectedEvent(event);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedEvent(null);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    return `${dayName}, ${day} ${month}`;
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const EventCard = ({ event, showJoinButton = true, isMyEvent = false, onCardPress }: { event: Events; showJoinButton?: boolean; isMyEvent?: boolean; onCardPress: (event: Events) => void }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => onCardPress(event)}>
      <Image
        source={{ 
          uri: event.image_url || 'https://via.placeholder.com/400x200?text=Etkinlik+Görseli'
        }}
        style={styles.eventImage}
      />
      
      <View style={styles.cardContent}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar" size={16} color="#9CA3AF" />
          <Text style={styles.infoText}>{formatDate(event.event_date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#9CA3AF" />
          <Text style={styles.infoText}>{formatTime(event.event_date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#9CA3AF" />
          <Text style={styles.infoText} numberOfLines={1}>
            {event.location || "Konum belirtilmemiş"}
          </Text>
        </View>
        {showJoinButton && (
          <Button
            mode="contained"
            onPress={() => handleJoinEvent(event.$id)}
            style={styles.joinButton}
            buttonColor="#3B82F6"
            textColor="#fff"
          >
            Katıl
          </Button>
        )}
      </View>
    </TouchableOpacity>
  );

  const NotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, !item.is_read && styles.notificationItemNew]}
      activeOpacity={0.7}
      onPress={() => handleNotificationPress(item)}
    >
      {!item.is_read && <View style={styles.newIndicator} />}
      <Image source={{ uri: item.avatar_url }} style={styles.notificationAvatar} />
      <View style={styles.notificationContent}>
        <Text style={styles.notificationName}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </View>
      <Text style={styles.notificationTime}>{formatNotificationTime(item.$createdAt)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Ana Sayfa
        </Text>
        <View style={styles.headerActions}>
          <View>
            <IconButton 
              icon="bell-outline" 
              size={24} 
              iconColor="#FFFFFF"
              onPress={() => setIsNotificationsVisible(true)} 
            />
            {unreadCount > 0 && (
              <Badge style={styles.badge} size={20}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Benim Eklediğim Etkinlikler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benim Eklediğim Etkinlikler</Text>
          {myEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Henüz etkinlik eklemediniz</Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {myEvents.map((event) => (
                <View key={event.$id} style={styles.horizontalCard}>
                  <EventCard event={event} showJoinButton={false} isMyEvent={true} onCardPress={(e) => handleCardPress(e, true)} />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* İlgi Alanlarıma Göre Etkinlikler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İlgi Alanlarıma Göre Etkinlikler</Text>
          {recommendedEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="star-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Öneri bulunamadı</Text>
            </View>
          ) : (
            recommendedEvents.map((event) => (
              <EventCard key={event.$id} event={event} onCardPress={handleCardPress} />
            ))
          )}
        </View>

        {/* Yaklaşan Etkinlikler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yaklaşan Etkinlikler</Text>
          {upcomingEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-clock" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Yaklaşan etkinlik yok</Text>
            </View>
          ) : (
            upcomingEvents.map((event) => (
              <EventCard key={event.$id} event={event} showJoinButton={false} onCardPress={handleCardPress} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Etkinlik Detay Modal */}
      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={handleCloseModal}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedEvent && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Image 
                source={{ uri: selectedEvent.image_url || 'https://via.placeholder.com/400x200?text=Etkinlik+Görseli' }} 
                style={styles.modalImage} 
              />
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
                
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="calendar" size={18} color="#9CA3AF" />
                  <Text style={styles.modalInfoText}>{formatDate(selectedEvent.event_date)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color="#9CA3AF" />
                  <Text style={styles.modalInfoText}>{formatTime(selectedEvent.event_date)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="map-marker" size={18} color="#9CA3AF" />
                  <Text style={styles.modalInfoText}>{selectedEvent.location}</Text>
                </View>

                <Text style={styles.modalDescriptionTitle}>Açıklama</Text>
                <Text style={styles.modalDescription}>{selectedEvent.description || "Açıklama bulunmuyor."}</Text>
                
                {selectedEvent.user_id !== user?.$id && (
                  <Button
                    mode="contained"
                    onPress={() => handleJoinEvent(selectedEvent.$id)}
                    style={styles.joinButton}
                    buttonColor="#3B82F6"
                  >
                    Etkinliğe Katıl
                  </Button>
                )}
                
                <Button
                  mode="text"
                  onPress={handleCloseModal}
                  style={styles.modalCloseButton}
                  textColor="#9CA3AF"
                >
                  Kapat
                </Button>
              </View>
            </ScrollView>
          )}
        </Modal>

        {/* Bildirimler Modal */}
        <Modal
          visible={isNotificationsVisible}
          onDismiss={() => setIsNotificationsVisible(false)}
          contentContainerStyle={styles.notificationsModal}
        >
          <View style={styles.notificationsHeader}>
            <IconButton 
              icon="arrow-left" 
              size={24} 
              iconColor="#FFFFFF"
              onPress={() => setIsNotificationsVisible(false)}
            />
            <Text style={styles.notificationsTitle}>Bildirimler</Text>
            {unreadCount > 0 && (
              <Button 
                mode="text" 
                textColor="#3B82F6"
                onPress={markAllAsRead}
                compact
              >
                Okundu
              </Button>
            )}
            {unreadCount === 0 && <View style={styles.headerLeft} />}
          </View>
          
          {notifications.length === 0 ? (
            <View style={styles.emptyNotifications}>
              <MaterialCommunityIcons name="bell-off-outline" size={64} color="#6B7280" />
              <Text style={styles.emptyNotificationsText}>Henüz bildirim yok</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.$id}
              renderItem={({ item }) => <NotificationItem item={item} />}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    width: 48,
  },
  headerTitle: {
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    fontSize: 20,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    width: 48,
    justifyContent: "flex-end",
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingRight: 16,
  },
  horizontalCard: {
    width: 280,
    marginRight: 12,
  },
  card: {
    backgroundColor: "#1F1F1F",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  eventImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#2A2A2A",
  },
  cardContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginLeft: 8,
  },
  joinButton: {
    marginTop: 12,
    borderRadius: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  
  // Etkinlik Modal Stilleri
  modalContainer: {
    backgroundColor: '#1F1F1F',
    marginHorizontal: 20,
    marginVertical: 40,
    borderRadius: 16,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalInfoText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 10,
  },
  modalDescriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalCloseButton: {
    marginTop: 8,
  },

  // Bildirimler Modal Stilleri
  notificationsModal: {
    backgroundColor: '#101722',
    margin: 0,
    height: '100%',
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  notificationItemNew: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  newIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#3B82F6',
  },
  notificationAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  notificationTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 8,
  },
  emptyNotifications: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyNotificationsText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});