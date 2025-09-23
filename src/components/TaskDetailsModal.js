import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { lightTheme, darkTheme } from "../utils/colors"
import { formatDate, formatDateTime } from "../utils/dateUtils"
import useTaskStore from "../store/useTaskStore"

const TaskDetailsModal = ({ visible, task, onClose }) => {
  const isDarkMode = useTaskStore((state) => state.isDarkMode)
  const theme = isDarkMode ? darkTheme : lightTheme

  if (!task) return null

  const styles = createStyles(theme)

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Detalhes da Tarefa</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <Text style={styles.fieldLabel}>Título</Text>
              <Text style={styles.fieldValue}>{task.title}</Text>

              {task.description && (
                <>
                  <Text style={styles.fieldLabel}>Descrição</Text>
                  <Text style={styles.fieldValue}>{task.description}</Text>
                </>
              )}

              <Text style={styles.fieldLabel}>Prazo</Text>
              <Text style={styles.fieldValue}>{formatDate(task.deadline)}</Text>

              {task.remindAt && (
                <>
                  <Text style={styles.fieldLabel}>Lembrete</Text>
                  <Text style={styles.fieldValue}>{formatDateTime(task.remindAt)}</Text>
                </>
              )}

              {task.image && (
                <>
                  <Text style={styles.fieldLabel}>Imagem</Text>
                  <Image source={{ uri: task.image }} style={styles.taskImage} />
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
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
      maxHeight: "80%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      gap: 16,
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
    },
    fieldValue: {
      fontSize: 16,
      color: theme.textSecondary,
      lineHeight: 22,
    },
    taskImage: {
      width: "100%",
      height: 200,
      borderRadius: 8,
      resizeMode: "cover",
    },
  })

export default TaskDetailsModal
