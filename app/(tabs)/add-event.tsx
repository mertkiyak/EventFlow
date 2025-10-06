// import { COLLECTION_ID, DATABASE_ID, databases } from "@/lib/appwrite";
// import { useAuth } from "@/lib/auth-context";
// import { useRouter } from "expo-router";
// import { useState } from "react";
// import { StyleSheet, View } from "react-native";
// import { ID } from "react-native-appwrite";
// import { Button, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";

// const FREQUENCY = ["daily", "weekly", "monthly"];
// type Frequency = typeof FREQUENCY[number];
// export default function AddEventScreen() {
//     const [title, setTitle] = useState<string>("");
//     const [description, setDescription] = useState<string>("");
//     const [frequency, setFrequency] = useState<Frequency>("daily");
//     const[error, setError] = useState<string>("");
//     const{user} = useAuth()
//     const router = useRouter();
//     const theme = useTheme();
    
//     const handleSubmit = async () => {
//         if (!user) return;
//         try{
//         await databases.createDocument(DATABASE_ID, COLLECTION_ID,
//             ID.unique(), 
//             {
//             title,
//             description,
//             frequency,
//             streak_count: 0,
//             last_completed: new Date().toISOString(),
//             created_at: new Date().toISOString(),
//             user_id: user.$id,
//             }
//         );
//         router.back();
//     }   catch(error){  
//         if(error instanceof Error){
//             setError(error.message)
//             return;
            
//         }
        
    
//         setError("There was an error creating the event.");    
//     }
//     };

   
//     return (
//         <View style={styles.container}>
//             <TextInput label="Event Name"  mode="outlined" onChangeText={setTitle} style={styles.input} />
//             <TextInput label="Description"  mode="outlined" onChangeText={setDescription} style={styles.input} />
//             <View style={styles.frequencyContainer}>
//                 <SegmentedButtons 
//                 value={frequency}
//                 onValueChange={(value)=> {setFrequency(value as Frequency)}} 
//                 buttons={[
//                     {value:"Daily", label:"Daily"},
//                     {value:"Weekly", label:"Weekly"},
//                     {value:"Monthly", label:"Monthly"},
//                     ]} 
//                     style={styles.segmentedButtons}
//                 />
//             </View>  
//             <View>
//                 <Button mode="contained" 
//                 onPress={handleSubmit} disabled={!title || !description} 
//                 style={styles.button}
//                 >
//                 Create Event
//                 </Button>
//                 {error &&(<Text style={{color: theme.colors.error}}>{error}</Text>)}
//             </View>
//         </View>
//     )
// }
// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         padding: 16,
//         backgroundColor: '#fff',
//         justifyContent: 'center',

//     },
//     input: {
//         marginBottom: 16,
//     },
//     frequencyContainer: {
//         marginBottom: 16,
//     },
//     segmentedButtons: {
//         marginVertical: 8,
//     },
//     button: {
//         marginTop: 16,
//         backgroundColor: 'blue',
//         color: 'white',
//     }        
  
//   });
 



// import { BUCKET_ID, COLLECTION_ID, DATABASE_ID, databases, storage } from "@/lib/appwrite";
// import { useAuth } from "@/lib/auth-context";
// import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
// import DateTimePicker from '@react-native-community/datetimepicker';
// import * as ImagePicker from 'expo-image-picker';
// import { useRouter } from "expo-router";
// import { useState } from "react";
// import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
// import { ID } from "react-native-appwrite";
// import { ActivityIndicator, Button, IconButton, Text, TextInput, useTheme } from "react-native-paper";

// export default function AddEventScreen() {
//   const [title, setTitle] = useState<string>("");
//   const [description, setDescription] = useState<string>("");
//   const [location, setLocation] = useState<string>("");
//   const [date, setDate] = useState<Date>(new Date());
//   const [time, setTime] = useState<Date>(new Date());
//   const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
//   const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
//   const [imageUri, setImageUri] = useState<string>("");
//   const [uploading, setUploading] = useState<boolean>(false);
//   const [error, setError] = useState<string>("");
//   const { user } = useAuth();
//   const router = useRouter();
//   const theme = useTheme();

//   // Galeriden resim seç
//   const pickImage = async () => {
//     try {
//       const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
//       if (!permissionResult.granted) {
//         Alert.alert("İzin Gerekli", "Galeriye erişim için izin vermeniz gerekiyor.");
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [16, 9],
//         quality: 0.8,
//       });

//       if (!result.canceled && result.assets[0]) {
//         setImageUri(result.assets[0].uri);
//       }
//     } catch (error) {
//       console.error("Error picking image:", error);
//       Alert.alert("Hata", "Resim seçilirken bir hata oluştu.");
//     }
//   };

//   // Kameradan resim çek
//   const takePhoto = async () => {
//     try {
//       const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
//       if (!permissionResult.granted) {
//         Alert.alert("İzin Gerekli", "Kameraya erişim için izin vermeniz gerekiyor.");
//         return;
//       }

//       const result = await ImagePicker.launchCameraAsync({
//         allowsEditing: true,
//         aspect: [16, 9],
//         quality: 0.8,
//       });

//       if (!result.canceled && result.assets[0]) {
//         setImageUri(result.assets[0].uri);
//       }
//     } catch (error) {
//       console.error("Error taking photo:", error);
//       Alert.alert("Hata", "Fotoğraf çekilirken bir hata oluştu.");
//     }
//   };

//   // Resim seçim modalı
//   const showImageOptions = () => {
//     Alert.alert(
//       "Resim Ekle",
//       "Bir seçenek seçin",
//       [
//         {
//           text: "Kameradan Çek",
//           onPress: takePhoto,
//         },
//         {
//           text: "Galeriden Seç",
//           onPress: pickImage,
//         },
//         {
//           text: "İptal",
//           style: "cancel",
//         },
//       ]
//     );
//   };

//   // Appwrite Storage'a resim yükle
//   const uploadImage = async (): Promise<string | null> => {
//     if (!imageUri) return null;

//     try {
//       // URI'den dosya bilgisi al
//       const filename = imageUri.split('/').pop() || `event_${Date.now()}.jpg`;
//       const match = /\.(\w+)$/.exec(filename);
//       const fileType = match ? `image/${match[1]}` : 'image/jpeg';

//       // React Native Appwrite için dosya objesi oluştur
//       const file = {
//         name: filename,
//         type: fileType,
//         size: 0, // React Native'de size'ı fetch ile alabiliriz ama zorunlu değil
//         uri: imageUri,
//       };

//       // Appwrite Storage'a yükle
//       const uploadedFile = await storage.createFile(
//         BUCKET_ID,
//         ID.unique(),
//         file
//       );

//       // Dosya URL'sini döndür
//       const fileUrl = storage.getFileView(BUCKET_ID, uploadedFile.$id);
//       return fileUrl.toString();
//     } catch (error) {
//       console.error("Error uploading image:", error);
//       throw new Error("Resim yüklenirken bir hata oluştu.");
//     }
//   };

//   const handleSubmit = async () => {
//     if (!user) return;
    
//     setUploading(true);
//     setError("");

//     try {
//       // Tarih ve saati birleştir
//       const eventDateTime = new Date(date);
//       eventDateTime.setHours(time.getHours());
//       eventDateTime.setMinutes(time.getMinutes());

//       // Resmi yükle (varsa)
//       let imageUrl = null;
//       if (imageUri) {
//         imageUrl = await uploadImage();
//       }

//       // Etkinliği kaydet
//       await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
//         title,
//         description,
//         location,
//         event_date: eventDateTime.toISOString(),
//         image_url: imageUrl,
//         created_at: new Date().toISOString(),
//         user_id: user.$id,
//       });

//       router.back();
//     } catch (error) {
//       if (error instanceof Error) {
//         setError(error.message);
//         return;
//       }
//       setError("Etkinlik oluşturulurken bir hata oluştu.");
//     } finally {
//       setUploading(false);
//     }
//   };

//   const formatDate = (date: Date): string => {
//     const day = date.getDate().toString().padStart(2, '0');
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const year = date.getFullYear();
//     return `${day}/${month}/${year}`;
//   };

//   const formatTime = (time: Date): string => {
//     const hours = time.getHours().toString().padStart(2, '0');
//     const minutes = time.getMinutes().toString().padStart(2, '0');
//     return `${hours}:${minutes}`;
//   };

//   return (
//     <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
//       <View style={styles.header}>
//         <Text variant="headlineMedium" style={styles.headerTitle}>
//           Yeni Etkinlik Ekle
//         </Text>
//         <IconButton
//           icon="close"
//           size={24}
//           onPress={() => router.back()}
//           style={styles.closeButton}
//         />
//       </View>

//       <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//         <View style={styles.form}>
//           {/* Resim Seçimi */}
//           <Text variant="bodyMedium" style={styles.label}>
//             Etkinlik Görseli
//           </Text>
//           <TouchableOpacity 
//             style={styles.imageContainer} 
//             onPress={showImageOptions}
//             activeOpacity={0.7}
//           >
//             {imageUri ? (
//               <>
//                 <Image source={{ uri: imageUri }} style={styles.imagePreview} />
//                 <TouchableOpacity 
//                   style={styles.removeImageButton}
//                   onPress={() => setImageUri("")}
//                 >
//                   <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
//                 </TouchableOpacity>
//               </>
//             ) : (
//               <View style={styles.imagePlaceholder}>
//                 <MaterialCommunityIcons name="image-plus" size={48} color="#9CA3AF" />
//                 <Text style={styles.imagePlaceholderText}>
//                   Resim Eklemek İçin Dokunun
//                 </Text>
//               </View>
//             )}
//           </TouchableOpacity>

//           {/* Etkinlik Adı */}
//           <Text variant="bodyMedium" style={styles.label}>
//             Etkinlik Adı
//           </Text>
//           <TextInput
//             placeholder="Örn: Akşam Yemeği"
//             mode="outlined"
//             value={title}
//             onChangeText={setTitle}
//             style={styles.input}
//             outlineStyle={styles.inputOutline}
//           />

//           {/* Tarih */}
//           <Text variant="bodyMedium" style={styles.label}>
//             Tarih
//           </Text>
//           <TouchableOpacity onPress={() => setShowDatePicker(true)}>
//             <TextInput
//               placeholder="gg/aa/yyyy"
//               mode="outlined"
//               value={formatDate(date)}
//               editable={false}
//               right={<TextInput.Icon icon="calendar" />}
//               style={styles.input}
//               outlineStyle={styles.inputOutline}
//               pointerEvents="none"
//             />
//           </TouchableOpacity>

//           {showDatePicker && (
//             <DateTimePicker
//               value={date}
//               mode="date"
//               display="default"
//               onChange={(event, selectedDate) => {
//                 setShowDatePicker(false);
//                 if (selectedDate) {
//                   setDate(selectedDate);
//                 }
//               }}
//             />
//           )}

//           {/* Saat */}
//           <Text variant="bodyMedium" style={styles.label}>
//             Saat
//           </Text>
//           <TouchableOpacity onPress={() => setShowTimePicker(true)}>
//             <TextInput
//               placeholder="--:--"
//               mode="outlined"
//               value={formatTime(time)}
//               editable={false}
//               right={<TextInput.Icon icon="clock-outline" />}
//               style={styles.input}
//               outlineStyle={styles.inputOutline}
//               pointerEvents="none"
//             />
//           </TouchableOpacity>

//           {showTimePicker && (
//             <DateTimePicker
//               value={time}
//               mode="time"
//               is24Hour={true}
//               display="default"
//               onChange={(event, selectedTime) => {
//                 setShowTimePicker(false);
//                 if (selectedTime) {
//                   setTime(selectedTime);
//                 }
//               }}
//             />
//           )}

//           {/* Konum */}
//           <Text variant="bodyMedium" style={styles.label}>
//             Konum
//           </Text>
//           <TextInput
//             placeholder="Örn: Beşiktaş"
//             mode="outlined"
//             value={location}
//             onChangeText={setLocation}
//             style={styles.input}
//             outlineStyle={styles.inputOutline}
//           />

//           {/* Açıklama */}
//           <Text variant="bodyMedium" style={styles.label}>
//             Açıklama
//           </Text>
//           <TextInput
//             placeholder="Etkinlik hakkında detaylar..."
//             mode="outlined"
//             value={description}
//             onChangeText={setDescription}
//             multiline
//             numberOfLines={4}
//             style={[styles.input, styles.textArea]}
//             outlineStyle={styles.inputOutline}
//           />

//           {/* Hata Mesajı */}
//           {error && (
//             <Text style={{ color: theme.colors.error, marginBottom: 16 }}>
//               {error}
//             </Text>
//           )}

//           {/* Kaydet Butonu */}
//           <Button
//             mode="contained"
//             onPress={handleSubmit}
//             disabled={!title || !location || uploading}
//             style={styles.button}
//             buttonColor="#4CAF50"
//             textColor="#fff"
//           >
//             {uploading ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               "Etkinliği Kaydet"
//             )}
//           </Button>
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingTop: 16,
//     paddingBottom: 8,
//   },
//   headerTitle: {
//     fontWeight: 'bold',
//     flex: 1,
//   },
//   closeButton: {
//     margin: 0,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   form: {
//     padding: 16,
//   },
//   label: {
//     marginBottom: 8,
//     fontWeight: '600',
//   },
//   imageContainer: {
//     width: '100%',
//     height: 200,
//     borderRadius: 12,
//     overflow: 'hidden',
//     marginBottom: 16,
//     position: 'relative',
//   },
//   imagePreview: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   imagePlaceholder: {
//     width: '100%',
//     height: '100%',
//     backgroundColor: '#F3F4F6',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#E5E7EB',
//     borderStyle: 'dashed',
//     borderRadius: 12,
//   },
//   imagePlaceholderText: {
//     marginTop: 8,
//     fontSize: 14,
//     color: '#6B7280',
//   },
//   removeImageButton: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     borderRadius: 12,
//   },
//   input: {
//     marginBottom: 16,
//     backgroundColor: 'transparent',
//   },
//   inputOutline: {
//     borderRadius: 8,
//   },
//   textArea: {
//     minHeight: 100,
//     textAlignVertical: 'top',
//   },
//   button: {
//     marginTop: 8,
//     paddingVertical: 6,
//     borderRadius: 8,
//   },
// });

import { BUCKET_ID, COLLECTION_ID, DATABASE_ID, databases, PROJECT_ID, storage } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ID } from "react-native-appwrite";
import { ActivityIndicator, Button, IconButton, Text, TextInput, useTheme } from "react-native-paper";

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
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  // Galeriden resim seç
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

  // Kameradan resim çek
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

  // Resim seçim modalı
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

  // Appwrite Storage'a resim yükle
  const uploadImage = async (): Promise<string | null> => {
    if (!imageUri) return null;

    try {
      // URI'den dosya bilgisi al
      const filename = imageUri.split('/').pop() || `event_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : 'image/jpeg';

      // React Native Appwrite için dosya objesi oluştur
      const file = {
        name: filename,
        type: fileType,
        size: 0, // React Native'de size'ı fetch ile alabiliriz ama zorunlu değil
        uri: imageUri,
      };

      // Appwrite Storage'a yükle
      const uploadedFile = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file
      );

      // Dosya URL'sini döndür (tam URL olarak)
      const fileUrl = `https://cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${PROJECT_ID}`;
      return fileUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Resim yüklenirken bir hata oluştu.");
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setUploading(true);
    setError("");

    try {
      // Tarih ve saati birleştir
      const eventDateTime = new Date(date);
      eventDateTime.setHours(time.getHours());
      eventDateTime.setMinutes(time.getMinutes());

      // Resmi yükle (varsa)
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImage();
      }

      // Etkinliği kaydet
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Yeni Etkinlik Ekle
        </Text>
        <IconButton
          icon="close"
          size={24}
          onPress={() => router.back()}
          style={styles.closeButton}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Resim Seçimi */}
          <Text variant="bodyMedium" style={styles.label}>
            Etkinlik Görseli
          </Text>
          <TouchableOpacity 
            style={styles.imageContainer} 
            onPress={showImageOptions}
            activeOpacity={0.7}
          >
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setImageUri("")}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="image-plus" size={48} color="#9CA3AF" />
                <Text style={styles.imagePlaceholderText}>
                  Resim Eklemek İçin Dokunun
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Etkinlik Adı */}
          <Text variant="bodyMedium" style={styles.label}>
            Etkinlik Adı
          </Text>
          <TextInput
            placeholder="Örn: Akşam Yemeği"
            mode="outlined"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            outlineStyle={styles.inputOutline}
          />

          {/* Tarih */}
          <Text variant="bodyMedium" style={styles.label}>
            Tarih
          </Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <TextInput
              placeholder="gg/aa/yyyy"
              mode="outlined"
              value={formatDate(date)}
              editable={false}
              right={<TextInput.Icon icon="calendar" />}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              pointerEvents="none"
            />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}

          {/* Saat */}
          <Text variant="bodyMedium" style={styles.label}>
            Saat
          </Text>
          <TouchableOpacity onPress={() => setShowTimePicker(true)}>
            <TextInput
              placeholder="--:--"
              mode="outlined"
              value={formatTime(time)}
              editable={false}
              right={<TextInput.Icon icon="clock-outline" />}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              pointerEvents="none"
            />
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  setTime(selectedTime);
                }
              }}
            />
          )}

          {/* Konum */}
          <Text variant="bodyMedium" style={styles.label}>
            Konum
          </Text>
          <TextInput
            placeholder="Örn: Beşiktaş"
            mode="outlined"
            value={location}
            onChangeText={setLocation}
            style={styles.input}
            outlineStyle={styles.inputOutline}
          />

          {/* Açıklama */}
          <Text variant="bodyMedium" style={styles.label}>
            Açıklama
          </Text>
          <TextInput
            placeholder="Etkinlik hakkında detaylar..."
            mode="outlined"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textArea]}
            outlineStyle={styles.inputOutline}
          />

          {/* Hata Mesajı */}
          {error && (
            <Text style={{ color: theme.colors.error, marginBottom: 16 }}>
              {error}
            </Text>
          )}

          {/* Kaydet Butonu */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={!title || !location || uploading}
            style={styles.button}
            buttonColor="#4CAF50"
            textColor="#fff"
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              "Etkinliği Kaydet"
            )}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  inputOutline: {
    borderRadius: 8,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
});