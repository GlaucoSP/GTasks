import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTaskStore from '../store/useTaskStore';
import { lightTheme, darkTheme } from '../utils/colors';

const SettingsScreen = () => {
  const { isDarkMode, setDarkMode, saveData } = useTaskStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleToggleDarkMode = async (value) => {
    setDarkMode(value);
    await saveData();
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aparência</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons 
                name={isDarkMode ? "moon" : "sunny"} 
                size={24} 
                color={theme.primary} 
                style={styles.settingIcon}
              />
              <View>
                <Text style={styles.settingTitle}>Modo Escuro</Text>
                <Text style={styles.settingDescription}>
                  Alterna entre tema claro e escuro
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons 
                name="information-circle" 
                size={24} 
                color={theme.primary} 
                style={styles.settingIcon}
              />
              <View>
                <Text style={styles.settingTitle}>GTasks</Text>
                <Text style={styles.settingDescription}>
                  Versão 1.0.0
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.textSecondary,
  },
});

export default SettingsScreen;