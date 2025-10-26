import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import 'react-native-gesture-handler';
import useTaskStore from './src/store/useTaskStore';
import { requestNotificationPermissions } from './src/utils/notifications';
import { lightTheme, darkTheme } from './src/utils/colors';
import DrawerNavigator from './src/navigation/DrawerNavigator';
import SplashScreen from './src/components/SplashScreen';
import Toast from './src/components/Toast';

// Configuração das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const App = () => {
  const { 
    isLoading, 
    isDarkMode, 
    loadData, 
    cleanupExpiredTasks,
    toast,
    showToast,
    hideToast,
  } = useTaskStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Solicitar permissões de notificação
        const hasPermission = await requestNotificationPermissions();
        
        if (!hasPermission) {
          console.warn('⚠️ Permissões de notificação não concedidas');
          showToast('Permissões de notificação não concedidas', 'warning');
        }
        
        // Carregar dados
        const result = await loadData();
        
        if (result.success) {
          // Limpar tarefas expiradas
          const cleanupResult = await cleanupExpiredTasks();
          
          if (cleanupResult.success && cleanupResult.deletedCount > 0) {
            showToast(
              `${cleanupResult.deletedCount} tarefa(s) expirada(s) removida(s)`, 
              'info'
            );
          }
        } else {
          console.error('Erro ao carregar dados:', result.error);
          showToast('Erro ao carregar dados do aplicativo', 'error');
        }
      } catch (error) {
        console.error('Erro na inicialização:', error);
        showToast('Erro crítico ao inicializar o app', 'error');
      }
    };
    
    initializeApp();

    // Configurar limpeza automática diária
    const cleanupInterval = setInterval(async () => {
      console.log('🧹 Executando limpeza automática...');
      const result = await cleanupExpiredTasks();
      
      if (result.success && result.deletedCount > 0) {
        showToast(
          `Limpeza automática: ${result.deletedCount} tarefa(s) removida(s)`, 
          'info'
        );
      }
    }, 24 * 60 * 60 * 1000); // A cada 24 horas

    return () => clearInterval(cleanupInterval);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  // Tema do React Navigation baseado no modo escuro
  const navTheme = isDarkMode
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: darkTheme.primary,
          background: darkTheme.background,
          card: darkTheme.surface,
          text: darkTheme.text,
          border: darkTheme.border,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: lightTheme.primary,
          background: lightTheme.background,
          card: lightTheme.surface,
          text: lightTheme.text,
          border: lightTheme.border,
        },
      };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? darkTheme.background : lightTheme.background }]}>
      <NavigationContainer theme={navTheme}>
        <DrawerNavigator />
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      </NavigationContainer>
      
      {/* Toast Global */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;