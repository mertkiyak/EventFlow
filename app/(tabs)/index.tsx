
// import {
//   client,
//   COLLECTION_ID,
//   COMPLETIONS_COLLECTION_ID,
//   DATABASE_ID,
//   databases,
//   RealTimeEventResponse,
// } from "@/lib/appwrite";
// import { useAuth } from "@/lib/auth-context";
// import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
// import { useEffect, useRef, useState } from "react";
// import { ScrollView, StyleSheet, View } from "react-native";
// import { ID, Query } from "react-native-appwrite";
// import { Swipeable } from "react-native-gesture-handler";
// import { Button, Surface, Text } from "react-native-paper";
// import { EventCompletion, Events } from "../../types/database.type";

// export default function Index() {
//   const { signOut, user } = useAuth();
//   const [events, setEvents] = useState<Events[]>([]);
//   const [completedEvents, setCompletedEvents] = useState<string[]>([]);

//   const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

//   useEffect(() => {
//     if (user) {
//       const eventsChannel = `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`;
//       const eventSubscription = client.subscribe(
//         eventsChannel,
//         (response: RealTimeEventResponse) => {
//           if (
//             response.events.includes(
//               "databases.*.collections.*.documents.*.create"
//             ) ||
//             response.events.includes(
//               "databases.*.collections.*.documents.*.update"
//             ) ||
//             response.events.includes(
//               "databases.*.collections.*.documents.*.delete"
//             )
//           ) {
//             fetchEvents();
//           }
//         }
//       );

//       const completionsChannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;
//       const completionSubscription = client.subscribe(
//         completionsChannel,
//         (response: RealTimeEventResponse) => {
//           if (
//             response.events.includes(
//               "databases.*.collections.*.documents.*.create"
//             )
//           ) {
//             fetchTodayCompletions();
//           }
//         }
//       );

//       fetchEvents();
//       fetchTodayCompletions();
//       return () => {
//         eventSubscription();
//         completionSubscription();
//       };
//     }
//   }, [user]);

//   const fetchEvents = async () => {
//     if (!user) return;
    
//     try {
//       const response = await databases.listDocuments(
//         DATABASE_ID,
//         COLLECTION_ID,
//         [Query.equal("user_id", user.$id)]
//       );
//       setEvents(response.documents as Events[]);
//     } catch (error) {
//       console.error("Error fetching events:", error);
//     }
//   };

//   const fetchTodayCompletions = async () => {
//     if (!user) return;
    
//     try {
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       const response = await databases.listDocuments(
//         DATABASE_ID,
//         COMPLETIONS_COLLECTION_ID,
//         [
//           Query.equal("user_id", user.$id),
//           Query.greaterThan("completed_at", today.toISOString())
//         ]
//       );

//       const completions = response.documents as EventCompletion[];
//       setCompletedEvents(completions.map((c) => c.event_id));
//     } catch (error) {
//       console.error("Error fetching completions:", error);
//     }
//   };

//   const handleDeleteEvent = async (id: string) => {
//     try {
//       await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
//     } catch (error) {
//       console.error("Error deleting event:", error);
//     }
//   };

//   const handleCompleteEvent = async (id: string) => {
//     if (!user || completedEvents?.includes(id)) return;
    
//     try {
//       const currentDate = new Date().toISOString();
//       await databases.createDocument(
//         DATABASE_ID,
//         COMPLETIONS_COLLECTION_ID,
//         ID.unique(),
//         {
//           event_id: id,
//           user_id: user.$id,
//           completed_at: currentDate,
//         }
//       );

//       const event = events?.find((h) => h.$id === id);
//       if (!event) return;
      
//       await databases.updateDocument(DATABASE_ID, COLLECTION_ID, id, {
//         streak_count: event.streak_count + 1,
//         last_completed: currentDate,
//       });
//     } catch (error) {
//       console.error("Error completing event:", error);
//     }
//   };

//   const isEventCompleted = (eventId: string) => completedEvents?.includes(eventId);

//   const renderLeftActions = (eventId: string) => (
//     <View style={styles.swipeActionLeft}>
//       {isEventCompleted(eventId) ? (
//         <Text style={{color:"#fff", fontWeight:"bold"}}>Completed</Text>
//       ) : (
//        <MaterialCommunityIcons
//         name="check-circle-outline"
//         size={32}
//         color="#fff" 
//       />
//       )}
      
//     </View>
//   );

//   const renderRightActions = (eventId: string) => (
//     <View style={styles.swipeActionRight}>
//         <MaterialCommunityIcons
//           name="trash-can-outline"
//           size={32}
//           color="#fff" 
//         />
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text variant="headlineSmall" style={styles.title}>
//           Welcome
//         </Text>
//         <Button mode="text" onPress={signOut} icon={"logout"}>
//           Sign Out
//         </Button>
//       </View>

//       <ScrollView showsVerticalScrollIndicator={false}>
//         {events?.length === 0 ? (
//           <View style={styles.emptyState}>
//             <Text style={styles.emptyStateText}>No events found.</Text>
//           </View>
//         ) : (
//           events?.map((event, key) => (
//             <Swipeable
//               ref={(ref) => {
//                 swipeableRefs.current[event.$id] = ref;
//               }}
//               key={key}
//               overshootLeft={false}
//               overshootRight={false}
//               renderLeftActions={() => renderLeftActions(event.$id)}
//               renderRightActions={() => renderRightActions(event.$id)}
//               onSwipeableOpen={(direction) => {
//                 if (direction === "right") {
//                   handleDeleteEvent(event.$id);
//                   swipeableRefs.current[event.$id]?.close();
//                 } else if (direction === "left") {
//                   handleCompleteEvent(event.$id);
//                   swipeableRefs.current[event.$id]?.close();
//                 }
//               }}
//             >
//               <Surface
//                 style={[
//                   styles.card,
//                   isEventCompleted(event.$id) && styles.cardCompleted,
//                 ]}
//                 elevation={0}
//               >
//                 <View style={styles.cardContent}>
//                   <Text style={styles.cardTitle}>{event.title}</Text>
//                   <Text style={styles.cardDescription}>
//                     {event.description}
//                   </Text>
//                   <View style={styles.cardFooter}>
//                     <View style={styles.frequencyBadge}>
//                       <MaterialCommunityIcons
//                         name="fire"
//                         size={14}
//                         color="orange"
//                       />
//                       <Text style={styles.frequencyText}>
//                         {event.frequency.charAt(0).toUpperCase() +
//                           event.frequency.slice(1)}
//                       </Text>
//                     </View>
//                     <Text style={styles.streakText}>
//                       Streak Count: {event.streak_count} day streak
//                     </Text>
//                   </View>
//                 </View>
//               </Surface>
//             </Swipeable>
//           ))
//         )}
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: "#f5f5f5",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   title: {
//     fontWeight: "bold",
//     fontSize: 24,
//   },
//   card: {
//     marginBottom: 8,
//     borderRadius: 8,
//     backgroundColor: "#f3dfffff",
//     padding: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   cardCompleted: {
//     backgroundColor: "#c8ffa3ff",
//   },
//   cardContent: {
//     padding: 5,
//   },
//   cardTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 8,
//     color: "#22223b",
//   },
//   cardDescription: {
//     fontSize: 16,
//     marginBottom: 4,
//     color: "#6c6c80",
//   },
//   cardFooter: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   frequencyBadge: {
//     backgroundColor: "#ede7f6",
//     borderRadius: 8,
//     padding: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   frequencyText: {
//     fontSize: 14,
//     color: "#7c4bff",
//     fontWeight: "bold",
//     marginLeft: 4,
//   },
//   streakText: {
//     marginLeft: 8,
//     fontSize: 14,
//     color: "#ffea00ff",
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   emptyStateText: {
//     fontSize: 18,
//     color: "#6c6c80",
//   },
//   swipeActionLeft: {
//     backgroundColor: "green",
//     justifyContent: "center",
//     alignItems: "flex-start",
//     paddingHorizontal: 20,
//     flex: 1,
//     borderRadius: 18,
//     marginBottom: 18,
//     marginTop: 2,
//     paddingLeft: 16,
//   },
//   swipeActionRight: {
//     backgroundColor: "red",
//     justifyContent: "center",
//     alignItems: "flex-end",
//     paddingHorizontal: 20,
//     flex: 1,
//     borderRadius: 18,
//     marginBottom: 18,
//     marginTop: 2,
//     paddingRight: 16,
//   },
// });




// import {
//   client,
//   COLLECTION_ID,
//   COMPLETIONS_COLLECTION_ID,
//   DATABASE_ID,
//   databases,
//   RealTimeEventResponse,
// } from "@/lib/appwrite";
// import { useAuth } from "@/lib/auth-context";
// import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
// import { useEffect, useRef, useState } from "react";
// import { ScrollView, StyleSheet, View } from "react-native";
// import { ID, Query } from "react-native-appwrite";
// import { Swipeable } from "react-native-gesture-handler";
// import { Button, Surface, Text } from "react-native-paper";
// import { EventCompletion, Events } from "../../types/database.type";

// export default function Index() {
//   const { signOut, user } = useAuth();
//   const [events, setEvents] = useState<Events[]>([]);
//   const [completedEvents, setCompletedEvents] = useState<string[]>([]);

//   const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

//   useEffect(() => {
//     if (user) {
//       const eventsChannel = `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`;
//       const eventSubscription = client.subscribe(
//         eventsChannel,
//         (response: RealTimeEventResponse) => {
//           if (
//             response.events.includes(
//               "databases.*.collections.*.documents.*.create"
//             ) ||
//             response.events.includes(
//               "databases.*.collections.*.documents.*.update"
//             ) ||
//             response.events.includes(
//               "databases.*.collections.*.documents.*.delete"
//             )
//           ) {
//             fetchEvents();
//           }
//         }
//       );

//       const completionsChannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;
//       const completionSubscription = client.subscribe(
//         completionsChannel,
//         (response: RealTimeEventResponse) => {
//           if (
//             response.events.includes(
//               "databases.*.collections.*.documents.*.create"
//             )
//           ) {
//             fetchTodayCompletions();
//           }
//         }
//       );

//       fetchEvents();
//       fetchTodayCompletions();
//       return () => {
//         eventSubscription();
//         completionSubscription();
//       };
//     }
//   }, [user]);

//   const fetchEvents = async () => {
//     if (!user) return;
    
//     try {
//       const response = await databases.listDocuments(
//         DATABASE_ID,
//         COLLECTION_ID,
//         [Query.equal("user_id", user.$id)]
//       );
//       setEvents(response.documents as Events[]);
//     } catch (error) {
//       console.error("Error fetching events:", error);
//     }
//   };

//   const fetchTodayCompletions = async () => {
//     if (!user) return;
    
//     try {
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       const response = await databases.listDocuments(
//         DATABASE_ID,
//         COMPLETIONS_COLLECTION_ID,
//         [
//           Query.equal("user_id", user.$id),
//           Query.greaterThan("completed_at", today.toISOString())
//         ]
//       );

//       const completions = response.documents as EventCompletion[];
//       setCompletedEvents(completions.map((c) => c.event_id));
//     } catch (error) {
//       console.error("Error fetching completions:", error);
//     }
//   };

//   const handleDeleteEvent = async (id: string) => {
//     try {
//       await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
//     } catch (error) {
//       console.error("Error deleting event:", error);
//     }
//   };

//   const handleCompleteEvent = async (id: string) => {
//     if (!user || completedEvents?.includes(id)) return;
    
//     try {
//       const currentDate = new Date().toISOString();
//       await databases.createDocument(
//         DATABASE_ID,
//         COMPLETIONS_COLLECTION_ID,
//         ID.unique(),
//         {
//           event_id: id,
//           user_id: user.$id,
//           completed_at: currentDate,
//         }
//       );

//       const event = events?.find((h) => h.$id === id);
//       if (!event) return;
      
//       await databases.updateDocument(DATABASE_ID, COLLECTION_ID, id, {
//         streak_count: event.streak_count + 1,
//         last_completed: currentDate,
//       });
//     } catch (error) {
//       console.error("Error completing event:", error);
//     }
//   };

//   const isEventCompleted = (eventId: string) => completedEvents?.includes(eventId);

//   const renderLeftActions = (eventId: string) => (
//     <View style={styles.swipeActionLeft}>
//       {isEventCompleted(eventId) ? (
//         <Text style={{color:"#fff", fontWeight:"bold"}}>Completed</Text>
//       ) : (
//        <MaterialCommunityIcons
//         name="check-circle-outline"
//         size={32}
//         color="#fff" 
//       />
//       )}
      
//     </View>
//   );

//   const renderRightActions = (eventId: string) => (
//     <View style={styles.swipeActionRight}>
//         <MaterialCommunityIcons
//           name="trash-can-outline"
//           size={32}
//           color="#fff" 
//         />
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text variant="headlineSmall" style={styles.title}>
//           Welcome
//         </Text>
//         <Button mode="text" onPress={signOut} icon={"logout"}>
//           Sign Out
//         </Button>
//       </View>

//       <ScrollView showsVerticalScrollIndicator={false}>
//         {events?.length === 0 ? (
//           <View style={styles.emptyState}>
//             <Text style={styles.emptyStateText}>No events found.</Text>
//           </View>
//         ) : (
//           events?.map((event, key) => (
//             <Swipeable
//               ref={(ref) => {
//                 swipeableRefs.current[event.$id] = ref;
//               }}
//               key={key}
//               overshootLeft={false}
//               overshootRight={false}
//               renderLeftActions={() => renderLeftActions(event.$id)}
//               renderRightActions={() => renderRightActions(event.$id)}
//               onSwipeableOpen={(direction) => {
//                 if (direction === "right") {
//                   handleDeleteEvent(event.$id);
//                   swipeableRefs.current[event.$id]?.close();
//                 } else if (direction === "left") {
//                   handleCompleteEvent(event.$id);
//                   swipeableRefs.current[event.$id]?.close();
//                 }
//               }}
//             >
//               <Surface
//                 style={[
//                   styles.card,
//                   isEventCompleted(event.$id) && styles.cardCompleted,
//                 ]}
//                 elevation={0}
//               >
//                 <View style={styles.cardContent}>
//                   <Text style={styles.cardTitle}>{event.title}</Text>
//                   <Text style={styles.cardDescription}>
//                     {event.description}
//                   </Text>
//                   <View style={styles.cardFooter}>
//                     <View style={styles.frequencyBadge}>
//                       <MaterialCommunityIcons
//                         name="fire"
//                         size={14}
//                         color="orange"
//                       />
//                       <Text style={styles.frequencyText}>
//                         {event.frequency.charAt(0).toUpperCase() +
//                           event.frequency.slice(1)}
//                       </Text>
//                     </View>
//                     <Text style={styles.streakText}>
//                       Streak Count: {event.streak_count} day streak
//                     </Text>
//                   </View>
//                 </View>
//               </Surface>
//             </Swipeable>
//           ))
//         )}
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: "#f5f5f5",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   title: {
//     fontWeight: "bold",
//     fontSize: 24,
//   },
//   card: {
//     marginBottom: 8,
//     borderRadius: 8,
//     backgroundColor: "#f3dfffff",
//     padding: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   cardCompleted: {
//     backgroundColor: "#c8ffa3ff",
//   },
//   cardContent: {
//     padding: 5,
//   },
//   cardTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 8,
//     color: "#22223b",
//   },
//   cardDescription: {
//     fontSize: 16,
//     marginBottom: 4,
//     color: "#6c6c80",
//   },
//   cardFooter: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   frequencyBadge: {
//     backgroundColor: "#ede7f6",
//     borderRadius: 8,
//     padding: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   frequencyText: {
//     fontSize: 14,
//     color: "#7c4bff",
//     fontWeight: "bold",
//     marginLeft: 4,
//   },
//   streakText: {
//     marginLeft: 8,
//     fontSize: 14,
//     color: "#ffea00ff",
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   emptyStateText: {
//     fontSize: 18,
//     color: "#6c6c80",
//   },
//   swipeActionLeft: {
//     backgroundColor: "green",
//     justifyContent: "center",
//     alignItems: "flex-start",
//     paddingHorizontal: 20,
//     flex: 1,
//     borderRadius: 18,
//     marginBottom: 18,
//     marginTop: 2,
//     paddingLeft: 16,
//   },
//   swipeActionRight: {
//     backgroundColor: "red",
//     justifyContent: "center",
//     alignItems: "flex-end",
//     paddingHorizontal: 20,
//     flex: 1,
//     borderRadius: 18,
//     marginBottom: 18,
//     marginTop: 2,
//     paddingRight: 16,
//   },
// });


import {
  client,
  COLLECTION_ID,
  DATABASE_ID,
  databases,
  RealTimeEventResponse,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Query } from "react-native-appwrite";
// YENİ EKLENDİ: Modal ve Portal import edildi
import { Button, IconButton, Modal, Portal, Text } from "react-native-paper";
import { Events } from "../../types/database.type";

export default function Index() {
  const { signOut, user } = useAuth();
  const [myEvents, setMyEvents] = useState<Events[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<Events[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Events[]>([]);

  // YENİ EKLENDİ: Modal yönetimi için state'ler
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Events | null>(null);

  useEffect(() => {
    if (user) {
      const eventsChannel = `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`;
      const eventSubscription = client.subscribe(
        eventsChannel,
        (response: RealTimeEventResponse) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            ) ||
            response.events.includes(
              "databases.*.collections.*.documents.*.update"
            ) ||
            response.events.includes(
              "databases.*.collections.*.documents.*.delete"
            )
          ) {
            fetchAllEvents();
          }
        }
      );

      fetchAllEvents();
      return () => {
        eventSubscription();
      };
    }
  }, [user]);

  const fetchAllEvents = async () => {
    if (!user) return;
    
    try {
      // Benim eklediğim etkinlikler
      const myEventsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("user_id", user.$id), Query.orderDesc("created_at")]
      );
      setMyEvents(myEventsResponse.documents as Events[]);

      // Yaklaşan etkinlikler (gelecek tarihli)
      const now = new Date().toISOString();
      const upcomingResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal("user_id", user.$id),
          Query.greaterThanEqual("event_date", now),
          Query.orderAsc("event_date"),
          Query.limit(10)
        ]
      );
      setUpcomingEvents(upcomingResponse.documents as Events[]);

      // İlgi alanlarına göre etkinlikler (diğer kullanıcıların etkinlikleri)
      const recommendedResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.notEqual("user_id", user.$id),
          Query.orderDesc("created_at"),
          Query.limit(10)
        ]
      );
      setRecommendedEvents(recommendedResponse.documents as Events[]);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleJoinEvent = (eventId: string) => {
    console.log("Joining event:", eventId);
    // Burada etkinliğe katılma API çağrısı yapılabilir
    handleCloseModal(); // Katıldıktan sonra modal'ı kapat
  };
  
  // YENİ EKLENDİ: Modal'ı açan fonksiyon
  const handleCardPress = (event: Events) => {
    setSelectedEvent(event);
    setIsModalVisible(true);
  };

  // YENİ EKLENDİ: Modal'ı kapatan fonksiyon
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedEvent(null);
  };


  // Bu fonksiyonlar aynı kalıyor
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    return `${dayName}, ${day} ${month}`;
  };
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // GÜNCELLENDİ: EventCard artık onCardPress prop'u alıyor
  const EventCard = ({ event, showJoinButton = true, onCardPress }: { event: Events; showJoinButton?: boolean, onCardPress: (event: Events) => void }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => onCardPress(event)}>
      <Image
        source={{ 
          uri: event.image_url || 'https://via.placeholder.com/400x200?text=Etkinlik+Görseli'
        }}
        style={styles.eventImage}
      />
      
      <View style={styles.cardContent}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar" size={16} color="#9CA3AF" />
          <Text style={styles.infoText}>{formatDate(event.event_date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#9CA3AF" />
          <Text style={styles.infoText}>{formatTime(event.event_date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#9CA3AF" />
          <Text style={styles.infoText} numberOfLines={1}>
            {event.location || "Konum belirtilmemiş"}
          </Text>
        </View>
        {/* Katıl butonu artık kartın içinde ve tıklamayı engellemiyor */}
        {showJoinButton && (
          <Button
            mode="contained"
            onPress={() => handleJoinEvent(event.$id)}
            style={styles.joinButton}
            buttonColor="#3B82F6"
            textColor="#fff"
          >
            Katıl
          </Button>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Ana Sayfa
        </Text>
        <View style={styles.headerActions}>
          <IconButton icon="bell-outline" size={24} onPress={() => console.log("Notifications")} />
          <IconButton icon="logout" size={24} onPress={signOut} />
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Benim Eklediğim Etkinlikler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benim Eklediğim Etkinlikler</Text>
          {myEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Henüz etkinlik eklemediniz</Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {myEvents.map((event) => (
                <View key={event.$id} style={styles.horizontalCard}>
                  {/* GÜNCELLENDİ: onCardPress prop'u eklendi */}
                  <EventCard event={event} showJoinButton={false} onCardPress={handleCardPress} />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* İlgi Alanlarıma Göre Etkinlikler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İlgi Alanlarıma Göre Etkinlikler</Text>
          {recommendedEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="star-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Öneri bulunamadı</Text>
            </View>
          ) : (
            recommendedEvents.map((event) => (
              // GÜNCELLENDİ: onCardPress prop'u eklendi
              <EventCard key={event.$id} event={event} onCardPress={handleCardPress} />
            ))
          )}
        </View>

        {/* Yaklaşan Etkinlikler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yaklaşan Etkinlikler</Text>
          {upcomingEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-clock" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Yaklaşan etkinlik yok</Text>
            </View>
          ) : (
            upcomingEvents.map((event) => (
              // GÜNCELLENDİ: onCardPress prop'u eklendi
              <EventCard key={event.$id} event={event} showJoinButton={false} onCardPress={handleCardPress} />
            ))
          )}
        </View>
      </ScrollView>

      {/* YENİ EKLENDİ: Etkinlik Detay Modal'ı */}
      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={handleCloseModal}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedEvent && (
            <ScrollView>
              <Image 
                source={{ uri: selectedEvent.image_url || 'https://via.placeholder.com/400x200?text=Etkinlik+Görseli' }} 
                style={styles.modalImage} 
              />
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
                
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="calendar" size={18} color="#9CA3AF" />
                  <Text style={styles.modalInfoText}>{formatDate(selectedEvent.event_date)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color="#9CA3AF" />
                  <Text style={styles.modalInfoText}>{formatTime(selectedEvent.event_date)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="map-marker" size={18} color="#9CA3AF" />
                  <Text style={styles.modalInfoText}>{selectedEvent.location}</Text>
                </View>

                <Text style={styles.modalDescriptionTitle}>Açıklama</Text>
                <Text style={styles.modalDescription}>{selectedEvent.description || "Açıklama bulunmuyor."}</Text>
                
                <Button
                  mode="contained"
                  onPress={() => handleJoinEvent(selectedEvent.$id)}
                  style={styles.joinButton}
                  buttonColor="#3B82F6"
                >
                  Etkinliğe Katıl
                </Button>
                 <Button
                  mode="text"
                  onPress={handleCloseModal}
                  style={styles.modalCloseButton}
                  textColor="#9CA3AF"
                >
                  Kapat
                </Button>
              </View>
            </ScrollView>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

// Stiller güncellendi
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingRight: 16,
  },
  horizontalCard: {
    width: 280,
    marginRight: 12,
  },
  card: {
    backgroundColor: "#1F1F1F",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  eventImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#2A2A2A",
  },
  cardContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 12,
  },
  joinButton: {
    marginTop: 12,
    borderRadius: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  // YENİ MODAL STİLLERİ
  modalContainer: {
    backgroundColor: '#1F1F1F',
    margin: 20,
    borderRadius: 16,
    maxHeight: '85%',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalInfoText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 10,
  },
  modalDescriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalCloseButton: {
    marginTop: 8,
  },
});