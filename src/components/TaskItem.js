import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../utils/colors';
import { formatDate, isOverdue, getDaysUntilDeadline } from '../utils/dateUtils';
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
  const daysUntil = getDaysUntilDeadline(task.deadline);
  
  // Determinar urgência
  const getUrgencyColor = () => {
    if (overdue) return theme.error;
    if (daysUntil === 0) return theme.warning;
    if (daysUntil <= 3) return '#FF9800';
    return theme.textSecondary;
  };

  const getUrgencyIcon = () => {
    if (overdue) return 'alert-circle';
    if (daysUntil === 0) return 'today';
    if (daysUntil <= 3) return 'time';
    return 'calendar-outline';
  };

  const getUrgencyText = () => {
    if (overdue) return `${Math.abs(daysUntil)} dia${Math.abs(daysUntil) !== 1 ? 's' : ''} atrasado`;
    if (daysUntil === 0) return 'Vence hoje';
    if (daysUntil === 1) return 'Vence amanhã';
    if (daysUntil <= 7) return `${daysUntil} dias`;
    return formatDate(task.deadline);
  };

  const styles = createStyles(theme, isSelected, overdue);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={selectionMode ? onPress : () => onPress(task)}
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.7}
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
        <View style={styles.header}>
          <Text style={[
            styles.title,
            task.completed && styles.completedTitle
          ]} numberOfLines={2}>
            {task.title}
          </Text>
          
          {/* Badge de urgência */}
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor() + '20' }]}>
            <Ionicons name={getUrgencyIcon()} size={12} color={getUrgencyColor()} />
            <Text style={[styles.urgencyText, { color: getUrgencyColor() }]}>
              {getUrgencyText()}
            </Text>
          </View>
        </View>

        {task.description && (
          <Text style={styles.description} numberOfLines={2}>
            {task.description}
          </Text>
        )}

        {/* Rodapé com informações extras */}
        <View style={styles.footer}>
          {task.remindAt && (
            <View style={styles.footerItem}>
              <Ionicons name="notifications" size={12} color={theme.primary} />
              <Text style={styles.footerText}>Lembrete</Text>
            </View>
          )}
          {task.image && (
            <View style={styles.footerItem}>
              <Ionicons name="image" size={12} color={theme.primary} />
              <Text style={styles.footerText}>Anexo</Text>
            </View>
          )}
        </View>
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
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: isSelected ? theme.primary + '20' : 'transparent',
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
    backgroundColor: isSelected ? theme.primary : theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginRight: 8,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: theme.textSecondary,
    opacity: 0.6,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginLeft: 12,
  },
});

export default TaskItem;