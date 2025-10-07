// context/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext(undefined);

// Paleta de cores centralizada
const colors = {
  light: {
    // Backgrounds
    background: '#f3f4f6',
    cardBackground: '#ffffff',
    secondaryBackground: '#e5e7eb',
    
    // Textos
    primary: '#1f2937',
    text: '#374151',
    subtext: '#6b7280',
    lightText: '#9ca3af',
    
    // Botões
    buttonBackground: '#2563eb',
    buttonText: '#ffffff',
    
    // Estados
    success: '#10b981',
    successBg: '#d1fae5',
    error: '#ef4444',
    errorBg: '#fee2e2',
    warning: '#f59e0b',
    warningBg: '#fef3c7',
    info: '#3b82f6',
    infoBg: '#dbeafe',
    
    // Bordas e divisores
    border: '#d1d5db',
    divider: '#e5e7eb',
    
    // Inputs
    inputBackground: '#ffffff',
    inputBorder: '#d1d5db',
    inputText: '#1f2937',
    placeholderText: '#9ca3af',
  },
  dark: {
    // Backgrounds
    background: '#111827',
    cardBackground: '#1f2937',
    secondaryBackground: '#374151',
    
    // Textos
    primary: '#f9fafb',
    text: '#f3f4f6',
    subtext: '#d1d5db',
    lightText: '#9ca3af',
    
    // Botões
    buttonBackground: '#2563eb',
    buttonText: '#ffffff',
    
    // Estados
    success: '#10b981',
    successBg: '#064e3b',
    error: '#ef4444',
    errorBg: '#7f1d1d',
    warning: '#fbbf24',
    warningBg: '#78350f',
    info: '#60a5fa',
    infoBg: '#1e3a8a',
    
    // Bordas e divisores
    border: '#374151',
    divider: '#4b5563',
    
    // Inputs
    inputBackground: '#1f2937',
    inputBorder: '#4b5563',
    inputText: '#f3f4f6',
    placeholderText: '#6b7280',
  }
};

// Estilos de botão por tipo
const buttonStyles = {
  primary: {
    light: { backgroundColor: '#1d4ed8', textColor: '#ffffff' },
    dark: { backgroundColor: '#2563eb', textColor: '#ffffff' }
  },
  secondary: {
    light: { backgroundColor: '#16a34a', textColor: '#ffffff' },
    dark: { backgroundColor: '#10b981', textColor: '#ffffff' }
  },
  analyze: {
    light: { backgroundColor: '#f59e0b', textColor: '#ffffff' },
    dark: { backgroundColor: '#fbbf24', textColor: '#111827' }
  },
  danger: {
    light: { backgroundColor: '#ef4444', textColor: '#ffffff' },
    dark: { backgroundColor: '#dc2626', textColor: '#ffffff' }
  }
};

export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemTheme === 'dark');
  const [themePreference, setThemePreference] = useState('system');

  // Carregar preferência salva
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Atualizar tema baseado na preferência
  useEffect(() => {
    if (themePreference === 'system') {
      setIsDark(systemTheme === 'dark');
    } else {
      setIsDark(themePreference === 'dark');
    }
  }, [themePreference, systemTheme]);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('@theme_preference');
      if (saved) {
        setThemePreference(saved);
      }
    } catch (error) {
      console.log('Erro ao carregar preferência de tema:', error);
    }
  };

  const saveThemePreference = async (preference) => {
    try {
      await AsyncStorage.setItem('@theme_preference', preference);
      setThemePreference(preference);
    } catch (error) {
      console.log('Erro ao salvar preferência de tema:', error);
    }
  };

  const toggleTheme = () => {
    const newPreference = isDark ? 'light' : 'dark';
    saveThemePreference(newPreference);
  };

  const setSystemTheme = () => {
    saveThemePreference('system');
  };

  const setLightTheme = () => {
    saveThemePreference('light');
  };

  const setDarkTheme = () => {
    saveThemePreference('dark');
  };

  // Obter cor específica
  const getColor = (colorKey) => {
    const themeColors = isDark ? colors.dark : colors.light;
    return themeColors[colorKey] || '#000000';
  };

  // Obter estilo de botão
  const getButtonStyle = (type = 'primary') => {
    const themeKey = isDark ? 'dark' : 'light';
    return buttonStyles[type]?.[themeKey] || buttonStyles.primary[themeKey];
  };

  // Objeto de tema completo
  const theme = {
    isDark,
    themePreference,
    toggleTheme,
    setSystemTheme,
    setLightTheme,
    setDarkTheme,
    
    // Cores diretas (compatibilidade com código existente)
    ...colors[isDark ? 'dark' : 'light'],
    
    // Funções utilitárias
    getColor,
    getButtonStyle,
    
    // Paleta completa
    colors: colors[isDark ? 'dark' : 'light'],
    
    // Espaçamentos padrão
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48
    },
    
    // Tamanhos de fonte
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 30,
      xxxl: 36
    },
    
    // Bordas
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 999
    },
    
    // Sombras
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1
      },
      md: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2
      },
      lg: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 3
      }
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook para obter estilos prontos
export const useThemeStyles = () => {
  const theme = useTheme();
  
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: theme.spacing.lg
    },
    card: {
      backgroundColor: theme.cardBackground,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.md
    },
    text: {
      color: theme.text,
      fontSize: theme.fontSize.md
    },
    title: {
      color: theme.primary,
      fontSize: theme.fontSize.xl,
      fontWeight: 'bold'
    },
    subtitle: {
      color: theme.subtext,
      fontSize: theme.fontSize.lg,
      fontWeight: '600'
    },
    input: {
      backgroundColor: theme.inputBackground,
      borderColor: theme.inputBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      color: theme.inputText,
      fontSize: theme.fontSize.md
    },
    button: {
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.sm
    }
  };
};