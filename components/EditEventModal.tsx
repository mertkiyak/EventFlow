import { EditEventData } from '@/app/(tabs)/profile';
import { Dispatch, SetStateAction } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface EditEventModalProps {
  visible: boolean;
  onDismiss: () => void;
  eventData: EditEventData;
  setEventData: Dispatch<SetStateAction<EditEventData>>;
  onSave: () => Promise<void>;
}

export default function EditEventModal({
  visible,
  onDismiss,
  eventData,
  setEventData,
  onSave,
}: EditEventModalProps) {
  const handleSave = async () => {
    await onSave();
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (text: string) => {
    // Basit tarih parse işlemi (YYYY-MM-DD formatında)
    const date = new Date(text);
    if (!isNaN(date.getTime())) {
      setEventData(prev => ({ ...prev, event_date: date }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Etkinliği Düzenle</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Etkinlik Başlığı</Text>
              <TextInput
                style={styles.input}
                placeholder="Başlık girin"
                placeholderTextColor="#6B7280"
                value={eventData.title}
                onChangeText={(text) =>
                  setEventData(prev => ({ ...prev, title: text }))
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Konum</Text>
              <TextInput
                style={styles.input}
                placeholder="Konum girin"
                placeholderTextColor="#6B7280"
                value={eventData.location}
                onChangeText={(text) =>
                  setEventData(prev => ({ ...prev, location: text }))
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Açıklama</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Açıklama girin"
                placeholderTextColor="#6B7280"
                value={eventData.description}
                onChangeText={(text) =>
                  setEventData(prev => ({ ...prev, description: text }))
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Resim URL</Text>
              <TextInput
                style={styles.input}
                placeholder="Resim URL'si girin"
                placeholderTextColor="#6B7280"
                value={eventData.image_url}
                onChangeText={(text) =>
                  setEventData(prev => ({ ...prev, image_url: text }))
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tarih (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-12-31"
                placeholderTextColor="#6B7280"
                value={formatDateForInput(eventData.event_date)}
                onChangeText={handleDateChange}
              />
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onDismiss}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1C2620',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#29382f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#9eb7a8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#29382f',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#3a4a40',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#29382f',
    borderWidth: 1,
    borderColor: '#3a4a40',
  },
  cancelButtonText: {
    color: '#9eb7a8',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#38e07b',
  },
  saveButtonText: {
    color: '#111714',
    fontSize: 16,
    fontWeight: '700',
  },
});