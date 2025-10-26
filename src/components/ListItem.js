import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

  // Criar gradiente baseado na cor da lista
  const getGradientColors = () => {
    if (isSelected) {
      return [theme.primary, theme.primary + 'CC'];
    }
    // Criar uma versão mais clara/escura da cor
    const baseColor = list.bgColor;
    return [baseColor, baseColor + 'E6'];
  };

  const completedCount = list.tasks.filter(t => t.completed).length;
  const progressPercent = list.tasks.length > 0 
    ? Math.round((completedCount / list.tasks.length) * 100) 
    : 0;

  const styles = createStyles(theme, list.color, isSelected);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={selectionMode ? onPress : onToggleExpansion}
        onLongPress={onLongPress}
        delayLongPress={500}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {selectionMode && (
            <View style={styles.checkbox}>
              {isSelected && <Ionicons name="checkmark" size={16} color={theme.primary} />}
            </View>
          )}
          
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>
                {list.title}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{list.tasks.length}</Text>
              </View>
            </View>

            {/* Barra de progresso */}
            {list.tasks.length > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${progressPercent}%`,
                        backgroundColor: list.color 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {completedCount}/{list.tasks.length}
                </Text>
              </View>
            )}
          </View>
          
          {!selectionMode && (
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={list.color}
            />
          )}
        </LinearGradient>
      </TouchableOpacity>

      {isExpanded && !selectionMode && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const createStyles = (theme, textColor, isSelected) => StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: isSelected ? 6 : 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isSelected ? 0.2 : 0.1,
    shadowRadius: isSelected ? 6 : 4,
  },
  touchable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 80,
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
    backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: textColor,
    flex: 1,
  },
  badge: {
    backgroundColor: textColor + '30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: textColor,
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: textColor,
    minWidth: 40,
    textAlign: 'right',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: theme.surface,
  },
});

export default ListItem;