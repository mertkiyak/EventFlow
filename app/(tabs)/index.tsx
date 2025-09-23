
import {
  client,
  COLLECTION_ID,
  COMPLETIONS_COLLECTION_ID,
  DATABASE_ID,
  databases,
  RealTimeEventResponse,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { Button, Surface, Text } from "react-native-paper";
import { EventCompletion, Events } from "../../types/database.type";

export default function Index() {
  const { signOut, user } = useAuth();
  const [events, setEvents] = useState<Events[]>([]);
  const [completedEvents, setCompletedEvents] = useState<string[]>([]);

  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

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
            fetchEvents();
          }
        }
      );

      const completionsChannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;
      const completionSubscription = client.subscribe(
        completionsChannel,
        (response: RealTimeEventResponse) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            )
          ) {
            fetchTodayCompletions();
          }
        }
      );

      fetchEvents();
      fetchTodayCompletions();
      return () => {
        eventSubscription();
        completionSubscription();
      };
    }
  }, [user]);

  const fetchEvents = async () => {
    if (!user) return;
    
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("user_id", user.$id)]
      );
      setEvents(response.documents as Events[]);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchTodayCompletions = async () => {
    if (!user) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const response = await databases.listDocuments(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [
          Query.equal("user_id", user.$id),
          Query.greaterThan("completed_at", today.toISOString())
        ]
      );

      const completions = response.documents as EventCompletion[];
      setCompletedEvents(completions.map((c) => c.event_id));
    } catch (error) {
      console.error("Error fetching completions:", error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleCompleteEvent = async (id: string) => {
    if (!user || completedEvents?.includes(id)) return;
    
    try {
      const currentDate = new Date().toISOString();
      await databases.createDocument(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        ID.unique(),
        {
          event_id: id,
          user_id: user.$id,
          completed_at: currentDate,
        }
      );

      const event = events?.find((h) => h.$id === id);
      if (!event) return;
      
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, id, {
        streak_count: event.streak_count + 1,
        last_completed: currentDate,
      });
    } catch (error) {
      console.error("Error completing event:", error);
    }
  };

  const isEventCompleted = (eventId: string) => completedEvents?.includes(eventId);

  const renderLeftActions = (eventId: string) => (
    <View style={styles.swipeActionLeft}>
      {isEventCompleted(eventId) ? (
        <Text style={{color:"#fff", fontWeight:"bold"}}>Completed</Text>
      ) : (
       <MaterialCommunityIcons
        name="check-circle-outline"
        size={32}
        color="#fff" 
      />
      )}
      
    </View>
  );

  const renderRightActions = (eventId: string) => (
    <View style={styles.swipeActionRight}>
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={32}
          color="#fff" 
        />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Welcome
        </Text>
        <Button mode="text" onPress={signOut} icon={"logout"}>
          Sign Out
        </Button>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {events?.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No events found.</Text>
          </View>
        ) : (
          events?.map((event, key) => (
            <Swipeable
              ref={(ref) => {
                swipeableRefs.current[event.$id] = ref;
              }}
              key={key}
              overshootLeft={false}
              overshootRight={false}
              renderLeftActions={() => renderLeftActions(event.$id)}
              renderRightActions={() => renderRightActions(event.$id)}
              onSwipeableOpen={(direction) => {
                if (direction === "right") {
                  handleDeleteEvent(event.$id);
                  swipeableRefs.current[event.$id]?.close();
                } else if (direction === "left") {
                  handleCompleteEvent(event.$id);
                  swipeableRefs.current[event.$id]?.close();
                }
              }}
            >
              <Surface
                style={[
                  styles.card,
                  isEventCompleted(event.$id) && styles.cardCompleted,
                ]}
                elevation={0}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{event.title}</Text>
                  <Text style={styles.cardDescription}>
                    {event.description}
                  </Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.frequencyBadge}>
                      <MaterialCommunityIcons
                        name="fire"
                        size={14}
                        color="orange"
                      />
                      <Text style={styles.frequencyText}>
                        {event.frequency.charAt(0).toUpperCase() +
                          event.frequency.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.streakText}>
                      Streak Count: {event.streak_count} day streak
                    </Text>
                  </View>
                </View>
              </Surface>
            </Swipeable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontWeight: "bold",
    fontSize: 24,
  },
  card: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#f3dfffff",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardCompleted: {
    backgroundColor: "#c8ffa3ff",
  },
  cardContent: {
    padding: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#22223b",
  },
  cardDescription: {
    fontSize: 16,
    marginBottom: 4,
    color: "#6c6c80",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  frequencyBadge: {
    backgroundColor: "#ede7f6",
    borderRadius: 8,
    padding: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  frequencyText: {
    fontSize: 14,
    color: "#7c4bff",
    fontWeight: "bold",
    marginLeft: 4,
  },
  streakText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#ffea00ff",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 18,
    color: "#6c6c80",
  },
  swipeActionLeft: {
    backgroundColor: "green",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    flex: 1,
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingLeft: 16,
  },
  swipeActionRight: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    flex: 1,
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingRight: 16,
  }, 
  cardText: {
    color: "#6c6c80",
  },
  cardTextCompleted: {
    textDecorationLine: "line-through",
    color: "#6c6c80",
  }
});