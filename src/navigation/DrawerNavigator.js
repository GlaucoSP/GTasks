import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import useTaskStore from '../store/useTaskStore';
import { lightTheme, darkTheme } from '../utils/colors';
import HomeScreen from '../screens/HomeScreen';
import CompletedTasksScreen from '../screens/CompletedTasksScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props) => {
  const { isDarkMode, completedTasks } = useTaskStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const styles = createStyles(theme);

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <Ionicons name="list" size={40} color={theme.primary} />
        <Text style={styles.drawerTitle}>GTasks</Text>
      </View>
      
      <DrawerItem
        label="Início"
        icon={({ color, size }) => (
          <Ionicons name="home-outline" size={size} color={color} />
        )}
        onPress={() => props.navigation.navigate('Home')}
        labelStyle={[styles.drawerLabel, { color: theme.text }]}
        activeTintColor={theme.primary}
        inactiveTintColor={theme.textSecondary}
      />
      
      <DrawerItem
        label={`Tarefas Concluídas (${completedTasks.length})`}
        icon={({ color, size }) => (
          <Ionicons name="checkmark-circle-outline" size={size} color={color} />
        )}
        onPress={() => props.navigation.navigate('CompletedTasks')}
        labelStyle={[styles.drawerLabel, { color: theme.text }]}
        activeTintColor={theme.primary}
        inactiveTintColor={theme.textSecondary}
      />
      
      <DrawerItem
        label="Configurações"
        icon={({ color, size }) => (
          <Ionicons name="settings-outline" size={size} color={color} />
        )}
        onPress={() => props.navigation.navigate('Settings')}
        labelStyle={[styles.drawerLabel, { color: theme.text }]}
        activeTintColor={theme.primary}
        inactiveTintColor={theme.textSecondary}
      />
    </DrawerContentScrollView>
  );
};

const DrawerNavigator = () => {
  const isDarkMode = useTaskStore(state => state.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      }
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerStyle: {
          backgroundColor: theme.background,
        },
        drawerActiveTintColor: theme.primary,
        drawerInactiveTintColor: theme.textSecondary,
      }}
    >
      <Drawer.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'GTasks',
          drawerLabel: 'Início',
        }}
      />
      <Drawer.Screen 
        name="CompletedTasks" 
        component={CompletedTasksScreen}
        options={{
          title: 'Tarefas Concluídas',
          drawerLabel: 'Tarefas Concluídas',
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Configurações',
          drawerLabel: 'Configurações',
        }}
      />
    </Drawer.Navigator>
  );
};

const createStyles = (theme) => StyleSheet.create({
  drawerContainer: {
    backgroundColor: theme.background,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginBottom: 10,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginLeft: 12,
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DrawerNavigator;