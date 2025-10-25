import EditEventModal from "@/components/EditEventModal";
import EditProfileModal, { ProfileData } from "@/components/EditProfileModal";
import { COLLECTION_ID, DATABASE_ID, databases, USERS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { theme } from '@/lib/theme';
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  RefreshControl,
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

const PARTICIPANTS_COLLECTION_ID = "68fcff760027118990fd";

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // URL'den gelen userId - başka kullanıcı profili mi bakıyoruz?
  const viewingUserId = params.userId as string | undefined;
  const isOwnProfile = !viewingUserId || viewingUserId === user?.$id;
  
  // params değiştiğinde profili yeniden yükle
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, viewingUserId]);
  
  const [myEvents, setMyEvents] = useState<Events[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<Participant[]>([]);
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] = useState(false);
  const [isEditEventModalVisible, setIsEditEventModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Events | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
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
    bio: "Henüz bir bio eklenmedi.",
    interests: [],
    avatarUrl: "https://via.placeholder.com/200x200?text=Avatar",
  });

  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, viewingUserId]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserProfile(),
      fetchMyEvents(),
      fetchJoinedEvents(),
    ]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const fetchUserProfile = async () => {
    const targetUserId = viewingUserId || user?.$id;
    if (!targetUserId) return;

    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        targetUserId
      );

      setProfile({
        name: response.name || "Kullanıcı",
        username: response.username || "",
        age: response.age || 24,
        location: response.location || "İstanbul",
        bio: response.bio || "Henüz bir bio eklenmedi.",
        interests: response.interests || [],
        avatarUrl: response.avatarUrl || "https://via.placeholder.com/200x200?text=Avatar",
      });

      setFollowers(response.followers || 0);
      setFollowing(response.following || 0);
    } catch (error: any) {
      console.error("Error fetching user profile:", error);

      // Sadece kendi profilimizde hata varsa yeni profil oluştur
      if (error.code === 404 && isOwnProfile) {
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
    const targetUserId = viewingUserId || user?.$id;
    if (!targetUserId) return;
    
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("user_id", targetUserId), Query.orderDesc("$createdAt")]
      );
      setMyEvents(response.documents as Events[]);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchJoinedEvents = async () => {
    const targetUserId = viewingUserId || user?.$id;
    if (!targetUserId) return;
    
    try {
      console.log('Fetching joined events for user:', targetUserId);
      
      const participantsResponse = await databases.listDocuments(
        DATABASE_ID,
        PARTICIPANTS_COLLECTION_ID,
        [
          Query.equal("user_id", targetUserId),
          Query.orderDesc("joined_at")
        ]
      );

      console.log('Participants found:', participantsResponse.total);

      const joinedEventsWithDetails: Participant[] = [];
      
      for (const participant of participantsResponse.documents) {
        try {
          const event = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_ID,
            participant.event_id
          );
          
          joinedEventsWithDetails.push({
            $id: participant.$id,
            user_id: participant.user_id,
            event_id: participant.event_id,
            joined_at: participant.joined_at,
            event: event as Events,
          });
        } catch (error) {
          console.error(`Error fetching event ${participant.event_id}:`, error);
        }
      }

      console.log('Valid joined events:', joinedEventsWithDetails.length);
      setJoinedEvents(joinedEventsWithDetails);
    } catch (error) {
      console.error("Error fetching joined events:", error);
      setJoinedEvents([]);
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
              await databases.deleteDocument(
                DATABASE_ID,
                PARTICIPANTS_COLLECTION_ID,
                participantId
              );
              
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
              try {
                const participants = await databases.listDocuments(
                  DATABASE_ID,
                  PARTICIPANTS_COLLECTION_ID,
                  [Query.equal("event_id", eventId)]
                );

                await Promise.all(
                  participants.documents.map(p => 
                    databases.deleteDocument(DATABASE_ID, PARTICIPANTS_COLLECTION_ID, p.$id)
                  )
                );
              } catch (error) {
                console.log("No participants to delete or error:", error);
              }

              await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, eventId);
              fetchMyEvents();
              Alert.alert("Başarılı", "Etkinlik başarıyla silindi.");
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

  const handleEventPress = (eventId: string) => {
    router.push({
      pathname: '/event-detail',
      params: { eventId }
    });
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000ff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Profil yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000ff" />

      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor="#fff"
          onPress={() => {
            // Eğer başkasının profilindeyse, kendi profiline dön
            if (!isOwnProfile) {
              router.push('/(tabs)/profile');
            } else {
              // Kendi profilindeyse normal geri git
              router.back();
            }
          }}
          style={styles.headerButton}
        />
        <Text style={styles.headerTitle}>
          {isOwnProfile ? 'Profil' : `@${profile.username}`}
        </Text>
        <View style={styles.headerRight}>
          {isOwnProfile && (
            <>
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
            </>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
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

        {/* Takip Et Butonu - Sadece başkasının profilindeyse */}
        {!isOwnProfile && (
          <TouchableOpacity style={styles.followButton}>
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.followButtonText}>Takip Et</Text>
          </TouchableOpacity>
        )}

        {/* Hakkımda */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hakkında</Text>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>

        {/* İlgi Alanları */}
        {profile.interests.length > 0 && (
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
        )}

        {/* Etkinlikler */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isOwnProfile ? 'Etkinliklerim' : 'Etkinlikleri'}
          </Text>
          {myEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color="#9eb7a8" />
              <Text style={styles.emptyText}>
                {isOwnProfile ? 'Henüz etkinlik eklemediniz' : 'Henüz etkinlik eklenmemiş'}
              </Text>
            </View>
          ) : (
            <View style={styles.eventsContainer}>
              {myEvents.map((event) => (
                <TouchableOpacity 
                  key={event.$id} 
                  style={styles.eventCard}
                  onPress={() => handleEventPress(event.$id)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: event.image_url || "https://via.placeholder.com/100x100?text=Event" }}
                    style={styles.eventImage}
                  />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.eventDate}>{formatDate(event.event_date)}</Text>
                  </View>
                  {isOwnProfile && (
                    <View style={styles.eventActions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        iconColor="rgba(255,255,255,0.6)"
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOpenEditEventModal(event);
                        }}
                        style={styles.actionButton}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="rgba(255,255,255,0.6)"
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(event.$id);
                        }}
                        style={styles.actionButton}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Katıldığı Etkinlikler - Sadece kendi profilinde göster */}
        {isOwnProfile && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Katıldığım Etkinlikler</Text>
              {joinedEvents.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{joinedEvents.length}</Text>
                </View>
              )}
            </View>
            {joinedEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#a1a1aa" />
                <Text style={styles.emptyText}>Henüz hiçbir etkinliğe katılmadınız</Text>
                <Text style={styles.emptySubtext}>Etkinlikleri keşfedin ve katılın!</Text>
              </View>
            ) : (
              <View style={styles.eventsContainer}>
                {joinedEvents.map((participant) => (
                  <TouchableOpacity
                    key={participant.$id}
                    style={styles.eventCard}
                    onPress={() => handleEventPress(participant.event_id)}
                    activeOpacity={0.7}
                  >
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
                      <Text style={styles.joinedDate}>
                        Katılma: {new Date(participant.joined_at).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.leaveButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleLeaveEvent(
                          participant.$id, 
                          participant.event?.title || 'Etkinlik'
                        );
                      }}
                    >
                      <Ionicons name="exit-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Profil Düzenleme Modal - Sadece kendi profilinde */}
      {isOwnProfile && (
        <>
          <EditProfileModal
            visible={isEditProfileModalVisible}
            onDismiss={() => setIsEditProfileModalVisible(false)}
            profileData={profile}
            onSave={handleSaveProfile}
          />

          {selectedEvent && (
            <EditEventModal
              visible={isEditEventModalVisible}
              onDismiss={() => setIsEditEventModalVisible(false)}
              eventData={editEventFormData}
              setEventData={setEditEventFormData}
              onSave={handleUpdateEvent}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
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
    minWidth: 80,
    justifyContent: 'flex-end',
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
    borderColor: theme.colors.primary,
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
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.3)',
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
  joinedDate: {
    color: '#10B981',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
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
  emptySubtext: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
});