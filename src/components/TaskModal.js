"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ScrollView, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import { lightTheme, darkTheme } from "../utils/colors"
import { formatDate, formatDateTime } from "../utils/dateUtils"
import useTaskStore from "../store/useTaskStore"

const TaskModal = ({ visible, task, lists, onClose, onSave }) => {
  const isDarkMode = useTaskStore((state) => state.isDarkMode)
  const theme = isDarkMode ? darkTheme : lightTheme

  const [title, setTitle] = useState("")
  const [selectedList, setSelectedList] = useState("")
  const [deadline, setDeadline] = useState(new Date())
  const [description, setDescription] = useState("")
  const [remindAt, setRemindAt] = useState(null)
  const [image, setImage] = useState(null)
  
  // Estados para os pickers
  const [isDeadlinePickerVisible, setDeadlinePickerVisible] = useState(false)
  const [isReminderPickerVisible, setReminderPickerVisible] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setSelectedList(task.listId || lists[0]?.id || "")
      setDeadline(new Date(task.deadline))
      setDescription(task.description || "")
      setRemindAt(task.remindAt ? new Date(task.remindAt) : null)
      setImage(task.image || null)
    } else {
      setTitle("")
      setSelectedList(lists[0]?.id || "")
      setDeadline(new Date())
      setDescription("")
      setRemindAt(null)
      setImage(null)
    }
  }, [task, lists, visible])

  const handleSave = () => {
    if (!title.trim()) return

    const taskData = {
      id: task?.id || Date.now().toString(),
      title: title.trim(),
      listId: selectedList,
      deadline: deadline.toISOString(),
      description: description.trim(),
      remindAt: remindAt?.toISOString() || null,
      image,
      completed: task?.completed || false,
      createdAt: task?.createdAt || new Date().toISOString(),
    }

    onSave(taskData)
    if (onClose) {
      onClose()
    }
  }

  const handleDeadlineConfirm = (date) => {
    setDeadline(date)
    setDeadlinePickerVisible(false)
  }

  const handleReminderConfirm = (date) => {
    setRemindAt(date)
    setReminderPickerVisible(false)
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
    }
  }

  const removeReminder = () => {
    setRemindAt(null)
  }

  const removeImage = () => {
    setImage(null)
  }

  const styles = createStyles(theme)

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{task ? "Editar Tarefa" : "Nova Tarefa"}</Text>

            {/* Título */}
            <Text style={styles.fieldLabel}>Título *</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o título da tarefa"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
              autoFocus={!task}
            />

            {/* Lista */}
            <Text style={styles.fieldLabel}>Lista *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.listSelector}>
                {lists.map((list) => (
                  <TouchableOpacity
                    key={list.id}
                    style={[
                      styles.listOption,
                      { 
                        backgroundColor: selectedList === list.id ? theme.primary : theme.surface,
                        borderWidth: 1,
                        borderColor: selectedList === list.id ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setSelectedList(list.id)}
                  >
                    <Text 
                      style={[
                        styles.listOptionText, 
                        { color: selectedList === list.id ? "#FFFFFF" : theme.text }
                      ]}
                    >
                      {list.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Prazo */}
            <Text style={styles.fieldLabel}>Prazo *</Text>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setDeadlinePickerVisible(true)}
            >
              <View style={styles.dateButtonContent}>
                <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                <Text style={styles.dateButtonText}>{formatDate(deadline)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            {/* Descrição */}
            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrição da tarefa (opcional)"
              placeholderTextColor={theme.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Lembrete */}
            <Text style={styles.fieldLabel}>Lembrete personalizado</Text>
            {remindAt ? (
              <View style={styles.reminderContainer}>
                <View style={styles.reminderInfo}>
                  <Ionicons name="notifications" size={20} color={theme.primary} />
                  <Text style={styles.reminderText}>{formatDateTime(remindAt)}</Text>
                </View>
                <TouchableOpacity onPress={removeReminder} style={styles.removeButton}>
                  <Ionicons name="close-circle" size={24} color={theme.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setReminderPickerVisible(true)}
              >
                <View style={styles.dateButtonContent}>
                  <Ionicons name="notifications-outline" size={20} color={theme.textSecondary} />
                  <Text style={[styles.dateButtonText, { color: theme.textSecondary }]}>
                    Definir lembrete (opcional)
                  </Text>
                </View>
                <Ionicons name="add" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}

            {/* Imagem */}
            <Text style={styles.fieldLabel}>Imagem</Text>
            {image ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={removeImage}
                >
                  <Ionicons name="close-circle" size={28} color={theme.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color={theme.textSecondary} />
                  <Text style={styles.imagePlaceholderText}>Adicionar imagem (opcional)</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Botões */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.saveButton,
                  !title.trim() && styles.disabledButton
                ]} 
                onPress={handleSave}
                disabled={!title.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {task ? "Atualizar" : "Criar"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Date Picker para Prazo */}
      <DateTimePickerModal
        isVisible={isDeadlinePickerVisible}
        mode="date"
        onConfirm={handleDeadlineConfirm}
        onCancel={() => setDeadlinePickerVisible(false)}
        date={deadline}
        minimumDate={new Date()}
        isDarkModeEnabled={isDarkMode}
        locale="pt_BR"
        confirmTextIOS="Confirmar"
        cancelTextIOS="Cancelar"
      />

      {/* DateTime Picker para Lembrete */}
      <DateTimePickerModal
        isVisible={isReminderPickerVisible}
        mode="datetime"
        onConfirm={handleReminderConfirm}
        onCancel={() => setReminderPickerVisible(false)}
        date={remindAt || new Date()}
        minimumDate={new Date()}
        isDarkModeEnabled={isDarkMode}
        locale="pt_BR"
        confirmTextIOS="Confirmar"
        cancelTextIOS="Cancelar"
      />
    </Modal>
  )
}

const createStyles = (theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "center",
      alignItems: "center",
    },
    modal: {
      backgroundColor: theme.background,
      borderRadius: 16,
      padding: 24,
      width: "90%",
      maxHeight: "85%",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 24,
      textAlign: "center",
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: "600",
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
      paddingTop: 12,
    },
    listSelector: {
      flexDirection: "row",
      marginVertical: 8,
    },
    listOption: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      marginRight: 8,
    },
    listOptionText: {
      fontSize: 14,
      fontWeight: "600",
    },
    dateButton: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: theme.surface,
    },
    dateButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    dateButtonText: {
      fontSize: 16,
      color: theme.text,
    },
    reminderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 8,
      padding: 12,
      backgroundColor: theme.primary + '10',
    },
    reminderInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 8,
    },
    reminderText: {
      fontSize: 16,
      color: theme.text,
      fontWeight: '500',
    },
    removeButton: {
      padding: 4,
    },
    imageButton: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: theme.surface,
      borderStyle: 'dashed',
    },
    imageContainer: {
      position: 'relative',
      alignItems: 'center',
    },
    selectedImage: {
      width: '100%',
      height: 200,
      borderRadius: 8,
      resizeMode: 'cover',
    },
    removeImageButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: theme.background,
      borderRadius: 14,
    },
    imagePlaceholder: {
      alignItems: "center",
      paddingVertical: 20,
    },
    imagePlaceholderText: {
      marginTop: 8,
      color: theme.textSecondary,
      fontSize: 14,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 24,
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: "center",
    },
    cancelButton: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    saveButton: {
      backgroundColor: theme.primary,
    },
    disabledButton: {
      backgroundColor: theme.border,
      opacity: 0.5,
    },
    cancelButtonText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
    },
    saveButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
  })

export default TaskModal