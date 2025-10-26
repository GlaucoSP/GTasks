import { create } from "zustand"
import AsyncStorage from "@react-native-async-storage/async-storage"

const useTaskStore = create((set, get) => ({
  // Estado
  lists: [],
  completedTasks: [],
  selectedLists: [],
  selectedTasks: [],
  isDarkMode: false,
  isLoading: true,
  searchQuery: '',
  activeFilter: 'all',
  sortBy: 'deadline',

  // Ações de busca e filtro
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setSortBy: (sort) => set({ sortBy: sort }),

  // Função para obter tarefas filtradas
  getFilteredTasks: () => {
    const state = get()
    let allTasks = []
    
    // Coletar todas as tarefas de todas as listas
    state.lists.forEach(list => {
      list.tasks.forEach(task => {
        allTasks.push({
          ...task,
          listId: list.id,
          listTitle: list.title,
          listColor: list.color,
          listBgColor: list.bgColor
        })
      })
    })

    // Aplicar busca
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase()
      allTasks = allTasks.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      )
    }

    // Aplicar filtros
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    switch (state.activeFilter) {
      case 'today':
        allTasks = allTasks.filter(task => {
          const deadline = new Date(task.deadline)
          deadline.setHours(0, 0, 0, 0)
          return deadline.getTime() === now.getTime()
        })
        break
      case 'week':
        const weekFromNow = new Date(now)
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        allTasks = allTasks.filter(task => {
          const deadline = new Date(task.deadline)
          deadline.setHours(0, 0, 0, 0)
          return deadline >= now && deadline <= weekFromNow
        })
        break
      case 'overdue':
        allTasks = allTasks.filter(task => {
          const deadline = new Date(task.deadline)
          deadline.setHours(0, 0, 0, 0)
          return deadline < now
        })
        break
      case 'all':
      default:
        // Mostrar todas
        break
    }

    // Aplicar ordenação
    switch (state.sortBy) {
      case 'deadline':
        allTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        break
      case 'title':
        allTasks.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'recent':
        allTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
    }

    return allTasks
  },

  // Ações para listas
  setLists: (lists) => set({ lists }),
  addList: (list) => set((state) => ({ lists: [...state.lists, list] })),
  updateList: (listId, updatedList) =>
    set((state) => ({
      lists: state.lists.map((list) => (list.id === listId ? { ...list, ...updatedList } : list)),
    })),
  deleteList: (listId) =>
    set((state) => ({
      lists: state.lists.filter((list) => list.id !== listId),
    })),

  // Ações para tarefas
  addTask: (listId, task) =>
    set((state) => ({
      lists: state.lists.map((list) => (list.id === listId ? { ...list, tasks: [...list.tasks, task] } : list)),
    })),
  updateTask: (listId, taskId, updatedTask) =>
    set((state) => {
      const currentList = state.lists.find((list) => list.tasks.some((task) => task.id === taskId))

      if (currentList && currentList.id !== updatedTask.listId) {
        return {
          lists: state.lists.map((list) => {
            if (list.id === currentList.id) {
              return {
                ...list,
                tasks: list.tasks.filter((task) => task.id !== taskId),
              }
            }
            if (list.id === updatedTask.listId) {
              return {
                ...list,
                tasks: [...list.tasks, updatedTask],
              }
            }
            return list
          }),
        }
      }

      return {
        lists: state.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                tasks: list.tasks.map((task) => (task.id === taskId ? { ...task, ...updatedTask } : task)),
              }
            : list,
        ),
      }
    }),
  deleteTask: (listId, taskId) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId ? { ...list, tasks: list.tasks.filter((task) => task.id !== taskId) } : list,
      ),
    })),
  completeTask: (listId, taskId) => {
    const state = get()
    const list = state.lists.find((l) => l.id === listId)
    const task = list?.tasks.find((t) => t.id === taskId)

    if (task) {
      const completedTask = {
        ...task,
        completedAt: new Date().toISOString(),
        originalListId: listId,
        originalListTitle: list.title,
        daysUntilDeletion: 5,
      }

      set((state) => ({
        completedTasks: [...state.completedTasks, completedTask],
        lists: state.lists.map((list) =>
          list.id === listId ? { ...list, tasks: list.tasks.filter((task) => task.id !== taskId) } : list,
        ),
      }))
    }
  },

  // Ações para tarefas concluídas
  setCompletedTasks: (tasks) => set({ completedTasks: tasks }),
  restoreTask: (taskId) => {
    const state = get()
    const completedTask = state.completedTasks.find((t) => t.id === taskId)

    if (completedTask) {
      const { originalListId, originalListTitle, completedAt, daysUntilDeletion, ...taskData } = completedTask
      const targetList = state.lists.find((l) => l.id === originalListId)

      if (targetList) {
        set((state) => ({
          completedTasks: state.completedTasks.filter((t) => t.id !== taskId),
          lists: state.lists.map((list) =>
            list.id === originalListId ? { ...list, tasks: [...list.tasks, taskData] } : list,
          ),
        }))
      }
    }
  },
  deleteCompletedTask: (taskId) =>
    set((state) => ({
      completedTasks: state.completedTasks.filter((t) => t.id !== taskId),
    })),
  deleteAllCompletedTasks: () => set({ completedTasks: [] }),

  // Ações de seleção
  setSelectedLists: (lists) => set({ selectedLists: lists }),
  setSelectedTasks: (tasks) => set({ selectedTasks: tasks }),
  clearSelections: () => set({ selectedLists: [], selectedTasks: [] }),

  // Configurações
  setDarkMode: (isDark) => set({ isDarkMode: isDark }),
  setLoading: (loading) => set({ isLoading: loading }),

  // Persistência
  saveData: async () => {
    try {
      const state = get()
      await AsyncStorage.multiSet([
        ["taskLists", JSON.stringify(state.lists)],
        ["completedTasks", JSON.stringify(state.completedTasks)],
        ["isDarkMode", JSON.stringify(state.isDarkMode)],
      ])
    } catch (error) {
      console.error("Erro ao salvar dados:", error)
    }
  },

  loadData: async () => {
    try {
      set({ isLoading: true })
      const keys = ["taskLists", "completedTasks", "isDarkMode"]
      const values = await AsyncStorage.multiGet(keys)

      const [listsData, completedData, darkModeData] = values

      const lists = listsData[1]
        ? JSON.parse(listsData[1])
        : [
            {
              id: "default",
              title: "Padrão",
              color: "#000000",
              bgColor: "#f0f0f0",
              tasks: [],
            },
          ]

      const completedTasks = completedData[1] ? JSON.parse(completedData[1]) : []
      const isDarkMode = darkModeData[1] ? JSON.parse(darkModeData[1]) : false

      const updatedCompletedTasks = completedTasks
        .map((task) => {
          const completedDate = new Date(task.completedAt)
          const now = new Date()
          const daysPassed = Math.floor((now - completedDate) / (1000 * 60 * 60 * 24))
          const daysUntilDeletion = Math.max(0, 5 - daysPassed)

          return { ...task, daysUntilDeletion }
        })
        .filter((task) => task.daysUntilDeletion > 0)

      set({
        lists,
        completedTasks: updatedCompletedTasks,
        isDarkMode,
        isLoading: false,
      })

      if (updatedCompletedTasks.length !== completedTasks.length) {
        await AsyncStorage.setItem("completedTasks", JSON.stringify(updatedCompletedTasks))
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      set({ isLoading: false })
    }
  },
}))

export default useTaskStore