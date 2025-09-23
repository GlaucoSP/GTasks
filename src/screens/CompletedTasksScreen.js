"use client"

import React, { useState } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import useTaskStore from "../store/useTaskStore"
import { lightTheme, darkTheme } from "../utils/colors"
import { formatDate } from "../utils/dateUtils"
import ConfirmDialog from "../components/ConfirmDialog"

const CompletedTasksScreen = ({ navigation }) => {
  const {
    completedTasks,
    selectedTasks,
    isDarkMode,
    restoreTask,
    deleteCompletedTask,
    deleteAllCompletedTasks,
    setSelectedTasks,
    clearSelections,
    saveData,
  } = useTaskStore()

  const theme = isDarkMode ? darkTheme : lightTheme
  const [confirmDialog, setConfirmDialog] = useState({ visible: false })

  const selectionMode = selectedTasks.length > 0

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          {selectionMode ? (
            <>
              <TouchableOpacity style={styles.headerButton} onPress={handleRestoreSelected}>
                <Ionicons name="refresh" size={24} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={handleDeleteSelected}>
                <Ionicons name="trash" size={24} color={theme.error} />
              </TouchableOpacity>
            </>
          ) : completedTasks.length > 0 ? (
            <TouchableOpacity style={styles.headerButton} onPress={handleDeleteAll}>
              <Ionicons name="trash" size={24} color={theme.error} />
            </TouchableOpacity>
          ) : null}
        </View>
      ),
      headerLeft: () =>
        selectionMode ? (
          <TouchableOpacity style={styles.headerButton} onPress={clearSelections}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        ) : null,
    })
  }, [selectionMode, selectedTasks, completedTasks.length, theme])

  const handleTaskLongPress = (task) => {
    if (selectedTasks.includes(task.id)) {
      setSelectedTasks(selectedTasks.filter((id) => id !== task.id))
    } else {
      setSelectedTasks([...selectedTasks, task.id])
    }
  }

  const handleTaskPress = (task) => {
    if (selectionMode) {
      if (selectedTasks.includes(task.id)) {
        setSelectedTasks(selectedTasks.filter((id) => id !== task.id))
      } else {
        setSelectedTasks([...selectedTasks, task.id])
      }
    } else {
      setConfirmDialog({
        visible: true,
        title: "Restaurar Tarefa",
        message: `Deseja restaurar "${task.title}" para a lista "${task.originalListTitle}"?`,
        confirmText: "Restaurar",
        onConfirm: () => {
          restoreTask(task.id)
          saveData()
          setConfirmDialog({ visible: false })
        },
        onCancel: () => setConfirmDialog({ visible: false }),
      })
    }
  }

  const handleRestoreSelected = () => {
    setConfirmDialog({
      visible: true,
      title: "Restaurar Tarefas",
      message: `Deseja restaurar ${selectedTasks.length} tarefa(s) selecionada(s)?`,
      confirmText: "Restaurar",
      onConfirm: () => {
        selectedTasks.forEach((taskId) => restoreTask(taskId))
        clearSelections()
        saveData()
        setConfirmDialog({ visible: false })
      },
      onCancel: () => setConfirmDialog({ visible: false }),
    })
  }

  const handleDeleteSelected = () => {
    setConfirmDialog({
      visible: true,
      title: "Excluir Permanentemente",
      message: `Deseja excluir permanentemente ${selectedTasks.length} tarefa(s)?`,
      onConfirm: () => {
        selectedTasks.forEach((taskId) => deleteCompletedTask(taskId))
        clearSelections()
        saveData()
        setConfirmDialog({ visible: false })
      },
      onCancel: () => setConfirmDialog({ visible: false }),
    })
  }

  const handleDeleteAll = () => {
    setConfirmDialog({
      visible: true,
      title: "Excluir Todas",
      message: "Deseja excluir permanentemente todas as tarefas concluídas?",
      onConfirm: () => {
        deleteAllCompletedTasks()
        saveData()
        setConfirmDialog({ visible: false })
      },
      onCancel: () => setConfirmDialog({ visible: false }),
    })
  }

  const renderTask = ({ item: task }) => (
    <TouchableOpacity
      key={task.id}
      style={[
        styles.taskItem,
        {
          backgroundColor: selectedTasks.includes(task.id) ? theme.selection : theme.surface,
          borderColor: theme.border,
        },
      ]}
      onPress={() => handleTaskPress(task)}
      onLongPress={() => handleTaskLongPress(task)}
      delayLongPress={500}
    >
      {selectionMode && (
        <View style={[styles.checkbox, { borderColor: theme.border }]}>
          {selectedTasks.includes(task.id) && <Ionicons name="checkmark" size={16} color={theme.primary} />}
        </View>
      )}

      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, { color: theme.text }]}>{task.title}</Text>
        <Text style={[styles.taskInfo, { color: theme.textSecondary }]}>Lista: {task.originalListTitle}</Text>
        <Text style={[styles.taskInfo, { color: theme.textSecondary }]}>
          Concluída em: {formatDate(task.completedAt)}
        </Text>
        <Text style={[styles.taskInfo, { color: theme.textSecondary }]}>
          Prazo original: {formatDate(task.deadline)}
        </Text>
        {task.description && (
          <Text style={[styles.taskDescription, { color: theme.textSecondary }]} numberOfLines={2}>
            {task.description}
          </Text>
        )}
      </View>

      <View style={styles.taskActions}>
        <View style={[styles.daysCounter, { backgroundColor: theme.warning }]}>
          <Text style={styles.daysCounterText}>{task.daysUntilDeletion}d</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  const styles = createStyles(theme)

  return (
    <SafeAreaView style={styles.container}>
      {completedTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={80} color={theme.textSecondary} />
          <Text style={styles.emptyText}>Nenhuma tarefa concluída</Text>
          <Text style={styles.emptySubtext}>
            As tarefas concluídas aparecerão aqui e serão excluídas automaticamente após 5 dias
          </Text>
        </View>
      ) : (
        <FlatList
          data={completedTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
      />
    </SafeAreaView>
  )
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    headerActions: {
      flexDirection: "row",
      marginRight: 16,
    },
    headerButton: {
      marginLeft: 16,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 18,
      color: theme.textSecondary,
      textAlign: "center",
      marginTop: 20,
      marginBottom: 12,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    listContent: {
      padding: 16,
    },
    taskItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 1,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    taskContent: {
      flex: 1,
    },
    taskTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    taskInfo: {
      fontSize: 12,
      marginBottom: 2,
    },
    taskDescription: {
      fontSize: 12,
      fontStyle: "italic",
      marginTop: 4,
    },
    taskActions: {
      alignItems: "center",
    },
    daysCounter: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    daysCounterText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "bold",
    },
  })

export default CompletedTasksScreen
