import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../utils/colors';
import { formatDate, isOverdue } from '../utils/dateUtils';
import useTaskStore from '../store/useTaskStore';

const TaskItem = ({ 
  task, 
  isSelected, 
  selectionMode,
  onPress, 
  onLongPress, 
  onToggleComplete 
}) => {
  const isDarkMode = useTaskStore(state => state.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const overdue = isOverdue(task.deadline);
  const styles = createStyles(theme, isSelected, overdue);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={selectionMode ? onPress : () => onPress(task)}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      {selectionMode ? (
        <View style={styles.selectionCheckbox}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => onToggleComplete(task)}
        >
          {task.completed && <Ionicons name="checkmark" size={16} color={theme.success} />}
        </TouchableOpacity>
      )}
      
      <View style={styles.content}>
        <Text style={[
          styles.title,
          task.completed && styles.completedTitle
        ]}>
          {task.title}
        </Text>
        <Text style={[styles.deadline, overdue && styles.overdueDeadline]}>
          Prazo: {formatDate(task.deadline)}
          {overdue && ' (Atrasado)'}
        </Text>
        {task.description && (
          <Text style={styles.description} numberOfLines={2}>
            {task.description}
          </Text>
        )}
      </View>

      {task.image && (
        <Image source={{ uri: task.image }} style={styles.thumbnail} />
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme, isSelected, overdue) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: isSelected ? theme.primary : 'transparent',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: isSelected ? '#FFFFFF' : theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 4,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: theme.textSecondary,
  },
  deadline: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  overdueDeadline: {
    color: theme.error,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginLeft: 12,
  },
});

export default TaskItem;