"use client"

import { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native"
import { AntDesign, MaterialIcons, Ionicons } from "@expo/vector-icons"
import useTaskStore from "../store/useTaskStore"
import { lightTheme, darkTheme } from "../utils/colors"
import { scheduleTaskNotification } from "../utils/notifications"
import ListItem from "../components/ListItem"
import TaskItem from "../components/TaskItem"
import ListModal from "../components/ListModal"
import TaskModal from "../components/TaskModal"
import TaskDetailsModal from "../components/TaskDetailsModal"
import ConfirmDialog from "../components/ConfirmDialog"

const HomeScreen = ({ navigation }) => {
  const {
    lists,
    selectedLists,
    selectedTasks,
    isDarkMode,
    addList,
    updateList,
    deleteList,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    setSelectedLists,
    setSelectedTasks,
    clearSelections,
    saveData,
  } = useTaskStore()

  const theme = isDarkMode ? darkTheme : lightTheme

  const [expandedLists, setExpandedLists] = useState({ default: true })
  const [showAddOptions, setShowAddOptions] = useState(false)
  const [listModalVisible, setListModalVisible] = useState(false)
  const [taskModalVisible, setTaskModalVisible] = useState(false)
  const [taskDetailsVisible, setTaskDetailsVisible] = useState(false)
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState(null)
  const [editingList, setEditingList] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ visible: false })

  const selectionMode = selectedLists.length > 0 || selectedTasks.length > 0

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        selectionMode ? (
          <View style={styles.headerActions}>
            {selectedLists.length === 1 && selectedTasks.length === 0 && (
              <TouchableOpacity style={styles.headerButton} onPress={handleEditSelected}>
                <Ionicons name="pencil" size={24} color={theme.text} />
              </TouchableOpacity>
            )}
            {selectedTasks.length === 1 && selectedLists.length === 0 && (
              <TouchableOpacity style={styles.headerButton} onPress={handleEditSelected}>
                <Ionicons name="pencil" size={24} color={theme.text} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerButton} onPress={handleDeleteSelected}>
              <Ionicons name="trash" size={24} color={theme.error} />
            </TouchableOpacity>
          </View>
        ) : null,
      headerLeft: () =>
        selectionMode ? (
          <TouchableOpacity style={styles.headerButton} onPress={clearSelections}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        ) : null,
    })
  }, [selectionMode, selectedLists, selectedTasks, theme])

  const toggleListExpansion = (listId) => {
    setExpandedLists((prev) => ({
      ...prev,
      [listId]: !prev[listId],
    }))
  }

  const handleListLongPress = (list) => {
    if (selectedLists.includes(list.id)) {
      setSelectedLists(selectedLists.filter((id) => id !== list.id))
    } else {
      setSelectedLists([...selectedLists, list.id])
    }
  }

  const handleListPress = (list) => {
    if (selectionMode) {
      if (selectedLists.includes(list.id)) {
        setSelectedLists(selectedLists.filter((id) => id !== list.id))
      } else {
        setSelectedLists([...selectedLists, list.id])
      }
    }
  }

  const handleTaskLongPress = (task, listId) => {
    const taskKey = `${listId}_${task.id}`
    if (selectedTasks.includes(taskKey)) {
      setSelectedTasks(selectedTasks.filter((key) => key !== taskKey))
    } else {
      setSelectedTasks([...selectedTasks, taskKey])
    }
  }

  const handleTaskPress = (task, listId) => {
    if (selectionMode) {
      const taskKey = `${listId}_${task.id}`
      if (selectedTasks.includes(taskKey)) {
        setSelectedTasks(selectedTasks.filter((key) => key !== taskKey))
      } else {
        setSelectedTasks([...selectedTasks, taskKey])
      }
    } else {
      setSelectedTaskForDetails(task)
      setTaskDetailsVisible(true)
    }
  }

  const handleToggleTaskComplete = (task, listId) => {
    setConfirmDialog({
      visible: true,
      title: "Concluir Tarefa",
      message: "Você realmente terminou esta tarefa?",
      onConfirm: () => {
        completeTask(listId, task.id)
        saveData()
        setConfirmDialog({ visible: false })
      },
      onCancel: () => setConfirmDialog({ visible: false }),
    })
  }

  const handleEditSelected = () => {
    if (selectedLists.length === 1) {
      const list = lists.find((l) => l.id === selectedLists[0])
      setEditingList(list)
      setListModalVisible(true)
    } else if (selectedTasks.length === 1) {
      const [listId, taskId] = selectedTasks[0].split("_")
      const list = lists.find((l) => l.id === listId)
      const task = list?.tasks.find((t) => t.id === taskId)
      if (task) {
        setEditingTask({ ...task, listId })
        setTaskModalVisible(true)
      }
    }
    clearSelections()
  }

  const handleDeleteSelected = () => {
    const totalSelected = selectedLists.length + selectedTasks.length
    setConfirmDialog({
      visible: true,
      title: "Confirmar Exclusão",
      message: `Deseja excluir ${totalSelected} item(ns) selecionado(s)?`,
      onConfirm: () => {
        selectedLists.forEach((listId) => deleteList(listId))
        selectedTasks.forEach((taskKey) => {
          const [listId, taskId] = taskKey.split("_")
          deleteTask(listId, taskId)
        })
        clearSelections()
        saveData()
        setConfirmDialog({ visible: false })
      },
      onCancel: () => setConfirmDialog({ visible: false }),
    })
  }

  const handleSaveList = async (listData) => {
    if (editingList) {
      updateList(editingList.id, listData)
    } else {
      addList(listData)
    }
    await saveData()
    setEditingList(null)
  }

  const handleSaveTask = async (taskData) => {
    if (editingTask) {
      updateTask(editingTask.listId, editingTask.id, taskData)
    } else {
      addTask(taskData.listId, taskData)
      await scheduleTaskNotification(taskData)
    }
    await saveData()
    setEditingTask(null)
  }

  const getTotalTasks = () => {
    return lists.reduce((total, list) => total + list.tasks.length, 0)
  }

  const renderTask = (task, listId) => (
    <TaskItem
      key={task.id}
      task={task}
      isSelected={selectedTasks.includes(`${listId}_${task.id}`)}
      selectionMode={selectionMode}
      onPress={(task) => handleTaskPress(task, listId)}
      onLongPress={() => handleTaskLongPress(task, listId)}
      onToggleComplete={(task) => handleToggleTaskComplete(task, listId)}
    />
  )

  const renderList = ({ item: list }) => (
    <ListItem
      list={list}
      isExpanded={expandedLists[list.id]}
      isSelected={selectedLists.includes(list.id)}
      selectionMode={selectionMode}
      onToggleExpansion={() => toggleListExpansion(list.id)}
      onLongPress={() => handleListLongPress(list)}
      onPress={() => handleListPress(list)}
    >
      {list.tasks.length === 0 ? (
        <Text style={[styles.emptyListText, { color: theme.textSecondary }]}>Nenhuma tarefa nesta lista</Text>
      ) : (
        list.tasks.map((task) => renderTask(task, list.id))
      )}
    </ListItem>
  )

  const styles = createStyles(theme)

  return (
    <SafeAreaView style={styles.container}>
      {getTotalTasks() === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={80} color={theme.textSecondary} />
          <Text style={styles.emptyText}>Adicione sua primeira tarefa</Text>
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          renderItem={renderList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {!selectionMode && (
        <>
          <TouchableOpacity style={styles.fab} onPress={() => setShowAddOptions(!showAddOptions)}>
            <AntDesign name={showAddOptions ? "close" : "plus"} size={24} color="white" />
          </TouchableOpacity>

          {showAddOptions && (
            <View style={styles.fabOptions}>
              <TouchableOpacity
                style={styles.fabOption}
                onPress={() => {
                  setTaskModalVisible(true)
                  setShowAddOptions(false)
                }}
              >
                <MaterialIcons name="add-task" size={20} color={theme.text} />
                <Text style={[styles.fabOptionText, { color: theme.text }]}>Criar tarefa</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fabOption}
                onPress={() => {
                  setListModalVisible(true)
                  setShowAddOptions(false)
                }}
              >
                <MaterialIcons name="playlist-add" size={20} color={theme.text} />
                <Text style={[styles.fabOptionText, { color: theme.text }]}>Criar lista</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <ListModal
        visible={listModalVisible}
        list={editingList}
        onClose={() => {
          setListModalVisible(false)
          setEditingList(null)
        }}
        onSave={handleSaveList}
      />

      <TaskModal
        visible={taskModalVisible}
        task={editingTask}
        lists={lists}
        onClose={() => {
          setTaskModalVisible(false)
          setEditingTask(null)
        }}
        onSave={handleSaveTask}
      />

      <TaskDetailsModal
        visible={taskDetailsVisible}
        task={selectedTaskForDetails}
        onClose={() => {
          setTaskDetailsVisible(false)
          setSelectedTaskForDetails(null)
        }}
      />

      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
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
    },
    listContent: {
      padding: 16,
      paddingBottom: 100,
    },
    emptyListText: {
      textAlign: "center",
      fontStyle: "italic",
      paddingVertical: 20,
    },
    fab: {
      position: "absolute",
      bottom: 30,
      right: 30,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary,
      justifyContent: "center",
      alignItems: "center",
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    fabOptions: {
      position: "absolute",
      bottom: 100,
      right: 30,
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 8,
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    fabOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      minWidth: 140,
    },
    fabOptionText: {
      marginLeft: 12,
      fontSize: 16,
    },
  })

export default HomeScreen
