import { BUCKET_ID, COLLECTION_ID, DATABASE_ID, databases, PROJECT_ID, storage } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ID } from "react-native-appwrite";
import { ActivityIndicator, Button, Modal, Portal, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddEventScreen() {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [imageUri, setImageUri] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showManualLocationModal, setShowManualLocationModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [searchingLocation, setSearchingLocation] = useState<boolean>(false);
  const { user } = useAuth();
  const router = useRouter();

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("İzin Gerekli", "Galeriye erişim için izin vermeniz gerekiyor.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Hata", "Resim seçilirken bir hata oluştu.");
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("İzin Gerekli", "Kameraya erişim için izin vermeniz gerekiyor.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Hata", "Fotoğraf çekilirken bir hata oluştu.");
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      "Resim Ekle",
      "Bir seçenek seçin",
      [
        {
          text: "Kameradan Çek",
          onPress: takePhoto,
        },
        {
          text: "Galeriden Seç",
          onPress: pickImage,
        },
        {
          text: "İptal",
          style: "cancel",
        },
      ]
    );
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageUri) return null;

    try {
      const filename = imageUri.split('/').pop() || `event_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : 'image/jpeg';

      const file = {
        name: filename,
        type: fileType,
        size: 0,
        uri: imageUri,
      };

      const uploadedFile = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file
      );

      const fileUrl = `https://cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${PROJECT_ID}`;
      return fileUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Resim yüklenirken bir hata oluştu.");
    }
  };

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert("İzin Gerekli", "Konum erişimi için izin vermeniz gerekiyor.");
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0]) {
        const formattedAddress = `${address[0].name || ''}, ${address[0].district || ''}, ${address[0].city || ''}, ${address[0].country || ''}`.replace(/^, |, $/g, '');
        setSelectedLocation({
          address: formattedAddress,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setLocation(formattedAddress);
        setShowLocationModal(false);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Hata", "Konum alınırken bir hata oluştu.");
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleManualLocation = () => {
    setShowLocationModal(false);
    setShowManualLocationModal(true);
    setSearchQuery("");
    setLocationSuggestions([]);
  };

  // Konum arama fonksiyonu
  const searchLocation = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    setSearchingLocation(true);
    try {
      // OpenStreetMap Nominatim API kullanarak konum arama
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&addressdetails=1`
      );
      const data = await response.json();
      setLocationSuggestions(data);
    } catch (error) {
      console.error("Error searching location:", error);
    } finally {
      setSearchingLocation(false);
    }
  };

  // Arama listesinden konum seçme
  const selectLocationFromSearch = (item: any) => {
    const formattedAddress = item.display_name;
    setLocation(formattedAddress);
    setSelectedLocation({
      address: formattedAddress,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    });
    setShowManualLocationModal(false);
    setSearchQuery("");
    setLocationSuggestions([]);
  };

  // Tüm formu temizle
  const clearForm = () => {
    Alert.alert(
      "Formu Temizle",
      "Tüm girişler ve yüklenen fotoğraf silinecek. Emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Temizle",
          style: "destructive",
          onPress: () => {
            setTitle("");
            setDescription("");
            setLocation("");
            setDate(new Date());
            setTime(new Date());
            setImageUri("");
            setSelectedLocation(null);
            setError("");
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setUploading(true);
    setError("");

    try {
      const eventDateTime = new Date(date);
      eventDateTime.setHours(time.getHours());
      eventDateTime.setMinutes(time.getMinutes());

      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImage();
      }

      await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        title,
        description,
        location,
        event_date: eventDateTime.toISOString(),
        image_url: imageUrl,
        created_at: new Date().toISOString(),
        user_id: user.$id,
      });

      router.back();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        return;
      }
      setError("Etkinlik oluşturulurken bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (time: Date): string => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        
        <Text variant="titleLarge" style={styles.headerTitle}>
          Yeni Etkinlik
        </Text>
        
        <TouchableOpacity 
          onPress={clearForm}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity 
            style={styles.heroImageContainer} 
            onPress={showImageOptions}
            activeOpacity={0.9}
          >
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={styles.heroImage} />
                <View style={styles.heroOverlay} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    setImageUri("");
                  }}
                >
                  <Ionicons name="close-circle" size={32} color="#fff" />
                </TouchableOpacity>
                <View style={styles.changeImageHint}>
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text style={styles.changeImageText}>Değiştirmek için dokunun</Text>
                </View>
              </>
            ) : (
              <View style={styles.heroPlaceholder}>
                <View style={styles.iconCircle}>
                  <Ionicons name="image" size={40} color="#6366f1" />
                </View>
                <Text style={styles.heroPlaceholderTitle}>Etkinlik Görseli Ekle</Text>
                <Text style={styles.heroPlaceholderSubtitle}>
                  Fotoğraf çekin veya galeriden seçin
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="create-outline" size={20} color="#818cf8" />
                <Text style={styles.label}>Etkinlik Adı</Text>
              </View>
              <TextInput
                placeholder="Örn: Akşam Yemeği"
                placeholderTextColor="#6b7280"
                mode="outlined"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                outlineColor="#374151"
                activeOutlineColor="#818cf8"
                textColor="#f8fafc"
                theme={{ colors: { background: '#1e293b' } }}
              />
            </View>

            <View style={styles.gridRow}>
              <View style={[styles.inputGroup, styles.gridItem]}>
                <View style={styles.labelContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#818cf8" />
                  <Text style={styles.label}>Tarih</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <TextInput
                    placeholder="gg/aa/yyyy"
                    placeholderTextColor="#6b7280"
                    mode="outlined"
                    value={formatDate(date)}
                    editable={false}
                    style={styles.input}
                    outlineColor="#374151"
                    activeOutlineColor="#818cf8"
                    textColor="#f8fafc"
                    theme={{ colors: { background: '#1e293b' } }}
                    pointerEvents="none"
                  />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, styles.gridItem]}>
                <View style={styles.labelContainer}>
                  <Ionicons name="time-outline" size={20} color="#818cf8" />
                  <Text style={styles.label}>Saat</Text>
                </View>
                <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                  <TextInput
                    placeholder="--:--"
                    placeholderTextColor="#6b7280"
                    mode="outlined"
                    value={formatTime(time)}
                    editable={false}
                    style={styles.input}
                    outlineColor="#374151"
                    activeOutlineColor="#818cf8"
                    textColor="#f8fafc"
                    theme={{ colors: { background: '#1e293b' } }}
                    pointerEvents="none"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) setTime(selectedTime);
                }}
              />
            )}

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="location-outline" size={20} color="#818cf8" />
                <Text style={styles.label}>Konum</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLocationModal(true)}>
                <TextInput
                  placeholder="Konum seçmek için dokunun"
                  placeholderTextColor="#6b7280"
                  mode="outlined"
                  value={location}
                  editable={false}
                  style={styles.input}
                  outlineColor="#374151"
                  activeOutlineColor="#818cf8"
                  textColor="#f8fafc"
                  theme={{ colors: { background: '#1e293b' } }}
                  right={<TextInput.Icon icon="chevron-right" color="#818cf8" />}
                  pointerEvents="none"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="document-text-outline" size={20} color="#818cf8" />
                <Text style={styles.label}>Açıklama</Text>
              </View>
              <TextInput
                placeholder="Etkinlik hakkında detaylar..."
                placeholderTextColor="#6b7280"
                mode="outlined"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                style={[styles.input, styles.textArea]}
                outlineColor="#374151"
                activeOutlineColor="#818cf8"
                textColor="#f8fafc"
                theme={{ colors: { background: '#1e293b' } }}
              />
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#fca5a5" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!title || !location || uploading) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!title || !location || uploading}
              activeOpacity={0.8}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.submitButtonText}>Etkinliği Oluştur</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Portal>
        <Modal 
          visible={showLocationModal} 
          onDismiss={() => setShowLocationModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Konum Seç
            </Text>
            <Text variant="bodyMedium" style={styles.modalSubtitle}>
              Nasıl konum eklemek istersiniz?
            </Text>

            <TouchableOpacity 
              style={styles.locationOption}
              onPress={getCurrentLocation}
              disabled={loadingLocation}
            >
              <View style={styles.locationOptionIcon}>
                <Ionicons name="navigate" size={24} color="#6366f1" />
              </View>
              <View style={styles.locationOptionText}>
                <Text style={styles.locationOptionTitle}>Mevcut Konumum</Text>
                <Text style={styles.locationOptionSubtitle}>GPS ile otomatik konum al</Text>
              </View>
              {loadingLocation && <ActivityIndicator color="#6366f1" />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.locationOption}
              onPress={handleManualLocation}
            >
              <View style={styles.locationOptionIcon}>
                <Ionicons name="search-outline" size={24} color="#6366f1" />
              </View>
              <View style={styles.locationOptionText}>
                <Text style={styles.locationOptionTitle}>Konum Ara</Text>
                <Text style={styles.locationOptionSubtitle}>Şehir veya ilçe adı ile ara</Text>
              </View>
            </TouchableOpacity>

            <Button 
              mode="text" 
              onPress={() => setShowLocationModal(false)}
              textColor="#94a3b8"
              style={styles.modalCancelButton}
            >
              İptal
            </Button>
          </View>
        </Modal>

        {/* Manuel Konum Arama Modal */}
        <Modal 
          visible={showManualLocationModal} 
          onDismiss={() => {
            setShowManualLocationModal(false);
            setSearchQuery("");
            setLocationSuggestions([]);
          }}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={[styles.modalContent, styles.searchModalContent]}>
            <View style={styles.searchModalHeader}>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Konum Ara
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowManualLocationModal(false);
                  setSearchQuery("");
                  setLocationSuggestions([]);
                }}
              >
                <Ionicons name="close" size={24} color="#f8fafc" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#818cf8" style={styles.searchIcon} />
              <TextInput
                placeholder="Şehir veya ilçe adı girin..."
                placeholderTextColor="#6b7280"
                mode="flat"
                value={searchQuery}
                onChangeText={searchLocation}
                style={styles.searchInput}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                textColor="#f8fafc"
                theme={{ colors: { background: '#0f172a' } }}
                autoFocus
              />
              {searchingLocation && (
                <ActivityIndicator size="small" color="#818cf8" style={styles.searchLoader} />
              )}
            </View>

            <ScrollView 
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}
            >
              {locationSuggestions.length > 0 ? (
                locationSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectLocationFromSearch(item)}
                  >
                    <Ionicons name="location-outline" size={20} color="#818cf8" />
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionName}>
                        {item.address?.city || item.address?.town || item.address?.village || item.name}
                      </Text>
                      <Text style={styles.suggestionAddress} numberOfLines={1}>
                        {item.display_name}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                  </TouchableOpacity>
                ))
              ) : searchQuery.length >= 2 && !searchingLocation ? (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={48} color="#475569" />
                  <Text style={styles.noResultsText}>Sonuç bulunamadı</Text>
                  <Text style={styles.noResultsSubtext}>Farklı bir arama deneyin</Text>
                </View>
              ) : searchQuery.length < 2 ? (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="location-outline" size={48} color="#475569" />
                  <Text style={styles.noResultsText}>Konum Ara</Text>
                  <Text style={styles.noResultsSubtext}>Şehir veya ilçe adı girin</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#f8fafc',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroImageContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
    backgroundColor: '#1e293b',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  heroPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderBottomWidth: 2,
    borderBottomColor: '#334155',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2d3748',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#374151',
  },
  heroPlaceholderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  heroPlaceholderSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  removeImageButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
  },
  changeImageHint: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  input: {
    backgroundColor: '#1e293b',
    fontSize: 15,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridItem: {
    flex: 1,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7f1d1d',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#991b1b',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#475569',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    color: '#f8fafc',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  locationOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationOptionText: {
    flex: 1,
  },
  locationOptionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationOptionSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
  },
  modalCancelButton: {
    marginTop: 8,
  },
  searchModalContent: {
    maxHeight: '80%',
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 20,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingLeft: 48,
    paddingRight: 48,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: '#374151',
    height: 56,
  },
  searchLoader: {
    position: 'absolute',
    right: 16,
    top: 20,
  },
  suggestionsList: {
    maxHeight: 400,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionAddress: {
    color: '#94a3b8',
    fontSize: 13,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  noResultsText: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    color: '#94a3b8',
    fontSize: 14,
  },
});