import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import Octicons from '@expo/vector-icons/Octicons';
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
            return focused ?(  <Octicons name="home" size={24} color="blue" />
            ):( 
              <Octicons name="home" size={24} color="black" />
          );
        },
      }}
      
        />
        
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({color, focused}) => {
            return focused ?( <Feather name="search" size={24} color="blue" />
            ):( 
              <Feather name="search" size={24} color="black" />
          );
        },
      }}
      
/><Tabs.Screen
        name="add-event"
        options={{
          title: "Add Event",
          tabBarIcon: ({color, focused}) => {
            return focused ?( <Ionicons name="add" size={24} color="blue" />  
            ):( 
             <AntDesign name="plus" size={24} color="black" />
          );
        },
      }}
       />
      <Tabs.Screen
        name="message"
        options={{
          title: "Messages",
          tabBarIcon: ({color, focused}) => {
            return focused ?( <Feather name="message-circle" size={24} color="blue" />
            ):( 
              <Feather name="message-circle" size={24} color="black" />
          );
        },
      }}
      
    
      />
       
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({color, focused}) => {
            return focused ?( <Feather name="user" size={24} color="blue" /> 
            ):( 
             <Feather name="user" size={24} color="black" />
          );
        },
      }}
      />
      <Tabs.Screen name="login" options={{ title: "Login" }} />
    </Tabs>
  );
}
