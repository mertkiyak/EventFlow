// import { COLLECTION_ID, DATABASE_ID, databases } from "@/lib/appwrite";
// import { useAuth } from "@/lib/auth-context";
// import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
// import { useRouter } from "expo-router";
// import { useEffect, useState } from "react";
// import {
//     Alert,
//     Image,
//     ScrollView,
//     StyleSheet,
//     View
// } from "react-native";
// import { Query } from "react-native-appwrite";
// import { Button, IconButton, Text } from "react-native-paper";
// import { Events } from "../../types/database.type";

// interface UserProfile {
//   name: string;
//   age: number;
//   location: string;
//   bio: string;
//   interests: string[];
//   isActive: boolean;
//   avatarUrl: string;
// }

// export default function ProfileScreen() {
//   const { user, signOut } = useAuth();
//   const router = useRouter();
//   const [myEvents, setMyEvents] = useState<Events[]>([]);
//   const [profile, setProfile] = useState<UserProfile>({
//     name: "Kullanıcı",
//     age: 24,
//     location: "İstanbul",
//     bio: "Seyahat etmeyi, yeni yerler keşfetmeyi ve farklı kültürlere dalmayı seven biriyim. Doğa yürüyüşleri, kamp ve su sporları gibi açık hava etkinliklerine bayılıyorum.",
//     interests: [
//       "✈️ Seyahat",
//       "🌲 Doğa Yürüyüşü",
//       "📚 Kitap Okuma",
//       "🎬 Film",
//       "🎵 Müzik",
//       "🏄‍♀️ Su Sporları",
//     ],
//     isActive: true,
//     avatarUrl: "https://via.placeholder.com/200x200?text=Avatar",
//   });

//   useEffect(() => {
//     if (user) {
//       fetchMyEvents();
//       // Kullanıcı bilgilerini user'dan al
//       if (user.name) {
//         setProfile(prev => ({ ...prev, name: user.name }));
//       }
//     }
//   }, [user]);

//   const fetchMyEvents = async () => {
//     if (!user) return;

//     try {
//       const response = await databases.listDocuments(
//         DATABASE_ID,
//         COLLECTION_ID,
//         [Query.equal("user_id", user.$id), Query.orderDesc("created_at")]
//       );
//       setMyEvents(response.documents as Events[]);
//     } catch (error) {
//       console.error("Error fetching events:", error);
//     }
//   };

//   const handleDeleteEvent = async (eventId: string) => {
//     Alert.alert(
//       "Etkinliği Sil",
//       "Bu etkinliği silmek istediğinizden emin misiniz?",
//       [
//         { text: "İptal", style: "cancel" },
//         {
//           text: "Sil",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               await databases.deleteDocument(
//                 DATABASE_ID,
//                 COLLECTION_ID,
//                 eventId
//               );
//               fetchMyEvents();
//             } catch (error) {
//               console.error("Error deleting event:", error);
//               Alert.alert("Hata", "Etkinlik silinirken bir hata oluştu.");
//             }
//           },
//         },
//       ]
//     );
//   };

//   const formatDate = (dateString: string): string => {
//     const date = new Date(dateString);
//     const months = [
//       "Ocak",
//       "Şubat",
//       "Mart",
//       "Nisan",
//       "Mayıs",
//       "Haziran",
//       "Temmuz",
//       "Ağustos",
//       "Eylül",
//       "Ekim",
//       "Kasım",
//       "Aralık",
//     ];
//     const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

//     const day = date.getDate();
//     const month = months[date.getMonth()];
//     const dayName = days[date.getDay()];

//     return `${day} ${month}, ${dayName}`;
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <IconButton
//           icon="arrow-left"
//           size={24}
//           iconColor="#fff"
//           onPress={() => router.back()}
//           style={styles.headerButton}
//         />
//         <Text style={styles.headerTitle}>Profil</Text>
//         <IconButton
//           icon="pencil"
//           size={24}
//           iconColor="#fff"
//           onPress={() => console.log("Edit profile")}
//           style={styles.headerButton}
//         />
//       </View>

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         {/* Profile Info */}
//         <View style={styles.profileSection}>
//           {/* Avatar */}
//           <View style={styles.avatarContainer}>
//             <Image
//               source={{ uri: profile.avatarUrl }}
//               style={styles.avatar}
//             />
//           </View>

//           {/* Name & Location */}
//           <View style={styles.infoContainer}>
//             <Text style={styles.name}>
//               {profile.name}, {profile.age}
//             </Text>
//             <View style={styles.locationRow}>
//               <MaterialCommunityIcons
//                 name="map-marker"
//                 size={16}
//                 color="#9eb7a8"
//               />
//               <Text style={styles.location}>{profile.location}</Text>
//             </View>
//             {profile.isActive && (
//               <View style={styles.activeStatus}>
//                 <View style={styles.activeDot} />
//                 <Text style={styles.activeText}>Şu anda aktif</Text>
//               </View>
//             )}
//           </View>
//         </View>

//         {/* Bio Section */}
//         <View style={styles.card}>
//           <Text style={styles.cardTitle}>Hakkımda</Text>
//           <Text style={styles.bioText}>{profile.bio}</Text>
//         </View>

//         {/* Interests Section */}
//         <View style={styles.card}>
//           <Text style={styles.cardTitle}>İlgi Alanları</Text>
//           <View style={styles.interestsContainer}>
//             {profile.interests.map((interest, index) => (
//               <View key={index} style={styles.interestChip}>
//                 <Text style={styles.interestText}>{interest}</Text>
//               </View>
//             ))}
//           </View>
//         </View>

//         {/* My Events Section */}
//         <View style={styles.card}>
//           <Text style={styles.cardTitle}>Etkinliklerim</Text>
//           {myEvents.length === 0 ? (
//             <View style={styles.emptyState}>
//               <MaterialCommunityIcons
//                 name="calendar-blank"
//                 size={48}
//                 color="#9eb7a8"
//               />
//               <Text style={styles.emptyText}>Henüz etkinlik eklemediniz</Text>
//             </View>
//           ) : (
//             <View style={styles.eventsContainer}>
//               {myEvents.map((event) => (
//                 <View key={event.$id} style={styles.eventCard}>
//                   <Image
//                     source={{
//                       uri:
//                         event.image_url ||
//                         "https://via.placeholder.com/100x100?text=Event",
//                     }}
//                     style={styles.eventImage}
//                   />
//                   <View style={styles.eventInfo}>
//                     <Text style={styles.eventTitle} numberOfLines={1}>
//                       {event.title}
//                     </Text>
//                     <Text style={styles.eventDate}>
//                       {formatDate(event.event_date)}
//                     </Text>
//                   </View>
//                   <View style={styles.eventActions}>
//                     <IconButton
//                       icon="pencil"
//                       size={20}
//                       iconColor="rgba(255,255,255,0.6)"
//                       onPress={() => console.log("Edit event:", event.$id)}
//                       style={styles.actionButton}
//                     />
//                     <IconButton
//                       icon="delete"
//                       size={20}
//                       iconColor="rgba(255,255,255,0.6)"
//                       onPress={() => handleDeleteEvent(event.$id)}
//                       style={styles.actionButton}
//                     />
//                   </View>
//                 </View>
//               ))}
//             </View>
//           )}
//         </View>

//         {/* Sign Out Button */}
//         <Button
//           mode="outlined"
//           onPress={signOut}
//           style={styles.signOutButton}
//           textColor="#fff"
//           icon="logout"
//         >
//           Çıkış Yap
//         </Button>
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#111714",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 8,
//     paddingTop: 16,
//     paddingBottom: 12,
//     backgroundColor: "rgba(17, 23, 20, 0.8)",
//   },
//   headerButton: {
//     margin: 0,
//   },
//   headerTitle: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "bold",
//     flex: 1,
//     textAlign: "center",
//   },
//   scrollContent: {
//     padding: 16,
//     paddingBottom: 32,
//   },
//   profileSection: {
//     alignItems: "center",
//     marginBottom: 24,
//   },
//   avatarContainer: {
//     width: 128,
//     height: 128,
//     borderRadius: 64,
//     borderWidth: 4,
//     borderColor: "rgba(56, 224, 123, 0.5)",
//     marginBottom: 16,
//     overflow: "hidden",
//   },
//   avatar: {
//     width: "100%",
//     height: "100%",
//   },
//   infoContainer: {
//     alignItems: "center",
//     gap: 4,
//   },
//   name: {
//     color: "#fff",
//     fontSize: 24,
//     fontWeight: "bold",
//   },
//   locationRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   location: {
//     color: "#9eb7a8",
//     fontSize: 16,
//   },
//   activeStatus: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     marginTop: 4,
//   },
//   activeDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: "#38e07b",
//   },
//   activeText: {
//     color: "#38e07b",
//     fontSize: 14,
//     fontWeight: "500",
//   },
//   card: {
//     backgroundColor: "#1C2620",
//     borderRadius: 24,
//     padding: 16,
//     marginBottom: 16,
//   },
//   cardTitle: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 12,
//   },
//   bioText: {
//     color: "#c2d3c9",
//     fontSize: 16,
//     lineHeight: 24,
//   },
//   interestsContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 12,
//   },
//   interestChip: {
//     backgroundColor: "#29382f",
//     borderRadius: 20,
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//   },
//   interestText: {
//     color: "#fff",
//     fontSize: 14,
//     fontWeight: "500",
//   },
//   eventsContainer: {
//     gap: 12,
//   },
//   eventCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#29382f",
//     borderRadius: 12,
//     padding: 12,
//     gap: 12,
//   },
//   eventImage: {
//     width: 48,
//     height: 48,
//     borderRadius: 8,
//     backgroundColor: "#1C2620",
//   },
//   eventInfo: {
//     flex: 1,
//   },
//   eventTitle: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 4,
//   },
//   eventDate: {
//     color: "#9eb7a8",
//     fontSize: 14,
//   },
//   eventActions: {
//     flexDirection: "row",
//     gap: 4,
//   },
//   actionButton: {
//     margin: 0,
//   },
//   emptyState: {
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 32,
//   },
//   emptyText: {
//     color: "#6B7280",
//     fontSize: 14,
//     marginTop: 8,
//   },
//   signOutButton: {
//     marginTop: 16,
//     borderColor: "rgba(255,255,255,0.2)",
//     borderRadius: 12,
//   },
// });



import EditEventModal from "@/components/EditEventModal"; // YENİ: Modal bileşenini import ediyoruz
import { COLLECTION_ID, DATABASE_ID, databases } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet, // TouchableOpacity eklendi
  View
} from "react-native";
import { Query } from "react-native-appwrite";
import { Button, IconButton, Text } from "react-native-paper";
import { Events } from "../../types/database.type";

interface UserProfile {
  name: string;
  age: number;
  location: string;
  bio: string;
  interests: string[];
  isActive: boolean;
  avatarUrl: string;
}

// YENİ: Düzenleme formu için veri tipi
export interface EditEventData {
  title: string;
  location: string;
  description: string;
  image_url: string;
  event_date: Date;
}


export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [myEvents, setMyEvents] = useState<Events[]>([]);
  
  // ... (Mevcut profile state'iniz burada kalacak)
  const [profile, setProfile] = useState<UserProfile>({
    name: "Kullanıcı",
    age: 24,
    location: "İstanbul",
    bio: "Seyahat etmeyi, yeni yerler keşfetmeyi ve farklı kültürlere dalmayı seven biriyim. Doğa yürüyüşleri, kamp ve su sporları gibi açık hava etkinliklerine bayılıyorum.",
    interests: [
      "✈️ Seyahat",
      "🌲 Doğa Yürüyüşü",
      "📚 Kitap Okuma",
      "🎬 Film",
      "🎵 Müzik",
      "🏄‍♀️ Su Sporları",
    ],
    isActive: true,
    avatarUrl: "https://via.placeholder.com/200x200?text=Avatar",
  });
  
  // YENİ EKLENEN STATE'LER
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Events | null>(null);
  const [editFormData, setEditFormData] = useState<EditEventData>({
      title: "",
      location: "",
      description: "",
      image_url: "",
      event_date: new Date(),
  });

  useEffect(() => {
    if (user) {
      fetchMyEvents();
      if (user.name) {
        setProfile(prev => ({ ...prev, name: user.name }));
      }
    }
  }, [user]);

  const fetchMyEvents = async () => {
    // ... (Bu fonksiyon aynı kalıyor)
    if (!user) return;
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("user_id", user.$id), Query.orderDesc("created_at")]
      );
      setMyEvents(response.documents as Events[]);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    // ... (Bu fonksiyon aynı kalıyor)
     Alert.alert(
      "Etkinliği Sil",
      "Bu etkinliği silmek istediğinizden emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await databases.deleteDocument(
                DATABASE_ID,
                COLLECTION_ID,
                eventId
              );
              fetchMyEvents();
            } catch (error) {
              console.error("Error deleting event:", error);
              Alert.alert("Hata", "Etkinlik silinirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };
  
  // YENİ: Modal'ı açan ve formu dolduran fonksiyon
  const handleOpenEditModal = (event: Events) => {
    setSelectedEvent(event);
    setEditFormData({
        title: event.title,
        location: event.location,
        description: event.description,
        image_url: event.image_url || "",
        event_date: new Date(event.event_date),
    });
    setIsModalVisible(true);
  };

  // YENİ: Etkinliği güncelleyen fonksiyon
  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;

    try {
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID,
            selectedEvent.$id,
            {
                ...editFormData,
                event_date: editFormData.event_date.toISOString(), // Tarihi ISO formatına çevir
            }
        );
        Alert.alert("Başarılı", "Etkinlik başarıyla güncellendi.");
        setIsModalVisible(false);
        fetchMyEvents(); // Listeyi yenile
    } catch (error) {
        console.error("Error updating event:", error);
        Alert.alert("Hata", "Etkinlik güncellenirken bir sorun oluştu.");
    }
  };


  const formatDate = (dateString: string): string => {
    // ... (Bu fonksiyon aynı kalıyor)
    const date = new Date(dateString);
    const months = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
    ];
    const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const dayName = days[date.getDay()];
    return `${day} ${month}, ${dayName}`;
  };

  return (
    <View style={styles.container}>
        {/* Header kısmı aynı kalıyor */}
        <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              iconColor="#fff"
              onPress={() => router.back()}
              style={styles.headerButton}
            />
            <Text style={styles.headerTitle}>Profil</Text>
            <IconButton
              icon="pencil"
              size={24}
              iconColor="#fff"
              onPress={() => console.log("Edit profile")}
              style={styles.headerButton}
            />
        </View>

        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
            {/* Profil, Hakkımda ve İlgi Alanları kısımları aynı kalıyor */}
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatar}/>
              </View>
              <View style={styles.infoContainer}>
                <Text style={styles.name}>{profile.name}, {profile.age}</Text>
                <View style={styles.locationRow}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#9eb7a8"/>
                  <Text style={styles.location}>{profile.location}</Text>
                </View>
                {profile.isActive && (
                  <View style={styles.activeStatus}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>Şu anda aktif</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Hakkımda</Text>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>İlgi Alanları</Text>
              <View style={styles.interestsContainer}>
                {profile.interests.map((interest, index) => (
                  <View key={index} style={styles.interestChip}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Etkinliklerim Kısmı */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Etkinliklerim</Text>
              {myEvents.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="calendar-blank" size={48} color="#9eb7a8"/>
                  <Text style={styles.emptyText}>Henüz etkinlik eklemediniz</Text>
                </View>
              ) : (
                <View style={styles.eventsContainer}>
                  {myEvents.map((event) => (
                    <View key={event.$id} style={styles.eventCard}>
                      <Image source={{ uri: event.image_url || "https://via.placeholder.com/100x100?text=Event" }} style={styles.eventImage} />
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                        <Text style={styles.eventDate}>{formatDate(event.event_date)}</Text>
                      </View>
                      <View style={styles.eventActions}>
                        {/* GÜNCELLENDİ: onPress artık modal'ı açıyor */}
                        <IconButton
                          icon="pencil"
                          size={20}
                          iconColor="rgba(255,255,255,0.6)"
                          onPress={() => handleOpenEditModal(event)} 
                          style={styles.actionButton}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="rgba(255,255,255,0.6)"
                          onPress={() => handleDeleteEvent(event.$id)}
                          style={styles.actionButton}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <Button
              mode="outlined"
              onPress={signOut}
              style={styles.signOutButton}
              textColor="#fff"
              icon="logout"
            >
              Çıkış Yap
            </Button>
        </ScrollView>
        
        {/* YENİ: Modal bileşenini burada render ediyoruz */}
        {selectedEvent && (
            <EditEventModal
                visible={isModalVisible}
                onDismiss={() => setIsModalVisible(false)}
                eventData={editFormData}
                setEventData={setEditFormData}
                onSave={handleUpdateEvent}
            />
        )}
    </View>
  );
}

// Stilleriniz (styles) aynı kalıyor...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000ff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  headerButton: {
    margin: 0,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: "rgba(56, 224, 123, 0.5)",
    marginBottom: 16,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    alignItems: "center",
    gap: 4,
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  location: {
    color: "#9eb7a8",
    fontSize: 16,
  },
  activeStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#38e07b",
  },
  activeText: {
    color: "#38e07b",
    fontSize: 14,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#1f1f1f",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  bioText: {
    color: "#c2d3c9",
    fontSize: 16,
    lineHeight: 24,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  interestChip: {
    backgroundColor: "#4d4c4cff",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  interestText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  eventsContainer: {
    gap: 12,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6d6d6dff",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  eventImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#242524ff",
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  eventDate: {
    color: "#9eb7a8",
    fontSize: 14,
  },
  eventActions: {
    flexDirection: "row",
    gap: 4,
  },
  actionButton: {
    margin: 0,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 8,
  },
  signOutButton: {
    marginTop: 16,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },
});