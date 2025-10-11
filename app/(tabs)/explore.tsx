import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 sütun için

// Demo etkinlikler
const EVENTS = [
  {
    id: '1',
    title: 'Yoga dersi',
    time: '10:00 - 11:00',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
  },
  {
    id: '2',
    title: 'Müzik festivali',
    time: '18:00 - 22:00',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
  },
  {
    id: '3',
    title: 'Kitap kulübü',
    time: '14:00 - 16:00',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400',
  },
  {
    id: '4',
    title: 'Yemek atölyesi',
    time: '19:00 - 21:00',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400',
  },
  {
    id: '5',
    title: 'Fotoğraf gezisi',
    time: '09:00 - 12:00',
    image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400',
  },
  {
    id: '6',
    title: 'Sinema gecesi',
    time: '20:00 - 23:00',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400',
  },
];

const FILTER_BUTTONS = ['Bugün', 'Yarın', 'Bu hafta', 'Hafta sonu'];

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111714" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Keşfet</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9eb7a8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Etkinlik veya buluşma ara"
              placeholderTextColor="#acacacff"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filter Buttons */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_BUTTONS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(selectedFilter === filter ? null : filter)}
            >
              <Text style={[
                styles.filterChipText,
                selectedFilter === filter && styles.filterChipTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.filterChip}>
            <Ionicons name="calendar-outline" size={16} color="#ffffff" />
            <Text style={styles.filterChipText}>Tarih seç</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Yakınımdaki etkinlikler</Text>

        {/* Events Grid */}
        <View style={styles.eventsGrid}>
          {EVENTS.map((event) => (
            <TouchableOpacity 
              key={event.id} 
              style={styles.eventCard}
              activeOpacity={0.8}
            >
              <Image 
                source={{ uri: event.image }}
                style={styles.eventImage}
              />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {event.title}
                </Text>
                <Text style={styles.eventTime}>{event.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.bottomButton}>
          <Text style={styles.bottomButtonText}>
            Yakınımdaki Etkinlikleri Bul
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000ff',
  },
  scrollView: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000ff',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search Bar Styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#000000ff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#363636ff',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },

  // Filter Styles
  filterScrollView: {
    maxHeight: 50,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#404040ff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 32,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
  },
  filterChipText: {
    color: '#ffffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#ffffffff',
  },

  // Section Title
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },

  // Events Grid
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
  },
  eventCard: {
    width: CARD_WIDTH,
    marginBottom: 8,
  },
  eventImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#484848ff',
  },
  eventInfo: {
    marginTop: 12,
    gap: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  eventTime: {
    fontSize: 14,
    color: '#c2c2c2ff',
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 100,
  },

  // Bottom Button
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#161616ff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e1e1eff',
  },
  bottomButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});