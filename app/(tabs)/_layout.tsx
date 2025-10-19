import { theme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StatusBar } from 'react-native';

export default function TabLayout() {
  return (
    <>
      {/* Status Bar'ı karanlık yap */}
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <Tabs
        screenOptions={{
          // Header'ı gizle
          headerShown: false,
          
          // Tab bar ayarları
          tabBarActiveTintColor: theme.colors.primary, // Aktif tab rengi
          tabBarInactiveTintColor: theme.colors.textSecondary, // Pasif tab rengi
          tabBarStyle: {
            backgroundColor: theme.colors.surface, // Alt bar arka plan rengi
            borderTopColor: theme.colors.border, // Üst border rengi
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
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}