import { COLLECTION_ID, DATABASE_ID, databases, USERS_COLLECTION_ID } from '@/lib/appwrite';
import { useAuth } from '@/lib/auth-context';
import messageService from '@/lib/messageService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
import { Events } from '../../types/database.type';

interface UserResult {
  $id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
}

export default function SearchScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [eventResults, setEventResults] = useState<Events[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Events | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventOwner, setEventOwner] = useState<UserResult | null>(null);

  // Debounce için
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setUserResults([]);
      setEventResults([]);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    try {
      setSearching(true);

      // Kullanıcıları ara
      const usersResponse = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [
          Query.search('name', searchQuery),
          Query.limit(10),
        ]
      );

      // Etkinlikleri ara
      const eventsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.search('title', searchQuery),
          Query.limit(10),
        ]
      );

      setUserResults(usersResponse.documents as unknown as  UserResult[]);
      setEventResults(eventsResponse.documents as Events[]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <Text key={i} style={styles.highlight}>{part}</Text>
        : part
    );
  };

  const handleUserPress = (user: UserResult) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEventPress = async (event: Events) => {
    setSelectedEvent(event);
    
    // Etkinlik sahibinin bilgilerini al
    try {
      const owner = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        event.user_id
      );
      setEventOwner(owner as unknown as  UserResult);
    } catch (error) {
      console.error('Error fetching event owner:', error);
    }
    
    setShowEventModal(true);
  };

  const handleSendMessage = async (targetUser: UserResult) => {
    if (!user) {
      alert('Lütfen önce giriş yapın');
      return;
    }

    try {
      // Konuşma oluştur
      await messageService.getOrCreateConversation(user.$id, targetUser.$id);
      
      // Mesaj ekranına yönlendir
      setShowUserModal(false);
      setShowEventModal(false);
      router.push('/message');
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Sohbet başlatılamadı');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const getAvatarUrl = (avatarUrl?: string, name?: string) => {
    return avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ara</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Kişi veya etkinlik ara..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searching && <ActivityIndicator size="small" color="#3B82F6" />}
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {searchQuery.length < 2 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#434343" />
            <Text style={styles.emptyText}>Aramaya başlamak için en az 2 karakter girin</Text>
          </View>
        ) : searching ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : userResults.length === 0 && eventResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="sad-outline" size={64} color="#434343" />
            <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
          </View>
        ) : (
          <>
            {/* Kullanıcı Sonuçları */}
            {userResults.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kişiler ({userResults.length})</Text>
                {userResults.map((item) => (
                  <TouchableOpacity
                    key={item.$id}
                    style={styles.userItem}
                    onPress={() => handleUserPress(item)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: getAvatarUrl(item.avatar_url, item.name) }}
                      style={styles.userAvatar}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>
                        {highlightMatch(item.name, searchQuery)}
                      </Text>
                      {item.location && (
                        <View style={styles.locationRow}>
                          <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                          <Text style={styles.userLocation}>{item.location}</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Etkinlik Sonuçları */}
            {eventResults.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Etkinlikler ({eventResults.length})</Text>
                {eventResults.map((item) => (
                  <TouchableOpacity
                    key={item.$id}
                    style={styles.eventItem}
                    onPress={() => handleEventPress(item)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: item.image_url || 'https://via.placeholder.com/80x80?text=Event' }}
                      style={styles.eventImage}
                    />
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>
                        {highlightMatch(item.title, searchQuery)}
                      </Text>
                      <View style={styles.eventMeta}>
                        <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.eventDate}>{formatDate(item.event_date)}</Text>
                      </View>
                      <View style={styles.eventMeta}>
                        <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.eventLocation} numberOfLines={1}>
                          {item.location}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Kullanıcı Profil Modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowUserModal(false)}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Image
                    source={{ uri: getAvatarUrl(selectedUser.avatar_url, selectedUser.name) }}
                    style={styles.modalAvatar}
                  />
                  <Text style={styles.modalName}>{selectedUser.name}</Text>
                  {selectedUser.location && (
                    <View style={styles.modalLocationRow}>
                      <Ionicons name="location" size={16} color="#9CA3AF" />
                      <Text style={styles.modalLocation}>{selectedUser.location}</Text>
                    </View>
                  )}
                </View>

                {selectedUser.bio && (
                  <View style={styles.modalBio}>
                    <Text style={styles.modalBioTitle}>Hakkında</Text>
                    <Text style={styles.modalBioText}>{selectedUser.bio}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.messageButton}
                  onPress={() => handleSendMessage(selectedUser)}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
                  <Text style={styles.messageButtonText}>Mesaj Gönder</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Etkinlik Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowEventModal(false)}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            {selectedEvent && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image
                  source={{ uri: selectedEvent.image_url || 'https://via.placeholder.com/400x200?text=Event' }}
                  style={styles.modalEventImage}
                />
                
                <View style={styles.modalEventContent}>
                  <Text style={styles.modalEventTitle}>{selectedEvent.title}</Text>
                  
                  <View style={styles.modalEventMeta}>
                    <Ionicons name="calendar" size={18} color="#9CA3AF" />
                    <Text style={styles.modalEventMetaText}>{formatDate(selectedEvent.event_date)}</Text>
                  </View>
                  
                  <View style={styles.modalEventMeta}>
                    <Ionicons name="location" size={18} color="#9CA3AF" />
                    <Text style={styles.modalEventMetaText}>{selectedEvent.location}</Text>
                  </View>

                  {selectedEvent.description && (
                    <View style={styles.modalEventDescription}>
                      <Text style={styles.modalEventDescriptionTitle}>Açıklama</Text>
                      <Text style={styles.modalEventDescriptionText}>{selectedEvent.description}</Text>
                    </View>
                  )}

                  {/* Etkinlik Sahibi */}
                  {eventOwner && (
                    <View style={styles.eventOwnerSection}>
                      <Text style={styles.eventOwnerTitle}>Etkinliği Oluşturan</Text>
                      <TouchableOpacity
                        style={styles.eventOwnerCard}
                        onPress={() => {
                          setSelectedUser(eventOwner);
                          setShowEventModal(false);
                          setShowUserModal(true);
                        }}
                      >
                        <Image
                          source={{ uri: getAvatarUrl(eventOwner.avatar_url, eventOwner.name) }}
                          style={styles.eventOwnerAvatar}
                        />
                        <View style={styles.eventOwnerInfo}>
                          <Text style={styles.eventOwnerName}>{eventOwner.name}</Text>
                          {eventOwner.location && (
                            <Text style={styles.eventOwnerLocation}>{eventOwner.location}</Text>
                          )}
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1F1F1F',
    marginBottom: 1,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userLocation: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  eventItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1F1F1F',
    marginBottom: 1,
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  eventLocation: {
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F1F1F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  modalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalLocation: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  modalBio: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalBioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalBioText: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 22,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  messageButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalEventImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  modalEventContent: {
    gap: 12,
  },
  modalEventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalEventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalEventMetaText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  modalEventDescription: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  modalEventDescriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalEventDescriptionText: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 22,
  },
  eventOwnerSection: {
    marginTop: 20,
  },
  eventOwnerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  eventOwnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 12,
  },
  eventOwnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  eventOwnerInfo: {
    flex: 1,
  },
  eventOwnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  eventOwnerLocation: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});