import EditEventModal from "@/components/EditEventModal";
import EditProfileModal, { ProfileData } from "@/components/EditProfileModal";
import { COLLECTION_ID, DATABASE_ID, databases, USERS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { theme } from '@/lib/theme';
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { Query } from "react-native-appwrite";
import { IconButton, Text } from "react-native-paper";
import { Events } from "../../types/database.type";

export interface EditEventData {
  title: string;
  location: string;
  description: string;
  image_url: string;
  event_date: Date;
}

interface Participant {
  $id: string;
  user_id: string;
  event_id: string;
  joined_at: string;
  event?: Events;
}

// TODO: Participants collection ID'nizi buraya ekleyin
const PARTICIPANTS_COLLECTION_ID = "YOUR_PARTICIPANTS_COLLECTION_ID";

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [myEvents, setMyEvents] = useState<Events[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<Participant[]>([]);
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] = useState(false);
  const [isEditEventModalVisible, setIsEditEventModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Events | null>(null);
  const [editEventFormData, setEditEventFormData] = useState<EditEventData>({
    title: "",
    location: "",
    description: "",
    image_url: "",
    event_date: new Date(),
  });

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    username: "",
    age: 24,
    location: "İstanbul",
    bio: "Seyahat etmeyi, yeni yerler keşfetmeyi ve farklı kültürlere dalmayı seven biriyim.",
    interests: ["✈️ Seyahat", "🌲 Doğa Yürüyüşü", "📚 Kitap Okuma"],
    avatarUrl: "https://via.placeholder.com/200x200?text=Avatar",
  });

  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    if (user) {
      fetchMyEvents();
      fetchUserProfile();
      fetchJoinedEvents();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        user.$id
      );

      setProfile({
        name: response.name || user.name || "Kullanıcı",
        username: response.username || "",
        age: response.age || 24,
        location: response.location || "İstanbul",
        bio: response.bio || "",
        interests: response.interests || [],
        avatarUrl: response.avatarUrl || "https://via.placeholder.com/200x200?text=Avatar",
      });

      setFollowers(response.followers || 0);
      setFollowing(response.following || 0);
    } catch (error: any) {
      console.error("Error fetching user profile:", error);

      if (error.code === 404) {
        await createUserProfile();
      }
    }
  };

  const createUserProfile = async () => {
    if (!user) return;

    try {
      console.log('Creating new user profile...');

      const defaultProfile = {
        name: user.name || "Kullanıcı",
        username: `user${user.$id.slice(-8)}`,
        age: 24,
        location: "İstanbul",
        bio: "Henüz bir bio eklenmedi.",
        interests: [],
        avatarUrl: "https://via.placeholder.com/200x200?text=Avatar",
        followers: 0,
        following: 0,
      };

      await databases.createDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        user.$id,
        defaultProfile
      );

      console.log('User profile created successfully');

      setProfile({
        name: defaultProfile.name,
        username: defaultProfile.username,
        age: defaultProfile.age,
        location: defaultProfile.location,
        bio: defaultProfile.bio,
        interests: defaultProfile.interests,
        avatarUrl: defaultProfile.avatarUrl,
      });

      setFollowers(0);
      setFollowing(0);
    } catch (error) {
      console.error("Error creating user profile:", error);
      Alert.alert("Hata", "Profil oluşturulurken bir hata oluştu");
    }
  };

  const handleSaveProfile = async (updatedProfile: ProfileData) => {
    if (!user) return;

    if (!updatedProfile.username || updatedProfile.username.trim().length < 3) {
      Alert.alert("Hata", "Kullanıcı adı en az 3 karakter olmalıdır");
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(updatedProfile.username)) {
      Alert.alert("Hata", "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir");
      return;
    }

    try {
      try {
        const existingProfile = await databases.getDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          user.$id
        );

        if (existingProfile.username !== updatedProfile.username) {
          try {
            const usernameCheck = await databases.listDocuments(
              DATABASE_ID,
              USERS_COLLECTION_ID,
              [Query.equal("username", updatedProfile.username)]
            );

            if (usernameCheck.total > 0) {
              Alert.alert("Hata", "Bu kullanıcı adı zaten kullanılıyor");
              return;
            }
          } catch (error) {
            console.error("Username check error:", error);
          }
        }

        await databases.updateDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          user.$id,
          {
            name: updatedProfile.name,
            username: updatedProfile.username.toLowerCase(),
            age: updatedProfile.age,
            location: updatedProfile.location,
            bio: updatedProfile.bio,
            interests: updatedProfile.interests,
            avatarUrl: updatedProfile.avatarUrl,
          }
        );
      } catch (error: any) {
        if (error.code === 404) {
          try {
            const usernameCheck = await databases.listDocuments(
              DATABASE_ID,
              USERS_COLLECTION_ID,
              [Query.equal("username", updatedProfile.username)]
            );

            if (usernameCheck.total > 0) {
              Alert.alert("Hata", "Bu kullanıcı adı zaten kullanılıyor");
              return;
            }
          } catch (error) {
            console.error("Username check error:", error);
          }

          await databases.createDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            user.$id,
            {
              name: updatedProfile.name,
              username: updatedProfile.username.toLowerCase(),
              age: updatedProfile.age,
              location: updatedProfile.location,
              bio: updatedProfile.bio,
              interests: updatedProfile.interests,
              avatarUrl: updatedProfile.avatarUrl,
              followers: 0,
              following: 0,
            }
          );
        } else {
          throw error;
        }
      }

      setProfile(updatedProfile);
      setIsEditProfileModalVisible(false);
      Alert.alert("Başarılı", "Profiliniz güncellendi");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Hata", "Profil güncellenirken bir hata oluştu");
    }
  };

  const fetchMyEvents = async () => {
    if (!user) return;
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("user_id", user.$id), Query.orderDesc("$createdAt")]
      );
      setMyEvents(response.documents as Events[]);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchJoinedEvents = async () => {
    if (!user) return;
    try {
      // TODO: Gerçek participants collection'dan çek
      // Şimdilik mock data
      const mockJoinedEvents: Participant[] = [];
      setJoinedEvents(mockJoinedEvents);
    } catch (error) {
      console.error("Error fetching joined events:", error);
    }
  };

  const handleLeaveEvent = async (participantId: string, eventTitle: string) => {
    Alert.alert(
      "Etkinlikten Ayrıl",
      `"${eventTitle}" etkinliğinden ayrılmak istediğinizden emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Ayrıl",
          style: "destructive",
          onPress: async () => {
            try {
              // TODO: Participants collection'dan sil
              setJoinedEvents(prev => prev.filter(p => p.$id !== participantId));
              Alert.alert("Başarılı", "Etkinlikten ayrıldınız.");
            } catch (error) {
              console.error("Error leaving event:", error);
              Alert.alert("Hata", "Etkinlikten ayrılırken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert(
      "Etkinliği Sil",
      "Bu etkinliği silmek istediğinizden emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, eventId);
              fetchMyEvents();
            } catch (error) {
              console.error("Error deleting event:", error);
              Alert.alert("Hata", "Etkinlik silinirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

  const handleOpenEditEventModal = (event: Events) => {
    setSelectedEvent(event);
    setEditEventFormData({
      title: event.title,
      location: event.location,
      description: event.description,
      image_url: event.image_url || "",
      event_date: new Date(event.event_date),
    });
    setIsEditEventModalVisible(true);
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;

    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        selectedEvent.$id,
        {
          ...editEventFormData,
          event_date: editEventFormData.event_date.toISOString(),
        }
      );
      Alert.alert("Başarılı", "Etkinlik başarıyla güncellendi.");
      setIsEditEventModalVisible(false);
      fetchMyEvents();
    } catch (error) {
      console.error("Error updating event:", error);
      Alert.alert("Hata", "Etkinlik güncellenirken bir sorun oluştu.");
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const months = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
    ];
    const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const dayName = days[date.getDay()];
    return `${day} ${month}, ${dayName}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000ff" />

      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor="#fff"
          onPress={() => router.back()}
          style={styles.headerButton}
        />
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={styles.headerRight}>
          <IconButton
            icon="pencil"
            size={24}
            iconColor="#fff"
            onPress={() => setIsEditProfileModalVisible(true)}
            style={styles.headerButton}
          />
          <IconButton
            icon="cog"
            size={24}
            iconColor="#fff"
            onPress={() => router.push('/settings')}
            style={styles.headerButton}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar ve Profil Bilgileri */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: profile.avatarUrl }}
              style={styles.avatar}
            />
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.name}>{profile.name}, {profile.age}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#9eb7a8" />
              <Text style={styles.location}>{profile.location}</Text>
            </View>
          </View>
        </View>

        {/* Takipçi/Takip/Etkinlik Sayıları */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followers}</Text>
            <Text style={styles.statLabel}>Takipçi</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{following}</Text>
            <Text style={styles.statLabel}>Takip</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{myEvents.length}</Text>
            <Text style={styles.statLabel}>Etkinlik</Text>
          </View>
        </View>

        {/* Hakkımda */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hakkımda</Text>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>

        {/* İlgi Alanları */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>İlgi Alanları</Text>
          <View style={styles.interestsContainer}>
            {profile.interests.map((interest, index) => (
              <View key={index} style={styles.interestChip}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Oluşturduğum Etkinlikler */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Etkinliklerim</Text>
          {myEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color="#9eb7a8" />
              <Text style={styles.emptyText}>Henüz etkinlik eklemediniz</Text>
            </View>
          ) : (
            <View style={styles.eventsContainer}>
              {myEvents.map((event) => (
                <View key={event.$id} style={styles.eventCard}>
                  <Image
                    source={{ uri: event.image_url || "https://via.placeholder.com/100x100?text=Event" }}
                    style={styles.eventImage}
                  />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.eventDate}>{formatDate(event.event_date)}</Text>
                  </View>
                  <View style={styles.eventActions}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      iconColor="rgba(255,255,255,0.6)"
                      onPress={() => handleOpenEditEventModal(event)}
                      style={styles.actionButton}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor="rgba(255,255,255,0.6)"
                      onPress={() => handleDeleteEvent(event.$id)}
                      style={styles.actionButton}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Katıldığım Etkinlikler */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Katıldığım Etkinlikler</Text>
          {joinedEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#9eb7a8" />
              <Text style={styles.emptyText}>Henüz hiçbir etkinliğe katılmadınız</Text>
            </View>
          ) : (
            <View style={styles.eventsContainer}>
              {joinedEvents.map((participant) => (
                <View key={participant.$id} style={styles.eventCard}>
                  <Image
                    source={{ 
                      uri: participant.event?.image_url || "https://via.placeholder.com/100x100?text=Event" 
                    }}
                    style={styles.eventImage}
                  />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {participant.event?.title || 'Etkinlik'}
                    </Text>
                    <Text style={styles.eventDate}>
                      {participant.event?.event_date 
                        ? formatDate(participant.event.event_date) 
                        : 'Tarih belirtilmemiş'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.leaveButton}
                    onPress={() => handleLeaveEvent(
                      participant.$id, 
                      participant.event?.title || 'Etkinlik'
                    )}
                  >
                    <Ionicons name="exit-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Profil Düzenleme Modal */}
      <EditProfileModal
        visible={isEditProfileModalVisible}
        onDismiss={() => setIsEditProfileModalVisible(false)}
        profileData={profile}
        onSave={handleSaveProfile}
      />

      {/* Etkinlik Düzenleme Modal */}
      {selectedEvent && (
        <EditEventModal
          visible={isEditEventModalVisible}
          onDismiss={() => setIsEditEventModalVisible(false)}
          eventData={editEventFormData}
          setEventData={setEditEventFormData}
          onSave={handleUpdateEvent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerButton: {
    margin: 0,
  },
  headerRight: {
    flexDirection: 'row',
    gap: -8,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: `${theme.colors.primary}80`,
    marginBottom: 16,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    alignItems: "center",
    gap: 4,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: "bold",
  },
  username: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  location: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  bioText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  interestChip: {
    backgroundColor: `${theme.colors.primary}20`,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}40`,
  },
  interestText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  eventsContainer: {
    gap: 12,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  eventImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  eventDate: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  eventActions: {
    flexDirection: "row",
    gap: 4,
  },
  actionButton: {
    margin: 0,
  },
  leaveButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
});