import { useAuth } from "@/lib/auth-context";
import { theme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

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
            Alert.alert("Bilgi", "Hesap silme özelliği yakında eklenecek.");
          },
        },
      ]
    );
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
              onPress={() => router.back()} // Profile geri dön, modal açılacak
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="lock-closed-outline"
              title="Gizlilik"
              subtitle="Profil gizliliği ve veri ayarları"
              onPress={() => Alert.alert("Yakında", "Gizlilik ayarları yakında eklenecek")}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="shield-checkmark-outline"
              title="Güvenlik"
              subtitle="Şifre değiştirme ve iki faktörlü doğrulama"
              onPress={() => Alert.alert("Yakında", "Güvenlik ayarları yakında eklenecek")}
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
                  onValueChange={setNotificationsEnabled}
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
                  onValueChange={setEmailNotifications}
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
              onPress={() => Alert.alert("Yakında", "Dil seçenekleri yakında eklenecek")}
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
              onPress={() => Alert.alert("Yakında", "Yardım merkezi yakında eklenecek")}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="chatbubble-outline"
              title="Geri Bildirim"
              subtitle="Öneri ve şikayetlerinizi iletin"
              onPress={() => Alert.alert("Yakında", "Geri bildirim formu yakında eklenecek")}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="information-circle-outline"
              title="Hakkında"
              subtitle="Versiyon 1.0.0"
              onPress={() => Alert.alert("EventFlow", "Versiyon 1.0.0\n\nİnsanları bir araya getiren etkinlik platformu")}
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
});