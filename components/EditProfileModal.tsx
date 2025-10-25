import { theme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface ProfileData {
  name: string;
  username: string;
  age: number;
  location: string;
  bio: string;
  interests: string[];
  avatarUrl: string;
}

interface EditProfileModalProps {
  visible: boolean;
  onDismiss: () => void;
  profileData: ProfileData;
  onSave: (data: ProfileData) => void;
}

// Öneri listesi
const SUGGESTED_INTERESTS = [
  '✈️ Seyahat',
  '🌲 Doğa Yürüyüşü',
  '📚 Kitap Okuma',
  '🎵 Müzik',
  '🎬 Sinema',
  '🎨 Sanat',
  '💻 Teknoloji',
  '📸 Fotoğrafçılık',
  '🏃 Spor',
  '🍳 Yemek Pişirme',
  '🎮 Oyun',
  '✍️ Yazma',
  '🧘 Yoga',
  '🎭 Tiyatro',
  '🎸 Müzik Aleti',
  '🏊 Yüzme',
  '🚴 Bisiklet',
  '⛰️ Dağcılık',
  '🎯 Ok Atma',
  '♟️ Satranç',
];

const TURKISH_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 
  'Antalya', 'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 
  'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale',
  'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 
  'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri',
  'Hatay', 'Iğdır', 'Isparta', 'İstanbul', 'İzmir', 'Kahramanmaraş', 'Karabük',
  'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale', 'Kırklareli', 'Kırşehir',
  'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin',
  'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya',
  'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak', 'Tekirdağ', 'Tokat',
  'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
];

export default function EditProfileModal({
  visible,
  onDismiss,
  profileData,
  onSave,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState<ProfileData>(profileData);
  const [newInterest, setNewInterest] = useState('');
  const [showInterestSuggestions, setShowInterestSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);

  // Modal açıldığında form data'yı güncelle
  useEffect(() => {
    if (visible) {
      setFormData(profileData);
    }
  }, [visible, profileData]);

  const handleCitySearch = (text: string) => {
    setFormData({ ...formData, location: text });
    
    if (text.length > 0) {
      const filtered = TURKISH_CITIES.filter(city =>
        city.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowCitySuggestions(filtered.length > 0);
    } else {
      setShowCitySuggestions(false);
    }
  };

  const selectCity = (city: string) => {
    setFormData({ ...formData, location: city });
    setShowCitySuggestions(false);
  };

  const pickImage = async () => {
    try {
      // İzin iste
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri erişim izni vermelisiniz.');
        return;
      }

      // Resim seç
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({
          ...formData,
          avatarUrl: result.assets[0].uri,
        });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    }
  };

  const handleAddInterest = (interest?: string) => {
    const interestToAdd = interest || newInterest.trim();
    
    if (interestToAdd && !formData.interests.includes(interestToAdd)) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interestToAdd],
      });
      setNewInterest('');
      setShowInterestSuggestions(false);
    }
  };

  const handleRemoveInterest = (index: number) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Hata', 'İsim alanı boş olamaz');
      return;
    }
    if (!formData.username.trim() || formData.username.length < 3) {
      Alert.alert('Hata', 'Kullanıcı adı en az 3 karakter olmalıdır');
      return;
    }
    if (formData.age < 13 || formData.age > 120) {
      Alert.alert('Hata', 'Lütfen geçerli bir yaş girin (13-120 arası)');
      return;
    }
    if (!formData.location.trim()) {
      Alert.alert('Hata', 'Konum alanı boş olamaz');
      return;
    }
    onSave(formData);
  };

  // Henüz eklenmeyen önerilen ilgi alanları
  const availableSuggestions = SUGGESTED_INTERESTS.filter(
    suggestion => !formData.interests.includes(suggestion)
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onDismiss} style={styles.headerButton}>
              <Ionicons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Profili Düzenle</Text>
            <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
              <Ionicons name="checkmark" size={28} color="#10B981" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: formData.avatarUrl }} style={styles.avatarImage} />
                <TouchableOpacity 
                  style={styles.cameraButton}
                  onPress={pickImage}
                >
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.changeAvatarButton} onPress={pickImage}>
                <Ionicons name="images" size={20} color="#ffffff" />
                <Text style={styles.changeAvatarText}>Fotoğraf Değiştir</Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>İsim *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="İsminizi girin"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Kullanıcı Adı *</Text>
              <TextInput
                style={styles.input}
                placeholder="kullaniciadi"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text.toLowerCase() })}
                autoCapitalize="none"
                maxLength={30}
              />
              <Text style={styles.inputHint}>
                Sadece harf, rakam ve alt çizgi kullanabilirsiniz
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Yaş *</Text>
              <TextInput
                style={styles.input}
                value={formData.age > 0 ? formData.age.toString() : ''}
                onChangeText={(text) => {
                  const age = parseInt(text) || 0;
                  setFormData({ ...formData, age });
                }}
                keyboardType="number-pad"
                placeholder="Yaşınızı girin (13-120)"
                placeholderTextColor="#6B7280"
                maxLength={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Şehir *</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={handleCitySearch}
                placeholder="Şehir seçin veya yazın"
                placeholderTextColor="#6B7280"
                onFocus={() => {
                  if (formData.location.length > 0) {
                    setShowCitySuggestions(true);
                  }
                }}
              />
              {showCitySuggestions && filteredCities.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <ScrollView 
                    style={styles.suggestionsList}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                  >
                    {filteredCities.slice(0, 5).map((city, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => selectCity(city)}
                      >
                        <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.suggestionText}>{city}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Hakkımda</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholder="Kendinizden bahsedin"
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.inputHint}>
                {formData.bio.length}/500 karakter
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>İlgi Alanları</Text>
              <View style={styles.interestsInput}>
                <TextInput
                  style={styles.interestInputField}
                  value={newInterest}
                  onChangeText={setNewInterest}
                  placeholder="İlgi alanı ekle"
                  placeholderTextColor="#6B7280"
                  onFocus={() => setShowInterestSuggestions(true)}
                  onSubmitEditing={() => handleAddInterest()}
                  returnKeyType="done"
                />
                <TouchableOpacity 
                  style={styles.addButton} 
                  onPress={() => handleAddInterest()}
                >
                  <Ionicons name="add" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Seçili İlgi Alanları */}
              {formData.interests.length > 0 && (
                <View style={styles.interestsContainer}>
                  <Text style={styles.sectionSubtitle}>Seçili İlgi Alanları:</Text>
                  <View style={styles.interestsChipsContainer}>
                    {formData.interests.map((interest, index) => (
                      <View key={index} style={styles.interestChip}>
                        <Text style={styles.interestText}>{interest}</Text>
                        <TouchableOpacity onPress={() => handleRemoveInterest(index)}>
                          <Ionicons name="close-circle" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Önerilen İlgi Alanları */}
              {showInterestSuggestions && availableSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.sectionSubtitle}>Önerilen İlgi Alanları:</Text>
                  <View style={styles.interestsChipsContainer}>
                    {availableSuggestions.slice(0, 12).map((interest, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionChip}
                        onPress={() => handleAddInterest(interest)}
                      >
                        <Text style={styles.suggestionChipText}>{interest}</Text>
                        <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Bottom Padding */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  changeAvatarText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    color: theme.colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  interestsInput: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  interestInputField: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    color: theme.colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestsContainer: {
    marginTop: 8,
  },
  interestsChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.3)',
  },
  interestText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  suggestionChipText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
});