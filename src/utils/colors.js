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

// Cores para texto - funcionam bem em ambos os temas
export const listTextColors = {
  light: [
    '#1C1C1E', // Preto
    '#DC3545', // Vermelho
    '#007AFF', // Azul
    '#28A745', // Verde
    '#FD7E14', // Laranja
    '#6F42C1', // Roxo
    '#E83E8C', // Rosa
    '#5856D6', // Índigo
    '#17A2B8', // Turquesa
    '#FFC107', // Amarelo
  ],
  dark: [
    '#FFFFFF', // Branco
    '#FF6B6B', // Vermelho suave
    '#4DABF7', // Azul suave
    '#51CF66', // Verde suave
    '#FFA94D', // Laranja suave
    '#9775FA', // Roxo suave
    '#FF8AC7', // Rosa suave
    '#748FFC', // Índigo suave
    '#3BC9DB', // Turquesa suave
    '#FFD43B', // Amarelo suave
  ]
};

// Cores de fundo - paletas diferentes para cada tema
export const listBackgroundColors = {
  light: [
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
  ],
  dark: [
    '#2C2C2E', // Cinza escuro
    '#3D1F1F', // Vermelho escuro
    '#1A2F3D', // Azul escuro
    '#1F3D24', // Verde escuro
    '#3D2A1A', // Laranja escuro
    '#2E1F3D', // Roxo escuro
    '#3D1F2E', // Rosa escuro
    '#252938', // Índigo escuro
    '#1A3D3A', // Turquesa escuro
    '#3D3A1A', // Amarelo escuro
  ]
};

// Função para obter as cores corretas baseado no tema
export const getListColors = (isDarkMode) => {
  return {
    text: isDarkMode ? listTextColors.dark : listTextColors.light,
    background: isDarkMode ? listBackgroundColors.dark : listBackgroundColors.light,
  };
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
  listTextColors,
  listBackgroundColors,
  getListColors,
  taskStatusColors,
  gradients,
};