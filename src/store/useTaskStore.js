import { create } from "zustand"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { cancelTaskNotifications } from "../utils/notifications"
import { deleteTaskImage, cleanupOrphanedImages } from "../utils/imageUtils"

const DEFAULT_LIST_ID = "default"

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

  // Função para normalizar texto (remover acentos)
  normalizeText: (text) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  },

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

    // Aplicar busca (com normalização)
    if (state.searchQuery) {
      const normalizedQuery = state.normalizeText(state.searchQuery)
      allTasks = allTasks.filter(task => {
        const normalizedTitle = state.normalizeText(task.title)
        const normalizedDesc = task.description ? state.normalizeText(task.description) : ''
        return normalizedTitle.includes(normalizedQuery) || normalizedDesc.includes(normalizedQuery)
      })
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
  
  updateList: (listId, updatedList) => {
    // Proteger lista padrão de mudanças de ID
    if (listId === DEFAULT_LIST_ID && updatedList.id && updatedList.id !== DEFAULT_LIST_ID) {
      console.warn('Não é possível mudar o ID da lista padrão')
      return
    }
    
    set((state) => ({
      lists: state.lists.map((list) => 
        list.id === listId ? { ...list, ...updatedList } : list
      ),
    }))
  },
  
  deleteList: (listId) => {
    // Proteger lista padrão
    if (listId === DEFAULT_LIST_ID) {
      console.warn('Não é possível deletar a lista padrão')
      return
    }
    
    const state = get()
    const listToDelete = state.lists.find(l => l.id === listId)
    
    // Cancelar notificações de todas as tarefas da lista
    if (listToDelete) {
      listToDelete.tasks.forEach(task => {
        cancelTaskNotifications(task.id).catch(console.error)
      })
    }
    
    set((state) => ({
      lists: state.lists.filter((list) => list.id !== listId),
    }))
  },

  // Ações para tarefas
  addTask: (listId, task) =>
    set((state) => ({
      lists: state.lists.map((list) => 
        list.id === listId ? { ...list, tasks: [...list.tasks, task] } : list
      ),
    })),
    
  updateTask: (listId, taskId, updatedTask) => {
    // Cancelar notificações antigas antes de atualizar
    cancelTaskNotifications(taskId).catch(console.error)
    
    set((state) => {
      const currentList = state.lists.find((list) => 
        list.tasks.some((task) => task.id === taskId)
      )

      // Se mudou de lista
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

      // Mesma lista, apenas atualizar
      return {
        lists: state.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                tasks: list.tasks.map((task) => 
                  task.id === taskId ? { ...task, ...updatedTask } : task
                ),
              }
            : list,
        ),
      }
    })
  },
  
  deleteTask: async (listId, taskId) => {
    // Cancelar notificações
    await cancelTaskNotifications(taskId).catch(console.error)
    
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId 
          ? { ...list, tasks: list.tasks.filter((task) => task.id !== taskId) } 
          : list,
      ),
    }))
  },
  
  completeTask: async (listId, taskId) => {
    const state = get()
    const list = state.lists.find((l) => l.id === listId)
    const task = list?.tasks.find((t) => t.id === taskId)

    if (task) {
      // Cancelar notificações
      await cancelTaskNotifications(taskId).catch(console.error)
      
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
          list.id === listId 
            ? { ...list, tasks: list.tasks.filter((task) => task.id !== taskId) } 
            : list,
        ),
      }))
      
      // Salvar automaticamente
      await get().saveData()
    }
  },

  // Ações para tarefas concluídas
  setCompletedTasks: (tasks) => set({ completedTasks: tasks }),
  
  restoreTask: async (taskId) => {
    const state = get()
    const completedTask = state.completedTasks.find((t) => t.id === taskId)

    if (completedTask) {
      const { originalListId, originalListTitle, completedAt, daysUntilDeletion, ...taskData } = completedTask
      const targetList = state.lists.find((l) => l.id === originalListId)

      // Se a lista original não existe mais, usar a lista padrão
      const finalListId = targetList ? originalListId : DEFAULT_LIST_ID

      set((state) => ({
        completedTasks: state.completedTasks.filter((t) => t.id !== taskId),
        lists: state.lists.map((list) =>
          list.id === finalListId 
            ? { ...list, tasks: [...list.tasks, taskData] } 
            : list,
        ),
      }))
      
      await get().saveData()
    }
  },
  
  deleteCompletedTask: (taskId) =>
    set((state) => ({
      completedTasks: state.completedTasks.filter((t) => t.id !== taskId),
    })),
    
  deleteAllCompletedTasks: () => set({ completedTasks: [] }),

  // Limpar tarefas concluídas expiradas (chamado automaticamente)
  cleanupExpiredTasks: async () => {
    const state = get()
    const now = new Date()
    
    const validTasks = state.completedTasks.filter(task => {
      const completedDate = new Date(task.completedAt)
      const daysPassed = Math.floor((now - completedDate) / (1000 * 60 * 60 * 24))
      return daysPassed < 5
    })

    if (validTasks.length !== state.completedTasks.length) {
      set({ completedTasks: validTasks })
      await get().saveData()
      console.log(`🗑️ ${state.completedTasks.length - validTasks.length} tarefa(s) expirada(s) removida(s)`)
    }
  },

  // Ações de seleção
  setSelectedLists: (lists) => set({ selectedLists: lists }),
  setSelectedTasks: (tasks) => set({ selectedTasks: tasks }),
  clearSelections: () => set({ selectedLists: [], selectedTasks: [] }),

  // Configurações
  setDarkMode: (isDark) => set({ isDarkMode: isDark }),
  setLoading: (loading) => set({ isLoading: loading }),

  // Persistência com melhor tratamento de erros
  saveData: async () => {
    try {
      const state = get()
      const dataToSave = [
        ["@gtasks_lists", JSON.stringify(state.lists)],
        ["@gtasks_completed", JSON.stringify(state.completedTasks)],
        ["@gtasks_darkMode", JSON.stringify(state.isDarkMode)],
      ]
      
      await AsyncStorage.multiSet(dataToSave)
      console.log('✅ Dados salvos com sucesso')
      return { success: true }
    } catch (error) {
      console.error("❌ Erro ao salvar dados:", error)
      return { success: false, error: error.message }
    }
  },

  loadData: async () => {
    try {
      set({ isLoading: true })
      
      const keys = ["@gtasks_lists", "@gtasks_completed", "@gtasks_darkMode"]
      const values = await AsyncStorage.multiGet(keys)

      const [listsData, completedData, darkModeData] = values

      // Carregar listas (ou criar padrão)
      let lists = listsData[1] ? JSON.parse(listsData[1]) : []
      
      // Garantir que sempre exista a lista padrão
      if (!lists.find(l => l.id === DEFAULT_LIST_ID)) {
        lists = [
          {
            id: DEFAULT_LIST_ID,
            title: "Padrão",
            color: "#1C1C1E",
            bgColor: "#F2F2F7",
            tasks: [],
          },
          ...lists
        ]
      }

      // Carregar tarefas concluídas e calcular dias restantes
      const completedTasks = completedData[1] ? JSON.parse(completedData[1]) : []
      const now = new Date()
      
      const updatedCompletedTasks = completedTasks
        .map((task) => {
          const completedDate = new Date(task.completedAt)
          const daysPassed = Math.floor((now - completedDate) / (1000 * 60 * 60 * 24))
          const daysUntilDeletion = Math.max(0, 5 - daysPassed)
          return { ...task, daysUntilDeletion }
        })
        .filter((task) => task.daysUntilDeletion > 0)

      // Carregar tema
      const isDarkMode = darkModeData[1] ? JSON.parse(darkModeData[1]) : false

      set({
        lists,
        completedTasks: updatedCompletedTasks,
        isDarkMode,
        isLoading: false,
      })

      // Se houve limpeza, salvar
      if (updatedCompletedTasks.length !== completedTasks.length) {
        await AsyncStorage.setItem("@gtasks_completed", JSON.stringify(updatedCompletedTasks))
      }

      console.log('✅ Dados carregados com sucesso')
      console.log(`📋 ${lists.length} lista(s), ${updatedCompletedTasks.length} concluída(s)`)
      
      return { success: true }
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error)
      
      // Em caso de erro, usar valores padrão
      set({
        lists: [{
          id: DEFAULT_LIST_ID,
          title: "Padrão",
          color: "#1C1C1E",
          bgColor: "#F2F2F7",
          tasks: [],
        }],
        completedTasks: [],
        isDarkMode: false,
        isLoading: false,
      })
      
      return { success: false, error: error.message }
    }
  },

  // Exportar dados (para backup)
  exportData: async () => {
    try {
      const state = get()
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        lists: state.lists,
        completedTasks: state.completedTasks,
        settings: {
          isDarkMode: state.isDarkMode,
        }
      }
      
      return {
        success: true,
        data: JSON.stringify(exportData, null, 2)
      }
    } catch (error) {
      console.error("❌ Erro ao exportar dados:", error)
      return { success: false, error: error.message }
    }
  },

  // Importar dados (para restore)
  importData: async (jsonString) => {
    try {
      const importData = JSON.parse(jsonString)
      
      // Validar estrutura básica
      if (!importData.lists || !Array.isArray(importData.lists)) {
        throw new Error('Formato de dados inválido')
      }
      
      set({
        lists: importData.lists,
        completedTasks: importData.completedTasks || [],
        isDarkMode: importData.settings?.isDarkMode || false,
      })
      
      await get().saveData()
      
      console.log('✅ Dados importados com sucesso')
      return { success: true }
    } catch (error) {
      console.error("❌ Erro ao importar dados:", error)
      return { success: false, error: error.message }
    }
  },
}))

export default useTaskStore