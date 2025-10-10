import { useAuth } from '@/lib/auth-context';
import messageService, { Message } from '@/lib/messageService';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Demo için kullanıcı bilgisi - Gerçek uygulamada parametre olarak gelecek
const OTHER_USER = {
  $id: 'OTHER_USER_ID', // Karşı kullanıcının ID'si
  name: 'Sophia',
  avatar: 'https://i.pravatar.cc/150?img=1',
  email: 'sophia@example.com',
  status: 'online',
};

export default function MessageScreen() {
  const { user } = useAuth(); // Mevcut kullanıcı
  const [showProfile, setShowProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Konuşma ID'si
  const conversationId = messageService.createConversationId(user?.$id || '', OTHER_USER.$id);

  // Mesajları yükle
  useEffect(() => {
    if (!user) return;

    loadMessages();
    
    // Gerçek zamanlı dinleme
    const unsubscribe = messageService.subscribeToMessages(
      conversationId,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();
        
        // Karşı taraftan gelen mesajı okundu olarak işaretle
        if (newMessage.senderId !== user.$id) {
          messageService.markMessagesAsRead(user.$id, OTHER_USER.$id);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const fetchedMessages = await messageService.getMessages(user.$id, OTHER_USER.$id);
      setMessages(fetchedMessages);
      
      // Mesajları okundu olarak işaretle
      await messageService.markMessagesAsRead(user.$id, OTHER_USER.$id);
      
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Hata', 'Mesajlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // const handleSendMessage = async () => {
  //   if (!messageText.trim() || !user || sending) return;

  //   const textToSend = messageText.trim();
  //   setMessageText(''); // Input'u hemen temizle

  //   try {
  //     setSending(true);
  //     await messageService.sendMessage(user.$id, OTHER_USER.$id, textToSend);
  //     scrollToBottom();
  //   } catch (error) {
  //     console.error('Error sending message:', error);
  //     Alert.alert('Hata', 'Mesaj gönderilemedi');
  //     setMessageText(textToSend); // Hata durumunda metni geri yükle
  //   } finally {
  //     setSending(false);
  //   }
  // };
  const handleSendMessage = async () => {
  if (!messageText.trim() || !user || sending) return;

  const textToSend = messageText.trim();
  setMessageText(''); // Input'u hemen temizle

  try {
    setSending(true);
    console.log('Attempting to send message...');
    console.log('User ID:', user.$id);
    console.log('Other User ID:', OTHER_USER.$id);
    
    await messageService.sendMessage(user.$id, OTHER_USER.$id, textToSend);
    console.log('Message sent successfully');
    scrollToBottom();
  } catch (error: any) {
    console.error('Error sending message:', error);
    Alert.alert(
      'Hata', 
      error.message || 'Mesaj gönderilemedi. Lütfen tekrar deneyin.',
      [{ text: 'Tamam' }]
    );
    setMessageText(textToSend); // Hata durumunda metni geri yükle
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

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Lütfen giriş yapın</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            style={styles.headerCenter}
            onPress={() => setShowProfile(true)}
            activeOpacity={0.7}
          >
            <Image 
              source={{ uri: OTHER_USER.avatar }}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.headerName}>{OTHER_USER.name}</Text>
              <Text style={styles.headerStatus}>{OTHER_USER.status}</Text>
            </View>
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
                        source={{ uri: OTHER_USER.avatar }}
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
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profil</Text>
              <TouchableOpacity onPress={() => setShowProfile(false)}>
                <Ionicons name="close" size={28} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Profile Content */}
            <ScrollView style={styles.profileContent}>
              <View style={styles.profileImageContainer}>
                <Image 
                  source={{ uri: OTHER_USER.avatar }}
                  style={styles.profileImage}
                />
              </View>

              <Text style={styles.profileName}>{OTHER_USER.name}</Text>
              <Text style={styles.profileStatus}>
                {OTHER_USER.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
              </Text>

              {/* Profile Info */}
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color="#93c5fd" />
                  <Text style={styles.infoText}>{OTHER_USER.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={20} color="#93c5fd" />
                  <Text style={styles.infoText}>İzmir, Türkiye</Text>
                </View>
              </View>

              {/* Follow Button */}
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

              {/* Bio Section */}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(23, 23, 23, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerStatus: {
    color: '#4ade80',
    fontSize: 12,
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
  messageTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    marginTop: 4,
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
  // Modal Styles (önceki stillerle aynı...)
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