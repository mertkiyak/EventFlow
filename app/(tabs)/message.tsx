import { useAuth } from '@/lib/auth-context';
import messageService, { Conversation, Message, UserProfile } from '@/lib/messageService';
import { createMessageNotification } from '@/lib/notifications';
import { theme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const PROFILES_COLLECTION_ID = "68e85ad500181492effc";

interface ConversationWithProfile extends Conversation {
  profile?: UserProfile;
  unreadCount: number;
}

export default function MessageScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithProfile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout  | undefined>(undefined);

  // Konuşmaları yükle
  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  // URL parametrelerinden gelen kullanıcıyı otomatik seç
  useEffect(() => {
    if (params.selectedusername && user) {
      loadConversationFromParams();
    }
  }, [params.selectedusername, user]);

  // Kullanıcı seçildiğinde mesajları yükle ve realtime dinle
useEffect(() => {
  if (!user || !selectedProfile) return;

  loadMessages();
  
  const conversationId = messageService.createConversationId(user.$id, selectedProfile.username);
  
  const unsubscribe = messageService.subscribeToMessages(
    conversationId,
    (newMessage) => {
      console.log('Realtime message received:', newMessage.$id);
      
      setMessages((prev) => {
        // Mesaj zaten varsa ekleme (duplicate prevention)
        if (prev.some(msg => msg.$id === newMessage.$id)) {
          console.log('Message already exists, skipping:', newMessage.$id);
          return prev;
        }
        
        // Kendi gönderdiğimiz mesajı realtime'dan tekrar ekleme
        // (Optimistic UI zaten ekliyor)
        if (newMessage.senderId === user.$id) {
          // Temp ID'li mesaj varsa değiştir, yoksa ekleme (zaten optimistic UI'dan var)
          const hasTempMessage = prev.some(msg => msg.$id.startsWith('temp-'));
          if (!hasTempMessage) {
            console.log('Own message from realtime (no temp), skipping:', newMessage.$id);
            return prev;
          }
        }
        
        console.log('Adding message to state:', newMessage.$id);
        return [...prev, newMessage];
      });
      
      scrollToBottom();
      
      // Karşı taraftan gelen mesajları okundu işaretle
      if (newMessage.senderId !== user.$id) {
        messageService.markMessagesAsRead(user.$id, selectedProfile.username);
      }
    }
  );

  return () => {
    unsubscribe();
  };
}, [user, selectedProfile]);
  const loadConversationFromParams = async () => {
    if (!user) return;

    try {
      const username = params.selectedusername as string;
      let profile = await messageService.getProfile(username);

      if (!profile) {
        // Profil yoksa varsayılan oluştur
        profile = {
          $id: username,
          username: username,
          name: (params.selectedUserName as string) || 'Kullanıcı',
          email: (params.selectedUserEmail as string) || '',
          avatar_url: params.selectedUserAvatar as string,
          bio: params.selectedUserBio as string,
          location: params.selectedUserLocation as string,
          age: 0,
          interests: [],
          followers: 0,
          following: 0,
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString(),
        };
      }

      setSelectedProfile(profile);

      // Conversation oluştur veya getir
      const conversation = await messageService.getOrCreateConversation(user.$id, username);
      const unreadCount = await messageService.getConversationUnreadCount(user.$id, username);

      setSelectedConversation({
        ...conversation,
        profile,
        unreadCount,
      });
    } catch (error) {
      console.error('Error loading conversation from params:', error);
      Alert.alert('Hata', 'Konuşma yüklenirken bir hata oluştu');
    }
  };

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoadingConversations(true);
      
      const userConversations = await messageService.getUserConversations(user.$id);
      
      const conversationsWithProfiles = await Promise.all(
        userConversations.map(async (conv) => {
          const otherusername = conv.participants.find(id => id !== user.$id);
          
          if (!otherusername) return null;

          const profile = await messageService.getProfile(otherusername);
          const unreadCount = await messageService.getConversationUnreadCount(user.$id, otherusername);

          return {
            ...conv,
            profile,
            unreadCount,
          } as ConversationWithProfile;
        })
      );

      const validConversations = conversationsWithProfiles
        .filter((conv): conv is ConversationWithProfile => conv !== null)
        .sort((a, b) => {
          const timeA = new Date(a.lastMessageTime || 0).getTime();
          const timeB = new Date(b.lastMessageTime || 0).getTime();
          return timeB - timeA;
        });

      setConversations(validConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Hata', 'Konuşmalar yüklenirken bir hata oluştu');
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async () => {
    if (!user || !selectedProfile) return;
    
    try {
      setLoading(true);
      const fetchedMessages = await messageService.getMessages(
        user.$id, 
        selectedProfile.username,
        50,
        0
      );
      
      setMessages(fetchedMessages);
      
      await messageService.markMessagesAsRead(user.$id, selectedProfile.username);
      
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Hata', 'Mesajlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

// handleSendMessage fonksiyonunu değiştir - message.tsx içinde

const handleSendMessage = async () => {
  if (!messageText.trim() || !user || !selectedProfile || sending) return;

  const textToSend = messageText.trim();
  const tempId = `temp-${Date.now()}`;
  
  setMessageText('');
  setSending(true);

  // Optimistic UI: Mesajı hemen göster
  const optimisticMessage: Message = {
    $id: tempId,
    senderId: user.$id,
    receiverId: selectedProfile.username,
    text: textToSend,
    conversationId: messageService.createConversationId(user.$id, selectedProfile.username),
    $createdAt: new Date().toISOString(),
    isRead: false,
    status: 'sent',
  };

  setMessages(prev => [...prev, optimisticMessage]);
  scrollToBottom();

  try {
    // Mesajı gönder
    const sentMessage = await messageService.sendMessage(
      user.$id,
      selectedProfile.username,
      textToSend
    );

    console.log('Message sent successfully:', sentMessage.$id);

    // Optimistic mesajı gerçek mesajla değiştir
    // ÖNEMLI: Realtime'dan gelen mesajı engellemek için state'i hemen güncelle
    setMessages(prev => {
      // Önce optimistic mesajı kaldır
      const withoutOptimistic = prev.filter(msg => msg.$id !== tempId);
      
      // Gerçek mesaj zaten realtime'dan geldiyse ekleme
      if (withoutOptimistic.some(msg => msg.$id === sentMessage.$id)) {
        return withoutOptimistic;
      }
      
      // Gerçek mesajı ekle
      return [...withoutOptimistic, sentMessage];
    });

    // Bildirim gönder
    try {
      await createMessageNotification(
        selectedProfile.username,
        user.name || 'Bir kullanıcı',
        sentMessage.$id,
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`
      );
    } catch (notifError) {
      console.warn('Notification error:', notifError);
    }

    // Konuşmaları güncelle
    loadConversations();
    
  } catch (error: any) {
    console.error('Error sending message:', error);
    
    // Optimistic mesajı kaldır
    setMessages(prev => prev.filter(msg => msg.$id !== tempId));
    
    // Kullanıcıya hata mesajı göster
    Alert.alert(
      'Mesaj Gönderilemedi',
      error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.',
      [{ text: 'Tamam' }]
    );
    
    // Mesajı geri yükle
    setMessageText(textToSend);
  } finally {
    setSending(false);
  }
};

// Realtime subscription'ı da güncelle - useEffect içinde
useEffect(() => {
  if (!user || !selectedProfile) return;

  loadMessages();
  
  const conversationId = messageService.createConversationId(user.$id, selectedProfile.username);
  
  const unsubscribe = messageService.subscribeToMessages(
    conversationId,
    (newMessage) => {
      console.log('Realtime message received:', newMessage.$id);
      
      setMessages((prev) => {
        // Mesaj zaten varsa ekleme (duplicate prevention)
        if (prev.some(msg => msg.$id === newMessage.$id)) {
          console.log('Message already exists, skipping:', newMessage.$id);
          return prev;
        }
        
        // Kendi gönderdiğimiz mesajı realtime'dan tekrar ekleme
        // (Optimistic UI zaten ekliyor)
        if (newMessage.senderId === user.$id) {
          // Temp ID'li mesaj varsa değiştir, yoksa ekleme (zaten optimistic UI'dan var)
          const hasTempMessage = prev.some(msg => msg.$id.startsWith('temp-'));
          if (!hasTempMessage) {
            console.log('Own message from realtime (no temp), skipping:', newMessage.$id);
            return prev;
          }
        }
        
        console.log('Adding message to state:', newMessage.$id);
        return [...prev, newMessage];
      });
      
      scrollToBottom();
      
      // Karşı taraftan gelen mesajları okundu işaretle
      if (newMessage.senderId !== user.$id) {
        messageService.markMessagesAsRead(user.$id, selectedProfile.username);
      }
    }
  );

  return () => {
    unsubscribe();
  };
}, [user, selectedProfile]);

  const handleTyping = (text: string) => {
    setMessageText(text);

    // Typing indicator logic
    if (!isTyping && text.trim()) {
      setIsTyping(true);
      // TODO: Publish typing event
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // TODO: Publish stopped typing event
    }, 2000)as unknown as NodeJS.Timeout;
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setSelectedProfile(null);
    setMessages([]);
    loadConversations();
  };

  const handleConversationSelect = (conversation: ConversationWithProfile) => {
    setSelectedConversation(conversation);
    setSelectedProfile(conversation.profile || null);
    setMessages([]);
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk`;
    if (diffHours < 24) return `${diffHours} sa`;
    if (diffDays < 7) return `${diffDays} gün`;
    
    return dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const getAvatarUrl = (avatarUrl?: string, name?: string) => {
    return avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`;
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Lütfen giriş yapın</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Conversation list view
  if (!selectedConversation || !selectedProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTitle}>Mesajlar</Text>
          <TouchableOpacity 
            style={styles.listHeaderButton}
            onPress={() => Alert.alert('Bilgi', 'Yeni sohbet özelliği yakında!')}
          >
            <Ionicons name="create-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {loadingConversations ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.secondary} />
            <Text style={styles.emptyText}>Henüz konuşma yok</Text>
            <Text style={styles.emptySubText}>Kullanıcılarla mesajlaşmaya başlayın</Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.$id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.userItem}
                onPress={() => handleConversationSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.userItemLeft}>
                  <Image 
                    source={{ uri: getAvatarUrl(item.profile?.avatar_url, item.profile?.name) }}
                    style={styles.userAvatar}
                  />
                  
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.profile?.name || 'Kullanıcı'}</Text>
                    <Text style={styles.userLastMessage} numberOfLines={1}>
                      {item.lastMessage || 'Mesaj yok'}
                    </Text>
                  </View>
                </View>

                <View style={styles.userItemRight}>
                  <Text style={styles.messageTime}>
                    {item.lastMessageTime ? formatTime(item.lastMessageTime) : ''}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>
                        {item.unreadCount > 99 ? '99+' : item.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl
                refreshing={loadingConversations}
                onRefresh={loadConversations}
                tintColor={theme.colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    );
  }

  // Message view
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToList}
          >
            <Ionicons name="chevron-back" size={28} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.headerCenter}
            onPress={() => setShowProfile(true)}
            activeOpacity={0.7}
          >
            <Image 
              source={{ uri: getAvatarUrl(selectedProfile.avatar_url, selectedProfile.name) }}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.headerName}>{selectedProfile.name}</Text>
              {otherUserTyping ? (
                <Text style={styles.headerTyping}>yazıyor...</Text>
              ) : (
                <Text style={styles.headerStatus}>Çevrimiçi</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => Alert.alert('Bilgi', 'Arama özelliği yakında!')}
          >
            <Ionicons name="call-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.secondary} />
                <Text style={styles.emptyText}>Henüz mesaj yok</Text>
                <Text style={styles.emptySubText}>İlk mesajı göndererek sohbeti başlatın</Text>
              </View>
            ) : (
              messages.map((message) => {
                const isMyMessage = message.senderId === user.$id;
                
                return (
                  <View 
                    key={message.$id} 
                    style={[
                      styles.messageRow,
                      isMyMessage && styles.messageRowRight
                    ]}
                  >
                    {!isMyMessage && (
                      <Image 
                        source={{ uri: getAvatarUrl(selectedProfile.avatar_url, selectedProfile.name) }}
                        style={styles.messageAvatar}
                      />
                    )}
                    
                    <View style={[
                      styles.messageBubble,
                      isMyMessage ? styles.myMessage : styles.otherMessage
                    ]}>
                      <Text style={styles.messageText}>{message.text}</Text>
                      <View style={styles.messageFooter}>
                        <Text style={styles.messageTimeInBubble}>
                          {new Date(message.$createdAt).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                        {isMyMessage && (
                          <Ionicons 
                            name={message.status === 'read' ? "checkmark-done" : "checkmark"} 
                            size={16} 
                            color={message.status === 'read' ? "#4ade80" : "#93c5fd"} 
                          />
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Mesaj yazın..."
              placeholderTextColor="#93c5fd"
              value={messageText}
              onChangeText={handleTyping}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity 
              style={styles.attachButton}
              onPress={() => Alert.alert('Bilgi', 'Dosya gönderme özelliği yakında!')}
            >
              <Ionicons name="image-outline" size={24} color="#93c5fd" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!messageText.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Profile Modal */}
      <Modal
        visible={showProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profil</Text>
              <TouchableOpacity onPress={() => setShowProfile(false)}>
                <Ionicons name="close" size={28} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.profileContent}>
              <View style={styles.profileImageContainer}>
                <Image 
                  source={{ uri: getAvatarUrl(selectedProfile.avatar_url, selectedProfile.name) }}
                  style={styles.profileImage}
                />
              </View>

              <Text style={styles.profileName}>{selectedProfile.name}</Text>
              <Text style={styles.profileStatus}>Çevrimiçi</Text>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color="#93c5fd" />
                  <Text style={styles.infoText}>{selectedProfile.email}</Text>
                </View>
                {selectedProfile.location && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={20} color="#93c5fd" />
                    <Text style={styles.infoText}>{selectedProfile.location}</Text>
                  </View>
                )}
              </View>

              {selectedProfile.bio && (
                <View style={styles.bioSection}>
                  <Text style={styles.bioTitle}>Hakkında</Text>
                  <Text style={styles.bioText}>{selectedProfile.bio}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
  },

  // List Header
  listHeader: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: `${theme.colors.surface}cc`,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  listHeaderButton: {
    position: 'absolute',
    right: 20,
    padding: 0,
  },

  // Conversation List
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.background,
  },
  userItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  userLastMessage: {
    fontSize: 15,
    color: theme.colors.secondary,
  },
  userItemRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  messageTime: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 88,
  },

  // Message Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: `${theme.colors.surface}cc`,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingHorizontal: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerName: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerStatus: {
    color: theme.colors.accent,
    fontSize: 12,
  },
  headerTyping: {
    color: theme.colors.primary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  headerButton: {
    padding: 4,
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    color: theme.colors.secondary,
    fontSize: 14,
    marginTop: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '80%',
    marginBottom: 8,
  },
  messageRowRight: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    maxWidth: '100%',
  },
  myMessage: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: theme.colors.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  messageTimeInBubble: {
    color: `${theme.colors.textPrimary}b3`,
    fontSize: 12,
  },

  // Input
  inputContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 16 : 16,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.surface}99`,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  attachButton: {
    padding: 4,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },

  // Profile Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  profileModal: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
  profileContent: {
    padding: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  profileStatus: {
    fontSize: 16,
    color: theme.colors.accent,
    textAlign: 'center',
    marginBottom: 24,
  },
  infoSection: {
    backgroundColor: `${theme.colors.border}4d`,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  bioSection: {
    backgroundColor: `${theme.colors.border}4d`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
});