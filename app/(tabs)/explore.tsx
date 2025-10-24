import { COLLECTION_ID, DATABASE_ID, databases } from '@/lib/appwrite';
import { theme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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

export default function ExploreScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [events, setEvents] = useState<Events[]>([]);
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
  }, []);

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
    } catch (error) {
      console.error('Etkinlik yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      await loadEvents();
      return;
    }

    try {
      setLoading(true);
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
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (event: Events) => {
    setSelectedEvent(event);
    
    // Haritayı markera odakla
    if (mapRef.current && event.latitude && event.longitude) {
      mapRef.current.animateToRegion({
        latitude: event.latitude,
        longitude: event.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }

    // Kartı yukarı kaydır
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
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
            placeholder="Etkinlik ara..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              loadEvents();
            }}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          onPress={getLocationAndEvents}
          style={styles.locationButton}
        >
          <Ionicons name="location" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Harita */}
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

      {/* Yükleniyor İndikatörü */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      )}

      {/* Etkinlik Detay Kartı */}
      {selectedEvent && (
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

      {/* Etkinlik Sayısı Badge */}
      {!loading && events.length > 0 && (
        <View style={styles.eventBadge}>
          <Ionicons name="calendar" size={16} color="#FFFFFF" />
          <Text style={styles.eventBadgeText}>{events.length} Etkinlik</Text>
        </View>
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
                      // Katılma işlemi
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
    backgroundColor: theme.colors.border,
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