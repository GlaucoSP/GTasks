import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../utils/colors';
import useTaskStore from '../store/useTaskStore';

const SplashScreen = () => {
  const isDarkMode = useTaskStore(state => state.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Ionicons name="list" size={80} color={theme.primary} />
      <Text style={styles.title}>GTasks</Text>
      <Text style={styles.subtitle}>Organizando suas tarefas</Text>
      <ActivityIndicator 
        size="large" 
        color={theme.primary} 
        style={styles.loader}
      />
    </View>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;