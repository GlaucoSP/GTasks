import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../utils/colors';
import useTaskStore from '../store/useTaskStore';

const SearchFilterBar = () => {
  const { 
    isDarkMode, 
    searchQuery, 
    activeFilter, 
    sortBy,
    setSearchQuery, 
    setActiveFilter,
    setSortBy 
  } = useTaskStore();
  
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const filters = [
    { id: 'all', label: 'Todas', icon: 'list' },
    { id: 'today', label: 'Hoje', icon: 'today' },
    { id: 'week', label: 'Semana', icon: 'calendar' },
    { id: 'overdue', label: 'Atrasadas', icon: 'alert-circle' },
  ];

  const sortOptions = [
    { id: 'deadline', label: 'Prazo', icon: 'calendar-outline' },
    { id: 'title', label: 'Título', icon: 'text-outline' },
    { id: 'recent', label: 'Recentes', icon: 'time-outline' },
  ];

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const toggleSortOptions = () => {
    if (showSortOptions) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowSortOptions(false));
    } else {
      setShowSortOptions(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSort = (sortId) => {
    setSortBy(sortId);
    toggleSortOptions();
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Barra de Busca */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar tarefas..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={toggleSortOptions} style={styles.sortButton}>
          <Ionicons 
            name={sortBy === 'deadline' ? 'calendar' : sortBy === 'title' ? 'text' : 'time'} 
            size={20} 
            color={theme.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Opções de Ordenação */}
      {showSortOptions && (
        <Animated.View style={[styles.sortOptions, { opacity: fadeAnim }]}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.sortOption,
                sortBy === option.id && styles.sortOptionActive
              ]}
              onPress={() => handleSort(option.id)}
            >
              <Ionicons
                name={option.icon}
                size={18}
                color={sortBy === option.id ? '#FFFFFF' : theme.text}
              />
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === option.id && styles.sortOptionTextActive
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* Filtros */}
      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              activeFilter === filter.id && styles.filterButtonActive
            ]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <Ionicons
              name={filter.icon}
              size={16}
              color={activeFilter === filter.id ? '#FFFFFF' : theme.text}
            />
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.id && styles.filterTextActive
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Indicador de busca ativa */}
      {(searchQuery || activeFilter !== 'all') && (
        <View style={styles.activeFiltersBar}>
          <Ionicons name="funnel" size={14} color={theme.primary} />
          <Text style={styles.activeFiltersText}>
            {searchQuery && `"${searchQuery}"`}
            {searchQuery && activeFilter !== 'all' && ' • '}
            {activeFilter !== 'all' && filters.find(f => f.id === activeFilter)?.label}
          </Text>
          <TouchableOpacity 
            onPress={() => {
              setSearchQuery('');
              setActiveFilter('all');
            }}
            style={styles.clearFiltersButton}
          >
            <Text style={styles.clearFiltersText}>Limpar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: theme.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
    marginLeft: 8,
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
  },
  sortButton: {
    padding: 4,
    marginLeft: 4,
  },
  sortOptions: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  sortOptionActive: {
    backgroundColor: theme.primary,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
    marginLeft: 8,
  },
  sortOptionTextActive: {
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: theme.surface,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterButtonActive: {
    backgroundColor: theme.primary,
    elevation: 3,
    shadowOpacity: 0.2,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 4,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  activeFiltersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary + '15',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  activeFiltersText: {
    flex: 1,
    fontSize: 12,
    color: theme.primary,
    marginLeft: 6,
    fontWeight: '600',
  },
  clearFiltersButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearFiltersText: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '700',
  },
});

export default SearchFilterBar;