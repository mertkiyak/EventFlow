import { COLLECTION_ID, DATABASE_ID, databases, USERS_COLLECTION_ID } from '@/lib/appwrite';
import { useAuth } from '@/lib/auth-context';
import { theme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Models, Query } from 'react-native-appwrite';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Events } from '../types/database.type';

const { width } = Dimensions.get('window');

// Custom User Interface - Appwrite User tipini genişletir
interface CustomUser extends Models.User<Models.Preferences> {
  username?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
}

interface UserResult {
  $id: string;
  name: string;
  username?: string;
  email: string;
  avatar_url?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
}

interface Participant {
  $id: string;
  user_id: string;
  event_id: string;
  joined_at: string;
  user?: UserResult;
}

// Appwrite'da oluşturduğunuz participants collection ID'sini buraya ekleyin
const PARTICIPANTS_COLLECTION_ID = "68fcff760027118990fd"; // BURAYI DEĞİŞTİRİN!

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<Events | null>(null);
  const [eventOwner, setEventOwner] = useState<UserResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [joiningEvent, setJoiningEvent] = useState(false);

  // Type guard function for CustomUser
  const isCustomUser = (user: any): user is CustomUser => {
    return user && typeof user === 'object' && '$id' in user;
  };

  useEffect(() => {
    loadEventDetails();
    loadParticipants();
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      
      const eventDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        eventId as string
      );
      
      setEvent(eventDoc as Events);

      if (eventDoc.user_id) {
        try {
          const owner = await databases.getDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            eventDoc.user_id
          );
          setEventOwner(owner as unknown as UserResult);
        } catch (error) {
          console.error('Event owner not found:', error);
        }
      }
      
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Hata', 'Etkinlik yüklenirken bir hata oluştu.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      setLoadingParticipants(true);
      
      // Participants koleksiyonundan bu etkinliğe ait katılımcıları çek
      const participantsResponse = await databases.listDocuments(
        DATABASE_ID,
        PARTICIPANTS_COLLECTION_ID,
        [
          Query.equal("event_id", eventId as string),
          Query.orderDesc("joined_at")
        ]
      );

      console.log('Participants found:', participantsResponse.total);

      // Her katılımcı için kullanıcı bilgilerini çek
      const participantsWithUserData = await Promise.all(
        participantsResponse.documents.map(async (participant: any) => {
          try {
            const userData = await databases.getDocument(
              DATABASE_ID,
              USERS_COLLECTION_ID,
              participant.user_id
            );
            
            return {
              $id: participant.$id,
              user_id: participant.user_id,
              event_id: participant.event_id,
              joined_at: participant.joined_at,
              user: {
                $id: userData.$id,
                name: userData.name || 'Kullanıcı',
                username: userData.username,
                email: userData.email || '',
                avatar_url: userData.avatarUrl || userData.avatar_url,
                bio: userData.bio,
                location: userData.location,
              } as UserResult,
            };
          } catch (error) {
            console.error(`Error fetching user ${participant.user_id}:`, error);
            return {
              $id: participant.$id,
              user_id: participant.user_id,
              event_id: participant.event_id,
              joined_at: participant.joined_at,
              user: {
                $id: participant.user_id,
                name: 'Kullanıcı',
                username: undefined,
                email: '',
                avatar_url: undefined,
              } as UserResult,
            };
          }
        })
      );

      setParticipants(participantsWithUserData);
      
      // Kullanıcının katılıp katılmadığını kontrol et
      if (user) {
        const userParticipant = participantsWithUserData.find(
          p => p.user_id === user.$id
        );
        
        if (userParticipant) {
          setIsJoined(true);
          setCurrentParticipantId(userParticipant.$id);
          console.log('User is already joined:', userParticipant.$id);
        } else {
          setIsJoined(false);
          setCurrentParticipantId(null);
        }
      }
      
    } catch (error: any) {
      console.error('Error loading participants:', error);
      // Collection yoksa boş array
      if (error.code === 404) {
        setParticipants([]);
      }
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleJoinEvent = async () => {
    if (!user) {
      Alert.alert('Giriş Gerekli', 'Etkinliğe katılmak için giriş yapmalısınız.');
      return;
    }

    if (joiningEvent) return;

    Alert.alert(
      'Etkinliğe Katıl',
      'Bu etkinliğe katılmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Katıl',
          onPress: async () => {
            try {
              setJoiningEvent(true);

              // Önce kontrol et: Zaten katılmış mı?
              const existingParticipant = await databases.listDocuments(
                DATABASE_ID,
                PARTICIPANTS_COLLECTION_ID,
                [
                  Query.equal("user_id", user.$id),
                  Query.equal("event_id", eventId as string)
                ]
              );

              if (existingParticipant.total > 0) {
                Alert.alert('Bilgi', 'Bu etkinliğe zaten katıldınız.');
                setIsJoined(true);
                setCurrentParticipantId(existingParticipant.documents[0].$id);
                return;
              }

              // Yeni katılımcı ekle
              const newParticipant = await databases.createDocument(
                DATABASE_ID,
                PARTICIPANTS_COLLECTION_ID,
                'unique()', // Appwrite otomatik ID oluşturacak
                {
                  user_id: user.$id,
                  event_id: eventId as string,
                  joined_at: new Date().toISOString(),
                }
              );

              console.log('Successfully joined event:', newParticipant.$id);

              // UI'ı güncelle
              setIsJoined(true);
              setCurrentParticipantId(newParticipant.$id);

              // Katılımcıları yeniden yükle
              await loadParticipants();

              Alert.alert('Başarılı!', 'Etkinliğe başarıyla katıldınız.');
            } catch (error: any) {
              console.error('Join event error:', error);
              Alert.alert(
                'Hata', 
                error.message || 'Katılım sırasında bir hata oluştu.'
              );
            } finally {
              setJoiningEvent(false);
            }
          },
        },
      ]
    );
  };

  const handleLeaveEvent = async () => {
    if (!user || !currentParticipantId) return;

    Alert.alert(
      'Etkinlikten Ayrıl',
      'Bu etkinlikten ayrılmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ayrıl',
          style: 'destructive',
          onPress: async () => {
            try {
              setJoiningEvent(true);

              // Katılımcı kaydını sil
              await databases.deleteDocument(
                DATABASE_ID,
                PARTICIPANTS_COLLECTION_ID,
                currentParticipantId
              );

              console.log('Successfully left event');

              // UI'ı güncelle
              setIsJoined(false);
              setCurrentParticipantId(null);

              // Katılımcıları yeniden yükle
              await loadParticipants();

              Alert.alert('Başarılı', 'Etkinlikten ayrıldınız.');
            } catch (error: any) {
              console.error('Leave event error:', error);
              Alert.alert(
                'Hata',
                error.message || 'Etkinlikten ayrılırken bir hata oluştu.'
              );
            } finally {
              setJoiningEvent(false);
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${event?.title}\n\n${event?.description}\n\n📅 ${formatDate(event?.event_date!)}\n📍 ${event?.location}`,
        title: event?.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getAvatarUrl = (avatarUrl?: string, name?: string) => {
    return avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`;
  };

  const ParticipantItem = ({ participant }: { participant: Participant }) => (
    <TouchableOpacity 
      style={styles.participantItem}
      onPress={() => {
        if (participant.user && participant.user_id !== user?.$id) {
          setShowParticipantsModal(false);
          router.push({
            pathname: '/message',
            params: {
              selectedUserId: participant.user.$id,
              selectedUserName: participant.user.name || 'Kullanıcı',
              selectedUserEmail: participant.user.email || '',
              selectedUserAvatar: participant.user.avatar_url || '',
              selectedUserBio: participant.user.bio || '',
              selectedUserLocation: participant.user.location || '',
            }
          });
        }
      }}
      disabled={participant.user_id === user?.$id}
    >
      <Image
        source={{ uri: getAvatarUrl(participant.user?.avatar_url, participant.user?.name) }}
        style={styles.participantAvatar}
      />
      <View style={styles.participantInfo}>
        <View style={styles.participantNameRow}>
          <Text style={styles.participantName}>{participant.user?.name || 'Kullanıcı'}</Text>
          {participant.user_id === user?.$id && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>Sen</Text>
            </View>
          )}
        </View>
        {participant.user?.username && (
          <Text style={styles.participantUsername}>@{participant.user.username}</Text>
        )}
        {participant.user?.location && (
          <View style={styles.participantLocation}>
            <Ionicons name="location-outline" size={12} color={theme.colors.textSecondary} />
            <Text style={styles.participantLocationText}>{participant.user.location}</Text>
          </View>
        )}
      </View>
      {participant.user_id !== user?.$id && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>Etkinlik bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: event.image_url || 'https://via.placeholder.com/400x300?text=Event' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />
          
          {/* Header Buttons */}
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerRightButtons}>
              <TouchableOpacity 
                style={styles.headerButton} 
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              {user?.$id === event.user_id && (
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => {
                    router.push('/profile');
                  }}
                >
                  <Ionicons name="create-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Date & Time */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Tarih</Text>
                <Text style={styles.infoValue}>{formatDate(event.event_date)}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="time" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Saat</Text>
                <Text style={styles.infoValue}>{formatTime(event.event_date)}</Text>
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Konum</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={20} color={theme.colors.primary} />
                <Text style={styles.locationText}>{event.location}</Text>
              </View>
              
              {/* Mini Map */}
              {event.latitude && event.longitude && (
                <View style={styles.mapContainer}>
                  <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={{
                      latitude: parseFloat(event.latitude),
                      longitude: parseFloat(event.longitude),
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                  >
                    <Marker
                      coordinate={{
                        latitude: parseFloat(event.latitude),
                        longitude: parseFloat(event.longitude),
                      }}
                    >
                      <View style={styles.customMarker}>
                        <Ionicons name="location" size={32} color={theme.colors.primary} />
                      </View>
                    </Marker>
                  </MapView>
                  
                  <TouchableOpacity 
                    style={styles.mapOverlay}
                    onPress={() => {
                      Alert.alert('Yakında', 'Harita uygulaması yakında eklenecek.');
                    }}
                  >
                    <Text style={styles.mapOverlayText}>Haritada Göster</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Açıklama</Text>
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>{event.description}</Text>
              </View>
            </View>
          )}

          {/* Event Owner */}
          {eventOwner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Etkinliği Oluşturan</Text>
              <TouchableOpacity
                style={styles.ownerCard}
                onPress={() => {
                  if (eventOwner.$id !== user?.$id) {
                    router.push({
                      pathname: '/message',
                      params: {
                        selectedUserId: eventOwner.$id,
                        selectedUserName: eventOwner.name || 'Kullanıcı',
                        selectedUserEmail: eventOwner.email || '',
                        selectedUserAvatar: eventOwner.avatar_url || eventOwner.avatarUrl || '',
                        selectedUserBio: eventOwner.bio || '',
                        selectedUserLocation: eventOwner.location || '',
                      }
                    });
                  }
                }}
                disabled={eventOwner.$id === user?.$id}
              >
                <Image
                  source={{ uri: getAvatarUrl(eventOwner.avatar_url || eventOwner.avatarUrl, eventOwner.name) }}
                  style={styles.ownerAvatar}
                />
                <View style={styles.ownerInfo}>
                  <View style={styles.ownerNameRow}>
                    <Text style={styles.ownerName}>{eventOwner.name}</Text>
                    {eventOwner.$id === user?.$id && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>Sen</Text>
                      </View>
                    )}
                  </View>
                  {eventOwner.username && (
                    <Text style={styles.ownerUsername}>@{eventOwner.username}</Text>
                  )}
                  {eventOwner.location && (
                    <View style={styles.ownerLocation}>
                      <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                      <Text style={styles.ownerLocationText}>{eventOwner.location}</Text>
                    </View>
                  )}
                </View>
                {eventOwner.$id !== user?.$id && (
                  <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Participants */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Katılımcılar</Text>
            <TouchableOpacity 
              style={styles.participantsCard}
              onPress={() => setShowParticipantsModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.participantsHeader}>
                <View style={styles.participantsCount}>
                  <Ionicons name="people" size={24} color={theme.colors.primary} />
                  <Text style={styles.participantsCountText}>
                    {participants.length} Kişi Katılıyor
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
              </View>
              
              {participants.length === 0 ? (
                <Text style={styles.participantsEmptyText}>
                  Henüz kimse katılmadı. İlk katılan sen ol!
                </Text>
              ) : (
                <View style={styles.participantAvatars}>
                  {participants.slice(0, 5).map((participant, index) => (
                    <Image
                      key={participant.$id}
                      source={{ uri: getAvatarUrl(participant.user?.avatar_url, participant.user?.name) }}
                      style={[styles.participantAvatarSmall, { marginLeft: index > 0 ? -12 : 0 }]}
                    />
                  ))}
                  {participants.length > 5 && (
                    <View style={[styles.participantAvatarSmall, styles.moreParticipants]}>
                      <Text style={styles.moreParticipantsText}>+{participants.length - 5}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Extra bottom padding */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Join/Leave Button */}
      {user?.$id !== event.user_id && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.joinButton, 
              isJoined && styles.joinButtonActive,
              joiningEvent && styles.joinButtonDisabled
            ]}
            onPress={isJoined ? handleLeaveEvent : handleJoinEvent}
            disabled={joiningEvent}
          >
            {joiningEvent ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons 
                  name={isJoined ? "checkmark-circle" : "add-circle"} 
                  size={24} 
                  color="#FFFFFF" 
                />
                <Text style={styles.joinButtonText}>
                  {isJoined ? 'Katıldınız - Ayrıl' : 'Etkinliğe Katıl'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Participants Modal */}
      <Modal
        visible={showParticipantsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowParticipantsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Katılımcılar ({participants.length})
              </Text>
              <TouchableOpacity
                onPress={() => setShowParticipantsModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={28} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {loadingParticipants ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : participants.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
                <Text style={styles.modalEmptyText}>Henüz katılımcı yok</Text>
                <Text style={styles.modalEmptySubtext}>İlk katılan sen ol!</Text>
              </View>
            ) : (
              <FlatList
                data={participants}
                keyExtractor={(item) => item.$id}
                renderItem={({ item }) => <ParticipantItem participant={item} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.participantsList}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerButtons: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 20,
    lineHeight: 36,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  locationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapOverlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  descriptionText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ownerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  ownerUsername: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  ownerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ownerLocationText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  youBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  youBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  participantsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantsCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  participantsEmptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  participantAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  moreParticipants: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12,
  },
  moreParticipantsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomBar: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  joinButtonActive: {
    backgroundColor: '#EF4444',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmpty: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  modalEmptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    opacity: 0.7,
  },
  participantsList: {
    paddingBottom: 20,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  participantAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  participantUsername: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  participantLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  participantLocationText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});