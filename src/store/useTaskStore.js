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
  toast: { visible: false, message: '', type: 'success' },

  // Ações de Toast
  showToast: (message, type = 'success') => {
    set({ toast: { visible: true, message, type } })
  },
  
  hideToast: () => {
    set((state) => ({ toast: { ...state.toast, visible: false } }))
  },

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
  
  addList: (list) => {
    try {
      if (!list || !list.id || !list.title) {
        console.error('❌ Dados da lista inválidos')
        get().showToast('Erro: dados da lista inválidos', 'error')
        return { success: false, error: 'INVALID_DATA' }
      }

      const state = get()
      const existingList = state.lists.find(l => l.id === list.id)
      
      if (existingList) {
        console.error('❌ Lista com este ID já existe')
        get().showToast('Erro: lista já existe', 'error')
        return { success: false, error: 'DUPLICATE_ID' }
      }

      set((state) => ({ lists: [...state.lists, list] }))
      console.log('✅ Lista adicionada:', list.title)
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao adicionar lista:', error)
      get().showToast('Erro ao criar lista', 'error')
      return { success: false, error: error.message }
    }
  },
  
  updateList: (listId, updatedList) => {
    try {
      if (!listId || !updatedList) {
        console.error('❌ Dados inválidos para atualização')
        get().showToast('Erro: dados inválidos', 'error')
        return { success: false, error: 'INVALID_DATA' }
      }

      // Proteger lista padrão de mudanças de ID
      if (listId === DEFAULT_LIST_ID && updatedList.id && updatedList.id !== DEFAULT_LIST_ID) {
        console.warn('⚠️ Não é possível mudar o ID da lista padrão')
        get().showToast('Não é possível modificar a lista padrão', 'warning')
        return { success: false, error: 'PROTECTED_LIST' }
      }

      const state = get()
      const listExists = state.lists.some(l => l.id === listId)
      
      if (!listExists) {
        console.error('❌ Lista não encontrada:', listId)
        get().showToast('Erro: lista não encontrada', 'error')
        return { success: false, error: 'LIST_NOT_FOUND' }
      }
      
      set((state) => ({
        lists: state.lists.map((list) => 
          list.id === listId ? { ...list, ...updatedList } : list
        ),
      }))
      
      console.log('✅ Lista atualizada:', listId)
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao atualizar lista:', error)
      get().showToast('Erro ao atualizar lista', 'error')
      return { success: false, error: error.message }
    }
  },
  
  deleteList: async (listId) => {
    try {
      // Proteger lista padrão
      if (listId === DEFAULT_LIST_ID) {
        console.warn('⚠️ Não é possível deletar a lista padrão')
        get().showToast('Não é possível excluir a lista padrão', 'warning')
        return { success: false, error: 'PROTECTED_LIST' }
      }

      const state = get()
      const listToDelete = state.lists.find(l => l.id === listId)
      
      if (!listToDelete) {
        console.error('❌ Lista não encontrada:', listId)
        get().showToast('Erro: lista não encontrada', 'error')
        return { success: false, error: 'LIST_NOT_FOUND' }
      }
      
      // Cancelar notificações de todas as tarefas da lista
      if (listToDelete.tasks && listToDelete.tasks.length > 0) {
        for (const task of listToDelete.tasks) {
          await cancelTaskNotifications(task.id).catch(console.error)
          
          // Deletar imagem se existir
          if (task.image) {
            await deleteTaskImage(task.image).catch(console.error)
          }
        }
      }
      
      set((state) => ({
        lists: state.lists.filter((list) => list.id !== listId),
      }))
      
      console.log('✅ Lista deletada:', listId)
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao deletar lista:', error)
      get().showToast('Erro ao excluir lista', 'error')
      return { success: false, error: error.message }
    }
  },

  // Ações para tarefas
  addTask: (listId, task) => {
    try {
      if (!listId || !task || !task.id || !task.title) {
        console.error('❌ Dados da tarefa inválidos')
        get().showToast('Erro: dados da tarefa inválidos', 'error')
        return { success: false, error: 'INVALID_DATA' }
      }

      const state = get()
      const list = state.lists.find(l => l.id === listId)
      
      if (!list) {
        console.error('❌ Lista não encontrada:', listId)
        get().showToast('Erro: lista não encontrada', 'error')
        return { success: false, error: 'LIST_NOT_FOUND' }
      }

      const taskExists = list.tasks.some(t => t.id === task.id)
      if (taskExists) {
        console.error('❌ Tarefa com este ID já existe')
        get().showToast('Erro: tarefa já existe', 'error')
        return { success: false, error: 'DUPLICATE_ID' }
      }

      set((state) => ({
        lists: state.lists.map((list) => 
          list.id === listId ? { ...list, tasks: [...list.tasks, task] } : list
        ),
      }))
      
      console.log('✅ Tarefa adicionada:', task.title)
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao adicionar tarefa:', error)
      get().showToast('Erro ao criar tarefa', 'error')
      return { success: false, error: error.message }
    }
  },
    
  updateTask: async (listId, taskId, updatedTask) => {
    try {
      if (!listId || !taskId || !updatedTask) {
        console.error('❌ Dados inválidos para atualização')
        get().showToast('Erro: dados inválidos', 'error')
        return { success: false, error: 'INVALID_DATA' }
      }

      // Cancelar notificações antigas antes de atualizar
      await cancelTaskNotifications(taskId).catch(console.error)
      
      const state = get()
      const currentList = state.lists.find((list) => 
        list.tasks.some((task) => task.id === taskId)
      )

      if (!currentList) {
        console.error('❌ Tarefa não encontrada:', taskId)
        get().showToast('Erro: tarefa não encontrada', 'error')
        return { success: false, error: 'TASK_NOT_FOUND' }
      }

      // Se mudou de lista
      if (currentList.id !== updatedTask.listId) {
        const targetList = state.lists.find(l => l.id === updatedTask.listId)
        
        if (!targetList) {
          console.error('❌ Lista de destino não encontrada:', updatedTask.listId)
          get().showToast('Erro: lista de destino não encontrada', 'error')
          return { success: false, error: 'TARGET_LIST_NOT_FOUND' }
        }

        set({
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
        })
      } else {
        // Mesma lista, apenas atualizar
        set({
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
        })
      }
      
      console.log('✅ Tarefa atualizada:', taskId)
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao atualizar tarefa:', error)
      get().showToast('Erro ao atualizar tarefa', 'error')
      return { success: false, error: error.message }
    }
  },
  
  deleteTask: async (listId, taskId) => {
    try {
      if (!listId || !taskId) {
        console.error('❌ Dados inválidos para exclusão')
        get().showToast('Erro: dados inválidos', 'error')
        return { success: false, error: 'INVALID_DATA' }
      }

      const state = get()
      const list = state.lists.find(l => l.id === listId)
      
      if (!list) {
        console.error('❌ Lista não encontrada:', listId)
        get().showToast('Erro: lista não encontrada', 'error')
        return { success: false, error: 'LIST_NOT_FOUND' }
      }

      const task = list.tasks.find(t => t.id === taskId)
      
      if (!task) {
        console.error('❌ Tarefa não encontrada:', taskId)
        get().showToast('Erro: tarefa não encontrada', 'error')
        return { success: false, error: 'TASK_NOT_FOUND' }
      }

      // Cancelar notificações
      await cancelTaskNotifications(taskId).catch(console.error)
      
      // Deletar imagem se existir
      if (task.image) {
        await deleteTaskImage(task.image).catch(console.error)
      }
      
      set((state) => ({
        lists: state.lists.map((list) =>
          list.id === listId 
            ? { ...list, tasks: list.tasks.filter((task) => task.id !== taskId) } 
            : list,
        ),
      }))
      
      console.log('✅ Tarefa deletada:', taskId)
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao deletar tarefa:', error)
      get().showToast('Erro ao excluir tarefa', 'error')
      return { success: false, error: error.message }
    }
  },
  
  completeTask: async (listId, taskId) => {
    try {
      if (!listId || !taskId) {
        console.error('❌ Dados inválidos')
        get().showToast('Erro: dados inválidos', 'error')
        return { success: false, error: 'INVALID_DATA' }
      }

      const state = get()
      const list = state.lists.find((l) => l.id === listId)
      
      if (!list) {
        console.error('❌ Lista não encontrada:', listId)
        get().showToast('Erro: lista não encontrada', 'error')
        return { success: false, error: 'LIST_NOT_FOUND' }
      }

      const task = list.tasks.find((t) => t.id === taskId)

      if (!task) {
        console.error('❌ Tarefa não encontrada:', taskId)
        get().showToast('Erro: tarefa não encontrada', 'error')
        return { success: false, error: 'TASK_NOT_FOUND' }
      }

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
      
      console.log('✅ Tarefa concluída:', task.title)
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao concluir tarefa:', error)
      get().showToast('Erro ao concluir tarefa', 'error')
      return { success: false, error: error.message }
    }
  },

  // Ações para tarefas concluídas
  setCompletedTasks: (tasks) => set({ completedTasks: tasks }),
  
  restoreTask: async (taskId) => {
    try {
      if (!taskId) {
        console.error('❌ ID da tarefa inválido')
        get().showToast('Erro: ID inválido', 'error')
        return { success: false, error: 'INVALID_ID' }
      }

      const state = get()
      const completedTask = state.completedTasks.find((t) => t.id === taskId)

      if (!completedTask) {
        console.error('❌ Tarefa concluída não encontrada:', taskId)
        get().showToast('Erro: tarefa não encontrada', 'error')
        return { success: false, error: 'TASK_NOT_FOUND' }
      }

      const { originalListId, originalListTitle, completedAt, daysUntilDeletion, ...taskData } = completedTask
      const targetList = state.lists.find((l) => l.id === originalListId)

      // Se a lista original não existe mais, usar a lista padrão
      const finalListId = targetList ? originalListId : DEFAULT_LIST_ID

      if (!targetList) {
        console.warn('⚠️ Lista original não existe, restaurando para lista padrão')
        get().showToast('Lista original não existe, restaurado para lista Padrão', 'warning')
      }

      set((state) => ({
        completedTasks: state.completedTasks.filter((t) => t.id !== taskId),
        lists: state.lists.map((list) =>
          list.id === finalListId 
            ? { ...list, tasks: [...list.tasks, taskData] } 
            : list,
        ),
      }))
      
      await get().saveData()
      console.log('✅ Tarefa restaurada:', taskId)
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao restaurar tarefa:', error)
      get().showToast('Erro ao restaurar tarefa', 'error')
      return { success: false, error: error.message }
    }
  },
  
  deleteCompletedTask: async (taskId) => {
    try {
      if (!taskId) {
        console.error('❌ ID da tarefa inválido')
        get().showToast('Erro: ID inválido', 'error')
        return { success: false, error: 'INVALID_ID' }
      }

      const state = get()
      const task = state.completedTasks.find(t => t.id === taskId)
      
      if (!task) {
        console.error('❌ Tarefa concluída não encontrada:', taskId)
        get().showToast('Erro: tarefa não encontrada', 'error')
        return { success: false, error: 'TASK_NOT_FOUND' }
      }

      // Deletar imagem se existir
      if (task.image) {
        await deleteTaskImage(task.image).catch(console.error)
      }

      set((state) => ({
        completedTasks: state.completedTasks.filter((t) => t.id !== taskId),
      }))
      
      console.log('✅ Tarefa concluída deletada:', taskId)
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao deletar tarefa concluída:', error)
      get().showToast('Erro ao excluir tarefa', 'error')
      return { success: false, error: error.message }
    }
  },
    
  deleteAllCompletedTasks: async () => {
    try {
      const state = get()
      
      if (state.completedTasks.length === 0) {
        console.log('ℹ️ Nenhuma tarefa concluída para deletar')
        return { success: true }
      }

      // Deletar todas as imagens
      for (const task of state.completedTasks) {
        if (task.image) {
          await deleteTaskImage(task.image).catch(console.error)
        }
      }

      set({ completedTasks: [] })
      console.log('✅ Todas as tarefas concluídas foram deletadas')
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao deletar todas as tarefas concluídas:', error)
      get().showToast('Erro ao excluir tarefas', 'error')
      return { success: false, error: error.message }
    }
  },

  // Limpar tarefas concluídas expiradas (chamado automaticamente)
  cleanupExpiredTasks: async () => {
    try {
      const state = get()
      const now = new Date()
      
      const expiredTasks = state.completedTasks.filter(task => {
        const completedDate = new Date(task.completedAt)
        const daysPassed = Math.floor((now - completedDate) / (1000 * 60 * 60 * 24))
        return daysPassed >= 5
      })

      if (expiredTasks.length > 0) {
        // Deletar imagens das tarefas expiradas
        for (const task of expiredTasks) {
          if (task.image) {
            await deleteTaskImage(task.image).catch(console.error)
          }
        }

        const validTasks = state.completedTasks.filter(task => {
          const completedDate = new Date(task.completedAt)
          const daysPassed = Math.floor((now - completedDate) / (1000 * 60 * 60 * 24))
          return daysPassed < 5
        })

        set({ completedTasks: validTasks })
        await get().saveData()
        console.log(`🗑️ ${expiredTasks.length} tarefa(s) expirada(s) removida(s)`)
      }

      return { success: true, deletedCount: expiredTasks.length }
    } catch (error) {
      console.error('❌ Erro ao limpar tarefas expiradas:', error)
      return { success: false, error: error.message }
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
      get().showToast('Erro ao salvar dados', 'error')
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
      get().showToast('Erro ao carregar dados', 'error')
      
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
      
      console.log('✅ Dados exportados com sucesso')
      return {
        success: true,
        data: JSON.stringify(exportData, null, 2)
      }
    } catch (error) {
      console.error("❌ Erro ao exportar dados:", error)
      get().showToast('Erro ao exportar dados', 'error')
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
      get().showToast('Dados importados com sucesso', 'success')
      return { success: true }
    } catch (error) {
      console.error("❌ Erro ao importar dados:", error)
      get().showToast('Erro ao importar dados', 'error')
      return { success: false, error: error.message }
    }
  },
}))

export default useTaskStore