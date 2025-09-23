import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from "expo-router";
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ 
      headerStyle: { backgroundColor: "#f5f5f5" }, 
      headerTintColor: "white", 
      headerShadowVisible: false, 
      tabBarStyle: { 
        backgroundColor: "#f5f5f5",
        borderTopWidth: 0, 
        elevation: 0, 
        shadowOpacity: 0 },
      tabBarActiveTintColor: "blue",
      tabBarInactiveTintColor: "gray",
      
    
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({color, focused}) => {
            return focused ?( <Entypo name="home" size={24} color={focused ? "blue" : color} />
            ):( 
              <Feather name="home" size={24} color="black" />
          );
        },
      }}
      
        />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({color, focused}) => {
            return focused ?( <AntDesign name="search1" size={24} color="blue" /> 
            ):( 
             <AntDesign name="search1" size={24} color="black" />
          );
        },
      }}
      
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({color, focused}) => {
            return focused ?( <Ionicons name="notifications" size={24} color={focused ? "blue" : color} />
            ):( 
              <Ionicons name="notifications-outline" size={24} color="black" />
          );
        },
      }}
      
    
      />
       <Tabs.Screen
        name="add-event"
        options={{
          title: "Add Event",
          tabBarIcon: ({color, focused}) => {
            return focused ?( <Ionicons name="add" size={24} color="black" />  
            ):( 
             <Ionicons name="add" size={24} color="black" />
          );
        },
      }}
      
      />
      <Tabs.Screen name="login" options={{ title: "Login" }} />
    </Tabs>
  );
}
