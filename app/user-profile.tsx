// app/user-profile.tsx - Bu dosyayı oluşturun
// Bu sayede başka kullanıcıların profilleri ayrı bir ekranda açılır

import { COLLECTION_ID, DATABASE_ID, databases, USERS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { theme } from '@/lib/theme';
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
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
import { Events } from "../types/database.type";

interface ProfileData {
  name: string;
  username: string;
  age: number;
  location: string;
  bio: string;
  interests: string[];
  avatarUrl: string;
}

export default function UserProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const viewingUserId = params.userId as string;
  const [userEvents, setUserEvents] = useState<Events[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

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
    if (viewingUserId) {
      fetchAllData();
    }
  }, [viewingUserId]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserProfile(),
      fetchUserEvents(),
    ]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const fetchUserProfile = async () => {
    if (!viewingUserId) return;

    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        viewingUserId
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
    }
  };

  const fetchUserEvents = async () => {
    if (!viewingUserId) return;
    
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("user_id", viewingUserId), Query.orderDesc("$createdAt")]
      );
      setUserEvents(response.documents as Events[]);
    } catch (error) {
      console.error("Error fetching events:", error);
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
          onPress={() => router.back()}
          style={styles.headerButton}
        />
        <Text style={styles.headerTitle}>@{profile.username}</Text>
        <View style={styles.headerRight} />
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
            <Text style={styles.statNumber}>{userEvents.length}</Text>
            <Text style={styles.statLabel}>Etkinlik</Text>
          </View>
        </View>

        {/* Takip Et Butonu */}
        <TouchableOpacity style={styles.followButton}>
          <Ionicons name="person-add" size={20} color="#fff" />
          <Text style={styles.followButtonText}>Takip Et</Text>
        </TouchableOpacity>

        {/* Hakkında */}
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
          <Text style={styles.cardTitle}>Etkinlikleri</Text>
          {userEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color="#9eb7a8" />
              <Text style={styles.emptyText}>Henüz etkinlik eklenmemiş</Text>
            </View>
          ) : (
            <View style={styles.eventsContainer}>
              {userEvents.map((event) => (
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
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
    minWidth: 48,
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