// import AntDesign from '@expo/vector-icons/AntDesign';
// import Feather from '@expo/vector-icons/Feather';
// import Ionicons from '@expo/vector-icons/Ionicons';
// import Octicons from '@expo/vector-icons/Octicons';
// import { Tabs } from "expo-router";
// export default function TabsLayout() {
//   return (
//     <Tabs screenOptions={{ 
//       headerStyle: { backgroundColor: "#f5f5f5" }, 
//       headerTintColor: "white", 
//       headerShadowVisible: false, 
//       tabBarStyle: { 
//         backgroundColor: "#f5f5f5",
//         borderTopWidth: 0, 
//         elevation: 0, 
//         shadowOpacity: 0 },
//       tabBarActiveTintColor: "blue",
//       tabBarInactiveTintColor: "gray",
      
    
//       }}>
      
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: "Home",
//           tabBarIcon: ({color, focused}) => {
//             return focused ?(  <Octicons name="home" size={24} color="blue" />
//             ):( 
//               <Octicons name="home" size={24} color="black" />
//           );
//         },
//       }}
      
//         />
        
//       <Tabs.Screen
//         name="explore"
//         options={{
//           title: "Explore",
//           tabBarIcon: ({color, focused}) => {
//             return focused ?( <Feather name="search" size={24} color="blue" />
//             ):( 
//               <Feather name="search" size={24} color="black" />
//           );
//         },
//       }}
      
// /><Tabs.Screen
//         name="add-event"
//         options={{
//           title: "Add Event",
//           tabBarIcon: ({color, focused}) => {
//             return focused ?( <Ionicons name="add" size={24} color="blue" />  
//             ):( 
//              <AntDesign name="plus" size={24} color="black" />
//           );
//         },
//       }}
//        />
//       <Tabs.Screen
//         name="message"
//         options={{
//           title: "Messages",
//           tabBarIcon: ({color, focused}) => {
//             return focused ?( <Feather name="message-circle" size={24} color="blue" />
//             ):( 
//               <Feather name="message-circle" size={24} color="black" />
//           );
//         },
//       }}
      
    
//       />
       
//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: "Profile",
//           tabBarIcon: ({color, focused}) => {
//             return focused ?( <Feather name="user" size={24} color="blue" /> 
//             ):( 
//              <Feather name="user" size={24} color="black" />
//           );
//         },
//       }}
//       />
//       <Tabs.Screen name="login" options={{ title: "Login" }} />
//     </Tabs>
//   );
// }

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StatusBar } from 'react-native';

export default function TabLayout() {
  return (
    <>
      {/* Status Bar'ı karanlık yap */}
      <StatusBar barStyle="light-content" backgroundColor="#111714" />
      
      <Tabs
        screenOptions={{
          // Header'ı gizle
          headerShown: false, // BU SATIRI EKLEDİM
          
          // Tab bar ayarları
          tabBarActiveTintColor: '#386ae0ff', // Aktif tab rengi (yeşil)
          tabBarInactiveTintColor: '#6B7280', // Pasif tab rengi (gri)
          tabBarStyle: {
            backgroundColor: '#242424ff', // Alt bar arka plan rengi (siyah)
            borderTopColor: '#242424ff', // Üst border rengi
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 88 : 65,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}>
        
        {/* Home Tab */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />

        {/* Explore Tab */}
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="compass" size={size} color={color} />
            ),
          }}
        />

        {/* Add Event Tab */}
        <Tabs.Screen
          name="add-event"
          options={{
            title: 'Add Event',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle" size={size} color={color} />
            ),
          }}
        />

        {/* Messages Tab */}
        <Tabs.Screen
          name="message"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles" size={size} color={color} />
            ),
          }}
        />

        {/* Profile Tab */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false, // Profile'da zaten yoktu
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}