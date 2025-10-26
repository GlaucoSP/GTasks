export const lightTheme = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  primary: '#007AFF',
  secondary: '#5856D6',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  border: '#E5E5EA',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  selection: '#E3F2FD',
  overlay: 'rgba(0,0,0,0.5)',
};

export const darkTheme = {
  background: '#000000',
  surface: '#1C1C1E',
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  text: '#FFFFFF',
  textSecondary: '#AEAEB2',
  border: '#38383A',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  selection: '#1E3A8A',
  overlay: 'rgba(0,0,0,0.7)',
};

export const listColors = {
  text: [
    '#1C1C1E', // Preto
    '#FF3B30', // Vermelho
    '#007AFF', // Azul
    '#34C759', // Verde
    '#FF9500', // Laranja
    '#AF52DE', // Roxo
    '#FF2D55', // Rosa
    '#5856D6', // Índigo
    '#00C7BE', // Turquesa
    '#FFCC00', // Amarelo
  ],
  background: [
    '#F2F2F7', // Cinza claro
    '#FFEBEE', // Rosa claro
    '#E3F2FD', // Azul claro
    '#E8F5E9', // Verde claro
    '#FFF3E0', // Laranja claro
    '#F3E5F5', // Roxo claro
    '#FCE4EC', // Rosa claro
    '#EDE7F6', // Índigo claro
    '#E0F2F1', // Turquesa claro
    '#FFF9C4', // Amarelo claro
  ]
};

// Cores para status de tarefas
export const taskStatusColors = {
  onTime: '#34C759',
  upcoming: '#007AFF',
  dueToday: '#FF9500',
  overdue: '#FF3B30',
};

// Gradientes predefinidos
export const gradients = {
  blue: ['#667eea', '#764ba2'],
  purple: ['#f093fb', '#f5576c'],
  green: ['#4facfe', '#00f2fe'],
  sunset: ['#fa709a', '#fee140'],
  ocean: ['#2e3192', '#1bffff'],
  fire: ['#f12711', '#f5af19'],
};

export default {
  lightTheme,
  darkTheme,
  listColors,
  taskStatusColors,
  gradients,
};