import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  StyleSheet,
  ScrollView 
} from 'react-native';
import { lightTheme, darkTheme, listColors } from '../utils/colors';
import useTaskStore from '../store/useTaskStore';

const ListModal = ({ visible, list, onClose, onSave }) => {
  const isDarkMode = useTaskStore(state => state.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [title, setTitle] = useState('');
  const [selectedTextColor, setSelectedTextColor] = useState(listColors.text[0]);
  const [selectedBgColor, setSelectedBgColor] = useState(listColors.background[0]);

  useEffect(() => {
    if (list) {
      setTitle(list.title);
      setSelectedTextColor(list.color);
      setSelectedBgColor(list.bgColor);
    } else {
      setTitle('');
      setSelectedTextColor(listColors.text[0]);
      setSelectedBgColor(listColors.background[0]);
    }
  }, [list, visible]);

  const handleSave = () => {
    if (!title.trim()) return;

    const listData = {
      id: list?.id || Date.now().toString(),
      title: title.trim(),
      color: selectedTextColor,
      bgColor: selectedBgColor,
      tasks: list?.tasks || []
    };

    onSave(listData);
    onClose();
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
              {list ? 'Editar Lista' : 'Nova Lista'}
            </Text>

            <Text style={styles.fieldLabel}>Título *</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o título da lista"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.fieldLabel}>Cor do texto</Text>
            <View style={styles.colorPicker}>
              {listColors.text.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedTextColor === color && styles.selectedColor
                  ]}
                  onPress={() => setSelectedTextColor(color)}
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Cor de fundo</Text>
            <View style={styles.colorPicker}>
              {listColors.background.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedBgColor === color && styles.selectedColor
                  ]}
                  onPress={() => setSelectedBgColor(color)}
                />
              ))}
            </View>

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
    borderColor: theme.primary,
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

export default ListModal;