import { COLLECTION_ID, DATABASE_ID, databases, USERS_COLLECTION_ID } from '@/lib/appwrite';
import { useAuth } from "@/lib/auth-context";
import { theme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Query } from 'react-native-appwrite';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Events } from '../../types/database.type';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = 220;
const CARD_WIDTH = width * 0.8;

// Kullanıcı tipi
interface User {
  $id: string;
  username: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
  followers_count?: number;
  following_count?: number;
}

type SearchTab = 'events' | 'users';

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTab, setSearchTab] = useState<SearchTab>('events');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [events, setEvents] = useState<Events[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Events | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: 37.8449,
    longitude: 27.8458,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    getLocationAndEvents();
    // Users collection'a erişimi test et
    testUsersCollection();
  }, []);

  const testUsersCollection = async () => {
    try {
      console.log('=== USERS COLLECTION TEST ===');
      console.log('DATABASE_ID:', DATABASE_ID);
      console.log('USERS_COLLECTION_ID:', USERS_COLLECTION_ID);
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.limit(5)]
      );
      
      console.log('✅ Users collection erişimi başarılı!');
      console.log('Kullanıcı sayısı:', response.documents.length);
      if (response.documents.length > 0) {
        console.log('İlk kullanıcı:', response.documents[0]);
      }
    } catch (error: any) {
      console.error('❌ Users collection hatası:', error.message);
      console.error('Hata kodu:', error.code);
      console.error('Hata tipi:', error.type);
    }
  };

  const getLocationAndEvents = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Konum izni reddedildi');
        await loadEvents();
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({});
      setLocation(userLocation);
      
      setRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });

      await loadEvents();
    } catch (error) {
      console.error('Konum hatası:', error);
      await loadEvents();
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.limit(50), Query.orderDesc('$createdAt')]
      );

      const eventsWithCoords = response.documents
        .filter((event: any) => event.latitude && event.longitude)
        .map((event: any) => ({
          ...event,
          latitude: parseFloat(event.latitude),
          longitude: parseFloat(event.longitude),
        }));

      setEvents(eventsWithCoords as Events[]);
      setIsSearching(false);
    } catch (error) {
      console.error('Etkinlik yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
  if (!searchQuery.trim() || searchQuery.length < 2) {
    setIsSearching(false);
    if (searchTab === 'events') {
      await loadEvents();
    } else {
      setUsers([]);
    }
    return;
  }

  try {
    setLoading(true);
    setIsSearching(true);

    if (searchTab === 'events') {
      // Etkinlik araması
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.search('title', searchQuery), Query.limit(50)]
      );

      const eventsWithCoords = response.documents
        .filter((event: any) => event.latitude && event.longitude)
        .map((event: any) => ({
          ...event,
          latitude: parseFloat(event.latitude),
          longitude: parseFloat(event.longitude),
        }));

      setEvents(eventsWithCoords as Events[]);
    } else {
      // Kullanıcı araması - USERS_COLLECTION_ID kullanılmalı
      try {
        console.log('🔍 Kullanıcı araması başlatılıyor:', searchQuery);
        console.log('DATABASE_ID:', DATABASE_ID);
        console.log('USERS_COLLECTION_ID:', USERS_COLLECTION_ID);

        // İlk olarak username'de ara
        const usernameResponse = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID, // 'users' yerine USERS_COLLECTION_ID
          [Query.search('username', searchQuery), Query.limit(25)]
        );

        console.log('✅ Username araması başarılı:', usernameResponse.documents.length);

        // Sonra full_name'de ara
        const fullNameResponse = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID, // 'users' yerine USERS_COLLECTION_ID
          [Query.search('name', searchQuery), Query.limit(25)] // 'full_name' yerine 'name' - collection'daki alan adı
        );

        console.log('✅ Full name araması başarılı:', fullNameResponse.documents.length);

        // İki sonucu birleştir ve duplicate'leri kaldır
        const allUsers = [...usernameResponse.documents, ...fullNameResponse.documents];
        const uniqueUsers = Array.from(
          new Map(allUsers.map(user => [user.$id, user])).values()
        );

        console.log('✅ Toplam benzersiz kullanıcı:', uniqueUsers.length);
        setUsers(uniqueUsers as unknown as User[]);
      } catch (error: any) {
        console.error('❌ Kullanıcı arama hatası:', error.message);
        console.error('Hata kodu:', error.code);
        console.error('Hata tipi:', error.type);
        setUsers([]);
      }
    }
  } catch (error) {
    console.error('Arama hatası:', error);
  } finally {
    setLoading(false);
  }
};
  // Search query değiştiğinde otomatik ara
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (isSearching) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, searchTab]);

  const handleMarkerPress = (event: Events) => {
    setSelectedEvent(event);
    
    if (mapRef.current && event.latitude && event.longitude) {
      mapRef.current.animateToRegion({
        latitude: event.latitude,
        longitude: event.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }

    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const handleSearchResultPress = (event: Events) => {
    setIsSearching(false);
    setSearchQuery('');
    handleMarkerPress(event);
  };

 // ExploreScreen içindeki handleUserPress fonksiyonu güncellendi:

// ExploreScreen içindeki handleUserPress fonksiyonu - GÜNCELLENDİ:

const handleUserPress = (userId: string) => {
  setIsSearching(false);
  setSearchQuery('');
  
  // Eğer kendi profilimize tıklandıysa tab navigator'daki profile git
  if (userId === user?.$id) {
    router.push('/(tabs)/profile');
  } else {
    // Başka birine tıklandıysa ayrı bir ekrana git (user-profile)
    router.push({
      pathname: '/user-profile',
      params: { userId }
    });
  }
};

  const closeEventCard = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedEvent(null);
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const renderSearchResultItem = ({ item }: { item: Events }) => (
    <TouchableOpacity 
      style={styles.searchResultItem}
      onPress={() => handleSearchResultPress(item)}
    >
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/100x100?text=Event' }}
        style={styles.searchResultImage}
      />
      <View style={styles.searchResultContent}>
        <Text style={styles.searchResultTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.searchResultMeta}>
          <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
          <Text style={styles.searchResultMetaText}>
            {formatDate(item.event_date)}
          </Text>
        </View>
        <View style={styles.searchResultMeta}>
          <Ionicons name="location-outline" size={14} color="#9CA3AF" />
          <Text style={styles.searchResultMetaText} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.userResultItem}
      onPress={() => handleUserPress(item.$id)}
    >
      <Image
        source={{ 
          uri: item.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.name || item.username) 
        }}
        style={styles.userAvatar}
      />
      <View style={styles.userResultContent}>
        <Text style={styles.userResultName} numberOfLines={1}>
          {item.name || item.username}
        </Text>
        <Text style={styles.userResultUsername} numberOfLines={1}>
          @{item.username}
        </Text>
        {item.bio && (
          <Text style={styles.userResultBio} numberOfLines={1}>
            {item.bio}
          </Text>
        )}
        {(item.followers_count !== undefined || item.following_count !== undefined) && (
          <View style={styles.userStats}>
            {item.followers_count !== undefined && (
              <Text style={styles.userStat}>
                <Text style={styles.userStatNumber}>{item.followers_count}</Text> takipçi
              </Text>
            )}
            {item.following_count !== undefined && (
              <Text style={styles.userStat}>
                <Text style={styles.userStatNumber}>{item.following_count}</Text> takip
              </Text>
            )}
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder={searchTab === 'events' ? 'Etkinlik ara...' : 'Kullanıcı ara...'}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.trim().length >= 2) {
                setIsSearching(true);
              }
            }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setIsSearching(false);
              if (searchTab === 'events') {
                loadEvents();
              } else {
                setUsers([]);
              }
            }}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {searchTab === 'events' && (
          <TouchableOpacity 
            onPress={getLocationAndEvents}
            style={styles.locationButton}
          >
            <Ionicons name="location" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Arama Sekmeleri */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, searchTab === 'events' && styles.tabActive]}
          onPress={() => {
            setSearchTab('events');
            if (searchQuery.trim().length >= 2) {
              setIsSearching(true);
            } else {
              setIsSearching(false);
              loadEvents();
            }
          }}
        >
          <Ionicons 
            name="calendar-outline" 
            size={20} 
            color={searchTab === 'events' ? theme.colors.primary : theme.colors.textSecondary} 
          />
          <Text style={[styles.tabText, searchTab === 'events' && styles.tabTextActive]}>
            Etkinlikler
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, searchTab === 'users' && styles.tabActive]}
          onPress={() => {
            setSearchTab('users');
            if (searchQuery.trim().length >= 2) {
              setIsSearching(true);
            } else {
              setIsSearching(false);
              setUsers([]);
            }
          }}
        >
          <Ionicons 
            name="people-outline" 
            size={20} 
            color={searchTab === 'users' ? theme.colors.primary : theme.colors.textSecondary} 
          />
          <Text style={[styles.tabText, searchTab === 'users' && styles.tabTextActive]}>
            Kişiler
          </Text>
        </TouchableOpacity>
      </View>

      {/* Arama Sonuçları Listesi */}
      {isSearching && (
        <View style={styles.searchResultsContainer}>
          {loading ? (
            <View style={styles.searchLoadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.searchLoadingText}>Aranıyor...</Text>
            </View>
          ) : searchTab === 'events' ? (
            events.length > 0 ? (
              <>
                <View style={styles.searchResultsHeader}>
                  <Text style={styles.searchResultsTitle}>
                    {events.length} Etkinlik Bulundu
                  </Text>
                </View>
                <FlatList
                  data={events}
                  renderItem={renderSearchResultItem}
                  keyExtractor={(item) => item.$id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.searchResultsList}
                />
              </>
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="calendar-outline" size={64} color="#4B5563" />
                <Text style={styles.noResultsTitle}>Etkinlik Bulunamadı</Text>
                <Text style={styles.noResultsText}>
                  {searchQuery} için etkinlik bulunamadı
                </Text>
              </View>
            )
          ) : (
            users.length > 0 ? (
              <>
                <View style={styles.searchResultsHeader}>
                  <Text style={styles.searchResultsTitle}>
                    {users.length} Kullanıcı Bulundu
                  </Text>
                </View>
                <FlatList
                  data={users}
                  renderItem={renderUserItem}
                  keyExtractor={(item) => item.$id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.searchResultsList}
                />
              </>
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="people-outline" size={64} color="#4B5563" />
                <Text style={styles.noResultsTitle}>Kullanıcı Bulunamadı</Text>
                <Text style={styles.noResultsText}>
                  {searchQuery} için kullanıcı bulunamadı
                </Text>
              </View>
            )
          )}
        </View>
      )}

      {/* Harita - Sadece etkinlik sekmesinde ve arama yapılmadığında */}
      {!isSearching && searchTab === 'events' && (
        <>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            showsUserLocation={true}
            showsMyLocationButton={false}
            customMapStyle={mapDarkStyle}
          >
            {events.map((event) => (
              <Marker
                key={event.$id}
                coordinate={{
                  latitude: event.latitude!,
                  longitude: event.longitude!,
                }}
                onPress={() => handleMarkerPress(event)}
              >
                <View style={styles.markerContainer}>
                  <View style={[
                    styles.marker,
                    selectedEvent?.$id === event.$id && styles.markerSelected
                  ]}>
                    <Ionicons 
                      name="calendar" 
                      size={20} 
                      color={selectedEvent?.$id === event.$id ? "#3B82F6" : "#FFFFFF"} 
                    />
                  </View>
                  {selectedEvent?.$id === event.$id && (
                    <View style={styles.markerPulse} />
                  )}
                </View>
              </Marker>
            ))}
          </MapView>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}

          {!loading && events.length > 0 && (
            <View style={styles.eventBadge}>
              <Ionicons name="calendar" size={16} color="#FFFFFF" />
              <Text style={styles.eventBadgeText}>{events.length} Etkinlik</Text>
            </View>
          )}
        </>
      )}

      {/* Kullanıcı sekmesi için boş state */}
      {!isSearching && searchTab === 'users' && (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="search" size={64} color="#4B5563" />
          <Text style={styles.emptyStateTitle}>Kişi Ara</Text>
          <Text style={styles.emptyStateText}>
            Kullanıcı adı veya isim ile arama yapın
          </Text>
        </View>
      )}

      {/* Etkinlik Detay Kartı */}
      {selectedEvent && !isSearching && searchTab === 'events' && (
        <Animated.View 
          style={[
            styles.eventCard,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.cardCloseButton}
            onPress={closeEventCard}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Image
            source={{ 
              uri: selectedEvent.image_url || 'https://via.placeholder.com/400x200?text=Event' 
            }}
            style={styles.cardImage}
          />

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {selectedEvent.title}
            </Text>

            <View style={styles.cardMeta}>
              <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
              <Text style={styles.cardMetaText}>
                {formatDate(selectedEvent.event_date)}
              </Text>
            </View>

            <View style={styles.cardMeta}>
              <Ionicons name="location-outline" size={16} color="#9CA3AF" />
              <Text style={styles.cardMetaText} numberOfLines={1}>
                {selectedEvent.location}
              </Text>
            </View>

            {selectedEvent.description && (
              <Text style={styles.cardDescription} numberOfLines={2}>
                {selectedEvent.description}
              </Text>
            )}

            <TouchableOpacity 
              style={styles.detailButton}
              onPress={() => {
                closeEventCard();
                router.push({
                  pathname: '/event-detail',
                  params: { eventId: selectedEvent.$id }
                });
              }}
            >
              <Text style={styles.detailButtonText}>Detayları Gör</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Detaylı Bilgi Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            {selectedEvent && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image
                  source={{ 
                    uri: selectedEvent.image_url || 'https://via.placeholder.com/400x200?text=Event' 
                  }}
                  style={styles.modalEventImage}
                />
                
                <View style={styles.modalEventContent}>
                  <Text style={styles.modalEventTitle}>{selectedEvent.title}</Text>
                  
                  <View style={styles.modalEventMeta}>
                    <Ionicons name="calendar" size={18} color="#9CA3AF" />
                    <Text style={styles.modalEventMetaText}>
                      {formatDate(selectedEvent.event_date)}
                    </Text>
                  </View>
                  
                  <View style={styles.modalEventMeta}>
                    <Ionicons name="location" size={18} color="#9CA3AF" />
                    <Text style={styles.modalEventMetaText}>{selectedEvent.location}</Text>
                  </View>

                  {selectedEvent.description && (
                    <View style={styles.modalEventDescription}>
                      <Text style={styles.modalEventDescriptionTitle}>Açıklama</Text>
                      <Text style={styles.modalEventDescriptionText}>
                        {selectedEvent.description}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity 
                    style={styles.joinButton}
                    onPress={() => {
                      setShowDetailModal(false);
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.joinButtonText}>Etkinliğe Katıl</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const mapDarkStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#1a1a1a' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a8a' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1a1a1a' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#2a2a2a' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca3af' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b7280' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2a2a2a' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca3af' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0f172a' }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: theme.colors.background,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
  locationButton: {
    padding: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: theme.colors.background,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabActive: {
    backgroundColor: `${theme.colors.primary}20`,
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  searchResultsContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchResultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  searchResultsList: {
    padding: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchResultImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  searchResultContent: {
    flex: 1,
    gap: 4,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  searchResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchResultMetaText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  userResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  userResultContent: {
    flex: 1,
    gap: 4,
  },
  userResultName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  userResultUsername: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  userResultBio: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  userStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  userStat: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  userStatNumber: {
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  searchLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  searchLoadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: theme.colors.background,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    backgroundColor: '#1F2937',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#3B82F6',
  },
  markerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    opacity: 0.2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  cardCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  cardImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardMetaText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 16,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  detailButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  eventBadge: {
    position: 'absolute',
    top: 80,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  eventBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  modalEventImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 20,
  },
  modalEventContent: {
    gap: 12,
  },
  modalEventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  modalEventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalEventMetaText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  modalEventDescription: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  modalEventDescriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  modalEventDescriptionText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});