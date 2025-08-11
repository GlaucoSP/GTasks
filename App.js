import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  StyleSheet, 
  Alert, 
  Image, 
  Platform,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';

// Configuração das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const App = () => {
  const [lists, setLists] = useState([]);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [listModalVisible, setListModalVisible] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    list: 'Padrão',
    deadline: new Date(),
    description: '',
    remindAt: null,
    image: null,
  });
  const [newList, setNewList] = useState({
    title: '',
    color: '#000000',
    bgColor: '#f0f0f0'
  });
  const [expandedLists, setExpandedLists] = useState({ 'Padrão': true });
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [taskDetailModal, setTaskDetailModal] = useState({ visible: false, task: null });

  useEffect(() => {
    loadData();
    requestNotificationPermissions();
  }, []);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Para receber notificações de tarefas, permita as notificações nas configurações.');
    }
  };

  const loadData = async () => {
    try {
      const savedLists = await AsyncStorage.getItem('taskLists');
      if (savedLists) {
        const parsedLists = JSON.parse(savedLists);
        setLists(parsedLists);
        // Definir expansão padrão
        const defaultExpanded = {};
        parsedLists.forEach((list, index) => {
          defaultExpanded[list.title] = index === 0;
        });
        setExpandedLists(defaultExpanded);
      } else {
        const defaultList = [{
          title: 'Padrão',
          color: '#000000',
          bgColor: '#f0f0f0',
          tasks: []
        }];
        setLists(defaultList);
        await AsyncStorage.setItem('taskLists', JSON.stringify(defaultList));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const saveData = async (updatedLists) => {
    try {
      setLists(updatedLists);
      await AsyncStorage.setItem('taskLists', JSON.stringify(updatedLists));
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  };

  const scheduleNotification = async (task) => {
    try {
      // Notificação para o prazo
      const deadlineDate = new Date(task.deadline);
      if (deadlineDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Prazo da tarefa!',
            body: `A tarefa "${task.title}" vence hoje!`,
            data: { taskId: task.id },
          },
          trigger: deadlineDate,
        });
      }

      // Notificação personalizada se definida
      if (task.remindAt) {
        const reminderDate = new Date(task.remindAt);
        if (reminderDate > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Lembrete de tarefa',
              body: `Lembrete: ${task.title}`,
              data: { taskId: task.id },
            },
            trigger: reminderDate,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Erro', 'O título da tarefa é obrigatório');
      return;
    }

    const task = {
      ...newTask,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    const updatedLists = lists.map(list => {
      if (list.title === newTask.list) {
        return {
          ...list,
          tasks: [...list.tasks, task]
        };
      }
      return list;
    });

    await saveData(updatedLists);
    await scheduleNotification(task);

    setNewTask({
      title: '',
      list: lists[0]?.title || 'Padrão',
      deadline: new Date(),
      description: '',
      remindAt: null,
      image: null,
    });
    setTaskModalVisible(false);
  };

  const handleAddList = async () => {
    if (!newList.title.trim()) {
      Alert.alert('Erro', 'O título da lista é obrigatório');
      return;
    }

    const listToAdd = {
      ...newList,
      tasks: []
    };

    const updatedLists = [...lists, listToAdd];
    await saveData(updatedLists);

    setNewList({
      title: '',
      color: '#000000',
      bgColor: '#f0f0f0'
    });
    setListModalVisible(false);
  };

  const toggleTaskComplete = async (listTitle, taskId) => {
    const updatedLists = lists.map(list => {
      if (list.title === listTitle) {
        return {
          ...list,
          tasks: list.tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
        };
      }
      return list;
    });
    await saveData(updatedLists);
  };

  const toggleListExpansion = (listTitle) => {
    setExpandedLists(prev => ({
      ...prev,
      [listTitle]: !prev[listTitle]
    }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewTask({ ...newTask, image: result.assets[0].uri });
    }
  };

  const showTaskDetails = (task) => {
    setTaskDetailModal({ visible: true, task });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const getTotalTasks = () => {
    return lists.reduce((total, list) => total + list.tasks.length, 0);
  };

  const renderTask = (task, listTitle) => (
    <TouchableOpacity
      key={task.id}
      style={styles.taskItem}
      onPress={() => showTaskDetails(task)}
    >
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => toggleTaskComplete(listTitle, task.id)}
      >
        {task.completed && <Ionicons name="checkmark" size={16} color="#4CAF50" />}
      </TouchableOpacity>
      
      <View style={styles.taskContent}>
        <Text style={[
          styles.taskTitle,
          task.completed && styles.taskCompleted
        ]}>
          {task.title}
        </Text>
        <Text style={styles.taskDeadline}>
          Prazo: {formatDate(task.deadline)}
        </Text>
      </View>

      {task.image && (
        <Image source={{ uri: task.image }} style={styles.taskThumbnail} />
      )}
    </TouchableOpacity>
  );

  const renderList = ({ item: list }) => (
    <View style={[styles.listContainer, { backgroundColor: list.bgColor }]}>
      <TouchableOpacity
        style={styles.listHeader}
        onPress={() => toggleListExpansion(list.title)}
      >
        <Text style={[styles.listTitle, { color: list.color }]}>
          {list.title} ({list.tasks.length})
        </Text>
        <Ionicons
          name={expandedLists[list.title] ? "chevron-up" : "chevron-down"}
          size={20}
          color={list.color}
        />
      </TouchableOpacity>

      {expandedLists[list.title] && (
        <View style={styles.tasksContainer}>
          {list.tasks.length === 0 ? (
            <Text style={styles.emptyListText}>Nenhuma tarefa nesta lista</Text>
          ) : (
            list.tasks.map(task => renderTask(task, list.title))
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {getTotalTasks() === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Adicione sua primeira tarefa</Text>
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={item => item.title}
          renderItem={renderList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Botão flutuante */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddOptions(!showAddOptions)}
      >
        <AntDesign 
          name={showAddOptions ? "close" : "plus"} 
          size={24} 
          color="white" 
        />
      </TouchableOpacity>

      {/* Opções do botão flutuante */}
      {showAddOptions && (
        <View style={styles.fabOptions}>
          <TouchableOpacity
            style={styles.fabOption}
            onPress={() => {
              setTaskModalVisible(true);
              setShowAddOptions(false);
            }}
          >
            <MaterialIcons name="add-task" size={20} color="#333" />
            <Text style={styles.fabOptionText}>Criar tarefa</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.fabOption}
            onPress={() => {
              setListModalVisible(true);
              setShowAddOptions(false);
            }}
          >
            <MaterialIcons name="playlist-add" size={20} color="#333" />
            <Text style={styles.fabOptionText}>Criar lista</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de criar tarefa */}
      <Modal
        visible={taskModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTaskModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Nova Tarefa</Text>

              <Text style={styles.fieldLabel}>Título *</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o título da tarefa"
                value={newTask.title}
                onChangeText={text => setNewTask({ ...newTask, title: text })}
              />

              <Text style={styles.fieldLabel}>Lista *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.listSelector}>
                  {lists.map(list => (
                    <TouchableOpacity
                      key={list.title}
                      style={[
                        styles.listOption,
                        { backgroundColor: newTask.list === list.title ? '#007AFF' : '#f0f0f0' }
                      ]}
                      onPress={() => setNewTask({ ...newTask, list: list.title })}
                    >
                      <Text style={[
                        styles.listOptionText,
                        { color: newTask.list === list.title ? 'white' : '#333' }
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
                  {formatDate(newTask.deadline)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descrição da tarefa (opcional)"
                value={newTask.description}
                onChangeText={text => setNewTask({ ...newTask, description: text })}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.fieldLabel}>Lembrete personalizado</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowReminderPicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {newTask.remindAt ? formatDateTime(newTask.remindAt) : 'Definir lembrete (opcional)'}
                </Text>
                <Ionicons name="notifications-outline" size={20} color="#007AFF" />
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Imagem</Text>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                {newTask.image ? (
                  <Image source={{ uri: newTask.image }} style={styles.selectedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={40} color="#ccc" />
                    <Text style={styles.imagePlaceholderText}>Selecionar imagem</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setTaskModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleAddTask}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de criar lista */}
      <Modal
        visible={listModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setListModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Lista</Text>

            <Text style={styles.fieldLabel}>Título *</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o título da lista"
              value={newList.title}
              onChangeText={text => setNewList({ ...newList, title: text })}
            />

            <Text style={styles.fieldLabel}>Cor do texto</Text>
            <View style={styles.colorPicker}>
              {['#000000', '#FF5722', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0'].map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    newList.color === color && styles.selectedColor
                  ]}
                  onPress={() => setNewList({ ...newList, color })}
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Cor de fundo</Text>
            <View style={styles.colorPicker}>
              {['#f0f0f0', '#ffebee', '#e3f2fd', '#e8f5e8', '#fff3e0', '#f3e5f5'].map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    newList.bgColor === color && styles.selectedColor
                  ]}
                  onPress={() => setNewList({ ...newList, bgColor: color })}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setListModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddList}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de detalhes da tarefa */}
      <Modal
        visible={taskDetailModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setTaskDetailModal({ visible: false, task: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {taskDetailModal.task && (
              <>
                <Text style={styles.modalTitle}>{taskDetailModal.task.title}</Text>
                
                <Text style={styles.taskDetailLabel}>Prazo:</Text>
                <Text style={styles.taskDetailText}>
                  {formatDate(taskDetailModal.task.deadline)}
                </Text>

                {taskDetailModal.task.description && (
                  <>
                    <Text style={styles.taskDetailLabel}>Descrição:</Text>
                    <Text style={styles.taskDetailText}>
                      {taskDetailModal.task.description}
                    </Text>
                  </>
                )}

                {taskDetailModal.task.remindAt && (
                  <>
                    <Text style={styles.taskDetailLabel}>Lembrete:</Text>
                    <Text style={styles.taskDetailText}>
                      {formatDateTime(taskDetailModal.task.remindAt)}
                    </Text>
                  </>
                )}

                {taskDetailModal.task.image && (
                  <>
                    <Text style={styles.taskDetailLabel}>Imagem:</Text>
                    <Image 
                      source={{ uri: taskDetailModal.task.image }} 
                      style={styles.taskDetailImage} 
                    />
                  </>
                )}

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={() => setTaskDetailModal({ visible: false, task: null })}
                >
                  <Text style={styles.saveButtonText}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Date Picker para prazo */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(newTask.deadline)}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setNewTask({ ...newTask, deadline: selectedDate });
            }
          }}
        />
      )}

      {/* Date Time Picker para lembrete */}
      {showReminderPicker && (
        <DateTimePicker
          value={newTask.remindAt || new Date()}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowReminderPicker(false);
            if (selectedDate) {
              setNewTask({ ...newTask, remindAt: selectedDate });
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tasksContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyListText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskDeadline: {
    fontSize: 12,
    color: '#666',
  },
  taskThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginLeft: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabOptions: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 140,
  },
  fabOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
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
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  imageButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
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
    color: '#666',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#007AFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  taskDetailLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  taskDetailText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  taskDetailImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
});

export default App;