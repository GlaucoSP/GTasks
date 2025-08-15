import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../utils/colors';
import useTaskStore from '../store/useTaskStore';

const ListItem = ({ 
  list, 
  isExpanded, 
  isSelected, 
  selectionMode,
  onToggleExpansion, 
  onLongPress,
  onPress,
  children 
}) => {
  const isDarkMode = useTaskStore(state => state.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const styles = createStyles(theme, list.bgColor, list.color, isSelected);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={selectionMode ? onPress : onToggleExpansion}
        onLongPress={onLongPress}
        delayLongPress={500}
      >
        {selectionMode && (
          <View style={styles.checkbox}>
            {isSelected && <Ionicons name="checkmark" size={16} color={theme.primary} />}
          </View>
        )}
        
        <Text style={styles.title}>
          {list.title} ({list.tasks.length})
        </Text>
        
        {!selectionMode && (
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={list.color}
          />
        )}
      </TouchableOpacity>

      {isExpanded && !selectionMode && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const createStyles = (theme, bgColor, textColor, isSelected) => StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: isSelected ? theme.selection : bgColor,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: textColor,
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default ListItem;