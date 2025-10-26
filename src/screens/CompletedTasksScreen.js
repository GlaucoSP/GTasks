"use client"

import React, { useState } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import useTaskStore from "../store/useTaskStore"
import { lightTheme, darkTheme } from "../utils/colors"
import { formatDate } from "../utils/dateUtils"
import ConfirmDialog from "../components/ConfirmDialog"
import Toast from "../components/Toast"

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
    toast,
    showToast,
    hideToast,
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
        onConfirm: async () => {
          const result = await restoreTask(task.id)
          if (result.success) {
            await saveData()
            showToast('Tarefa restaurada com sucesso! 🔄', 'success')
          }
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
      onConfirm: async () => {
        let successCount = 0
        let errorCount = 0

        for (const taskId of selectedTasks) {
          const result = await restoreTask(taskId)
          if (result.success) {
            successCount++
          } else {
            errorCount++
          }
        }

        clearSelections()
        await saveData()

        if (errorCount === 0) {
          showToast(`${successCount} tarefa(s) restaurada(s)! 🔄`, 'success')
        } else {
          showToast(`${successCount} restauradas, ${errorCount} com erro`, 'warning')
        }

        setConfirmDialog({ visible: false })
      },
      onCancel: () => setConfirmDialog({ visible: false }),
    })
  }

  const handleDeleteSelected = () => {
    setConfirmDialog({
      visible: true,
      title: "Excluir Permanentemente",
      message: `Deseja excluir permanentemente ${selectedTasks.length} tarefa(s)? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        let successCount = 0
        let errorCount = 0

        for (const taskId of selectedTasks) {
          const result = await deleteCompletedTask(taskId)
          if (result.success) {
            successCount++
          } else {
            errorCount++
          }
        }

        clearSelections()
        await saveData()

        if (errorCount === 0) {
          showToast(`${successCount} tarefa(s) excluída(s) permanentemente`, 'success')
        } else {
          showToast(`${successCount} excluídas, ${errorCount} com erro`, 'warning')
        }

        setConfirmDialog({ visible: false })
      },
      onCancel: () => setConfirmDialog({ visible: false }),
    })
  }

  const handleDeleteAll = () => {
    setConfirmDialog({
      visible: true,
      title: "Excluir Todas",
      message: `Deseja excluir permanentemente todas as ${completedTasks.length} tarefas concluídas? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        const result = await deleteAllCompletedTasks()
        
        if (result.success) {
          await saveData()
          showToast('Todas as tarefas foram excluídas', 'success')
        }

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
        <View style={[
          styles.checkbox, 
          { 
            borderColor: theme.border,
            backgroundColor: selectedTasks.includes(task.id) ? theme.primary : 'transparent'
          }
        ]}>
          {selectedTasks.includes(task.id) && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      )}

      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, { color: theme.text }]}>{task.title}</Text>
        <Text style={[styles.taskInfo, { color: theme.textSecondary }]}>
          Lista: {task.originalListTitle}
        </Text>
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
        <View style={[
          styles.daysCounter, 
          { 
            backgroundColor: task.daysUntilDeletion <= 1 ? theme.error : theme.warning 
          }
        ]}>
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
        <>
          <View style={styles.infoBar}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-done" size={20} color={theme.primary} />
              <Text style={styles.infoText}>
                {completedTasks.length} tarefa{completedTasks.length !== 1 ? 's' : ''} concluída{completedTasks.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
              <Text style={styles.infoText}>
                Auto-exclusão em 5 dias
              </Text>
            </View>
          </View>

          <FlatList
            data={completedTasks}
            keyExtractor={(item) => item.id}
            renderItem={renderTask}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </>
      )}

      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
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
    infoBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    infoText: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: '500',
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
      fontWeight: '600',
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
      borderRadius: 12,
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
      marginBottom: 6,
    },
    taskInfo: {
      fontSize: 12,
      marginBottom: 3,
    },
    taskDescription: {
      fontSize: 12,
      fontStyle: "italic",
      marginTop: 6,
      lineHeight: 16,
    },
    taskActions: {
      alignItems: "center",
      marginLeft: 8,
    },
    daysCounter: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      minWidth: 36,
      alignItems: 'center',
    },
    daysCounterText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "bold",
    },
  })

export default CompletedTasksScreen