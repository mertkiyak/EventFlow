import { useAuth } from "@/lib/auth-context";
import { theme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  
  // Bildirim ayarları
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  
  // Görünüm ayarları
  const [darkMode, setDarkMode] = useState(true);
  
  // Modal states
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  
  // Gizlilik ayarları
  const [profilePrivate, setProfilePrivate] = useState(false);
  const [showEmail, setShowEmail] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [allowMessages, setAllowMessages] = useState(true);
  
  // Güvenlik ayarları
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // Geri bildirim
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState("suggestion");

  const handleDeleteAccount = () => {
    Alert.alert(
      "Hesabı Sil",
      "Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => {
            // TODO: Hesap silme işlemi
            Alert.alert("Onay", "Hesabınızı silmek için e-posta adresinize bir doğrulama linki gönderdik.");
          },
        },
      ]
    );
  };

  const handleSavePrivacySettings = () => {
    // TODO: API çağrısı
    Alert.alert("Başarılı", "Gizlilik ayarlarınız kaydedildi.");
    setPrivacyModalVisible(false);
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert("Hata", "Yeni şifreler eşleşmiyor.");
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır.");
      return;
    }
    
    // TODO: API çağrısı
    Alert.alert("Başarılı", "Şifreniz başarıyla değiştirildi.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSecurityModalVisible(false);
  };

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) {
      Alert.alert("Hata", "Lütfen geri bildiriminizi yazın.");
      return;
    }
    
    // TODO: API çağrısı
    Alert.alert("Teşekkürler", "Geri bildiriminiz alındı. En kısa sürede değerlendireceğiz.");
    setFeedbackText("");
    setFeedbackModalVisible(false);
  };

  const saveNotificationSetting = async (type: string, value: boolean) => {
    // TODO: API çağrısı
    console.log(`Saving ${type}:`, value);
  };

  const SettingsItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    rightComponent 
  }: { 
    icon: string; 
    title: string; 
    subtitle?: string; 
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.settingsItem} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingsItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.settingsItemText}>
          <Text style={styles.settingsItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (showArrow && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      ))}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000ff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hesap Ayarları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap</Text>
          <View style={styles.card}>
            <SettingsItem
              icon="person-outline"
              title="Profili Düzenle"
              subtitle="Adınızı, fotoğrafınızı ve bilgilerinizi düzenleyin"
              onPress={() => router.back()} // EditProfileModal açılacak
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="lock-closed-outline"
              title="Gizlilik"
              subtitle="Profil gizliliği ve veri ayarları"
              onPress={() => setPrivacyModalVisible(true)}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="shield-checkmark-outline"
              title="Güvenlik"
              subtitle="Şifre değiştirme ve iki faktörlü doğrulama"
              onPress={() => setSecurityModalVisible(true)}
            />
          </View>
        </View>

        {/* Bildirimler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirimler</Text>
          <View style={styles.card}>
            <SettingsItem
              icon="notifications-outline"
              title="Push Bildirimleri"
              subtitle="Etkinlik davetleri ve güncellemeler"
              showArrow={false}
              rightComponent={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(value) => {
                    setNotificationsEnabled(value);
                    saveNotificationSetting('push', value);
                  }}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#ffffff"
                />
              }
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="mail-outline"
              title="E-posta Bildirimleri"
              subtitle="Etkinlik özeti ve haberler"
              showArrow={false}
              rightComponent={
                <Switch
                  value={emailNotifications}
                  onValueChange={(value) => {
                    setEmailNotifications(value);
                    saveNotificationSetting('email', value);
                  }}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#ffffff"
                />
              }
            />
          </View>
        </View>

        {/* Görünüm */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Görünüm</Text>
          <View style={styles.card}>
            <SettingsItem
              icon="moon-outline"
              title="Karanlık Mod"
              subtitle="Koyu tema kullan"
              showArrow={false}
              rightComponent={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#ffffff"
                />
              }
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="language-outline"
              title="Dil"
              subtitle="Türkçe"
              onPress={() => {
                Alert.alert(
                  "Dil Seçimi",
                  "Şu anda sadece Türkçe desteklenmektedir. Yakında daha fazla dil eklenecek!",
                  [{ text: "Tamam" }]
                );
              }}
            />
          </View>
        </View>

        {/* Destek */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destek</Text>
          <View style={styles.card}>
            <SettingsItem
              icon="help-circle-outline"
              title="Yardım Merkezi"
              subtitle="SSS ve kullanım kılavuzu"
              onPress={() => setHelpModalVisible(true)}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="chatbubble-outline"
              title="Geri Bildirim"
              subtitle="Öneri ve şikayetlerinizi iletin"
              onPress={() => setFeedbackModalVisible(true)}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="information-circle-outline"
              title="Hakkında"
              subtitle="Versiyon 1.0.0"
              onPress={() => {
                Alert.alert(
                  "EventFlow",
                  "Versiyon 1.0.0\n\nİnsanları bir araya getiren etkinlik platformu.\n\n© 2025 Tüm hakları saklıdır.",
                  [{ text: "Tamam" }]
                );
              }}
            />
          </View>
        </View>

        {/* Tehlikeli İşlemler */}
        <View style={styles.section}>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.dangerItem}
              onPress={signOut}
            >
              <Ionicons name="log-out-outline" size={24} color="#EF4444" />
              <Text style={styles.dangerText}>Çıkış Yap</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity 
              style={styles.dangerItem}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
              <Text style={styles.dangerText}>Hesabı Sil</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionText}>
          EventFlow v1.0.0 {'\n'}
          © 2025 Tüm hakları saklıdır.
        </Text>
      </ScrollView>

      {/* Gizlilik Modal */}
      <Modal
        visible={privacyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gizlilik Ayarları</Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalItem}>
                <View style={styles.modalItemText}>
                  <Text style={styles.modalItemTitle}>Özel Profil</Text>
                  <Text style={styles.modalItemSubtitle}>
                    Sadece takipçileriniz profilinizi görebilir
                  </Text>
                </View>
                <Switch
                  value={profilePrivate}
                  onValueChange={setProfilePrivate}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={styles.modalDivider} />

              <View style={styles.modalItem}>
                <View style={styles.modalItemText}>
                  <Text style={styles.modalItemTitle}>E-posta Adresini Göster</Text>
                  <Text style={styles.modalItemSubtitle}>
                    Diğer kullanıcılar e-postanızı görebilir
                  </Text>
                </View>
                <Switch
                  value={showEmail}
                  onValueChange={setShowEmail}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={styles.modalDivider} />

              <View style={styles.modalItem}>
                <View style={styles.modalItemText}>
                  <Text style={styles.modalItemTitle}>Telefon Numarasını Göster</Text>
                  <Text style={styles.modalItemSubtitle}>
                    Diğer kullanıcılar telefon numaranızı görebilir
                  </Text>
                </View>
                <Switch
                  value={showPhone}
                  onValueChange={setShowPhone}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={styles.modalDivider} />

              <View style={styles.modalItem}>
                <View style={styles.modalItemText}>
                  <Text style={styles.modalItemTitle}>Mesaj İzni</Text>
                  <Text style={styles.modalItemSubtitle}>
                    Diğer kullanıcılar size mesaj gönderebilir
                  </Text>
                </View>
                <Switch
                  value={allowMessages}
                  onValueChange={setAllowMessages}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleSavePrivacySettings}
            >
              <Text style={styles.primaryButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Güvenlik Modal */}
      <Modal
        visible={securityModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSecurityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Güvenlik</Text>
              <TouchableOpacity onPress={() => setSecurityModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>Şifre Değiştir</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Mevcut Şifre"
                placeholderTextColor={theme.colors.textSecondary}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />

              <TextInput
                style={styles.input}
                placeholder="Yeni Şifre"
                placeholderTextColor={theme.colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />

              <TextInput
                style={styles.input}
                placeholder="Yeni Şifre (Tekrar)"
                placeholderTextColor={theme.colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleChangePassword}
              >
                <Text style={styles.secondaryButtonText}>Şifreyi Değiştir</Text>
              </TouchableOpacity>

              <View style={styles.modalDivider} />

              <Text style={styles.sectionLabel}>İki Faktörlü Doğrulama</Text>
              
              <View style={styles.modalItem}>
                <View style={styles.modalItemText}>
                  <Text style={styles.modalItemTitle}>2FA Aktif</Text>
                  <Text style={styles.modalItemSubtitle}>
                    Hesabınıza ekstra güvenlik katmanı ekleyin
                  </Text>
                </View>
                <Switch
                  value={twoFactorEnabled}
                  onValueChange={(value) => {
                    setTwoFactorEnabled(value);
                    if (value) {
                      Alert.alert(
                        "İki Faktörlü Doğrulama",
                        "E-posta adresinize kurulum talimatları gönderdik.",
                        [{ text: "Tamam" }]
                      );
                    }
                  }}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Yardım Modal */}
      <Modal
        visible={helpModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yardım Merkezi</Text>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.helpItem}>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                <Text style={styles.helpItemText}>EventFlow Nasıl Kullanılır?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.helpItem}>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                <Text style={styles.helpItemText}>Etkinlik Nasıl Oluşturulur?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.helpItem}>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                <Text style={styles.helpItemText}>Etkinliklere Nasıl Katılınır?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.helpItem}>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                <Text style={styles.helpItemText}>Profil Ayarları</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.helpItem}>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                <Text style={styles.helpItemText}>Gizlilik ve Güvenlik</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.helpItem}>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                <Text style={styles.helpItemText}>Bildirim Ayarları</Text>
              </TouchableOpacity>

              <View style={styles.modalDivider} />

              <Text style={styles.helpContactText}>
                Daha fazla yardıma mı ihtiyacınız var?
              </Text>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => {
                  setHelpModalVisible(false);
                  Alert.alert("İletişim", "destek@eventflow.com\n\nÇalışma Saatleri: 09:00 - 18:00");
                }}
              >
                <Text style={styles.primaryButtonText}>Destek Ekibiyle İletişime Geç</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Geri Bildirim Modal */}
      <Modal
        visible={feedbackModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFeedbackModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Geri Bildirim</Text>
              <TouchableOpacity onPress={() => setFeedbackModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>Geri Bildirim Türü</Text>
              
              <View style={styles.feedbackTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.feedbackTypeButton,
                    feedbackType === 'suggestion' && styles.feedbackTypeButtonActive
                  ]}
                  onPress={() => setFeedbackType('suggestion')}
                >
                  <Ionicons 
                    name="bulb-outline" 
                    size={20} 
                    color={feedbackType === 'suggestion' ? '#000' : theme.colors.textSecondary} 
                  />
                  <Text style={[
                    styles.feedbackTypeText,
                    feedbackType === 'suggestion' && styles.feedbackTypeTextActive
                  ]}>
                    Öneri
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.feedbackTypeButton,
                    feedbackType === 'bug' && styles.feedbackTypeButtonActive
                  ]}
                  onPress={() => setFeedbackType('bug')}
                >
                  <Ionicons 
                    name="bug-outline" 
                    size={20} 
                    color={feedbackType === 'bug' ? '#000' : theme.colors.textSecondary} 
                  />
                  <Text style={[
                    styles.feedbackTypeText,
                    feedbackType === 'bug' && styles.feedbackTypeTextActive
                  ]}>
                    Hata
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.feedbackTypeButton,
                    feedbackType === 'complaint' && styles.feedbackTypeButtonActive
                  ]}
                  onPress={() => setFeedbackType('complaint')}
                >
                  <Ionicons 
                    name="alert-circle-outline" 
                    size={20} 
                    color={feedbackType === 'complaint' ? '#000' : theme.colors.textSecondary} 
                  />
                  <Text style={[
                    styles.feedbackTypeText,
                    feedbackType === 'complaint' && styles.feedbackTypeTextActive
                  ]}>
                    Şikayet
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionLabel}>Mesajınız</Text>
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Geri bildiriminizi buraya yazın..."
                placeholderTextColor={theme.colors.textSecondary}
                value={feedbackText}
                onChangeText={setFeedbackText}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />

              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleSendFeedback}
              >
                <Text style={styles.primaryButtonText}>Gönder</Text>
              </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingsItemText: {
    flex: 1,
  },
  settingsItemTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 68,
  },
  dangerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  dangerText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "500",
  },
  versionText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalItemText: {
    flex: 1,
    marginRight: 16,
  },
  modalItemTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  modalItemSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  modalDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
  },
  sectionLabel: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    color: theme.colors.textPrimary,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  helpItemText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    flex: 1,
  },
  helpContactText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  feedbackTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  feedbackTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
  },
  feedbackTypeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  feedbackTypeText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  feedbackTypeTextActive: {
    color: '#000',
  },
});