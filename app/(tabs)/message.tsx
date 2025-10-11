import { useAuth } from '@/lib/auth-context';
import messageService, { Message } from '@/lib/messageService';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Demo kullanıcılar listesi
const DEMO_USERS = [
  {
    $id: 'user1',
    name: 'Sophia',
    avatar: 'https://i.pravatar.cc/150?img=1',
    email: 'sophia@example.com',
    status: 'online',
    lastMessage: 'Hey! How are you?',
    lastMessageTime: new Date(Date.now() - 5 * 60000),
    unreadCount: 2,
  },
  {
    $id: 'user2',
    name: 'James',
    avatar: 'https://i.pravatar.cc/150?img=12',
    email: 'james@example.com',
    status: 'offline',
    lastMessage: 'See you tomorrow!',
    lastMessageTime: new Date(Date.now() - 120 * 60000),
    unreadCount: 0,
  },
  {
    $id: 'user3',
    name: 'Emma',
    avatar: 'https://i.pravatar.cc/150?img=5',
    email: 'emma@example.com',
    status: 'online',
    lastMessage: 'Thanks for your help',
    lastMessageTime: new Date(Date.now() - 1440 * 60000),
    unreadCount: 1,
  },
  {
    $id: 'user4',
    name: 'Oliver',
    avatar: 'https://i.pravatar.cc/150?img=13',
    email: 'oliver@example.com',
    status: 'online',
    lastMessage: 'Perfect!',
    lastMessageTime: new Date(Date.now() - 2880 * 60000),
    unreadCount: 0,
  },
];

export default function MessageScreen() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<typeof DEMO_USERS[0] | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Kullanıcı seçildiğinde mesajları yükle
  useEffect(() => {
    if (!user || !selectedUser) return;

    loadMessages();
    
    const conversationId = messageService.createConversationId(user.$id, selectedUser.$id);
    
    const unsubscribe = messageService.subscribeToMessages(
      conversationId,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
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

  const handleUserSelect = (selectedUser: typeof DEMO_USERS[0]) => {
    setSelectedUser(selectedUser);
    setMessages([]);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setMessages([]);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} dk`;
    } else if (diffHours < 24) {
      return `${diffHours} sa`;
    } else if (diffDays < 7) {
      return `${diffDays} gün`;
    } else {
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    }
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
          <TouchableOpacity style={styles.listHeaderButton}>
            <Ionicons name="create-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Kullanıcı Listesi */}
        <FlatList
          data={DEMO_USERS}
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
                    source={{ uri: item.avatar }}
                    style={styles.userAvatar}
                  />
                  {item.status === 'online' && (
                    <View style={styles.onlineIndicator} />
                  )}
                </View>
                
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text 
                    style={styles.userLastMessage}
                    numberOfLines={1}
                  >
                    {item.lastMessage}
                  </Text>
                </View>
              </View>

              <View style={styles.userItemRight}>
                <Text style={styles.messageTime}>
                  {formatTime(item.lastMessageTime)}
                </Text>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
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
              source={{ uri: selectedUser.avatar }}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.headerName}>{selectedUser.name}</Text>
              <Text style={styles.headerStatus}>{selectedUser.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerButton}>
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
                        source={{ uri: selectedUser.avatar }}
                        style={styles.messageAvatar}
                      />
                    )}
                    
                    <View style={[
                      styles.messageBubble,
                      isMyMessage ? styles.myMessage : styles.otherMessage
                    ]}>
                      <Text style={styles.messageText}>{message.text}</Text>
                      <Text style={styles.messageTime}>
                        {new Date(message.$createdAt).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
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
            <TouchableOpacity style={styles.attachButton}>
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
                  source={{ uri: selectedUser.avatar }}
                  style={styles.profileImage}
                />
              </View>

              <Text style={styles.profileName}>{selectedUser.name}</Text>
              <Text style={styles.profileStatus}>
                {selectedUser.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
              </Text>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color="#93c5fd" />
                  <Text style={styles.infoText}>{selectedUser.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={20} color="#93c5fd" />
                  <Text style={styles.infoText}>İzmir, Türkiye</Text>
                </View>
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

              <View style={styles.bioSection}>
                <Text style={styles.bioTitle}>Hakkında</Text>
                <Text style={styles.bioText}>
                  Sanat ve yaratıcılık tutkunu. Doğadan ilham alarak soyut resimler yapıyorum.
                </Text>
              </View>
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
  
  // Liste Header Stilleri (GÜNCELLENDİ)
  listHeader: {
    position: 'relative', // Mutlak konumlandırılmış alt öğe için eklendi
    flexDirection: 'row',
    justifyContent: 'center', // Başlığı ortalamak için değiştirildi
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
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

  // Kullanıcı Liste Öğesi Stilleri
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

  // Mesajlaşma Header Stilleri
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

  // Mesaj Stilleri
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
  },

  // Input Stilleri
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

  // Modal Stilleri
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


