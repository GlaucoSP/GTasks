import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import 'react-native-gesture-handler';
import useTaskStore from './src/store/useTaskStore';
import { requestNotificationPermissions } from './src/utils/notifications';
import DrawerNavigator from './src/navigation/DrawerNavigator';
import SplashScreen from './src/components/SplashScreen';

// Configuração das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const App = () => {
  const { isLoading, isDarkMode, loadData } = useTaskStore();

  useEffect(() => {
    const initializeApp = async () => {
      await requestNotificationPermissions();
      await loadData();
    };
    
    initializeApp();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <DrawerNavigator />
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </NavigationContainer>
  );
};

export default App;