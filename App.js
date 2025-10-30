import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import HomeScreen from './screens/HomeScreen';
import ReportScreen from './screens/ReportScreen';
import SettingsScreen from './screens/SettingsScreen';
import ContactScreen from './screens/ContactScreen';
import { registerUploadTask } from './services/uploadTask'; // Ajuste o caminho se necessário

import Ionicons from 'react-native-vector-icons/Ionicons'; 

const Tab = createBottomTabNavigator(); 

function AppWithTheme() {
  const { isDark } = useTheme();

  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      <Tab.Navigator 
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          // Esta função define o ícone de cada aba
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            // Lógica para escolher o nome do ícone com base na rota
            if (route.name === 'Home') {
              // Ícone preenchido quando focado, e contornado quando não focado
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Contact') {
              iconName = focused ? 'chatbox' : 'chatbox-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            } else if (route.name === 'Report') {
              iconName = focused ? 'document-text' : 'document-text-outline';
            }

            // Retorna o componente Icon
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          // Garante que a cor do texto/ícone mude com o tema
          tabBarActiveTintColor: isDark ? 'lightblue' : 'blue', // Cor quando ativo
          tabBarInactiveTintColor: 'gray', // Cor quando inativo
          // Garante que a cor de fundo da barra mude com o tema
          tabBarStyle: {
            backgroundColor: isDark ? DarkTheme.colors.card : DefaultTheme.colors.card,
          },
          headerShown: false, // Oculta o cabeçalho padrão, comum em tabs
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Principal' }}
        />
        <Tab.Screen 
          name="Contact" 
          component={ContactScreen} 
          options={{ title: 'Contato' }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Configurações' }}
        />
        <Tab.Screen 
          name="Report" 
          component={ReportScreen} 
          options={{ title: 'Laudo' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {

  useEffect(() => {
    registerUploadTask();
  }, []);
  return (
    <ThemeProvider>
      <AppWithTheme />
    </ThemeProvider>
  );
}