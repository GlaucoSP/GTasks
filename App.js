// App.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet, Alert, Image, Platform } from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const App = () => {
  const [lists, setLists] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    list: 'Padrão',
    deadline: new Date(),
    description: '',
    remindAt: null,
    image: null,
  });
  const [creatingTask, setCreatingTask] = useState(true);
  const [listModalVisible, setListModalVisible] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [expandedLists, setExpandedLists] = useState({});
  const [showAddOptions, setShowAddOptions] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedLists = await AsyncStorage.getItem('lists');
    if (savedLists) {
      setLists(JSON.parse(savedLists));
    } else {
      const defaultList = [{ title: 'Padrão', color: '#000', bgColor: '#eee', tasks: [] }];
      setLists(defaultList);
      await AsyncStorage.setItem('lists', JSON.stringify(defaultList));
    }
  };

  const saveData = async (updatedLists) => {
    setLists(updatedLists);
    await AsyncStorage.setItem('lists', JSON.stringify(updatedLists));
  };

  const handleAddTask = () => {
    if (!newTask.title || !newTask.list || !newTask.deadline) {
      Alert.alert('Preencha os campos obrigatórios');
      return;
    }
    const updatedLists = lists.map(list => {
      if (list.title === newTask.list) {
        return {
          ...list,
          tasks: [...list.tasks, { ...newTask, id: Date.now(), completed: false }]
        };
      }
      return list;
    });
    saveData(updatedLists);
    setNewTask({ title: '', list: 'Padrão', deadline: new Date(), description: '', remindAt: null, image: null });
    setModalVisible(false);
  };

  const handleAddList = () => {
    if (!newListTitle) {
      Alert.alert('Dê um nome à lista');
      return;
    }
    const newList = { title: newListTitle, color: '#000', bgColor: '#eee', tasks: [] };
    const updatedLists = [...lists, newList];
    saveData(updatedLists);
    setNewListTitle('');
    setListModalVisible(false);
  };

  const toggleComplete = (listTitle, taskId) => {
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
    saveData(updatedLists);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled) {
      setNewTask({ ...newTask, image: result.assets[0].uri });
    }
  };

  const renderTask = (task, listTitle) => (
    <TouchableOpacity
      style={styles.taskItem}
      onPress={() => {
        Alert.alert(
          task.title,
          `${task.description || ''}`,
          task.image
            ? [
                {
                  text: 'Ver imagem',
                  onPress: () => {
                    Alert.alert(task.title, '', [{ text: 'Fechar' }], {
                      cancelable: true,
                    });
                  },
                },
                { text: 'OK' },
              ]
            : [{ text: 'OK' }]
        );
      }}>
      <TouchableOpacity onPress={() => toggleComplete(listTitle, task.id)}>
        <View style={styles.checkbox}>{task.completed && <Text>✓</Text>}</View>
      </TouchableOpacity>
      <Text style={[styles.taskText, task.completed && { textDecorationLine: 'line-through' }]}>{task.title}</Text>
      {task.image && <Image source={{ uri: task.image }} style={styles.taskImage} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {lists.length === 0 || lists.every(l => l.tasks.length === 0) ? (
        <Text style={styles.emptyText}>Adicione sua primeira tarefa</Text>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={item => item.title}
          renderItem={({ item }) => (
            <View>
              <TouchableOpacity
                style={[styles.listHeader, { backgroundColor: item.bgColor }]}
                onPress={() => setExpandedLists(prev => ({ ...prev, [item.title]: !prev[item.title] }))}>
                <Text style={{ color: item.color, fontWeight: 'bold' }}>{item.title}</Text>
              </TouchableOpacity>
              {expandedLists[item.title] !== false && item.tasks.map(task => renderTask(task, item.title))}
            </View>
          )}
        />
      )}
      {showAddOptions && (
        <View style={styles.addOptionsContainer}>
          <TouchableOpacity onPress={() => setListModalVisible(true)} style={styles.addOption}>
            <MaterialIcons name="list" size={24} color="black" />
            <Text>Lista</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setCreatingTask(true); setModalVisible(true); }} style={styles.addOption}>
            <AntDesign name="plus" size={24} color="black" />
            <Text>Tarefa</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddOptions(prev => !prev)}>
        <AntDesign name="pluscircle" size={50} color="blue" />
      </TouchableOpacity>

      {/* Modal de tarefa */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Tarefa</Text>
            <TextInput placeholder="Título" value={newTask.title} onChangeText={text => setNewTask({ ...newTask, title: text })} style={styles.input} />
            <TextInput placeholder="Descrição (opcional)" value={newTask.description} onChangeText={text => setNewTask({ ...newTask, description: text })} style={styles.input} />
            <Text style={{ marginTop: 10 }}>Lista:</Text>
            <FlatList
              horizontal
              data={lists}
              keyExtractor={(item) => item.title}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setNewTask({ ...newTask, list: item.title })}
                  style={{
                    padding: 8,
                    margin: 5,
                    backgroundColor: newTask.list === item.title ? '#add8e6' : '#eee',
                    borderRadius: 5,
                  }}>
                  <Text>{item.title}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={pickImage}><Text>Escolher imagem (opcional)</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleAddTask}><Text style={styles.saveButton}>Salvar</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.cancelButton}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de lista */}
      <Modal visible={listModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Lista</Text>
            <TextInput placeholder="Título da lista" value={newListTitle} onChangeText={setNewListTitle} style={styles.input} />
            <TouchableOpacity onPress={handleAddList}><Text style={styles.saveButton}>Salvar</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setListModalVisible(false)}><Text style={styles.cancelButton}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  emptyText: { textAlign: 'center', marginTop: 100, fontSize: 18 },
  addButton: { position: 'absolute', bottom: 30, right: 30 },
  addOptionsContainer: { position: 'absolute', bottom: 100, right: 30, backgroundColor: '#fff', padding: 10, borderRadius: 8, elevation: 5 },
  addOption: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  listHeader: { padding: 10, marginVertical: 5, borderRadius: 8 },
  taskItem: { flexDirection: 'row', alignItems: 'center', marginLeft: 20, paddingVertical: 5 },
  taskText: { fontSize: 16, marginLeft: 10, flex: 1 },
  taskImage: { width: 40, height: 40, borderRadius: 5, marginLeft: 10 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderRadius: 3, justifyContent: 'center', alignItems: 'center' },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { margin: 20, padding: 20, backgroundColor: '#fff', borderRadius: 10 },
  modalTitle: { fontSize: 20, marginBottom: 10, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginVertical: 5, borderRadius: 5 },
  saveButton: { marginTop: 10, color: 'blue', fontWeight: 'bold' },
  cancelButton: { marginTop: 10, color: 'red' },
});

export default App;
