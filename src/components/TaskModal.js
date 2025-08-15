import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  StyleSheet,
  ScrollView,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { lightTheme, darkTheme } from '../utils/colors';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import useTaskStore from '../store/useTaskStore';

const TaskModal = ({ visible, task, lists, onClose, onSave }) => {
  const isDarkMode = useTaskStore(state => state.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [title, setTitle] = useState('');
  const [selectedList, setSelectedList] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  const [description, setDescription] = useState('');
  const [remindAt, setRemindAt] = useState(null);
  const [image, setImage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setSelectedList(task.listId || lists[0]?.id || '');
      setDeadline(new Date(task.deadline));
      setDescription(task.description || '');
      setRemindAt(task.remindAt ? new Date(task.remindAt) : null);
      setImage(task.image || null);
    } else {
      setTitle('');
      setSelectedList(lists[0]?.id || '');
      setDeadline(new Date());
      setDescription('');
      setRemindAt(null);
      setImage(null);
    }
  }, [task, lists, visible]);

  const handleSave = () => {
    if (!title.trim()) return;

    const taskData = {
      id: task?.id || Date.now().toString(),
      title: title.trim(),
      listId: selectedList,
      deadline: deadline.toISOString(),
      description: description.trim(),
      remindAt: remindAt?.toISOString() || null,
      image,
      completed: task?.completed || false,
      createdAt: task?.createdAt || new Date().toISOString()
    };

    onSave(taskData);
    onClose();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>
              {task ? 'Editar Tarefa' : 'Nova Tarefa'}
            </Text>

            <Text style={styles.fieldLabel}>Título *</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o título da tarefa"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.fieldLabel}>Lista *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.listSelector}>
                {lists.map(list => (
                  <TouchableOpacity
                    key={list.id}
                    style={[
                      styles.listOption,
                      { backgroundColor: selectedList === list.id ? theme.primary : theme.surface }
                    ]}
                    onPress={() => setSelectedList(list.id)}
                  >
                    <Text style={[
                      styles.listOptionText,
                      { color: selectedList === list.id ? '#FFFFFF' : theme.text }
                    ]}>
                      {list.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>Prazo *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {formatDate(deadline)}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrição da tarefa (opcional)"
              placeholderTextColor={theme.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.fieldLabel}>Lembrete personalizado</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowReminderPicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {remindAt ? formatDateTime(remindAt) : 'Definir lembrete (opcional)'}
              </Text>
              <Ionicons name="notifications-outline" size={20} color={theme.primary} />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Imagem</Text>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color={theme.textSecondary} />
                  <Text style={styles.imagePlaceholderText}>Selecionar imagem</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={deadline}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDeadline(selectedDate);
            }
          }}
        />
      )}

      {showReminderPicker && (
        <DateTimePicker
          value={remindAt || new Date()}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowReminderPicker(false);
            if (selectedDate) {
              setRemindAt(selectedDate);
            }
          }}
        />
      )}
    </Modal>
  );
};

const createStyles = (theme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: theme.background,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: theme.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.surface,
    color: theme.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  listSelector: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  listOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  listOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: theme.surface,
  },
  dateButtonText: {
    fontSize: 16,
    color: theme.text,
  },
  imageButton: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: theme.surface,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  imagePlaceholder: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: theme.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.surface,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: theme.primary,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TaskModal;