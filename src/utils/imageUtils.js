import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IMAGE_CACHE_DIR = `${FileSystem.documentDirectory}task_images/`;
const IMAGE_REGISTRY_KEY = '@gtasks_images';

/**
 * Inicializa o diretório de imagens
 */
const initImageDirectory = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
      console.log('📁 Diretório de imagens criado');
    }
    return true;
  } catch (error) {
    console.error('Erro ao criar diretório de imagens:', error);
    return false;
  }
};

/**
 * Copia uma imagem para o diretório do app e retorna o novo URI
 */
export const saveTaskImage = async (imageUri) => {
  try {
    if (!imageUri) return null;
    
    // Se já é uma imagem do nosso diretório, retornar como está
    if (imageUri.startsWith(IMAGE_CACHE_DIR)) {
      return imageUri;
    }

    await initImageDirectory();

    // Gerar nome único para a imagem
    const fileName = `task_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const newUri = `${IMAGE_CACHE_DIR}${fileName}`;

    // Copiar imagem para nosso diretório
    await FileSystem.copyAsync({
      from: imageUri,
      to: newUri,
    });

    // Registrar imagem
    await registerImage(newUri);

    console.log('✅ Imagem salva:', fileName);
    return newUri;
  } catch (error) {
    console.error('Erro ao salvar imagem:', error);
    return imageUri; // Retorna URI original em caso de erro
  }
};

/**
 * Registra uma imagem no registro de imagens ativas
 */
const registerImage = async (imageUri) => {
  try {
    const registryJson = await AsyncStorage.getItem(IMAGE_REGISTRY_KEY);
    const registry = registryJson ? JSON.parse(registryJson) : [];
    
    if (!registry.includes(imageUri)) {
      registry.push(imageUri);
      await AsyncStorage.setItem(IMAGE_REGISTRY_KEY, JSON.stringify(registry));
    }
  } catch (error) {
    console.error('Erro ao registrar imagem:', error);
  }
};

/**
 * Remove uma imagem específica
 */
export const deleteTaskImage = async (imageUri) => {
  try {
    if (!imageUri || !imageUri.startsWith(IMAGE_CACHE_DIR)) {
      return; // Não deletar imagens fora do nosso diretório
    }

    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(imageUri);
      console.log('🗑️ Imagem deletada:', imageUri);
    }

    // Remover do registro
    await unregisterImage(imageUri);
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
  }
};

/**
 * Remove uma imagem do registro
 */
const unregisterImage = async (imageUri) => {
  try {
    const registryJson = await AsyncStorage.getItem(IMAGE_REGISTRY_KEY);
    const registry = registryJson ? JSON.parse(registryJson) : [];
    
    const updatedRegistry = registry.filter(uri => uri !== imageUri);
    await AsyncStorage.setItem(IMAGE_REGISTRY_KEY, JSON.stringify(updatedRegistry));
  } catch (error) {
    console.error('Erro ao remover imagem do registro:', error);
  }
};

/**
 * Coleta todas as imagens usadas nas tarefas
 */
const getActiveImages = (lists, completedTasks) => {
  const activeImages = new Set();
  
  // Imagens das listas ativas
  lists.forEach(list => {
    list.tasks.forEach(task => {
      if (task.image) {
        activeImages.add(task.image);
      }
    });
  });
  
  // Imagens das tarefas concluídas
  completedTasks.forEach(task => {
    if (task.image) {
      activeImages.add(task.image);
    }
  });
  
  return Array.from(activeImages);
};

/**
 * Remove imagens órfãs (não usadas)
 */
export const cleanupOrphanedImages = async (lists, completedTasks) => {
  try {
    await initImageDirectory();
    
    // Pegar todas as imagens no diretório
    const dirContent = await FileSystem.readDirectoryAsync(IMAGE_CACHE_DIR);
    
    // Pegar imagens ativas
    const activeImages = getActiveImages(lists, completedTasks);
    const activeFileNames = activeImages.map(uri => uri.split('/').pop());
    
    // Encontrar órfãs
    const orphanedFiles = dirContent.filter(fileName => !activeFileNames.includes(fileName));
    
    if (orphanedFiles.length === 0) {
      console.log('✅ Nenhuma imagem órfã encontrada');
      return { success: true, deletedCount: 0 };
    }
    
    // Deletar órfãs
    let deletedCount = 0;
    for (const fileName of orphanedFiles) {
      try {
        const fileUri = `${IMAGE_CACHE_DIR}${fileName}`;
        await FileSystem.deleteAsync(fileUri);
        await unregisterImage(fileUri);
        deletedCount++;
      } catch (error) {
        console.error(`Erro ao deletar ${fileName}:`, error);
      }
    }
    
    console.log(`🗑️ ${deletedCount} imagem(ns) órfã(s) removida(s)`);
    return { success: true, deletedCount };
  } catch (error) {
    console.error('Erro ao limpar imagens órfãs:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtém o tamanho total ocupado pelas imagens
 */
export const getImagesCacheSize = async () => {
  try {
    await initImageDirectory();
    const dirContent = await FileSystem.readDirectoryAsync(IMAGE_CACHE_DIR);
    
    let totalSize = 0;
    for (const fileName of dirContent) {
      const fileUri = `${IMAGE_CACHE_DIR}${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists && fileInfo.size) {
        totalSize += fileInfo.size;
      }
    }
    
    // Converter para MB
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    return {
      success: true,
      totalSize,
      sizeMB,
      fileCount: dirContent.length,
    };
  } catch (error) {
    console.error('Erro ao calcular tamanho do cache:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Limpa todas as imagens (usar com cuidado!)
 */
export const clearAllImages = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(IMAGE_CACHE_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
      await AsyncStorage.removeItem(IMAGE_REGISTRY_KEY);
      console.log('🗑️ Todas as imagens foram removidas');
      return { success: true };
    }
    return { success: true };
  } catch (error) {
    console.error('Erro ao limpar todas as imagens:', error);
    return { success: false, error: error.message };
  }
};

export default {
  saveTaskImage,
  deleteTaskImage,
  cleanupOrphanedImages,
  getImagesCacheSize,
  clearAllImages,
};