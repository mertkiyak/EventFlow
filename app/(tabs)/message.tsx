import { DATABASE_ID, databases } from '@/lib/appwrite';
import { useAuth } from '@/lib/auth-context';
import messageService, { Message } from '@/lib/messageService';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Appwrite Collection ID'lerini buraya ekleyin
const USERS_COLLECTION_ID = "68e85ad500181492effc"; // Buraya users collection ID'nizi yazın

interface UserProfile {
  $id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
}

interface ConversationUser extends UserProfile {
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isOnline?: boolean;
}

export default function MessageScreen() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<ConversationUser | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState<ConversationUser[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // Konuşmaları yükle
  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  // Kullanıcı seçildiğinde mesajları yükle
  useEffect(() => {
    if (!user || !selectedUser) return;

    loadMessages();
    
    const conversationId = messageService.createConversationId(user.$id, selectedUser.$id);
    
    const unsubscribe = messageService.subscribeToMessages(
      conversationId,
      (newMessage) => {
        setMessages((prev) => {
          // Duplicate kontrolü
          if (prev.some(msg => msg.$id === newMessage.$id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
        scrollToBottom();
        
        if (newMessage.senderId !== user.$id) {
          messageService.markMessagesAsRead(user.$id, selectedUser.$id);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, selectedUser]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoadingConversations(true);
      
      // Kullanıcının tüm mesajlarını al (gönderdiği ve aldığı)
      const sentMessages = await messageService.getMessagesBySender(user.$id);
      const receivedMessages = await messageService.getMessagesByReceiver(user.$id);
      
      // Tüm benzersiz kullanıcı ID'lerini topla
      const userIds = new Set<string>();
      
      sentMessages.forEach((msg: Message) => {
        if (msg.receiverId !== user.$id) {
          userIds.add(msg.receiverId);
        }
      });
      
      receivedMessages.forEach((msg: Message) => {
        if (msg.senderId !== user.$id) {
          userIds.add(msg.senderId);
        }
      });

      // Her kullanıcı için profil ve son mesaj bilgilerini al
      const conversationPromises = Array.from(userIds).map(async (userId) => {
        try {
          const userDoc = await databases.getDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            userId
          );
          
          const userProfile: UserProfile = {
            $id: userDoc.$id,
            name: userDoc.name || 'İsimsiz Kullanıcı',
            email: userDoc.email || '',
            avatar_url: userDoc.avatar_url,
            bio: userDoc.bio,
            location: userDoc.location,
          };

          // Bu kullanıcı ile olan tüm mesajları al
          const allMessagesWithUser = [...sentMessages, ...receivedMessages]
            .filter((msg: Message) => 
              msg.senderId === userId || msg.receiverId === userId
            )
            .sort((a: Message, b: Message) => 
              new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
            );

          const lastMessage = allMessagesWithUser[0];
          
          // Okunmamış mesaj sayısı
          const unreadCount = receivedMessages.filter(
            (msg: Message) => msg.senderId === userId && !msg.isRead
          ).length;

          return {
            ...userProfile,
            lastMessage: lastMessage?.text || '',
            lastMessageTime: lastMessage ? new Date(lastMessage.$createdAt) : new Date(),
            unreadCount,
            isOnline: Math.random() > 0.5, // Bu kısmı presence sistemi ile değiştirebilirsiniz
          } as ConversationUser;
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          return null;
        }
      });

      const conversationResults = await Promise.all(conversationPromises);
      const validConversations = conversationResults
        .filter((conv): conv is ConversationUser => conv !== null)
        .sort((a, b) => {
          const timeA = a.lastMessageTime?.getTime() || 0;
          const timeB = b.lastMessageTime?.getTime() || 0;
          return timeB - timeA;
        });

      setConversations(validConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async () => {
    if (!user || !selectedUser) return;
    
    try {
      setLoading(true);
      const fetchedMessages = await messageService.getMessages(user.$id, selectedUser.$id);
      setMessages(fetchedMessages);
      
      await messageService.markMessagesAsRead(user.$id, selectedUser.$id);
      
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Hata', 'Mesajlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !selectedUser || sending) return;

    const textToSend = messageText.trim();
    setMessageText('');

    try {
      setSending(true);
      await messageService.sendMessage(user.$id, selectedUser.$id, textToSend);
      scrollToBottom();
      
      // Konuşmaları yenile
      loadConversations();
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert(
        'Hata', 
        error.message || 'Mesaj gönderilemedi. Lütfen tekrar deneyin.',
        [{ text: 'Tamam' }]
      );
      setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

  const handleUserSelect = (selectedUser: ConversationUser) => {
    setSelectedUser(selectedUser);
    setMessages([]);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setMessages([]);
    loadConversations(); // Listeye dönerken konuşmaları yenile
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk`;
    if (diffHours < 24) return `${diffHours} sa`;
    if (diffDays < 7) return `${diffDays} gün`;
    
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const getAvatarUrl = (avatarUrl?: string) => {
    return avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser?.name || 'User')}&background=random`;
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

  // Kullanıcı listesi görünümü
  if (!selectedUser) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000ff" />
        
        {/* Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTitle}>Mesajlar</Text>
          <TouchableOpacity 
            style={styles.listHeaderButton}
            onPress={() => Alert.alert('Bilgi', 'Yeni sohbet özelliği yakında!')}
          >
            <Ionicons name="create-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Kullanıcı Listesi */}
        {loadingConversations ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#386ae0ff" />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#434343ff" />
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
                onPress={() => handleUserSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.userItemLeft}>
                  <View style={styles.avatarContainer}>
                    <Image 
                      source={{ uri: getAvatarUrl(item.avatar_url) }}
                      style={styles.userAvatar}
                    />
                    {item.isOnline && (
                      <View style={styles.onlineIndicator} />
                    )}
                  </View>
                  
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text 
                      style={styles.userLastMessage}
                      numberOfLines={1}
                    >
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
            showsVerticalScrollIndicator={false}
            refreshing={loadingConversations}
            onRefresh={loadConversations}
          />
        )}
      </SafeAreaView>
    );
  }

  // Mesajlaşma ekranı
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000ff" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
              source={{ uri: getAvatarUrl(selectedUser.avatar_url) }}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.headerName}>{selectedUser.name}</Text>
              <Text style={styles.headerStatus}>
                {selectedUser.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
              </Text>
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
            <ActivityIndicator size="large" color="#386ae0ff" />
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
                <Ionicons name="chatbubbles-outline" size={64} color="#434343ff" />
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
                        source={{ uri: getAvatarUrl(selectedUser.avatar_url) }}
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
                            name={message.isRead ? "checkmark-done" : "checkmark"} 
                            size={16} 
                            color={message.isRead ? "#4ade80" : "#93c5fd"} 
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
              onChangeText={setMessageText}
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
                  source={{ uri: getAvatarUrl(selectedUser.avatar_url) }}
                  style={styles.profileImage}
                />
              </View>

              <Text style={styles.profileName}>{selectedUser.name}</Text>
              <Text style={styles.profileStatus}>
                {selectedUser.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
              </Text>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color="#93c5fd" />
                  <Text style={styles.infoText}>{selectedUser.email}</Text>
                </View>
                {selectedUser.location && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={20} color="#93c5fd" />
                    <Text style={styles.infoText}>{selectedUser.location}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton
                ]}
                onPress={handleFollowToggle}
              >
                <Ionicons 
                  name={isFollowing ? "checkmark-circle" : "person-add"} 
                  size={24} 
                  color="#ffffff" 
                />
                <Text style={styles.followButtonText}>
                  {isFollowing ? "Takip Ediliyor" : "Takip Et"}
                </Text>
              </TouchableOpacity>

              {selectedUser.bio && (
                <View style={styles.bioSection}>
                  <Text style={styles.bioTitle}>Hakkında</Text>
                  <Text style={styles.bioText}>
                    {selectedUser.bio}
                  </Text>
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
    backgroundColor: '#000000ff',
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
    color: '#ffffff',
    fontSize: 16,
  },

  listHeader: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  listHeaderButton: {
    position: 'absolute', 
    right: 20, 
    padding: 0,
  },

  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#000000ff',
  },
  userItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4ade80',
    borderWidth: 2,
    borderColor: '#000000ff',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  userLastMessage: {
    fontSize: 15,
    color: '#93c5fd',
  },
  userItemRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  messageTime: {
    fontSize: 13,
    color: '#93c5fd',
  },
  unreadBadge: {
    backgroundColor: '#386ae0ff',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 88,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(23, 23, 23, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerStatus: {
    color: '#4ade80',
    fontSize: 12,
  },
  headerButton: {
    padding: 4,
  },

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
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    color: '#93c5fd',
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
    backgroundColor: '#386ae0ff',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#434343ff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#ffffff',
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
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },

  inputContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 16 : 16,
    backgroundColor: '#000000ff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(67, 67, 67, 0.6)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  attachButton: {
    padding: 4,
  },
  sendButton: {
    backgroundColor: '#386ae0ff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  profileModal: {
    backgroundColor: '#1a1a1aff',
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
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
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
    borderColor: '#386ae0ff',
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  profileStatus: {
    fontSize: 16,
    color: '#4ade80',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoSection: {
    backgroundColor: 'rgba(67, 67, 67, 0.3)',
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
    color: '#ffffff',
  },
  followButton: {
    backgroundColor: '#386ae0ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  followingButton: {
    backgroundColor: '#4ade80',
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bioSection: {
    backgroundColor: 'rgba(67, 67, 67, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 15,
    color: '#d1d5db',
    lineHeight: 22,
  },
});